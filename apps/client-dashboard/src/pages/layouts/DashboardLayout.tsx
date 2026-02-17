import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useEffect } from "react";
import { BookingRequestOverlay } from "@/components/BookingRequestOverlay";
import type {
  BookingNewPayload,
  DispatcherApprovalResponse,
  BookingAssignedPayload,
  BookingDecisionPayload,
} from "@/lib/types";

export function DashboardLayout() {
  const socket = useSocketStore((state) => state.socket);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const addBookingRequest = useSocketStore((state) => state.addBookingRequest);
  const setBookingDecision = useSocketStore((state) => state.setBookingDecision);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (
      data: BookingNewPayload,
      callback: (res: DispatcherApprovalResponse) => void
    ) => {
      addBookingRequest({
        requestId: data.requestId,
        data,
        callback,
        timestamp: new Date(),
      });
    };

    const handleBookingAssigned = (_data: BookingAssignedPayload) => {
      // TODO: Add proper implementation to handle booking assignments
    };

    const handleBookingDecision = (data: BookingDecisionPayload) => {
      setBookingDecision(data);
    };

    socket.on("booking:new", handleNewBooking);
    socket.on("booking:assigned", handleBookingAssigned);
    socket.on("booking:decision", handleBookingDecision);

    return () => {
      socket.off("booking:new", handleNewBooking);
      socket.off("booking:assigned", handleBookingAssigned);
      socket.off("booking:decision", handleBookingDecision);
    };
  }, [socket, addBookingRequest, setBookingDecision]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto w-full">
          <SidebarTrigger className={"m-2"} size={"icon"} />
          <div className="w-full h-screen">
            <Outlet />
          </div>
        </main>

        {/* Booking Request Overlay */}
        <BookingRequestOverlay />
      </div>
    </SidebarProvider>
  );
}

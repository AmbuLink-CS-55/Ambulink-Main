import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useEffect } from "react";
import { BookingRequestOverlay } from "@/components/BookingRequestOverlay";
import type { 
  BookingNewPayload, 
  DispatcherApprovalResponse,
  BookingAssignedPayload 
} from "@/lib/types";

export function DashboardLayout() {
  const socket = useSocketStore((state) => state.socket);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const addBookingRequest = useSocketStore((state) => state.addBookingRequest);

  useEffect(() => {
    connect();

    return () => {
      console.log("disconnecting");
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (!socket) return;
    console.log("socket connected");

    const handleNewBooking = (
      data: BookingNewPayload, 
      callback: (res: DispatcherApprovalResponse) => void
    ) => {
      const { requestId } = data;
      console.log("Received booking request:", requestId);

      addBookingRequest({
        requestId,
        data,
        callback,
        timestamp: new Date(),
      });
    };

    const handleBookingAssigned = (data: BookingAssignedPayload) => {
      console.log("Booking assigned:", data);
      // TODO: Add proper implementation to handle booking assignments
    };

    socket.on("booking:new", handleNewBooking);
    socket.on("booking:assigned", handleBookingAssigned);

    return () => {
      socket.off("booking:new", handleNewBooking);
    };
  }, [socket]);

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

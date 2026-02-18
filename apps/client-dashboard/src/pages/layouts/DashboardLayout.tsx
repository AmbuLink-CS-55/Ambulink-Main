import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useDriverStore } from "@/hooks/use-driver-store";
import { useEffect } from "react";
import { BookingRequestOverlay } from "@/components/BookingRequestOverlay";
import type {
  BookingNewPayload,
  DispatcherApprovalResponse,
  BookingDecisionPayload,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DriverLocationUpdate,
} from "@/lib/types";

export function DashboardLayout() {
  const socket = useSocketStore((state) => state.socket);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  const addBookingRequest = useSocketStore((state) => state.addBookingRequest);
  const setBookingDecision = useSocketStore((state) => state.setBookingDecision);
  const clearBookingRequests = useSocketStore((state) => state.clearBookingRequests);
  const syncOngoingBookings = useSocketStore((state) => state.syncOngoingBookings);
  const upsertOngoingBooking = useSocketStore((state) => state.upsertOngoingBooking);
  const updateOngoingBooking = useSocketStore((state) => state.updateOngoingBooking);
  const updateDriverLocation = useSocketStore((state) => state.updateDriverLocation);
  const setDriverLocation = useDriverStore((state) => state.setDriverLocation);
  const removeBookingRequest = useSocketStore((state) => state.removeBookingRequest);
  const clearBookingDecision = useSocketStore((state) => state.clearBookingDecision);

  // handle websocket connection
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // clear booking requests
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      clearBookingRequests();
    };

    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, clearBookingRequests]);

  // setup events
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "booking:new",
      (data: BookingNewPayload, callback: (res: DispatcherApprovalResponse) => void) => {
        addBookingRequest({
          requestId: data.requestId,
          data,
          callback,
          timestamp: new Date(),
        });
      }
    );

    socket.on("booking:assigned", (data: DispatcherBookingPayload) => {
      upsertOngoingBooking(data);
      removeBookingRequest(data.bookingId);
      clearBookingDecision(data.bookingId);
    });

    socket.on("booking:sync", (data: { bookings: DispatcherBookingPayload[] }) => {
      syncOngoingBookings(data.bookings);
    });

    socket.on("booking:update", (data: DispatcherBookingUpdatePayload) => {
      updateOngoingBooking(data);
    });

    socket.on("booking:decision", (data: BookingDecisionPayload) => {
      setBookingDecision(data);
    });

    socket.on("driver:update", (data: DriverLocationUpdate) => {
      updateDriverLocation(data);
      setDriverLocation(data.id, { x: data.x, y: data.y });
    });

    return () => {
      socket.off("booking:new");
      socket.off("booking:assigned");
      socket.off("booking:sync");
      socket.off("booking:update");
      socket.off("booking:decision");
      socket.off("driver:update");
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

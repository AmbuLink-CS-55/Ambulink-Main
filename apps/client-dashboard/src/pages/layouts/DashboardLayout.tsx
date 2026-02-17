import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useSocketStore } from "@/hooks/use-socket-store";
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
  const removeBookingRequest = useSocketStore((state) => state.removeBookingRequest);
  const clearBookingDecision = useSocketStore((state) => state.clearBookingDecision);

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

    const handleBookingAssigned = (data: DispatcherBookingPayload) => {
      upsertOngoingBooking(data);
      removeBookingRequest(data.bookingId);
      clearBookingDecision(data.bookingId);
    };

    const handleBookingSync = (data: { bookings: DispatcherBookingPayload[] }) => {
      syncOngoingBookings(data.bookings);
    };

    const handleBookingUpdate = (data: DispatcherBookingUpdatePayload) => {
      updateOngoingBooking(data);
    };

    const handleBookingDecision = (data: BookingDecisionPayload) => {
      setBookingDecision(data);
    };

    const handleDriverUpdate = (data: DriverLocationUpdate) => {
      updateDriverLocation(data);
    };

    socket.on("booking:new", handleNewBooking);
    socket.on("booking:assigned", handleBookingAssigned);
    socket.on("booking:sync", handleBookingSync);
    socket.on("booking:update", handleBookingUpdate);
    socket.on("booking:decision", handleBookingDecision);
    socket.on("driver:update", handleDriverUpdate);

    return () => {
      socket.off("booking:new", handleNewBooking);
      socket.off("booking:assigned", handleBookingAssigned);
      socket.off("booking:sync", handleBookingSync);
      socket.off("booking:update", handleBookingUpdate);
      socket.off("booking:decision", handleBookingDecision);
      socket.off("driver:update", handleDriverUpdate);
    };
  }, [
    socket,
    addBookingRequest,
    setBookingDecision,
    syncOngoingBookings,
    upsertOngoingBooking,
    updateOngoingBooking,
    updateDriverLocation,
    removeBookingRequest,
    clearBookingDecision,
  ]);

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

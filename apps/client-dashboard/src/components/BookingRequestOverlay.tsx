import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LocationMiniMap } from "@/components/booking/LocationMiniMap";
import { Bell, X, Check, XCircle, Truck, Phone, User2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearBookingDecision,
  removeBookingRequest,
  setPendingBookingDecision,
} from "@/lib/booking-cache-ops";
import { resolveBookingRequestCallback } from "@/lib/booking-request-callbacks";
import { useBookingRequests } from "@/hooks/use-booking-requests";
import type { BookingDecisionState } from "@/lib/booking-types";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import { queryKeys } from "@/lib/queryKeys";
import type { DispatcherBookingPayload } from "@/lib/socket-types";
import { useGetDrivers } from "@/services/driver.service";
import { useGetHospitals } from "@/services/hospital.service";
import { useReassignBooking } from "@/services/booking.service";
import { cn } from "@/lib/utils";
import env from "@/../env";

export function BookingRequestOverlay({ socketConnected }: { socketConnected?: boolean }) {
  const queryClient = useQueryClient();
  const { bookingRequests } = useBookingRequests();
  const ongoingBookingsQuery = useQuery<Record<string, DispatcherBookingPayload>>({
    queryKey: queryKeys.ongoingBookings(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const bookingDecisionsQuery = useQuery<Record<string, BookingDecisionState>>({
    queryKey: queryKeys.bookingDecisions(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const ongoingBookings = ongoingBookingsQuery.data ?? {};
  const bookingDecisions = bookingDecisionsQuery.data ?? {};
  const [isOpen, setIsOpen] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<DispatcherBookingPayload | null>(null);
  const [reassignDriverId, setReassignDriverId] = useState("");
  const [reassignHospitalId, setReassignHospitalId] = useState("");
  const [reassignPickupX, setReassignPickupX] = useState("");
  const [reassignPickupY, setReassignPickupY] = useState("");
  const [reassignPickupAddress, setReassignPickupAddress] = useState("");
  const [reassignError, setReassignError] = useState<string | null>(null);

  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID, isActive: true });
  const hospitals = useGetHospitals();
  const reassignBooking = useReassignBooking();

  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);
  const driverOptions = useMemo(
    () =>
      [...(drivers.data ?? [])]
        .sort((a, b) => {
          const aRank = a.status === "AVAILABLE" ? 0 : 1;
          const bRank = b.status === "AVAILABLE" ? 0 : 1;
          if (aRank !== bRank) return aRank - bRank;
          return (a.fullName ?? "").localeCompare(b.fullName ?? "");
        })
        .map((driver) => ({
          value: driver.id,
          label: `${driver.fullName ?? "Unknown"} (${driver.status ?? "N/A"})`,
        })),
    [drivers.data]
  );
  const hospitalOptions = useMemo(
    () =>
      (hospitals.data ?? []).map((hospital) => ({
        value: hospital.id,
        label: hospital.name,
      })),
    [hospitals.data]
  );

  const openReassignDialog = (booking: DispatcherBookingPayload) => {
    setSelectedBooking(booking);
    setReassignDriverId(booking.driver.id);
    setReassignHospitalId(booking.hospital.id);
    const sourceLocation = booking.pickupLocation ?? booking.patient.location;
    setReassignPickupX(sourceLocation?.x?.toString() ?? "");
    setReassignPickupY(sourceLocation?.y?.toString() ?? "");
    setReassignPickupAddress("");
    setReassignError(null);
    setIsReassignOpen(true);
  };

  const closeReassignDialog = () => {
    setIsReassignOpen(false);
    setSelectedBooking(null);
    setReassignError(null);
  };

  const handleReassign = async () => {
    if (!selectedBooking) return;

    setReassignError(null);

    const payload: {
      dispatcherId: string;
      driverId?: string;
      hospitalId?: string;
      pickupLocation?: { x: number; y: number };
      pickupAddress?: string | null;
    } = {
      dispatcherId: env.VITE_DISPATCHER_ID,
    };

    if (reassignDriverId && reassignDriverId !== selectedBooking.driver.id) {
      payload.driverId = reassignDriverId;
    }

    if (reassignHospitalId && reassignHospitalId !== selectedBooking.hospital.id) {
      payload.hospitalId = reassignHospitalId;
    }

    const currentPickup = selectedBooking.pickupLocation ?? selectedBooking.patient.location;
    const x = Number.parseFloat(reassignPickupX);
    const y = Number.parseFloat(reassignPickupY);
    const pickupChanged =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      (x !== currentPickup?.x || y !== currentPickup?.y);

    if (pickupChanged) {
      payload.pickupLocation = { x, y };
    }

    if (reassignPickupAddress.trim()) {
      payload.pickupAddress = reassignPickupAddress.trim();
    }

    if (Object.keys(payload).length === 1) {
      setReassignError("No changes detected. Update at least one field.");
      return;
    }

    try {
      await reassignBooking.mutateAsync({ bookingId: selectedBooking.bookingId, payload });
      closeReassignDialog();
    } catch (error) {
      setReassignError(getBookingActionErrorMessage(error));
    }
  };

  const currentReassignPoint = (() => {
    const x = Number.parseFloat(reassignPickupX);
    const y = Number.parseFloat(reassignPickupY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  })();

  const handleAccept = (requestId: string) => {
    resolveBookingRequestCallback(requestId, true);
    setPendingBookingDecision(queryClient, requestId);
  };

  const handleReject = (requestId: string) => {
    resolveBookingRequestCallback(requestId, false);
    removeBookingRequest(queryClient, requestId);
    clearBookingDecision(queryClient, requestId);
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const expiry = 30000;
    const decisionHoldLost = 5000;

    const requestTimeouts = bookingRequests.map((request) => {
      const remaining = Math.max(expiry - (now - request.timestamp), 0);
      if (remaining === 0) {
        removeBookingRequest(queryClient, request.requestId);
        clearBookingDecision(queryClient, request.requestId);
        return null;
      }
      return setTimeout(() => {
        removeBookingRequest(queryClient, request.requestId);
        clearBookingDecision(queryClient, request.requestId);
      }, remaining);
    });

    const decisionTimeouts = Object.entries(bookingDecisions)
      .filter(([, decision]) => ["won", "lost"].includes(decision.status))
      .map(([requestId, decision]) =>
        setTimeout(
          () => {
            removeBookingRequest(queryClient, requestId);
            clearBookingDecision(queryClient, requestId);
          },
          decision.status === "won" ? 0 : decisionHoldLost
        )
      );

    return () => {
      requestTimeouts.forEach((timeoutId) => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      decisionTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [bookingRequests, bookingDecisions, now, queryClient]);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed top-2 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative shadow-lg"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Truck />}
          {bookingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
              {bookingRequests.length}
            </span>
          )}
        </Button>
      </div>

      {/* Overlay Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="items-center w-full justify-between p-2 border-b">
            <h1 className="font-bold text-xl items-center text-center ">Activity</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {bookingRequests.length === 0 && ongoingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">
                  {socketConnected === false ? "Disconnected" : "No pending requests"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {ongoingList.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Ongoing Bookings
                    </div>
                    {ongoingList.map((booking) => (
                      <Alert
                        key={booking.bookingId}
                        variant="default"
                        className="border-emerald-200"
                      >
                        <Truck className="h-4 w-4" />
                        <AlertTitle>Active Booking</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Booking ID: {booking.bookingId}
                          </div>
                          <div className="grid gap-3 text-xs">
                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Patient
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <User2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {booking.patient.fullName ?? "Unknown"}
                                </span>
                              </div>
                              {booking.patient.phoneNumber && (
                                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{booking.patient.phoneNumber}</span>
                                </div>
                              )}
                            </div>

                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Driver / Provider
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {booking.driver.provider?.name ?? "Unknown Provider"}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Driver: {booking.driver.fullName ?? booking.driver.id ?? "Unknown"}
                              </div>
                            </div>

                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                Hospital
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {booking.hospital.name ?? "Unknown"}
                              </div>
                              {booking.hospital.phoneNumber && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {booking.hospital.phoneNumber}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Status</span>
                              <span className="font-mono">{booking.status}</span>
                            </div>
                            <div className="pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReassignDialog(booking)}
                                className="w-full"
                              >
                                Reassign Booking
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {bookingRequests.map((request) => (
                  <Alert
                    key={request.requestId}
                    variant="default"
                    className="animate-in slide-in-from-right-5 border-primary/20"
                  >
                    <Bell className="h-4 w-4" />
                    <AlertTitle>New Booking Request</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Request ID: {request.requestId}
                      </div>
                      {request.data && (
                        <div className="grid gap-3 text-xs">
                          <div className="rounded-md border bg-muted/40 p-3">
                            <div className="text-[10px] uppercase text-muted-foreground">
                              Patient
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <User2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {request.data.patient.fullName ?? "Unknown"}
                              </span>
                            </div>
                            {request.data.patient.phoneNumber && (
                              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{request.data.patient.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                          <div className="rounded-md border bg-muted/40 p-3">
                            <div className="text-[10px] uppercase text-muted-foreground">
                              Driver / Provider
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {request.data.driver.ambulance_provider?.name ?? "Unknown Provider"}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Driver ID: {request.data.driver.id}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Request ID</span>
                            <span className="font-mono">{request.requestId}</span>
                          </div>
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status === "pending" && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Waiting for decision...
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status !== "pending" &&
                        bookingDecisions[request.requestId]?.status !== "won" && (
                          <div className="mt-3 rounded-md border border-muted/60 bg-muted/30 px-3 py-2 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Time remaining</span>
                              <span className="font-mono">
                                {Math.max(0, Math.ceil((30000 - (now - request.timestamp)) / 1000))}
                                s
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    ((30000 - (now - request.timestamp)) / 30000) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                      {bookingDecisions[request.requestId]?.status === "won" && (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          You got the booking.
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status === "lost" && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Another dispatcher got it:{" "}
                          {bookingDecisions[request.requestId].winner.name ?? "Unknown"}
                          {bookingDecisions[request.requestId].winner.providerName
                            ? ` (${bookingDecisions[request.requestId].winner.providerName})`
                            : ""}
                          .
                        </div>
                      )}

                      {bookingDecisions[request.requestId]?.status !== "won" &&
                        bookingDecisions[request.requestId]?.status !== "lost" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(request.requestId)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={bookingDecisions[request.requestId]?.status === "pending"}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.requestId)}
                              className="flex-1"
                              disabled={bookingDecisions[request.requestId]?.status === "pending"}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && bookingRequests.length > 0 && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <Dialog
        open={isReassignOpen}
        onOpenChange={(open) => {
          if (!open) closeReassignDialog();
          else setIsReassignOpen(true);
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>Reassign Booking</DialogTitle>
            <DialogDescription>
              Change driver, hospital, or pickup location for this active booking.
            </DialogDescription>
          </DialogHeader>

          <div className="grid flex-1 gap-4 overflow-y-auto px-6 pb-6 min-h-0">
            {reassignError && (
              <Alert variant="destructive">
                <AlertTitle>Could not reassign booking</AlertTitle>
                <AlertDescription>{reassignError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">Driver</label>
              <Select
                value={reassignDriverId}
                onChange={(e) => setReassignDriverId(e.target.value)}
                options={driverOptions}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Hospital</label>
              <Select
                value={reassignHospitalId}
                onChange={(e) => setReassignHospitalId(e.target.value)}
                options={hospitalOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Pickup Longitude (x)</label>
                <Input
                  value={reassignPickupX}
                  onChange={(e) => setReassignPickupX(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Pickup Latitude (y)</label>
                <Input
                  value={reassignPickupY}
                  onChange={(e) => setReassignPickupY(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Pick Location on Map</label>
              <LocationMiniMap
                className="h-40 sm:h-52 w-full overflow-hidden rounded-md border"
                value={currentReassignPoint}
                onChange={(point) => {
                  setReassignPickupX(point.x.toFixed(6));
                  setReassignPickupY(point.y.toFixed(6));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Click map or drag marker to update pickup location.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Pickup Address (optional)</label>
              <Input
                value={reassignPickupAddress}
                onChange={(e) => setReassignPickupAddress(e.target.value)}
                placeholder="Only send if changed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeReassignDialog}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={reassignBooking.isPending}>
              {reassignBooking.isPending ? "Saving..." : "Apply Reassignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

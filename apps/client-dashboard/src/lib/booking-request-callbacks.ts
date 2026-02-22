import type { DispatcherApprovalResponse } from "@/lib/socket-types";

type DispatcherApprovalCallback = (response: DispatcherApprovalResponse) => void;

const bookingRequestCallbacks = new Map<string, DispatcherApprovalCallback>();

export function setBookingRequestCallback(requestId: string, callback: DispatcherApprovalCallback) {
  bookingRequestCallbacks.set(requestId, callback);
}

export function resolveBookingRequestCallback(requestId: string, approved: boolean) {
  const callback = bookingRequestCallbacks.get(requestId);
  if (!callback) return;

  bookingRequestCallbacks.delete(requestId);
  callback({ approved });
}

export function removeBookingRequestCallback(requestId: string) {
  bookingRequestCallbacks.delete(requestId);
}

export function clearBookingRequestCallbacks() {
  bookingRequestCallbacks.clear();
}

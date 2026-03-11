import { Injectable } from "@nestjs/common";
import type { BookingNewPayload, DispatcherDecisionAckPayload } from "@ambulink/types";
import type { User } from "@/core/database/schema";

type PendingRequestEntry = {
  payload: BookingNewPayload;
  dispatcherId: string;
  expiresAtMs: number;
  timer: ReturnType<typeof setTimeout>;
  resolveDecision: (approved: boolean) => void;
  resolved: boolean;
};

@Injectable()
export class DispatcherFlowPendingRequestService {
  private static readonly REQUEST_TIMEOUT_MS = 30_000;
  private static readonly EXPIRED_TOMBSTONE_TTL_MS = 60_000;

  private readonly byRequestId = new Map<string, PendingRequestEntry>();
  private readonly byDispatcherId = new Map<string, Set<string>>();
  private readonly expiredTombstones = new Map<string, number>();

  createPendingRequest(
    dispatcherId: string,
    requestId: string,
    driver: Pick<User, "id" | "providerId" | "currentLocation">,
    patient: Pick<User, "id" | "fullName" | "phoneNumber" | "email" | "currentLocation">
  ) {
    const createdAtMs = Date.now();
    const expiresAtMs = createdAtMs + DispatcherFlowPendingRequestService.REQUEST_TIMEOUT_MS;

    let resolveDecision: (approved: boolean) => void = () => undefined;
    const decisionPromise = new Promise<boolean>((resolve) => {
      resolveDecision = resolve;
    });

    const payload: BookingNewPayload = {
      requestId,
      createdAt: new Date(createdAtMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
      driver: {
        id: driver.id,
        providerId: driver.providerId,
        currentLocation: driver.currentLocation ?? null,
        phoneNumber: null,
      },
      patient: {
        id: patient.id,
        fullName: patient.fullName ?? null,
        phoneNumber: patient.phoneNumber ?? null,
        email: patient.email ?? null,
        currentLocation: patient.currentLocation ?? null,
      },
    };

    const timer = setTimeout(() => {
      this.expireRequest(requestId);
    }, DispatcherFlowPendingRequestService.REQUEST_TIMEOUT_MS);

    const entry: PendingRequestEntry = {
      payload,
      dispatcherId,
      expiresAtMs,
      timer,
      resolveDecision,
      resolved: false,
    };

    this.byRequestId.set(requestId, entry);
    this.expiredTombstones.delete(requestId);
    if (!this.byDispatcherId.has(dispatcherId)) {
      this.byDispatcherId.set(dispatcherId, new Set());
    }
    this.byDispatcherId.get(dispatcherId)?.add(requestId);

    console.info("[dispatcher-pending] created", { dispatcherId, requestId, expiresAtMs });
    return { payload, decisionPromise };
  }

  getPendingForDispatcher(dispatcherId: string, nowMs = Date.now()): BookingNewPayload[] {
    const requestIds = this.byDispatcherId.get(dispatcherId);
    if (!requestIds || requestIds.size === 0) {
      return [];
    }

    const pending: BookingNewPayload[] = [];
    for (const requestId of requestIds) {
      const entry = this.byRequestId.get(requestId);
      if (!entry) continue;
      if (entry.resolved) continue;
      if (entry.expiresAtMs <= nowMs) {
        this.expireRequest(requestId);
        continue;
      }
      pending.push(entry.payload);
    }

    return pending.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  submitDecision(
    dispatcherId: string,
    requestId: string,
    approved: boolean
  ): DispatcherDecisionAckPayload {
    const entry = this.byRequestId.get(requestId);
    if (!entry) {
      const tombstoneExpiresAt = this.expiredTombstones.get(requestId);
      if (tombstoneExpiresAt && tombstoneExpiresAt > Date.now()) {
        return { requestId, approved, accepted: false, reason: "expired" };
      }
      if (tombstoneExpiresAt) {
        this.expiredTombstones.delete(requestId);
      }
      return { requestId, approved, accepted: false, reason: "not_found" };
    }

    if (entry.dispatcherId !== dispatcherId) {
      return { requestId, approved, accepted: false, reason: "forbidden" };
    }

    if (entry.resolved) {
      return { requestId, approved, accepted: false, reason: "already_resolved" };
    }

    if (entry.expiresAtMs <= Date.now()) {
      this.resolveAndCleanup(requestId, false);
      return { requestId, approved, accepted: false, reason: "expired" };
    }

    this.resolveAndCleanup(requestId, approved);
    console.info("[dispatcher-pending] resolved", { dispatcherId, requestId, approved });
    return { requestId, approved, accepted: true };
  }

  private expireRequest(requestId: string) {
    const entry = this.byRequestId.get(requestId);
    if (!entry || entry.resolved) return;

    this.resolveAndCleanup(requestId, false);
    this.expiredTombstones.set(
      requestId,
      Date.now() + DispatcherFlowPendingRequestService.EXPIRED_TOMBSTONE_TTL_MS
    );
    console.info("[dispatcher-pending] expired", {
      dispatcherId: entry.dispatcherId,
      requestId,
    });
  }

  private resolveAndCleanup(requestId: string, approved: boolean) {
    const entry = this.byRequestId.get(requestId);
    if (!entry) return;
    if (entry.resolved) return;

    entry.resolved = true;
    clearTimeout(entry.timer);
    entry.resolveDecision(approved);

    this.byRequestId.delete(requestId);
    const requestIds = this.byDispatcherId.get(entry.dispatcherId);
    requestIds?.delete(requestId);
    if (requestIds && requestIds.size === 0) {
      this.byDispatcherId.delete(entry.dispatcherId);
    }
  }
}

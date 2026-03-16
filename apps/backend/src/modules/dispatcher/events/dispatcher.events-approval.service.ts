import { BadRequestException, Injectable } from "@nestjs/common";
import { SocketService } from "@/core/socket/socket.service";
import type { User } from "@/core/database/schema";
import { DispatcherEventsRepository } from "./dispatcher.events.repository";
import { DispatcherEventsPendingRequestService } from "./dispatcher.events-pending-request.service";
import { DispatcherEventsService } from "./dispatcher.events.service";

@Injectable()
export class DispatcherEventsApprovalService {
  constructor(
    private socketService: SocketService,
    private dispatcherService: DispatcherEventsService,
    private dispatcherRepository: DispatcherEventsRepository,
    private pendingRequestService: DispatcherEventsPendingRequestService
  ) {}

  async pickDriverThroughDispatchers(
    nearByDrivers: Array<{
      id: string;
      providerId: string | null;
      currentLocation: User["currentLocation"];
    }>,
    patient: {
      id: string;
      fullName: string | null;
      phoneNumber: string | null;
      email: string | null;
      currentLocation: User["currentLocation"];
    }
  ) {
    console.info("[dispatcher-approval] start", {
      nearbyDriverCount: nearByDrivers.length,
      patientId: patient.id,
    });
    const requestGroups = await Promise.all(
      nearByDrivers.map(async (driver) => {
        if (!driver.providerId) return [];
        const dispatcherIds = await this.getConnectedDispatcherIdsByProvider(driver.providerId);
        if (dispatcherIds.length === 0) {
          // Fallback to provider's active dispatchers so pending-sync can deliver
          // even if no dispatcher socket is currently connected.
          const activeDispatchers = await this.dispatcherService.findAllActiveDispatchersByProvider(
            driver.providerId
          );
          dispatcherIds.push(...activeDispatchers);
        }
        if (dispatcherIds.length === 0) return [];
        return [
          {
            providerId: driver.providerId,
            dispatcherIds,
            driver,
            requestId: `req_${Date.now()}_${driver.id}`,
          },
        ];
      })
    );

    const activeRequests = requestGroups.flat();
    console.info("[dispatcher-approval] request_groups_ready", {
      activeRequestGroups: activeRequests.length,
    });

    if (activeRequests.length === 0) {
      return { status: "failed" as const, reason: "no_dispatchers" as const };
    }

    const approvalPromises = activeRequests.map(
      ({ providerId, dispatcherIds, driver, requestId }) =>
        this.requestApproval(providerId, dispatcherIds, driver, patient, requestId).then(
          (decision) => {
            if (!decision.approved || !decision.dispatcherId) {
              throw new BadRequestException({
                code: "BOOKING_DISPATCHER_DECLINED",
                message: "Dispatcher declined or ignored",
              });
            }
            return {
              dispatcherId: decision.dispatcherId,
              pickedDriver: driver,
              requestId,
            };
          }
        )
    );

    try {
      const winningResponse = await Promise.any(approvalPromises);
      await this.notifyDecision(
        activeRequests.flatMap(({ dispatcherIds, requestId }) =>
          dispatcherIds.map((dispatcherId) => ({ dispatcherId, requestId }))
        ),
        winningResponse.dispatcherId
      );
      return { ...winningResponse, status: "approved" as const };
    } catch {
      return { status: "failed" as const, reason: "all_rejected" as const };
    }
  }

  async requestApproval(
    providerId: string,
    dispatcherIds: string[],
    driver: Pick<User, "id" | "providerId" | "currentLocation">,
    patient: Pick<User, "id" | "fullName" | "phoneNumber" | "email" | "currentLocation">,
    requestId: string
  ) {
    console.info("[dispatcher-approval] request_emit", {
      providerId,
      dispatcherCount: dispatcherIds.length,
      requestId,
      driverId: driver.id,
    });
    const { payload, decisionPromise } = this.pendingRequestService.createPendingRequest(
      providerId,
      dispatcherIds,
      requestId,
      driver,
      patient
    );
    this.socketService.dispatcherServer
      ?.to(`dispatcher-provider:${providerId}`)
      .emit("booking:new", payload);
    return decisionPromise;
  }

  private async getConnectedDispatcherIdsByProvider(providerId: string) {
    const server = this.socketService.dispatcherServer;
    if (!server) return [];

    const sockets = await server.in(`dispatcher-provider:${providerId}`).fetchSockets();
    const ids = new Set<string>();
    for (const socket of sockets) {
      const dispatcherId = socket.data?.dispatcherId;
      if (typeof dispatcherId === "string" && dispatcherId.length > 0) {
        ids.add(dispatcherId);
      }
    }
    return [...ids];
  }

  async notifyDecision(
    dispatcherRequests: { dispatcherId: string; requestId: string }[],
    winnerDispatcherId: string
  ) {
    if (!this.socketService.dispatcherServer) return;

    const [winner] = await this.dispatcherRepository.getDispatcherWinnerInfo(winnerDispatcherId);
    const winnerPayload = {
      id: winnerDispatcherId,
      name: winner?.name ?? null,
      providerName: winner?.providerName ?? null,
    };

    dispatcherRequests.forEach(({ dispatcherId, requestId }) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .emit("booking:decision", {
          requestId,
          isWinner: dispatcherId === winnerDispatcherId,
          winner: winnerPayload,
        });
    });
  }
}

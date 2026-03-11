import { BadRequestException, Injectable } from "@nestjs/common";
import { SocketService } from "@/core/socket/socket.service";
import type { User } from "@/core/database/schema";
import { DispatcherWsRepository } from "./dispatcher.ws.repository";
import { DispatcherWsPendingRequestService } from "./dispatcher.ws-pending-request.service";
import { DispatcherWsService } from "./dispatcher.ws.service";

@Injectable()
export class DispatcherWsApprovalService {
  constructor(
    private socketService: SocketService,
    private dispatcherService: DispatcherWsService,
    private dispatcherRepository: DispatcherWsRepository,
    private pendingRequestService: DispatcherWsPendingRequestService
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
    const requests = await Promise.all(
      nearByDrivers.map(async (driver) => {
        const dispatcherId = await this.dispatcherService.findLiveDispatchersByProvider(
          driver.providerId!
        );
        if (!dispatcherId) return null;

        const requestId = `req_${Date.now()}_${driver.id}`;
        return { dispatcherId, driver, requestId };
      })
    );

    const activeRequests = requests.filter(
      (
        request
      ): request is {
        dispatcherId: string;
        driver: {
          id: string;
          providerId: string | null;
          currentLocation: User["currentLocation"];
        };
        requestId: string;
      } => Boolean(request)
    );

    if (activeRequests.length === 0) {
      return { status: "failed" as const, reason: "no_dispatchers" as const };
    }

    const approvalPromises = activeRequests.map(({ dispatcherId, driver, requestId }) =>
      this.requestApproval(dispatcherId, driver, patient, requestId).then((approved) => {
        if (!approved) {
          throw new BadRequestException({
            code: "BOOKING_DISPATCHER_DECLINED",
            message: "Dispatcher declined or ignored",
          });
        }
        return {
          dispatcherId,
          pickedDriver: driver,
          requestId,
        };
      })
    );

    try {
      const winningResponse = await Promise.any(approvalPromises);
      await this.notifyDecision(
        activeRequests.map(({ dispatcherId, requestId }) => ({ dispatcherId, requestId })),
        winningResponse.dispatcherId
      );
      return { ...winningResponse, status: "approved" as const };
    } catch {
      return { status: "failed" as const, reason: "all_rejected" as const };
    }
  }

  async requestApproval(
    dispatcherId: string,
    driver: Pick<User, "id" | "providerId" | "currentLocation">,
    patient: Pick<User, "id" | "fullName" | "phoneNumber" | "email" | "currentLocation">,
    requestId: string
  ) {
    const { payload, decisionPromise } = this.pendingRequestService.createPendingRequest(
      dispatcherId,
      requestId,
      driver,
      patient
    );
    this.socketService.dispatcherServer
      ?.to(`dispatcher:${dispatcherId}`)
      .emit("booking:new", payload);
    return decisionPromise;
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

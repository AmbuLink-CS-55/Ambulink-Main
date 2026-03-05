import { Injectable } from "@nestjs/common";
import { SocketService } from "@/core/socket/socket.service";
import type { User } from "@/core/database/schema";
import { DispatcherRepository } from "./dispatcher.repository";
import { DispatcherPendingRequestService } from "./dispatcher-pending-request.service";

@Injectable()
export class DispatcherApprovalService {
  constructor(
    private socketService: SocketService,
    private dispatcherRepository: DispatcherRepository,
    private pendingRequestService: DispatcherPendingRequestService
  ) {}

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
    this.socketService.dispatcherServer?.to(`dispatcher:${dispatcherId}`).emit("booking:new", payload);
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

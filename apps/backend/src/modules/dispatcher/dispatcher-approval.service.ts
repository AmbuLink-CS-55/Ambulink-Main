import { Injectable } from "@nestjs/common";
import { SocketService } from "@/common/socket/socket.service";
import type { User } from "@/common/database/schema";
import { DispatcherRepository } from "./dispatcher.repository";

@Injectable()
export class DispatcherApprovalService {
  constructor(
    private socketService: SocketService,
    private dispatcherRepository: DispatcherRepository
  ) {}

  async requestApproval(dispatcherId: string, driver: User, patient: User, requestId: string) {
    return new Promise<boolean>((resolve) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .timeout(30000)
        .emit(
          "booking:new",
          {
            requestId,
            driver: {
              id: driver.id,
              providerId: driver.providerId,
              currentLocation: driver.currentLocation ?? null,
            },
            patient: {
              id: patient.id,
              fullName: patient.fullName ?? null,
              phoneNumber: patient.phoneNumber ?? null,
              email: patient.email ?? null,
              currentLocation: patient.currentLocation ?? null,
            },
          },
          (err: unknown, response: Array<{ approved?: boolean }> = []) => {
            if (err || !response[0]?.approved) {
              resolve(false);
              return;
            }
            resolve(true);
          }
        );
    });
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

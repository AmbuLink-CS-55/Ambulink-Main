import { Module } from "@nestjs/common";
import { DispatcherWsService } from "./ws/dispatcher.ws.service";
import { DispatcherWsApprovalService } from "./ws/dispatcher.ws-approval.service";
import { DispatcherWsRepository } from "./ws/dispatcher.ws.repository";
import { DispatcherWsPendingRequestService } from "./ws/dispatcher.ws-pending-request.service";

@Module({
  providers: [
    DispatcherWsService,
    DispatcherWsApprovalService,
    DispatcherWsRepository,
    DispatcherWsPendingRequestService,
  ],
  exports: [
    DispatcherWsService,
    DispatcherWsApprovalService,
    DispatcherWsRepository,
    DispatcherWsPendingRequestService,
  ],
})
export class DispatcherCoreModule {}

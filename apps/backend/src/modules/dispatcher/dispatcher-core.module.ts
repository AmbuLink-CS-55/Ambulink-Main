import { Module } from "@nestjs/common";
import { DispatcherFlowService } from "./flow/dispatcher.flow.service";
import { DispatcherFlowApprovalService } from "./flow/dispatcher.flow-approval.service";
import { DispatcherFlowRepository } from "./flow/dispatcher.flow.repository";
import { DispatcherFlowPendingRequestService } from "./flow/dispatcher.flow-pending-request.service";

@Module({
  providers: [
    DispatcherFlowService,
    DispatcherFlowApprovalService,
    DispatcherFlowRepository,
    DispatcherFlowPendingRequestService,
  ],
  exports: [
    DispatcherFlowService,
    DispatcherFlowApprovalService,
    DispatcherFlowRepository,
    DispatcherFlowPendingRequestService,
  ],
})
export class DispatcherCoreModule {}

import { Module } from "@nestjs/common";
import { DispatcherFlowService } from "./flow/dispatcher.flow.service";
import { DispatcherFlowApprovalService } from "./flow/dispatcher.flow-approval.service";
import { DispatcherFlowRepository } from "./flow/dispatcher.flow.repository";
import { DispatcherFlowPendingRequestService } from "./flow/dispatcher.flow-pending-request.service";
import { DispatcherApiRepository } from "./api/dispatcher.api.repository";

@Module({
  providers: [
    DispatcherFlowService,
    DispatcherFlowApprovalService,
    DispatcherFlowRepository,
    DispatcherFlowPendingRequestService,
    DispatcherApiRepository,
  ],
  exports: [
    DispatcherFlowService,
    DispatcherFlowApprovalService,
    DispatcherFlowRepository,
    DispatcherFlowPendingRequestService,
    DispatcherApiRepository,
  ],
})
export class DispatcherCoreModule {}

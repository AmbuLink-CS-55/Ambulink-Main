import { Module } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherApprovalService } from "./dispatcher-approval.service";
import { DispatcherRepository } from "./dispatcher.repository";
import { DispatcherPendingRequestService } from "./dispatcher-pending-request.service";

@Module({
  providers: [
    DispatcherService,
    DispatcherApprovalService,
    DispatcherRepository,
    DispatcherPendingRequestService,
  ],
  exports: [
    DispatcherService,
    DispatcherApprovalService,
    DispatcherRepository,
    DispatcherPendingRequestService,
  ],
})
export class DispatcherCoreModule {}

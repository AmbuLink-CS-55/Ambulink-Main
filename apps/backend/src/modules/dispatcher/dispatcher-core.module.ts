import { Module } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherApprovalService } from "./dispatcher-approval.service";
import { DispatcherRepository } from "./dispatcher.repository";

@Module({
  providers: [DispatcherService, DispatcherApprovalService, DispatcherRepository],
  exports: [DispatcherService, DispatcherApprovalService, DispatcherRepository],
})
export class DispatcherCoreModule {}

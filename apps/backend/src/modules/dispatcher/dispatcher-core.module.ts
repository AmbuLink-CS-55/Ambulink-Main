import { Module } from "@nestjs/common";
import { DispatcherEventsService } from "./events/dispatcher.events.service";
import { DispatcherEventsApprovalService } from "./events/dispatcher.events-approval.service";
import { DispatcherEventsRepository } from "./events/dispatcher.events.repository";
import { DispatcherEventsPendingRequestService } from "./events/dispatcher.events-pending-request.service";

@Module({
  providers: [
    DispatcherEventsService,
    DispatcherEventsApprovalService,
    DispatcherEventsRepository,
    DispatcherEventsPendingRequestService,
  ],
  exports: [
    DispatcherEventsService,
    DispatcherEventsApprovalService,
    DispatcherEventsRepository,
    DispatcherEventsPendingRequestService,
  ],
})
export class DispatcherCoreModule {}

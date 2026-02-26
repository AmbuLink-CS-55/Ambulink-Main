import { Module, forwardRef } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherGateway } from "./dispatcher.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherApprovalService } from "./dispatcher-approval.service";
import { DispatcherRepository } from "./dispatcher.repository";

@Module({
  controllers: [],
  providers: [DispatcherService, DispatcherGateway, DispatcherApprovalService, DispatcherRepository],
  imports: [forwardRef(() => BookingModule)],
  exports: [DispatcherService, DispatcherGateway, DispatcherApprovalService],
})
export class DispatcherModule {}

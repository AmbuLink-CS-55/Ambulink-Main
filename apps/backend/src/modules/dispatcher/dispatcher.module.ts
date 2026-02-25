import { Module, forwardRef } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherGateway } from "./dispatcher.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherApprovalService } from "./dispatcher-approval.service";

@Module({
  controllers: [],
  providers: [DispatcherService, DispatcherGateway, DispatcherApprovalService],
  imports: [forwardRef(() => BookingModule)],
  exports: [DispatcherService, DispatcherGateway, DispatcherApprovalService],
})
export class DispatcherModule {}

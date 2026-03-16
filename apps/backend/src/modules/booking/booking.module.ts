import { Module, forwardRef } from "@nestjs/common";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { DriverModule } from "../driver/driver.module";
import { PatientModule } from "../patient/patient.module";
import { HospitalModule } from "../hospital/hospital.module";
import { EmtModule } from "../emt/emt.module";
import { BookingMediaService } from "./booking-media.service";
import { BookingApiController } from "./api/booking.api.controller";
import { BookingApiService } from "./api/booking.api.service";
import { BookingEventsService } from "./events/booking.events.service";
import { BookingCoreService } from "./common/booking.core.service";
import { BookingSharedRepository } from "./common/booking.shared.repository";
import { AttachmentAuthGuard } from "@/common/auth/attachment-auth.guard";

@Module({
  imports: [
    DispatcherCoreModule,
    forwardRef(() => DriverModule),
    forwardRef(() => PatientModule),
    HospitalModule,
    forwardRef(() => EmtModule),
  ],
  controllers: [BookingApiController],
  providers: [
    BookingSharedRepository,
    BookingCoreService,
    BookingApiService,
    BookingEventsService,
    BookingMediaService,
    AttachmentAuthGuard,
  ],
  exports: [BookingApiService, BookingEventsService, BookingMediaService, BookingSharedRepository],
})
export class BookingModule {}

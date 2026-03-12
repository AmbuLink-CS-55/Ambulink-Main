import { Module } from "@nestjs/common";
import { HospitalApiService } from "./api/hospital.api.service";
import { HospitalApiController } from "./api/hospital.api.controller";
import { HospitalApiRepository } from "./api/hospital.api.repository";
import { HospitalEventsService } from "./events/hospital.events.service";
import { HospitalEventsRepository } from "./events/hospital.events.repository";

@Module({
  controllers: [HospitalApiController],
  providers: [
    HospitalApiService,
    HospitalApiRepository,
    HospitalEventsService,
    HospitalEventsRepository,
  ],
  exports: [HospitalApiService, HospitalEventsService],
})
export class HospitalModule {}

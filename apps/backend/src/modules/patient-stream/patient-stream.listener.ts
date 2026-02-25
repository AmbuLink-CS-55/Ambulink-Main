import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DOMAIN_EVENT_PATIENT_STREAM, type PatientStreamDomainEvent } from "@/common/events/domain-events";
import { PatientStreamService } from "./patient-stream.service";

@Injectable()
export class PatientStreamListener {
  constructor(private patientStreamService: PatientStreamService) {}

  @OnEvent(DOMAIN_EVENT_PATIENT_STREAM)
  handlePatientStreamEvent(payload: PatientStreamDomainEvent) {
    this.patientStreamService.emitToPatient(payload.patientId, payload.event, payload.data);
  }
}

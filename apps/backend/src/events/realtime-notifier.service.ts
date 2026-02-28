import { Injectable } from "@nestjs/common";
import { DomainEventsService } from "./domain-events.service";

@Injectable()
export class RealtimeNotifierService {
  constructor(private domainEventsService: DomainEventsService) {}

  notifyDriver(driverId: string, event: string, payload: unknown) {
    this.domainEventsService.publishDriverNotification({
      driverId,
      event,
      payload,
    });
  }

  notifyPatient(patientId: string, event: string, payload: unknown) {
    this.domainEventsService.publishPatientNotification({
      patientId,
      event,
      payload,
    });
  }

  notifyDispatcher(dispatcherId: string, event: string, payload: unknown) {
    this.domainEventsService.publishDispatcherNotification({
      dispatcherId,
      event,
      payload,
    });
  }

  notifyAllDispatchers(event: string, payload: unknown) {
    this.domainEventsService.publishDispatcherBroadcast({
      event,
      payload,
    });
  }
}

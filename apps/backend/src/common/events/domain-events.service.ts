import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  DOMAIN_EVENT_NOTIFY_ALL_DISPATCHERS,
  DOMAIN_EVENT_NOTIFY_DISPATCHER,
  DOMAIN_EVENT_NOTIFY_DRIVER,
  DOMAIN_EVENT_NOTIFY_PATIENT,
  type BroadcastDispatcherNotificationEvent,
  type DispatcherNotificationEvent,
  type DriverNotificationEvent,
  type PatientNotificationEvent,
} from "./domain-events";

@Injectable()
export class DomainEventsService {
  constructor(private eventEmitter: EventEmitter2) {}

  publishDriverNotification(payload: DriverNotificationEvent) {
    this.eventEmitter.emit(DOMAIN_EVENT_NOTIFY_DRIVER, payload);
  }

  publishPatientNotification(payload: PatientNotificationEvent) {
    this.eventEmitter.emit(DOMAIN_EVENT_NOTIFY_PATIENT, payload);
  }

  publishDispatcherNotification(payload: DispatcherNotificationEvent) {
    this.eventEmitter.emit(DOMAIN_EVENT_NOTIFY_DISPATCHER, payload);
  }

  publishDispatcherBroadcast(payload: BroadcastDispatcherNotificationEvent) {
    this.eventEmitter.emit(DOMAIN_EVENT_NOTIFY_ALL_DISPATCHERS, payload);
  }
}

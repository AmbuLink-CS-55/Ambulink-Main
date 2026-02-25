import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
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
import { SocketService } from "@/common/socket/socket.service";

@Injectable()
export class SocketNotificationListener {
  constructor(private socketService: SocketService) {}

  @OnEvent(DOMAIN_EVENT_NOTIFY_DRIVER)
  onNotifyDriver(payload: DriverNotificationEvent) {
    this.socketService.emitToDriver(payload.driverId, payload.event, payload.payload);
  }

  @OnEvent(DOMAIN_EVENT_NOTIFY_PATIENT)
  onNotifyPatient(payload: PatientNotificationEvent) {
    this.socketService.emitToPatient(payload.patientId, payload.event, payload.payload);
  }

  @OnEvent(DOMAIN_EVENT_NOTIFY_DISPATCHER)
  onNotifyDispatcher(payload: DispatcherNotificationEvent) {
    this.socketService.emitToDispatcher(payload.dispatcherId, payload.event, payload.payload);
  }

  @OnEvent(DOMAIN_EVENT_NOTIFY_ALL_DISPATCHERS)
  onNotifyAllDispatchers(payload: BroadcastDispatcherNotificationEvent) {
    this.socketService.emitToAllDispatchers(payload.event, payload.payload);
  }
}

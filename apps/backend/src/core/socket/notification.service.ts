import { Injectable } from "@nestjs/common";
import { SocketService } from "./socket.service";

@Injectable()
export class NotificationService {
  constructor(private socketService: SocketService) {}

  notifyDriver(driverId: string, event: string, payload: unknown) {
    this.socketService.emitToDriver(driverId, event, payload);
  }

  notifyPatient(patientId: string, event: string, payload: unknown) {
    this.socketService.emitToPatient(patientId, event, payload);
  }

  notifyDispatcher(dispatcherId: string, event: string, payload: unknown) {
    this.socketService.emitToDispatcher(dispatcherId, event, payload);
  }

  notifyAllDispatchers(event: string, payload: unknown) {
    this.socketService.emitToAllDispatchers(event, payload);
  }
}

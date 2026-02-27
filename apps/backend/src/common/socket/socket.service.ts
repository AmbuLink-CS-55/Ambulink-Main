import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class SocketService {
  public driverServer: Server | null = null;
  public patientServer: Server | null = null;
  public dispatcherServer: Server | null = null;

  emitToDriver(driverId: string, event: string, payload: unknown) {
    if (!this.driverServer) {
      console.warn(`[SocketService] DriverServer not initialized yet! Event ${event} dropped.`);
      return;
    }
    this.driverServer.to(`driver:${driverId}`).emit(event, payload);
  }

  emitToPatient(patientId: string, event: string, payload: unknown) {
    if (!this.patientServer) {
      return;
    }
    this.patientServer.to(`patient:${patientId}`).emit(event, payload);
  }

  emitToDispatcher(dispatcherId: string, event: string, payload: unknown) {
    if (!this.dispatcherServer) {
      console.warn(`[SocketService] dispatcherServer not initialized yet! Event ${event} dropped.`);
      return;
    }
    this.dispatcherServer.to(`dispatcher:${dispatcherId}`).emit(event, payload);
  }

  emitToAllDispatchers(event: string, payload: unknown) {
    if (!this.dispatcherServer) {
      console.warn(`[SocketService] dispatcherServer not initialized yet! Event ${event} dropped.`);
      return;
    }
    this.dispatcherServer.emit(event, payload);
  }
}

import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class SocketService {
  public driverServer: Server | null = null;
  public patientServer: Server | null = null;
  public dispatcherServer: Server | null = null;

  emitToDriver(driverId: string, event: string, payload: any) {
    if (!this.driverServer) {
      console.warn(
        `[SocketService] DriverServer not initialized yet! Event ${event} dropped.`
      );
      return;
    }
    this.driverServer.to(`driver:${driverId}`).emit(event, payload);
  }

  emitToPatient(patientId: string, event: string, payload: any) {
    if (!this.patientServer) {
      console.warn(
        `[SocketService] PatientServer not initialized yet! Event ${event} dropped.`
      );
      return;
    }
    this.patientServer.to(`patient:${patientId}`).emit(event, payload);
  }

  emitToDispatcher(dispatcherId: string, event: string, payload: any) {
    if (!this.dispatcherServer) {
      console.warn(
        `[SocketService] dispatcherServer not initialized yet! Event ${event} dropped.`
      );
      return;
    }
    console.log("emited", dispatcherId, "events:", event, payload)
    this.dispatcherServer.to(`dispatcher:${dispatcherId}`).emit(event, payload);
  }
}

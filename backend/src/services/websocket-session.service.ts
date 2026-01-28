import { Global, Injectable } from "@nestjs/common";
import { Socket } from "socket.io";

@Global()
@Injectable()
export class WebsocketSessionService {
  private driverSockets = new Map<string, Socket>();
  private patientSockets = new Map<string, Socket>();

  setDriverSocket(driverId: string, socket: Socket): void {
    this.driverSockets.set(driverId, socket);
  }

  getDriverSocket(driverId: string): Socket | undefined {
    return this.driverSockets.get(driverId);
  }

  removeDriverSocket(driverId: string): boolean {
    return this.driverSockets.delete(driverId);
  }

  setPatientSocket(patientId: string, socket: Socket): void {
    this.patientSockets.set(patientId, socket);
  }

  getPatientSocket(patientId: string): Socket | undefined {
    return this.patientSockets.get(patientId);
  }

  removePatientSocket(patientId: string): boolean {
    return this.patientSockets.delete(patientId);
  }

  clear(): void {
    this.driverSockets.clear();
    this.patientSockets.clear();
  }
}

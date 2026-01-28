import { Injectable, Scope } from "@nestjs/common";
import { Server, ServerOptions, Socket } from "socket.io";

@Injectable({ scope: Scope.DEFAULT })
export class SocketService {
  static id = Math.random()
  public driverServer: Server;
  public patientServer: Server;

  initPatientServer(server: Server) {
    this.patientServer = server;
  }

  initDriverServer(server: Server) {
    this.driverServer = server;
  }

  getDriverServer() {
    if (this.driverServer != null) {
      return this.driverServer
    }
  }

  sendDriverMessage(driverId: string, event: string, message: any) {
    this.driverServer.emit(event, { message });
  }

  sendPatientMessage(patientId: string, event: string, message: any) {
    this.patientServer.emit(event, { message });
  }

}

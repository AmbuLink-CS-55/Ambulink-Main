import { Injectable } from '@nestjs/common';
import { ConnectableObservable } from 'rxjs';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  public driverServer: Server | null = null;
  public patientServer: Server | null = null;

  emitToDriver(driverId: string, event: string, payload: any) {
    if (!this.driverServer) {
      console.warn(`[SocketService] DriverServer not initialized yet! Event ${event} dropped.`);
      return;
    }
    if (this.driverServer) {
      this.driverServer.to(`driver:${driverId}`).emit(event, payload);
    } else {
      console.log('Driver server not initialized');
    }
  }
  emitToPatient(patientId: string, event: string, payload: any) {
    if (!this.patientServer) {
      console.warn(`[SocketService] PatientServer not initialized yet! Event ${event} dropped.`);
      return;
    }
    if (this.patientServer) {
      this.patientServer.to(`patient:${patientId}`).emit(event, payload);
    } else {
      console.log('Patient server not initialized');
    }
  }
}

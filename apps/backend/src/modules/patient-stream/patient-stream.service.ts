import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";
import { MessageEvent } from "@nestjs/common";

type ClientConnection = {
  stream: Subject<MessageEvent>;
  heartbeat: NodeJS.Timeout;
};

@Injectable()
export class PatientStreamService {
  private readonly patients = new Map<string, Map<string, ClientConnection>>();

  createConnection(patientId: string) {
    const clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const stream = new Subject<MessageEvent>();

    const heartbeat = setInterval(() => {
      stream.next({
        type: "heartbeat",
        data: { ts: Date.now() },
      });
    }, 20000);

    const clients = this.patients.get(patientId) ?? new Map<string, ClientConnection>();
    clients.set(clientId, { stream, heartbeat });
    this.patients.set(patientId, clients);

    stream.next({
      type: "connected",
      data: { patientId },
    });

    const close = () => {
      const currentClients = this.patients.get(patientId);
      const connection = currentClients?.get(clientId);
      if (connection) {
        clearInterval(connection.heartbeat);
        connection.stream.complete();
      }
      currentClients?.delete(clientId);
      if (currentClients && currentClients.size === 0) {
        this.patients.delete(patientId);
      }
    };

    return {
      stream$: stream.asObservable(),
      close,
    };
  }

  emitToPatient(patientId: string, event: string, data: unknown) {
    const clients = this.patients.get(patientId);
    if (!clients || clients.size === 0) return;

    clients.forEach(({ stream }) => {
      stream.next({
        type: event,
        data: this.normalizeData(data),
      });
    });
  }

  private normalizeData(data: unknown): string | object {
    if (typeof data === "string") return data;
    if (data && typeof data === "object") return data;
    return { value: data };
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import { io, type Socket } from "socket.io-client";

export type ScenarioActor = "patient" | "driver" | "dispatcher" | "emt" | "system";
export type ScenarioChannel = "http" | "socket";

export type ScenarioEventRecord = {
  ts: string;
  actor: ScenarioActor;
  channel: ScenarioChannel;
  event: string;
  payload: unknown;
};

export type ScenarioExpectationResult = {
  name: string;
  pass: boolean;
  diagnostics?: string;
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ScenarioTimeline {
  private readonly records: ScenarioEventRecord[] = [];

  add(record: Omit<ScenarioEventRecord, "ts">) {
    this.records.push({ ...record, ts: new Date().toISOString() });
  }

  has(actor: ScenarioActor, event: string) {
    return this.records.some((record) => record.actor === actor && record.event === event);
  }

  get all() {
    return this.records;
  }

  async flush(filename: string) {
    const logDir = process.env.SCENARIO_LOG_DIR ?? path.resolve(process.cwd(), "test-results/scenario");
    await fs.mkdir(logDir, { recursive: true });
    const fullPath = path.join(logDir, filename);
    await fs.writeFile(fullPath, JSON.stringify(this.records, null, 2), "utf8");
    return fullPath;
  }
}

type SocketActor = "patient" | "driver" | "dispatcher" | "emt";

export function connectActorSocket(baseUrl: string, actor: SocketActor, actorId: string) {
  const namespace =
    actor === "patient"
      ? "/patient"
      : actor === "driver"
        ? "/driver"
        : actor === "dispatcher"
          ? "/dispatcher"
          : "/emt";
  const key =
    actor === "patient"
      ? "patientId"
      : actor === "driver"
        ? "driverId"
        : actor === "dispatcher"
          ? "dispatcherId"
          : "emtId";
  const socket = io(`${baseUrl}${namespace}`, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    auth: { [key]: actorId },
  });
  return socket;
}

export async function waitForSocketConnected(socket: Socket, timeoutMs = 8000) {
  if (socket.connected) return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Socket connect timeout for ${socket.nsp}`));
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timer);
      resolve();
    });

    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function closeSockets(sockets: Socket[]) {
  for (const socket of sockets) {
    if (socket.connected) {
      socket.disconnect();
    }
  }
  await delay(50);
}

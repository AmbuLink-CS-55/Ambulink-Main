import { Server, Socket } from "socket.io";
import { OnModuleDestroy } from "@nestjs/common";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { SocketService } from "@/core/socket/socket.service";
import {
  emtAddNotePayloadSchema,
  emtSubscribePayloadSchema,
} from "@/common/validation/socket.schemas";
import type { SocketErrorPayload } from "@ambulink/types";
import { EmtEventsService } from "./emt.events.service";
import { EmtEventsCommandService } from "./emt.events-command.service";
import { verifyAuthToken } from "@/common/auth/auth-token";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/emt",
})
export class EmtEventsGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private isShuttingDown = false;

  constructor(
    private socketService: SocketService,
    private emtEventsService: EmtEventsService,
    private emtCommandService: EmtEventsCommandService
  ) {}

  afterInit() {
    this.socketService.emtServer = this.server;
    console.log("[socket] gateway_ready", {
      namespace: "/emt",
    });
  }

  async handleConnection(client: Socket) {
    console.log("[socket] connection_attempt", {
      namespace: "/emt",
      clientId: client.id,
    });

    let emtId: string;
    try {
      emtId = this.extractSocketActorId(client, "emtId");
    } catch {
      console.warn("[socket] missing_auth", {
        namespace: "/emt",
        clientId: client.id,
      });
      return client.disconnect(true);
    }

    client.data.emtId = emtId;
    try {
      this.clearPendingOffline(emtId);
      client.join(`emt:${emtId}`);
      await this.emtEventsService.setStatus(emtId, "AVAILABLE");

      const bookingPayload = await this.emtEventsService.getCurrentBooking(emtId);
      if (bookingPayload) {
        client.emit("booking:assigned", bookingPayload);
      }
    } catch (error) {
      console.warn("[socket] invalid_emt_connection", {
        namespace: "/emt",
        clientId: client.id,
        emtId,
        message: error instanceof Error ? error.message : "Invalid EMT connection",
      });
      return client.disconnect(true);
    }

    console.log("[socket] connected", {
      namespace: "/emt",
      clientId: client.id,
      emtId,
    });
  }

  handleDisconnect(client: Socket) {
    if (this.isShuttingDown) {
      return;
    }
    const emtId = client.data.emtId as string | undefined;
    if (emtId) {
      this.scheduleOfflineIfStillDisconnected(emtId);
    }

    console.log("[socket] disconnected", {
      namespace: "/emt",
      clientId: client.id,
      emtId,
    });
  }

  @SubscribeMessage("emt:subscribe")
  async subscribe(client: Socket, data: { bookingId: string }) {
    const parsed = emtSubscribePayloadSchema.safeParse(data);
    if (!parsed.success) {
      client.emit("socket:error", {
        code: "VALIDATION_ERROR",
        message: "Invalid subscribe payload",
      } satisfies SocketErrorPayload);
      return;
    }

    try {
      await this.emtCommandService.subscribe(client.data.emtId, parsed.data.bookingId);
    } catch (error) {
      client.emit("socket:error", {
        code: "SUBSCRIBE_FAILED",
        message: error instanceof Error ? error.message : "Failed to subscribe",
      } satisfies SocketErrorPayload);
    }
  }

  @SubscribeMessage("emt:note:add")
  async addNote(client: Socket, data: { bookingId: string; content: string }) {
    const parsed = emtAddNotePayloadSchema.safeParse(data);
    if (!parsed.success) {
      client.emit("socket:error", {
        code: "VALIDATION_ERROR",
        message: "Invalid EMT note payload",
      } satisfies SocketErrorPayload);
      return;
    }

    try {
      await this.emtCommandService.addNote({
        emtId: client.data.emtId,
        bookingId: parsed.data.bookingId,
        content: parsed.data.content,
        files: [],
      });
    } catch (error) {
      client.emit("socket:error", {
        code: "NOTE_ADD_FAILED",
        message: error instanceof Error ? error.message : "Failed to add note",
      } satisfies SocketErrorPayload);
    }
  }

  private extractSocketActorId(
    client: Socket,
    key: "emtId"
  ) {
    const accessToken =
      typeof client.handshake.auth?.accessToken === "string"
        ? client.handshake.auth.accessToken
        : typeof client.handshake.query?.accessToken === "string"
          ? client.handshake.query.accessToken
          : null;
    if (!accessToken) {
      throw new Error("accessToken is required");
    }
    const payload = verifyAuthToken(accessToken);
    if (!payload || payload.role !== "EMT") {
      throw new Error("Invalid socket access token");
    }

    const authValue = client.handshake.auth?.[key];
    const queryValue = client.handshake.query?.[key];
    const providedValue =
      typeof authValue === "string"
        ? authValue
        : typeof queryValue === "string"
          ? queryValue
          : null;

    if (providedValue && providedValue !== payload.sub) {
      throw new Error("Socket actor mismatch");
    }

    return payload.sub;
  }

  private clearPendingOffline(emtId: string) {
    const timer = this.offlineTimers.get(emtId);
    if (timer) {
      clearTimeout(timer);
      this.offlineTimers.delete(emtId);
    }
  }

  private scheduleOfflineIfStillDisconnected(emtId: string) {
    this.clearPendingOffline(emtId);

    const timer = setTimeout(async () => {
      if (this.isShuttingDown) {
        this.offlineTimers.delete(emtId);
        return;
      }
      try {
        const activeSockets = await this.server.in(`emt:${emtId}`).fetchSockets();
        if (activeSockets.length === 0) {
          await this.emtEventsService.setStatus(emtId, "OFFLINE");
        }
      } finally {
        this.offlineTimers.delete(emtId);
      }
    }, 10000);

    this.offlineTimers.set(emtId, timer);
  }

  onModuleDestroy() {
    this.isShuttingDown = true;
    for (const timer of this.offlineTimers.values()) {
      clearTimeout(timer);
    }
    this.offlineTimers.clear();
  }
}

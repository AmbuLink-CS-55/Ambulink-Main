import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { env } from "../../../env";
import { useAuthStore } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export class SocketClientCreator {
  static patientSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/patient`;
  static driverSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/driver`;
  static emtSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/emt`;

  private static instances: Record<string, Socket> = {};

  static async getSocket(params: {
    type: "PATIENT" | "DRIVER" | "EMT";
    actorId?: string;
    accessToken?: string | null;
  }): Promise<Socket> {
    const { type, actorId, accessToken } = params;
    const cacheKey = `${type}:${actorId ?? "default"}`;

    let url: string;
    let authPayload: Record<string, string> = {};
    // const userId = await getData("userId");

    switch (type) {
      case "PATIENT":
        if (!accessToken) {
          throw new Error("Missing authenticated patient token");
        }
        url = this.patientSocketUrl;
        authPayload = { accessToken };
        break;
      case "DRIVER":
        if (!actorId) {
          throw new Error("Missing authenticated driver id");
        }
        if (!accessToken) {
          throw new Error("Missing authenticated driver token");
        }
        url = this.driverSocketUrl;
        authPayload = { driverId: actorId, accessToken };
        break;
      case "EMT":
        if (!actorId) {
          throw new Error("Missing authenticated EMT id");
        }
        if (!accessToken) {
          throw new Error("Missing authenticated EMT token");
        }
        url = this.emtSocketUrl;
        authPayload = { emtId: actorId, accessToken };
        break;
      default:
        throw Error("Socket type not defined");
    }

    const existing = this.instances[cacheKey];
    if (existing) {
      existing.auth = authPayload;
      if (!existing.connected) {
        existing.connect();
      }
      return existing;
    }

    const instance = io(url, {
      transports: ["websocket"],
      auth: authPayload,
      reconnection: true,
      reconnectionAttempts: Infinity,
      autoConnect: true,
      timeout: 10000,
      // Enable exponential backoff retry with jitter.
      reconnectionDelay: 500,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });

    instance.on("connect", () => {
      console.log("[socket] connected", {
        url,
        type,
      });
    });

    instance.on("connect_error", (error) => {
      console.error("[socket] connect_error", {
        error,
        url,
        type,
        message: error?.message,
      });
    });

    instance.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", {
        url,
        type,
        reason,
      });
    });

    instance.io.on("reconnect_attempt", (attempt) => {
      const nextDelay = Math.min(500 * Math.pow(2, Math.max(attempt - 1, 0)), 30000);
      console.info("[socket] reconnect_attempt", {
        url,
        type,
        attempt,
        nextDelayMs: nextDelay,
      });
    });

    this.instances[cacheKey] = instance;
    return instance;
  }

  static disconnectType(type: "PATIENT" | "DRIVER" | "EMT") {
    Object.entries(this.instances).forEach(([key, instance]) => {
      if (!key.startsWith(`${type}:`)) return;
      instance.disconnect();
      delete this.instances[key];
    });
  }
}

export const SocketProvider = ({
  type,
  enabled = true,
  children,
}: {
  type: "PATIENT" | "DRIVER" | "EMT";
  enabled?: boolean;
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.session?.accessToken ?? null);

  useEffect(() => {
    if (!enabled) {
      SocketClientCreator.disconnectType(type);
      setSocket(null);
      return;
    }

    let isMounted = true;
    const actorId =
      type === "DRIVER" || type === "EMT"
        ? user?.id
        : undefined;

    const init = async () => {
      const instance = await SocketClientCreator.getSocket({ type, actorId, accessToken });
      console.info("[socket] Initializing connection:", { type });
      if (isMounted) {
        setSocket(instance);
      }
    };

    init().catch((error) => {
      console.warn("[socket] failed to initialize", { type, error });
      if (isMounted) {
        setSocket(null);
      }
    });

    return () => {
      isMounted = false;
      // socket.disconnect(); kill when leaving the group
    };
  }, [accessToken, enabled, type, user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);

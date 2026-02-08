import { io, Socket } from "socket.io-client";
import { getData } from "./settingsStorage";
import env from "../../env";

export class SocketClientCreator {
  static patientSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/patient`;
  static driverSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/driver`;
  static emtSocketUrl = `${env.EXPO_PUBLIC_WS_SERVER_URL}/emt`;

  private static instance: Socket | null = null;

  static async getSocket(type: "PATIENT" | "DRIVER" | "EMT"): Promise<Socket> {
    if (this.instance?.connected) {
      return this.instance;
    }

    let url: string;
    let authPayload: Record<string, string> = {};
    // const userId = await getData("userId");

    switch (type) {
      case "PATIENT":
        url = this.patientSocketUrl;
        authPayload = { patientId: env.EXPO_PUBLIC_PATIENT_ID };
        break;
      case "DRIVER":
        url = this.driverSocketUrl;
        authPayload = { driverId: env.EXPO_PUBLIC_DRIVER_ID };
        break;
      case "EMT":
        url = this.emtSocketUrl;
        authPayload = { emtId: env.EXPO_PUBLIC_EMT_ID };
        break;
      default:
        throw Error("Socket type not defined");
    }

    this.instance = io(url, {
      transports: ['websocket'],
      auth: authPayload,
      reconnection: true,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    });

    this.instance.on("connect", () => {
      console.log("[socket] connected", {
        url,
        type,
      });
    });

    this.instance.on("connect_error", (error) => {
      console.error("[socket] connect_error", {
        url,
        type,
        message: error?.message,
      });
    });

    this.instance.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", {
        url,
        type,
        reason,
      });
    });

    this.instance.io.on("reconnect_attempt", (attempt) => {
      console.info("[socket] reconnect_attempt", {
        url,
        type,
        attempt,
      });
    });

    return this.instance;
  }
}

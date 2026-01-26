import { io, Socket } from "socket.io-client";
import { getData } from "./storage/settingsStorage";

export class SocketClientCreator {
  static patientSocketUrl = "ws://192.168.1.5:3000/patient";
  static driverSocketUrl = "ws://192.168.1.5:3000/driver";
  static emtSocketUrl = "ws://192.168.1.5:3000/emt";

  private static instance: Socket | null = null;

  static async getSocket(type: "PATIENT" | "DRIVER" | "EMT"): Promise<Socket> {
    if (this.instance?.connected) {
      return this.instance;
    }

    let url: string;
    let authPayload: Record<string, string> = {};
    const userId = await getData("cduserId");

    switch (type) {
      case "PATIENT":
        url = this.patientSocketUrl;
        authPayload = { patientId: "84821041-9f8a-4358-a390-a50f1a712a49" };
        break;
      case "DRIVER":
        url = this.driverSocketUrl;
        authPayload = { driverId: "97433a7e-59f4-47df-bf13-43d695ada71e" };
        break;
      case "EMT":
        url = this.emtSocketUrl;
        authPayload = { emtId: userId || "1" };
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

    return this.instance;
  }
}

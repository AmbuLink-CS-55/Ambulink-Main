import { io, Socket } from "socket.io-client";
import { getData } from "./storage/settingsStorage";

export class SocketClientCreator {
  static patientSocketUrl = "ws://192.168.1.5:3000/patient";
  static driverSocketUrl = "ws://192.168.1.5:3000/driver";
  static emtSocketUrl = "ws://192.168.1.5:3000/emt";

  static async createSocket(type: "PATIENT" | "DRIVER" | "EMT") {
    let url: string;
    let authPayload: Record<string, string> = {};
    const userId = await getData("userId")
    switch (type) {
      case "PATIENT":
        url = this.patientSocketUrl;
        authPayload = { patientId: "1" };
        break;
      case "DRIVER":
        url = this.driverSocketUrl;
        authPayload = { driverId: "1" };
        break;
      case "EMT":
        url = this.emtSocketUrl;
        authPayload = { emtId: userId };
        break;
      default:
        throw Error("Socket type not defined");
    }
    console.log("socket connecting", authPayload)

    return io(url, {
      transports: ['websocket'],
      auth: authPayload,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });
  }
}

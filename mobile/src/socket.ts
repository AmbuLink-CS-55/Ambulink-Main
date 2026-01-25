import { io, Socket } from "socket.io-client";


export class SocketClientCreator {
  // change the url according to your IP
  static patientSocketUrl = "ws://192.168.1.5:3000/patient"
  static driverSocketUrl = "ws://192.168.1.5:3000/driver"

  static createSocket(type: "PATIENT" | "DRIVER") {
    let url: string
    if (type === "PATIENT") {
      url = this.patientSocketUrl
    }else if (type === "DRIVER") {
      url = this.driverSocketUrl
    }else {
      throw Error("Socket type not defined")
    }
    const socket = io(url, {
      transports: ['websocket'],
      auth: {
        patientId: "1"
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    return socket;
  }
}

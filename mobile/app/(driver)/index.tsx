import { SocketClientCreator } from "@/src/socket";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Socket } from "socket.io-client";

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRide, setCurrentRide] = useState();

  useEffect(() => {
    const initSocket = async () => {
      try {
        console.log("creating socket")
        const socketInstance = await SocketClientCreator.createSocket("DRIVER");

        socketInstance.on("connect", () => {
          console.log("ws Connected", socketInstance.id);
        });
        socketInstance.on("message", (msg: string) => {
          console.log(msg);
        });
        setSocket(socketInstance);
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initSocket();
  }, []);

  return (
    <SafeAreaView>
    </SafeAreaView>
  );
}

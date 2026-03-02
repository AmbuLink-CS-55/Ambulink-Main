import { Global, Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { NotificationService } from "./notification.service";

@Global()
@Module({
  providers: [SocketService, NotificationService],
  exports: [SocketService, NotificationService],
})
export class SocketModule {}

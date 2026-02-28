import { Global, Module } from "@nestjs/common";
import { DomainEventsService } from "./domain-events.service";
import { RealtimeNotifierService } from "./realtime-notifier.service";
import { SocketNotificationListener } from "./socket-notification.listener";

@Global()
@Module({
  providers: [DomainEventsService, RealtimeNotifierService, SocketNotificationListener],
  exports: [DomainEventsService, RealtimeNotifierService],
})
export class EventsModule {}

import { Global, Module } from "@nestjs/common";
import { EventBusService } from "./event-bus.service";
import { RealtimeEventsHandler } from "./realtime-events.handler";

@Global()
@Module({
  providers: [EventBusService, RealtimeEventsHandler],
  exports: [EventBusService],
})
export class EventsModule {}

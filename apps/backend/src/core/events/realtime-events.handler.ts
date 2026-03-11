import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { Subscription } from "rxjs";
import { SocketService } from "@/core/socket/socket.service";
import { EventBusService } from "./event-bus.service";

@Injectable()
export class RealtimeEventsHandler implements OnModuleInit, OnModuleDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private eventBus: EventBusService,
    private socketService: SocketService
  ) {}

  onModuleInit() {
    this.subscriptions = [
      this.eventBus.on("realtime.dispatcher").subscribe((event) => {
        this.socketService.emitToDispatcher(event.dispatcherId, event.event, event.payload);
      }),
      this.eventBus.on("realtime.dispatchers").subscribe((event) => {
        this.socketService.emitToAllDispatchers(event.event, event.payload);
      }),
      this.eventBus.on("realtime.driver").subscribe((event) => {
        this.socketService.emitToDriver(event.driverId, event.event, event.payload);
      }),
      this.eventBus.on("realtime.patient").subscribe((event) => {
        this.socketService.emitToPatient(event.patientId, event.event, event.payload);
      }),
      this.eventBus.on("realtime.emt").subscribe((event) => {
        this.socketService.emitToEmt(event.emtId, event.event, event.payload);
      }),
    ];
  }

  onModuleDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

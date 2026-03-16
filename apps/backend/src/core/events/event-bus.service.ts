import { Injectable } from "@nestjs/common";
import { Subject, filter } from "rxjs";
import type { Observable } from "rxjs";
import type { DomainEvent } from "./realtime.events";

@Injectable()
export class EventBusService {
  private readonly stream = new Subject<DomainEvent>();

  publish<T extends DomainEvent>(event: T) {
    this.stream.next(event);
  }

  on<TType extends DomainEvent["type"]>(type: TType): Observable<Extract<DomainEvent, { type: TType }>> {
    return this.stream.pipe(
      filter((event): event is Extract<DomainEvent, { type: TType }> => event.type === type)
    );
  }
}

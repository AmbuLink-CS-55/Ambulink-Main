export type RealtimeEvent =
  | {
      type: "realtime.dispatcher";
      dispatcherId: string;
      event: string;
      payload: unknown;
    }
  | {
      type: "realtime.dispatchers";
      event: string;
      payload: unknown;
    }
  | {
      type: "realtime.driver";
      driverId: string;
      event: string;
      payload: unknown;
    }
  | {
      type: "realtime.patient";
      patientId: string;
      event: string;
      payload: unknown;
    }
  | {
      type: "realtime.emt";
      emtId: string;
      event: string;
      payload: unknown;
    };

export type DomainEvent = RealtimeEvent;

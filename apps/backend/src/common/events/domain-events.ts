export const DOMAIN_EVENT_NOTIFY_DRIVER = "notify.driver";
export const DOMAIN_EVENT_NOTIFY_PATIENT = "notify.patient";
export const DOMAIN_EVENT_NOTIFY_DISPATCHER = "notify.dispatcher";
export const DOMAIN_EVENT_NOTIFY_ALL_DISPATCHERS = "notify.dispatchers.all";

export type DriverNotificationEvent = {
  driverId: string;
  event: string;
  payload: unknown;
};

export type PatientNotificationEvent = {
  patientId: string;
  event: string;
  payload: unknown;
};

export type DispatcherNotificationEvent = {
  dispatcherId: string;
  event: string;
  payload: unknown;
};

export type BroadcastDispatcherNotificationEvent = {
  event: string;
  payload: unknown;
};

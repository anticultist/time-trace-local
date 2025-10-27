export type EventName =
  | "boot"
  | "shutdown"
  | "logon"
  | "logoff"
  | "standby_enter"
  | "standby_exit";

/**
 * Represents an event
 */
export interface Event {
  time: number;
  source: string;
  name: EventName;
  details: string;
}

/**
 * A service fetching events
 */
export interface EventService {
  readonly name: string;
  getEvents(eventNames?: EventName[], startDate?: Date): Promise<Event[]>;
}

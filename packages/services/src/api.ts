export type EventType =
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
  type: EventType;
  details: string;
}

/**
 * A service fetching events
 */
export interface EventService {
  readonly name: string;
  isSupported(): boolean;
  getEvents(eventNames?: EventType[], startDate?: Date): Promise<Event[]>;
}

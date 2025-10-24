/**
 * Represents an event
 */
export interface Event {
  time: number;
  type: string;
  details: string;
}

/**
 * A service fetching events
 */
export interface EventService {
  isSupported(): boolean;
  getEvents(eventNames?: string[], startDate?: Date): Promise<Event[]>;
}

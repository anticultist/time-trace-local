/**
 * Represents a Windows event with simplified structure
 */
export interface Event {
  time: number;
  type: string;
  details: string;
}

export interface EventService {
  isSupported(): boolean;
  getEvents(eventNames?: string[], startDate?: Date): Promise<Event[]>;
}

import {
  ActivityEvent,
  BookableElement,
  EventMapping,
  EventSource,
  EventType,
} from './types.js';

/**
 * Service for managing activity events
 */
export class EventService {
  private events: ActivityEvent[] = [];

  /**
   * Add a new activity event
   */
  addEvent(event: Omit<ActivityEvent, 'id'>): ActivityEvent {
    const newEvent: ActivityEvent = {
      ...event,
      id: this.generateId(),
    };
    this.events.push(newEvent);
    return newEvent;
  }

  /**
   * Get events by source
   */
  getEventsBySource(source: EventSource): ActivityEvent[] {
    return this.events.filter((event) => event.source === source);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: EventType): ActivityEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(start: Date, end: Date): ActivityEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= start && event.timestamp <= end
    );
  }

  /**
   * Get all events
   */
  getAllEvents(): ActivityEvent[] {
    return [...this.events];
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Service for managing bookable elements
 */
export class BookableElementService {
  private elements: BookableElement[] = [];

  /**
   * Create a new bookable element
   */
  createElement(
    element: Omit<BookableElement, 'id' | 'createdAt' | 'updatedAt'>
  ): BookableElement {
    const now = new Date();
    const newElement: BookableElement = {
      ...element,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.elements.push(newElement);
    return newElement;
  }

  /**
   * Update an existing bookable element
   */
  updateElement(
    id: string,
    updates: Partial<BookableElement>
  ): BookableElement | null {
    const index = this.elements.findIndex((element) => element.id === id);
    if (index === -1) {
      return null;
    }

    this.elements[index] = {
      ...this.elements[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.elements[index];
  }

  /**
   * Get all bookable elements
   */
  getAllElements(): BookableElement[] {
    return [...this.elements];
  }

  /**
   * Get element by ID
   */
  getElementById(id: string): BookableElement | null {
    return this.elements.find((element) => element.id === id) || null;
  }

  private generateId(): string {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Service for managing event to bookable element mappings
 */
export class MappingService {
  private mappings: EventMapping[] = [];

  /**
   * Create a new mapping
   */
  createMapping(mapping: Omit<EventMapping, 'id' | 'createdAt'>): EventMapping {
    const newMapping: EventMapping = {
      ...mapping,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.mappings.push(newMapping);
    return newMapping;
  }

  /**
   * Get mappings for an event
   */
  getMappingsForEvent(eventId: string): EventMapping[] {
    return this.mappings.filter((mapping) => mapping.eventId === eventId);
  }

  /**
   * Get mappings for a bookable element
   */
  getMappingsForElement(bookableElementId: string): EventMapping[] {
    return this.mappings.filter(
      (mapping) => mapping.bookableElementId === bookableElementId
    );
  }

  /**
   * Get all mappings
   */
  getAllMappings(): EventMapping[] {
    return [...this.mappings];
  }

  private generateId(): string {
    return `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

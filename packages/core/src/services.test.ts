import { describe, expect, it } from 'vitest';
import { EventService, EventSource, EventType } from '../src/index.js';

describe('EventService', () => {
  it('should add and retrieve events', () => {
    const eventService = new EventService();

    const event = eventService.addEvent({
      timestamp: new Date(),
      source: EventSource.GIT,
      type: EventType.COMMIT,
      data: { message: 'Initial commit' },
    });

    expect(event.id).toBeDefined();
    expect(event.source).toBe(EventSource.GIT);
    expect(event.type).toBe(EventType.COMMIT);

    const allEvents = eventService.getAllEvents();
    expect(allEvents).toHaveLength(1);
    expect(allEvents[0]).toEqual(event);
  });

  it('should filter events by source', () => {
    const eventService = new EventService();

    eventService.addEvent({
      timestamp: new Date(),
      source: EventSource.GIT,
      type: EventType.COMMIT,
      data: {},
    });

    eventService.addEvent({
      timestamp: new Date(),
      source: EventSource.JIRA,
      type: EventType.TICKET_CREATED,
      data: {},
    });

    const gitEvents = eventService.getEventsBySource(EventSource.GIT);
    expect(gitEvents).toHaveLength(1);
    expect(gitEvents[0].source).toBe(EventSource.GIT);
  });
});

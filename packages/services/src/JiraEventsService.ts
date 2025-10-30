import type { Event, EventService, EventName } from "./api";

export class JiraEventsService implements EventService {
  constructor(
    private jiraBase: string,
    private email: string,
    private apiToken: string
  ) {}

  public get name(): string {
    return "jira";
  }

  public isActive(): boolean {
    // TODO
    return false;
  }

  public async getEvents(
    eventNames: EventName[] = [],
    startDate?: Date
  ): Promise<Event[]> {
    // TODO
    return [];
  }
}

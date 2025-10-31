import * as vscode from "vscode";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import {
  WindowsEventsService,
  MacEventsService,
  JiraEventsService,
  Event,
  EventService,
} from "@time-trace-local/services";
import { runMigrations } from "./db";
import { events, dbProperties, PropertyType } from "./db/schema";
import { and, eq, gte } from "drizzle-orm";
import * as fs from "node:fs";
import { ConfigurationManager } from "./ConfigurationManager";

export class EventRepository {
  private readonly db: LibSQLDatabase;
  private readonly eventServices: EventService[] = [
    new WindowsEventsService(),
    new MacEventsService(),
  ];

  constructor(
    private readonly globalStorageUri: vscode.Uri,
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {
    // Ensure the globalStorage directory exists before creating the database
    const storageDir = this.globalStorageUri.fsPath;
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const dbPath = vscode.Uri.joinPath(this.globalStorageUri, "events.db");
    this.db = drizzle({ connection: { url: `file:${dbPath.fsPath}` } });
  }

  public async initialize(): Promise<void> {
    try {
      await runMigrations(this.db, this.extensionUri);
      console.log("Database initialized successfully");

      // Initialize Jira service if configured
      await this.initializeJiraService();
    } catch (error) {
      console.error("Failed to initialize database:", error);
      vscode.window.showErrorMessage(
        `Failed to initialize Time Trace database: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async initializeJiraService(): Promise<void> {
    try {
      const jiraConfig = await ConfigurationManager.getJiraConfig(this.context);

      if (jiraConfig) {
        const jiraService = new JiraEventsService(
          jiraConfig.baseUrl,
          jiraConfig.email,
          jiraConfig.apiToken
        );

        // Remove any existing Jira service to avoid duplicates
        const jiraIndex = this.eventServices.findIndex(
          (service) => service.name === "jira"
        );
        if (jiraIndex !== -1) {
          this.eventServices.splice(jiraIndex, 1);
        }

        this.eventServices.push(jiraService);
        console.log("Jira Events Service initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize Jira service:", error);
      // Don't throw - allow the app to continue without Jira
    }
  }

  public async getAllEvents(): Promise<Event[]> {
    const events: Event[] = [];
    await Promise.all(
      this.eventServices.map(async (service) => {
        events.push(...(await this.getEventsForService(service)));
      })
    );
    return events;
  }

  private async saveEventsToDatabase(newEvents: Event[]): Promise<void> {
    if (newEvents.length === 0) {
      return;
    }

    try {
      // Filter out duplicates by checking existing events with same time and type
      const uniqueEvents: Event[] = [];

      for (const event of newEvents) {
        const existingEvent = await this.db
          .select()
          .from(events)
          .where(
            and(
              eq(events.time, new Date(event.time)),
              eq(events.name, event.name)
            )
          )
          .limit(1);

        if (existingEvent.length === 0) {
          uniqueEvents.push(event);
        }
      }

      if (uniqueEvents.length === 0) {
        console.log("No new events to insert (all were duplicates)");
        return;
      }

      // Insert all unique events in a batch
      await this.db.insert(events).values(
        uniqueEvents.map((event) => ({
          time: new Date(event.time),
          source: event.source,
          name: event.name,
          details: event.details,
        }))
      );
      console.log(`Inserted ${uniqueEvents.length} new events into database`);
    } catch (error) {
      console.error("Failed to save events to database:", error);
      vscode.window.showErrorMessage(
        `Failed to save events: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getLastFetchTime(
    serviceName: string
  ): Promise<Date | undefined> {
    try {
      const propertyName = `${serviceName}.lastFetchTime`;
      const result = await this.db
        .select()
        .from(dbProperties)
        .where(eq(dbProperties.name, propertyName))
        .limit(1);

      if (result.length > 0 && typeof result[0].value === "number") {
        return new Date(result[0].value);
      }
      return undefined;
    } catch (error) {
      console.error(`Failed to get last fetch time for ${serviceName}:`, error);
      return undefined;
    }
  }

  private async saveLastFetchTime(
    serviceName: string,
    timestamp: number
  ): Promise<void> {
    try {
      const propertyName = `${serviceName}.lastFetchTime`;

      // Check if property exists
      const existing = await this.db
        .select()
        .from(dbProperties)
        .where(eq(dbProperties.name, propertyName))
        .limit(1);

      if (existing.length > 0) {
        // Update existing property
        await this.db
          .update(dbProperties)
          .set({ value: timestamp })
          .where(eq(dbProperties.name, propertyName));
      } else {
        // Insert new property
        await this.db.insert(dbProperties).values({
          name: propertyName,
          type: PropertyType.Integer,
          value: timestamp,
        });
      }

      console.log(
        `Saved last fetch time for ${serviceName}: ${new Date(timestamp).toISOString()}`
      );
    } catch (error) {
      console.error(
        `Failed to save last fetch time for ${serviceName}:`,
        error
      );
    }
  }

  private async getStoredEvents(
    source: string,
    startDate: Date
  ): Promise<Event[]> {
    try {
      const storedEvents = await this.db
        .select()
        .from(events)
        .where(and(gte(events.time, startDate), eq(events.source, source)))
        .orderBy(events.time);

      return storedEvents.map((event) => ({
        time: event.time.getTime(),
        source: event.source,
        name: event.name,
        details: event.details,
      }));
    } catch (error) {
      console.error("Failed to retrieve stored events:", error);
      return [];
    }
  }

  private async getEventsForService(service: EventService): Promise<Event[]> {
    if (!service.isActive()) {
      return [];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lastFetchTime = await this.getLastFetchTime(service.name);
    const fetchStartDate = lastFetchTime || sevenDaysAgo;

    const newEvents: Event[] = await service.getEvents(
      undefined,
      fetchStartDate
    );
    console.log(`${service.name}: Fetched ${newEvents.length} new events`);

    await this.saveEventsToDatabase(newEvents);

    if (newEvents.length > 0) {
      const mostRecentEvent = newEvents.reduce((latest, event) => {
        return event.time > latest.time ? event : latest;
      }, newEvents[0]);
      await this.saveLastFetchTime(service.name, mostRecentEvent.time);
    }

    const allEvents = await this.getStoredEvents(service.name, sevenDaysAgo);
    console.log(
      `${service.name}: Returning ${allEvents.length} total events from DB`
    );

    return allEvents;
  }
}

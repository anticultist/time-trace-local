import { execFile } from "node:child_process";
import type { Event, EventService, EventType } from "./api";

/**
 * Raw event structure from macOS log show JSON output
 */
interface RawMacEvent {
  timestamp: string;
  eventMessage: string;
  processImagePath?: string;
  process?: string;
  subsystem?: string;
  category?: string;
  messageType?: string;
}

/**
 * MacOS event configuration
 */
export const MAC_EVENTS = [
  {
    eventName: "boot",
    predicate:
      'eventType == "timesyncEvent" AND eventMessage BEGINSWITH "=== system boot:"',
  },
  {
    eventName: "shutdown",
    predicate:
      'eventMessage CONTAINS "shutdown UNINITIALIZED -> COMMITTED" AND eventMessage CONTAINS "[Event: shutdown]"',
  },
  {
    eventName: "logon",
    predicate:
      'subsystem == "com.apple.loginwindow.logging" AND category == "KeyMilestone" AND eventMessage CONTAINS "login state: LoginComplete"',
  },
  {
    eventName: "logoff",
    predicate:
      'subsystem == "com.apple.loginwindow.logging" AND category == "KeyMilestone" AND (eventMessage CONTAINS "login state: Logout" OR eventMessage CONTAINS "login state: SessionEnd")',
  },
  {
    eventName: "standby_enter",
    predicate: 'process == "kernel" AND eventMessage == "PMRD: System Sleep"',
  },
  {
    eventName: "standby_exit",
    predicate: 'process == "kernel" AND eventMessage == "PMRD: System Wake"',
  },
] as const;

/**
 * Executes a command using execFile and returns stdout/stderr
 * @param command - The command to execute
 * @param args - Array of command arguments
 * @returns Promise resolving to stdout and stderr
 */
export function runCommand(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(
      command,
      args,
      {
        maxBuffer: 20 * 1024 * 1024,
        encoding: "utf8",
        timeout: 60000, // 60 second timeout to prevent hanging
      },
      (error, stdout, stderr) => {
        if (error) {
          // Attach streams to the error for better diagnostics
          error.stdout = stdout;
          error.stderr = stderr;
          reject(
            error instanceof Error ? error : new Error(JSON.stringify(error))
          );
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

/**
 * Service for querying macOS unified logging system
 */
export class MacEventsService implements EventService {
  private static readonly DEFAULT_EVENT_NAMES: EventType[] = MAC_EVENTS.map(
    (event) => event.eventName
  );

  public get name(): string {
    return "mac";
  }

  public isSupported(): boolean {
    return process.platform === "darwin";
  }

  public async getEvents(
    eventNames: EventType[] = MacEventsService.DEFAULT_EVENT_NAMES,
    startDate?: Date
  ): Promise<Event[]> {
    if (!this.isSupported()) {
      return [];
    }

    // Validate event names
    const validEventNames: string[] = MAC_EVENTS.map((e) => e.eventName);
    const invalidNames = eventNames.filter(
      (name) => !validEventNames.includes(name)
    );
    if (invalidNames.length > 0) {
      throw new Error(
        `Invalid event names: ${invalidNames.join(", ")}. Valid names are: ${validEventNames.join(", ")}`
      );
    }

    const date =
      startDate ||
      (() => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek;
      })();

    const events: Event[] = [];

    // Query each event type separately for better performance and accuracy
    for (const eventName of eventNames) {
      const eventConfig = MAC_EVENTS.find((e) => e.eventName === eventName);
      if (!eventConfig) {
        continue;
      }

      try {
        // TODO: measure time taken for each query
        const eventResults = await this.queryEvents(
          eventConfig.predicate,
          eventName,
          date
        );
        events.push(...eventResults);
      } catch (err: any) {
        console.error(
          `Error querying macOS events for ${eventName}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    // Sort all events by time (most recent first)
    return events.sort((a, b) => b.time - a.time);
  }

  private async queryEvents(
    predicate: string,
    eventType: EventType,
    startDate: Date
  ): Promise<Event[]> {
    // Format date as YYYY-MM-DD HH:MM:SS for --start parameter
    // Using --start with specific date is much faster than --last Xd
    const startDateString = startDate
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

    const args = [
      "show",
      "--start",
      startDateString,
      "--style",
      "json",
      "--predicate",
      predicate,
    ];

    try {
      const { stdout } = await runCommand("log", args);

      // macOS log show with --style json outputs a JSON array (not JSONL)
      // Parse the entire output as one JSON array
      let rawEvents: RawMacEvent[] = [];
      try {
        const parsed = JSON.parse(stdout);
        if (Array.isArray(parsed)) {
          rawEvents = parsed;
        }
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }

      return this.convertRawEventsToEvents(rawEvents, eventType);
    } catch (err: any) {
      // If no events found, log command may return error
      // Return empty array instead of throwing
      if (err?.message?.includes("No matches found")) {
        return [];
      }
      throw err;
    }
  }

  public convertRawEventsToEvents(
    rawEvents: RawMacEvent[],
    eventType: EventType
  ): Event[] {
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents
      .map((rawEvent) => ({
        time: new Date(rawEvent.timestamp).getTime(),
        type: eventType,
        details: rawEvent.eventMessage || "No message",
      }))
      .sort((a, b) => b.time - a.time);
  }
}

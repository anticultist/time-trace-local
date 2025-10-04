import { execFile } from "child_process";
import type { Event } from "./types";
import { MAC_EVENTS } from "./types";

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
          (error as any).stdout = stdout;
          (error as any).stderr = stderr;
          reject(error);
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
export class MacEventsService {
  private static readonly DEFAULT_EVENT_NAMES = MAC_EVENTS.map(
    (event) => event.eventName
  );

  public static isSupported(): boolean {
    return process.platform === "darwin";
  }

  public static convertRawEventsToEvents(
    rawEvents: RawMacEvent[],
    eventType: string
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

  public static async getEvents(
    eventNames: string[] = MacEventsService.DEFAULT_EVENT_NAMES,
    startDate?: Date
  ): Promise<Event[]> {
    if (!MacEventsService.isSupported()) {
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
    const errors: Array<{ eventName: string; error: Error }> = [];

    // Query each event type separately for better performance and accuracy
    for (const eventName of eventNames) {
      const eventConfig = MAC_EVENTS.find((e) => e.eventName === eventName);
      if (!eventConfig) {
        continue;
      }

      try {
        const eventResults = await MacEventsService.queryEvents(
          eventConfig.predicate,
          eventName,
          date
        );
        events.push(...eventResults);
      } catch (err: any) {
        // Collect errors instead of logging them
        errors.push({
          eventName,
          error: err instanceof Error ? err : new Error(String(err)),
        });
        // Continue with other events even if one fails
      }
    }

    // Sort all events by time (most recent first)
    return events.sort((a, b) => b.time - a.time);
  }

  private static async queryEvents(
    predicate: string,
    eventType: string,
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

      return MacEventsService.convertRawEventsToEvents(rawEvents, eventType);
    } catch (err: any) {
      // If no events found, log command may return error
      // Return empty array instead of throwing
      if (err?.message?.includes("No matches found")) {
        return [];
      }
      throw err;
    }
  }
}

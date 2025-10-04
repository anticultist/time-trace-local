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
      },
      (error, stdout, stderr) => {
        if (error) {
          // Attach streams to the error for better diagnostics
          (error as any).stdout = stdout;
          (error as any).stderr = stderr;
          const reason =
            error instanceof Error
              ? error
              : new Error(
                  (typeof stderr === "string" && stderr.trim()) ||
                    (typeof (error as any)?.message === "string" &&
                      (error as any).message) ||
                    "Command failed"
                );
          reject(reason);
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

  public static convertRawEventsToEvents(rawEvents: RawMacEvent[]): Event[] {
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents
      .map((rawEvent) => {
        const eventType = MacEventsService.detectEventType(rawEvent);
        if (!eventType) {
          return null;
        }

        return {
          time: new Date(rawEvent.timestamp).getTime(),
          type: eventType,
          details: rawEvent.eventMessage || "No message",
        };
      })
      .filter((event): event is Event => event !== null)
      .sort((a, b) => b.time - a.time);
  }

  public static async getEvents(
    eventNames: string[] = MacEventsService.DEFAULT_EVENT_NAMES,
    startDate?: Date
  ): Promise<Event[]> {
    if (!MacEventsService.isSupported()) {
      return [];
    }

    const date =
      startDate ||
      (() => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 1);
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
        const eventResults = await MacEventsService.queryEvents(
          eventConfig.predicate,
          date
        );
        events.push(...eventResults);
      } catch (err: any) {
        const errorMessage = err?.stderr || err?.message || String(err);
        console.error(`Error querying ${eventName} events:`, errorMessage);
        // Continue with other events even if one fails
      }
    }

    // Sort all events by time (most recent first)
    return events.sort((a, b) => b.time - a.time);
  }

  private static async queryEvents(
    predicate: string,
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
        console.error(`Failed to parse JSON output: ${parseError}`);
        return [];
      }

      return MacEventsService.convertRawEventsToEvents(rawEvents);
    } catch (err: any) {
      // If no events found, log command may return error
      // Return empty array instead of throwing
      if (err?.message?.includes("No matches found")) {
        return [];
      }
      throw err;
    }
  }

  private static detectEventType(rawEvent: RawMacEvent): string | null {
    const message = rawEvent.eventMessage?.toLowerCase() || "";
    // Extract process name from processImagePath (e.g., "/usr/sbin/kernel" -> "kernel")
    const processPath = rawEvent.processImagePath?.toLowerCase() || "";
    const process = processPath.split("/").pop() || "";

    // Boot events
    if (message.includes("=== system boot:")) {
      return "boot";
    }

    // Shutdown events
    if (
      (process === "kernel" &&
        (message.includes("shutdown") || message.includes("shutdown_time"))) ||
      message.includes("system shutdown")
    ) {
      return "shutdown";
    }

    // Login events
    if (
      process === "loginwindow" &&
      (message.includes("login") ||
        message.includes("logged in") ||
        message.includes("session started"))
    ) {
      // Filter out logout-related messages
      if (
        !message.includes("logout") &&
        !message.includes("logged out") &&
        !message.includes("session ended")
      ) {
        return "logon";
      }
    }

    // Logout events
    if (
      process === "loginwindow" &&
      (message.includes("logout") ||
        message.includes("logged out") ||
        message.includes("session ended"))
    ) {
      return "logoff";
    }

    // Sleep events
    if (
      (process === "powerd" || process === "kernel") &&
      (message.includes("entering sleep state") || message.includes("sleep"))
    ) {
      // Filter out wake-related messages
      if (!message.includes("wake")) {
        return "standby_enter";
      }
    }

    // Wake events
    if (
      (process === "powerd" || process === "kernel") &&
      message.includes("wake")
    ) {
      return "standby_exit";
    }

    return null;
  }
}

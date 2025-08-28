import { execFile } from "child_process";

/**
 * Represents a Windows event with simplified structure
 */
export interface Event {
  time: Date;
  type: string;
  details: string;
}

/**
 * Raw event structure from PowerShell script output
 */
interface RawWindowsEvent {
  TimeCreated: string;
  Id: number;
  ProviderName: string;
  Message: string;
}

/**
 * Windows Event Log IDs for system events
 */
export const WINDOWS_EVENT_IDS = {
  EVENT_LOG_STARTED: 6005, // Event Log service started (system boot)
  EVENT_LOG_STOPPED: 6006, // Event Log service stopped (system shutdown)
  UNEXPECTED_SHUTDOWN: 6008, // Previous system shutdown was unexpected
  USER_INITIATED_SHUTDOWN: 1074, // User initiated shutdown/restart
  SYSTEM_SLEEP: 42, // System entering sleep mode
  KERNEL_GENERAL: 12, // Kernel general events (OS start)
  OS_SHUTDOWN: 13, // Operating system shutdown
  SYSTEM_GENERAL: 1, // System general events
} as const;

/**
 * Service for querying Windows Event Logs
 */
export class WindowsEventsService {
  private static readonly DEFAULT_EVENT_IDS = [
    WINDOWS_EVENT_IDS.EVENT_LOG_STARTED,
    WINDOWS_EVENT_IDS.EVENT_LOG_STOPPED,
    WINDOWS_EVENT_IDS.UNEXPECTED_SHUTDOWN,
    WINDOWS_EVENT_IDS.USER_INITIATED_SHUTDOWN,
    WINDOWS_EVENT_IDS.SYSTEM_SLEEP,
    WINDOWS_EVENT_IDS.KERNEL_GENERAL,
    WINDOWS_EVENT_IDS.OS_SHUTDOWN,
    WINDOWS_EVENT_IDS.SYSTEM_GENERAL,
  ];

  public static isSupported(): boolean {
    return process.platform === "win32";
  }

  /**
   * Maps Windows Event IDs to descriptive names
   * @param eventId - The numeric event ID
   * @returns Descriptive name for the event
   */
  private static getEventTypeName(eventId: number): string {
    const eventMap: Record<number, string> = {
      [WINDOWS_EVENT_IDS.EVENT_LOG_STARTED]: "event_log_started",
      [WINDOWS_EVENT_IDS.EVENT_LOG_STOPPED]: "event_log_stopped",
      [WINDOWS_EVENT_IDS.UNEXPECTED_SHUTDOWN]: "unexpected_shutdown",
      [WINDOWS_EVENT_IDS.USER_INITIATED_SHUTDOWN]: "user_initiated_shutdown",
      [WINDOWS_EVENT_IDS.SYSTEM_SLEEP]: "system_sleep",
      [WINDOWS_EVENT_IDS.KERNEL_GENERAL]: "kernel_general",
      [WINDOWS_EVENT_IDS.OS_SHUTDOWN]: "os_shutdown",
      [WINDOWS_EVENT_IDS.SYSTEM_GENERAL]: "system_general",
    };

    return eventMap[eventId] || `unknown_event_${eventId}`;
  }

  /**
   * Converts raw PowerShell output to Event objects
   * @param rawEvents - The raw event data from PowerShell script
   * @returns Array of Event objects with simplified structure
   */
  public static convertRawEventsToEvents(
    rawEvents: RawWindowsEvent[]
  ): Event[] {
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents.map((rawEvent) => ({
      time: new Date(rawEvent.TimeCreated),
      type: WindowsEventsService.getEventTypeName(rawEvent.Id),
      details: `${rawEvent.ProviderName}: ${rawEvent.Message}`,
    }));
  }

  public static async getEvents(
    eventIds: number[] = WindowsEventsService.DEFAULT_EVENT_IDS,
    startDate?: Date
  ): Promise<RawWindowsEvent[] | Event[] | undefined> {
    if (!WindowsEventsService.isSupported()) {
      return;
    }

    const date = startDate || new Date();
    const dateString = date.toISOString().split("T")[0];
    const eventIdsString = eventIds.join(",");

    const script = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-WinEvent -FilterHashtable @{LogName='System';Id=${eventIdsString};StartTime='${dateString}T00:00:00'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    try {
      const { stdout } = await WindowsEventsService.runPowerShell(script);

      try {
        const rawEvents = JSON.parse(stdout);

        return WindowsEventsService.convertRawEventsToEvents(rawEvents);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.error("Original stdout content:", stdout);
        return;
      }
    } catch (err: any) {
      const errorMessage = err?.stderr || err?.message || String(err);
      console.error(errorMessage);
      return;
    }
  }

  private static runPowerShell(
    script: string
  ): Promise<{ stdout: string; stderr: string }> {
    const args = [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ];

    const tryExec = (exe: string) =>
      new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          exe,
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
                        "PowerShell process failed"
                    );
              reject(reason);
            } else {
              resolve({ stdout, stderr });
            }
          }
        );
      });

    // Prefer PowerShell 7 if available, fall back to Windows PowerShell
    return tryExec("pwsh").catch((firstErr: any) => {
      // If pwsh is not found, try Windows PowerShell
      if (firstErr?.code === "ENOENT") {
        return tryExec("powershell.exe");
      }
      // Otherwise, propagate the original error
      throw firstErr;
    });
  }
}

import { execFile } from "child_process";
import type { Event, EventService, EventName } from "./api";

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
 * Windows event
 */
export const WINDOWS_EVENTS = [
  {
    eventName: "boot",
    windowsEventId: 12,
    providerName: "Microsoft-Windows-Kernel-General",
  },
  {
    eventName: "shutdown",
    windowsEventId: 13,
    providerName: "Microsoft-Windows-Kernel-General",
  },
  {
    eventName: "logon",
    windowsEventId: 7001,
    providerName: "Microsoft-Windows-Winlogon",
  },
  {
    eventName: "logoff",
    windowsEventId: 7002,
    providerName: "Microsoft-Windows-Winlogon",
  },
  {
    eventName: "standby_enter",
    windowsEventId: 506,
    providerName: "Microsoft-Windows-Kernel-Power",
  },
  {
    eventName: "standby_exit",
    windowsEventId: 507,
    providerName: "Microsoft-Windows-Kernel-Power",
  },
] as const;

/**
 * Service for querying Windows event logs
 */
export class WindowsEventsService implements EventService {
  private static readonly DEFAULT_EVENT_NAMES: EventName[] = WINDOWS_EVENTS.map(
    (event) => event.eventName
  );

  public get name(): string {
    return "os";
  }

  private isSupported(): boolean {
    return process.platform === "win32";
  }

  public async getEvents(
    eventNames: EventName[] = WindowsEventsService.DEFAULT_EVENT_NAMES,
    startTime?: Date
  ): Promise<Event[]> {
    if (!this.isSupported()) {
      return [];
    }

    var startTimeString;
    if (startTime) {
      startTimeString = startTime.toISOString();
    } else {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      startTimeString = lastWeek.toISOString();
    }

    const eventIdsString = this.getEventIdsFromNames(eventNames).join(",");

    const script = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-WinEvent -FilterHashtable @{LogName='System';Id=${eventIdsString};StartTime='${startTimeString}'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    try {
      const { stdout } = await this.runPowerShell(script);

      try {
        const rawEvents = JSON.parse(stdout);

        return this.convertRawEventsToEvents(rawEvents);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.error("Original stdout content:", stdout);
        return [];
      }
    } catch (err: any) {
      const errorMessage = err?.stderr || err?.message || String(err);
      console.error(errorMessage);
      return [];
    }
  }

  public convertRawEventsToEvents(rawEvents: RawWindowsEvent[]): Event[] {
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents
      .filter((rawEvent) => {
        const event = WINDOWS_EVENTS.find(
          (event) =>
            event.windowsEventId === rawEvent.Id &&
            event.providerName === rawEvent.ProviderName
        );
        return !!event;
      })
      .map((rawEvent) => ({
        time: new Date(rawEvent.TimeCreated).getTime(),
        source: this.name,
        name: this.getEventTypeName(rawEvent.Id, rawEvent.ProviderName),
        details: `${rawEvent.ProviderName}: ${rawEvent.Message}`,
      }))
      .filter((event): event is Event => event.name !== undefined)
      .sort((a, b) => b.time - a.time);
  }

  private getEventTypeName(
    eventId: number,
    providerName: string
  ): EventName | undefined {
    const event = WINDOWS_EVENTS.find(
      (event) =>
        event.windowsEventId === eventId && event.providerName === providerName
    );
    return event?.eventName;
  }

  private getEventIdsFromNames(eventNames: string[]): number[] {
    return WINDOWS_EVENTS.filter((event) =>
      eventNames.includes(event.eventName)
    ).map((event) => event.windowsEventId);
  }

  private runPowerShell(
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

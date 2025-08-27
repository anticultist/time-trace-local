import { execFile } from "child_process";

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
  SYSTEM_GENERAL: 1, // System general events
} as const;

/**
 * Result of a Windows Events query
 */
export interface WindowsEventsResult {
  ok: boolean;
  data?: string;
  error?: string;
}

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
    WINDOWS_EVENT_IDS.SYSTEM_GENERAL,
  ];

  /**
   * Check if Windows Events are supported on the current platform
   */
  public static isSupported(): boolean {
    return process.platform === "win32";
  }

  /**
   * Get Windows system events for today
   * @param eventIds - Optional array of event IDs to query (defaults to system events)
   * @param startDate - Optional start date (defaults to today)
   * @returns Promise with the events result
   */
  public static async getEvents(
    eventIds: number[] = WindowsEventsService.DEFAULT_EVENT_IDS,
    startDate?: Date
  ): Promise<WindowsEventsResult> {
    if (!WindowsEventsService.isSupported()) {
      return {
        ok: false,
        error: "Windows-only feature: requires PowerShell on Windows.",
      };
    }

    const date = startDate || new Date();
    const dateString = date.toISOString().split("T")[0];
    const eventIdsString = eventIds.join(",");

    const script = `Get-WinEvent -FilterHashtable @{LogName='System';Id=${eventIdsString};StartTime='${dateString}T00:00:00'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    try {
      const { stdout } = await WindowsEventsService.runPowerShell(script);
      return { ok: true, data: stdout };
    } catch (err: any) {
      const errorMessage = err?.stderr || err?.message || String(err);
      return { ok: false, error: errorMessage };
    }
  }

  /**
   * Get Windows system events as a simple string (for backward compatibility)
   * @param eventIds - Optional array of event IDs to query
   * @param startDate - Optional start date
   * @returns Promise with the events JSON string or undefined
   */
  public static async getEventsAsString(
    eventIds?: number[],
    startDate?: Date
  ): Promise<string | undefined> {
    const result = await WindowsEventsService.getEvents(eventIds, startDate);
    return result.ok ? result.data : undefined;
  }

  /**
   * Execute a PowerShell script
   * @param script - The PowerShell script to execute
   * @returns Promise with stdout and stderr
   */
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
          { maxBuffer: 20 * 1024 * 1024 },
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

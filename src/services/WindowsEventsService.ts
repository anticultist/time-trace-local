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

  public static async getEvents(
    eventIds: number[] = WindowsEventsService.DEFAULT_EVENT_IDS,
    startDate?: Date
  ): Promise<any> {
    if (!WindowsEventsService.isSupported()) {
      return;
    }

    const date = startDate || new Date();
    const dateString = date.toISOString().split("T")[0];
    const eventIdsString = eventIds.join(",");

    const script = `Get-WinEvent -FilterHashtable @{LogName='System';Id=${eventIdsString};StartTime='${dateString}T00:00:00'} | Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json`;

    try {
      const { stdout } = await WindowsEventsService.runPowerShell(script);

      try {
        return JSON.parse(stdout);
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

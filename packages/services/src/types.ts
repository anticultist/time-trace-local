/**
 * Represents a Windows event with simplified structure
 */
export interface Event {
  time: number;
  type: string;
  details: string;
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
 * macOS event configuration with log predicates
 * Using subsystem and category filters to avoid catching debug/internal messages
 *
 * Note: Sleep/Wake events might not fire on desktop Macs that don't sleep regularly
 */
export const MAC_EVENTS = [
  {
    eventName: "boot",
    predicate:
      'eventType == "timesyncEvent" AND eventMessage BEGINSWITH "=== system boot:"',
  },
  {
    eventName: "shutdown",
    // Shutdown events are rare and hard to capture reliably
    // This predicate looks for kernel shutdown messages
    predicate:
      'processImagePath CONTAINS "kernel" AND eventMessage CONTAINS "SHUTDOWN"',
  },
  {
    eventName: "logon",
    // LoginComplete is the final state when login finishes successfully
    predicate:
      'subsystem == "com.apple.loginwindow.logging" AND category == "KeyMilestone" AND eventMessage CONTAINS "login state: LoginComplete"',
  },
  {
    eventName: "logoff",
    // Look for logout-related login states
    predicate:
      'subsystem == "com.apple.loginwindow.logging" AND category == "KeyMilestone" AND (eventMessage CONTAINS "login state: Logout" OR eventMessage CONTAINS "login state: SessionEnd")',
  },
  {
    eventName: "standby_enter",
    // Desktop Macs may not sleep - this looks for actual sleep start messages
    predicate: 'process == "kernel" AND eventMessage CONTAINS "sleep reason"',
  },
  {
    eventName: "standby_exit",
    // Wake from sleep - look for Wake reason messages from kernel
    predicate: 'process == "kernel" AND eventMessage CONTAINS "wakereason"',
  },
] as const;

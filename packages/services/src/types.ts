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
 * macOS event configuration
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

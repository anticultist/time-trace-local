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
 */
export const MAC_EVENTS = [
  {
    eventName: "boot",
    predicate: 'eventMessage CONTAINS "=== system boot:"',
  },
  {
    eventName: "shutdown",
    predicate:
      'processImagePath CONTAINS "kernel" AND (eventMessage CONTAINS "System shutdown" OR eventMessage CONTAINS "SHUTDOWN_TIME")',
  },
  {
    eventName: "logon",
    predicate:
      'processImagePath CONTAINS "loginwindow" AND (eventMessage CONTAINS "Login" OR eventMessage CONTAINS "logged in" OR eventMessage CONTAINS "session started")',
  },
  {
    eventName: "logoff",
    predicate:
      'processImagePath CONTAINS "loginwindow" AND (eventMessage CONTAINS "Logout" OR eventMessage CONTAINS "logged out" OR eventMessage CONTAINS "session ended")',
  },
  {
    eventName: "standby_enter",
    predicate:
      '(processImagePath CONTAINS "powerd" OR processImagePath CONTAINS "kernel") AND eventMessage CONTAINS "sleep"',
  },
  {
    eventName: "standby_exit",
    predicate:
      '(processImagePath CONTAINS "powerd" OR processImagePath CONTAINS "kernel") AND (eventMessage CONTAINS "Wake" OR eventMessage CONTAINS "wake")',
  },
] as const;

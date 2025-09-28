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

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
    eventName: "sleep",
    windowsEventId: 42,
    providerName: "Microsoft-Windows-Kernel-Power",
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
    eventName: "standby",
    windowsEventId: 507,
    providerName: "Kernel-Power",
  },
  // // TODO: other events
  // {
  //   eventName: "sleep",
  //   windowsEventId: 42,
  //   providerName: "Microsoft-Windows-Kernel-Power",
  // },
  // {
  //   eventName: "wake_up",
  //   windowsEventId: 107,
  //   providerName: "Microsoft-Windows-Kernel-Power",
  // },
  // {
  //   eventName: "troubleshooter_wake",
  //   windowsEventId: 1,
  //   providerName: "Microsoft-Windows-Power-Troubleshooter",
  // },
] as const;

/**
 * Represents a Windows event with simplified structure
 */
export interface Event {
  time: number;
  type: string;
  details: string;
}

/**
 * Windows Event Log IDs for system events
 */
export const WINDOWS_EVENT_IDS = {
  KERNEL_BOOT: 12, // Kernel general events (OS boot)
  KERNEL_SHUTDOWN: 13, // Kernel general events (OS shutdown)
} as const;

export type WindowsEventId =
  (typeof WINDOWS_EVENT_IDS)[keyof typeof WINDOWS_EVENT_IDS];

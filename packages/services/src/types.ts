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
  EVENT_LOG_STARTED: 6005, // Event Log service started (system boot)
  EVENT_LOG_STOPPED: 6006, // Event Log service stopped (system shutdown)
  UNEXPECTED_SHUTDOWN: 6008, // Previous system shutdown was unexpected
  USER_INITIATED_SHUTDOWN: 1074, // User initiated shutdown/restart
  SYSTEM_SLEEP: 42, // System entering sleep mode
  KERNEL_GENERAL: 12, // Kernel general events (OS start)
  OS_SHUTDOWN: 13, // Operating system shutdown or startup
  SYSTEM_GENERAL: 1, // System general events
} as const;

export type WindowsEventId =
  (typeof WINDOWS_EVENT_IDS)[keyof typeof WINDOWS_EVENT_IDS];

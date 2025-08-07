// Core types for Time Trace Local

/**
 * Represents a raw activity event from various sources
 */
export interface ActivityEvent {
  id: string;
  timestamp: Date;
  source: EventSource;
  type: EventType;
  data: Record<string, unknown>;
  metadata?: EventMetadata;
}

/**
 * Source of the activity event
 */
export enum EventSource {
  PC_LOGIN = 'pc_login',
  SYSLOG = 'syslog',
  JIRA = 'jira',
  GIT = 'git',
  FILE_SYSTEM = 'file_system',
  MANUAL = 'manual',
}

/**
 * Type of the activity event
 */
export enum EventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  COMMIT = 'commit',
  FILE_OPENED = 'file_opened',
  FILE_SAVED = 'file_saved',
  MANUAL_ENTRY = 'manual_entry',
}

/**
 * Additional metadata for events
 */
export interface EventMetadata {
  duration?: number;
  location?: string;
  user?: string;
  confidence?: number;
}

/**
 * Represents a bookable element (output)
 */
export interface BookableElement {
  id: string;
  title: string;
  description?: string;
  type: BookableType;
  projectId?: string;
  ticketId?: string;
  estimatedHours?: number;
  actualHours?: number;
  status: BookableStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type of bookable element
 */
export enum BookableType {
  TICKET = 'ticket',
  MANUAL_TASK = 'manual_task',
  PROJECT = 'project',
  MEETING = 'meeting',
}

/**
 * Status of bookable element
 */
export enum BookableStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

/**
 * Mapping between events and bookable elements
 */
export interface EventMapping {
  id: string;
  eventId: string;
  bookableElementId: string;
  mappingType: MappingType;
  confidence: number;
  createdAt: Date;
  createdBy: MappingCreatedBy;
}

/**
 * How the mapping was created
 */
export enum MappingCreatedBy {
  USER = 'user',
  AUTO_SUGGEST = 'auto_suggest',
  RULE_BASED = 'rule_based',
}

/**
 * Type of mapping
 */
export enum MappingType {
  DIRECT = 'direct',
  PARTIAL = 'partial',
  SUGGESTION = 'suggestion',
}

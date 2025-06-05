// Google APIs TypeScript Interfaces for LibreOllama Phase 5

// OAuth 2.0 and Authentication Types
export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  tokenType: string;
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  tokens: GoogleTokens | null;
  userInfo: GoogleUserInfo | null;
  lastRefresh: string | null;
  error: string | null;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verifiedEmail: boolean;
}

// Google Calendar API Types
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
  primary?: boolean;
  selected?: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  calendarId: string;
  colorId?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  location?: string;
  attendees?: GoogleEventAttendee[];
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  created: string;
  updated: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: {
      name: string;
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
}

export interface GoogleEventAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
  optional?: boolean;
}

// Google Tasks API Types
export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
  kind: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
  selfLink: string;
  parent?: string;
  position: string;
  kind: string;
  links?: Array<{
    type: string;
    description: string;
    link: string;
  }>;
  deleted?: boolean;
  hidden?: boolean;
}

// Gmail API Types
export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: GmailMessagePayload;
  sizeEstimate: number;
  raw?: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: GmailMessageBody;
  parts?: GmailMessagePayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility: 'show' | 'hide';
  labelListVisibility: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

// API Response Types
export interface GoogleApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  error?: string;
}

export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleCalendarEventsResponse {
  kind: string;
  etag: string;
  summary: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendarEvent[];
}

export interface GoogleTaskListsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: GoogleTaskList[];
}

export interface GoogleTasksResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: GoogleTask[];
}

export interface GmailMessagesResponse {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface GmailThreadsResponse {
  threads: Array<{
    id: string;
    historyId: string;
    snippet: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

// Error Types
export interface GoogleApiError {
  code: number;
  message: string;
  status: string;
  details?: any[];
}

// Service Configuration Types
export interface GoogleServiceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiKey?: string;
}

export interface GoogleApiQuota {
  service: 'calendar' | 'tasks' | 'gmail';
  requestsPerDay: number;
  requestsPerMinute: number;
  requestsRemaining: number;
  resetTime: string;
}

// Integration Types for LibreOllama
export interface GoogleIntegrationStatus {
  calendar: {
    connected: boolean;
    lastSync: string | null;
    calendarsCount: number;
    error: string | null;
  };
  tasks: {
    connected: boolean;
    lastSync: string | null;
    taskListsCount: number;
    error: string | null;
  };
  gmail: {
    connected: boolean;
    lastSync: string | null;
    unreadCount: number;
    error: string | null;
  };
  overallStatus: 'connected' | 'partial' | 'disconnected' | 'error';
}

// Sync Configuration
export interface GoogleSyncConfig {
  calendar: {
    enabled: boolean;
    syncInterval: number; // minutes
    calendarsToSync: string[];
    lookAheadDays: number;
  };
  tasks: {
    enabled: boolean;
    syncInterval: number; // minutes
    taskListsToSync: string[];
  };
  gmail: {
    enabled: boolean;
    syncInterval: number; // minutes
    labelsToSync: string[];
    maxMessages: number;
  };
}

// Event handlers for real-time updates
export interface GoogleEventHandlers {
  onCalendarEvent: (event: GoogleCalendarEvent) => void;
  onTaskUpdate: (task: GoogleTask) => void;
  onEmailReceived: (message: GmailMessage) => void;
  onAuthStateChange: (state: GoogleAuthState) => void;
  onError: (error: GoogleApiError) => void;
}
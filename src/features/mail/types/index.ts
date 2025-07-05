// Gmail API Types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: GmailPayload;
  sizeEstimate: number;
  raw?: string;
}

export interface GmailPayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body?: GmailBody;
  parts?: GmailPayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailBody {
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
  labelListVisibility: 'labelShow' | 'labelHide';
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

// Application-specific types
export interface ParsedEmail {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  snippet: string;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  messages: ParsedEmail[];
  lastMessage: ParsedEmail;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  messageCount: number;
  date: Date;
}

export interface ComposeEmail {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  attachments?: File[];
  threadId?: string;
  replyToMessageId?: string;
}

// Store Types
export interface MailState {
  // Authentication
  isAuthenticated: boolean;
  userEmail: string | null;
  accessToken: string | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingThreads: boolean;
  isSending: boolean;
  
  // Data
  messages: ParsedEmail[];
  threads: EmailThread[];
  labels: GmailLabel[];
  currentThread: EmailThread | null;
  currentMessage: ParsedEmail | null;
  
  // UI State
  selectedMessages: string[];
  currentView: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'all' | 'starred' | 'important';
  searchQuery: string;
  currentLabel: string | null;
  
  // Compose
  isComposing: boolean;
  composeDraft: ComposeEmail | null;
  
  // Pagination
  nextPageToken: string | null;
  hasMoreMessages: boolean;
  
  // Error state
  error: string | null;
}

export interface MailActions {
  // Authentication
  authenticate: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Messages
  fetchMessages: (labelId?: string, query?: string, pageToken?: string) => Promise<void>;
  fetchMessage: (messageId: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  markAsUnread: (messageIds: string[]) => Promise<void>;
  deleteMessages: (messageIds: string[]) => Promise<void>;
  archiveMessages: (messageIds: string[]) => Promise<void>;
  starMessages: (messageIds: string[]) => Promise<void>;
  unstarMessages: (messageIds: string[]) => Promise<void>;
  
  // Labels
  fetchLabels: () => Promise<void>;
  addLabel: (messageIds: string[], labelId: string) => Promise<void>;
  removeLabel: (messageIds: string[], labelId: string) => Promise<void>;
  
  // Compose
  startCompose: (draft?: Partial<ComposeEmail>) => void;
  updateCompose: (updates: Partial<ComposeEmail>) => void;
  sendEmail: (email: ComposeEmail) => Promise<void>;
  saveDraft: (email: ComposeEmail) => Promise<void>;
  cancelCompose: () => void;
  
  // Search
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // UI Actions
  setCurrentView: (view: MailState['currentView']) => void;
  setCurrentLabel: (labelId: string | null) => void;
  selectMessage: (messageId: string, isSelected: boolean) => void;
  selectAllMessages: (isSelected: boolean) => void;
  clearSelection: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type MailStore = MailState & MailActions;

// Gmail API Response Types
export interface GmailListResponse<T> {
  messages?: T[];
  threads?: T[];
  labels?: T[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailBatchResponse {
  responses: Array<{
    id: string;
    response: any;
  }>;
}

// Authentication Types
export interface GmailAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GmailAuthResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

// Error Types
export interface GmailApiError {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

export interface MailError {
  type: 'AUTH_ERROR' | 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: any;
}

// Utility Types
export type MailViewType = MailState['currentView'];
export type MessageStatus = 'read' | 'unread' | 'starred' | 'important';
export type AttachmentType = 'image' | 'document' | 'audio' | 'video' | 'other';

// Constants
export const GMAIL_LABELS = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFTS: 'DRAFT',
  SPAM: 'SPAM',
  TRASH: 'TRASH',
  IMPORTANT: 'IMPORTANT',
  STARRED: 'STARRED',
  UNREAD: 'UNREAD',
} as const;

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
] as const; 
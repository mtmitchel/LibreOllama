// Re-export attachment types and utilities
export * from './attachments';

// Gmail API Types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId?: string;
  internalDate?: string;
  payload: GmailPayload;
  sizeEstimate?: number;
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

// Multi-Account Types
export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_type: string;
  expires_in?: number;
}

export interface GmailAccount {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  isActive: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncAt?: Date;
  errorMessage?: string;
  quotaUsed?: number;
  quotaTotal?: number;
}

export interface AccountData {
  messages: ParsedEmail[];
  threads: EmailThread[];
  labels: GmailLabel[];
  drafts: ParsedEmail[];
  totalMessages: number;
  unreadMessages: number;
  lastSyncAt?: Date;
  syncInProgress: boolean;
  syncError?: string;
}

// Application-specific types
export interface ParsedEmail {
  id: string;
  threadId: string;
  accountId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  body: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments: GmailAttachment[];
  labels: string[];
  importance: 'low' | 'normal' | 'high';
  messageId: string;
  references?: string[];
  inReplyTo?: string;
}

export interface EmailAddress {
  email: string;
  name?: string;
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
  accountId: string;
  subject: string;
  participants: EmailAddress[];
  lastMessageDate: Date;
  messageCount: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
  snippet: string;
  messages: ParsedEmail[];
}

export interface ComposeEmail {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: File[];
  threadId?: string;
  replyToMessageId?: string;
  accountId?: string;
}

// Store Types
export interface MailState {
  // Multi-Account Authentication
  accounts: Record<string, GmailAccount>;
  currentAccountId: string | null;
  isAuthenticated: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingThreads: boolean;
  isSending: boolean;
  isLoadingAccounts: boolean;
  
  // Account-specific data
  accountData: Record<string, AccountData>;
  
  // Current view data (from active account)
  currentThread: EmailThread | null;
  currentMessage: ParsedEmail | null;
  
  // UI State
  selectedMessages: string[];
  currentView: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'all' | 'starred' | 'important' | 'label';
  searchQuery: string;
  currentLabel: string | null;
  
  // Compose
  isComposing: boolean;
  composeData: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    attachments: File[];
    isScheduled: boolean;
    scheduledDate?: Date;
    replyToMessageId?: string;
    threadId?: string;
  };
  
  // Error state
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  
  // Settings
  settings: {
    enableUnifiedInbox: boolean;
    emailSignature: string;
    autoSave: boolean;
    notifications: boolean;
    syncInterval: number; // in minutes
    maxAttachmentSize: number; // in bytes
    defaultSendFrom?: string;
    readReceipts: boolean;
  };
  
  // Filters and sorting
  filters: {
    dateRange?: { start: Date; end: Date };
    hasAttachments?: boolean;
    isUnread?: boolean;
    importance?: 'low' | 'normal' | 'high';
    labels?: string[];
  };
  sortBy: 'date' | 'subject' | 'sender' | 'importance';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface MailActions {
  // Account Management
  addAccount: () => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  refreshAccount: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  
  // Authentication
  authenticate: (accountId?: string) => Promise<void>;
  signOut: (accountId?: string) => Promise<void>;
  
  // Messages
  fetchMessages: (labelId?: string, query?: string, pageToken?: string, accountId?: string) => Promise<void>;
  fetchMessage: (messageId: string, accountId?: string) => Promise<void>;
  fetchThread: (threadId: string, accountId?: string) => Promise<void>;
  markAsRead: (messageIds: string[], accountId?: string) => Promise<void>;
  markAsUnread: (messageIds: string[], accountId?: string) => Promise<void>;
  deleteMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  archiveMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  starMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  unstarMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  
  // Labels
  fetchLabels: (accountId?: string) => Promise<void>;
  addLabel: (messageIds: string[], labelId: string, accountId?: string) => Promise<void>;
  removeLabel: (messageIds: string[], labelId: string, accountId?: string) => Promise<void>;
  
  // Compose
  startCompose: (draft?: Partial<ComposeEmail>) => void;
  updateCompose: (updates: Partial<ComposeEmail>) => void;
  sendEmail: (email: ComposeEmail) => Promise<void>;
  saveDraft: (email: ComposeEmail) => Promise<void>;
  cancelCompose: () => void;
  
  // Search
  searchMessages: (query: string, accountId?: string) => Promise<void>;
  clearSearch: () => void;
  
  // UI Actions
  setCurrentView: (view: MailState['currentView']) => void;
  setCurrentLabel: (labelId: string | null) => void;
  selectMessage: (messageId: string, isSelected: boolean) => void;
  selectAllMessages: (isSelected: boolean) => void;
  clearSelection: () => void;
  
  // Settings
  updateSettings: (settings: Partial<MailState['settings']>) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Authentication
  signOut: () => void;
}

export type MailStore = MailState & MailActions;

// Helper functions for multi-account
export interface MultiAccountHelpers {
  getCurrentAccount: () => GmailAccount | null;
  getActiveAccountData: () => AccountData | null;
  getAccountById: (accountId: string) => GmailAccount | null;
  getAccountDataById: (accountId: string) => AccountData | null;
  getAllMessages: () => ParsedEmail[];
  getAllThreads: () => EmailThread[];
  getLabels: () => GmailLabel[];
  getMessages: () => ParsedEmail[];
}

export type EnhancedMailStore = MailStore & MultiAccountHelpers;

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
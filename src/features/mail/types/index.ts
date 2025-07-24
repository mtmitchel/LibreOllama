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

// Enhanced Label Types for Phase 2.3 - Label Management
export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility: 'show' | 'hide' | 'showIfUnread';
  labelListVisibility: 'show' | 'hide' | 'showIfUnread';
  type: 'system' | 'user';
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
  color: string;
  textColor?: string;
  backgroundColor?: string;
}

// Label Settings Types
export interface LabelVisibilitySettings {
  showSystemLabels: boolean;
  showUserLabels: boolean;
  showEmptyLabels: boolean;
  showUnreadCountsOnly: boolean;
  compactView: boolean;
}

export interface LabelSortingSettings {
  sortBy: 'name' | 'messageCount' | 'unreadCount' | 'dateCreated' | 'custom';
  sortOrder: 'asc' | 'desc';
  groupByType: boolean;
  prioritizeUnread: boolean;
}

export interface LabelBehaviorSettings {
  autoApplyLabels: boolean;
  removeFromInboxWhenLabeled: boolean;
  showLabelColors: boolean;
  enableLabelShortcuts: boolean;
  maxLabelsPerMessage: number;
}

export interface LabelSettings {
  visibility: LabelVisibilitySettings;
  sorting: LabelSortingSettings;
  behavior: LabelBehaviorSettings;
}

// Label Operation Types
export interface LabelOperation {
  type: 'add' | 'remove' | 'replace';
  labelIds: string[];
  messageIds: string[];
}

export interface LabelCreationRequest {
  name: string;
  color: string;
  messageListVisibility: 'show' | 'hide' | 'showIfUnread';
  labelListVisibility: 'show' | 'hide' | 'showIfUnread';
}

export interface LabelUpdateRequest {
  id: string;
  name?: string;
  color?: string;
  messageListVisibility?: 'show' | 'hide' | 'showIfUnread';
  labelListVisibility?: 'show' | 'hide' | 'showIfUnread';
}

// Backend Service Types (for Tauri integration)
export interface ProcessedGmailMessage {
  id: string;
  thread_id: string;
  parsed_content: ParsedEmailContent;
  labels: string[];
  snippet?: string;
  internal_date?: string;
  size_estimate?: number;
}

export interface ParsedEmailContent {
  message_id?: string;
  thread_id?: string;
  subject?: string;
  from: BackendEmailAddress;
  to: BackendEmailAddress[];
  cc: BackendEmailAddress[];
  bcc: BackendEmailAddress[];
  reply_to?: BackendEmailAddress;
  date?: string;
  body_text?: string;
  body_html?: string;
  attachments: BackendEmailAttachment[];
  headers: Record<string, string>;
  is_multipart: boolean;
  content_type: string;
  size_estimate?: number;
}

export interface BackendEmailAddress {
  email: string;
  name?: string;
}

export interface BackendEmailAttachment {
  id: string;
  filename?: string;
  content_type: string;
  size?: number;
  content_id?: string;
  is_inline: boolean;
  data?: Uint8Array;
}

export interface MessageSearchResult {
  messages: ProcessedGmailMessage[];
  next_page_token?: string;
  result_size_estimate?: number;
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
  quotaTotal?: number | null; // null for unlimited storage accounts
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
  attachments: EmailAttachment[];
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
  isHydrated: boolean;
  
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
  currentView: 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'SPAM' | 'all' | 'STARRED' | 'IMPORTANT' | 'label';
  searchQuery: string;
  currentLabel: string | null;
  
  // Phase 2.3 - Label Management State
  selectedLabels: string[];
  labelSettings: LabelSettings;
  
  // Compose
  isComposing: boolean;
  composeData: {
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
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
  
  // Sync state
  lastSyncTime: Date | null;
  
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
  
  // Token-based pagination (Gmail API style)
  nextPageToken?: string;
  pageTokens: string[]; // Stack of page tokens for backward navigation
  totalMessages: number;
  totalUnreadMessages: number; // Total unread messages for current view
  messagesLoadedSoFar: number; // Track cumulative messages loaded
  currentPageSize: number;
  isNavigatingBackwards: boolean; // Flag to prevent pageTokens modification during backwards navigation
}

export interface MailActions {
  // Account Management
  addAccount: (account: GmailAccount) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  refreshAccount: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  loadStoredAccounts: () => Promise<void>;
  
  // Authentication
  authenticate: (accountId?: string) => Promise<void>;
  signOut: (accountId?: string) => Promise<void>;
  
  // Messages
  fetchMessages: (labelId?: string, query?: string, pageToken?: string, accountId?: string) => Promise<void>;
  fetchMessage: (messageId: string, accountId?: string) => Promise<ParsedEmail | undefined>; // Changed return type
  fetchThread: (threadId: string, accountId?: string) => Promise<EmailThread | undefined>; // Changed return type
  setCurrentThread: (thread: EmailThread | null) => void; // Added setCurrentThread
  markAsRead: (messageIds: string[], accountId?: string) => Promise<void>;
  markAsUnread: (messageIds: string[], accountId?: string) => Promise<void>;
  deleteMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  archiveMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  starMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  unstarMessages: (messageIds: string[], accountId?: string) => Promise<void>;
  
  // Enhanced Label Management (Phase 2.3)
  fetchLabels: (accountId?: string) => Promise<void>;
  createLabel: (labelData: LabelCreationRequest, accountId?: string) => Promise<GmailLabel>;
  updateLabel: (labelData: LabelUpdateRequest, accountId?: string) => Promise<GmailLabel>;
  deleteLabel: (labelId: string, accountId?: string) => Promise<void>;
  addLabelsToMessages: (messageIds: string[], labelIds: string[], accountId?: string) => Promise<void>;
  removeLabelsFromMessages: (messageIds: string[], labelIds: string[], accountId?: string) => Promise<void>;
  applyLabelOperation: (operation: LabelOperation, accountId?: string) => Promise<void>;
  
  // Legacy label methods (maintained for backward compatibility)
  addLabel: (messageIds: string[], labelId: string, accountId?: string) => Promise<void>;
  removeLabel: (messageIds: string[], labelId: string, accountId?: string) => Promise<void>;
  
  // Label Settings
  updateLabelSettings: (settings: Partial<LabelSettings>) => void;
  resetLabelSettings: () => void;
  
  // Label Filtering
  setSelectedLabels: (labelIds: string[]) => void;
  addLabelToFilter: (labelId: string) => void;
  removeLabelFromFilter: (labelId: string) => void;
  clearLabelFilter: () => void;
  
  // Compose
  startCompose: (draft?: Partial<ComposeEmail>) => void;
  updateCompose: (updates: Partial<ComposeEmail>) => void;
  sendEmail: (email: ComposeEmail) => Promise<void>;
  saveDraft: (email: ComposeEmail) => Promise<void>;
  cancelCompose: () => void;
  
  // Enhanced Search (Phase 2.1)
  searchMessages: (query: string, accountId?: string) => Promise<void>;
  searchWithFilters: (filters: import('./search').SearchFilter[], accountId?: string) => Promise<void>;
  searchWithAdvancedFilters: (filters: import('./search').AdvancedSearchFilters, accountId?: string) => Promise<void>;
  getSearchSuggestions: (query: string, accountId?: string) => Promise<import('./search').SearchSuggestion[]>;
  getSearchOperators: () => import('./search').SearchOperator[];
  getSearchHistory: () => import('./search').SearchHistory;
  saveSearch: (searchQuery: import('./search').SearchQuery) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  clearSearch: () => void;
  
  // UI Actions
  setCurrentView: (view: MailState['currentView']) => void;
  setCurrentLabel: (labelId: string | null) => void;
  selectMessage: (messageId: string, isSelected: boolean) => void;
  selectAllMessages: (isSelected: boolean) => void;
  clearSelection: () => void;
  
  // Settings
  updateSettings: (settings: Partial<MailState['settings']>) => void;
  
  // Sync
  setLastSyncTime: (time: Date) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Pagination
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (pageToken?: string) => Promise<void>;
  resetPagination: () => void;
  
  // Test helper methods (for compatibility with existing tests)
  setAuthenticated: (isAuthenticated: boolean) => void;
  setCurrentAccountId: (accountId: string | null) => void;
  setMessages: (messages: ParsedEmail[], accountId?: string) => void;
  setAccounts: (accounts: GmailAccount[]) => void;
  setSyncInProgress: (inProgress: boolean, accountId?: string) => void;
  setCurrentMessage: (message: ParsedEmail | null) => void;
  clearCurrentMessage: () => void;
  setLabels: (labels: GmailLabel[], accountId?: string) => void;
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
  getAccountsArray: () => GmailAccount[];
  
  // Pagination computed properties
  readonly currentPage: number;
  readonly pageSize: number;
  readonly currentPageStartIndex: number;
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
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
] as const;

// Default Label Settings
export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  visibility: {
    showSystemLabels: true,
    showUserLabels: true,
    showEmptyLabels: false,
    showUnreadCountsOnly: false,
    compactView: false
  },
  sorting: {
    sortBy: 'name',
    sortOrder: 'asc',
    groupByType: true,
    prioritizeUnread: false
  },
  behavior: {
    autoApplyLabels: false,
    removeFromInboxWhenLabeled: false,
    showLabelColors: true,
    enableLabelShortcuts: true,
    maxLabelsPerMessage: 20
  }
};

// Re-export search types
export * from './search'; 

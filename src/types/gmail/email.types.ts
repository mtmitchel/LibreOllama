/**
 * Gmail Email Types
 * 
 * Comprehensive type definitions for Gmail messages, labels, attachments,
 * and email processing according to the research guide specifications.
 */

// Core Gmail API structures
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
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
  size?: number;
  data?: string; // Base64 encoded
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  historyId?: string;
}

// Parsed email structures
export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo?: EmailAddress;
  date: Date;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  attachments: EmailAttachment[];
  labels: string[];
  headers: Record<string, string>;
  isMultipart: boolean;
  contentType: string;
  sizeEstimate?: number;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  internalDate?: Date;
  historyId?: string;
  accountId?: string; // For multi-account support
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  id: string;
  filename?: string;
  contentType: string;
  size?: number;
  contentId?: string;
  isInline: boolean;
  data?: Uint8Array;
  downloadUrl?: string;
}

// Processed Gmail message with additional metadata
export interface ProcessedGmailMessage {
  id: string;
  threadId: string;
  parsedContent: ParsedEmail;
  labels: string[];
  snippet?: string;
  internalDate?: string;
  sizeEstimate?: number;
}

// API response structures
export interface GmailListResponse {
  messages: MessageRef[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface MessageRef {
  id: string;
  threadId: string;
}

export interface MessageSearchResult {
  messages: ProcessedGmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Email threading
export interface EmailThread {
  id: string;
  messages: ParsedEmail[];
  messageCount: number;
  participants: EmailAddress[];
  subject: string;
  lastMessageDate: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
}

// Search and filtering
export interface SearchFilters {
  query?: string;
  labelIds?: string[];
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  fromDate?: Date;
  toDate?: Date;
  sender?: string;
  recipient?: string;
  subject?: string;
  sizeOperator?: 'larger' | 'smaller';
  sizeValue?: number;
}

export interface SortOption {
  field: 'date' | 'sender' | 'subject' | 'size';
  direction: 'asc' | 'desc';
}

// Compose and drafts
export interface ComposeEmail {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  replyToMessageId?: string;
  threadId?: string;
  importance?: MessageImportance;
  deliveryReceipt?: boolean;
  readReceipt?: boolean;
  scheduledSend?: Date;
  accountId?: string;
}

export interface Draft {
  id: string;
  message: ComposeEmail;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
}

export enum MessageImportance {
  Low = 'low',
  Normal = 'normal',
  High = 'high'
}

// Label management
export interface CustomLabel {
  id?: string;
  name: string;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
}

// Batch operations
export interface BatchOperation {
  messageIds: string[];
  operation: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'archive' | 'delete' | 'addLabel' | 'removeLabel';
  labelId?: string; // For label operations
}

export interface BatchOperationResult {
  successful: string[];
  failed: Array<{
    messageId: string;
    error: string;
  }>;
}

// Sync and caching
export interface SyncState {
  accountId: string;
  lastSyncTimestamp?: Date;
  lastHistoryId?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface CachedMessage extends ParsedEmail {
  cachedAt: Date;
  expiresAt?: Date;
  offlineAvailable: boolean;
}

// Error handling
export interface GmailApiError {
  code: string;
  message: string;
  operation: string;
  retryable: boolean;
  statusCode?: number;
}

// Pagination
export interface PaginationInfo {
  currentPage: number;
  totalPages?: number;
  pageSize: number;
  nextPageToken?: string;
  previousPageToken?: string;
  hasMore: boolean;
}

// Account management
export interface GmailAccount {
  id: string;
  email: string;
  displayName: string;
  picture?: string;
  isActive: boolean;
  lastSyncAt?: Date;
  totalMessages: number;
  unreadMessages: number;
  quotaUsed?: number;
  quotaTotal?: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

// Advanced search operators
export interface GmailSearchOperators {
  from?: string;
  to?: string;
  subject?: string;
  or?: string;
  and?: string;
  not?: string;
  has?: 'attachment' | 'userlabels' | 'nouserlabels';
  list?: string;
  filename?: string;
  in?: 'inbox' | 'trash' | 'spam' | 'unread' | 'read' | 'starred' | 'important';
  is?: 'important' | 'starred' | 'unread' | 'read' | 'chat';
  after?: string; // YYYY/MM/DD format
  before?: string; // YYYY/MM/DD format
  older?: string;
  newer?: string;
  size?: string;
  larger?: string;
  smaller?: string;
  rfc822msgid?: string;
  deliveredto?: string;
  category?: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
}

// Utilities
export type EmailDirection = 'sent' | 'received';
export type EmailStatus = 'read' | 'unread' | 'starred' | 'important' | 'archived' | 'deleted';

// Constants
export const GMAIL_SYSTEM_LABELS = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFT: 'DRAFT',
  TRASH: 'TRASH',
  SPAM: 'SPAM',
  STARRED: 'STARRED',
  UNREAD: 'UNREAD',
  IMPORTANT: 'IMPORTANT',
  CHAT: 'CHAT',
  ALL: 'ALL',
  ARCHIVE: 'ARCHIVE'
} as const;

export const GMAIL_CATEGORIES = {
  PRIMARY: 'CATEGORY_PERSONAL',
  SOCIAL: 'CATEGORY_SOCIAL',
  PROMOTIONS: 'CATEGORY_PROMOTIONS',
  UPDATES: 'CATEGORY_UPDATES',
  FORUMS: 'CATEGORY_FORUMS'
} as const;

export const DEFAULT_LABELS = [
  { id: GMAIL_SYSTEM_LABELS.INBOX, name: 'Inbox', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.SENT, name: 'Sent', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.DRAFT, name: 'Drafts', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.STARRED, name: 'Starred', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.IMPORTANT, name: 'Important', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.TRASH, name: 'Trash', type: 'system' },
  { id: GMAIL_SYSTEM_LABELS.SPAM, name: 'Spam', type: 'system' },
] as const; 
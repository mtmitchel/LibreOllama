/**
 * Gmail Mock Data and Test Utilities
 * Provides realistic mock data for Gmail integration testing
 */

import { vi } from 'vitest';

// Mock types based on actual Gmail API responses
export interface MockGmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  sender: string;
  recipient: string;
  date: string;
  snippet: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: MockAttachment[];
}

export interface MockAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string;
}

export interface MockGmailAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface MockGmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility: 'show' | 'hide';
  labelListVisibility: 'labelShow' | 'labelHide';
  messagesTotal: number;
  messagesUnread: number;
}

// Factory functions for creating mock data
export function createMockGmailMessage(overrides: Partial<MockGmailMessage> = {}): MockGmailMessage {
  const baseMessage: MockGmailMessage = {
    id: `msg_${Math.random().toString(36).substr(2, 9)}`,
    threadId: `thread_${Math.random().toString(36).substr(2, 9)}`,
    labelIds: ['INBOX'],
    subject: 'Test Email Subject',
    sender: 'sender@example.com',
    recipient: 'recipient@example.com',
    date: new Date().toISOString(),
    snippet: 'This is a test email snippet...',
    body: '<p>This is the full HTML body of the test email.</p>',
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    ...overrides
  };

  return baseMessage;
}

// Wrapper function that creates mock data in ParsedEmail format for direct use
export function createMockParsedEmail(overrides: Partial<MockGmailMessage> = {}): any {
  const mockMessage = createMockGmailMessage(overrides);
  return convertMockMessageToParsedEmail(mockMessage);
}

export function createMockGmailAccount(overrides: Partial<MockGmailAccount> = {}): MockGmailAccount {
  return {
    id: `acc_${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@gmail.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    isActive: true,
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function createMockAttachment(overrides: Partial<MockAttachment> = {}): MockAttachment {
  return {
    id: `att_${Math.random().toString(36).substr(2, 9)}`,
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    size: 1024000, // 1MB
    ...overrides
  };
}

export function createMockGmailLabel(overrides: Partial<MockGmailLabel> = {}): MockGmailLabel {
  return {
    id: `label_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Label',
    type: 'user',
    messageListVisibility: 'show',
    labelListVisibility: 'labelShow',
    messagesTotal: 10,
    messagesUnread: 3,
    ...overrides
  };
}

// Pre-defined mock data sets
export const MOCK_SYSTEM_LABELS: MockGmailLabel[] = [
  createMockGmailLabel({ id: 'INBOX', name: 'Inbox', type: 'system', messagesTotal: 25, messagesUnread: 5 }),
  createMockGmailLabel({ id: 'STARRED', name: 'Starred', type: 'system', messagesTotal: 8, messagesUnread: 2 }),
  createMockGmailLabel({ id: 'SENT', name: 'Sent', type: 'system', messagesTotal: 50, messagesUnread: 0 }),
  createMockGmailLabel({ id: 'DRAFTS', name: 'Drafts', type: 'system', messagesTotal: 3, messagesUnread: 0 }),
  createMockGmailLabel({ id: 'TRASH', name: 'Trash', type: 'system', messagesTotal: 12, messagesUnread: 0 }),
];

export const MOCK_USER_LABELS: MockGmailLabel[] = [
  createMockGmailLabel({ name: 'Work', messagesTotal: 15, messagesUnread: 4 }),
  createMockGmailLabel({ name: 'Personal', messagesTotal: 22, messagesUnread: 1 }),
  createMockGmailLabel({ name: 'Important', messagesTotal: 7, messagesUnread: 3 }),
];

export const MOCK_SAMPLE_MESSAGES: MockGmailMessage[] = [
  createMockGmailMessage({
    subject: 'Important: Project Deadline Reminder',
    sender: 'Project Manager <manager@company.com>',
    snippet: 'The project deadline is approaching fast. Please ensure all deliverables...',
    labelIds: ['INBOX', 'Important'],
    isRead: false,
    isStarred: true,
  }),
  createMockGmailMessage({
    subject: 'Weekly Newsletter - Tech Updates',
    sender: 'Tech Blog <newsletter@techblog.com>',
    snippet: 'This week in tech: AI breakthroughs, new frameworks, and industry insights...',
    labelIds: ['INBOX'],
    isRead: true,
    isStarred: false,
  }),
  createMockGmailMessage({
    subject: 'Meeting Notes - Team Sync',
    sender: 'Sarah Johnson <colleague@company.com>',
    snippet: 'Here are the notes from today\'s team synchronization meeting...',
    labelIds: ['INBOX', 'Work'],
    isRead: false,
    hasAttachments: true,
    attachments: [
      createMockAttachment({ filename: 'meeting-notes.pdf', mimeType: 'application/pdf' }),
      createMockAttachment({ filename: 'action-items.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    ],
  }),
  createMockGmailMessage({
    subject: 'Invoice #12345 - Payment Due',
    sender: 'Billing Department <billing@service.com>',
    snippet: 'Your invoice is ready. Please review and make payment by the due date...',
    labelIds: ['INBOX'],
    isRead: true,
    isStarred: false,
  }),
  createMockGmailMessage({
    subject: 'Family Reunion Planning',
    sender: 'Aunt Mary <aunt@family.com>',
    snippet: 'Let\'s start planning for the annual family reunion. I\'ve attached some ideas...',
    labelIds: ['INBOX', 'Personal'],
    isRead: false,
    hasAttachments: true,
    attachments: [
      createMockAttachment({ filename: 'reunion-venues.pdf', mimeType: 'application/pdf' }),
    ],
  }),
];

// Mock Gmail API Server for testing
export class MockGmailApiServer {
  private isRunning = false;
  private mockData = {
    messages: [...MOCK_SAMPLE_MESSAGES],
    labels: [...MOCK_SYSTEM_LABELS, ...MOCK_USER_LABELS],
    accounts: [createMockGmailAccount()],
  };

  start() {
    this.isRunning = true;
    console.log('🔧 Mock Gmail API Server started');
  }

  stop() {
    this.isRunning = false;
    console.log('🔧 Mock Gmail API Server stopped');
  }

  // Simulate API responses
  async getMessages(labelIds?: string[], maxResults = 25, query?: string): Promise<MockGmailMessage[]> {
    if (!this.isRunning) throw new Error('Mock server not running');
    
    let filteredMessages = this.mockData.messages;
    
    // Filter by labels
    if (labelIds?.length) {
      filteredMessages = filteredMessages.filter(msg => 
        labelIds.some(labelId => msg.labelIds.includes(labelId))
      );
    }
    
    // Filter by search query
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredMessages = filteredMessages.filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.sender.toLowerCase().includes(searchTerm) ||
        msg.snippet.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredMessages.slice(0, maxResults);
  }

  async getMessage(messageId: string): Promise<MockGmailMessage | null> {
    if (!this.isRunning) throw new Error('Mock server not running');
    return this.mockData.messages.find(msg => msg.id === messageId) || null;
  }

  async getLabels(): Promise<MockGmailLabel[]> {
    if (!this.isRunning) throw new Error('Mock server not running');
    return this.mockData.labels;
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    if (!this.isRunning) throw new Error('Mock server not running');
    messageIds.forEach(id => {
      const message = this.mockData.messages.find(msg => msg.id === id);
      if (message) message.isRead = true;
    });
  }

  async starMessages(messageIds: string[]): Promise<void> {
    if (!this.isRunning) throw new Error('Mock server not running');
    messageIds.forEach(id => {
      const message = this.mockData.messages.find(msg => msg.id === id);
      if (message) message.isStarred = true;
    });
  }

  async sendMessage(messageData: any): Promise<{ messageId: string }> {
    if (!this.isRunning) throw new Error('Mock server not running');
    const newMessage = createMockGmailMessage({
      subject: messageData.subject,
      recipient: messageData.to,
      body: messageData.body,
      labelIds: ['SENT'],
      isRead: true,
    });
    this.mockData.messages.push(newMessage);
    return { messageId: newMessage.id };
  }

  // Add or update mock data
  addMessage(message: MockGmailMessage) {
    this.mockData.messages.push(message);
  }

  updateMessage(messageId: string, updates: Partial<MockGmailMessage>) {
    const index = this.mockData.messages.findIndex(msg => msg.id === messageId);
    if (index >= 0) {
      this.mockData.messages[index] = { ...this.mockData.messages[index], ...updates };
    }
  }

  addLabel(label: MockGmailLabel) {
    this.mockData.labels.push(label);
  }

  reset() {
    this.mockData = {
      messages: [...MOCK_SAMPLE_MESSAGES],
      labels: [...MOCK_SYSTEM_LABELS, ...MOCK_USER_LABELS],
      accounts: [createMockGmailAccount()],
    };
  }
}

// Mock service functions for testing
export const mockGmailTauriService = {
  startGmailAuth: vi.fn(),
  completeGmailAuth: vi.fn(),
  sendGmailMessage: vi.fn(),
  saveDraft: vi.fn(),
  downloadAttachment: vi.fn(),
  refreshToken: vi.fn(),
  getAccounts: vi.fn(),
  removeAccount: vi.fn(),
};

export const mockGmailTauriService = {
  getMessages: vi.fn(),
  getMessage: vi.fn(),
  getLabels: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
  starMessages: vi.fn(),
  unstarMessages: vi.fn(),
  archiveMessages: vi.fn(),
  deleteMessages: vi.fn(),
  modifyLabels: vi.fn(),
};

// Helper function to convert mock data to ParsedEmail format
export function convertMockMessageToParsedEmail(mockMessage: MockGmailMessage): any {
  // Extract name from email if format is "Name <email@domain.com>"
  const parseEmailAddress = (emailString: string) => {
    const match = emailString.match(/^(.+?)\s*<(.+)>$/) || emailString.match(/^(.+)$/);
    if (match && match.length === 3) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: emailString.trim(), name: emailString.split('@')[0] };
  };

  return {
    id: mockMessage.id,
    threadId: mockMessage.threadId,
    accountId: 'test-account',
    subject: mockMessage.subject,
    from: parseEmailAddress(mockMessage.sender),
    to: [parseEmailAddress(mockMessage.recipient)],
    cc: [],
    bcc: [],
    date: new Date(mockMessage.date),
    body: mockMessage.body,
    snippet: mockMessage.snippet,
    isRead: mockMessage.isRead,
    isStarred: mockMessage.isStarred,
    hasAttachments: mockMessage.hasAttachments,
    attachments: mockMessage.attachments || [],
    labels: mockMessage.labelIds,
    importance: 'normal' as const,
    messageId: mockMessage.id,
  };
}

// Helper functions for setting up test scenarios
export function setupAuthenticatedUserScenario() {
  const account = createMockGmailAccount({
    email: 'testuser@gmail.com',
    name: 'Test User'
  });
  
  return {
    account,
    messages: MOCK_SAMPLE_MESSAGES.slice(0, 10).map(convertMockMessageToParsedEmail),
    labels: [...MOCK_SYSTEM_LABELS, ...MOCK_USER_LABELS],
  };
}

export function setupMultiAccountScenario() {
  return {
    accounts: [
      createMockGmailAccount({ id: 'acc1', email: 'work@company.com', name: 'Work Account' }),
      createMockGmailAccount({ id: 'acc2', email: 'personal@gmail.com', name: 'Personal Account' }),
    ],
    messages: MOCK_SAMPLE_MESSAGES.map(convertMockMessageToParsedEmail),
    labels: [...MOCK_SYSTEM_LABELS, ...MOCK_USER_LABELS],
  };
}

export function setupOfflineScenario() {
  return {
    account: createMockGmailAccount(),
    cachedMessages: MOCK_SAMPLE_MESSAGES.slice(0, 5),
    networkError: new Error('Network unavailable'),
  };
} 
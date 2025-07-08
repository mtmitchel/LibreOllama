import { ParsedEmail, GmailAccount, GmailLabel } from '../../types';
import { useMailStore } from '../mailStore';

/**
 * Test utilities for mail store
 * These methods should ONLY be used in tests, not in production code
 */
export const createTestMailStore = () => {
  const store = useMailStore.getState();
  
  return {
    /**
     * Test helper: Set authentication state
     * @param isAuthenticated - Whether user is authenticated
     */
    setTestAuthenticated: (isAuthenticated: boolean) => {
      console.log('🔑 [TEST] Setting authenticated state:', isAuthenticated);
      useMailStore.setState((state) => {
        state.isAuthenticated = isAuthenticated;
      });
    },

    /**
     * Test helper: Set current account ID
     * @param accountId - Account ID to set as current
     */
    setTestCurrentAccountId: (accountId: string | null) => {
      console.log('🔑 [TEST] Setting current account ID:', accountId);
      useMailStore.setState((state) => {
        state.currentAccountId = accountId;
      });
    },

    /**
     * Test helper: Set messages for an account
     * @param messages - Messages to set
     * @param accountId - Target account ID (defaults to current)
     */
    setTestMessages: (messages: ParsedEmail[], accountId?: string) => {
      const targetAccountId = accountId || store.currentAccountId;
      if (!targetAccountId) return;
      
      console.log('📧 [TEST] Setting messages for account:', targetAccountId);
      useMailStore.setState((state) => {
        if (!state.accountData[targetAccountId]) {
          state.accountData[targetAccountId] = {
            messages: [],
            threads: [],
            labels: [],
            drafts: [],
            totalMessages: 0,
            unreadMessages: 0,
            lastSyncAt: new Date(),
            syncInProgress: false,
          };
        }
        state.accountData[targetAccountId].messages = messages;
        state.accountData[targetAccountId].totalMessages = messages.length;
        state.accountData[targetAccountId].unreadMessages = messages.filter(msg => !msg.isRead).length;
      });
    },

    /**
     * Test helper: Set accounts
     * @param accounts - Array of accounts to set
     */
    setTestAccounts: (accounts: GmailAccount[]) => {
      console.log('👥 [TEST] Setting accounts:', accounts.length);
      useMailStore.setState((state) => {
        state.accounts = {};
        accounts.forEach(account => {
          state.accounts[account.id] = account;
        });
      });
    },

    /**
     * Test helper: Set sync in progress state
     * @param inProgress - Whether sync is in progress
     * @param accountId - Target account ID (defaults to current)
     */
    setTestSyncInProgress: (inProgress: boolean, accountId?: string) => {
      const targetAccountId = accountId || store.currentAccountId;
      if (!targetAccountId) return;
      
      console.log('🔄 [TEST] Setting sync in progress for account:', targetAccountId, inProgress);
      useMailStore.setState((state) => {
        if (!state.accountData[targetAccountId]) {
          state.accountData[targetAccountId] = {
            messages: [],
            threads: [],
            labels: [],
            drafts: [],
            totalMessages: 0,
            unreadMessages: 0,
            lastSyncAt: new Date(),
            syncInProgress: false,
          };
        }
        state.accountData[targetAccountId].syncInProgress = inProgress;
      });
    },

    /**
     * Test helper: Set current message
     * @param message - Message to set as current
     */
    setTestCurrentMessage: (message: ParsedEmail | null) => {
      console.log('📩 [TEST] Setting current message:', message?.id);
      useMailStore.setState((state) => {
        state.currentMessage = message;
      });
    },

    /**
     * Test helper: Set labels for an account
     * @param labels - Labels to set
     * @param accountId - Target account ID (defaults to current)
     */
    setTestLabels: (labels: GmailLabel[], accountId?: string) => {
      const targetAccountId = accountId || store.currentAccountId;
      if (!targetAccountId) return;
      
      console.log('🏷️ [TEST] Setting labels for account:', targetAccountId);
      useMailStore.setState((state) => {
        if (!state.accountData[targetAccountId]) {
          state.accountData[targetAccountId] = {
            messages: [],
            threads: [],
            labels: [],
            drafts: [],
            totalMessages: 0,
            unreadMessages: 0,
            lastSyncAt: new Date(),
            syncInProgress: false,
          };
        }
        state.accountData[targetAccountId].labels = labels;
      });
    },

    /**
     * Test helper: Reset store to initial state
     */
    resetTestStore: () => {
      console.log('🧹 [TEST] Resetting store to initial state');
      useMailStore.setState({
        accounts: {},
        accountData: {},
        currentAccountId: null,
        isAuthenticated: false,
        isLoading: false,
        isLoadingMessages: false,
        isLoadingThreads: false,
        isSending: false,
        isLoadingAccounts: false,
        currentThread: null,
        currentMessage: null,
        selectedMessages: [],
        currentView: 'INBOX',
        searchQuery: '',
        currentLabel: null,
        isComposing: false,
        composeDraft: null,
        error: null,
        connectionStatus: 'connected',
        settings: {
          syncInterval: 5,
          enableNotifications: true,
          enableOfflineMode: false,
          unifiedInbox: false,
        },
        // Pagination
        currentPage: 1,
        pageSize: 50,
        totalPages: 1,
        nextPageToken: undefined,
        prevPageToken: undefined,
        pageTokens: [],
        totalMessages: 0,
        currentPageStartIndex: 0,
        isNavigatingBackwards: false,
        authState: null,
      });
    },

    /**
     * Test helper: Get current store state (for assertions)
     */
    getTestState: () => {
      return useMailStore.getState();
    },
  };
};

/**
 * Mock data factory for tests
 */
export const createMockTestAccount = (id: string, email: string, name: string): GmailAccount => ({
  id,
  email,
  name,
  picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=random`,
  tokens: {
    access_token: `mock-token-${id}`,
    refresh_token: `mock-refresh-${id}`,
    token_type: 'Bearer',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
  isActive: id === 'account1',
  lastSync: new Date(),
  syncStatus: 'idle',
  quota: {
    used: Math.floor(Math.random() * 10000000000),
    total: 15000000000,
  },
});

export const createMockTestMessages = (accountId: string, accountEmail: string): ParsedEmail[] => [
  {
    id: `${accountId}-msg1`,
    threadId: `${accountId}-thread1`,
    from: { name: 'John Doe', email: 'john@example.com' },
    to: [{ name: 'You', email: accountEmail }],
    cc: [],
    bcc: [],
    subject: `Test Welcome to ${accountEmail}!`,
    body: 'Test message for unit testing...',
    htmlBody: '<p>Test message for unit testing...</p>',
    attachments: [],
    date: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
    snippet: 'Test message for unit testing...',
    accountId,
  },
  {
    id: `${accountId}-msg2`,
    threadId: `${accountId}-thread2`,
    from: { name: 'Test Support', email: 'support@test.com' },
    to: [{ name: 'You', email: accountEmail }],
    cc: [],
    bcc: [],
    subject: `Test Account verified for ${accountEmail}`,
    body: 'Test verification message.',
    htmlBody: '<p>Test verification message.</p>',
    attachments: [],
    date: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'STARRED'],
    snippet: 'Test verification message.',
    accountId,
  },
];

export const createMockTestLabels = (): GmailLabel[] => [
  { 
    id: 'INBOX', 
    name: 'Inbox', 
    messageListVisibility: 'show', 
    labelListVisibility: 'labelShow', 
    type: 'system', 
    messagesTotal: 25, 
    messagesUnread: 3, 
    threadsTotal: 20, 
    threadsUnread: 3 
  },
  { 
    id: 'STARRED', 
    name: 'Starred', 
    messageListVisibility: 'show', 
    labelListVisibility: 'labelShow', 
    type: 'system', 
    messagesTotal: 5, 
    messagesUnread: 0, 
    threadsTotal: 5, 
    threadsUnread: 0 
  },
  { 
    id: 'SENT', 
    name: 'Sent', 
    messageListVisibility: 'show', 
    labelListVisibility: 'labelShow', 
    type: 'system', 
    messagesTotal: 15, 
    messagesUnread: 0, 
    threadsTotal: 12, 
    threadsUnread: 0 
  },
  { 
    id: 'DRAFTS', 
    name: 'Drafts', 
    messageListVisibility: 'show', 
    labelListVisibility: 'labelShow', 
    type: 'system', 
    messagesTotal: 3, 
    messagesUnread: 0, 
    threadsTotal: 3, 
    threadsUnread: 0 
  },
  { 
    id: 'TEST_WORK', 
    name: 'Test Work', 
    messageListVisibility: 'show', 
    labelListVisibility: 'labelShow', 
    type: 'user', 
    messagesTotal: 8, 
    messagesUnread: 2, 
    threadsTotal: 6, 
    threadsUnread: 2 
  },
]; 
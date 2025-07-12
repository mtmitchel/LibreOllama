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
        composeData: {
          to: [],
          cc: [],
          bcc: [],
          subject: '',
          body: '',
          attachments: [],
          isScheduled: false,
        },
        error: null,
        connectionStatus: 'connected',
        settings: {
          syncInterval: 5,
          notifications: true,
          autoSave: false,
          enableUnifiedInbox: false,
          emailSignature: '',
          maxAttachmentSize: 25,
          readReceipts: true,
        },
        // Pagination



        nextPageToken: undefined,

        pageTokens: [],
        totalMessages: 0,

        isNavigatingBackwards: false,

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
  displayName: name,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=random`,

  isActive: id === 'account1',
  lastSyncAt: new Date(),
  syncStatus: 'idle',
  accessToken: `mock-token-${id}`,
  refreshToken: `mock-refresh-${id}`,
  tokenExpiry: new Date(Date.now() + 3600000),
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

    attachments: [],
    date: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
    snippet: 'Test message for unit testing...',
    accountId,
    hasAttachments: false,
    importance: 'normal',
    messageId: `${accountId}-msg1`,
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

    attachments: [],
    date: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'STARRED'],
    snippet: 'Test verification message.',
    accountId,
    hasAttachments: false,
    importance: 'normal',
    messageId: `${accountId}-msg2`,
  },
];

export const createMockTestLabels = (): GmailLabel[] => [
  { 
    id: 'INBOX', 
    name: 'Inbox', 
    messageListVisibility: 'show', 
    labelListVisibility: 'show', 
    type: 'system', 
    messagesTotal: 25, 
    messagesUnread: 3, 
    threadsTotal: 20, 
    threadsUnread: 3,
    color: '#4285f4'
  },
  { 
    id: 'STARRED', 
    name: 'Starred', 
    messageListVisibility: 'show', 
    labelListVisibility: 'show', 
    type: 'system', 
    messagesTotal: 5, 
    messagesUnread: 0, 
    threadsTotal: 5, 
    threadsUnread: 0,
    color: '#fbbc04'
  },
  { 
    id: 'SENT', 
    name: 'Sent', 
    messageListVisibility: 'show', 
    labelListVisibility: 'show', 
    type: 'system', 
    messagesTotal: 15, 
    messagesUnread: 0, 
    threadsTotal: 12, 
    threadsUnread: 0,
    color: '#34a853'
  },
  { 
    id: 'DRAFTS', 
    name: 'Drafts', 
    messageListVisibility: 'show', 
    labelListVisibility: 'show', 
    type: 'system', 
    messagesTotal: 3, 
    messagesUnread: 0, 
    threadsTotal: 3, 
    threadsUnread: 0,
    color: '#ea4335'
  },
  { 
    id: 'TEST_WORK', 
    name: 'Test Work', 
    messageListVisibility: 'show', 
    labelListVisibility: 'show', 
    type: 'user', 
    messagesTotal: 8, 
    messagesUnread: 2, 
    threadsTotal: 6, 
    threadsUnread: 2,
    color: '#ff6d01'
  },
]; 
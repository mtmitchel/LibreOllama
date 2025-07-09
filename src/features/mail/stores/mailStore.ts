import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  EnhancedMailStore, 
  MailState, 
  ParsedEmail, 
  EmailThread, 
  GmailLabel, 
  ComposeEmail,
  GmailAccount,
  AccountData,
  GMAIL_LABELS 
} from '../types';
import { gmailService } from '../services/gmailService';
import { handleGmailError } from '../services/gmailErrorHandler';
import { getGmailApiService } from '../services/gmailApiService';

// Enhanced mock data for multi-account development
const createMockAccount = (id: string, email: string, name: string): GmailAccount => ({
  id,
  email,
  displayName: name,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=random`,
  accessToken: `mock-token-${id}`,
  refreshToken: `mock-refresh-${id}`,
  tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
  isActive: id === 'account1',
  lastSyncAt: new Date(),
  syncStatus: 'idle',
  quotaUsed: Math.floor(Math.random() * 10000000000), // Random usage (0-10GB)
  quotaTotal: 15000000000, // 15GB
});

const createMockMessages = (accountId: string, accountEmail: string): ParsedEmail[] => [
  {
    id: `${accountId}-msg1`,
    threadId: `${accountId}-thread1`,
    from: { name: 'John Doe', email: 'john@example.com' },
    to: [{ name: 'You', email: accountEmail }],
    cc: [],
    bcc: [],
    subject: `Welcome to ${accountEmail}!`,
    body: 'Thanks for joining us. Here\'s everything you need to know...',

    attachments: [],
    date: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
    snippet: 'Thanks for joining us. Here\'s everything you need to know...',
    accountId,
    hasAttachments: false,
    importance: 'normal',
    messageId: `${accountId}-msg1`,
  },
  {
    id: `${accountId}-msg2`,
    threadId: `${accountId}-thread2`,
    from: { name: 'Support Team', email: 'support@company.com' },
    to: [{ name: 'You', email: accountEmail }],
    cc: [],
    bcc: [],
    subject: `Account verified for ${accountEmail}`,
    body: 'Great news! Your account verification is complete.',

    attachments: [],
    date: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'STARRED'],
    snippet: 'Great news! Your account verification is complete.',
    accountId,
    hasAttachments: false,
    importance: 'normal',
    messageId: `${accountId}-msg2`,
  },
];

const createMockLabels = (): GmailLabel[] => [
  { id: 'INBOX', name: 'Inbox', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 25, messagesUnread: 3, threadsTotal: 20, threadsUnread: 3 },
  { id: 'STARRED', name: 'Starred', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 5, messagesUnread: 0, threadsTotal: 5, threadsUnread: 0 },
  { id: 'SENT', name: 'Sent', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 15, messagesUnread: 0, threadsTotal: 12, threadsUnread: 0 },
  { id: 'DRAFTS', name: 'Drafts', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 3, messagesUnread: 0, threadsTotal: 3, threadsUnread: 0 },
  { id: 'WORK', name: 'Work', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'user', messagesTotal: 8, messagesUnread: 2, threadsTotal: 6, threadsUnread: 2 },
  { id: 'PERSONAL', name: 'Personal', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'user', messagesTotal: 12, messagesUnread: 1, threadsTotal: 10, threadsUnread: 1 }
];

const createMockAccountData = (account: GmailAccount): AccountData => ({
  messages: createMockMessages(account.id, account.email),
  threads: [],
  labels: createMockLabels(),
  drafts: [],
  totalMessages: 0,
  unreadMessages: 0,
  lastSyncAt: new Date(),
  syncInProgress: false,
});

// Mock accounts for development
const mockAccounts: GmailAccount[] = [
  createMockAccount('account1', 'work@company.com', 'Work Account'),
  createMockAccount('account2', 'personal@gmail.com', 'Personal Account'),
];

// Remove manual localStorage handling - Zustand persist will handle this
console.log('🔑 [AUTH] Zustand persistence will restore authentication state automatically');

const initialState: MailState = {
  // Multi-Account Authentication
  accounts: {}, // Will be restored by Zustand persist
  currentAccountId: null,
  isAuthenticated: false, // Will be restored by Zustand persist
  
  // Loading states
  isLoading: false,
  isLoadingMessages: false,
  isLoadingThreads: false,
  isSending: false,
  isLoadingAccounts: false,
  
  // Account-specific data
  accountData: {}, // Account data not persisted for security
  
  // Current view data
  currentThread: null,
  currentMessage: null,
  
  // UI State
  selectedMessages: [],
  currentView: 'INBOX',
  searchQuery: '',
  currentLabel: null,
  
  // Compose
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
  
  // Error state
  error: null,
  connectionStatus: 'connected',
  
  // Settings
  settings: {
    syncInterval: 5, // 5 minutes
    notifications: true,
    autoSave: false,
    enableUnifiedInbox: false,
    emailSignature: '',
    maxAttachmentSize: 25,
    readReceipts: true,
  },

  // Filters and sorting
  filters: {
    dateRange: undefined,
    hasAttachments: undefined,
    isUnread: undefined,
    importance: undefined,
    labels: undefined,
  },
  sortBy: 'date',
  sortOrder: 'desc',

  // Token-based pagination (Gmail API style)
  nextPageToken: undefined,
  pageTokens: [], // Stack of page tokens for backward navigation
  totalMessages: 0,
  messagesLoadedSoFar: 0, // Track cumulative messages loaded
  currentPageSize: 50,
  isNavigatingBackwards: false, // Flag to prevent pageTokens modification during backwards navigation
};

// Periodic sync interval (will be set up after store creation)
let syncInterval: NodeJS.Timeout | null = null;

const useMailStore = create<EnhancedMailStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Helper functions for multi-account
        getCurrentAccount: () => {
          const state = get();
          return state.currentAccountId ? state.accounts[state.currentAccountId] || null : null;
        },

        getActiveAccountData: () => {
          const state = get();
          return state.currentAccountId ? state.accountData[state.currentAccountId] || null : null;
        },

        getAccountById: (accountId: string) => {
          const state = get();
          return state.accounts[accountId] || null;
        },

        getAccountDataById: (accountId: string) => {
          const state = get();
          return state.accountData[accountId] || null;
        },

        getAllMessages: () => {
          const state = get();
          return Object.values(state.accountData).flatMap(data => data.messages);
        },

        getAllThreads: () => {
          const state = get();
          return Object.values(state.accountData).flatMap(data => data.threads);
        },

        // Computed properties for current account
        getLabels: () => {
          const state = get();
          const accountData = state.getActiveAccountData();
          const labels = accountData?.labels || [];
          console.log('📋 [STORE] getLabels called, returning:', labels.length, 'labels for account:', state.currentAccountId);
          return labels;
        },

        getMessages: () => {
          const state = get();
          const accountData = state.getActiveAccountData();
          return accountData?.messages || [];
        },

        getAccountsArray: () => {
          const state = get();
          return Object.values(state.accounts);
        },

        // Pagination computed properties
        get currentPage() {
          const state = get();
          return state.pageTokens.length + 1;
        },

        get pageSize() {
          const state = get();
          return state.currentPageSize;
        },

        get currentPageStartIndex() {
          const state = get();
          return state.messagesLoadedSoFar - state.getMessages().length;
        },

        // Account Management
        addAccount: async (account: GmailAccount) => {
          set((state) => {
            state.isLoadingAccounts = true;
            state.error = null;
          });

          try {
            console.log('📧 [STORE] Adding account to store:', account.email);
            
            // Add new account and make it active immediately (no artificial delay needed)
            set((state) => {
              state.accounts[account.id] = account;
              state.currentAccountId = account.id;
              state.isAuthenticated = true;
              
              // Initialize account data with empty structure (real data will be fetched)
              if (!state.accountData[account.id]) {
                state.accountData[account.id] = {
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
              
              state.isLoadingAccounts = false;
            });

            // Fetch real data for the new account (skip in test environment to avoid race conditions)
            if (process.env.NODE_ENV !== 'test') {
              const { fetchMessages, fetchLabels } = get();
              console.log(`🔄 [STORE] Fetching initial data for new account: ${account.email}`);
              
              try {
                // Fetch labels first, then messages (labels needed for total count)
                await fetchLabels(account.id);
                await fetchMessages(undefined, undefined, undefined, account.id);
                console.log(`✅ [STORE] Initial data loaded for account: ${account.email}`);
              } catch (dataError) {
                console.warn(`⚠️ [STORE] Failed to load initial data for account: ${account.email}`, dataError);
                // Don't fail the account addition, just log the warning
                // User can manually refresh to load data
              }
            } else {
              console.log(`🧪 [STORE] Test environment detected - skipping automatic data fetch for account: ${account.email}`);
            }
            
            console.log('✅ [STORE] Account added successfully:', account.email);
          } catch (error) {
            console.error('❌ [STORE] Failed to add account:', error);
            const handledError = handleGmailError(error, {
              operation: 'add_account',
              accountId: account.id,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingAccounts = false;
            });
          }
        },

        removeAccount: async (accountId: string) => {
          set((state) => {
            state.isLoadingAccounts = true;
            state.error = null;
          });

          try {
            // This would revoke tokens and clean up
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set((state) => {
              delete state.accounts[accountId];
              delete state.accountData[accountId];
              
              // Potentially switch to another account or sign out
              if (state.currentAccountId === accountId) {
                const remainingAccountIds = Object.keys(state.accounts);
                if (remainingAccountIds.length > 0) {
                  state.currentAccountId = remainingAccountIds[0];
                } else {
                  state.currentAccountId = null;
                  state.isAuthenticated = false;
                }
              }
              
              state.isLoadingAccounts = false;
            });
          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'remove_account',
              accountId,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingAccounts = false;
            });
          }
        },

        switchAccount: (accountId: string) => {
          set((state) => {
            const account = state.accounts[accountId];
            if (account) {
              state.currentAccountId = accountId;
            }
          });
        },

        refreshAccount: async (accountId: string) => {
          const account = get().accounts[accountId];
          if (!account) {
            console.error('Account not found:', accountId);
            return;
          }

          set((state) => {
            if (state.accounts[accountId]) {
              state.accounts[accountId].syncStatus = 'syncing';
            }
          });

          try {
            console.log('🔄 [STORE] Refreshing account quota:', account.email);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(accountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Verify authentication by getting user profile (this handles token validation internally)
            let userProfile;
            try {
              userProfile = await gmailApi.getUserProfile();
            } catch (error) {
              console.error('❌ [QUOTA] Authentication verification failed - account needs re-authentication:', error);
              
              // If authentication fails, remove the account from the store to force re-authentication
              if (error instanceof Error && error.message.includes('Authentication')) {
                set((state) => {
                  delete state.accounts[accountId];
                  if (state.currentAccountId === accountId) {
                    const remainingAccounts = Object.keys(state.accounts);
                    state.currentAccountId = remainingAccounts.length > 0 ? remainingAccounts[0] : null;
                  }
                });
              }
              
              throw new Error('Authentication failed - please sign out and sign in again');
            }
            
            if (!userProfile) {
              throw new Error('Failed to verify account authentication');
            }

            // For now, we'll skip quota refresh since it requires direct token access
            // This functionality should be moved to the backend service
            console.log('⚠️ [QUOTA] Quota refresh temporarily disabled - needs backend implementation');
            
            set((state) => {
              if (state.accounts[accountId]) {
                state.accounts[accountId].syncStatus = 'idle';
                state.accounts[accountId].lastSyncAt = new Date();
              }
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to refresh account:', error);
            set((state) => {
              if (state.accounts[accountId]) {
                state.accounts[accountId].syncStatus = 'error';
                // If authentication failed, set a clear error message
                if (error instanceof Error && error.message.includes('Authentication failed')) {
                  state.accounts[accountId].errorMessage = 'Authentication expired - please sign out and sign in again';
                }
              }
            });
          }
        },

        syncAllAccounts: async () => {
          const accounts = get().accounts;
          if (Object.keys(accounts).length === 0) {
            console.log('📭 [SYNC] No accounts to sync');
            return;
          }

          console.log(`🔄 [SYNC] Starting sync for ${Object.keys(accounts).length} accounts`);
          
          set((state) => {
            state.isLoadingAccounts = true;
            state.error = null;
            Object.values(state.accounts).forEach(acc => {
              acc.syncStatus = 'syncing';
            });
          });

          try {
            const { fetchMessages, fetchLabels } = get();
            
            // Sync all accounts in parallel
            const syncPromises = Object.values(accounts).map(async (account) => {
              try {
                console.log(`🔄 [SYNC] Syncing account: ${account.email}`);
                
                // Fetch labels first, then messages (labels needed for total count)
                await fetchLabels(account.id);
                await fetchMessages(undefined, undefined, undefined, account.id);
                
                console.log(`✅ [SYNC] Account synced: ${account.email}`);
                return account.id;
              } catch (error) {
                console.error(`❌ [SYNC] Failed to sync account ${account.email}:`, error);
                set((state) => {
                  if (state.accounts[account.id]) {
                    state.accounts[account.id].syncStatus = 'error';
                  }
                });
                throw error;
              }
            });

            await Promise.all(syncPromises);
            
            set((state) => {
              Object.values(state.accounts).forEach(acc => {
                acc.lastSyncAt = new Date();
                acc.syncStatus = 'idle';
              });
              state.isLoadingAccounts = false;
            });
            
            console.log(`✅ [SYNC] All accounts synced successfully`);
          } catch (error) {
            console.error('❌ [SYNC] Sync failed for some accounts:', error);
            const handledError = handleGmailError(error, {
              operation: 'sync_all_accounts',
            });
            set((state) => {
              // Only set accounts to error status if they weren't already set above
              Object.values(state.accounts).forEach(acc => {
                if (acc.syncStatus === 'syncing') {
                  acc.syncStatus = 'error';
                }
              });
              state.error = handledError.message;
              state.isLoadingAccounts = false;
            });
          }
        },

        // Authentication actions
        authenticate: async (accountId?: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          const targetAccountId = accountId || get().currentAccountId;
          
          try {
            if (!targetAccountId) {
              throw new Error('No account specified for authentication');
            }

            // This would integrate with the actual OAuth flow
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            set((state) => {
              state.isAuthenticated = true;
              state.isLoading = false;
              state.connectionStatus = 'connected';
              
              const account = state.accounts[targetAccountId];
              if (account) {
                account.syncStatus = 'idle';
              }
            });
          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'authenticate',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoading = false;
              state.connectionStatus = 'error';
            });
          }
        },

        // Message actions
        fetchMessages: async (labelId?: string, query?: string, pageToken?: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) {
            set((state) => {
              state.error = 'No account selected';
            });
            return;
          }

          set((state) => {
            state.isLoadingMessages = true;
            state.error = null;
          });
          
          try {
            console.log(`📨 [STORE] Fetching real messages for account: ${targetAccountId}`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Determine label IDs to fetch
            const labelIds = labelId ? [labelId] : ['INBOX'];
            
            // Fetch labels first if we don't have them (needed for total count)
            const accountData = get().accountData[targetAccountId];
            if (!accountData || !accountData.labels || accountData.labels.length === 0) {
              console.log(`🏷️ [STORE] Fetching labels first to get total count`);
              try {
                const labels = await gmailApi.getLabels();
                set((state) => {
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
              } catch (labelError) {
                console.warn('⚠️ [STORE] Failed to fetch labels for total count:', labelError);
              }
            }

            // Fetch real messages from Gmail API
            const result = await gmailApi.getMessages(labelIds, 50, pageToken, query);
            
            console.log(`✅ [STORE] Fetched ${result.messages.length} real messages`);
            console.log(`🔗 [STORE] API result:`, { 
              messageCount: result.messages.length, 
              nextPageToken: result.nextPageToken,
              hasNextPageToken: !!result.nextPageToken
            });
            console.log(`🔗 [STORE] Full API result:`, result);

            set((state) => {
              // Initialize account data if it doesn't exist
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
              
              // Update messages with real data
              state.accountData[targetAccountId].messages = result.messages;
              state.accountData[targetAccountId].unreadMessages = result.messages.filter(msg => !msg.isRead).length;
              state.accountData[targetAccountId].lastSyncAt = new Date();

              // Get total count from labels (don't set to just current page count)
              const accountData = state.accountData[targetAccountId];
              const inboxLabel = accountData.labels.find(label => label.id === 'INBOX');
              
              console.log(`📄 [STORE] Checking totalMessages:`, {
                hasInboxLabel: !!inboxLabel,
                inboxMessagesTotal: inboxLabel?.messagesTotal,
                currentAccountTotalMessages: accountData.totalMessages
              });
              
              if (inboxLabel && typeof inboxLabel.messagesTotal === 'number' && inboxLabel.messagesTotal > 0) {
                state.accountData[targetAccountId].totalMessages = inboxLabel.messagesTotal;
                console.log(`📄 [STORE] Set totalMessages from INBOX label: ${inboxLabel.messagesTotal}`);
              } else {
                // Fallback: if no label info, use a reasonable estimate
                const estimatedTotal = pageToken ? 
                  Math.max(result.messages.length, state.messagesLoadedSoFar + result.messages.length) :
                  result.messages.length;
                state.accountData[targetAccountId].totalMessages = estimatedTotal;
                console.log(`📄 [STORE] Set totalMessages from fallback: ${estimatedTotal}`);
              }
              state.isLoadingMessages = false;
              
              // Update pagination state for token-based pagination
              state.nextPageToken = result.nextPageToken;
              console.log(`📄 [STORE] Setting pagination state - nextPageToken:`, result.nextPageToken);
              console.log(`📄 [STORE] Setting pagination state - hasNextPageToken:`, !!result.nextPageToken);
              
              // Handle token-based navigation
              if (pageToken) {
                if (state.isNavigatingBackwards) {
                  // Going backwards - remove the last token and recalculate position
                  if (state.pageTokens.length > 0) {
                    state.pageTokens.pop();
                  }
                  // When going back, we're on the page before the current token
                  // So messages loaded is tokens.length * pageSize
                  state.messagesLoadedSoFar = state.pageTokens.length * state.currentPageSize;
                } else {
                  // Forward navigation - we're moving to the next page
                  // Messages loaded so far is the previous pages
                  state.messagesLoadedSoFar = state.pageTokens.length * state.currentPageSize;
                  
                  // Add current token to stack for potential backward navigation
                  if (!state.pageTokens.includes(pageToken)) {
                    state.pageTokens.push(pageToken);
                  }
                }
              } else {
                // First page - reset everything
                state.pageTokens = [];
                state.messagesLoadedSoFar = 0;
              }
              
              // Set totalMessages from account data (which gets it from labels)
              // Make sure we have a valid number
              const finalTotalMessages = state.accountData[targetAccountId].totalMessages || 0;
              state.totalMessages = finalTotalMessages;
              
              console.log(`📄 [STORE] Token pagination state:`, {
                messagesLoadedSoFar: state.messagesLoadedSoFar,
                currentPageMessages: result.messages.length,
                totalMessages: finalTotalMessages,
                hasNext: !!result.nextPageToken,
                tokensInStack: state.pageTokens.length
              });
              
              // No need for prevPageToken in token-based pagination
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to fetch messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'fetch_messages',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingMessages = false;
            });
          }
        },

        fetchMessage: async (messageId: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            console.log(`📧 [STORE] Fetching real message: ${messageId}`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // First check if we already have the message in our store
            const accountData = get().accountData[targetAccountId];
            let message = accountData?.messages.find(msg => msg.id === messageId);
            
            // If not found in store, fetch from API
            if (!message) {
              console.log(`🔍 [STORE] Message not in store, fetching from API...`);
              message = (await gmailApi.getMessage(messageId)) || undefined;
            }
            
            if (!message) {
              throw new Error('Message not found');
            }

            console.log(`✅ [STORE] Message fetched: ${message.subject}`);

            set((state) => {
              state.currentMessage = message;
              state.isLoading = false;
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to fetch message:', error);
            const handledError = handleGmailError(error, {
              operation: 'fetch_message',
              accountId: targetAccountId || undefined,
              messageId,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoading = false;
            });
          }
        },

        fetchThread: async (threadId: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            state.isLoadingThreads = true;
            state.error = null;
          });
          
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const accountData = get().accountData[targetAccountId];
            const threadMessages = accountData?.messages.filter(msg => msg.threadId === threadId) || [];
            
            if (threadMessages.length === 0) {
              throw new Error('Thread not found');
            }

            const thread: EmailThread = {
              id: threadId,
              subject: threadMessages[0].subject,
              participants: Array.from(new Set([
                ...threadMessages.flatMap(msg => [msg.from, ...msg.to, ...(msg.cc || []), ...(msg.bcc || [])])
              ])),
              messages: threadMessages,
              lastMessageDate: threadMessages[threadMessages.length - 1].date,
              isRead: threadMessages.every(msg => msg.isRead),
              isStarred: threadMessages.some(msg => msg.isStarred),
              labels: Array.from(new Set(threadMessages.flatMap(msg => msg.labels))),
              messageCount: threadMessages.length,
              accountId: targetAccountId!,
              hasAttachments: threadMessages.some(msg => msg.hasAttachments),
              snippet: threadMessages[0]?.snippet || '',
            };

            set((state) => {
              state.currentThread = thread;
              state.isLoadingThreads = false;
            });
          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'fetch_thread',
              threadId,
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingThreads = false;
            });
          }
        },

        // Real Gmail API implementations
        markAsRead: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`📖 [STORE] Marking ${messageIds.length} messages as read`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Update via Gmail API
            await gmailApi.markAsRead(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                messageIds.forEach(id => {
                  const message = accountData.messages.find(msg => msg.id === id);
                  if (message) {
                    message.isRead = true;
                    message.labels = message.labels.filter(label => label !== 'UNREAD');
                  }
                });
                // Update unread count
                state.accountData[targetAccountId].unreadMessages = accountData.messages.filter(msg => !msg.isRead).length;
              }
            });
            
            console.log(`✅ [STORE] Successfully marked messages as read`);
          } catch (error) {
            console.error('❌ [STORE] Failed to mark messages as read:', error);
            const handledError = handleGmailError(error, {
              operation: 'mark_as_read',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        markAsUnread: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`📩 [STORE] Marking ${messageIds.length} messages as unread`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Update via Gmail API
            await gmailApi.markAsUnread(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                messageIds.forEach(id => {
                  const message = accountData.messages.find(msg => msg.id === id);
                  if (message) {
                    message.isRead = false;
                    if (!message.labels.includes('UNREAD')) {
                      message.labels.push('UNREAD');
                    }
                  }
                });
                // Update unread count
                state.accountData[targetAccountId].unreadMessages = accountData.messages.filter(msg => !msg.isRead).length;
              }
            });
            
            console.log(`✅ [STORE] Successfully marked messages as unread`);
          } catch (error) {
            console.error('❌ [STORE] Failed to mark messages as unread:', error);
            const handledError = handleGmailError(error, {
              operation: 'mark_as_unread',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        deleteMessages: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`🗑️ [STORE] Deleting ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Delete via Gmail API
            await gmailApi.deleteMessages(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                accountData.messages = accountData.messages.filter(msg => !messageIds.includes(msg.id));
                // Update counts
                state.accountData[targetAccountId].totalMessages = accountData.messages.length;
                state.accountData[targetAccountId].unreadMessages = accountData.messages.filter(msg => !msg.isRead).length;
              }
            });
            
            console.log(`✅ [STORE] Successfully deleted messages`);
          } catch (error) {
            console.error('❌ [STORE] Failed to delete messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'delete_messages',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        archiveMessages: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`📦 [STORE] Archiving ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Archive via Gmail API
            await gmailApi.archiveMessages(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                messageIds.forEach(id => {
                  const message = accountData.messages.find(msg => msg.id === id);
                  if (message) {
                    message.labels = message.labels.filter(label => label !== 'INBOX');
                  }
                });
              }
            });
            
            console.log(`✅ [STORE] Successfully archived messages`);
          } catch (error) {
            console.error('❌ [STORE] Failed to archive messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'archive_messages',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        starMessages: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`⭐ [STORE] Starring ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Star via Gmail API
            await gmailApi.starMessages(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                messageIds.forEach(id => {
                  const message = accountData.messages.find(msg => msg.id === id);
                  if (message) {
                    message.isStarred = true;
                    if (!message.labels.includes('STARRED')) {
                      message.labels.push('STARRED');
                    }
                  }
                });
              }
            });
            
            console.log(`✅ [STORE] Successfully starred messages`);
          } catch (error) {
            console.error('❌ [STORE] Failed to star messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'star_messages',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        unstarMessages: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`☆ [STORE] Unstarring ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Unstar via Gmail API
            await gmailApi.unstarMessages(messageIds);

            // Update local state
            set((state) => {
              const accountData = state.accountData[targetAccountId];
              if (accountData) {
                messageIds.forEach(id => {
                  const message = accountData.messages.find(msg => msg.id === id);
                  if (message) {
                    message.isStarred = false;
                    message.labels = message.labels.filter(label => label !== 'STARRED');
                  }
                });
              }
            });
            
            console.log(`✅ [STORE] Successfully unstarred messages`);
          } catch (error) {
            console.error('❌ [STORE] Failed to unstar messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'unstar_messages',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        // Labels
        fetchLabels: async (accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) {
            console.warn('🏷️ [STORE] No target account ID for fetchLabels');
            return;
          }

          try {
            console.log(`🏷️ [STORE] Fetching real labels for account: ${targetAccountId}`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              console.error('🏷️ [STORE] Failed to get Gmail API service for account:', targetAccountId);
              throw new Error('Failed to initialize Gmail API service');
            }

            // Fetch real labels from Gmail API
            const labels = await gmailApi.getLabels();
            
            console.log(`✅ [STORE] Fetched ${labels.length} real labels:`, labels.map(l => l.name));

            set((state) => {
              // Initialize account data if it doesn't exist
              if (!state.accountData[targetAccountId]) {
                console.log('🏷️ [STORE] Initializing account data for:', targetAccountId);
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
              
              // Update labels with real data
              console.log(`🏷️ [STORE] Setting ${labels.length} labels for account:`, targetAccountId);
              state.accountData[targetAccountId].labels = labels;
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to fetch labels:', error);
            
            // If tokens are corrupted, they've already been cleared by the API service
            if (error instanceof Error && error.message.includes('Authentication tokens are corrupted')) {
              // Remove the account from the store to force re-authentication
              set((state) => {
                delete state.accounts[targetAccountId];
                if (state.currentAccountId === targetAccountId) {
                  const remainingAccounts = Object.keys(state.accounts);
                  state.currentAccountId = remainingAccounts.length > 0 ? remainingAccounts[0] : null;
                }
              });
              return; // Don't set fallback labels for corrupted accounts
            }
            
            // As a fallback, set some basic system labels
            set((state) => {
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
              
              // Set fallback system labels
              const fallbackLabels: GmailLabel[] = [
                { id: 'INBOX', name: 'Inbox', messageListVisibility: 'show' as const, labelListVisibility: 'labelShow' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0 },
                { id: 'SENT', name: 'Sent', messageListVisibility: 'show' as const, labelListVisibility: 'labelShow' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0 },
                { id: 'DRAFT', name: 'Drafts', messageListVisibility: 'show' as const, labelListVisibility: 'labelShow' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0 },
              ];
              
              console.log(`🏷️ [STORE] Setting fallback labels for account:`, targetAccountId);
              state.accountData[targetAccountId].labels = fallbackLabels;
            });
            
            const handledError = handleGmailError(error, {
              operation: 'fetch_labels',
              accountId: targetAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        addLabel: async (messageIds: string[], labelId: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              messageIds.forEach(id => {
                const message = accountData.messages.find(msg => msg.id === id);
                if (message && !message.labels.includes(labelId)) {
                  message.labels.push(labelId);
                }
              });
            }
          });
        },

        removeLabel: async (messageIds: string[], labelId: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              messageIds.forEach(id => {
                const message = accountData.messages.find(msg => msg.id === id);
                if (message) {
                  message.labels = message.labels.filter(label => label !== labelId);
                }
              });
            }
          });
        },

        // Compose actions
        startCompose: (draft?: Partial<ComposeEmail>) => {
          set((state) => {
            state.isComposing = true;
                                      state.composeData = {
              to: [],
              cc: [],
              bcc: [],
              subject: '',
              body: '',
              attachments: [],
              isScheduled: false,
              accountId: state.currentAccountId || undefined,
              ...draft,
            };
          });
        },

        updateCompose: (updates: Partial<ComposeEmail>) => {
          set((state) => {
            if (state.composeData) {
              Object.assign(state.composeData, updates);
            }
          });
        },

        sendEmail: async (email: ComposeEmail) => {
          set((state) => {
            state.isSending = true;
            state.error = null;
          });

          try {
            const targetAccountId = email.accountId || get().currentAccountId;
            if (!targetAccountId) {
              throw new Error('No account selected for sending');
            }

            // This would integrate with the actual send functionality
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            set((state) => {
              state.isSending = false;
              state.isComposing = false;
              state.composeData = {
                to: [],
                cc: [],
                bcc: [],
                subject: '',
                body: '',
                attachments: [],
                isScheduled: false,
              };
            });
          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'send_email',
              accountId: email.accountId || get().currentAccountId || undefined,
            });
            set((state) => {
              state.error = handledError.message;
              state.isSending = false;
            });
          }
        },

        saveDraft: async (email: ComposeEmail) => {
          // Implementation for saving draft
          console.log('Saving draft for account:', email.accountId);
        },

        cancelCompose: () => {
          set((state) => {
            state.isComposing = false;
            state.composeData = {
              to: [],
              cc: [],
              bcc: [],
              subject: '',
              body: '',
              attachments: [],
              isScheduled: false,
            };
          });
        },

        // Search
        searchMessages: async (query: string, accountId?: string) => {
          await get().fetchMessages(undefined, query, undefined, accountId);
        },

        clearSearch: () => {
          set((state) => {
            state.searchQuery = '';
          });
          get().fetchMessages();
        },

        // UI Actions
        setCurrentView: (view: MailState['currentView']) => {
          set((state) => {
            state.currentView = view;
            state.selectedMessages = [];
          });
        },

        setCurrentLabel: (labelId: string | null) => {
          set((state) => {
            state.currentLabel = labelId;
            state.selectedMessages = [];
          });
        },

        selectMessage: (messageId: string, isSelected: boolean) => {
          set((state) => {
            if (isSelected) {
              if (!state.selectedMessages.includes(messageId)) {
                state.selectedMessages.push(messageId);
              }
            } else {
              state.selectedMessages = state.selectedMessages.filter(id => id !== messageId);
            }
          });
        },

        selectAllMessages: (isSelected: boolean) => {
          set((state) => {
            const accountData = state.currentAccountId ? state.accountData[state.currentAccountId] : null;
            if (accountData) {
              state.selectedMessages = isSelected ? accountData.messages.map(msg => msg.id) : [];
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedMessages = [];
          });
        },

        // Settings
        updateSettings: (settings: Partial<MailState['settings']>) => {
          set((state) => {
            Object.assign(state.settings, settings);
          });
        },

        // Error handling
        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Token-based pagination
        nextPage: async () => {
          const state = get();
          console.log('📄 [STORE] nextPage called, state:', {
            nextPageToken: state.nextPageToken,
            hasNextPageToken: !!state.nextPageToken,
            messagesLoadedSoFar: state.messagesLoadedSoFar
          });
          
          if (!state.nextPageToken) {
            console.log('📄 [STORE] No nextPageToken available, cannot go to next page');
            return;
          }
          
          console.log('📄 [STORE] Fetching next page with token:', state.nextPageToken);
          await state.fetchMessages(
            state.currentView === 'label' ? state.currentLabel || undefined : state.currentView,
            state.searchQuery,
            state.nextPageToken,
            state.currentAccountId || undefined
          );
        },

        prevPage: async () => {
          const state = get();
          console.log('🔙 [STORE] prevPage called, state:', {
            pageTokens: state.pageTokens,
            pageTokensLength: state.pageTokens.length,
            messagesLoadedSoFar: state.messagesLoadedSoFar
          });
          
          if (state.pageTokens.length === 0) {
            console.log('🔙 [STORE] Already on first page, cannot go back');
            return;
          }
          
          // Get the token for the previous page
          // Remove the current page token and use the previous one
          const prevPageToken = state.pageTokens.length > 1 ? state.pageTokens[state.pageTokens.length - 2] : undefined;
          
          console.log('🔙 [STORE] Going to previous page with token:', prevPageToken);
          console.log('🔙 [STORE] Current pageTokens:', state.pageTokens);
          
          // Mark that we're going backwards to prevent pageTokens modification
          set((state) => {
            state.isNavigatingBackwards = true;
          });
          
          try {
            await state.fetchMessages(
              state.currentView === 'label' ? state.currentLabel || undefined : state.currentView,
              state.searchQuery,
              prevPageToken,
              state.currentAccountId || undefined
            );
            console.log('🔙 [STORE] Previous page fetch completed successfully');
          } catch (error) {
            console.error('🔙 [STORE] Previous page fetch failed:', error);
          }
          
          // Clean up the backwards navigation flag
          set((state) => {
            state.isNavigatingBackwards = false;
          });
        },

        goToPage: async (pageToken?: string) => {
          const state = get();
          
          await state.fetchMessages(
            state.currentView === 'label' ? state.currentLabel || undefined : state.currentView,
            state.searchQuery,
            pageToken,
            state.currentAccountId || undefined
          );
        },

        // Sign out and clear authentication
        signOut: async (accountId?: string) => {
          // Reset store state - Zustand persist will handle localStorage
          set((state) => {
            state.isAuthenticated = false;
            state.accounts = {};
            state.accountData = {};
            state.currentAccountId = null;
            state.error = null;
          });
        },

        // Real-time sync management
        startPeriodicSync: (intervalMinutes: number = 5) => {
          if (syncInterval) {
            clearInterval(syncInterval);
          }
          
          const { syncAllAccounts } = get();
          
          console.log(`🔄 [SYNC] Starting periodic sync every ${intervalMinutes} minutes`);
          
          syncInterval = setInterval(async () => {
            const accounts = get().accounts;
            if (Object.keys(accounts).length > 0) {
              console.log('🔄 [SYNC] Running periodic sync...');
              try {
                await syncAllAccounts();
              } catch (error) {
                console.error('❌ [SYNC] Periodic sync failed:', error);
              }
            }
          }, intervalMinutes * 60 * 1000);
        },

        stopPeriodicSync: () => {
          if (syncInterval) {
            console.log('⏹️ [SYNC] Stopping periodic sync');
            clearInterval(syncInterval);
            syncInterval = null;
          }
        },

        // Test helper methods (for compatibility with existing tests)
        setAuthenticated: (isAuthenticated: boolean) => {
          set((state) => {
            state.isAuthenticated = isAuthenticated;
          });
        },

        setCurrentAccountId: (accountId: string | null) => {
          set((state) => {
            state.currentAccountId = accountId;
          });
        },

        setMessages: (messages: ParsedEmail[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
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
            state.accountData[targetAccountId].unreadMessages = messages.filter(msg => !msg.isRead).length;
            state.accountData[targetAccountId].totalMessages = messages.length;
          });
        },

        setAccounts: (accounts: GmailAccount[]) => {
          set((state) => {
            state.accounts = {};
            accounts.forEach(account => {
              state.accounts[account.id] = account;
            });
          });
        },

        setSyncInProgress: (inProgress: boolean, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            if (state.accountData[targetAccountId]) {
              state.accountData[targetAccountId].syncInProgress = inProgress;
            }
          });
        },

        setCurrentMessage: (message: ParsedEmail | null) => {
          set((state) => {
            state.currentMessage = message;
          });
        },

        setLabels: (labels: GmailLabel[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
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

        // PRODUCTION METHODS ONLY - Test helpers moved to __tests__/mailStoreTestUtils.ts
      })),
      {
        name: 'gmail-auth-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // use localStorage
        partialize: (state) => ({ 
          accounts: state.accounts,
          currentAccountId: state.currentAccountId,
          isAuthenticated: state.isAuthenticated 
        }), // persist auth-related state
      }
    )
  )
);

export { useMailStore }; 
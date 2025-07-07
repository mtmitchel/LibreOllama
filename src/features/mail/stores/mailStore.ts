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
  name,
  picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=random`,
  tokens: {
    access_token: `mock-token-${id}`,
    refresh_token: `mock-refresh-${id}`,
    token_type: 'Bearer',
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  },
  isActive: id === 'account1',
  lastSync: new Date(),
  syncStatus: 'idle',
  quota: {
    used: Math.floor(Math.random() * 10000000000), // Random usage
    total: 15000000000, // 15GB
  },
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
    htmlBody: '<p>Thanks for joining us. Here\'s everything you need to know...</p>',
    attachments: [],
    date: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
    snippet: 'Thanks for joining us. Here\'s everything you need to know...',
    accountId,
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
    htmlBody: '<p>Great news! Your account verification is complete.</p>',
    attachments: [],
    date: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'STARRED'],
    snippet: 'Great news! Your account verification is complete.',
    accountId,
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
  currentView: 'inbox',
  searchQuery: '',
  currentLabel: null,
  
  // Compose
  isComposing: false,
  composeDraft: null,
  
  // Error state
  error: null,
  connectionStatus: 'connected',
  
  // Settings
  settings: {
    syncInterval: 5, // 5 minutes
    enableNotifications: true,
    enableOfflineMode: false,
    unifiedInbox: false,
  },

  authState: null, // For OAuth state validation
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
          return accountData?.labels || [];
        },

        getMessages: () => {
          const state = get();
          const accountData = state.getActiveAccountData();
          return accountData?.messages || [];
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

            // Fetch real data for the new account
            const { fetchMessages, fetchLabels } = get();
            console.log(`🔄 [STORE] Fetching initial data for new account: ${account.email}`);
            
            try {
              // Fetch labels and messages in parallel
              await Promise.all([
                fetchLabels(account.id),
                fetchMessages(undefined, undefined, undefined, account.id)
              ]);
              console.log(`✅ [STORE] Initial data loaded for account: ${account.email}`);
            } catch (dataError) {
              console.warn(`⚠️ [STORE] Failed to load initial data for account: ${account.email}`, dataError);
              // Don't fail the account addition, just log the warning
              // User can manually refresh to load data
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
            const handledError = handleGmailError(error);
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

        refreshAccount: (accountId: string) => {
          // This will be implemented with token refresh logic
          console.log('Refreshing account:', accountId);
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
                
                // Fetch latest messages and labels for each account
                await Promise.all([
                  fetchMessages(undefined, undefined, undefined, account.id),
                  fetchLabels(account.id)
                ]);
                
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
                acc.lastSync = new Date();
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
          
          try {
            const targetAccountId = accountId || state.currentAccountId;
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
            const handledError = handleGmailError(error);
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
            
            // Fetch real messages from Gmail API
            const result = await gmailApi.getMessages(labelIds, 50, pageToken, query);
            
            console.log(`✅ [STORE] Fetched ${result.messages.length} real messages`);

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
              state.accountData[targetAccountId].totalMessages = result.messages.length;
              state.accountData[targetAccountId].unreadMessages = result.messages.filter(msg => !msg.isRead).length;
              state.accountData[targetAccountId].lastSyncAt = new Date();
              state.isLoadingMessages = false;
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to fetch messages:', error);
            const handledError = handleGmailError(error, {
              operation: 'fetch_messages',
              accountId: targetAccountId,
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
              message = await gmailApi.getMessage(messageId);
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
            };

            set((state) => {
              state.currentThread = thread;
              state.isLoadingThreads = false;
            });
          } catch (error) {
            const handledError = handleGmailError(error);
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
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
              accountId: targetAccountId,
            });
            set((state) => {
              state.error = handledError.message;
            });
          }
        },

        // Labels
        fetchLabels: async (accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            console.log(`🏷️ [STORE] Fetching real labels for account: ${targetAccountId}`);
            
            // Get Gmail API service for the account
            const gmailApi = getGmailApiService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Fetch real labels from Gmail API
            const labels = await gmailApi.getLabels();
            
            console.log(`✅ [STORE] Fetched ${labels.length} real labels`);

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
              
              // Update labels with real data
              state.accountData[targetAccountId].labels = labels;
            });
          } catch (error) {
            console.error('❌ [STORE] Failed to fetch labels:', error);
            const handledError = handleGmailError(error, {
              operation: 'fetch_labels',
              accountId: targetAccountId,
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
            state.composeDraft = {
              to: [],
              cc: [],
              bcc: [],
              subject: '',
              body: '',
              accountId: state.currentAccountId || undefined,
              ...draft,
            };
          });
        },

        updateCompose: (updates: Partial<ComposeEmail>) => {
          set((state) => {
            if (state.composeDraft) {
              Object.assign(state.composeDraft, updates);
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
              state.composeDraft = null;
            });
          } catch (error) {
            const handledError = handleGmailError(error);
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
            state.composeDraft = null;
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

        // Sign out and clear authentication
        signOut: () => {
          // Reset store state - Zustand persist will handle localStorage
          set((state) => {
            state.isAuthenticated = false;
            state.accounts = {};
            state.accountData = {};
            state.currentAccountId = null;
            state.error = null;
            state.authState = null;
          });
        },

        setAuthState: (authState: string | null) => {
          console.log('🔑 [AUTH] Setting auth state:', authState);
          set({ authState });
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
      })),
      {
        name: 'gmail-auth-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // use localStorage
        partialize: (state) => ({ 
          authState: state.authState,
          accounts: state.accounts,
          currentAccountId: state.currentAccountId,
          isAuthenticated: state.isAuthenticated 
        }), // persist auth-related state
      }
    )
  )
);

export { useMailStore }; 
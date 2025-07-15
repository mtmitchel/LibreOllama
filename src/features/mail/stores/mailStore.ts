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
  GMAIL_LABELS,
  LabelCreationRequest,
  LabelUpdateRequest,
  LabelOperation,
  LabelSettings,
} from '../types';
import { handleGmailError } from '../services/gmailErrorHandler';
import { createGmailTauriService } from '../services/gmailTauriService';
import { searchService } from '../services/searchService';
import { 
  SearchResult, 
  SearchFilter, 
  AdvancedSearchFilters,
  SearchQuery,
  SearchOperator,
  SearchSuggestion
} from '../types/search';
import { convertProcessedGmailMessages, convertProcessedGmailMessage, convertProcessedGmailThreadToEmailThread } from '../utils/messageConverter';



// Remove manual localStorage handling - Zustand persist will handle this
import { logger } from '../../../core/lib/logger';

logger.debug('🔑 [AUTH] Zustand persistence will restore authentication state automatically');

const initialState: MailState = {
  // Multi-Account Authentication
  accounts: {}, // Will be restored by Zustand persist
  currentAccountId: null,
  isAuthenticated: false, // Will be restored by Zustand persist
  isHydrated: false, // Track if store has been hydrated from localStorage
  
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
  
  // Phase 2.3 - Label Management State
  selectedLabels: [],
  labelSettings: {
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
  },
  
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
  totalUnreadMessages: 0, // Track total unread messages for current view
  messagesLoadedSoFar: 0, // Track cumulative messages loaded
  currentPageSize: 25,
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
          logger.debug('📋 [STORE] getLabels called, returning:', labels.length, 'labels for account:', state.currentAccountId);
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
          // For token-based pagination, use messagesLoadedSoFar which is properly maintained during navigation
          return state.messagesLoadedSoFar;
        },

        // Account Management
        addAccount: async (account: GmailAccount) => {
          set((state) => {
            state.isLoadingAccounts = true;
            state.error = null;
          });

          try {
            logger.debug('📧 [STORE] Adding account to store:', account.email);
            
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
              logger.debug(`🔄 [STORE] Fetching initial data for new account: ${account.email}`);
              
              try {
                // Fetch labels first, then messages (labels needed for total count)
                await fetchLabels(account.id);
                await fetchMessages(undefined, undefined, undefined, account.id);
                                  logger.debug(`✅ [STORE] Initial data loaded for account: ${account.email}`);
              } catch (dataError) {
                console.warn(`⚠️ [STORE] Failed to load initial data for account: ${account.email}`, dataError);
                // Don't fail the account addition, just log the warning
                // User can manually refresh to load data
              }
            } else {
                              logger.debug(`🧪 [STORE] Test environment detected - skipping automatic data fetch for account: ${account.email}`);
            }
            
            logger.debug('✅ [STORE] Account added successfully:', account.email);
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
            logger.error('[MAIL_STORE] Account not found:', accountId);
            return;
          }

          // Check if account is already in error state with authentication issues
          if (account.syncStatus === 'error' && account.errorMessage?.includes('Authentication')) {
            logger.warn('[MAIL_STORE] Skipping refresh for account with authentication error:', account.email);
            return;
          }

          // Check if account is already syncing
          if (account.syncStatus === 'syncing') {
            logger.warn('[MAIL_STORE] Account already syncing, skipping refresh:', account.email);
            return;
          }

          set((state) => {
            if (state.accounts[accountId]) {
              state.accounts[accountId].syncStatus = 'syncing';
            }
          });

          try {
            logger.log('[MAIL_STORE] Refreshing account quota:', account.email);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(accountId);
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

            // Fetch quota information using Google Drive API
            try {
              logger.debug('[MAIL_STORE] Fetching storage quota from Google Drive API...');
              
              // Create tokens object for quota fetch
              const tokens = {
                access_token: account.accessToken,
                refresh_token: account.refreshToken,
                expires_at: account.tokenExpiry ? account.tokenExpiry.toISOString() : new Date(Date.now() + 3600000).toISOString(), // 1 hour default if missing
                token_type: 'Bearer' as const,
              };
              
              const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota(limit,usage,usageInDrive,usageInDriveTrash)', {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                logger.warn('[MAIL_STORE] Drive API not available, keeping existing quota values');
              } else {
                const data = await response.json();
                logger.debug('[MAIL_STORE] Raw API response:', data);
                const storageQuota = data.storageQuota;
                
                if (storageQuota) {
                  const used = parseInt(storageQuota.usage || '0', 10);
                  let total = parseInt(storageQuota.limit || '0', 10);
                  
                  // Some Google accounts (Workspace, Google One) don't return a limit
                  if (!total || total < 0) {
                    logger.warn('[MAIL_STORE] No limit returned by API, account may have custom quota');
                    total = 0;
                  }
                  
                  logger.debug('[MAIL_STORE] Storage quota parsed:', {
                    used: `${(used / (1024 * 1024 * 1024)).toFixed(1)} GB`,
                    total: total > 0 ? `${(total / (1024 * 1024 * 1024)).toFixed(1)} GB` : 'Custom/Unlimited',
                    percentage: total > 0 ? `${((used / total) * 100).toFixed(1)}%` : 'N/A',
                  });
                  
                  // Update account with new quota info
                  set((state) => {
                    if (state.accounts[accountId]) {
                      state.accounts[accountId].quotaUsed = used;
                      state.accounts[accountId].quotaTotal = total;
                    }
                  });
                }
              }
            } catch (quotaError) {
              console.warn('⚠️ [QUOTA] Failed to fetch quota info:', quotaError);
              // Don't fail the whole refresh if quota fetch fails
            }
            
            set((state) => {
              if (state.accounts[accountId]) {
                state.accounts[accountId].syncStatus = 'idle';
                state.accounts[accountId].lastSyncAt = new Date();
              }
            });
            
            logger.log('[MAIL_STORE] Account refreshed successfully');
          } catch (error) {
            logger.error('[MAIL_STORE] Failed to refresh account:', error);
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
            logger.log('[MAIL_STORE] No accounts to sync');
            return;
          }

          logger.log(`[MAIL_STORE] Starting sync for ${Object.keys(accounts).length} accounts`);
          
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
                logger.log(`[MAIL_STORE] Syncing account: ${account.email}`);
                
                // Fetch labels first, then messages (labels needed for total count)
                await fetchLabels(account.id);
                await fetchMessages(undefined, undefined, undefined, account.id);
                
                logger.log(`[MAIL_STORE] Account synced: ${account.email}`);
                return account.id;
              } catch (error) {
                logger.error(`[MAIL_STORE] Failed to sync account ${account.email}:`, error);
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
            
            logger.log(`[MAIL_STORE] All accounts synced successfully`);
          } catch (error) {
            logger.error('[MAIL_STORE] Sync failed for some accounts:', error);
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

          // Wait for store hydration to complete before fetching messages
          const state = get();
          if (!state.isHydrated) {
            logger.debug('[MAIL_STORE] Waiting for store hydration before fetching messages...');
            // Wait a bit for hydration to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            // Check again after waiting
            const updatedState = get();
            if (!updatedState.isHydrated) {
              logger.warn('[MAIL_STORE] Store not hydrated after waiting - proceeding anyway');
            }
          }

          set((state) => {
            state.isLoadingMessages = true;
            state.error = null;
          });
          
          try {
            logger.log(`[MAIL_STORE] Fetching real messages for account: ${targetAccountId}`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
            if (!gmailApi) {
              throw new Error('Failed to initialize Gmail API service');
            }

            // Determine label IDs to fetch - validate the label exists first
            let labelIds = ['INBOX']; // Default fallback
            
            if (labelId) {
              // Check if the requested label exists in the account's labels
              const accountData = get().accountData[targetAccountId];
              const labelExists = accountData?.labels?.some(label => label.id === labelId);
              
              if (labelExists) {
                labelIds = [labelId];
              } else {
                logger.warn(`[MAIL_STORE] Label ${labelId} not found, falling back to INBOX`);
                // Don't throw error - gracefully fall back to INBOX
                labelIds = ['INBOX'];
              }
            }
            
            // Fetch real messages from Gmail API
            logger.debug(`[MAIL_STORE] Requesting messages:`, { query, labelIds, maxResults: 25, pageToken });
            const result = await gmailApi.searchMessages(query, labelIds, 25, pageToken);
            
            logger.log(`[MAIL_STORE] Fetched ${result.messages.length} real messages`);
            logger.debug(`[MAIL_STORE] API result:`, { 
              messageCount: result.messages.length, 
              nextPageToken: result.next_page_token,
              hasNextPageToken: !!result.next_page_token,
              resultSizeEstimate: result.result_size_estimate
            });
            logger.debug(`[MAIL_STORE] Full API result:`, result);
            
            // Debug: Log first few message subjects to verify data
            if (result.messages.length > 0) {
              logger.debug(`[MAIL_STORE] First few messages:`, result.messages.slice(0, 3).map(msg => ({
                id: msg.id,
                subject: msg.parsed_content?.subject || 'No subject',
                from: msg.parsed_content?.from?.email || 'No sender'
              })));
            }

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
              // Convert ProcessedGmailMessage to ParsedEmail
              const convertedMessages = convertProcessedGmailMessages(result.messages, targetAccountId);
              state.accountData[targetAccountId].messages = convertedMessages;
              state.accountData[targetAccountId].unreadMessages = convertedMessages.filter(msg => !msg.isRead).length;
              state.accountData[targetAccountId].lastSyncAt = new Date();

              // Use labels first as they're more reliable than resultSizeEstimate
              let totalMessages = 0;
              const accountData = state.accountData[targetAccountId];
              
              // Primary: Use label's messagesTotal (most accurate)
              const currentLabel = labelId || 'INBOX';
              const targetLabel = accountData.labels.find(label => label.id === currentLabel);
              
              logger.debug(`[MAIL_STORE] All labels for account ${targetAccountId}:`, JSON.stringify(accountData.labels, null, 2));
              logger.debug(`[MAIL_STORE] Searching for label: ${currentLabel}, Found:`, targetLabel);

              let totalUnreadMessages = 0;
              
              if (targetLabel && typeof targetLabel.messagesTotal === 'number' && targetLabel.messagesTotal > 0) {
                totalMessages = targetLabel.messagesTotal;
                // Use threadsUnread instead of messagesUnread for conversation count
                totalUnreadMessages = targetLabel.threadsUnread || 0;
                logger.debug(`[MAIL_STORE] Set totalMessages from ${currentLabel} label: ${totalMessages}, unread conversations: ${totalUnreadMessages}`);
              } else if (result.result_size_estimate && result.result_size_estimate > 0) {
                // Secondary: Use API's result_size_estimate (often inaccurate)
                totalMessages = result.result_size_estimate;
                // For unread count when we don't have label data, count unread in current results
                totalUnreadMessages = convertProcessedGmailMessages(result.messages, targetAccountId).filter(msg => !msg.isRead).length;
                logger.debug(`[MAIL_STORE] Set totalMessages from API resultSizeEstimate: ${totalMessages}`);
              } else {
                // Last resort: estimate based on current data (likely wrong)
                totalMessages = pageToken ? 
                  Math.max(result.messages.length, state.messagesLoadedSoFar + result.messages.length) :
                  result.messages.length;
                totalUnreadMessages = convertProcessedGmailMessages(result.messages, targetAccountId).filter(msg => !msg.isRead).length;
                logger.debug(`[MAIL_STORE] Set totalMessages from estimation fallback: ${totalMessages}`);
              }
              
              state.accountData[targetAccountId].totalMessages = totalMessages;
              state.isLoadingMessages = false;
              
              // Update pagination state for token-based pagination
              state.nextPageToken = result.next_page_token;
              
                        // Handle token-based navigation
          if (pageToken) {
              if (state.isNavigatingBackwards) {
                  // We've just navigated back, so remove the token that led to the *previous* (now current) page.
                  // The current state of pageTokens is for the page we are on.
                  state.pageTokens.pop();
              } else {
                  // We are moving forward. Store the token for the page we are now on.
                  if (!state.pageTokens.includes(pageToken)) {
                      state.pageTokens.push(pageToken);
                  }
              }
          } else {
              // First page - reset everything
              state.pageTokens = [];
              state.messagesLoadedSoFar = 0; // Reset to 0 for first page
          }
          // Don't recalculate messagesLoadedSoFar here - it's managed by nextPage/prevPage methods

              // Set totalMessages from account data (which now gets it from API result_size_estimate)
              // Make sure we have a valid number
              state.totalMessages = totalMessages;
              state.totalUnreadMessages = totalUnreadMessages;
              state.nextPageToken = result.next_page_token;
              
              logger.debug(`📄 [MAIL_STORE] *** FETCH COMPLETE ***`, {
                messagesLoadedSoFar: state.messagesLoadedSoFar,
                nextPageToken: state.nextPageToken,
                tokensInStack: state.pageTokens.length,
                totalMessages: state.totalMessages,
                totalUnreadMessages: state.totalUnreadMessages,
                currentMessages: result.messages.length
              });
              
              // No need for prevPageToken in token-based pagination
            });
          } catch (error) {
            logger.error('❌ [STORE] Failed to fetch messages:', error);
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
          set({ isLoadingMessages: true, error: null });
          try {
            const currentAccountId = accountId || get().currentAccountId;
            if (!currentAccountId) throw new Error('No account selected');

            const gmailApi = createGmailTauriService(currentAccountId);
            if (!gmailApi) throw new Error('Gmail service not initialized');

            // Use getParsedMessage to get the correct type for conversion
            const message = await gmailApi.getParsedMessage(messageId); // Changed to getParsedMessage
            if (!message) throw new Error('Message not found');

            const parsedMessage = convertProcessedGmailMessage(message, currentAccountId); // Corrected argument order

            set(state => {
              const accountData = state.accountData[currentAccountId];
              if (accountData) {
                const existingMessageIndex = accountData.messages.findIndex(m => m.id === messageId);
                if (existingMessageIndex !== -1) {
                  accountData.messages[existingMessageIndex] = parsedMessage;
                } else {
                  accountData.messages.push(parsedMessage);
                }
              }
              state.currentMessage = parsedMessage; // Set currentMessage
            });
            logger.debug('[MAIL_STORE] Fetched message:', messageId);
            return parsedMessage; // Return the parsed message

          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'fetch_message',
              messageId,
              accountId,
            });
            set({ error: handledError.message, isLoadingMessages: false });
            throw handledError;
          }
        },

        fetchThread: async (threadId: string, accountId?: string) => {
          set({ isLoadingThreads: true, error: null });
          try {
            const currentAccountId = accountId || get().currentAccountId;
            if (!currentAccountId) throw new Error('No account selected');

            const gmailApi = createGmailTauriService(currentAccountId);
            if (!gmailApi) throw new Error('Gmail service not initialized');

            const threadMessages = await gmailApi.getThread(threadId); // Get array of ProcessedGmailMessage
            if (!threadMessages || threadMessages.length === 0) throw new Error('Thread not found or empty');
            
            // Use the new conversion function for threads
            const parsedThread = convertProcessedGmailThreadToEmailThread(threadMessages, currentAccountId); 
            if (!parsedThread) throw new Error('Failed to parse thread');

            set(state => {
              // Update or add the thread to the accountData
              const accountData = state.accountData[currentAccountId];
              if (accountData) {
                const existingThreadIndex = accountData.threads.findIndex(t => t.id === threadId);
                if (existingThreadIndex !== -1) {
                  accountData.threads[existingThreadIndex] = parsedThread;
                } else {
                  accountData.threads.push(parsedThread);
                }
              }
              state.currentThread = parsedThread; // Set currentThread
            });
            logger.debug('[MAIL_STORE] Fetched thread:', threadId);
            return parsedThread; // Return the parsed thread

          } catch (error) {
            const handledError = handleGmailError(error, {
              operation: 'fetch_thread',
              threadId,
              accountId,
            });
            set({ error: handledError.message, isLoadingThreads: false });
            throw handledError;
          }
        },

        setCurrentThread: (thread: EmailThread | null) => {
          set(state => { state.currentThread = thread; });
        },

        // Real Gmail API implementations
        markAsRead: async (messageIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          try {
            logger.log(`[MAIL_STORE] Marking ${messageIds.length} messages as read`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully marked messages as read`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to mark messages as read:', error);
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
            logger.log(`[MAIL_STORE] Marking ${messageIds.length} messages as unread`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully marked messages as unread`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to mark messages as unread:', error);
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
            logger.log(`[MAIL_STORE] Deleting ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully deleted messages`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to delete messages:', error);
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
            logger.log(`[MAIL_STORE] Archiving ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully archived messages`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to archive messages:', error);
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
            logger.log(`[MAIL_STORE] Starring ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully starred messages`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to star messages:', error);
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
            logger.log(`[MAIL_STORE] Unstarring ${messageIds.length} messages`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
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
            
            logger.log(`[MAIL_STORE] Successfully unstarred messages`);
          } catch (error) {
            logger.error('❌ [STORE] Failed to unstar messages:', error);
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
            logger.warn('🏷️ [STORE] No target account ID for fetchLabels');
            return;
          }

          try {
            logger.log(`🏷️ [STORE] Fetching real labels for account: ${targetAccountId}`);
            
            // Get Gmail API service for the account
            const gmailApi = createGmailTauriService(targetAccountId);
            if (!gmailApi) {
              logger.error('🏷️ [STORE] Failed to get Gmail API service for account:', targetAccountId);
              throw new Error('Failed to initialize Gmail API service');
            }

            // Fetch real labels from Gmail API
            const labels = await gmailApi.getLabels();
            
            logger.log(`✅ [STORE] Fetched ${labels.length} real labels:`, labels.map(l => l.name));

            set((state) => {
              // Initialize account data if it doesn't exist
              if (!state.accountData[targetAccountId]) {
                logger.debug('🏷️ [STORE] Initializing account data for:', targetAccountId);
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
              logger.debug(`🏷️ [STORE] Setting ${labels.length} labels for account:`, targetAccountId);
              state.accountData[targetAccountId].labels = labels;
            });
          } catch (error) {
            logger.error('❌ [STORE] Failed to fetch labels:', error);
            
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
                { id: 'INBOX', name: 'Inbox', messageListVisibility: 'show' as const, labelListVisibility: 'show' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0, color: '#4285f4' },
                { id: 'SENT', name: 'Sent', messageListVisibility: 'show' as const, labelListVisibility: 'show' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0, color: '#34a853' },
                { id: 'DRAFT', name: 'Drafts', messageListVisibility: 'show' as const, labelListVisibility: 'show' as const, type: 'system' as const, messagesTotal: 0, messagesUnread: 0, threadsTotal: 0, threadsUnread: 0, color: '#fbbc04' },
              ];
              
              logger.debug(`🏷️ [STORE] Setting fallback labels for account:`, targetAccountId);
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

        // Enhanced Label Management (Phase 2.3)
        createLabel: async (labelData: LabelCreationRequest, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) throw new Error('No account selected');

          const newLabel: GmailLabel = {
            id: `user_${Date.now()}`,
            name: labelData.name,
            messageListVisibility: labelData.messageListVisibility,
            labelListVisibility: labelData.labelListVisibility,
            type: 'user',
            messagesTotal: 0,
            messagesUnread: 0,
            threadsTotal: 0,
            threadsUnread: 0,
            color: labelData.color || '#4285f4',
          };

          set((state) => {
            if (state.accountData[targetAccountId]) {
              state.accountData[targetAccountId].labels.push(newLabel);
            }
          });

          return newLabel;
        },

        updateLabel: async (labelData: LabelUpdateRequest, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) throw new Error('No account selected');

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              const labelIndex = accountData.labels.findIndex(l => l.id === labelData.id);
              if (labelIndex !== -1) {
                const label = accountData.labels[labelIndex];
                if (labelData.name !== undefined) label.name = labelData.name;
                if (labelData.color !== undefined) label.color = labelData.color;
                if (labelData.messageListVisibility !== undefined) label.messageListVisibility = labelData.messageListVisibility;
                if (labelData.labelListVisibility !== undefined) label.labelListVisibility = labelData.labelListVisibility;
              }
            }
          });

          const updatedLabel = get().accountData[targetAccountId]?.labels.find(l => l.id === labelData.id);
          if (!updatedLabel) throw new Error('Label not found');
          return updatedLabel;
        },

        deleteLabel: async (labelId: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              accountData.labels = accountData.labels.filter(l => l.id !== labelId);
              // Remove label from all messages
              accountData.messages.forEach(message => {
                message.labels = message.labels.filter(l => l !== labelId);
              });
            }
          });
        },

        addLabelsToMessages: async (messageIds: string[], labelIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              messageIds.forEach(messageId => {
                const message = accountData.messages.find(msg => msg.id === messageId);
                if (message) {
                  labelIds.forEach(labelId => {
                    if (!message.labels.includes(labelId)) {
                      message.labels.push(labelId);
                    }
                  });
                }
              });
            }
          });
        },

        removeLabelsFromMessages: async (messageIds: string[], labelIds: string[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          set((state) => {
            const accountData = state.accountData[targetAccountId];
            if (accountData) {
              messageIds.forEach(messageId => {
                const message = accountData.messages.find(msg => msg.id === messageId);
                if (message) {
                  message.labels = message.labels.filter(label => !labelIds.includes(label));
                }
              });
            }
          });
        },

        applyLabelOperation: async (operation: LabelOperation, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;

          switch (operation.type) {
            case 'add':
              await get().addLabelsToMessages(operation.messageIds, operation.labelIds, targetAccountId);
              break;
            case 'remove':
              await get().removeLabelsFromMessages(operation.messageIds, operation.labelIds, targetAccountId);
              break;
            case 'replace':
              set((state) => {
                const accountData = state.accountData[targetAccountId];
                if (accountData) {
                  operation.messageIds.forEach(messageId => {
                    const message = accountData.messages.find(msg => msg.id === messageId);
                    if (message) {
                      message.labels = [...operation.labelIds];
                    }
                  });
                }
              });
              break;
          }
        },

        // Label Settings
        updateLabelSettings: (settings: Partial<LabelSettings>) => {
          set((state) => {
            state.labelSettings = {
              ...state.labelSettings,
              ...settings,
            };
          });
        },

        resetLabelSettings: () => {
          set((state) => {
            state.labelSettings = {
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
          });
        },

        // Label Filtering
        setSelectedLabels: (labelIds: string[]) => {
          set((state) => {
            state.selectedLabels = labelIds;
          });
        },

        addLabelToFilter: (labelId: string) => {
          set((state) => {
            if (!state.selectedLabels.includes(labelId)) {
              state.selectedLabels.push(labelId);
            }
          });
        },

        removeLabelFromFilter: (labelId: string) => {
          set((state) => {
            state.selectedLabels = state.selectedLabels.filter(id => id !== labelId);
          });
        },

        clearLabelFilter: () => {
          set((state) => {
            state.selectedLabels = [];
          });
        },

        // Authentication
        signOut: async (accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          
          set((state) => {
            if (targetAccountId) {
              // Remove specific account
              delete state.accounts[targetAccountId];
              delete state.accountData[targetAccountId];
              
              // Switch to another account or sign out completely
              if (state.currentAccountId === targetAccountId) {
                const remainingAccountIds = Object.keys(state.accounts);
                if (remainingAccountIds.length > 0) {
                  state.currentAccountId = remainingAccountIds[0];
                } else {
                  state.currentAccountId = null;
                  state.isAuthenticated = false;
                }
              }
            } else {
              // Sign out all accounts
              state.accounts = {};
              state.accountData = {};
              state.currentAccountId = null;
              state.isAuthenticated = false;
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
          logger.log('Saving draft for account:', email.accountId);
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

        // Enhanced Search (Phase 2.1)
        searchMessages: async (query: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;
          
          set((state) => {
            state.searchQuery = query;
            state.isLoadingMessages = true;
            state.error = null;
          });
          
          try {
            // Use the enhanced search service
            const searchResult = await searchService.search(query, [], targetAccountId);
            
            // Update store with search results
            set((state) => {
              // The messages are already loaded through fetchMessages call in search service
              state.isLoadingMessages = false;
              state.searchQuery = query;
            });
            
            logger.log(`✅ [SEARCH] Search completed: ${searchResult.messages.length} results in ${searchResult.searchTime}ms`);
          } catch (error) {
            logger.error('❌ [SEARCH] Search failed:', error);
            const handledError = handleGmailError(error, {
              operation: 'search_messages',
              accountId: targetAccountId,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingMessages = false;
            });
          }
        },

        // Advanced search with filters
        searchWithFilters: async (filters: SearchFilter[], accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;
          
          set((state) => {
            state.isLoadingMessages = true;
            state.error = null;
          });
          
          try {
            const searchResult = await searchService.search('', filters, targetAccountId);
            
            set((state) => {
              state.isLoadingMessages = false;
              state.searchQuery = searchResult.query;
            });
            
            logger.log(`✅ [SEARCH] Filter search completed: ${searchResult.messages.length} results`);
          } catch (error) {
            logger.error('❌ [SEARCH] Filter search failed:', error);
            const handledError = handleGmailError(error, {
              operation: 'search_with_filters',
              accountId: targetAccountId,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingMessages = false;
            });
          }
        },

        // Advanced search with complex filters
        searchWithAdvancedFilters: async (filters: AdvancedSearchFilters, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return;
          
          set((state) => {
            state.isLoadingMessages = true;
            state.error = null;
          });
          
          try {
            const searchResult = await searchService.searchWithAdvancedFilters(filters, targetAccountId);
            
            set((state) => {
              state.isLoadingMessages = false;
              state.searchQuery = searchResult.query;
            });
            
            logger.log(`✅ [SEARCH] Advanced search completed: ${searchResult.messages.length} results`);
          } catch (error) {
            logger.error('❌ [SEARCH] Advanced search failed:', error);
            const handledError = handleGmailError(error, {
              operation: 'search_with_advanced_filters',
              accountId: targetAccountId,
            });
            set((state) => {
              state.error = handledError.message;
              state.isLoadingMessages = false;
            });
          }
        },

        // Get search suggestions
        getSearchSuggestions: async (query: string, accountId?: string) => {
          const targetAccountId = accountId || get().currentAccountId;
          if (!targetAccountId) return [];
          
          try {
            return await searchService.getSuggestions(query, targetAccountId);
          } catch (error) {
            logger.error('❌ [SEARCH] Failed to get suggestions:', error);
            return [];
          }
        },

        // Get search operators
        getSearchOperators: () => {
          return searchService.getOperators();
        },

        // Search history management
        getSearchHistory: () => {
          return searchService.getSearchHistory();
        },

        saveSearch: async (searchQuery: SearchQuery) => {
          try {
            await searchService.saveSearch(searchQuery);
          } catch (error) {
            logger.error('❌ [SEARCH] Failed to save search:', error);
          }
        },

        deleteSearch: async (searchId: string) => {
          try {
            await searchService.deleteSearch(searchId);
          } catch (error) {
            logger.error('❌ [SEARCH] Failed to delete search:', error);
          }
        },

        clearSearchHistory: async () => {
          try {
            await searchService.clearSearchHistory();
          } catch (error) {
            logger.error('❌ [SEARCH] Failed to clear search history:', error);
          }
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

        // Pagination
        nextPage: async () => {
          const state = get();
          if (state.nextPageToken) {
            logger.debug('🔄 [PAGINATION] Next page triggered:', {
              currentTokens: state.pageTokens.length,
              messagesLoadedSoFar: state.messagesLoadedSoFar,
              nextPageToken: state.nextPageToken
            });
            
            // ATOMIC UPDATE: Consolidate all pagination state changes into single set call
            const nextPageToken = state.nextPageToken;
            set(s => {
              // Add current page token for navigation history FIRST
              const newPageTokens = [...s.pageTokens, nextPageToken];
              
              // Calculate messagesLoadedSoFar based on NEW token stack (after adding token)
              const newMessagesLoadedSoFar = newPageTokens.length * s.currentPageSize;
              
              // Update both values atomically
              s.pageTokens = newPageTokens;
              s.messagesLoadedSoFar = newMessagesLoadedSoFar;
              
              logger.debug('🔄 [PAGINATION] Atomic state update complete:', {
                tokens: s.pageTokens.length,
                messagesLoadedSoFar: s.messagesLoadedSoFar,
                calculation: `${newPageTokens.length} tokens * ${s.currentPageSize} pageSize = ${newMessagesLoadedSoFar}`
              });
            });
            
            await state.goToPage(nextPageToken);
            
            // POST-UPDATE LOGGING: Confirm state after goToPage completes
            const finalState = get();
            logger.debug('📄 [PAGINATION] Final state after nextPage complete:', {
              messagesLoadedSoFar: finalState.messagesLoadedSoFar,
              pageTokens: finalState.pageTokens.length,
              totalMessages: finalState.totalMessages,
              totalUnreadMessages: finalState.totalUnreadMessages,
              currentMessages: finalState.getMessages().length,
              nextPageToken: finalState.nextPageToken
            });
          }
        },
        prevPage: async () => {
          const state = get();
          if (state.pageTokens.length === 0) return; // Can't go back from first page
          
          logger.debug('🔄 [PAGINATION] Prev page triggered:', {
            currentTokens: state.pageTokens.length,
            messagesLoadedSoFar: state.messagesLoadedSoFar
          });
          
          // ATOMIC UPDATE: Consolidate all pagination state changes into single set call
          const newTokens = [...state.pageTokens];
          newTokens.pop(); // Remove current page's token
          const prevToken = newTokens.length > 0 ? newTokens[newTokens.length - 1] : undefined;
          
          set(s => {
            // Calculate messagesLoadedSoFar based on new token stack (after removing token)
            const newMessagesLoadedSoFar = newTokens.length * s.currentPageSize;
            
            // Update both values atomically
            s.pageTokens = newTokens;
            s.messagesLoadedSoFar = newMessagesLoadedSoFar;
            
            logger.debug('🔄 [PAGINATION] Atomic state update complete:', {
              tokens: s.pageTokens.length,
              messagesLoadedSoFar: s.messagesLoadedSoFar,
              calculation: `${newTokens.length} tokens * ${s.currentPageSize} pageSize = ${newMessagesLoadedSoFar}`
            });
          });

          await state.goToPage(prevToken);
          
          // POST-UPDATE LOGGING: Confirm state after goToPage completes
          const finalState = get();
          logger.debug('📄 [PAGINATION] Final state after prevPage complete:', {
            messagesLoadedSoFar: finalState.messagesLoadedSoFar,
            pageTokens: finalState.pageTokens.length,
            totalMessages: finalState.totalMessages,
            totalUnreadMessages: finalState.totalUnreadMessages,
            currentMessages: finalState.getMessages().length,
            nextPageToken: finalState.nextPageToken
          });
        },
        goToPage: async (pageToken?: string) => {
          const { currentLabel, searchQuery, fetchMessages, currentAccountId } = get();
          await fetchMessages(currentLabel || undefined, searchQuery, pageToken, currentAccountId || undefined);
        },

        // Reset pagination state - useful for debugging
        resetPagination: () => {
          set((state) => {
            logger.debug('🔄 [PAGINATION] RESETTING PAGINATION STATE');
            state.pageTokens = [];
            state.messagesLoadedSoFar = 0;
            state.nextPageToken = undefined;
            state.totalMessages = 0;
            state.totalUnreadMessages = 0;
          });
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

        clearCurrentMessage: () => {
          set((state) => {
            state.currentMessage = null;
            state.currentThread = null;
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
        onRehydrateStorage: () => (state) => {
          logger.debug('🔄 [STORE] Store hydrated from localStorage, setting isHydrated to true');
          if (state) {
            state.isHydrated = true;
          } else {
            // If no persisted state, still set hydrated to true after attempt
            logger.debug('🔄 [STORE] No persisted state found, marking as hydrated');
          }
        },
      }
    )
  )
);

// Fallback hydration trigger - ensure isHydrated is set to true even if persist doesn't work
setTimeout(() => {
  const state = useMailStore.getState();
  if (!state.isHydrated) {
    logger.debug('🔄 [STORE] Manual hydration fallback triggered');
    useMailStore.setState({ isHydrated: true });
  }
}, 100);

export { useMailStore }; 

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  gmailSyncService, 
  SyncConfig, 
  AccountSyncState, 
  SyncResult, 
  SyncEvent, 
  SyncEventType,
  PendingOperation
} from '../services/gmailSyncService';
import { useMailStore } from '../stores/mailStore';
import { GmailAccount } from '../types';

export interface UseGmailSyncReturn {
  // Status
  isOnline: boolean;
  overallStatus: {
    isOnline: boolean;
    totalAccounts: number;
    syncingAccounts: number;
    errorAccounts: number;
    pendingOperations: number;
  };
  accountStates: AccountSyncState[];
  
  // Configuration
  config: SyncConfig;
  updateConfig: (config: Partial<SyncConfig>) => void;
  
  // Sync Controls
  syncAccount: (accountId: string, force?: boolean) => Promise<SyncResult>;
  syncAllAccounts: () => Promise<SyncResult[]>;
  pauseSync: (accountId?: string) => Promise<void>;
  resumeSync: (accountId?: string) => Promise<void>;
  
  // Queue Management
  queueOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  getPendingOperations: (accountId: string) => PendingOperation[];
  
  // Event System
  addEventListener: (type: SyncEventType, listener: (event: SyncEvent) => void) => void;
  removeEventListener: (type: SyncEventType, listener: (event: SyncEvent) => void) => void;
  
  // Account State
  getAccountState: (accountId: string) => AccountSyncState | undefined;
  
  // Statistics
  getLastSyncTime: (accountId: string) => Date | null;
  getSyncErrors: () => { accountId: string; error: string }[];
  
  // Status Indicators
  isAccountSyncing: (accountId: string) => boolean;
  hasAccountError: (accountId: string) => boolean;
  hasPendingOperations: (accountId: string) => boolean;
}

export const useGmailSync = (): UseGmailSyncReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [accountStates, setAccountStates] = useState<AccountSyncState[]>([]);
  const [config, setConfig] = useState<SyncConfig>(gmailSyncService.getConfig());
  const [overallStatus, setOverallStatus] = useState(gmailSyncService.getOverallStatus());
  
  const { accounts: accountsObject, getAccountsArray } = useMailStore();
  const accounts = getAccountsArray();
  const eventListenersRef = useRef<Map<SyncEventType, Set<(event: SyncEvent) => void>>>(new Map());

  // Initialize sync service with accounts
  useEffect(() => {
    const initializeAccounts = async () => {
      // Add all accounts to sync service
      for (const account of accounts) {
        try {
          await gmailSyncService.addAccount(account);
        } catch (error) {
          console.error(`Failed to add account ${account.id} to sync service:`, error);
        }
      }
    };

    initializeAccounts();
  }, [accounts]);

  // Update states from sync service
  useEffect(() => {
    const updateStates = () => {
      setAccountStates(gmailSyncService.getAllAccountStates());
      setOverallStatus(gmailSyncService.getOverallStatus());
    };

    // Update immediately
    updateStates();

    // Set up periodic updates
    const interval = setInterval(updateStates, 1000);

    return () => clearInterval(interval);
  }, []);

  // Set up event listeners for real-time updates
  useEffect(() => {
    const handleSyncEvent = (event: SyncEvent) => {
      // Update states when sync events occur
      setAccountStates(gmailSyncService.getAllAccountStates());
      setOverallStatus(gmailSyncService.getOverallStatus());
    };

    const handleConnectionChange = (event: SyncEvent) => {
      if (event.data && typeof event.data.online === 'boolean') {
        setIsOnline(event.data.online);
      }
    };

    const handleNewMessages = (event: SyncEvent) => {
      if (event.accountId && event.data?.newMessages) {
        // Trigger store update for new messages
        const { fetchMessages } = useMailStore.getState();
        fetchMessages(undefined, undefined, undefined, event.accountId);
      }
    };

    const handleMessagesUpdated = (event: SyncEvent) => {
      if (event.accountId && event.data?.updatedMessages) {
        // Trigger store update for updated messages
        const { fetchMessages } = useMailStore.getState();
        fetchMessages(undefined, undefined, undefined, event.accountId);
      }
    };

    // Register event listeners
    gmailSyncService.addEventListener('sync_started', handleSyncEvent);
    gmailSyncService.addEventListener('sync_completed', handleSyncEvent);
    gmailSyncService.addEventListener('sync_error', handleSyncEvent);
    gmailSyncService.addEventListener('account_updated', handleSyncEvent);
    gmailSyncService.addEventListener('connection_status_changed', handleConnectionChange);
    gmailSyncService.addEventListener('new_messages', handleNewMessages);
    gmailSyncService.addEventListener('messages_updated', handleMessagesUpdated);

    return () => {
      // Cleanup listeners
      gmailSyncService.removeEventListener('sync_started', handleSyncEvent);
      gmailSyncService.removeEventListener('sync_completed', handleSyncEvent);
      gmailSyncService.removeEventListener('sync_error', handleSyncEvent);
      gmailSyncService.removeEventListener('account_updated', handleSyncEvent);
      gmailSyncService.removeEventListener('connection_status_changed', handleConnectionChange);
      gmailSyncService.removeEventListener('new_messages', handleNewMessages);
      gmailSyncService.removeEventListener('messages_updated', handleMessagesUpdated);
    };
  }, []);

  // Clean up sync service when accounts change
  useEffect(() => {
    return () => {
      // Remove accounts that are no longer in the store
      const currentAccountIds = new Set(accounts.map(acc => acc.id));
      const syncAccountIds = new Set(gmailSyncService.getAllAccountStates().map(state => state.accountId));
      
      for (const accountId of syncAccountIds) {
        if (!currentAccountIds.has(accountId)) {
          gmailSyncService.removeAccount(accountId).catch(error => {
            console.error(`Failed to remove account ${accountId} from sync service:`, error);
          });
        }
      }
    };
  }, [accounts]);

  // Configuration
  const updateConfig = useCallback((newConfig: Partial<SyncConfig>) => {
    gmailSyncService.updateConfig(newConfig);
    setConfig(gmailSyncService.getConfig());
  }, []);

  // Sync Controls
  const syncAccount = useCallback(async (accountId: string, force: boolean = false): Promise<SyncResult> => {
    return await gmailSyncService.syncAccount(accountId, force);
  }, []);

  const syncAllAccounts = useCallback(async (): Promise<SyncResult[]> => {
    return await gmailSyncService.syncAllAccounts();
  }, []);

  const pauseSync = useCallback(async (accountId?: string): Promise<void> => {
    await gmailSyncService.pauseSync(accountId);
  }, []);

  const resumeSync = useCallback(async (accountId?: string): Promise<void> => {
    await gmailSyncService.resumeSync(accountId);
  }, []);

  // Queue Management
  const queueOperation = useCallback(async (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
    await gmailSyncService.queueOperation(operation);
  }, []);

  const getPendingOperations = useCallback((accountId: string): PendingOperation[] => {
    const accountState = gmailSyncService.getAccountState(accountId);
    return accountState?.pendingOperations || [];
  }, []);

  // Event System
  const addEventListener = useCallback((type: SyncEventType, listener: (event: SyncEvent) => void) => {
    // Keep track of listeners for cleanup
    if (!eventListenersRef.current.has(type)) {
      eventListenersRef.current.set(type, new Set());
    }
    eventListenersRef.current.get(type)!.add(listener);
    
    gmailSyncService.addEventListener(type, listener);
  }, []);

  const removeEventListener = useCallback((type: SyncEventType, listener: (event: SyncEvent) => void) => {
    const listeners = eventListenersRef.current.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
    
    gmailSyncService.removeEventListener(type, listener);
  }, []);

  // Account State
  const getAccountState = useCallback((accountId: string): AccountSyncState | undefined => {
    return gmailSyncService.getAccountState(accountId);
  }, []);

  // Statistics
  const getLastSyncTime = useCallback((accountId: string): Date | null => {
    const accountState = gmailSyncService.getAccountState(accountId);
    return accountState?.lastSyncTime || null;
  }, []);

  const getSyncErrors = useCallback((): { accountId: string; error: string }[] => {
    return gmailSyncService.getAllAccountStates()
      .filter(state => state.error)
      .map(state => ({ accountId: state.accountId, error: state.error! }));
  }, []);

  // Status Indicators
  const isAccountSyncing = useCallback((accountId: string): boolean => {
    const accountState = gmailSyncService.getAccountState(accountId);
    return accountState?.status === 'syncing';
  }, []);

  const hasAccountError = useCallback((accountId: string): boolean => {
    const accountState = gmailSyncService.getAccountState(accountId);
    return accountState?.status === 'error' || !!accountState?.error;
  }, []);

  const hasPendingOperations = useCallback((accountId: string): boolean => {
    const accountState = gmailSyncService.getAccountState(accountId);
    return (accountState?.pendingOperations.length || 0) > 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all event listeners
      for (const [type, listeners] of eventListenersRef.current) {
        for (const listener of listeners) {
          gmailSyncService.removeEventListener(type, listener);
        }
      }
      eventListenersRef.current.clear();
    };
  }, []);

  return {
    // Status
    isOnline,
    overallStatus,
    accountStates,
    
    // Configuration
    config,
    updateConfig,
    
    // Sync Controls
    syncAccount,
    syncAllAccounts,
    pauseSync,
    resumeSync,
    
    // Queue Management
    queueOperation,
    getPendingOperations,
    
    // Event System
    addEventListener,
    removeEventListener,
    
    // Account State
    getAccountState,
    
    // Statistics
    getLastSyncTime,
    getSyncErrors,
    
    // Status Indicators
    isAccountSyncing,
    hasAccountError,
    hasPendingOperations,
  };
}; 
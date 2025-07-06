import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { GmailAccount, ParsedEmail, GmailLabel, EmailThread } from '../types';
import { gmailService } from './gmailService';
import { handleGmailError } from './gmailErrorHandler';

// Sync Configuration
export interface SyncConfig {
  enablePushNotifications: boolean;
  pollingInterval: number; // minutes
  maxRetries: number;
  batchSize: number;
  enableIncrementalSync: boolean;
  enableOfflineQueue: boolean;
}

// Sync Status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'paused';

export interface AccountSyncState {
  accountId: string;
  status: SyncStatus;
  lastSyncTime: Date | null;
  lastHistoryId: string | null;
  nextPageToken: string | null;
  pendingOperations: PendingOperation[];
  error: string | null;
  retryCount: number;
  isWatchEnabled: boolean;
  watchExpiration: Date | null;
}

export interface PendingOperation {
  id: string;
  type: 'mark_read' | 'mark_unread' | 'star' | 'unstar' | 'delete' | 'archive' | 'move_label';
  messageIds: string[];
  labelId?: string;
  timestamp: Date;
  retryCount: number;
}

export interface SyncResult {
  accountId: string;
  success: boolean;
  newMessages: ParsedEmail[];
  updatedMessages: ParsedEmail[];
  deletedMessageIds: string[];
  newLabels: GmailLabel[];
  updatedLabels: GmailLabel[];
  error?: string;
  syncDuration: number;
}

export interface PushNotificationData {
  accountId: string;
  historyId: string;
  emailAddress: string;
}

// Events
export type SyncEventType = 
  | 'sync_started'
  | 'sync_completed' 
  | 'sync_error'
  | 'account_updated'
  | 'new_messages'
  | 'messages_updated'
  | 'connection_status_changed'
  | 'push_notification_received';

export interface SyncEvent {
  type: SyncEventType;
  accountId?: string;
  data?: any;
  timestamp: Date;
}

type SyncEventListener = (event: SyncEvent) => void;

export class GmailSyncService {
  private config: SyncConfig;
  private accountStates: Map<string, AccountSyncState> = new Map();
  private listeners: Map<SyncEventType, Set<SyncEventListener>> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isOnline: boolean = navigator.onLine;
  private eventUnlisteners: UnlistenFn[] = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enablePushNotifications: true,
      pollingInterval: 5, // 5 minutes
      maxRetries: 3,
      batchSize: 50,
      enableIncrementalSync: true,
      enableOfflineQueue: true,
      ...config,
    };

    this.initializeNetworkListeners();
    this.initializeTauriEventListeners();
  }

  // Configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('sync_started', undefined, { configUpdated: true });
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // Account Management
  async addAccount(account: GmailAccount): Promise<void> {
    const accountState: AccountSyncState = {
      accountId: account.id,
      status: 'idle',
      lastSyncTime: null,
      lastHistoryId: null,
      nextPageToken: null,
      pendingOperations: [],
      error: null,
      retryCount: 0,
      isWatchEnabled: false,
      watchExpiration: null,
    };

    this.accountStates.set(account.id, accountState);

    // Start initial sync
    await this.syncAccount(account.id);

    // Set up push notifications if enabled
    if (this.config.enablePushNotifications) {
      await this.setupPushNotifications(account.id);
    }

    // Set up periodic polling as fallback
    this.setupPolling(account.id);

    this.emitEvent('account_updated', account.id, { added: true });
  }

  async removeAccount(accountId: string): Promise<void> {
    // Clean up polling
    const interval = this.pollingIntervals.get(accountId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(accountId);
    }

    // Stop push notifications
    if (this.config.enablePushNotifications) {
      await this.stopPushNotifications(accountId);
    }

    // Remove state
    this.accountStates.delete(accountId);

    this.emitEvent('account_updated', accountId, { removed: true });
  }

  getAccountState(accountId: string): AccountSyncState | undefined {
    return this.accountStates.get(accountId);
  }

  getAllAccountStates(): AccountSyncState[] {
    return Array.from(this.accountStates.values());
  }

  // Sync Operations
  async syncAccount(accountId: string, force: boolean = false): Promise<SyncResult> {
    const startTime = Date.now();
    const accountState = this.accountStates.get(accountId);
    
    if (!accountState) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (accountState.status === 'syncing' && !force) {
      throw new Error(`Account ${accountId} is already syncing`);
    }

    this.updateAccountState(accountId, { status: 'syncing', error: null });
    this.emitEvent('sync_started', accountId);

    try {
      let result: SyncResult;

      if (this.config.enableIncrementalSync && accountState.lastHistoryId && !force) {
        result = await this.performIncrementalSync(accountId);
      } else {
        result = await this.performFullSync(accountId);
      }

      // Process any pending operations
      await this.processPendingOperations(accountId);

      this.updateAccountState(accountId, {
        status: 'idle',
        lastSyncTime: new Date(),
        retryCount: 0,
      });

      this.emitEvent('sync_completed', accountId, result);
      return result;

    } catch (error) {
      const handledError = handleGmailError(error);
      const shouldRetry = this.shouldRetry(accountState);

      this.updateAccountState(accountId, {
        status: shouldRetry ? 'idle' : 'error',
        error: handledError.message,
        retryCount: accountState.retryCount + 1,
      });

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const delay = Math.pow(2, accountState.retryCount) * 1000;
        setTimeout(() => this.syncAccount(accountId), delay);
      }

      this.emitEvent('sync_error', accountId, { error: handledError.message });

      const syncDuration = Date.now() - startTime;
      return {
        accountId,
        success: false,
        newMessages: [],
        updatedMessages: [],
        deletedMessageIds: [],
        newLabels: [],
        updatedLabels: [],
        error: handledError.message,
        syncDuration,
      };
    }
  }

  async syncAllAccounts(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const syncPromises = Array.from(this.accountStates.keys()).map(async (accountId) => {
      try {
        const result = await this.syncAccount(accountId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to sync account ${accountId}:`, error);
      }
    });

    await Promise.all(syncPromises);
    return results;
  }

  private async performFullSync(accountId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      accountId,
      success: true,
      newMessages: [],
      updatedMessages: [],
      deletedMessageIds: [],
      newLabels: [],
      updatedLabels: [],
      syncDuration: 0,
    };

    try {
      // Sync labels first
      const labels = await this.syncLabels(accountId);
      result.newLabels = labels;

      // Sync messages with pagination
      let pageToken: string | undefined;
      const accountState = this.accountStates.get(accountId)!;
      
      do {
        const response = await invoke<{
          messages: any[];
          historyId: string;
          nextPageToken?: string;
        }>('gmail_get_messages_batch', {
          accountId,
          maxResults: this.config.batchSize,
          pageToken,
        });

        if (response.messages && response.messages.length > 0) {
          const parsedMessages = await this.parseMessages(accountId, response.messages);
          result.newMessages.push(...parsedMessages);
        }

        // Update history ID for incremental sync
        if (response.historyId) {
          this.updateAccountState(accountId, { lastHistoryId: response.historyId });
        }

        pageToken = response.nextPageToken;
        
        // Update progress
        this.emitEvent('sync_started', accountId, { 
          progress: result.newMessages.length,
          hasMore: !!pageToken 
        });

      } while (pageToken);

      result.syncDuration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.syncDuration = Date.now() - startTime;
      throw error;
    }
  }

  private async performIncrementalSync(accountId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const accountState = this.accountStates.get(accountId)!;
    
    const result: SyncResult = {
      accountId,
      success: true,
      newMessages: [],
      updatedMessages: [],
      deletedMessageIds: [],
      newLabels: [],
      updatedLabels: [],
      syncDuration: 0,
    };

    try {
      // Get history since last sync
      const historyResponse = await invoke<{
        history: any[];
        historyId: string;
        nextPageToken?: string;
      }>('gmail_get_history', {
        accountId,
        startHistoryId: accountState.lastHistoryId,
      });

      if (historyResponse.history && historyResponse.history.length > 0) {
        const changes = await this.processHistoryChanges(accountId, historyResponse.history);
        result.newMessages = changes.newMessages;
        result.updatedMessages = changes.updatedMessages;
        result.deletedMessageIds = changes.deletedMessageIds;
      }

      // Update history ID
      if (historyResponse.historyId) {
        this.updateAccountState(accountId, { lastHistoryId: historyResponse.historyId });
      }

      result.syncDuration = Date.now() - startTime;
      return result;

    } catch (error) {
      // If incremental sync fails, fall back to full sync
      console.warn(`Incremental sync failed for account ${accountId}, falling back to full sync:`, error);
      return this.performFullSync(accountId);
    }
  }

  private async processHistoryChanges(accountId: string, history: any[]): Promise<{
    newMessages: ParsedEmail[];
    updatedMessages: ParsedEmail[];
    deletedMessageIds: string[];
  }> {
    const newMessages: ParsedEmail[] = [];
    const updatedMessages: ParsedEmail[] = [];
    const deletedMessageIds: string[] = [];

    for (const historyRecord of history) {
      // Process messages added
      if (historyRecord.messagesAdded) {
        for (const added of historyRecord.messagesAdded) {
          try {
            const fullMessage = await invoke<any>('gmail_get_message', {
              accountId,
              messageId: added.message.id,
            });
            const parsedMessage = await this.parseMessage(accountId, fullMessage);
            newMessages.push(parsedMessage);
          } catch (error) {
            console.error(`Failed to fetch new message ${added.message.id}:`, error);
          }
        }
      }

      // Process messages deleted
      if (historyRecord.messagesDeleted) {
        for (const deleted of historyRecord.messagesDeleted) {
          deletedMessageIds.push(deleted.message.id);
        }
      }

      // Process label changes (treated as updates)
      if (historyRecord.labelsAdded || historyRecord.labelsRemoved) {
        // For label changes, we need to refetch the message
        const messageId = historyRecord.labelsAdded?.[0]?.message?.id || 
                         historyRecord.labelsRemoved?.[0]?.message?.id;
        
        if (messageId) {
          try {
            const fullMessage = await invoke<any>('gmail_get_message', {
              accountId,
              messageId,
            });
            const parsedMessage = await this.parseMessage(accountId, fullMessage);
            updatedMessages.push(parsedMessage);
          } catch (error) {
            console.error(`Failed to fetch updated message ${messageId}:`, error);
          }
        }
      }
    }

    return { newMessages, updatedMessages, deletedMessageIds };
  }

  // Push Notifications
  private async setupPushNotifications(accountId: string): Promise<void> {
    try {
      const response = await invoke<{
        success: boolean;
        expiration: string;
      }>('gmail_setup_push_notifications', {
        accountId,
        topicName: `gmail-sync-${accountId}`,
      });

      if (response.success) {
        this.updateAccountState(accountId, {
          isWatchEnabled: true,
          watchExpiration: new Date(response.expiration),
        });
        
        console.log(`Push notifications enabled for account ${accountId}`);
      }
    } catch (error) {
      console.error(`Failed to set up push notifications for account ${accountId}:`, error);
      // Continue with polling fallback
    }
  }

  private async stopPushNotifications(accountId: string): Promise<void> {
    try {
      await invoke<void>('gmail_stop_push_notifications', { accountId });
      
      this.updateAccountState(accountId, {
        isWatchEnabled: false,
        watchExpiration: null,
      });
    } catch (error) {
      console.error(`Failed to stop push notifications for account ${accountId}:`, error);
    }
  }

  // Polling
  private setupPolling(accountId: string): void {
    // Clear existing interval
    const existingInterval = this.pollingIntervals.get(accountId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up new interval
    const interval = setInterval(async () => {
      const accountState = this.accountStates.get(accountId);
      if (accountState && accountState.status === 'idle' && this.isOnline) {
        try {
          await this.syncAccount(accountId);
        } catch (error) {
          console.error(`Polling sync failed for account ${accountId}:`, error);
        }
      }
    }, this.config.pollingInterval * 60 * 1000); // Convert minutes to milliseconds

    this.pollingIntervals.set(accountId, interval);
  }

  // Offline Operations Queue
  async queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.config.enableOfflineQueue) {
      throw new Error('Offline queue is disabled');
    }

    const accountState = this.accountStates.get(operation.messageIds[0]); // Assume same account for all messages
    if (!accountState) {
      throw new Error('Account not found for queued operation');
    }

    const pendingOp: PendingOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
    };

    accountState.pendingOperations.push(pendingOp);

    // Try to process immediately if online
    if (this.isOnline) {
      await this.processPendingOperations(accountState.accountId);
    }
  }

  private async processPendingOperations(accountId: string): Promise<void> {
    const accountState = this.accountStates.get(accountId);
    if (!accountState || accountState.pendingOperations.length === 0) {
      return;
    }

    const operations = [...accountState.pendingOperations];
    accountState.pendingOperations = [];

    for (const operation of operations) {
      try {
        await this.executePendingOperation(accountId, operation);
      } catch (error) {
        console.error(`Failed to execute pending operation ${operation.id}:`, error);
        
        // Re-queue if under retry limit
        if (operation.retryCount < this.config.maxRetries) {
          operation.retryCount++;
          accountState.pendingOperations.push(operation);
        }
      }
    }
  }

  private async executePendingOperation(accountId: string, operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'mark_read':
        await invoke('gmail_mark_as_read', { accountId, messageIds: operation.messageIds });
        break;
      case 'mark_unread':
        await invoke('gmail_mark_as_unread', { accountId, messageIds: operation.messageIds });
        break;
      case 'star':
        await invoke('gmail_star_messages', { accountId, messageIds: operation.messageIds });
        break;
      case 'unstar':
        await invoke('gmail_unstar_messages', { accountId, messageIds: operation.messageIds });
        break;
      case 'delete':
        await invoke('gmail_delete_messages', { accountId, messageIds: operation.messageIds });
        break;
      case 'archive':
        await invoke('gmail_archive_messages', { accountId, messageIds: operation.messageIds });
        break;
      case 'move_label':
        await invoke('gmail_modify_labels', { 
          accountId, 
          messageIds: operation.messageIds,
          addLabels: [operation.labelId!],
          removeLabels: []
        });
        break;
    }
  }

  // Helper Methods
  private async syncLabels(accountId: string): Promise<GmailLabel[]> {
    const response = await invoke<GmailLabel[]>('gmail_get_labels', { accountId });
    return response;
  }

  private async parseMessages(accountId: string, messages: any[]): Promise<ParsedEmail[]> {
    const parsed: ParsedEmail[] = [];
    
    for (const message of messages) {
      try {
        const parsedMessage = await this.parseMessage(accountId, message);
        parsed.push(parsedMessage);
      } catch (error) {
        console.error(`Failed to parse message ${message.id}:`, error);
      }
    }
    
    return parsed;
  }

  private async parseMessage(accountId: string, message: any): Promise<ParsedEmail> {
    // Use existing gmailService parsing logic
    const parsedMessage = gmailService.parseMessage(message);
    return {
      ...parsedMessage,
      accountId,
    };
  }

  private updateAccountState(accountId: string, updates: Partial<AccountSyncState>): void {
    const currentState = this.accountStates.get(accountId);
    if (currentState) {
      Object.assign(currentState, updates);
    }
  }

  private shouldRetry(accountState: AccountSyncState): boolean {
    return accountState.retryCount < this.config.maxRetries && this.isOnline;
  }

  // Network Status
  private initializeNetworkListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      this.emitEvent('connection_status_changed', undefined, { online: true });
      
      // Resume syncing for all accounts
      for (const accountId of this.accountStates.keys()) {
        this.syncAccount(accountId).catch(error => {
          console.error(`Failed to resume sync for account ${accountId}:`, error);
        });
      }
    };

    const handleOffline = () => {
      this.isOnline = false;
      this.emitEvent('connection_status_changed', undefined, { online: false });
      
      // Update all account states to offline
      for (const [accountId, state] of this.accountStates) {
        if (state.status === 'syncing') {
          this.updateAccountState(accountId, { status: 'offline' });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Tauri Event Listeners
  private async initializeTauriEventListeners(): Promise<void> {
    try {
      // Listen for push notifications from backend
      const pushUnlisten = await listen<PushNotificationData>('gmail-push-notification', (event) => {
        this.handlePushNotification(event.payload);
      });
      this.eventUnlisteners.push(pushUnlisten);

      // Listen for other Gmail events
      const syncUnlisten = await listen<{ accountId: string; type: string; data: any }>('gmail-sync-event', (event) => {
        this.emitEvent(event.payload.type as SyncEventType, event.payload.accountId, event.payload.data);
      });
      this.eventUnlisteners.push(syncUnlisten);

    } catch (error) {
      console.error('Failed to set up Tauri event listeners:', error);
    }
  }

  private async handlePushNotification(data: PushNotificationData): Promise<void> {
    this.emitEvent('push_notification_received', data.accountId, data);
    
    // Trigger incremental sync for the account
    try {
      await this.syncAccount(data.accountId);
    } catch (error) {
      console.error(`Failed to sync account ${data.accountId} after push notification:`, error);
    }
  }

  // Event System
  addEventListener(type: SyncEventType, listener: SyncEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: SyncEventType, listener: SyncEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emitEvent(type: SyncEventType, accountId?: string, data?: any): void {
    const event: SyncEvent = {
      type,
      accountId,
      data,
      timestamp: new Date(),
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in sync event listener for ${type}:`, error);
        }
      });
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Clear all polling intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();

    // Stop push notifications for all accounts
    if (this.config.enablePushNotifications) {
      for (const accountId of this.accountStates.keys()) {
        await this.stopPushNotifications(accountId);
      }
    }

    // Unlisten from Tauri events
    for (const unlisten of this.eventUnlisteners) {
      await unlisten();
    }

    // Clear all listeners
    this.listeners.clear();
    this.accountStates.clear();
  }

  // Status and Monitoring
  getOverallStatus(): {
    isOnline: boolean;
    totalAccounts: number;
    syncingAccounts: number;
    errorAccounts: number;
    pendingOperations: number;
  } {
    const states = Array.from(this.accountStates.values());
    
    return {
      isOnline: this.isOnline,
      totalAccounts: states.length,
      syncingAccounts: states.filter(s => s.status === 'syncing').length,
      errorAccounts: states.filter(s => s.status === 'error').length,
      pendingOperations: states.reduce((sum, s) => sum + s.pendingOperations.length, 0),
    };
  }

  async pauseSync(accountId?: string): Promise<void> {
    if (accountId) {
      this.updateAccountState(accountId, { status: 'paused' });
    } else {
      // Pause all accounts
      for (const accountId of this.accountStates.keys()) {
        this.updateAccountState(accountId, { status: 'paused' });
      }
    }
  }

  async resumeSync(accountId?: string): Promise<void> {
    if (accountId) {
      this.updateAccountState(accountId, { status: 'idle' });
      await this.syncAccount(accountId);
    } else {
      // Resume all accounts
      for (const accountId of this.accountStates.keys()) {
        this.updateAccountState(accountId, { status: 'idle' });
        await this.syncAccount(accountId);
      }
    }
  }
}

// Singleton instance
export const gmailSyncService = new GmailSyncService(); 
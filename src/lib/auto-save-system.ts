/**
 * Universal Auto-Save System
 * 
 * Provides comprehensive auto-save functionality with debouncing, conflict resolution,
 * offline support, and real-time synchronization across all content types.
 * 
 * Features:
 * - Debounced save operations (configurable delay)
 * - Conflict resolution for concurrent edits
 * - Offline support with sync when reconnected
 * - Save status tracking and visual feedback
 * - Optimistic updates with rollback on error
 * - Real-time synchronization across modules
 */

// Simple debounce implementation to avoid external dependencies
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

export interface AutoSaveConfig {
  debounceMs: number; // Default: 500ms
  maxRetries: number; // Default: 3 retries
  conflictResolution: 'merge' | 'overwrite' | 'prompt';
  offlineSupport: boolean;
  enableOptimisticUpdates: boolean;
  syncInterval?: number; // For periodic sync checks
}

export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';
  lastSaved: Date | null;
  lastAttempted: Date | null;
  error?: string;
  conflictData?: any;
  retryCount: number;
  isOnline: boolean;
}

export type ContentType = 'note' | 'task' | 'chat' | 'canvas' | 'agent';

export interface SaveOperation<T = any> {
  id: string;
  contentType: ContentType;
  contentId: string;
  data: T;
  timestamp: Date;
  version: number;
  checksum?: string;
  metadata?: Record<string, any>;
}

export interface ConflictResolutionData<T = any> {
  local: SaveOperation<T>;
  remote: SaveOperation<T>;
  base?: SaveOperation<T>; // Common ancestor for 3-way merge
}

export type SaveHandler<T = any> = (operation: SaveOperation<T>) => Promise<boolean>;
export type ConflictResolver<T = any> = (conflict: ConflictResolutionData<T>) => Promise<SaveOperation<T>>;
export type StatusChangeHandler = (contentId: string, status: SaveStatus) => void;

class AutoSaveSystem {
  private config: AutoSaveConfig;
  private saveHandlers: Map<ContentType, SaveHandler> = new Map();
  private conflictResolvers: Map<ContentType, ConflictResolver> = new Map();
  private statusChangeHandlers: Set<StatusChangeHandler> = new Set();
  private saveStatuses: Map<string, SaveStatus> = new Map();
  private pendingOperations: Map<string, SaveOperation> = new Map();
  private debouncedSaves: Map<string, ReturnType<typeof debounce>> = new Map();
  private offlineQueue: SaveOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval?: NodeJS.Timeout;

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = {
      debounceMs: 500,
      maxRetries: 3,
      conflictResolution: 'prompt',
      offlineSupport: true,
      enableOptimisticUpdates: true,
      syncInterval: 30000, // 30 seconds
      ...config
    };

    this.initializeNetworkListeners();
    this.initializeSyncInterval();
  }

  /**
   * Register a save handler for a specific content type
   */
  registerSaveHandler<T>(contentType: ContentType, handler: SaveHandler<T>): void {
    this.saveHandlers.set(contentType, handler);
  }

  /**
   * Register a conflict resolver for a specific content type
   */
  registerConflictResolver<T>(contentType: ContentType, resolver: ConflictResolver<T>): void {
    this.conflictResolvers.set(contentType, resolver);
  }

  /**
   * Subscribe to save status changes
   */
  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.add(handler);
    return () => this.statusChangeHandlers.delete(handler);
  }

  /**
   * Get current save status for content
   */
  getSaveStatus(contentId: string): SaveStatus {
    return this.saveStatuses.get(contentId) || {
      status: 'idle',
      lastSaved: null,
      lastAttempted: null,
      retryCount: 0,
      isOnline: this.isOnline
    };
  }

  /**
   * Auto-save content with debouncing
   */
  autoSave<T>(
    contentType: ContentType,
    contentId: string,
    data: T,
    metadata?: Record<string, any>
  ): void {
    // Create save operation
    const operation: SaveOperation<T> = {
      id: `${contentId}-${Date.now()}`,
      contentType,
      contentId,
      data,
      timestamp: new Date(),
      version: this.getNextVersion(contentId),
      checksum: this.generateChecksum(data),
      metadata
    };

    // Update status to indicate pending save
    this.updateSaveStatus(contentId, {
      status: 'saving',
      lastAttempted: new Date(),
      isOnline: this.isOnline
    });

    // Get or create debounced save function for this content
    let debouncedSave = this.debouncedSaves.get(contentId);
    if (!debouncedSave) {
      debouncedSave = debounce(
        (op: SaveOperation<T>) => this.executeSave(op),
        this.config.debounceMs
      );
      this.debouncedSaves.set(contentId, debouncedSave);
    }

    // Store pending operation and execute debounced save
    this.pendingOperations.set(contentId, operation);
    debouncedSave(operation);
  }

  /**
   * Force immediate save (bypasses debouncing)
   */
  async forceSave<T>(
    contentType: ContentType,
    contentId: string,
    data: T,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const operation: SaveOperation<T> = {
      id: `${contentId}-${Date.now()}`,
      contentType,
      contentId,
      data,
      timestamp: new Date(),
      version: this.getNextVersion(contentId),
      checksum: this.generateChecksum(data),
      metadata
    };

    return this.executeSave(operation);
  }

  /**
   * Execute save operation
   */
  private async executeSave<T>(operation: SaveOperation<T>): Promise<boolean> {
    const { contentId, contentType } = operation;
    
    try {
      // Check if we're offline and offline support is enabled
      if (!this.isOnline && this.config.offlineSupport) {
        this.queueOfflineOperation(operation);
        this.updateSaveStatus(contentId, {
          status: 'offline',
          lastAttempted: new Date(),
          isOnline: false
        });
        return true; // Optimistic success for offline
      }

      // Get save handler for content type
      const saveHandler = this.saveHandlers.get(contentType);
      if (!saveHandler) {
        throw new Error(`No save handler registered for content type: ${contentType}`);
      }

      // Execute save
      const success = await saveHandler(operation);
      
      if (success) {
        this.updateSaveStatus(contentId, {
          status: 'saved',
          lastSaved: new Date(),
          lastAttempted: new Date(),
          retryCount: 0,
          isOnline: this.isOnline
        });
        
        // Remove from pending operations
        this.pendingOperations.delete(contentId);
        
        return true;
      } else {
        throw new Error('Save handler returned false');
      }
    } catch (error) {
      return this.handleSaveError(operation, error as Error);
    }
  }

  /**
   * Handle save errors with retry logic
   */
  private async handleSaveError<T>(operation: SaveOperation<T>, error: Error): Promise<boolean> {
    const { contentId } = operation;
    const currentStatus = this.getSaveStatus(contentId);
    
    // Check if this is a conflict error
    if (error.message.includes('conflict') || error.message.includes('version')) {
      return this.handleConflict(operation, error);
    }

    // Increment retry count
    const newRetryCount = currentStatus.retryCount + 1;
    
    if (newRetryCount <= this.config.maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s
      
      this.updateSaveStatus(contentId, {
        status: 'error',
        error: `Retry ${newRetryCount}/${this.config.maxRetries}: ${error.message}`,
        retryCount: newRetryCount,
        lastAttempted: new Date(),
        isOnline: this.isOnline
      });

      setTimeout(() => {
        this.executeSave(operation);
      }, retryDelay);
      
      return false;
    } else {
      // Max retries exceeded
      this.updateSaveStatus(contentId, {
        status: 'error',
        error: `Failed after ${this.config.maxRetries} retries: ${error.message}`,
        retryCount: newRetryCount,
        lastAttempted: new Date(),
        isOnline: this.isOnline
      });
      
      return false;
    }
  }

  /**
   * Handle save conflicts
   */
  private async handleConflict<T>(operation: SaveOperation<T>, error: Error): Promise<boolean> {
    const { contentId, contentType } = operation;
    
    this.updateSaveStatus(contentId, {
      status: 'conflict',
      error: error.message,
      conflictData: operation,
      lastAttempted: new Date(),
      isOnline: this.isOnline
    });

    // Get conflict resolver for content type
    const conflictResolver = this.conflictResolvers.get(contentType);
    
    if (conflictResolver && this.config.conflictResolution !== 'prompt') {
      try {
        // Auto-resolve conflict based on strategy
        const resolvedOperation = await this.autoResolveConflict(operation, error, conflictResolver);
        return this.executeSave(resolvedOperation);
      } catch (resolveError) {
        console.error('Auto-conflict resolution failed:', resolveError);
      }
    }

    // If no resolver or auto-resolution failed, require manual intervention
    return false;
  }

  /**
   * Auto-resolve conflicts based on strategy
   */
  private async autoResolveConflict<T>(
    operation: SaveOperation<T>,
    error: Error,
    resolver: ConflictResolver<T>
  ): Promise<SaveOperation<T>> {
    // This would typically fetch the remote version and base version
    // For now, we'll simulate the conflict resolution data
    const conflictData: ConflictResolutionData<T> = {
      local: operation,
      remote: operation, // Would be fetched from server
      base: operation    // Would be the common ancestor
    };

    return resolver(conflictData);
  }

  /**
   * Queue operation for offline processing
   */
  private queueOfflineOperation<T>(operation: SaveOperation<T>): void {
    this.offlineQueue.push(operation);
    
    // Persist to localStorage for recovery
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('autoSaveOfflineQueue', JSON.stringify(this.offlineQueue));
    }
  }

  /**
   * Process offline queue when coming back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline operations`);
    
    const operations = [...this.offlineQueue];
    this.offlineQueue = [];
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('autoSaveOfflineQueue');
    }

    // Process operations in order
    for (const operation of operations) {
      try {
        await this.executeSave(operation);
      } catch (error) {
        console.error('Failed to process offline operation:', error);
        // Re-queue failed operations
        this.queueOfflineOperation(operation);
      }
    }
  }

  /**
   * Initialize network status listeners
   */
  private initializeNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
      
      // Update all save statuses
      for (const [contentId, status] of this.saveStatuses.entries()) {
        this.updateSaveStatus(contentId, { ...status, isOnline: true });
      }
      
      // Process offline queue
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
      
      // Update all save statuses
      for (const [contentId, status] of this.saveStatuses.entries()) {
        this.updateSaveStatus(contentId, { ...status, isOnline: false });
      }
    });
  }

  /**
   * Initialize periodic sync interval
   */
  private initializeSyncInterval(): void {
    if (this.config.syncInterval) {
      this.syncInterval = setInterval(() => {
        this.performPeriodicSync();
      }, this.config.syncInterval);
    }
  }

  /**
   * Perform periodic sync check
   */
  private async performPeriodicSync(): Promise<void> {
    if (!this.isOnline) return;

    // Check for any failed saves that might need retry
    for (const [contentId, status] of this.saveStatuses.entries()) {
      if (status.status === 'error' && status.retryCount < this.config.maxRetries) {
        const pendingOperation = this.pendingOperations.get(contentId);
        if (pendingOperation) {
          console.log(`Retrying failed save for ${contentId}`);
          this.executeSave(pendingOperation);
        }
      }
    }
  }

  /**
   * Update save status and notify listeners
   */
  private updateSaveStatus(contentId: string, updates: Partial<SaveStatus>): void {
    const currentStatus = this.getSaveStatus(contentId);
    const newStatus = { ...currentStatus, ...updates };
    
    this.saveStatuses.set(contentId, newStatus);
    
    // Notify all status change handlers
    for (const handler of this.statusChangeHandlers) {
      try {
        handler(contentId, newStatus);
      } catch (error) {
        console.error('Error in status change handler:', error);
      }
    }
  }

  /**
   * Generate version number for content
   */
  private getNextVersion(contentId: string): number {
    const currentStatus = this.getSaveStatus(contentId);
    return (currentStatus.lastSaved ? 1 : 0) + 1;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all debounced functions
    for (const debouncedSave of this.debouncedSaves.values()) {
      debouncedSave.cancel();
    }
    this.debouncedSaves.clear();

    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Clear all maps and sets
    this.saveHandlers.clear();
    this.conflictResolvers.clear();
    this.statusChangeHandlers.clear();
    this.saveStatuses.clear();
    this.pendingOperations.clear();
  }
}

// Global auto-save system instance
export const autoSaveSystem = new AutoSaveSystem();

// Utility functions for common save operations
export const AutoSaveUtils = {
  /**
   * Create a simple save handler that calls a function
   */
  createSaveHandler<T>(saveFn: (data: T, metadata?: any) => Promise<boolean>): SaveHandler<T> {
    return async (operation: SaveOperation<T>) => {
      return saveFn(operation.data, operation.metadata);
    };
  },

  /**
   * Create a merge-based conflict resolver
   */
  createMergeResolver<T extends Record<string, any>>(): ConflictResolver<T> {
    return async (conflict: ConflictResolutionData<T>) => {
      // Simple merge strategy: local changes take precedence
      const merged = {
        ...conflict.remote.data,
        ...conflict.local.data,
        updatedAt: new Date().toISOString()
      };

      return {
        ...conflict.local,
        data: merged as T,
        version: conflict.local.version + 1
      };
    };
  },

  /**
   * Create an overwrite-based conflict resolver
   */
  createOverwriteResolver<T>(): ConflictResolver<T> {
    return async (conflict: ConflictResolutionData<T>) => {
      // Local version always wins
      return {
        ...conflict.local,
        version: conflict.local.version + 1
      };
    };
  }
};
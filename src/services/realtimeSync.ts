/**
 * Real-time synchronization service using the unified task store
 * Replaces the flawed kanbanGoogleTasksSync.ts
 */

import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
import { UnifiedTask } from '../stores/unifiedTaskStore.types';
import { GoogleTask } from '../types/google';
import { logger } from '../core/lib/logger';
import { googleTasksService } from './google/googleTasksService';
import { useSettingsStore } from '../stores/settingsStore';

class RealtimeSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private syncPromise: Promise<void> | null = null;
  private syncRequestTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize sync service and set up auto-sync
   */
  async initialize() {
    if (this.isInitialized) {
      logger.info('[RealtimeSync] Sync service already initialized, skipping');
      return;
    }
    
    logger.info('[RealtimeSync] Initializing sync service');
    console.log('[RealtimeSync] Initializing sync service - CONSOLE LOG');
    
    // Mark as initialized
    this.isInitialized = true;
    
    // Small delay to ensure subscriptions are ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Perform initial sync on startup
    await this.syncNow();
    
    // Set up periodic sync (every 5 minutes)
    this.startPeriodicSync();
    
    logger.info('[RealtimeSync] Sync service initialized successfully');
    console.log('[RealtimeSync] Sync service initialized successfully - CONSOLE LOG');
  }

  /**
   * Requests a sync operation. Debounces multiple requests into a single sync.
   * This is the primary way to trigger a sync after a local change.
   * @param delay The debounce delay in milliseconds.
   */
  requestSync(delay = 1000) {
    if (this.syncRequestTimeout) {
      clearTimeout(this.syncRequestTimeout);
    }
    logger.debug(`[RealtimeSync] Sync requested, will run in ${delay}ms`);
    this.syncRequestTimeout = setTimeout(() => {
      this.syncNow().catch(err => {
        logger.error('[RealtimeSync] Debounced sync execution failed', err);
      });
    }, delay);
  }

  /**
   * Set up columns based on Google Task lists
   */
  private async setupColumns() {
    const storeState = useUnifiedTaskStore.getState();
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    
    if (!activeAccount) {
      logger.warn('[RealtimeSync] Cannot setup columns - not authenticated');
      return;
    }

    try {
      logger.info('[RealtimeSync] Setting up columns from Google Task lists');
      
      const response = await googleTasksService.getTaskLists(
        { id: activeAccount.id } as any
      );
      
      if (!response.success) {
        const errorMessage = response.error?.message || 'Unknown error';
        const errorCode = response.error?.code;
        logger.error('[RealtimeSync] Failed to get task lists:', {
          message: errorMessage,
          code: errorCode,
          error: response.error
        });
        
        // Provide more specific error messages
        if (errorCode === 403) {
          console.error('[RealtimeSync] Google Tasks API access denied. Please ensure:\n' +
            '1. Google Tasks API is enabled in Google Cloud Console\n' + 
            '2. Your OAuth consent screen includes Tasks scope\n' +
            '3. Try disconnecting and reconnecting your Google account');
        } else if (errorCode === 401) {
          console.error('[RealtimeSync] Authentication failed. Your access token may have expired. Please reconnect your Google account.');
        } else {
          console.error(`[RealtimeSync] Error: ${errorMessage}. Please check your Google account permissions.`);
        }
        return;
      }
      
      let taskLists = response.data || [];
      
      logger.info('[RealtimeSync] Found task lists from Google:', {
        count: taskLists.length,
        taskLists: taskLists.map(tl => ({ id: tl.id, title: tl.title }))
      });
      
      // If no task lists exist, create a default one
      if (taskLists.length === 0) {
        logger.info('[RealtimeSync] No task lists found, creating default "My Tasks" list');
        const createResponse = await googleTasksService.createTaskList(
          { id: activeAccount.id } as any,
          'My Tasks'
        );
        
        if (createResponse.success && createResponse.data) {
          taskLists = [createResponse.data];
        } else {
          logger.error('[RealtimeSync] Failed to create default task list:', createResponse.error);
          console.error('[RealtimeSync] Failed to create default task list. Please check your Google account permissions.');
          return;
        }
      }
    
      logger.info('[RealtimeSync] Setting up columns from Google Task lists');
      
      // DO NOT DELETE COLUMNS - This was causing data loss!
      // Instead, we'll update existing columns to add googleTaskListId
      const existingColumns = storeState.columns;
      const columnsWithoutGoogleId = existingColumns.filter(c => !c.googleTaskListId);
      
      if (columnsWithoutGoogleId.length > 0) {
        logger.warn('[RealtimeSync] Found columns without googleTaskListId, will update them:', {
          columns: columnsWithoutGoogleId.map(c => ({ id: c.id, title: c.title }))
        });
        // Don't delete - we'll handle these below by matching them with Google Task Lists
      }
      
      // Create columns for each Google Task list
      for (const taskList of taskLists) {
        const existingColumn = storeState.columns.find(c => c.id === taskList.id);
        
        if (!existingColumn) {
          // CRITICAL: Column ID must match Google Task List ID for tasks to display
          storeState.addColumn(taskList.id, taskList.title, taskList.id);
          logger.info(`[RealtimeSync] Created column "${taskList.title}" with ID: ${taskList.id} and googleTaskListId: ${taskList.id}`);
        } else {
          // Fix existing columns that might have missing googleTaskListId
          if (!existingColumn.googleTaskListId) {
            storeState.updateColumn(existingColumn.id, { googleTaskListId: taskList.id });
            logger.info(`[RealtimeSync] Fixed existing column "${existingColumn.title}" - added googleTaskListId: ${taskList.id}`);
          } else {
            logger.info(`[RealtimeSync] Column already exists: "${existingColumn.title}" with ID: ${existingColumn.id} and googleTaskListId: ${existingColumn.googleTaskListId}`);
          }
        }
      }
      
      // Log final column state
      logger.info('[RealtimeSync] Columns after setup:', {
        columns: storeState.columns.map(c => ({
          id: c.id,
          title: c.title,
          googleTaskListId: c.googleTaskListId,
          taskIdsCount: c.taskIds?.length || 0
        }))
      });
    } catch (error) {
      logger.error('[RealtimeSync] Error in setupColumns:', error);
      console.error('[RealtimeSync] Failed to set up task lists. Please try refreshing the page.');
    }
  }

  /**
   * Perform a full synchronization
   */
  async syncNow() {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      logger.debug('[RealtimeSync] Sync already in progress, waiting...');
      return this.syncPromise;
    }

    logger.info('[RealtimeSync] Starting syncNow...');
    this.isSyncing = true;
    const storeState = useUnifiedTaskStore.getState();
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    
    if (!activeAccount) {
      logger.warn('[RealtimeSync] Cannot sync - not authenticated');
      this.isSyncing = false;
      // Show user-facing message
      console.warn('Please connect your Google account in Settings to sync tasks.');
      return;
    }

    logger.info('[RealtimeSync] Authentication confirmed, proceeding with sync');
    storeState.setSyncing(true);
    
    this.syncPromise = this.doSync()
      .catch(error => {
        logger.error('[RealtimeSync] Sync failed:', error);
        // Show user-facing error
        console.error('Sync failed:', error);
      })
      .finally(() => {
        this.isSyncing = false;
        storeState.setSyncing(false);
        this.syncPromise = null;
        logger.info('[RealtimeSync] Sync completed');
      });
    
    return this.syncPromise;
  }

  /**
   * Core sync logic - properly ordered to prevent duplication
   */
  private async doSync() {
    try {
      logger.info('[RealtimeSync] Starting sync');
      
      // Phase 0: Ensure columns are set up before any sync operations
      await this.setupColumns();
      
      // Phase 1: Push all pending local changes to Google
      await this.pushLocalChanges();
      
      // Add a small delay after push to allow Google's API to propagate changes
      // This helps prevent the issue where newly created tasks aren't immediately visible
      if (this.hadPendingChanges) {
        logger.info('[RealtimeSync] Waiting for Google API propagation...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Phase 2: Fetch and reconcile Google state
      await this.pullRemoteChanges();
      
      logger.info('[RealtimeSync] Sync completed successfully');
    } catch (error) {
      logger.error('[RealtimeSync] Sync failed:', error);
      throw error;
    }
  }

  private hadPendingChanges = false;

  /**
   * Push local changes to Google
   */
  private async pushLocalChanges() {
    const storeState = useUnifiedTaskStore.getState();
    const pendingTasks = storeState.getPendingTasks();
    
    this.hadPendingChanges = pendingTasks.length > 0;
    
    logger.info(`[RealtimeSync] Pushing ${pendingTasks.length} pending changes`, {
      pendingTasks: pendingTasks.map(t => ({
        id: t.id,
        title: t.title,
        syncState: t.syncState,
        columnId: t.columnId,
        googleTaskListId: t.googleTaskListId
      }))
    });
    
    for (const task of pendingTasks) {
      try {
        logger.info(`[RealtimeSync] Processing task: ${task.title} (${task.syncState})`);
        
        switch (task.syncState) {
          case 'pending_create':
            logger.info(`[RealtimeSync] Creating task in Google: ${task.title}`);
            await this.createTaskInGoogle(task);
            break;
            
          case 'pending_update':
            logger.info(`[RealtimeSync] Updating task in Google: ${task.title}`);
            await this.updateTaskInGoogle(task);
            break;
            
          case 'pending_delete':
            logger.info(`[RealtimeSync] Deleting task from Google: ${task.title}`);
            await this.deleteTaskFromGoogle(task);
            break;
        }
      } catch (error) {
        logger.error(`[RealtimeSync] Failed to sync task ${task.id}:`, error);
        storeState.markTaskSyncError(task.id, String(error));
      }
    }
  }

  /**
   * Create a task in Google
   */
  private async createTaskInGoogle(task: UnifiedTask) {
    console.log('[RealtimeSync] createTaskInGoogle called for task:', task.title);
    
    // Get googleTaskListId without modifying the frozen object
    let googleTaskListId = task.googleTaskListId;
    
    if (!googleTaskListId) {
      // Find the Google list ID from the column
      const storeState = useUnifiedTaskStore.getState();
      const column = storeState.columns.find(c => c.id === task.columnId);
      if (!column?.googleTaskListId) {
        throw new Error('No Google Task List ID for column');
      }
      googleTaskListId = column.googleTaskListId;
    }
    
    logger.debug(`[RealtimeSync] Creating task in Google: ${task.title}`);
    console.log(`[RealtimeSync] Creating task in Google: ${task.title}, googleTaskListId: ${googleTaskListId}`);
    
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    if (!activeAccount) {
      throw new Error('No active Google account');
    }
    
    const response = await googleTasksService.createTask(
      { id: activeAccount.id } as any,
      googleTaskListId,
      {
        title: task.title,
        notes: task.notes,
        due: task.due,
      }
    );
    
    console.log('[RealtimeSync] Google API response:', response);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create task');
    }
    const googleTask = response.data;
    
    if (googleTask && googleTask.id) {
      const storeState = useUnifiedTaskStore.getState();
      storeState.markTaskSynced(task.id, googleTask.id, googleTaskListId);
      logger.debug(`[RealtimeSync] Task created in Google with ID: ${googleTask.id}`);
      console.log(`[RealtimeSync] Task created in Google with ID: ${googleTask.id}`);
    }
  }

  /**
   * Update a task in Google
   */
  private async updateTaskInGoogle(task: UnifiedTask) {
    if (!task.googleTaskId || !task.googleTaskListId) {
      throw new Error('Cannot update task without Google IDs');
    }
    
    logger.debug(`[RealtimeSync] Updating task in Google: ${task.title}`);
    
    const response = await googleTasksService.updateTask(
      { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
      task.googleTaskListId,
      task.googleTaskId,
      {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
      }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update task');
    }
    
    const storeState = useUnifiedTaskStore.getState();
    storeState.markTaskSynced(task.id, task.googleTaskId, task.googleTaskListId);
  }

  /**
   * Delete a task from Google
   */
  private async deleteTaskFromGoogle(task: UnifiedTask) {
    if (!task.googleTaskId || !task.googleTaskListId) {
      // Task was never synced, just remove locally
      const storeState = useUnifiedTaskStore.getState();
      storeState.deleteTask(task.id);
      return;
    }
    
    logger.debug(`[RealtimeSync] Deleting task from Google: ${task.title}`);
    
    const response = await googleTasksService.deleteTask(
      { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
      task.googleTaskListId,
      task.googleTaskId
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete task');
    }
    
    // FIX: Purge the task directly instead of re-triggering the delete flow.
    // Calling deleteTask() here would incorrectly mark it as 'pending_delete' again.
    const storeState = useUnifiedTaskStore.getState();
    storeState.purgeTasksByIds([task.id]);
    
    logger.debug(`[RealtimeSync] Task purged from local store after successful Google deletion`);
  }

  /**
   * Pull remote changes from Google
   */
  private async pullRemoteChanges() {
    const storeState = useUnifiedTaskStore.getState();
    
    logger.debug('[RealtimeSync] Fetching remote changes from Google');
    
    // Track all Google task IDs we've seen
    const allGoogleTaskIds = new Set<string>();
    
    // Process each Google Task list
    for (const column of storeState.columns) {
      if (!column.googleTaskListId) continue;
      
      const response = await googleTasksService.getTasks(
        { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
        column.googleTaskListId
      );
      if (response.success && response.data) {
        // Track all Google IDs we've seen
        (response.data.items || []).forEach(task => {
          if (task.id) allGoogleTaskIds.add(task.id);
        });
        
        await this.reconcileColumnTasks(column, response.data.items || []);
      }
    }
    
    // Clean up tasks that no longer exist in Google
    await this.cleanupDeletedTasks(allGoogleTaskIds);
  }

  /**
   * Reconcile tasks in a column with Google
   */
  private async reconcileColumnTasks(
    column: { id: string; googleTaskListId?: string },
    googleTasks: GoogleTask[]
  ) {
    const storeState = useUnifiedTaskStore.getState();
    const processedGoogleIds = new Set<string>();
    
    // Reconcile tasks for column
    
    // Filter out tasks marked for deletion locally
    const tasksToProcess = googleTasks.filter(googleTask => {
      if (!googleTask.id) return false;
      processedGoogleIds.add(googleTask.id);
      
      // Check if task is marked for deletion locally
      const deletedTask = Object.values(storeState.tasks).find(
        t => t.googleTaskId === googleTask.id && t.syncState === 'pending_delete'
      );
      
      if (deletedTask) {
        logger.debug(`[RealtimeSync] Skipping deleted task: ${googleTask.title}`);
        return false;
      }
      
      return true;
    });
    
    // Prepare batch updates for all tasks from Google (new and updated)
    const updates = tasksToProcess
      .filter(googleTask => {
        const existingTask = storeState.getTaskByGoogleId(googleTask.id);
        // Include tasks that don't exist or need updating
        return !existingTask || new Date(googleTask.updated) > new Date(existingTask.updated);
      })
      .map(googleTask => ({
        googleTaskId: googleTask.id,
        googleTaskListId: column.googleTaskListId!,
        data: {
          title: googleTask.title,
          notes: googleTask.notes,
          due: googleTask.due,
          status: googleTask.status,
          updated: googleTask.updated,
          position: googleTask.position,
        }
      }));
    
    // Use batch update for all tasks at once
    if (updates.length > 0) {
      storeState.batchUpdateFromGoogle(updates);
    } else {
      logger.debug('[RealtimeSync] No updates needed for this column');
    }
    
    return processedGoogleIds;
  }

  /**
   * Clean up tasks that were deleted on Google
   */
  private async cleanupDeletedTasks(allGoogleTaskIds: Set<string>) {
    const storeState = useUnifiedTaskStore.getState();    
    const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
    const now = Date.now();

    const tasksToRemove = Object.values(storeState.tasks).filter(task => {
      // Basic conditions for removal: must have a Google ID, must not be in the latest fetch, and must be in a 'synced' state.
      if (!task.googleTaskId || allGoogleTaskIds.has(task.googleTaskId) || task.syncState !== 'synced') {
        return false;
      }

      // GRACE PERIOD LOGIC: If the task was synced recently, don't remove it yet.
      // This prevents removal due to API replication lag.
      if (task.lastSyncTime) {
        const lastSync = new Date(task.lastSyncTime).getTime();
        if (now - lastSync < GRACE_PERIOD_MS) {
          logger.warn(`[RealtimeSync] Skipping cleanup for recently synced task to avoid race condition`, { taskId: task.id, title: task.title });
          return false; // Don't remove it yet.
        }
      }
      
      // If all checks pass, the task is likely genuinely deleted from Google.
      return true;
    });

    if (tasksToRemove.length > 0) {
      logger.info(`[RealtimeSync] Purging ${tasksToRemove.length} tasks that no longer exist in Google`);
      
      const taskIdsToRemove = tasksToRemove.map(task => task.id);
      storeState.purgeTasksByIds(taskIdsToRemove);
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up 5-minute sync interval
    this.syncInterval = setInterval(() => {
      logger.debug('[RealtimeSync] Running periodic sync');
      this.syncNow();
    }, 5 * 60 * 1000); // 5 minutes
    
    logger.info('[RealtimeSync] Started periodic sync (every 5 minutes)');
  }

  /**
   * Trigger an immediate sync
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('[RealtimeSync] Sync service stopped');
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSync();

// Auto-initialize when Google auth is ready
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for Google auth to be ready
    const checkAuth = setInterval(() => {
      const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
      if (activeAccount) {
        clearInterval(checkAuth);
        realtimeSync.initialize();
      }
    }, 1000);
  });
  
  // Clean up on unload
  window.addEventListener('beforeunload', () => {
    realtimeSync.stop();
  });
}
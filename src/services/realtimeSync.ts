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

  /**
   * Initialize sync service and set up auto-sync
   */
  async initialize() {
    logger.info('[RealtimeSync] Initializing sync service');
    
    // Set up store subscriptions
    this.setupStoreSubscriptions();
    
    // Perform initial sync
    await this.performSync();
    
    // Set up periodic sync (every 5 minutes)
    this.startPeriodicSync();
  }

  /**
   * Set up subscriptions to store changes
   */
  private setupStoreSubscriptions() {
    // Subscribe to auth changes via settings store
    useSettingsStore.subscribe(
      (state) => state.integrations.googleAccounts.find(acc => acc.isActive),
      (account) => {
        if (account) {
          logger.info('[RealtimeSync] Google authenticated, starting sync');
          this.performSync();
        }
      }
    );

    // Subscribe to unified store changes for immediate sync of critical operations
    useUnifiedTaskStore.subscribe((state, prevState) => {
      const hasPendingDeletes = Object.values(state.tasks).some(t => t.syncState === 'pending_delete');
      const hadPendingDeletes = Object.values(prevState.tasks).some(t => t.syncState === 'pending_delete');
      
      // Immediately sync deletions to prevent resurrection
      if (hasPendingDeletes && !hadPendingDeletes) {
        this.performSync();
      }
    });
  }

  /**
   * Set up columns based on Google Task lists
   */
  private async setupColumns() {
    const unifiedStore = useUnifiedTaskStore.getState();
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    
    if (!activeAccount) {
      return;
    }
    
    const response = await googleTasksService.getTaskLists({ id: activeAccount.id } as any);
    let taskLists = response.data || [];
    
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
        logger.error('[RealtimeSync] Failed to create default task list');
        return;
      }
    }
    
    logger.info('[RealtimeSync] Setting up columns from Google Task lists');
    
    // Create columns for each Google Task list
    for (const taskList of taskLists) {
      const existingColumn = unifiedStore.columns.find(c => c.id === taskList.id);
      
      if (!existingColumn) {
        unifiedStore.addColumn(taskList.id, taskList.title, taskList.id);
        logger.info(`[RealtimeSync] Created column "${taskList.title}" (${taskList.id})`);
      }
    }
    
    // Log final column state
    logger.info('[RealtimeSync] Columns after setup:', {
      columns: unifiedStore.columns.map(c => ({
        id: c.id,
        title: c.title,
        googleTaskListId: c.googleTaskListId,
        taskIdsCount: c.taskIds?.length || 0
      }))
    });
  }

  /**
   * Perform a full synchronization
   */
  async performSync() {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      logger.debug('[RealtimeSync] Sync already in progress, waiting...');
      return this.syncPromise;
    }

    this.isSyncing = true;
    const unifiedStore = useUnifiedTaskStore.getState();
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    
    if (!activeAccount) {
      logger.warn('[RealtimeSync] Cannot sync - not authenticated');
      this.isSyncing = false;
      return;
    }

    unifiedStore.setSyncing(true);
    
    this.syncPromise = this.doSync().finally(() => {
      this.isSyncing = false;
      unifiedStore.setSyncing(false);
      this.syncPromise = null;
    });
    
    return this.syncPromise;
  }

  /**
   * Core sync logic - properly ordered to prevent duplication
   */
  private async doSync() {
    const unifiedStore = useUnifiedTaskStore.getState();
    // Google Tasks API is now accessed directly via googleTasksApi import
    
    try {
      logger.info('[RealtimeSync] Starting sync');
      
      // Phase 0: Ensure columns are set up before any sync operations
      await this.setupColumns();
      
      // Phase 1: Push all pending local changes to Google
      await this.pushLocalChanges();
      
      // Phase 2: Fetch and reconcile Google state
      await this.pullRemoteChanges();
      
      logger.info('[RealtimeSync] Sync completed successfully');
    } catch (error) {
      logger.error('[RealtimeSync] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Push local changes to Google
   */
  private async pushLocalChanges() {
    const unifiedStore = useUnifiedTaskStore.getState();
    // Google Tasks API is now accessed directly via googleTasksApi import
    const pendingTasks = unifiedStore.getPendingTasks();
    
    logger.debug(`[RealtimeSync] Pushing ${pendingTasks.length} pending changes`);
    
    for (const task of pendingTasks) {
      try {
        switch (task.syncState) {
          case 'pending_create':
            await this.createTaskInGoogle(task, unifiedStore);
            break;
            
          case 'pending_update':
            await this.updateTaskInGoogle(task, unifiedStore);
            break;
            
          case 'pending_delete':
            await this.deleteTaskFromGoogle(task, unifiedStore);
            break;
        }
      } catch (error) {
        logger.error(`[RealtimeSync] Failed to sync task ${task.id}:`, error);
        unifiedStore.markTaskSyncError(task.id, String(error));
      }
    }
  }

  /**
   * Create a task in Google
   */
  private async createTaskInGoogle(
    task: UnifiedTask,
    unifiedStore: ReturnType<typeof useUnifiedTaskStore.getState>
  ) {
    if (!task.googleTaskListId) {
      // Find the Google list ID from the column
      const column = unifiedStore.columns.find(c => c.id === task.columnId);
      if (!column?.googleTaskListId) {
        throw new Error('No Google Task List ID for column');
      }
      task.googleTaskListId = column.googleTaskListId;
    }
    
    logger.debug(`[RealtimeSync] Creating task in Google: ${task.title}`);
    
    const response = await googleTasksService.createTask(
      { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
      task.googleTaskListId,
      {
        title: task.title,
        notes: task.notes,
        due: task.due,
      }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create task');
    }
    const googleTask = response.data;
    
    if (googleTask && googleTask.id) {
      unifiedStore.markTaskSynced(task.id, googleTask.id, task.googleTaskListId);
      logger.debug(`[RealtimeSync] Task created in Google with ID: ${googleTask.id}`);
    }
  }

  /**
   * Update a task in Google
   */
  private async updateTaskInGoogle(
    task: UnifiedTask,
    unifiedStore: ReturnType<typeof useUnifiedTaskStore.getState>
  ) {
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
    
    unifiedStore.markTaskSynced(task.id, task.googleTaskId, task.googleTaskListId);
  }

  /**
   * Delete a task from Google
   */
  private async deleteTaskFromGoogle(
    task: UnifiedTask,
    unifiedStore: ReturnType<typeof useUnifiedTaskStore.getState>
  ) {
    if (!task.googleTaskId || !task.googleTaskListId) {
      // Task was never synced, just remove locally
      unifiedStore.deleteTask(task.id);
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
    
    // Now safe to remove from unified store
    const state = unifiedStore.getState();
    const column = state.columns.find(c => c.id === task.columnId);
    if (column) {
      column.taskIds = column.taskIds.filter(id => id !== task.id);
    }
    delete state.tasks[task.id];
    
    logger.debug(`[RealtimeSync] Task deleted from Google and local store`);
  }

  /**
   * Pull remote changes from Google
   */
  private async pullRemoteChanges() {
    const unifiedStore = useUnifiedTaskStore.getState();
    
    logger.debug('[RealtimeSync] Fetching remote changes from Google');
    
    // Process each Google Task list
    for (const column of unifiedStore.columns) {
      if (!column.googleTaskListId) continue;
      
      const response = await googleTasksService.getTasks(
        { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
        column.googleTaskListId
      );
      if (response.success && response.data) {
        await this.reconcileColumnTasks(column, response.data.items || []);
      }
    }
    
    // Clean up tasks that no longer exist in Google
    await this.cleanupDeletedTasks();
  }

  /**
   * Reconcile tasks in a column with Google
   */
  private async reconcileColumnTasks(
    column: { id: string; googleTaskListId?: string },
    googleTasks: GoogleTask[]
  ) {
    const unifiedStore = useUnifiedTaskStore.getState();
    const processedGoogleIds = new Set<string>();
    
    // Reconcile tasks for column
    
    // Filter out tasks marked for deletion locally
    const tasksToProcess = googleTasks.filter(googleTask => {
      if (!googleTask.id) return false;
      processedGoogleIds.add(googleTask.id);
      
      // Check if task is marked for deletion locally
      const deletedTask = Object.values(unifiedStore.tasks).find(
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
        const existingTask = unifiedStore.getTaskByGoogleId(googleTask.id);
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
      unifiedStore.batchUpdateFromGoogle(updates);
    } else {
      logger.debug('[RealtimeSync] No updates needed for this column');
    }
    
    return processedGoogleIds;
  }

  /**
   * Clean up tasks that were deleted on Google
   */
  private async cleanupDeletedTasks() {
    const unifiedStore = useUnifiedTaskStore.getState();
    
    // Clean up deleted tasks
    
    // Build set of all Google task IDs
    const allGoogleTaskIds = new Set<string>();
    for (const column of unifiedStore.columns) {
      if (!column.googleTaskListId) continue;
      
      const response = await googleTasksService.getTasks(
        { id: useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive)?.id } as any,
        column.googleTaskListId
      );
      if (response.success && response.data) {
        (response.data.items || []).forEach(t => {
          if (t.id) allGoogleTaskIds.add(t.id);
        });
        // Process Google tasks
      }
    }
    
    // Find tasks to remove
    
    // Find and remove tasks that no longer exist in Google
    const tasksToRemove = Object.values(unifiedStore.tasks).filter(
      task => task.googleTaskId && 
              !allGoogleTaskIds.has(task.googleTaskId) && 
              task.syncState === 'synced'
    );
    
    // Remove tasks that no longer exist in Google
    
    for (const task of tasksToRemove) {
      // Remove task
      unifiedStore.deleteTask(task.id);
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
      this.performSync();
    }, 5 * 60 * 1000); // 5 minutes
    
    logger.info('[RealtimeSync] Started periodic sync (every 5 minutes)');
  }

  /**
   * Trigger an immediate sync
   */
  async syncNow() {
    logger.info('[RealtimeSync] Manual sync triggered');
    return this.performSync();
  }

  /**
   * Stop the sync service
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
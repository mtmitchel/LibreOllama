/**
 * Simplified sync service for unified task store
 * Replaces the complex kanbanGoogleTasksSync.ts
 */

import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
import { logger } from '../core/lib/logger';
import { googleTasksApi } from '../api/googleTasksApi';
import type { GoogleTask, GoogleTaskList } from '../types/google';

export class UnifiedTaskSync {
  private isSyncing = false;
  
  async syncAll() {
    if (this.isSyncing) {
      logger.warn('[UnifiedSync] Sync already in progress');
      return;
    }
    
    this.isSyncing = true;
    const store = useUnifiedTaskStore.getState();
    store.setSyncing(true);
    
    try {
      // Phase 1: Push pending local changes
      await this.pushPendingChanges();
      
      // Phase 2: Pull updates from Google
      await this.pullGoogleUpdates();
      
      logger.info('[UnifiedSync] Sync completed successfully');
    } catch (error) {
      logger.error('[UnifiedSync] Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      store.setSyncing(false);
    }
  }
  
  private async pushPendingChanges() {
    const store = useUnifiedTaskStore.getState();
    const pendingTasks = store.getPendingTasks();
    
    logger.info('[UnifiedSync] Pushing pending changes', { count: pendingTasks.length });
    
    for (const task of pendingTasks) {
      try {
        switch (task.syncState) {
          case 'pending_create':
            await this.createInGoogle(task);
            break;
            
          case 'pending_update':
            await this.updateInGoogle(task);
            break;
            
          case 'pending_delete':
            await this.deleteInGoogle(task);
            break;
        }
      } catch (error) {
        logger.error('[UnifiedSync] Failed to sync task', { taskId: task.id, error });
        store.updateTask(task.id, {
          syncState: 'error',
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  private async createInGoogle(task: UnifiedTask) {
    const store = useUnifiedTaskStore.getState();
    
    if (!task.googleTaskListId) {
      // Find the Google task list ID from column
      const column = store.columns.find(c => c.id === task.columnId);
      if (!column?.googleTaskListId) {
        throw new Error('No Google task list ID for column');
      }
      task.googleTaskListId = column.googleTaskListId;
    }
    
    const googleTask = await googleTasksApi.createTask(task.googleTaskListId, {
      title: task.title,
      notes: task.notes,
      due: task.due,
      status: task.status,
    });
    
    if (googleTask?.id) {
      store.updateTask(task.id, {
        googleTaskId: googleTask.id,
        syncState: 'synced',
        updated: googleTask.updated,
      });
    }
  }
  
  private async updateInGoogle(task: UnifiedTask) {
    if (!task.googleTaskId || !task.googleTaskListId) {
      throw new Error('Missing Google IDs for update');
    }
    
    const googleTask = await googleTasksApi.updateTask(
      task.googleTaskListId,
      task.googleTaskId,
      {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
      }
    );
    
    if (googleTask) {
      const store = useUnifiedTaskStore.getState();
      store.updateTask(task.id, {
        syncState: 'synced',
        updated: googleTask.updated,
      });
    }
  }
  
  private async deleteInGoogle(task: UnifiedTask) {
    if (!task.googleTaskId || !task.googleTaskListId) {
      // No Google ID, just remove locally
      const store = useUnifiedTaskStore.getState();
      store.deleteTask(task.id);
      return;
    }
    
    await googleTasksApi.deleteTask(task.googleTaskListId, task.googleTaskId);
    
    // Remove from store after successful deletion
    const store = useUnifiedTaskStore.getState();
    store.deleteTask(task.id);
  }
  
  private async pullGoogleUpdates() {
    const store = useUnifiedTaskStore.getState();
    
    // Get all Google task lists
    const taskLists = await googleTasksApi.getTaskLists();
    if (!taskLists) return;
    
    // Ensure columns exist for each task list
    for (const taskList of taskLists) {
      const existingColumn = store.columns.find(
        c => c.googleTaskListId === taskList.id
      );
      
      if (!existingColumn) {
        store.addColumn(taskList.id, taskList.title);
        store.updateColumn(taskList.id, {
          googleTaskListId: taskList.id,
        });
      }
    }
    
    // Pull tasks for each list
    for (const taskList of taskLists) {
      const googleTasks = await googleTasksApi.getTasks(taskList.id);
      if (!googleTasks) continue;
      
      const updates = googleTasks.map(googleTask => ({
        googleTaskId: googleTask.id,
        googleTaskListId: taskList.id,
        data: {
          title: googleTask.title || '',
          notes: googleTask.notes,
          due: googleTask.due,
          status: googleTask.status as 'needsAction' | 'completed',
          position: googleTask.position || '0',
          updated: googleTask.updated,
        },
      }));
      
      store.batchUpdateFromGoogle(updates);
    }
  }
}

// Singleton instance
let syncInstance: UnifiedTaskSync | null = null;

export function getUnifiedTaskSync() {
  if (!syncInstance) {
    syncInstance = new UnifiedTaskSync();
  }
  return syncInstance;
}
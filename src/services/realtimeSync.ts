import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
import { UnifiedTask } from '../stores/unifiedTaskStore.types';
import { logger } from '../core/lib/logger';
import { useSettingsStore } from '../stores/settingsStore';
import { invoke } from '@tauri-apps/api/core';

class RealtimeSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private syncPromise: Promise<void> | null = null;

  async initialize() {
    logger.info('[RealtimeSync] Initializing sync service');
    await this.syncNow();
    this.startPeriodicSync();
  }

  requestSync(delay = 1000) {
    if (this.isSyncing) {
      return;
    }
    setTimeout(() => {
      this.syncNow().catch(err => {
        logger.error('[RealtimeSync] Debounced sync execution failed', err);
      });
    }, delay);
  }

  async syncNow() {
    if (this.isSyncing) {
      return this.syncPromise;
    }

    logger.info('[RealtimeSync] Starting syncNow...');
    this.isSyncing = true;

    this.syncPromise = this.doSync()
      .catch(error => {
        logger.error('[RealtimeSync] Sync failed:', error);
      })
      .finally(() => {
        this.isSyncing = false;
        this.syncPromise = null;
        logger.info('[RealtimeSync] Sync completed');
      });

    return this.syncPromise;
  }

  private async doSync() {
    try {
      logger.info('[RealtimeSync] Starting sync');
      const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
      if (!activeAccount) {
        logger.warn('[RealtimeSync] Cannot sync - not authenticated');
        return;
      }

      const remoteData = await invoke('get_all_task_data', { accountId: activeAccount.id });
      
      logger.debug('[RealtimeSync] Raw backend response:', remoteData);
      
      const { tasks: taskData, columns } = remoteData as { 
        tasks: Record<string, {
          id: string;
          google_task_id: string;
          google_task_list_id: string;
          title: string;
          notes?: string;
          due?: string;
          status: string;
          updated: string;
          position: string;
          priority?: string;
          labels?: string[];
          column_id: string;
        }>, 
        columns: any[] 
      };

      // Convert backend format to UnifiedTask format
      const tasks: Record<string, UnifiedTask> = {};
      
      // First, log a sample task to see the actual structure
      const sampleTaskId = Object.keys(taskData)[0];
      if (sampleTaskId) {
        logger.debug('[RealtimeSync] Sample task from backend:', taskData[sampleTaskId]);
      }
      
      // Check if any tasks have priority set
      const tasksWithPriority = Object.values(taskData).filter(t => t.priority && t.priority !== 'normal');
      logger.debug('[RealtimeSync] Tasks with priority:', tasksWithPriority.length);
      if (tasksWithPriority.length > 0) {
        logger.debug('[RealtimeSync] Sample task with priority:', tasksWithPriority[0]);
      }
      
      for (const [id, task] of Object.entries(taskData)) {
        // Handle potential undefined or null values
        const priority = task.priority || 'normal';
        const labels = Array.isArray(task.labels) ? task.labels : [];
        
        tasks[id] = {
          id: task.id,
          googleTaskId: task.google_task_id,
          googleTaskListId: task.google_task_list_id,
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status as 'needsAction' | 'completed',
          updated: task.updated,
          position: task.position,
          labels: labels,
          priority: priority as 'low' | 'normal' | 'high' | 'urgent',
          columnId: task.column_id,
          syncState: 'synced',
        };
        
        // Log tasks with metadata
        if (labels.length > 0 || priority !== 'normal') {
          logger.debug('[RealtimeSync] Task with metadata', {
            id: task.id,
            title: task.title,
            labels: labels,
            priority: priority,
            rawTask: task // Log the raw task to see what we're getting
          });
        }
      }

      useUnifiedTaskStore.getState().setTasks(tasks);
      useUnifiedTaskStore.getState().setColumns(columns);

      logger.info('[RealtimeSync] Sync completed successfully');
    } catch (error) {
      logger.error('[RealtimeSync] Sync failed:', error);
      throw error;
    }
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      logger.debug('[RealtimeSync] Running periodic sync');
      this.syncNow();
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('[RealtimeSync] Started periodic sync (every 5 minutes)');
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('[RealtimeSync] Sync service stopped');
  }
}

export const realtimeSync = new RealtimeSync();

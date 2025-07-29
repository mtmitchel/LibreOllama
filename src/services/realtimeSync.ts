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
          priority: string;
          labels: string[];
          column_id: string;
        }>, 
        columns: any[] 
      };

      // Convert backend format to UnifiedTask format
      const tasks: Record<string, UnifiedTask> = {};
      for (const [id, task] of Object.entries(taskData)) {
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
          labels: task.labels,
          priority: task.priority as 'low' | 'normal' | 'high' | 'urgent',
          columnId: task.column_id,
          syncState: 'synced',
        };
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

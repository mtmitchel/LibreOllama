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
      
      // Debug completed tasks
      const allTasks = (remoteData as any).tasks;
      const taskArray = Object.values(allTasks || {});
      const completedCount = taskArray.filter((t: any) => t.status === 'completed').length;
      console.log('🔍 [RealtimeSync] Total tasks from backend:', taskArray.length);
      console.log('🔍 [RealtimeSync] Completed tasks from backend:', completedCount);
      console.log('🔍 [RealtimeSync] Sample task statuses:', taskArray.slice(0, 5).map((t: any) => ({ 
        title: t.title, 
        status: t.status,
        google_task_id: t.google_task_id
      })));
      
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
          time_block?: {
            start_time: string;
            end_time: string;
          };
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
      
      // Log tasks with due dates to debug timezone issues
      const tasksWithDueDates = Object.values(taskData).filter(t => t.due);
      if (tasksWithDueDates.length > 0) {
        const tzTestTasks = tasksWithDueDates.filter(t => t.title.includes('TZTEST'));
        if (tzTestTasks.length > 0) {
          logger.info('🔴 TIMEZONE DEBUG - Tasks from backend:', tzTestTasks.map(t => ({
          title: t.title,
          due: t.due,
          dueType: typeof t.due
        })));
        }
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
        const timeBlock = task.time_block ? {
          startTime: task.time_block.start_time,
          endTime: task.time_block.end_time
        } : undefined;
        
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
          timeBlock: timeBlock,
          syncState: 'synced',
        };
        
        // Log tasks with metadata
        if (labels.length > 0 || priority !== 'normal' || task.time_block) {
          logger.debug('[RealtimeSync] Task with metadata', {
            id: task.id,
            title: task.title,
            labels: labels,
            priority: priority,
            timeBlock: task.time_block,
            rawTask: task // Log the raw task to see what we're getting
          });
        }
        
        // Debug log for TZTEST tasks
        if (task.title.includes('TZTEST')) {
          logger.info('🔵 TIMEBLOCK DEBUG - TZTEST task from backend:', {
            id: task.id,
            title: task.title,
            time_block: task.time_block,
            rawTask: task
          });
        }
      }

      useUnifiedTaskStore.getState().setTasks(tasks);
      useUnifiedTaskStore.getState().setColumns(columns);
      
      // Debug: Check what's in the store after sync
      const storeState = useUnifiedTaskStore.getState();
      const storeTasks = Object.values(storeState.tasks);
      const storeCompletedCount = storeTasks.filter(t => t.status === 'completed').length;
      console.log('🔍 [RealtimeSync] After sync - Total tasks in store:', storeTasks.length);
      console.log('🔍 [RealtimeSync] After sync - Completed tasks in store:', storeCompletedCount);
      console.log('🔍 [RealtimeSync] After sync - showCompleted state:', storeState.showCompleted);

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

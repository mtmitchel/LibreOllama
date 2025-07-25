import { useKanbanStore } from '../stores/useKanbanStore';
import { useGoogleTasksStore } from '../stores/googleTasksStore';
import { GoogleTask, GoogleTaskList } from '../types/google';
import { KanbanTask, KanbanColumn } from '../stores/useKanbanStore';
import { logger } from '../core/lib/logger';

interface SyncMapping {
  kanbanColumnId: string;
  googleTaskListId: string;
}

class KanbanGoogleTasksSync {
  private syncMappings: SyncMapping[] = [];
  private isSyncing = false;
  private syncedTaskIds = new Set<string>();

  constructor() {
    this.loadMappings();
  }

  private loadMappings() {
    const stored = localStorage.getItem('kanban-google-sync-mappings');
    if (stored) {
      this.syncMappings = JSON.parse(stored);
    }
  }

  private saveMappings() {
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify(this.syncMappings));
  }

  // Create Kanban columns based on Google Task lists
  async setupColumnMappings() {
    const kanbanStore = useKanbanStore.getState();
    const googleStore = useGoogleTasksStore.getState();

    if (!googleStore.isAuthenticated || googleStore.taskLists.length === 0) {
      logger.warn('[SYNC] Google Tasks not authenticated or no task lists');
      return;
    }

    // Clear existing mappings and columns
    this.syncMappings = [];
    
    // Clear existing hardcoded columns
    kanbanStore.clearAllData();

    // Create Kanban columns for each Google Task list
    for (const taskList of googleStore.taskLists) {
      // Create a safe column ID from the task list title
      const columnId = taskList.id || taskList.title.toLowerCase().replace(/\s+/g, '-');
      
      // Add column to Kanban board
      kanbanStore.addColumn(columnId, taskList.title);
      
      // Create mapping
      this.syncMappings.push({
        kanbanColumnId: columnId,
        googleTaskListId: taskList.id
      });
      
      logger.info(`[SYNC] Created Kanban column "${taskList.title}" for Google Task list`);
    }

    this.saveMappings();
    logger.info('[SYNC] Column mappings established:', this.syncMappings);
  }

  // Convert Kanban task to Google Task format
  private kanbanToGoogleTask(kanbanTask: KanbanTask): Partial<GoogleTask> {
    return {
      title: kanbanTask.title,
      notes: kanbanTask.notes,
      due: kanbanTask.due,
      status: kanbanTask.status,
      position: kanbanTask.position,
    };
  }

  // Convert Google Task to Kanban task format
  private googleToKanbanTask(googleTask: GoogleTask): Partial<KanbanTask> {
    return {
      title: googleTask.title,
      notes: googleTask.notes,
      due: googleTask.due,
      status: googleTask.status,
      position: googleTask.position || '0',
      updated: googleTask.updated,
    };
  }

  // Sync all tasks between Kanban and Google Tasks
  async syncAll() {
    if (this.isSyncing) {
      logger.warn('[SYNC] Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.syncedTaskIds.clear();

    try {
      const kanbanStore = useKanbanStore.getState();
      const googleStore = useGoogleTasksStore.getState();

      if (!googleStore.isAuthenticated) {
        logger.warn('[SYNC] Google Tasks not authenticated');
        return;
      }

      // Ensure mappings are set up
      if (this.syncMappings.length === 0) {
        await this.setupColumnMappings();
      }

      // Sync each mapped column
      for (const mapping of this.syncMappings) {
        await this.syncColumn(mapping);
      }

      logger.info('[SYNC] Sync completed successfully');
    } catch (error) {
      logger.error('[SYNC] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single column with its mapped Google Task list
  private async syncColumn(mapping: SyncMapping) {
    const kanbanStore = useKanbanStore.getState();
    const googleStore = useGoogleTasksStore.getState();

    const column = kanbanStore.columns.find(c => c.id === mapping.kanbanColumnId);
    if (!column) return;

    const googleTasks = googleStore.tasks[mapping.googleTaskListId] || [];

    // Track Google task IDs we've seen
    const googleTaskIds = new Set(googleTasks.map(t => t.id));
    
    // Track Kanban task IDs that map to Google tasks
    const kanbanTasksToKeep = new Set<string>();

    // Sync Google Tasks to Kanban
    for (const googleTask of googleTasks) {
      if (this.syncedTaskIds.has(googleTask.id)) {
        // Find the existing Kanban task by stored Google ID
        const existingKanbanTask = column.tasks.find(t => 
          t.metadata?.googleTaskId === googleTask.id
        );
        if (existingKanbanTask) {
          kanbanTasksToKeep.add(existingKanbanTask.id);
        }
        continue;
      }

      // Check if we already have this task in Kanban (by Google ID)
      const existingKanbanTask = column.tasks.find(
        t => t.metadata?.googleTaskId === googleTask.id
      );

      if (!existingKanbanTask) {
        // Create in Kanban with Google Task ID reference
        try {
          const newTask = await kanbanStore.createTask(column.id, {
            title: googleTask.title,
            notes: googleTask.notes,
            due: googleTask.due,
            metadata: {
              labels: [],
              priority: 'normal' as const,
              subtasks: [],
              googleTaskId: googleTask.id,
              lastGoogleSync: new Date().toISOString()
            }
          });
          this.syncedTaskIds.add(googleTask.id);
          kanbanTasksToKeep.add(newTask.id);
          logger.debug(`[SYNC] Created Kanban task from Google: ${googleTask.title}`);
        } catch (error) {
          logger.error(`[SYNC] Failed to create Kanban task:`, error);
        }
      } else {
        this.syncedTaskIds.add(googleTask.id);
        kanbanTasksToKeep.add(existingKanbanTask.id);
        
        // Update if Google Task is newer
        if (new Date(googleTask.updated) > new Date(existingKanbanTask.updated)) {
          await kanbanStore.updateTask(column.id, existingKanbanTask.id, {
            ...this.googleToKanbanTask(googleTask),
            metadata: {
              labels: existingKanbanTask.metadata?.labels || [],
              priority: existingKanbanTask.metadata?.priority || 'normal',
              subtasks: existingKanbanTask.metadata?.subtasks || [],
              recurring: existingKanbanTask.metadata?.recurring,
              googleTaskId: googleTask.id,
              lastGoogleSync: new Date().toISOString()
            }
          });
          logger.debug(`[SYNC] Updated Kanban task from Google: ${googleTask.title}`);
        }
      }
    }

    // Remove Kanban tasks that no longer exist in Google
    const tasksToRemove = column.tasks.filter(t => 
      t.metadata?.googleTaskId && 
      !googleTaskIds.has(t.metadata.googleTaskId) &&
      !kanbanTasksToKeep.has(t.id)
    );

    for (const taskToRemove of tasksToRemove) {
      await kanbanStore.deleteTask(column.id, taskToRemove.id);
      logger.debug(`[SYNC] Removed Kanban task that no longer exists in Google: ${taskToRemove.title}`);
    }

    // Don't create new Google tasks from Kanban - only update existing ones
    // This prevents duplication since Google Tasks is the source of truth
    for (const kanbanTask of column.tasks) {
      if (kanbanTask.metadata?.googleTaskId) {
        const existingGoogleTask = googleTasks.find(
          t => t.id === kanbanTask.metadata?.googleTaskId
        );

        if (existingGoogleTask && new Date(kanbanTask.updated) > new Date(existingGoogleTask.updated)) {
          // Update Google Task if Kanban is newer
          await googleStore.updateTask(
            mapping.googleTaskListId,
            existingGoogleTask.id,
            this.kanbanToGoogleTask(kanbanTask)
          );
          logger.debug(`[SYNC] Updated Google task from Kanban: ${kanbanTask.title}`);
        }
      }
    }
  }

  // Get Google Task list ID for a Kanban column
  getGoogleListId(kanbanColumnId: string): string | null {
    const mapping = this.syncMappings.find(m => m.kanbanColumnId === kanbanColumnId);
    return mapping?.googleTaskListId || null;
  }

  // Get Kanban column ID for a Google Task list
  getKanbanColumnId(googleListId: string): string | null {
    const mapping = this.syncMappings.find(m => m.googleTaskListId === googleListId);
    return mapping?.kanbanColumnId || null;
  }
}

// Singleton instance
export const kanbanGoogleSync = new KanbanGoogleTasksSync();

// Auto-sync setup - sync every 5 minutes
export function setupAutoSync() {
  const googleStore = useGoogleTasksStore.getState();
  
  // Initial sync when Google Tasks are loaded
  useGoogleTasksStore.subscribe((state, prevState) => {
    if (state.isAuthenticated && !prevState.isAuthenticated) {
      kanbanGoogleSync.syncAll();
    }
    
    // Setup column mappings when task lists change
    if (state.taskLists.length !== prevState.taskLists.length) {
      kanbanGoogleSync.setupColumnMappings();
    }
  });

  // Set up periodic sync every 5 minutes
  let syncInterval: NodeJS.Timeout | null = null;
  
  useGoogleTasksStore.subscribe((state) => {
    if (state.isAuthenticated && state.taskLists.length > 0) {
      // Clear existing interval if any
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      
      // Set up new interval for 5 minutes (300000 ms)
      syncInterval = setInterval(() => {
        logger.info('[SYNC] Running periodic sync (5 minutes)');
        kanbanGoogleSync.syncAll();
      }, 300000); // 5 minutes
      
      // Store interval ID for cleanup
      (window as any).kanbanSyncInterval = syncInterval;
    } else {
      // Clear interval if not authenticated
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    }
  });
  
  // Clean up on window unload
  window.addEventListener('beforeunload', () => {
    if ((window as any).kanbanSyncInterval) {
      clearInterval((window as any).kanbanSyncInterval);
    }
  });
}
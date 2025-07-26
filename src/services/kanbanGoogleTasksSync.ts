import { useKanbanStore } from '../stores/useKanbanStore';
import { useGoogleTasksStore } from '../stores/googleTasksStore';
import { useTaskMetadataStore } from '../stores/taskMetadataStore';
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

    // Clear existing mappings but preserve columns with tasks
    this.syncMappings = [];
    
    // Don't clear all data - preserve existing tasks
    // kanbanStore.clearAllData(); // REMOVED - this was destroying everything!

    // Get existing columns to preserve
    const existingColumns = kanbanStore.columns;
    const existingColumnIds = new Set(existingColumns.map(c => c.id));
    
    // Check for old hardcoded columns with tasks that need migration
    const oldColumns = existingColumns.filter(
      c => (c.id === 'todo' || c.id === 'in-progress' || c.id === 'done') && c.tasks.length > 0
    );
    
    if (oldColumns.length > 0) {
      logger.info('[SYNC] Found old columns with tasks, will migrate to first Google list');
    }
    
    // Create Kanban columns for each Google Task list
    for (const taskList of googleStore.taskLists) {
      // Use Google Task List ID as column ID for consistent mapping
      const columnId = taskList.id;
      
      // Only add column if it doesn't already exist
      if (!existingColumnIds.has(columnId)) {
        kanbanStore.addColumn(columnId, taskList.title);
        logger.info(`[SYNC] Created Kanban column "${taskList.title}" for Google Task list`);
      } else {
        logger.info(`[SYNC] Column already exists for "${taskList.title}"`);
      }
      
      // Always create mapping
      this.syncMappings.push({
        kanbanColumnId: columnId,
        googleTaskListId: taskList.id
      });
    }

    this.saveMappings();
    logger.info('[SYNC] Column mappings established:', this.syncMappings);
    
    // Migrate tasks from old hardcoded columns to first Google list
    if (oldColumns.length > 0 && googleStore.taskLists.length > 0) {
      const firstGoogleList = googleStore.taskLists[0];
      const firstColumnId = firstGoogleList.id;
      
      for (const oldColumn of oldColumns) {
        logger.info(`[SYNC] Migrating ${oldColumn.tasks.length} tasks from old column "${oldColumn.id}" to Google list "${firstGoogleList.title}"`);
        
        // Move tasks to the first Google column
        for (const task of oldColumn.tasks) {
          // Create in Google Tasks
          try {
            const googleTask = await googleStore.createTask(firstGoogleList.id, {
              title: task.title,
              notes: task.notes,
              due: task.due,
              status: task.status
            });
            
            // Update task with Google ID
            if (googleTask) {
              task.metadata = {
                ...task.metadata,
                googleTaskId: googleTask.id
              };
              
              // Preserve metadata
              if (task.metadata) {
                const { setTaskMetadata } = useTaskMetadataStore.getState();
                setTaskMetadata(googleTask.id, task.metadata);
              }
            }
          } catch (error) {
            logger.error('[SYNC] Failed to migrate task to Google:', error);
          }
        }
        
        // Remove the old column
        kanbanStore.columns = kanbanStore.columns.filter(c => c.id !== oldColumn.id);
      }
      
      // Force a sync to get the migrated tasks
      await this.syncAll();
    }
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
          console.log('=== SYNC: CREATING NEW TASK ===');
          console.log('Google Task ID:', googleTask.id);
          
          // Get metadata from separate store
          const metadataFromStore = useTaskMetadataStore.getState().getTaskMetadata(googleTask.id);
          console.log('Metadata from store:', metadataFromStore);
          
          const newTask = await kanbanStore.createTask(column.id, {
            title: googleTask.title,
            notes: googleTask.notes,
            due: googleTask.due,
            metadata: {
              labels: metadataFromStore?.labels || [],
              priority: metadataFromStore?.priority || 'normal' as const,
              subtasks: metadataFromStore?.subtasks || [],
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
          console.log('=== SYNC: UPDATING EXISTING TASK ===');
          console.log('Google Task ID:', googleTask.id);
          
          // Get metadata from separate store
          const metadataFromStore = useTaskMetadataStore.getState().getTaskMetadata(googleTask.id);
          console.log('Metadata from store:', metadataFromStore);
          
          await kanbanStore.updateTask(column.id, existingKanbanTask.id, {
            ...this.googleToKanbanTask(googleTask),
            metadata: {
              labels: metadataFromStore?.labels || existingKanbanTask.metadata?.labels || [],
              priority: metadataFromStore?.priority || existingKanbanTask.metadata?.priority || 'normal',
              subtasks: metadataFromStore?.subtasks || existingKanbanTask.metadata?.subtasks || [],
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
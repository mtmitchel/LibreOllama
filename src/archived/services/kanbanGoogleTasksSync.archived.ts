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
    const { setTaskMetadata, getTaskMetadata, deleteTaskMetadata } = useTaskMetadataStore.getState();

    const column = kanbanStore.columns.find(c => c.id === mapping.kanbanColumnId);
    if (!column) {
      logger.warn(`[SYNC] Kanban column not found for mapping:`, mapping);
      return;
    }

    const googleTasks = googleStore.tasks[mapping.googleTaskListId] || [];
    const localTasks = [...column.tasks]; // Create a mutable copy for tracking
    const processedLocalTaskIds = new Set<string>();

    // First pass: Match and sync existing tasks from Google
    for (const googleTask of googleTasks) {
      if (!googleTask.id) continue;

      const metadata = getTaskMetadata(googleTask.id);
      if (metadata?.deleted) {
        logger.debug(`[SYNC] Skipping deleted task: ${googleTask.title}`);
        continue;
      }

      // Try to find task by Google ID first (already synced tasks)
      const existingTaskIndex = localTasks.findIndex(t => t.googleTaskId === googleTask.id);
      
      if (existingTaskIndex !== -1) {
        // Found existing synced task
        const localTask = localTasks[existingTaskIndex];
        processedLocalTaskIds.add(localTask.id);
        
        // Update if Google version is newer
        if (new Date(googleTask.updated) > new Date(localTask.updated)) {
          logger.debug(`[SYNC] Updating local task from Google: ${googleTask.title}`);
          await kanbanStore.updateTask(column.id, localTask.id, this.googleToKanbanTask(googleTask));
          setTaskMetadata(googleTask.id, {
            lastGoogleSync: new Date().toISOString(),
          });
        }
      } else {
        // No direct match by Google ID. Try to find potential match by title among unsynced tasks
        const potentialMatchIndex = localTasks.findIndex(
          t => !t.googleTaskId && t.title === googleTask.title && !processedLocalTaskIds.has(t.id)
        );
        
        if (potentialMatchIndex !== -1) {
          // Found potential match - link them instead of creating duplicate
          const localTask = localTasks[potentialMatchIndex];
          processedLocalTaskIds.add(localTask.id);
          
          logger.debug(`[SYNC] Linking unsynced local task with Google task: ${googleTask.title}`);
          await kanbanStore.updateTask(column.id, localTask.id, {
            googleTaskId: googleTask.id,
            ...this.googleToKanbanTask(googleTask)
          });
          
          // Migrate metadata if exists
          const oldMetadata = getTaskMetadata(localTask.id);
          if (oldMetadata) {
            setTaskMetadata(googleTask.id, oldMetadata);
            deleteTaskMetadata(localTask.id);
          } else {
            setTaskMetadata(googleTask.id, {
              lastGoogleSync: new Date().toISOString(),
            });
          }
        } else {
          // No match found - this is genuinely new from another client
          logger.debug(`[SYNC] Creating new local task from Google: ${googleTask.title}`);
          await kanbanStore.createTask(column.id, {
            ...this.googleToKanbanTask(googleTask),
            googleTaskId: googleTask.id,
          });
          setTaskMetadata(googleTask.id, {
            lastGoogleSync: new Date().toISOString(),
          });
        }
      }
    }

    // Second pass: Upload any remaining local-only tasks to Google
    for (const localTask of column.tasks) {
      if (!localTask.googleTaskId && !processedLocalTaskIds.has(localTask.id)) {
        logger.debug(`[SYNC] Creating Google task for local-only task: ${localTask.title}`);
        try {
          const newGoogleTask = await googleStore.createTask(mapping.googleTaskListId, {
            title: localTask.title,
            notes: localTask.notes,
            due: localTask.due,
          });

          if (newGoogleTask && newGoogleTask.id) {
            // Update local task with Google ID
            await kanbanStore.updateTask(column.id, localTask.id, {
              googleTaskId: newGoogleTask.id,
              updated: newGoogleTask.updated,
            });

            // Migrate metadata from temp ID to Google ID
            const oldMetadata = getTaskMetadata(localTask.id);
            if (oldMetadata) {
              setTaskMetadata(newGoogleTask.id, oldMetadata);
              deleteTaskMetadata(localTask.id);
            } else {
              setTaskMetadata(newGoogleTask.id, {
                lastGoogleSync: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          logger.error(`[SYNC] Failed to create Google task for ${localTask.title}:`, error);
        }
      }
    }

    // Third pass: Remove tasks that were deleted on Google's side
    const googleTaskIds = new Set(googleTasks.map(t => t.id));
    const tasksToRemove = column.tasks.filter(
      t => t.googleTaskId && !googleTaskIds.has(t.googleTaskId)
    );

    for (const taskToRemove of tasksToRemove) {
      logger.debug(`[SYNC] Removing local task deleted from Google: ${taskToRemove.title}`);
      await kanbanStore.deleteTask(column.id, taskToRemove.id);
      deleteTaskMetadata(taskToRemove.googleTaskId!);
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

// Auto-sync setup - DEPRECATED: Use realtimeSync service instead
export function setupAutoSync() {
  // This function is deprecated and replaced by the realtimeSync service
  // The UnifiedStoreMigration component will handle the transition
  logger.warn('[SYNC] setupAutoSync is deprecated - use realtimeSync service');
}
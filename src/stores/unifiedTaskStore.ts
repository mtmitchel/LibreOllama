import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  UnifiedTask, 
  UnifiedTaskState, 
  CreateTaskInput, 
  UpdateTaskInput,
  TaskColumn,
  TaskSyncState 
} from './unifiedTaskStore.types';
import { logger } from '../core/lib/logger';
import { realtimeSync } from '../services/realtimeSync';

interface UnifiedTaskActions {
  // Task CRUD operations
  createTask: (input: CreateTaskInput) => string; // Returns stable task ID
  updateTask: (taskId: string, updates: UpdateTaskInput) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, targetIndex?: number) => void;
  
  // Sync operations
  markTaskSynced: (taskId: string, googleTaskId: string, googleTaskListId: string) => void;
  markTaskSyncError: (taskId: string, error: string) => void;
  rollbackTask: (taskId: string) => void;
  
  // Batch operations for sync
  batchUpdateFromGoogle: (googleTasks: Array<{
    googleTaskId: string;
    googleTaskListId: string;
    data: Partial<UnifiedTask>;
  }>) => void;
  
  // Column operations
  addColumn: (id: string, title: string, googleTaskListId?: string) => void;
  updateColumn: (columnId: string, updates: Partial<TaskColumn>) => void;
  deleteColumn: (columnId: string) => void;
  purgeTasksByIds: (taskIds: string[]) => void; // For remote deletions
  
  // Query helpers
  getTasksByColumn: (columnId: string) => UnifiedTask[];
  getTaskByGoogleId: (googleTaskId: string) => UnifiedTask | undefined;
  getPendingTasks: () => UnifiedTask[];
  
  // Sync state
  setSyncing: (isSyncing: boolean) => void;
  clearSyncErrors: () => void;
  
}

type UnifiedTaskStore = UnifiedTaskState & UnifiedTaskActions;

const generateTaskId = () => `local-task-${uuidv4()}`;

export const useUnifiedTaskStore = create<UnifiedTaskStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tasks: {},
        columns: [],
        isSyncing: false,
        syncErrors: {},
        
        // Create a new task
        createTask: (input) => {
          const taskId = generateTaskId();
          const now = new Date().toISOString();

          // Get the column to correctly assign googleTaskListId at creation time
          const state = get();
          const column = state.columns.find(c => c.id === input.columnId);
          const googleTaskListId = column?.googleTaskListId;
          
          const newTask: UnifiedTask = {
            id: taskId,
            title: input.title,
            status: 'needsAction',
            updated: now,
            position: '0',
            labels: input.labels || [],
            priority: input.priority || 'normal',
            notes: input.notes || '',
            due: input.due,
            columnId: input.columnId,
            syncState: 'pending_create',
            lastLocalUpdate: now,            
            googleTaskListId: googleTaskListId, // Set from the column
            lastSyncTime: undefined,
          };
          
          set(state => {
            state.tasks[taskId] = newTask;
            
            // Add to column
            const column = state.columns.find(c => c.id === input.columnId);
            if (column) {
              column.taskIds.push(taskId);
            }
          });
          
          logger.info('[UnifiedStore] Created task', { 
            taskId, 
            title: input.title, 
            googleTaskListId: newTask.googleTaskListId,
            syncState: newTask.syncState,
            columnId: input.columnId,
            columnGoogleTaskListId: column?.googleTaskListId
          });
          
          // Reliably trigger a sync if this task is meant for Google.
          if (newTask.googleTaskListId) {
            logger.info('[UnifiedStore] Triggering sync for task with googleTaskListId:', newTask.googleTaskListId);
            realtimeSync.requestSync();
          } else {
            logger.warn('[UnifiedStore] Task created without googleTaskListId, sync will not be triggered');
          }
          
          return taskId;
        },
        
        // Update an existing task
        updateTask: (taskId, updates) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) {
              logger.warn('[UnifiedStore] Task not found for update', { taskId });
              return;
            }
            
            // Store previous state for potential rollback
            task.previousState = { ...task };
            
            // Apply updates
            Object.assign(task, updates);
            task.lastLocalUpdate = new Date().toISOString();
            
            // Update sync state if needed
            if (task.syncState === 'synced' && !updates.syncState) {
              task.syncState = 'pending_update';
            }
            
            // Handle column moves
            if (updates.columnId && updates.columnId !== task.previousState.columnId) {
              // Remove from old column
              const oldColumn = state.columns.find(c => c.id === task.previousState.columnId);
              if (oldColumn) {
                oldColumn.taskIds = oldColumn.taskIds.filter(id => id !== taskId);
              }
              
              // Add to new column
              const newColumn = state.columns.find(c => c.id === updates.columnId);
              if (newColumn) {
                newColumn.taskIds.push(taskId);
              }
            }
          });
          
          logger.debug('[UnifiedStore] Updated task', { taskId, updates });

          // Trigger sync if the task was modified and needs it
          const task = get().tasks[taskId];
          if (task?.syncState === 'pending_update') {
            realtimeSync.requestSync();
          }
        },
        
        // Delete a task (optimistic with sync)
        deleteTask: (taskId) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) {
              logger.warn('[UnifiedStore] Attempted to delete non-existent task', { taskId });
              return;
            }
            
            if (task.googleTaskId) {
              // Mark for deletion instead of immediate removal
              task.syncState = 'pending_delete';
              task.optimisticDelete = true;
            } else {
              // No Google ID, safe to delete immediately
              // Delete local-only task
              delete state.tasks[taskId];
              
              // Remove from column
              const column = state.columns.find(c => c.id === task.columnId);
              if (column) {
                column.taskIds = column.taskIds.filter(id => id !== taskId);
              }
            }
          });
          
          // Trigger sync if a task was marked for deletion
          const task = get().tasks[taskId];
          // Task will still exist if it was marked for deletion
          if (task?.syncState === 'pending_delete') {
            realtimeSync.requestSync();
          }
        },
        
        // Move task between columns or reorder
        moveTask: (taskId, targetColumnId, targetIndex) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) return;
            
            const sourceColumn = state.columns.find(c => c.id === task.columnId);
            const targetColumn = state.columns.find(c => c.id === targetColumnId);
            
            if (!sourceColumn || !targetColumn) return;
            
            // Store previous state for sync to detect column/list changes
            task.previousState = { ...task };
            
            // Remove from source
            sourceColumn.taskIds = sourceColumn.taskIds.filter(id => id !== taskId);
            
            // Add to target
            if (targetIndex !== undefined && targetIndex >= 0) {
              targetColumn.taskIds.splice(targetIndex, 0, taskId);
            } else {
              targetColumn.taskIds.push(taskId);
            }
            
            // Update task
            task.columnId = targetColumnId;
            task.googleTaskListId = targetColumn.googleTaskListId;
            task.lastLocalUpdate = new Date().toISOString();
            
            if (task.syncState === 'synced') {
              task.syncState = 'pending_update';
            }
          });
          
          logger.debug('[UnifiedStore] Moved task', { taskId, targetColumnId, targetIndex });

          // Moving a task always requires a sync
          realtimeSync.requestSync();
        },
        
        // Mark task as synced with Google
        markTaskSynced: (taskId, googleTaskId, googleTaskListId) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) return;
            
            task.googleTaskId = googleTaskId;
            task.googleTaskListId = googleTaskListId;
            task.syncState = 'synced';
            task.lastSyncError = undefined;
            delete task.previousState;
            task.lastSyncTime = new Date().toISOString();
            
            // Clear any sync errors
            delete state.syncErrors[taskId];
          });
          
          logger.debug('[UnifiedStore] Task synced', { taskId, googleTaskId });
        },
        
        // Mark sync error
        markTaskSyncError: (taskId, error) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) return;
            
            // If it was a failed deletion, make it visible again so the user knows.
            if (task.optimisticDelete) {
              task.optimisticDelete = false;
              logger.warn('[UnifiedStore] Rolling back optimistic delete due to sync error', { taskId });
            }

            task.syncState = 'error';
            task.lastSyncError = error;
            state.syncErrors[taskId] = error;
          });
          
          logger.error('[UnifiedStore] Task sync error', { taskId, error });
        },
        
        // Rollback task to previous state
        rollbackTask: (taskId) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task || !task.previousState) return;
            
            // Restore previous state
            Object.assign(task, task.previousState);
            delete task.previousState;
            task.syncState = 'synced';
          });
          
          logger.debug('[UnifiedStore] Rolled back task', { taskId });
        },
        
        // Batch update from Google sync
        batchUpdateFromGoogle: (updates) => {
          set(state => {
            let created = 0, updated = 0, skipped = 0;
            
            // Batch update from Google
            
            for (const update of updates) {
              // Find task by Google ID
              const existingTask = Object.values(state.tasks).find(
                t => t.googleTaskId === update.googleTaskId
              );
              
              if (existingTask) {
                // Update existing task - but preserve pending state if task is waiting to sync
                const shouldPreservePendingState = existingTask.syncState === 'pending_create' || 
                                                  existingTask.syncState === 'pending_update' ||
                                                  existingTask.syncState === 'pending_delete';
                
                // Check if task has moved to a different list
                if (existingTask.googleTaskListId !== update.googleTaskListId) {
                  logger.info(`[UnifiedStore] Task moved from list ${existingTask.googleTaskListId} to ${update.googleTaskListId}`);
                  
                  // Find the new column for this task
                  const newColumn = state.columns.find(c => c.googleTaskListId === update.googleTaskListId);
                  const oldColumn = state.columns.find(c => c.id === existingTask.columnId);
                  
                  if (newColumn && oldColumn) {
                    // Remove from old column
                    oldColumn.taskIds = oldColumn.taskIds.filter(id => id !== existingTask.id);
                    
                    // Add to new column
                    if (!newColumn.taskIds.includes(existingTask.id)) {
                      newColumn.taskIds.push(existingTask.id);
                    }
                    
                    // Update task's column references
                    existingTask.columnId = newColumn.id;
                    existingTask.googleTaskListId = update.googleTaskListId;
                    
                    logger.info(`[UnifiedStore] Moved task "${existingTask.title}" from "${oldColumn.title}" to "${newColumn.title}"`);
                  }
                }
                
                // Only update Google-specific fields, preserve custom metadata
                existingTask.title = update.data.title || existingTask.title;
                existingTask.notes = update.data.notes;
                existingTask.due = update.data.due;
                existingTask.status = update.data.status || existingTask.status;
                existingTask.position = update.data.position || existingTask.position;
                // Preserve labels, priority, attachments, and other custom fields
                
                // Only mark as synced if it wasn't pending
                if (!shouldPreservePendingState) {
                  existingTask.syncState = 'synced';
                }
                
                existingTask.updated = update.data.updated || new Date().toISOString();
                existingTask.lastSyncTime = new Date().toISOString();
                updated++;
              } else {
                // Create new task from Google - use Google ID as primary ID
                // Create new task from Google
                logger.debug('[UnifiedStore] Looking for column with googleTaskListId:', update.googleTaskListId);
                logger.debug('[UnifiedStore] Available columns:', state.columns.map(c => ({
                  id: c.id,
                  title: c.title,
                  googleTaskListId: c.googleTaskListId
                })));
                
                const column = state.columns.find(
                  c => c.googleTaskListId === update.googleTaskListId
                );
                
                if (column) {
                  // FIX: Generate a stable local ID, per architecture design
                  const taskId = generateTaskId();
                  const newTask: UnifiedTask = {
                    id: taskId,  // Use new stable local ID
                    googleTaskId: update.googleTaskId,
                    googleTaskListId: update.googleTaskListId,
                    columnId: column.id,
                    lastSyncTime: new Date().toISOString(),
                    syncState: 'synced',
                    labels: [],
                    priority: 'normal',
                    position: '0',
                    updated: new Date().toISOString(),
                    title: '',
                    status: 'needsAction',
                    ...update.data,
                  };
                  
                  state.tasks[taskId] = newTask;
                  
                  // Ensure taskId is added to column's taskIds array
                  if (!column.taskIds.includes(taskId)) {
                    column.taskIds.push(taskId);
                    logger.debug(`[UnifiedStore] Added task ${taskId} to column ${column.id} (${column.title})`);
                  }
                  created++;
                  
                  // Verify task was actually created
                  logger.info(`[UnifiedStore] Task created: "${newTask.title}" in column "${column.title}" (${column.id})`);
                } else {
                  skipped++;
                  logger.error(`[UnifiedStore] CRITICAL: No column found for googleTaskListId: ${update.googleTaskListId}`, {
                    availableColumns: state.columns.map(c => ({
                      id: c.id,
                      title: c.title,
                      googleTaskListId: c.googleTaskListId
                    }))
                  });
                }
              }
            }
            
            logger.info('[UnifiedStore] Batch update complete', { 
              total: updates.length, 
              created, 
              updated, 
              skipped,
              totalTasks: Object.keys(state.tasks).length,
              columns: state.columns.map(c => ({ id: c.id, title: c.title, tasks: c.taskIds.length }))
            });
          });
        },
        
        // Column operations
        addColumn: (id, title, googleTaskListId) => {
          set(state => {
            const newColumn: TaskColumn = {
              id,
              title,
              googleTaskListId,
              taskIds: [],
            };
            state.columns.push(newColumn);
          });
          
          logger.debug('[UnifiedStore] Added column', { id, title, googleTaskListId });
        },
        
        updateColumn: (columnId, updates) => {
          set(state => {
            const column = state.columns.find(c => c.id === columnId);
            if (column) {
              Object.assign(column, updates);
              logger.debug('[UnifiedStore] Updated column', { columnId, updates });
            } else {
              logger.warn('[UnifiedStore] Column not found for update', { columnId, updates });
            }
          });
        },
        
        deleteColumn: (columnId) => {
          set(state => {
            // Remove column
            state.columns = state.columns.filter(c => c.id !== columnId);
            
            // Delete all tasks in column
            Object.values(state.tasks)
              .filter(t => t.columnId === columnId)
              .forEach(task => {
                delete state.tasks[task.id];
              });
          });
          
          logger.debug('[UnifiedStore] Deleted column', { columnId });
        },
        
        // New action to handle tasks deleted on Google's side
        purgeTasksByIds: (taskIds: string[]) => {
          set(state => {
            const tasksToDelete = new Set(taskIds);
            const columnsToUpdate: Record<string, boolean> = {};

            // Identify which columns are affected
            taskIds.forEach(id => {
              const task = state.tasks[id];
              if (task) {
                columnsToUpdate[task.columnId] = true;
              }
            });

            // Remove the tasks from the main tasks object
            state.tasks = Object.fromEntries(
              Object.entries(state.tasks).filter(([id]) => !tasksToDelete.has(id))
            );

            // Clean up taskIds from the affected columns
            state.columns.forEach(column => {
              if (columnsToUpdate[column.id]) {
                column.taskIds = column.taskIds.filter(id => !tasksToDelete.has(id));
              }
            });
          });
        },

        // Query helpers
        getTasksByColumn: (columnId) => {
          const state = get();
          const column = state.columns.find(c => c.id === columnId);
          if (!column) {
            logger.warn(`[UnifiedStore] Column not found: ${columnId}`, {
              requestedColumnId: columnId,
              availableColumns: state.columns.map(c => ({ id: c.id, title: c.title }))
            });
            return [];
          }
          
          const allTaskIds = column.taskIds;
          const missingTaskIds: string[] = [];
          const deletedTaskIds: string[] = [];
          
          logger.debug(`[UnifiedStore] Getting tasks for column ${columnId} (${column.title})`, {
            taskIdsInColumn: allTaskIds.length,
            taskIds: allTaskIds.slice(0, 5), // Show first 5 for debugging
            totalTasksInStore: Object.keys(state.tasks).length
          });
          
          const tasks = column.taskIds
            .map(id => {
              const task = state.tasks[id];
              if (!task) {
                missingTaskIds.push(id);
                logger.warn(`[UnifiedStore] Task ${id} not found in tasks map`);
              } else if (task.optimisticDelete) {
                deletedTaskIds.push(id);
              }
              return task;
            })
            .filter(task => task && !task.optimisticDelete);
          
          // Return filtered tasks
          logger.debug(`[UnifiedStore] Returning ${tasks.length} tasks for column ${columnId}`, {
            missingTaskIds: missingTaskIds.length,
            deletedTaskIds: deletedTaskIds.length,
            finalTaskCount: tasks.length
          });
          
          return tasks;
        },
        
        getTaskByGoogleId: (googleTaskId) => {
          const state = get();
          return Object.values(state.tasks).find(t => t.googleTaskId === googleTaskId);
        },
        
        getPendingTasks: () => {
          const state = get();
          const allTasks = Object.values(state.tasks);
          const pendingTasks = allTasks.filter(
            t => t.syncState !== 'synced' && t.syncState !== 'error'
          );
          
          logger.debug('[UnifiedStore] getPendingTasks called', {
            totalTasks: allTasks.length,
            pendingTasks: pendingTasks.length,
            taskStates: allTasks.map(t => ({
              id: t.id,
              title: t.title,
              syncState: t.syncState,
              googleTaskListId: t.googleTaskListId
            }))
          });
          
          return pendingTasks;
        },
        
        // Sync state management
        setSyncing: (isSyncing) => {
          set(state => {
            state.isSyncing = isSyncing;
            if (isSyncing) {
              state.lastSyncTime = new Date().toISOString();
            }
          });
        },
        
        clearSyncErrors: () => {
          set(state => {
            state.syncErrors = {};
            Object.values(state.tasks).forEach(task => {
              if (task.syncState === 'error') {
                task.syncState = 'synced';
                task.lastSyncError = undefined;
              }
            });
          });
        },
      })),
      {
        name: 'unified-task-store',
        partialize: (state) => ({
          tasks: state.tasks,
          columns: state.columns,
        }),
      }
    )
  )
);
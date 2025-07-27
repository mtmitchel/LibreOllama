import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  UnifiedTask, 
  UnifiedTaskState, 
  CreateTaskInput, 
  UpdateTaskInput,
  TaskColumn,
  TaskSyncState 
} from './unifiedTaskStore.types';
import { logger } from '../core/lib/logger';

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
  
  // Query helpers
  getTasksByColumn: (columnId: string) => UnifiedTask[];
  getTaskByGoogleId: (googleTaskId: string) => UnifiedTask | undefined;
  getPendingTasks: () => UnifiedTask[];
  
  // Sync state
  setSyncing: (isSyncing: boolean) => void;
  clearSyncErrors: () => void;
  
  // Migration helpers
  importFromLegacyStores: (data: {
    kanbanTasks: any[];
    googleTasks: any[];
    metadata: any;
  }) => void;
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
            googleTaskListId: input.googleTaskListId,
          };
          
          set(state => {
            state.tasks[taskId] = newTask;
            
            // Add to column
            const column = state.columns.find(c => c.id === input.columnId);
            if (column) {
              column.taskIds.push(taskId);
            }
          });
          
          logger.info('[UnifiedStore] Created task', { taskId, title: input.title });
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
        },
        
        // Delete a task (optimistic with sync)
        deleteTask: (taskId) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) {
              logger.warn('[UnifiedStore] Attempted to delete non-existent task', { taskId });
              return;
            }
            
            // Removed verbose logging
            
            if (task.googleTaskId) {
              // Mark for deletion instead of immediate removal
              task.syncState = 'pending_delete';
              task.optimisticDelete = true;
              // Mark for deletion
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
          
          logger.info('[UnifiedStore] Deleted task', { taskId });
        },
        
        // Move task between columns or reorder
        moveTask: (taskId, targetColumnId, targetIndex) => {
          set(state => {
            const task = state.tasks[taskId];
            if (!task) return;
            
            const sourceColumn = state.columns.find(c => c.id === task.columnId);
            const targetColumn = state.columns.find(c => c.id === targetColumnId);
            
            if (!sourceColumn || !targetColumn) return;
            
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
                // Update existing task
                // Update existing task
                Object.assign(existingTask, update.data);
                existingTask.syncState = 'synced';
                existingTask.updated = update.data.updated || new Date().toISOString();
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
                  // Use Google ID as the primary ID to avoid temporary local IDs
                  const taskId = update.googleTaskId;
                  const newTask: UnifiedTask = {
                    id: taskId,  // Use Google ID as primary ID
                    googleTaskId: update.googleTaskId,
                    googleTaskListId: update.googleTaskListId,
                    columnId: column.id,
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
                  column.taskIds.push(taskId);
                  created++;
                  
                  // Verify task was actually created
                  logger.info(`[UnifiedStore] Task created: ${newTask.title} in column ${column.title}`);
                } else {
                  skipped++;
                  logger.warn(`[UnifiedStore] No column found for googleTaskListId: ${update.googleTaskListId}`);
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
          
          logger.debug('[UnifiedStore] Added column', { id, title });
        },
        
        updateColumn: (columnId, updates) => {
          set(state => {
            const column = state.columns.find(c => c.id === columnId);
            if (column) {
              Object.assign(column, updates);
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
          
          return tasks;
        },
        
        getTaskByGoogleId: (googleTaskId) => {
          const state = get();
          return Object.values(state.tasks).find(t => t.googleTaskId === googleTaskId);
        },
        
        getPendingTasks: () => {
          const state = get();
          return Object.values(state.tasks).filter(
            t => t.syncState !== 'synced' && t.syncState !== 'error'
          );
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
        
        // Sync with Google Tasks
        syncWithGoogle: async () => {
          const state = get();
          logger.info('[UnifiedStore] Starting Google sync');
          
          // TODO: Implement actual Google sync
          // For now, just trigger the realtime sync service
          const { default: RealtimeSync } = await import('../services/realtimeSync');
          const syncService = new RealtimeSync();
          await syncService.syncNow();
        },
        
        // Legacy migration helper
        importFromLegacyStores: (data) => {
          set(state => {
            // Clear existing data
            state.tasks = {};
            state.columns = [];
            
            // Import columns from Kanban
            data.kanbanTasks.forEach(kanbanColumn => {
              const column: TaskColumn = {
                id: kanbanColumn.id,
                title: kanbanColumn.title,
                googleTaskListId: kanbanColumn.googleTaskListId,
                taskIds: [],
              };
              state.columns.push(column);
              
              // Import tasks
              kanbanColumn.tasks.forEach((kanbanTask: any) => {
                const taskId = generateTaskId();
                const metadata = data.metadata[kanbanTask.googleTaskId || kanbanTask.id] || {};
                
                const task: UnifiedTask = {
                  id: taskId,
                  googleTaskId: kanbanTask.googleTaskId,
                  googleTaskListId: column.googleTaskListId,
                  title: kanbanTask.title,
                  notes: kanbanTask.notes || '',
                  due: kanbanTask.due,
                  status: kanbanTask.status || 'needsAction',
                  updated: kanbanTask.updated || new Date().toISOString(),
                  position: kanbanTask.position || '0',
                  labels: metadata.labels || [],
                  priority: metadata.priority || 'normal',
                  attachments: metadata.attachments,
                  columnId: column.id,
                  syncState: kanbanTask.googleTaskId ? 'synced' : 'pending_create',
                };
                
                state.tasks[taskId] = task;
                column.taskIds.push(taskId);
              });
            });
          });
          
          logger.info('[UnifiedStore] Imported from legacy stores');
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
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  UnifiedTask, 
  UnifiedTaskState, 
  CreateTaskInput, 
  UpdateTaskInput,
  TaskColumn
} from './unifiedTaskStore.types';
import { logger } from '../core/lib/logger';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from './settingsStore';

interface UnifiedTaskActions {
  // Task CRUD operations
  createTask: (input: CreateTaskInput) => Promise<string>; // Returns stable task ID
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, targetColumnId: string, targetIndex?: number) => Promise<void>;
  
  // Column operations
  addColumn: (id: string, title: string, googleTaskListId?: string) => void;
  updateColumn: (columnId: string, updates: Partial<TaskColumn>) => Promise<void>;
  deleteColumn: (columnId: string) => void;
  setTasks: (tasks: Record<string, UnifiedTask>) => void;
  setColumns: (columns: TaskColumn[]) => void;

  // Query helpers
  getTasksByColumn: (columnId: string) => UnifiedTask[];
  getTaskByGoogleId: (googleTaskId: string) => UnifiedTask | undefined;
  getVisibleTasks: () => UnifiedTask[];
  getVisibleTasksByColumn: (columnId: string) => UnifiedTask[];

  // UI state
  setShowCompleted: (show: boolean, listId?: string) => void;
  getShowCompletedForList: (listId: string) => boolean;
}

type UnifiedTaskStore = UnifiedTaskState & UnifiedTaskActions;

const generateTaskId = () => `local-task-${uuidv4()}`;

// Helper to migrate old string labels to new format
const migrateLabelFormat = (labels: any): Array<{ name: string; color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray' }> => {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return labels.map((label, index) => {
      if (typeof label === 'string') {
        // Migrate from string to object with color based on index
        const colors: Array<'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray'> = 
          ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'yellow', 'cyan', 'gray', 'red'];
        return {
          name: label,
          color: colors[index % colors.length]
        };
      }
      return label;
    });
  }
  return [];
};

export const useUnifiedTaskStore = create<UnifiedTaskStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tasks: {},
        columns: [],
        showCompleted: true,
        showCompletedByList: {},
        isSyncing: false,
        syncErrors: {},
        
        // Create a new task
        createTask: async (input) => {
          const tempId = generateTaskId();
          const now = new Date().toISOString();

          const state = get();
          const column = state.columns.find(c => c.id === input.columnId);
          const googleTaskListId = column?.googleTaskListId;
          
          // Get active account
          const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
          if (!activeAccount || !googleTaskListId) {
            logger.warn('[UnifiedStore] Cannot create task - no active account or list ID');
            throw new Error('No active Google account or task list');
          }
          
          // Optimistically add to local store
          const newTask: UnifiedTask = {
            id: tempId,
            title: input.title,
            status: 'needsAction',
            updated: now,
            position: '0',
            labels: input.labels || [],
            priority: input.priority || 'none',
            notes: input.notes || '',
            due: input.due,
            columnId: input.columnId,
            googleTaskListId: googleTaskListId,
            timeBlock: input.timeBlock,
            syncState: 'pending_create',
          };
          
          set(state => {
            state.tasks[tempId] = newTask;
            
            const column = state.columns.find(c => c.id === input.columnId);
            if (column) {
              column.taskIds.push(tempId);
            }
          });
          
          logger.debug('[UnifiedStore] Creating task with metadata', {
            tempId,
            title: input.title,
            priority: newTask.priority,
            labels: newTask.labels
          });
          
          try {
            // Create in Google Tasks via backend
            const response = await invoke<{
              id: string;
              title: string;
              notes?: string;
              due?: string;
              status: string;
              position?: string;
              updated?: string;
              priority?: string;
              labels?: string[];
            }>('create_google_task', {
              request: {
                account_id: activeAccount.id,
                task_list_id: googleTaskListId,
                title: input.title,
                notes: input.notes,
                // Google Tasks only accepts YYYY-MM-DD format
                // Convert any date format to YYYY-MM-DD in local timezone
                due: input.due ? (() => {
                  if (input.due.length === 10) return input.due; // Already YYYY-MM-DD
                  const date = new Date(input.due);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })() : undefined,
                // Convert 'none' to 'normal' for backend compatibility
                priority: input.priority === 'none' ? 'normal' : input.priority,
                labels: input.labels,
                time_block: input.timeBlock ? {
                  start_time: input.timeBlock.startTime,
                  end_time: input.timeBlock.endTime
                } : undefined,
              }
            });
            
            // Update with real Google Task ID
            set(state => {
              const task = state.tasks[tempId];
              if (task) {
                delete state.tasks[tempId];
                task.id = response.id;
                task.googleTaskId = response.id;
                task.updated = response.updated || now;
                task.position = response.position || '0';
                // Preserve the local metadata - backend may not return these
                // Map 'normal' from backend to 'none' for frontend consistency
                const backendPriority = response.priority || task.priority;
                task.priority = (backendPriority === 'normal' || !backendPriority) ? 'none' : backendPriority;
                task.labels = response.labels || task.labels || [];
                state.tasks[response.id] = task;
                
                logger.debug('[UnifiedStore] Task after create response', {
                  id: task.id,
                  priority: task.priority,
                  labels: task.labels
                });
                
                // Update column taskIds
                const column = state.columns.find(c => c.id === input.columnId);
                if (column) {
                  const index = column.taskIds.indexOf(tempId);
                  if (index !== -1) {
                    column.taskIds[index] = response.id;
                  }
                }
              }
            });
            
            logger.info('[UnifiedStore] Created task in Google', { 
              taskId: response.id, 
              title: input.title, 
              googleTaskListId,
            });
            
            return response.id;
          } catch (error) {
            // Remove optimistic update on failure
            set(state => {
              delete state.tasks[tempId];
              const column = state.columns.find(c => c.id === input.columnId);
              if (column) {
                column.taskIds = column.taskIds.filter(id => id !== tempId);
              }
            });
            
            logger.error('[UnifiedStore] Failed to create task', error);
            throw error;
          }
        },
        
        // Update an existing task
        updateTask: async (taskId, updates) => {
          const state = get();
          const task = state.tasks[taskId];
          if (!task || !task.googleTaskListId) {
            logger.warn('[UnifiedStore] Task not found for update', { taskId });
            return;
          }
          
          // Get active account
          const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
          if (!activeAccount) {
            logger.warn('[UnifiedStore] Cannot update task - no active account');
            throw new Error('No active Google account');
          }
          
          // Optimistically update local store
          const previousState = { ...task };
          set(state => {
            const task = state.tasks[taskId];
            if (!task) return;
            
            // Only assign defined values to avoid overwriting with undefined
            Object.keys(updates).forEach(key => {
              if (updates[key] !== undefined) {
                task[key] = updates[key];
              }
            });
            task.updated = new Date().toISOString();
            
            if (updates.columnId && updates.columnId !== task.columnId) {
              const oldColumn = state.columns.find(c => c.taskIds.includes(taskId));
              if (oldColumn) {
                oldColumn.taskIds = oldColumn.taskIds.filter(id => id !== taskId);
              }
              
              const newColumn = state.columns.find(c => c.id === updates.columnId);
              if (newColumn) {
                newColumn.taskIds.push(taskId);
              }
            }
          });
          
          try {
            // Update in Google Tasks via backend
            // Only send fields that Google Tasks API understands
            const googleUpdates: any = {
              account_id: activeAccount.id,
              task_list_id: task.googleTaskListId,
              task_id: taskId,
            };
            
            // Only include fields that have values and are supported by Google Tasks
            if (updates.title !== undefined) googleUpdates.title = updates.title;
            if (updates.notes !== undefined) googleUpdates.notes = updates.notes;
            // CRITICAL: Handle date updates carefully to prevent timezone shifts
            if (updates.due !== undefined) {
              // Check if we're getting a date-only update
              if (updates.due_date_only) {
                // Use the date-only value and format for Google
                googleUpdates.due = `${updates.due_date_only}T00:00:00.000Z`;
              } else if (updates.due) {
                // If we have a full RFC3339 date, extract date part only
                const datePart = updates.due.split('T')[0];
                googleUpdates.due = `${datePart}T00:00:00.000Z`;
              } else {
                // Clear the due date
                googleUpdates.due = null;
              }
            }
            if (updates.status !== undefined) googleUpdates.status = updates.status;
            
            // Add custom fields to request - they'll be stored in backend metadata
            // Convert 'none' to 'normal' for backend compatibility
            if (updates.priority !== undefined) {
              googleUpdates.priority = updates.priority === 'none' ? 'normal' : updates.priority;
            }
            if (updates.labels !== undefined) googleUpdates.labels = updates.labels;
            if ('timeBlock' in updates) {
              // timeBlock is explicitly included in updates
              if (updates.timeBlock === null) {
                // User wants to clear the timeBlock
                googleUpdates.time_block = null;
              } else if (updates.timeBlock) {
                // User provided a timeBlock object
                googleUpdates.time_block = {
                  start_time: updates.timeBlock.startTime,
                  end_time: updates.timeBlock.endTime
                };
              }
              // If updates.timeBlock is undefined but key exists, don't send time_block
            }
            
            logger.debug('[UnifiedStore] Sending to Google Tasks API:', googleUpdates);
            
            // Debug log the actual updates being sent
            logger.info('🔵 TIMEBLOCK DEBUG - Updates being sent:', {
              taskId,
              hasTimeBlock: !!updates.timeBlock,
              timeBlock: updates.timeBlock,
              googleUpdates,
              allUpdates: updates
            });
            
            await invoke('update_google_task', {
              request: googleUpdates
            });
            
            logger.debug('[UnifiedStore] Updated task in Google', { taskId, updates });
          } catch (error: any) {
            // Check if this is a database schema error
            if (error.toString().includes('no such column') || error.toString().includes('task_metadata')) {
              console.error('Database schema error detected. Running migrations...');
              try {
                // Try to run migrations
                await invoke('force_run_migrations');
                console.log('Migrations completed. Retrying task update...');
                
                // Retry the update
                await invoke('update_google_task', {
                  request: googleUpdates
                });
                
                logger.debug('[UnifiedStore] Updated task in Google after migration', { taskId, updates });
                return; // Success after retry
              } catch (migrationError) {
                console.error('Failed to run migrations:', migrationError);
                // Continue with normal error handling
              }
            }
            
            // Revert optimistic update on failure
            set(state => {
              const task = state.tasks[taskId];
              if (!task) return;
              
              Object.assign(task, previousState);
              
              // Revert column changes if needed
              if (updates.columnId && updates.columnId !== previousState.columnId) {
                const newColumn = state.columns.find(c => c.taskIds.includes(taskId));
                if (newColumn) {
                  newColumn.taskIds = newColumn.taskIds.filter(id => id !== taskId);
                }
                
                const oldColumn = state.columns.find(c => c.id === previousState.columnId);
                if (oldColumn) {
                  oldColumn.taskIds.push(taskId);
                }
              }
            });
            
            logger.error('[UnifiedStore] Failed to update task', error);
            throw error;
          }
        },
        
        // Delete a task
        deleteTask: async (taskId) => {
          const state = get();
          const task = state.tasks[taskId];
          if (!task) {
            logger.warn('[UnifiedStore] Attempted to delete non-existent task', { taskId });
            return;
          }
          
          // Get active account
          const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
          if (!activeAccount || !task.googleTaskListId) {
            logger.warn('[UnifiedStore] Cannot delete task - no active account or list ID');
            throw new Error('No active Google account or task list');
          }
          
          // Optimistically remove from local store
          const taskBackup = { ...task };
          const columnId = task.columnId;
          
          set(state => {
            delete state.tasks[taskId];
            
            const column = state.columns.find(c => c.id === columnId);
            if (column) {
              column.taskIds = column.taskIds.filter(id => id !== taskId);
            }
          });
          
          try {
            // Delete from Google Tasks via backend
            // Use googleTaskId if available, otherwise use local ID
            const googleTaskId = task.googleTaskId || taskId;
            await invoke('delete_google_task', {
              request: {
                account_id: activeAccount.id,
                task_list_id: task.googleTaskListId,
                task_id: googleTaskId,
              }
            });
            
            logger.info('[UnifiedStore] Deleted task from Google', { taskId });
          } catch (error) {
            // Restore on failure
            set(state => {
              state.tasks[taskId] = taskBackup;
              
              const column = state.columns.find(c => c.id === columnId);
              if (column && !column.taskIds.includes(taskId)) {
                column.taskIds.push(taskId);
              }
            });
            
            logger.error('[UnifiedStore] Failed to delete task', error);
            throw error;
          }
        },
        
        // Move task between columns or reorder
        moveTask: async (taskId, targetColumnId, targetIndex) => {
          console.log('[UnifiedStore] moveTask called:', { taskId, targetColumnId, targetIndex });
          const state = get();
          const task = state.tasks[taskId];
          if (!task) {
            console.error('[UnifiedStore] Task not found:', taskId);
            return;
          }
          
          const sourceColumn = state.columns.find(c => c.id === task.columnId);
          const targetColumn = state.columns.find(c => c.id === targetColumnId);
          
          if (!sourceColumn || !targetColumn) {
            console.error('[UnifiedStore] Source or target column not found:', { sourceColumn, targetColumn });
            return;
          }
          
          // Check if this is a cross-list move
          const isCrossListMove = task.googleTaskListId !== targetColumn.googleTaskListId;
          console.log('[UnifiedStore] Cross-list move?', { 
            isCrossListMove, 
            taskListId: task.googleTaskListId, 
            targetListId: targetColumn.googleTaskListId 
          });
          
          if (isCrossListMove) {
            // Get active account
            const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
            if (!activeAccount || !task.googleTaskListId || !targetColumn.googleTaskListId) {
              logger.warn('[UnifiedStore] Cannot move task - no active account or list IDs');
              throw new Error('No active Google account or task list');
            }
            
            // Store original state for rollback
            const originalTaskState = { ...task };
            const originalSourceTaskIds = [...sourceColumn.taskIds];
            const originalTargetTaskIds = [...targetColumn.taskIds];
            
            // Optimistically update local state
            set(state => {
              const task = state.tasks[taskId];
              if (!task) return;
              
              // Find columns in the draft state
              const sourceDraftColumn = state.columns.find(c => c.id === sourceColumn.id);
              const targetDraftColumn = state.columns.find(c => c.id === targetColumn.id);
              
              if (!sourceDraftColumn || !targetDraftColumn) return;
              
              // Remove from source column
              sourceDraftColumn.taskIds = sourceDraftColumn.taskIds.filter(id => id !== taskId);
              
              // Add to target column
              if (targetIndex !== undefined && targetIndex >= 0) {
                targetDraftColumn.taskIds.splice(targetIndex, 0, taskId);
              } else {
                targetDraftColumn.taskIds.push(taskId);
              }
              
              // Update task properties
              task.columnId = targetColumnId;
              task.googleTaskListId = targetColumn.googleTaskListId;
              task.updated = new Date().toISOString();
            });
            
            try {
              logger.info('[UnifiedStore] Moving task between lists using delete-recreate pattern', {
                taskId,
                sourceList: task.googleTaskListId,
                targetList: targetColumn.googleTaskListId
              });
              
              // 1. Create new task in target list
              const createResponse = await invoke<{
                id: string;
                title: string;
                notes?: string;
                due?: string;
                status: string;
                position?: string;
                updated?: string;
                priority: string;
                labels: string[];
              }>('create_google_task', {
                request: {
                  account_id: activeAccount.id,
                  task_list_id: targetColumn.googleTaskListId,
                  title: task.title,
                  notes: task.notes,
                  due: task.due,
                  priority: task.priority,
                  labels: task.labels,
                }
              });
              
              // 2. Delete original task from source list
              await invoke('delete_google_task', {
                request: {
                  account_id: activeAccount.id,
                  task_list_id: originalTaskState.googleTaskListId,
                  task_id: taskId,
                }
              });
              
              // 3. Update local state with new task ID
              set(state => {
                // Remove old task
                delete state.tasks[taskId];
                
                // Add new task with new ID
                const newTask = {
                  ...task,
                  id: createResponse.id,
                  googleTaskId: createResponse.id,
                  updated: createResponse.updated || new Date().toISOString(),
                  position: createResponse.position || '0',
                };
                state.tasks[createResponse.id] = newTask;
                
                // Update column taskIds with new ID
                const targetCol = state.columns.find(c => c.id === targetColumnId);
                if (targetCol) {
                  const index = targetCol.taskIds.indexOf(taskId);
                  if (index !== -1) {
                    targetCol.taskIds[index] = createResponse.id;
                  }
                }
              });
              
              logger.info('[UnifiedStore] Successfully moved task between lists', {
                oldId: taskId,
                newId: createResponse.id,
                targetList: targetColumn.googleTaskListId
              });
              
            } catch (error) {
              // Rollback on failure
              set(state => {
                // Restore task to original state
                state.tasks[taskId] = originalTaskState;
                
                // Find columns in the draft state and restore taskIds
                const sourceDraftColumn = state.columns.find(c => c.id === sourceColumn.id);
                const targetDraftColumn = state.columns.find(c => c.id === targetColumn.id);
                
                if (sourceDraftColumn) {
                  sourceDraftColumn.taskIds = originalSourceTaskIds;
                }
                if (targetDraftColumn) {
                  targetDraftColumn.taskIds = originalTargetTaskIds;
                }
              });
              
              logger.error('[UnifiedStore] Failed to move task between lists', error);
              throw error;
            }
          } else {
            // Same list move - just reorder locally
            set(state => {
              const task = state.tasks[taskId];
              if (!task) return;
              
              const sourceDraftColumn = state.columns.find(c => c.id === sourceColumn.id);
              const targetDraftColumn = state.columns.find(c => c.id === targetColumn.id);
              
              if (!sourceDraftColumn || !targetDraftColumn) return;
              
              sourceDraftColumn.taskIds = sourceDraftColumn.taskIds.filter(id => id !== taskId);
              
              if (targetIndex !== undefined && targetIndex >= 0) {
                targetDraftColumn.taskIds.splice(targetIndex, 0, taskId);
              } else {
                targetDraftColumn.taskIds.push(taskId);
              }
              
              task.columnId = targetColumnId;
              task.updated = new Date().toISOString();
            });
            
            logger.debug('[UnifiedStore] Reordered task within same list', { taskId, targetColumnId, targetIndex });
          }
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
        
        updateColumn: async (columnId, updates) => {
          const state = get();
          const column = state.columns.find(c => c.id === columnId);
          if (!column) {
            logger.warn('[UnifiedStore] Column not found for update', { columnId, updates });
            return;
          }
          
          // Store original state for rollback
          const originalState = { ...column };
          
          // Optimistically update local state
          set(state => {
            const column = state.columns.find(c => c.id === columnId);
            if (column) {
              Object.assign(column, updates);
            }
          });
          
          // If title is being updated and we have a Google list ID, sync with Google
          if (updates.title && column.googleTaskListId) {
            const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
            if (activeAccount) {
              try {
                await invoke('update_google_task_list', {
                  request: {
                    account_id: activeAccount.id,
                    task_list_id: column.googleTaskListId,
                    new_title: updates.title,
                  }
                });
                
                logger.debug('[UnifiedStore] Updated column in Google', { columnId, updates });
              } catch (error) {
                // Revert on failure
                set(state => {
                  const column = state.columns.find(c => c.id === columnId);
                  if (column) {
                    Object.assign(column, originalState);
                  }
                });
                
                logger.error('[UnifiedStore] Failed to update column in Google', error);
                throw error;
              }
            }
          }
          
          logger.debug('[UnifiedStore] Updated column', { columnId, updates });
        },
        
        deleteColumn: (columnId) => {
          set(state => {
            state.columns = state.columns.filter(c => c.id !== columnId);
            
            Object.values(state.tasks)
              .filter(t => t.columnId === columnId)
              .forEach(task => {
                delete state.tasks[task.id];
              });
          });
          
          logger.debug('[UnifiedStore] Deleted column', { columnId });
        },

        setTasks: (tasks) => {
          set(state => {
            // Merge incoming tasks with existing ones, preserving local metadata
            const mergedTasks: Record<string, UnifiedTask> = {};
            
            // First, add all incoming tasks
            for (const [id, incomingTask] of Object.entries(tasks)) {
              const existingTask = state.tasks[id];
              
              if (existingTask) {
                // Merge: preserve local-only fields if they exist
                mergedTasks[id] = {
                  ...incomingTask,
                  // Preserve local metadata if incoming doesn't have it, and migrate format
                  labels: incomingTask.labels?.length ? migrateLabelFormat(incomingTask.labels) : migrateLabelFormat(existingTask.labels),
                  // Only override priority if incoming has a non-normal value
                  // Otherwise, keep existing priority
                  priority: (incomingTask.priority && incomingTask.priority !== 'normal') 
                    ? incomingTask.priority 
                    : existingTask.priority || 'normal',
                  recurring: incomingTask.recurring || existingTask.recurring,
                  metadata: incomingTask.metadata || existingTask.metadata,
                };
                
                // Log if priority changed
                if (existingTask.priority !== mergedTasks[id].priority) {
                  logger.debug('[UnifiedStore] Priority changed during merge', {
                    id: id,
                    title: incomingTask.title,
                    oldPriority: existingTask.priority,
                    newPriority: mergedTasks[id].priority,
                    incomingPriority: incomingTask.priority
                  });
                }
              } else {
                // New task, use as-is
                mergedTasks[id] = incomingTask;
              }
            }
            
            // Note: We don't preserve tasks that aren't in the incoming set
            // as they may have been deleted on another device
            state.tasks = mergedTasks;
            
            logger.debug('[UnifiedStore] Merged tasks', { 
              incoming: Object.keys(tasks).length,
              existing: Object.keys(state.tasks).length,
              merged: Object.keys(mergedTasks).length 
            });
          });
        },

        setColumns: (columns) => {
          set(state => {
            state.columns = columns;
          });
        },

        // Query helpers
        getTasksByColumn: (columnId) => {
          const state = get();
          const column = state.columns.find(c => c.id === columnId);
          if (!column) {
            return [];
          }
          
          return column.taskIds.map(id => state.tasks[id]).filter(Boolean);
        },
        
        getTaskByGoogleId: (googleTaskId) => {
          const state = get();
          return Object.values(state.tasks).find(t => t.googleTaskId === googleTaskId);
        },

        // Get all visible tasks (respecting showCompleted filter)
        getVisibleTasks: () => {
          const state = get();
          const allTasks = Object.values(state.tasks);
          
          if (state.showCompleted) {
            return allTasks;
          }
          
          return allTasks.filter(task => task.status !== 'completed');
        },

        // Get visible tasks for a specific column
        getVisibleTasksByColumn: (columnId) => {
          const state = get();
          const column = state.columns.find(c => c.id === columnId);
          if (!column) {
            return [];
          }
          
          const tasks = column.taskIds.map(id => state.tasks[id]).filter(Boolean);
          
          if (state.showCompleted) {
            return tasks;
          }
          
          return tasks.filter(task => task.status !== 'completed');
        },

        // Toggle show completed state
        setShowCompleted: (show, listId) => {
          console.log('🎛️ setShowCompleted called with:', show, 'for list:', listId);
          set(state => {
            if (listId) {
              // Set per-list preference
              state.showCompletedByList[listId] = show;
            } else {
              // Set global default
              state.showCompleted = show;
            }
          });
          
          logger.debug('[UnifiedStore] Show completed toggled', { showCompleted: show, listId });
        },
        
        // Get show completed state for a specific list
        getShowCompletedForList: (listId) => {
          const state = get();
          // Use list-specific setting if available, otherwise use global default
          return state.showCompletedByList[listId] ?? state.showCompleted;
        },
      })),
      {
        name: 'unified-task-store',
        partialize: (state) => ({
          tasks: state.tasks,
          columns: state.columns,
          showCompleted: state.showCompleted,
        }),
      }
    )
  )
);

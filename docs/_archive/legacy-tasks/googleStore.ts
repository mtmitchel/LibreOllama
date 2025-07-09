import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { 
  GoogleAccount, 
  GoogleTask, 
  GoogleTaskList, 
  GoogleCalendarEvent, 
  KanbanColumn,
  HierarchicalTask,
  TaskCreateData,
  EnhancedGoogleTask
} from '../types/google';
import { googleTasksService } from '../services/google/googleTasksService';
import { googleCalendarService } from '../services/google/googleCalendarService';
import { getMockAccount } from '../services/google/mockGoogleService';
import { useTaskMetadataStore } from './taskMetadataStore';

const isDevMode = import.meta.env.DEV;

// Utility function to move an item in an array
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

// Utility function to parse LibreOllama data from notes
const parseTaskData = (task: GoogleTask): { cleanNotes: string; additionalData: any } => {
  const notes = task.notes || '';
  const libreOllamaPattern = /\[LibreOllama:(.+?)\]$/;
  const match = notes.match(libreOllamaPattern);
  
  if (match) {
    try {
      const additionalData = JSON.parse(match[1]);
      const cleanNotes = notes.replace(libreOllamaPattern, '').trim();
      return { cleanNotes, additionalData };
    } catch (e) {
      console.error('Failed to parse LibreOllama data from:', notes, 'Error:', e);
      return { cleanNotes: notes, additionalData: {} };
    }
  }
  
  return { cleanNotes: notes, additionalData: {} };
};

// Utility function to enhance task with parsed data
const enhanceTask = (task: GoogleTask): EnhancedGoogleTask => {
  const { cleanNotes, additionalData } = parseTaskData(task);
  const enhanced: EnhancedGoogleTask = {
    ...task,
    notes: cleanNotes,
    ...additionalData
  };
  
  return enhanced;
};

// Utility function to organize tasks hierarchically
const organizeTasks = (tasks: GoogleTask[]): HierarchicalTask[] => {
  const taskMap = new Map<string, HierarchicalTask>();
  const rootTasks: HierarchicalTask[] = [];
  
  // First pass: create hierarchical task objects and clean notes
  tasks.forEach(task => {
    const enhancedTask = enhanceTask(task);
    const hierarchicalTask: HierarchicalTask = {
      ...enhancedTask,
      children: [],
      depth: 0,
    };
    
    taskMap.set(task.id, hierarchicalTask);
  });
  
  // Second pass: organize hierarchy and calculate depth
  tasks.forEach(task => {
    const hierarchicalTask = taskMap.get(task.id)!;
    
    if (task.parent && taskMap.has(task.parent)) {
      // This is a subtask
      const parent = taskMap.get(task.parent)!;
      parent.children.push(hierarchicalTask);
      hierarchicalTask.depth = parent.depth + 1;
    } else {
      // This is a root task
      rootTasks.push(hierarchicalTask);
    }
  });
  
  // Sort by position within each level
  const sortTasksByPosition = (tasks: HierarchicalTask[]) => {
    tasks.sort((a, b) => a.position.localeCompare(b.position));
    tasks.forEach(task => {
      if (task.children.length > 0) {
        sortTasksByPosition(task.children);
      }
    });
  };
  
  sortTasksByPosition(rootTasks);
  return rootTasks;
};

interface GoogleStore {
  // Account management
  accounts: GoogleAccount[];
  activeAccount: GoogleAccount | null;
  
  // Tasks data
  taskLists: GoogleTaskList[];
  kanbanColumns: KanbanColumn[];
  taskIdToListId: Map<string, string>; // NEW: Fast lookup map
  isLoadingTasks: boolean;
  lastUpdateTime: number; // Track last update to prevent overwrites
  
  // Sync state management
  taskSyncState: Map<string, {
    status: 'synced' | 'pending' | 'failed';
    originalListId?: string;
    targetListId?: string;
    lastError?: string;
    retryCount: number;
    operationId?: string;
    originalTask?: HierarchicalTask;
  }>;
  
  // Calendar data
  calendarEvents: GoogleCalendarEvent[];
  isLoadingCalendar: boolean;
  
  // UI state
  draggedTask: HierarchicalTask | null;
  
  // Actions
  setActiveAccount: (account: GoogleAccount | null) => void;
  addAccount: (account: GoogleAccount) => void;
  removeAccount: (accountId: string) => void;
  
  // Task actions
  fetchTaskLists: () => Promise<void>;
  fetchTasksForList: (taskListId: string) => Promise<void>;
  fetchAllTasks: () => Promise<void>;
  createTask: (taskListId: string, taskData: TaskCreateData) => Promise<GoogleTask | null>;
  updateTask: (taskListId: string, taskId: string, updates: Partial<TaskCreateData>) => Promise<GoogleTask>;
  moveTask: (taskId: string, fromListId: string, toListId: string, position?: string) => Promise<GoogleTask>;
  toggleTaskCompletion: (taskListId: string, taskId: string, completed: boolean) => Promise<void>;
  deleteTask: (taskListId: string, taskId: string) => Promise<void>;
  createSubtask: (taskListId: string, parentTaskId: string, taskData: TaskCreateData) => Promise<void>;
  
  // OPTIMISTIC UPDATE METHODS - Instant UI updates
  optimisticMoveTask: (taskId: string, fromListId: string, toListId: string) => void;
  optimisticUpdateTask: (taskListId: string, taskId: string, updates: Partial<any>) => void;
  optimisticToggleTaskCompletion: (taskListId: string, taskId: string, completed: boolean) => void;
  optimisticReorderTask: (taskListId: string, activeId: string, overId: string) => void;
  
  // Task list management
  updateTaskList: (taskListId: string, title: string) => Promise<void>;
  deleteTaskList: (taskListId: string) => Promise<void>;
  archiveTaskList: (taskListId: string) => Promise<void>;
  createTaskList: (title: string) => Promise<void>;
  
  // Calendar actions
  fetchCalendarEvents: (timeMin?: string, timeMax?: string) => Promise<void>;
  createCalendarEvent: (eventData: any) => Promise<void>;
  
  // Drag and drop
  setDraggedTask: (task: HierarchicalTask | null) => void;
  
  // Utility
  clearData: () => void;
}

export const useGoogleStore = create<GoogleStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      accounts: isDevMode ? [getMockAccount()] : [],
      activeAccount: isDevMode ? getMockAccount() : null,
      taskLists: [],
      kanbanColumns: [],
      taskIdToListId: new Map(), // NEW: Initialize map
      taskSyncState: new Map(), // Initialize sync state tracking
      isLoadingTasks: false,
      lastUpdateTime: 0,
      calendarEvents: [],
      isLoadingCalendar: false,
      draggedTask: null,

      // Account management
      setActiveAccount: (account) => {
        set(produce((draft) => {
          draft.activeAccount = account;
        }));
        if (account) {
          get().fetchTaskLists();
          get().fetchCalendarEvents();
        }
      },

      addAccount: (account) => {
        set(produce((draft) => {
          draft.accounts.push(account);
          if (!draft.activeAccount) {
            draft.activeAccount = account;
          }
        }));
      },

      removeAccount: (accountId) => {
        set(produce((draft) => {
          draft.accounts = draft.accounts.filter(acc => acc.id !== accountId);
          if (draft.activeAccount?.id === accountId) {
            draft.activeAccount = null;
          }
        }));
      },

      // Task actions
      fetchTaskLists: async () => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        set(produce(draft => { draft.isLoadingTasks = true; }));
        try {
          const response = await googleTasksService.getTaskLists(activeAccount);
          if (response.success && response.data) {
            set(produce(draft => {
              draft.taskLists = response.data;
              draft.kanbanColumns = response.data.map(taskList => ({
                taskList,
                tasks: [],
                isLoading: false
              }));
            }));
          }
        } catch (error) {
          console.error('Error fetching task lists:', error);
        } finally {
          set(produce(draft => { draft.isLoadingTasks = false; }));
        }
      },

      fetchTasksForList: async (taskListId: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        set(produce(draft => {
          const column = draft.kanbanColumns.find(col => col.taskList.id === taskListId);
          if (column) column.isLoading = true;
        }));

        try {
          const response = await googleTasksService.getTasks(activeAccount, taskListId);
          if (response.success && response.data) {
            const tasks = response.data.items || [];
            const hierarchicalTasks = organizeTasks(tasks);
            
            set(produce(draft => {
              const column = draft.kanbanColumns.find(col => col.taskList.id === taskListId);
              if (column) {
                column.tasks = hierarchicalTasks;
                column.isLoading = false;
              }
              tasks.forEach(task => draft.taskIdToListId.set(task.id, taskListId));
            }));
          }
        } catch (error) {
          console.error(`Error fetching tasks for list ${taskListId}:`, error);
          set(produce(draft => {
            const column = draft.kanbanColumns.find(col => col.taskList.id === taskListId);
            if (column) column.isLoading = false;
          }));
        }
      },

      fetchAllTasks: async () => {
        const { activeAccount, taskLists, lastUpdateTime } = get();
        if (!activeAccount) return;

        // Skip fetch if a recent update occurred within last 2 seconds
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        if (timeSinceLastUpdate < 2000) {
          return;
        }

        set(produce(draft => { draft.isLoadingTasks = true; }));
        try {
            const allTasksData = await googleTasksService.getAllTasks(activeAccount, taskLists);
            
            set(produce(draft => {
                const newTaskIdToListId = new Map<string, string>();
                draft.kanbanColumns.forEach(col => {
                    const tasksForList = allTasksData[col.taskList.id] || [];
                    col.tasks = organizeTasks(tasksForList);
                    tasksForList.forEach(task => newTaskIdToListId.set(task.id, col.taskList.id));
                });
                draft.taskIdToListId = newTaskIdToListId;
                draft.isLoadingTasks = false;
            }));

        } catch (error) {
          console.error('Error fetching all tasks:', error);
          set(produce(draft => { draft.isLoadingTasks = false; }));
        }
      },
      
      createTask: async (taskListId: string, taskData: TaskCreateData): Promise<GoogleTask | null> => {
        const { activeAccount } = get();
        if (!activeAccount) throw new Error("No active account");

        try {
            const response = await googleTasksService.createTask(activeAccount, taskListId, taskData);
            
            if (response === null) {
                return null;
            }

            if (response.success && response.data) {
              const newTask = response.data;
              set(produce(draft => {
                const column = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
                if (column) {
                  const enhancedTask = enhanceTask(newTask);
                  column.tasks.push(enhancedTask);
                  draft.taskIdToListId.set(newTask.id, taskListId);
                }
              }));
              return newTask;
            } else if (response.success && response.data === null) {
              return null;
            } else {
              const errorMessage = typeof response.error === 'object' && response.error?.message 
                ? response.error.message 
                : response.error || 'Failed to create task';
              throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error("Failed to create task:", error);
            // Handle GoogleApiError objects properly
            const errorMessage = typeof error === 'object' && error?.message 
              ? error.message 
              : String(error) || 'An unknown error occurred during task creation';
            throw new Error(errorMessage);
        }
      },

      updateTask: async (taskListId: string, taskId: string, updates: Partial<TaskCreateData>) => {
        const { activeAccount, taskSyncState, kanbanColumns } = get();
        if (!activeAccount) throw new Error("No active account");
        
        // Handle edge cases gracefully
        if (!taskId || taskId === null || taskId === undefined || taskId === '') {
          console.warn(`[Store] Invalid task ID: ${taskId}`);
          return;
        }
        
        // INSTRUMENTATION: Log initial state
        console.log('[UPDATE TASK] Initial State:', JSON.stringify({
          timestamp: Date.now(),
          taskId,
          taskListId,
          updates,
          columns: kanbanColumns.map(c => ({ 
            id: c.taskList.id, 
            taskCount: c.tasks.length,
            tasks: c.tasks.map(t => ({ id: t.id, title: t.title })) 
          })),
          map: Array.from(get().taskIdToListId.entries()),
          targetTask: kanbanColumns.find(c => c.taskList.id === taskListId)?.tasks.find(t => t.id === taskId)
        }, null, 2));
        
        // Check if optimistic update has already been applied by looking at task state
        let taskAlreadyUpdated = false;
        let currentTask: HierarchicalTask | null = null;
        
        for (const column of kanbanColumns) {
          const findTask = (tasks: HierarchicalTask[]): HierarchicalTask | null => {
            for (const task of tasks) {
              if (task.id === taskId) return task;
              if (task.children) {
                const found = findTask(task.children);
                if (found) return found;
              }
            }
            return null;
          };
          
          currentTask = findTask(column.tasks);
          if (currentTask) {
            // Check if the current task already has the optimistic updates applied
            taskAlreadyUpdated = Object.keys(updates).some(key => 
              currentTask[key] === updates[key]
            );
            break;
          }
        }
        
        console.log('[UPDATE TASK] Optimistic Check:', JSON.stringify({
          taskAlreadyUpdated,
          currentTask: currentTask ? { id: currentTask.id, title: currentTask.title } : null
        }, null, 2));
        
        // STEP 1: Snapshot current state before any changes
        const previousSnapshot = {
          kanbanColumns: JSON.parse(JSON.stringify(kanbanColumns)),
          taskIdToListId: new Map(get().taskIdToListId),
          taskSyncState: new Map(get().taskSyncState)
        };
        
        console.log('[UPDATE TASK] Snapshot Created:', JSON.stringify({
          timestamp: Date.now(),
          snapshotColumns: previousSnapshot.kanbanColumns.map(c => ({ 
            id: c.taskList.id, 
            taskCount: c.tasks.length,
            tasks: c.tasks.map(t => ({ id: t.id, title: t.title })) 
          })),
          snapshotMap: Array.from(previousSnapshot.taskIdToListId.entries())
        }, null, 2));
        
        // STEP 2: Apply optimistic update ONLY if not already applied
        if (!taskAlreadyUpdated) {
          console.log('[UPDATE TASK] Applying optimistic update...');
          set(produce(draft => {
            for (const column of draft.kanbanColumns) {
              const updateInTasks = (tasks: HierarchicalTask[]): boolean => {
                for (let i = 0; i < tasks.length; i++) {
                  if (tasks[i].id === taskId) {
                    tasks[i] = { ...tasks[i], ...updates };
                    return true;
                  }
                  if (tasks[i].children && updateInTasks(tasks[i].children)) {
                    return true;
                  }
                }
                return false;
              };
              
              if (updateInTasks(column.tasks)) {
                break;
              }
            }
          }));
          
          console.log('[UPDATE TASK] After optimistic update:', JSON.stringify({
            timestamp: Date.now(),
            columns: get().kanbanColumns.map(c => ({ 
              id: c.taskList.id, 
              taskCount: c.tasks.length,
              tasks: c.tasks.map(t => ({ id: t.id, title: t.title })) 
            })),
            map: Array.from(get().taskIdToListId.entries()),
            targetTask: get().kanbanColumns.find(c => c.taskList.id === taskListId)?.tasks.find(t => t.id === taskId)
          }, null, 2));
        } else {
          console.log('[UPDATE TASK] Skipping optimistic update (already applied)');
        }
        
        // STEP 3: Attempt API call outside of any produce calls
        const syncState = taskSyncState.get(taskId);
        const isUnsynced = syncState && syncState.status !== 'synced';
        
        // Determine which lists to try
        const listsToTry: string[] = [];
        
        if (isUnsynced && syncState) {
            if (syncState.targetListId) listsToTry.push(syncState.targetListId);
            if (syncState.originalListId && syncState.originalListId !== syncState.targetListId) {
                listsToTry.push(syncState.originalListId);
            }
        } else {
            listsToTry.push(taskListId);
        }
        
        // Add all other lists as fallbacks
        for (const column of kanbanColumns) {
            if (!listsToTry.includes(column.taskList.id)) {
                listsToTry.push(column.taskList.id);
            }
        }
        
        const attemptUpdate = async (listIds: string[], currentIndex = 0): Promise<any> => {
            if (currentIndex >= listIds.length) {
                throw new Error('Task not found in any list');
            }
            
            const listId = listIds[currentIndex];
            try {
                const response = await googleTasksService.updateTask(activeAccount, listId, taskId, updates);
                if (response.success && response.data) {
                    return response.data;
                }
                const errorMessage = typeof response.error === 'object' && response.error?.message 
                  ? response.error.message 
                  : response.error || 'Failed to update task';
                throw new Error(errorMessage);
            } catch (error: any) {
                if (error.message?.includes('not found') && currentIndex < listIds.length - 1) {
                    console.log(`[Store] Task not found in ${listId}, trying next list...`);
                    return attemptUpdate(listIds, currentIndex + 1);
                }
                throw error;
            }
        };
        
        try {
            const updatedTask = await attemptUpdate(listsToTry);
            const enhancedTask = enhanceTask(updatedTask);
            
            // STEP 4: Update store with successful API response (separate produce call)
            set(produce(draft => {
                if (syncState) {
                    draft.taskSyncState.set(taskId, {
                        ...syncState,
                        status: 'synced'
                    });
                }
                
                let updated = false;
                for (const column of draft.kanbanColumns) {
                    const updateInTasks = (tasks: HierarchicalTask[]): boolean => {
                        for (let i = 0; i < tasks.length; i++) {
                            if (tasks[i].id === taskId) {
                                const existingTask = tasks[i];
                                tasks[i] = { 
                                    ...existingTask,
                                    ...enhancedTask,
                                    labels: enhancedTask.labels || existingTask.labels,
                                    priority: enhancedTask.priority || existingTask.priority,
                                    subtasks: enhancedTask.subtasks || existingTask.subtasks,
                                    recurring: enhancedTask.recurring || existingTask.recurring,
                                };
                                return true;
                            }
                            if (tasks[i].children && updateInTasks(tasks[i].children)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    
                    if (updateInTasks(column.tasks)) {
                        updated = true;
                        break;
                    }
                }
                
                if (!updated) {
                    console.error(`[Store] Failed to find task ${taskId} in any column`);
                }
                
                draft.lastUpdateTime = Date.now();
            }));
            
            return updatedTask;
        } catch (error) {
            console.error(`[Store] Failed to update task after all attempts:`, error);
            
            // INSTRUMENTATION: Log state immediately on catch
            console.log('[UPDATE TASK] Immediate catch state:', JSON.stringify({
              timestamp: Date.now(),
              error: error instanceof Error ? error.message : String(error),
              columns: get().kanbanColumns.map(c => ({ 
                id: c.taskList.id, 
                taskCount: c.tasks.length,
                tasks: c.tasks.map(t => ({ id: t.id, title: t.title })) 
              })),
              map: Array.from(get().taskIdToListId.entries()),
              targetTask: get().kanbanColumns.find(c => c.taskList.id === taskListId)?.tasks.find(t => t.id === taskId)
            }, null, 2));
            
            // STEP 5: CRITICAL - Rollback to snapshot on API failure (separate produce call)
            // This preserves the optimistic update by doing nothing (optimistic update already applied)
            // The optimistic state remains as-is, which is the desired behavior
            
            // Only log the error, do NOT modify store state here
            // The optimistic update should remain visible to the user
            
            console.log('[UPDATE TASK] Preserving optimistic update on API failure');
            
            const errorMessage = typeof error === 'object' && error?.message 
              ? error.message 
              : String(error) || 'An unknown error occurred during task update';
            throw new Error(errorMessage);
        }
      },

      deleteTask: async (taskListId: string, taskId: string) => {
        const { activeAccount } = get();
        if (!activeAccount) throw new Error("No active account");

        try {
          const response = await googleTasksService.deleteTask(activeAccount, taskListId, taskId);
          
          if (response.success) {
            // Clean up metadata
            const metadataStore = useTaskMetadataStore.getState();
            metadataStore.deleteTaskMetadata(taskId);
            
            set(produce(draft => {
              const column = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
              if (column) {
                const removeTask = (tasks: HierarchicalTask[]): HierarchicalTask[] => {
                    return tasks.filter(task => {
                        if (task.id === taskId) return false;
                        if (task.children) {
                            task.children = removeTask(task.children);
                        }
                        return true;
                    });
                };
                column.tasks = removeTask(column.tasks);
                draft.taskIdToListId.delete(taskId);
              }
            }));
          } else {
            // Handle GoogleApiError objects properly
            const errorMessage = typeof response.error === 'object' && response.error?.message 
              ? response.error.message 
              : response.error || 'Failed to delete task';
            throw new Error(errorMessage);
          }
        } catch (error: any) {
            console.error("Failed to delete task:", error);
            // Handle GoogleApiError objects properly
            const errorMessage = typeof error === 'object' && error?.message 
              ? error.message 
              : String(error) || 'An unknown error occurred during task deletion';
            throw new Error(errorMessage);
        }
      },

      moveTask: async (taskId: string, fromListId: string, toListId: string, position?: string) => {
        const { activeAccount } = get();
        if (!activeAccount) throw new Error("No active account");
        
        // STEP 1: Snapshot current state before optimistic move
        const previousSnapshot = {
          kanbanColumns: JSON.parse(JSON.stringify(get().kanbanColumns)),
          taskIdToListId: new Map(get().taskIdToListId),
          taskSyncState: new Map(get().taskSyncState)
        };
        
        // Find the task in its current location (it might have been moved optimistically)
        let taskToMove: HierarchicalTask | null = null;
        let currentListId: string | null = null;
        const currentState = get();
        
        // Search for the task in all columns to find its current location
        for (const column of currentState.kanbanColumns) {
          const findTask = (tasks: HierarchicalTask[]): HierarchicalTask | null => {
            for (const task of tasks) {
              if (task.id === taskId) return task;
              if (task.children) {
                const found = findTask(task.children);
                if (found) return found;
              }
            }
            return null;
          };
          
          const found = findTask(column.tasks);
          if (found) {
            taskToMove = found;
            currentListId = column.taskList.id;
            break;
          }
        }
        
        if (!taskToMove) {
          throw new Error(`Task ${taskId} not found in any list`);
        }
        
        // If the task is already in the target list, don't apply optimistic move again
        const needsOptimisticMove = currentListId !== toListId;
        
        // STEP 2: Apply optimistic move in isolated produce call (no throwing)
        if (needsOptimisticMove) {
          set(produce(draft => {
            const fromColumn = draft.kanbanColumns.find(c => c.taskList.id === currentListId);
            const toColumn = draft.kanbanColumns.find(c => c.taskList.id === toListId);

            if (fromColumn && toColumn) {
                let taskToMove: HierarchicalTask | null = null;
                
                // Remove task from current column
                const findAndRemove = (tasks: HierarchicalTask[], id: string): HierarchicalTask[] => {
                    return tasks.filter(task => {
                        if (task.id === id) {
                            taskToMove = task;
                            return false;
                        }
                        if (task.children) {
                            task.children = findAndRemove(task.children, id);
                        }
                        return true;
                    });
                };
                
                fromColumn.tasks = findAndRemove(fromColumn.tasks, taskId);
                
                if (taskToMove) {
                    // Mark as pending sync
                    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    draft.taskSyncState.set(taskId, {
                        status: 'pending',
                        originalListId: currentListId,
                        targetListId: toListId,
                        retryCount: 0,
                        operationId,
                        originalTask: taskToMove
                    });
                    
                    // Add to target column
                    toColumn.tasks.push(taskToMove);
                    draft.taskIdToListId.set(taskId, toListId);
                }
            }
          }));
        }
        
        // STEP 3: Attempt API call outside of any produce calls
        try {
            const response = await googleTasksService.moveTask(activeAccount, taskId, fromListId, toListId, { previous: position });
            
            if (response.success && response.data) {
              // STEP 4: Update store with successful API response (separate produce call)
              set(produce(draft => {
                  // Mark as synced after successful move
                  const syncState = draft.taskSyncState.get(taskId);
                  if (syncState) {
                      draft.taskSyncState.set(taskId, {
                          ...syncState,
                          status: 'synced'
                      });
                  }
                  
                  // Update task with response data but preserve optimistic updates
                  const toColumn = draft.kanbanColumns.find(c => c.taskList.id === toListId);
                  if (toColumn) {
                      const updateInTasks = (tasks: HierarchicalTask[]): boolean => {
                          for (let i = 0; i < tasks.length; i++) {
                              if (tasks[i].id === taskId) {
                                  const existingTask = tasks[i];
                                  tasks[i] = { ...existingTask, ...enhanceTask(response.data) };
                                  return true;
                              }
                              if (tasks[i].children && updateInTasks(tasks[i].children)) {
                                  return true;
                              }
                          }
                          return false;
                      };
                      updateInTasks(toColumn.tasks);
                  }
              }));
              return response.data;
            } else {
              const errorMessage = typeof response.error === 'object' && response.error?.message 
                ? response.error.message 
                : response.error || 'Failed to move task';
              throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error(`[Store] Failed to move task:`, error);
            
            // STEP 5: CRITICAL - Preserve optimistic move on API failure
            // The optimistic move was already applied above, so we DO NOT modify the store here
            // The task should remain in the target list with its optimistic changes
            
            // Update sync state to reflect failure (separate produce call)
            set(produce(draft => {
                const syncState = draft.taskSyncState.get(taskId);
                if (syncState) {
                    draft.taskSyncState.set(taskId, {
                        ...syncState,
                        status: 'failed',
                        lastError: error instanceof Error ? error.message : String(error),
                        retryCount: (syncState.retryCount || 0) + 1
                    });
                }
            }));
            
            const errorMessage = typeof error === 'object' && error?.message 
              ? error.message 
              : String(error) || 'An unknown error occurred during task move';
            throw new Error(errorMessage);
        }
      },
      
      toggleTaskCompletion: async (taskListId: string, taskId: string, completed: boolean) => {
        get().optimisticToggleTaskCompletion(taskListId, taskId, completed);
        const { activeAccount } = get();
        if (!activeAccount) throw new Error("No active account");
        
        try {
            const response = await googleTasksService.updateTask(activeAccount, taskListId, taskId, {
                status: completed ? 'completed' : 'needsAction',
                completed: completed ? new Date().toISOString() : undefined
            });

            if (response.success && response.data) {
                // Update store to reflect the completion status change
                set(produce(draft => {
                    const column = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
                    if (column) {
                        const findAndToggle = (tasks: HierarchicalTask[]): boolean => {
                            for (const task of tasks) {
                                if (task.id === taskId) {
                                    task.status = completed ? 'completed' : 'needsAction';
                                    task.completed = completed ? new Date().toISOString() : undefined;
                                    return true;
                                }
                                if (task.children && findAndToggle(task.children)) {
                                    return true;
                                }
                            }
                            return false;
                        };
                        findAndToggle(column.tasks);
                    }
                }));
            } else {
                // Handle GoogleApiError objects properly
                const errorMessage = typeof response.error === 'object' && response.error?.message 
                  ? response.error.message 
                  : response.error || 'Failed to toggle task completion';
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error("Failed to toggle task completion:", error);
            // Revert optimistic update on failure
            get().optimisticToggleTaskCompletion(taskListId, taskId, !completed);
            // Handle GoogleApiError objects properly
            const errorMessage = typeof error === 'object' && error?.message 
              ? error.message 
              : String(error) || 'An unknown error occurred during task completion toggle';
            throw new Error(errorMessage);
        }
      },

      optimisticMoveTask: (taskId: string, fromListId: string, toListId: string) => {
        set(produce(draft => {
            const fromColumn = draft.kanbanColumns.find(c => c.taskList.id === fromListId);
            const toColumn = draft.kanbanColumns.find(c => c.taskList.id === toListId);

            // FIXED: Avoid explicit return - restructure with if block instead
            if (fromColumn && toColumn) {
                let taskToMove: HierarchicalTask | null = null;
                const findAndRemove = (tasks: HierarchicalTask[], id: string): HierarchicalTask[] => {
                    return tasks.filter(task => {
                        if (task.id === id) {
                            taskToMove = task;
                            return false;
                        }
                        if (task.children) {
                            task.children = findAndRemove(task.children, id);
                        }
                        return true;
                    });
                };
                
                fromColumn.tasks = findAndRemove(fromColumn.tasks, taskId);
                
                if (taskToMove) {
                    // Mark as pending sync with operation ID
                    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    draft.taskSyncState.set(taskId, {
                        status: 'pending',
                        originalListId: fromListId,
                        targetListId: toListId,
                        retryCount: 0,
                        operationId,
                        originalTask: taskToMove
                    });
                    
                    toColumn.tasks.push(taskToMove);
                    draft.taskIdToListId.set(taskId, toListId);
                }
            }
        }));
      },

      optimisticReorderTask: (taskListId: string, activeId: string, overId: string) => {
        set(produce(draft => {
            const column = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
            
            // FIXED: Avoid explicit return - restructure with if block instead
            if (column) {
                let activeTask: HierarchicalTask | null = null;
                
                const findAndRemove = (tasks: HierarchicalTask[]): HierarchicalTask[] => {
                    return tasks.filter(task => {
                        if (task.id === activeId) {
                            activeTask = task;
                            return false;
                        }
                        if (task.children) {
                            task.children = findAndRemove(task.children);
                        }
                        return true;
                    });
                };

                const findAndInsert = (tasks: HierarchicalTask[]): boolean => {
                    for(let i = 0; i < tasks.length; i++) {
                        if (tasks[i].id === overId) {
                            tasks.splice(i, 0, activeTask!);
                            return true;
                        }
                        if (tasks[i].children && findAndInsert(tasks[i].children)) {
                            return true;
                        }
                    }
                    return false;
                };

                column.tasks = findAndRemove(column.tasks);
                if (activeTask) {
                    if(!findAndInsert(column.tasks)) {
                        // if overId was not found (e.g. dragging over column), add to end
                        column.tasks.push(activeTask);
                    }
                }
            }
        }));
      },

      optimisticUpdateTask: (taskListId: string, taskId: string, updates: Partial<any>) => {
        set(produce(draft => {
          // If we're clearing unsynced flag, update sync state
          if ('unsynced' in updates && !updates.unsynced) {
            const syncState = draft.taskSyncState.get(taskId);
            if (syncState) {
              draft.taskSyncState.set(taskId, {
                ...syncState,
                status: 'synced'
              });
            }
          }
          
          // FIXED: Search in the specified taskListId first, then fall back to other columns
          const findAndUpdate = (tasks: HierarchicalTask[]): boolean => {
            for (let i = 0; i < tasks.length; i++) {
              if (tasks[i].id === taskId) {
                // Use spread pattern for Immer compatibility
                tasks[i] = { ...tasks[i], ...updates };
                return true;
              }
              if (tasks[i].children && findAndUpdate(tasks[i].children)) {
                return true;
              }
            }
            return false;
          };

          // First, try to find and update in the specified column
          const targetColumn = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
          if (targetColumn && findAndUpdate(targetColumn.tasks)) {
            // Update taskIdToListId map to ensure consistency
            draft.taskIdToListId.set(taskId, taskListId);
            return; // Found and updated, exit early
          }
          
          // If not found in target column, search other columns as fallback
          for (const column of draft.kanbanColumns) {
            if (column.taskList.id === taskListId) continue; // Skip already checked column
            
            if (findAndUpdate(column.tasks)) {
              // Update taskIdToListId map to reflect actual location
              draft.taskIdToListId.set(taskId, column.taskList.id);
              break;
            }
          }
        }));
      },
      
      optimisticToggleTaskCompletion: (taskListId: string, taskId: string, completed: boolean) => {
          set(produce(draft => {
              const column = draft.kanbanColumns.find(c => c.taskList.id === taskListId);
              
              // FIXED: Avoid explicit return - restructure with if block instead
              if (column) {
                  const findAndToggle = (tasks: HierarchicalTask[]) => {
                      for (const task of tasks) {
                          if (task.id === taskId) {
                              task.status = completed ? 'completed' : 'needsAction';
                              task.completed = completed ? new Date().toISOString() : undefined;
                              return true;
                          }
                          if (task.children && findAndToggle(task.children)) {
                              return true;
                          }
                      }
                      return false;
                  };

                  findAndToggle(column.tasks);
              }
          }));
      },
      
      createSubtask: async (taskListId: string, parentTaskId: string, taskData: TaskCreateData) => {
          const { activeAccount } = get();
          if (!activeAccount) return;

          try {
            console.log('Creating subtask with data:', taskData, 'for parent:', parentTaskId);
            
            // Create subtask with parent reference
            const subtaskData: TaskCreateData = {
              ...taskData,
              parent: parentTaskId
            };
            
            await get().createTask(taskListId, subtaskData);
          } catch (error) {
            console.error('Error creating subtask:', error);
          }
      },

      // Task list management
      updateTaskList: async (taskListId: string, title: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        try {
          const response = await googleTasksService.updateTaskList(activeAccount, taskListId, title);
          if (response.success && response.data) {
            console.log('Task list updated successfully:', response.data);
            // Refresh task lists to get updated data
            await get().fetchTaskLists();
          }
        } catch (error) {
          console.error('Error updating task list:', error);
          throw error;
        }
      },

      deleteTaskList: async (taskListId: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        try {
          const response = await googleTasksService.deleteTaskList(activeAccount, taskListId);
          if (response.success) {
            console.log('Task list deleted successfully');
            // Refresh task lists to get updated data
            await get().fetchTaskLists();
          }
        } catch (error) {
          console.error('Error deleting task list:', error);
          throw error;
        }
      },

      archiveTaskList: async (taskListId: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        try {
          const response = await googleTasksService.archiveTaskList(activeAccount, taskListId);
          if (response.success) {
            console.log('Task list archived successfully');
            // Refresh task lists to get updated data
            await get().fetchTaskLists();
          }
        } catch (error) {
          console.error('Error archiving task list:', error);
          throw error;
        }
      },

      createTaskList: async (title: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        try {
          const response = await googleTasksService.createTaskList(activeAccount, title);
          if (response.success && response.data) {
            console.log('Task list created successfully:', response.data);
            // Refresh task lists to get updated data
            await get().fetchTaskLists();
          }
        } catch (error) {
          console.error('Error creating task list:', error);
          throw error;
        }
      },

      // Calendar actions
      fetchCalendarEvents: async (timeMin?: string, timeMax?: string) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        set(produce(draft => { draft.isLoadingCalendar = true; }));
        try {
          const response = await googleCalendarService.getEvents(activeAccount, 'primary', timeMin, timeMax);
          if (response.success && response.data) {
            set(produce(draft => { draft.calendarEvents = response.data.items || []; }));
          }
        } catch (error) {
          console.error('Error fetching calendar events:', error);
        } finally {
          set(produce(draft => { draft.isLoadingCalendar = false; }));
        }
      },

      createCalendarEvent: async (eventData: any) => {
        const { activeAccount } = get();
        if (!activeAccount) return;

        try {
          const response = await googleCalendarService.createEvent(activeAccount, eventData);
          if (response.success && response.data) {
            set((state) => ({
              calendarEvents: [...state.calendarEvents, response.data!]
            }));
          }
        } catch (error) {
          console.error('Error creating calendar event:', error);
        }
      },

      // Drag and drop
      setDraggedTask: (task) => set(produce(draft => { draft.draggedTask = task; })),

      // Utility
      clearData: () => set(produce(draft => {
        draft.accounts = [];
        draft.activeAccount = null;
        draft.taskLists = [];
        draft.kanbanColumns = [];
        draft.taskIdToListId = new Map();
        draft.calendarEvents = [];
        draft.draggedTask = null;
        draft.lastUpdateTime = 0;
      })),
    }),
    {
      name: 'google-store',
    }
  )
); 
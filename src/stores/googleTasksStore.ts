import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GoogleAccount, GoogleTask, GoogleTaskList, TaskCreateData } from '../types/google';
import { googleTasksService } from '../services/google/googleTasksService';
import { useSettingsStore } from './settingsStore';

interface GoogleTasksState {
  // Authentication
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Data
  taskLists: GoogleTaskList[];
  tasks: Record<string, GoogleTask[]>; // taskListId -> tasks[]
  
  // UI State
  isLoading: boolean;
  isLoadingTasks: Record<string, boolean>; // taskListId -> loading state
  error: string | null;
  lastSyncAt: Date | null;
}

interface GoogleTasksActions {
  // Authentication
  authenticate: (account: GoogleAccount) => void;
  signOut: () => void;
  getCurrentAccount: () => GoogleAccount | null;
  
  // Data fetching
  fetchTaskLists: (accountId?: string) => Promise<void>;
  fetchTasks: (taskListId: string, accountId?: string) => Promise<void>;
  syncAllTasks: () => Promise<void>;
  
  // Task management
  createTask: (taskListId: string, taskData: TaskCreateData) => Promise<void>;
  updateTask: (taskListId: string, taskId: string, updates: Partial<GoogleTask>) => Promise<void>;
  deleteTask: (taskListId: string, taskId: string) => Promise<void>;
  moveTask: (taskId: string, fromListId: string, toListId: string, position?: string) => Promise<void>;
  toggleTaskComplete: (taskListId: string, taskId: string, completed: boolean) => Promise<void>;
  
  // Task list management
  createTaskList: (title: string) => Promise<void>;
  updateTaskList: (taskListId: string, title: string) => Promise<void>;
  deleteTaskList: (taskListId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  getTaskList: (taskListId: string) => GoogleTaskList | undefined;
  getTask: (taskListId: string, taskId: string) => GoogleTask | undefined;
}

type GoogleTasksStore = GoogleTasksState & GoogleTasksActions;

const initialState: GoogleTasksState = {
  isAuthenticated: false,
  isHydrated: false,
  taskLists: [],
  tasks: {},
  isLoading: false,
  isLoadingTasks: {},
  error: null,
  lastSyncAt: null,
};

export const useGoogleTasksStore = create<GoogleTasksStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Helper to get current account
        getCurrentAccount: (): GoogleAccount | null => {
          const settingsState = useSettingsStore.getState();
          const account = settingsState.integrations.googleAccounts.find(acc => acc.isActive);
          return account ? account as unknown as GoogleAccount : null;
        },

        // Authentication
        authenticate: (account: GoogleAccount) => {
          console.log('🔐 [GOOGLE-TASKS] Authenticating account:', account.email);
          set({ isAuthenticated: true });
          
          // Auto-fetch task lists after authentication
          get().fetchTaskLists(account.id);
        },

        signOut: () => {
          console.log('🚪 [GOOGLE-TASKS] Signing out');
          set((state) => {
            state.isAuthenticated = false;
            state.taskLists = [];
            state.tasks = {};
            state.error = null;
          });
        },

        // Data fetching
        fetchTaskLists: async (accountId?: string) => {
          const account = accountId ? useSettingsStore.getState().integrations.googleAccounts.find(a => a.id === accountId) : get().getCurrentAccount();
          if (!account) {
            set({ error: 'No authenticated account found' });
            return;
          }
          set({ isLoading: true, error: null });
          try {
            console.log('📝 [GOOGLE-TASKS] Fetching task lists for:', account.email);
            const response = await googleTasksService.getTaskLists(account);
            if (response.success && response.data) {
              console.log('✅ [GOOGLE-TASKS] Setting task lists:', response.data.length);
              set({ taskLists: response.data });
            } else {
              throw new Error(response.error?.message || 'Failed to fetch task lists');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to fetch task lists:', error);
            set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
          } finally {
            set({ isLoading: false });
          }
        },

        fetchTasks: async (taskListId: string, accountId?: string) => {
          const account = accountId ? useSettingsStore.getState().integrations.googleAccounts.find(a => a.id === accountId) : get().getCurrentAccount();
          if (!account) {
            set({ error: 'No authenticated account found' });
            return;
          }
          set({ isLoading: true, error: null });
          try {
            console.log(`✅ [GOOGLE-TASKS] Fetching tasks for list: ${taskListId}`);
            const response = await googleTasksService.getTasks(account, taskListId);
            if (response.success && response.data) {
              set((state) => {
                state.tasks[taskListId] = response.data!.items || [];
              });
            } else {
              throw new Error(response.error?.message || 'Failed to fetch tasks');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to fetch tasks:', error);
            set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
          } finally {
            set({ isLoading: false });
          }
        },

        syncAllTasks: async () => {
          const taskLists = get().taskLists;
          if (taskLists.length === 0) {
            await get().fetchTaskLists();
            return;
          }

          console.log('🔄 [GOOGLE-TASKS] Syncing all task lists');
          await Promise.all(
            taskLists.map(list => get().fetchTasks(list.id))
          );
        },

        // Task management
        createTask: async (taskListId: string, taskData: TaskCreateData) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`➕ [GOOGLE-TASKS] Creating task in list ${taskListId}:`, taskData.title);
            const response = await googleTasksService.createTask(account, taskListId, {
              title: taskData.title,
              notes: taskData.notes,
              due: taskData.due,
            });

            if (response.success && response.data) {
              set((state) => {
                if (!state.tasks[taskListId]) {
                  state.tasks[taskListId] = [];
                }
                state.tasks[taskListId].unshift(response.data!);
              });
            } else {
              throw new Error(response.error?.message || 'Failed to create task');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to create task:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to create task';
            });
          }
        },

        updateTask: async (taskListId: string, taskId: string, updates: Partial<GoogleTask>) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`✏️ [GOOGLE-TASKS] Updating task ${taskId} in list ${taskListId}`);
            const response = await googleTasksService.updateTask(account, taskListId, taskId, {
              title: updates.title,
              notes: updates.notes,
              status: updates.status,
              due: updates.due,
            });

            if (response.success && response.data) {
              set((state) => {
                const tasks = state.tasks[taskListId] || [];
                const index = tasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                  state.tasks[taskListId][index] = response.data!;
                }
              });
            } else {
              throw new Error(response.error?.message || 'Failed to update task');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to update task:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update task';
            });
          }
        },

        deleteTask: async (taskListId: string, taskId: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`🗑️ [GOOGLE-TASKS] Deleting task ${taskId} from list ${taskListId}`);
            const response = await googleTasksService.deleteTask(account, taskListId, taskId);

            if (response.success) {
              set((state) => {
                state.tasks[taskListId] = (state.tasks[taskListId] || []).filter(t => t.id !== taskId);
              });
            } else {
              throw new Error(response.error?.message || 'Failed to delete task');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to delete task:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to delete task';
            });
          }
        },

        moveTask: async (taskId: string, fromListId: string, toListId: string, position?: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`🔄 [GOOGLE-TASKS] Moving task ${taskId} from ${fromListId} to ${toListId}`);
            
            // If moving within the same list, just update position
            if (fromListId === toListId) {
              const response = await googleTasksService.moveTask(account, {
                taskId,
                taskListId: toListId,
                previous: position,
              });

              if (response.success && response.data) {
                set((state) => {
                  const tasks = state.tasks[toListId] || [];
                  const index = tasks.findIndex(t => t.id === taskId);
                  if (index !== -1) {
                    state.tasks[toListId][index] = response.data!;
                  }
                });
              }
            } else {
              // Moving between lists requires delete + create
              const task = get().getTask(fromListId, taskId);
              if (task) {
                await get().deleteTask(fromListId, taskId);
                await get().createTask(toListId, {
                  title: task.title,
                  notes: task.notes,
                  due: task.due,
                });
              }
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to move task:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to move task';
            });
          }
        },

        toggleTaskComplete: async (taskListId: string, taskId: string, completed: boolean) => {
          await get().updateTask(taskListId, taskId, {
            status: completed ? 'completed' : 'needsAction',
            completed: completed ? new Date().toISOString() : undefined,
          });
        },

        // Task list management
        createTaskList: async (title: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`📋 [GOOGLE-TASKS] Creating task list: ${title}`);
            const response = await googleTasksService.createTaskList(account, title);

            if (response.success && response.data) {
              set((state) => {
                state.taskLists.push(response.data!);
                state.tasks[response.data!.id] = [];
              });
            } else {
              throw new Error(response.error?.message || 'Failed to create task list');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to create task list:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to create task list';
            });
          }
        },

        updateTaskList: async (taskListId: string, title: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`✏️ [GOOGLE-TASKS] Updating task list ${taskListId}: ${title}`);
            const response = await googleTasksService.updateTaskList(account, taskListId, title);

            if (response.success && response.data) {
              set((state) => {
                const index = state.taskLists.findIndex(list => list.id === taskListId);
                if (index !== -1) {
                  state.taskLists[index] = response.data!;
                }
              });
            } else {
              throw new Error(response.error?.message || 'Failed to update task list');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to update task list:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update task list';
            });
          }
        },

        deleteTaskList: async (taskListId: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`🗑️ [GOOGLE-TASKS] Deleting task list: ${taskListId}`);
            const response = await googleTasksService.deleteTaskList(account, taskListId);

            if (response.success) {
              set((state) => {
                state.taskLists = state.taskLists.filter(list => list.id !== taskListId);
                delete state.tasks[taskListId];
              });
            } else {
              throw new Error(response.error?.message || 'Failed to delete task list');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-TASKS] Failed to delete task list:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to delete task list';
            });
          }
        },

        // Utility
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        getTaskList: (taskListId: string) => {
          return get().taskLists.find(list => list.id === taskListId);
        },

        getTask: (taskListId: string, taskId: string) => {
          const tasks = get().tasks[taskListId] || [];
          return tasks.find(task => task.id === taskId);
        },
      })),
      {
        name: 'google-tasks-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          taskLists: state.taskLists,
          tasks: state.tasks,
          lastSyncAt: state.lastSyncAt,
        }),
        onRehydrateStorage: () => (state) => {
          console.log('🔄 [GOOGLE-TASKS] Store hydrated from localStorage');
          if (state) {
            state.isHydrated = true;
          }
        },
      }
    )
  )
);

// Fallback hydration
setTimeout(() => {
  const state = useGoogleTasksStore.getState();
  if (!state.isHydrated) {
    console.log('🔄 [GOOGLE-TASKS] Manual hydration fallback triggered');
    useGoogleTasksStore.setState({ isHydrated: true });
  }
}, 100); 
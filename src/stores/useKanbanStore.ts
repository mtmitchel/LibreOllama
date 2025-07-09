import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TaskMetadata {
  labels: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    due?: string;
  }>;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

interface KanbanTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  position: string;
  updated: string;
  metadata?: TaskMetadata;
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  isLoading: boolean;
  error?: string;
}

interface KanbanStore {
  columns: KanbanColumn[];
  isSyncing: boolean;
  isInitialized: boolean;
  error?: string;
  
  // Core operations
  initialize(): Promise<void>;
  addColumn(columnId: string, title: string): void;
  loadColumns(): Promise<void>;
  loadTasks(columnId: string): Promise<void>;
  
  // Task operations
  createTask(columnId: string, data: { 
    title: string; 
    notes?: string; 
    due?: string; 
    metadata?: TaskMetadata 
  }): Promise<void>;
  
  updateTask(columnId: string, taskId: string, updates: Partial<KanbanTask> & { 
    metadata?: TaskMetadata 
  }): Promise<void>;
  
  moveTask(taskId: string, fromColumn: string, toColumn: string, position?: string): Promise<void>;
  toggleComplete(columnId: string, taskId: string, completed: boolean): Promise<void>;
  deleteTask(columnId: string, taskId: string): Promise<void>;
  
  // Utility
  getTask(taskId: string): { task: KanbanTask; columnId: string } | null;
  clearError(): void;
}

const useKanbanStore = create<KanbanStore>()(
  devtools((set, get) => {
    // LocalStorage persistence
    const STORAGE_KEY = 'kanban-tasks-data';
    
    const saveToStorage = (columns: KanbanColumn[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    };

    const loadFromStorage = (): KanbanColumn[] => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
      return [];
    };



    return {
      columns: [],
      isSyncing: false,
      isInitialized: false,
      error: undefined,

      async initialize() {
        if (get().isInitialized) return;
        
        try {
          // First try to load from localStorage
          const storedColumns = loadFromStorage();
          if (storedColumns.length > 0) {
            set({ columns: storedColumns, isInitialized: true });
            return;
          }
          
          // If no stored data, create default columns
          const defaultColumns: KanbanColumn[] = [
            { id: 'todo', title: 'To Do', tasks: [], isLoading: false },
            { id: 'in-progress', title: 'In Progress', tasks: [], isLoading: false },
            { id: 'done', title: 'Done', tasks: [], isLoading: false }
          ];
          
          set({ columns: defaultColumns, isInitialized: true });
          saveToStorage(defaultColumns);
        } catch (error) {
          console.error('Failed to initialize kanban board:', error);
          set({ error: 'Failed to initialize kanban board' });
        }
      },

      addColumn(id, title) {
        const newColumns = [...get().columns, { id, title, tasks: [], isLoading: false }];
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      async loadColumns() {
        // This method is now mainly for backwards compatibility
        // The initialize method handles loading from localStorage
        try {
          const storedColumns = loadFromStorage();
          if (storedColumns.length > 0) {
            set({ columns: storedColumns });
            return;
          }
          
          // If no stored data, use the mock service as fallback
          // const mockAccount = createMockAccount();
          // const lists = await googleTasksService.getTaskLists(mockAccount);
          
          // if (lists.success && lists.data) {
          //   const columns = lists.data.map(list => ({
          //     id: list.id,
          //     title: list.title,
          //     tasks: [],
          //     isLoading: false
          //   }));
            
          //   set({ columns });
          //   saveToStorage(columns);
            
          //   // Load tasks for each column
          //   await Promise.all(
          //     lists.data.map(list => get().loadTasks(list.id))
          //   );
          // }
        } catch (error) {
          console.error('Failed to load task lists:', error);
          set({ error: 'Failed to load task lists' });
        }
      },

      async loadTasks(columnId) {
        // Set loading state
        const loadingColumns = get().columns.map(c =>
          c.id === columnId ? { ...c, isLoading: true } : c
        );
        set({ columns: loadingColumns });

        try {
          // For now, just clear loading state since we're using localStorage
          const finalColumns = get().columns.map(c =>
            c.id === columnId ? { ...c, isLoading: false, error: undefined } : c
          );
          set({ columns: finalColumns });
          saveToStorage(finalColumns);
        } catch (error) {
          const errorColumns = get().columns.map(c =>
            c.id === columnId 
              ? { ...c, isLoading: false, error: 'Failed to load tasks' }
              : c
          );
          set({ columns: errorColumns });
          saveToStorage(errorColumns);
        }
      },

      async createTask(columnId, data) {
        const tempId = `temp-${Date.now()}`;
        
        // Optimistic UI update
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? { 
                ...c, 
                tasks: [...c.tasks, { 
                  id: tempId,
                  title: data.title,
                  notes: data.notes || '',
                  due: data.due,
                  status: 'needsAction' as const,
                  position: String(c.tasks.length),
                  updated: new Date().toISOString(),
                  metadata: data.metadata
                }] 
              }
            : c
        );
        
        set({ columns: newColumns });
        saveToStorage(newColumns);

        // Generate a permanent ID and update the task
        setTimeout(() => {
          const permanentId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const updatedColumns = get().columns.map(c =>
            c.id === columnId
              ? {
                  ...c,
                  tasks: c.tasks.map(t =>
                    t.id === tempId ? { ...t, id: permanentId } : t
                  )
                }
              : c
          );
          set({ columns: updatedColumns });
          saveToStorage(updatedColumns);
        }, 100);
      },

      async updateTask(columnId, taskId, updates) {
        
        // Optimistic update
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? {
                ...c,
                tasks: c.tasks.map(t => 
                  t.id === taskId 
                    ? { ...t, ...updates, updated: new Date().toISOString() }
                    : t
                )
              }
            : c
        );
        
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      async moveTask(taskId, fromColumn, toColumn, position) {
        const task = get().getTask(taskId);
        
        if (!task) {
          set({ error: 'Task not found' });
          return;
        }

        // Optimistic move
        const newColumns = get().columns.map(c => {
          if (c.id === fromColumn) {
            return { ...c, tasks: c.tasks.filter(t => t.id !== taskId) };
          }
          if (c.id === toColumn) {
            const newTasks = [...c.tasks];
            const insertIndex = position ? parseInt(position) : newTasks.length;
            newTasks.splice(insertIndex, 0, { ...task.task, position: String(insertIndex) });
            return { ...c, tasks: newTasks };
          }
          return c;
        });
        
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      async toggleComplete(columnId, taskId, completed) {
        await get().updateTask(columnId, taskId, { 
          status: completed ? 'completed' : 'needsAction' 
        });
      },

      async deleteTask(columnId, taskId) {
        
        // Optimistic removal
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) }
            : c
        );
        
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      getTask(taskId) {
        const state = get();
        for (const column of state.columns) {
          const task = column.tasks.find(t => t.id === taskId);
          if (task) {
            return { task, columnId: column.id };
          }
        }
        return null;
      },

      clearError() {
        set({ error: undefined });
      }
    };
  })
);

export { useKanbanStore };
export type { KanbanTask, KanbanColumn, TaskMetadata };
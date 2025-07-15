import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '../core/lib/logger';

export interface TaskMetadata {
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

export interface KanbanTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  position: string;
  updated: string;
  metadata?: TaskMetadata;
  projectId?: string; // New field for project association
}

export interface KanbanColumn {
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
  }): Promise<KanbanTask>;
  
  updateTask(columnId: string, taskId: string, updates: Partial<KanbanTask> & { 
    metadata?: TaskMetadata 
  }): Promise<void>;
  
  moveTask(taskId: string, fromColumn: string, toColumn: string, position?: string): Promise<void>;
  toggleComplete(columnId: string, taskId: string, completed: boolean): Promise<void>;
  deleteTask(columnId: string, taskId: string): Promise<void>;
  
  // Utility
  getTask(taskId: string): { task: KanbanTask; columnId: string } | null;
  clearError(): void;
  clearAllData(): void;

  // Project association methods
  assignTaskToProject(taskId: string, projectId: string): void;
  removeTaskFromProject(taskId: string): void;
  getTasksByProject(projectId: string): KanbanTask[];
  getUnassignedTasks(): KanbanTask[];
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
        const existingColumn = get().columns.find(c => c.id === id);
        if (existingColumn) {
          // Column already exists, don't add duplicate
          return;
        }
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
          
          // If no stored data, create default empty columns
          const defaultColumns: KanbanColumn[] = [
            { id: 'todo', title: 'To Do', tasks: [], isLoading: false },
            { id: 'in-progress', title: 'In Progress', tasks: [], isLoading: false },
            { id: 'done', title: 'Done', tasks: [], isLoading: false }
          ];
          
          set({ columns: defaultColumns });
          saveToStorage(defaultColumns);
        } catch (error) {
          console.error('Failed to load task lists:', error);
          set({ error: 'Failed to load task lists' });
        }
      },

      async loadTasks(columnId) {
        // Kanban board currently uses localStorage for persistence.
        // Future Enhancement: Integrate with backend task management system for actual asynchronous task loading in Phase 3.x
        
        // Set loading state (simulated for now)
        const loadingColumns = get().columns.map(c =>
          c.id === columnId ? { ...c, isLoading: true } : c
        );
        set({ columns: loadingColumns });

        try {
          // Simulate a network request
          await new Promise(resolve => setTimeout(resolve, 300)); 

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
        // Generate permanent ID immediately for reliable testing
        const permanentId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create task with permanent ID
        const newTask: KanbanTask = {
          id: permanentId,
          title: data.title,
          notes: data.notes || '',
          due: data.due,
          status: 'needsAction' as const,
          position: String(get().columns.find(c => c.id === columnId)?.tasks.length || 0),
          updated: new Date().toISOString(),
          metadata: data.metadata
        };
        
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? { 
                ...c, 
                tasks: [...c.tasks, newTask] 
              }
            : c
        );
        
        set({ columns: newColumns });
        saveToStorage(newColumns);
        
        return newTask;
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
      },

      clearAllData() {
        try {
          // Clear localStorage
          localStorage.removeItem(STORAGE_KEY);
          
          // Reset store to initial state with empty columns
          const emptyColumns: KanbanColumn[] = [
            { id: 'todo', title: 'To Do', tasks: [], isLoading: false },
            { id: 'in-progress', title: 'In Progress', tasks: [], isLoading: false },
            { id: 'done', title: 'Done', tasks: [], isLoading: false }
          ];
          
          set({ 
            columns: emptyColumns, 
            isInitialized: true, 
            error: undefined,
            isSyncing: false 
          });
          
          // Save empty state to localStorage
          saveToStorage(emptyColumns);
          
          logger.debug('[KANBAN] All mock data cleared successfully');
        } catch (error) {
                      logger.error('[KANBAN] Failed to clear data:', error);
          set({ error: 'Failed to clear data' });
        }
      },

      // Project association methods
      assignTaskToProject(taskId, projectId) {
        const newColumns = get().columns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === taskId ? { ...task, projectId } : task
          )
        }));
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      removeTaskFromProject(taskId) {
        const newColumns = get().columns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === taskId ? { ...task, projectId: undefined } : task
          )
        }));
        set({ columns: newColumns });
        saveToStorage(newColumns);
      },

      getTasksByProject(projectId) {
        return get().columns.flatMap(c => c.tasks).filter(t => t.projectId === projectId);
      },

      getUnassignedTasks() {
        return get().columns.flatMap(c => c.tasks).filter(t => !t.projectId);
      }
    };
  })
);

export { useKanbanStore };
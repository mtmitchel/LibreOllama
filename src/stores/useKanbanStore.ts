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

}

const useKanbanStore = create<KanbanStore>()(
  devtools((set, get) => {


    return {
      columns: [],
      isSyncing: false,
      isInitialized: false,
      error: undefined,

      async initialize() {
        if (get().isInitialized) return;
        
        // Don't create default columns - let Google Tasks sync handle it
        // Just mark as initialized with empty columns
        set({ columns: [], isInitialized: true });
      },

      addColumn(id, title) {
        const existingColumn = get().columns.find(c => c.id === id);
        if (existingColumn) {
          // Column already exists, don't add duplicate
          return;
        }
        const newColumns = [...get().columns, { id, title, tasks: [], isLoading: false }];
        set({ columns: newColumns });
      },

      async loadColumns() {
        // Don't create default columns - let Google Tasks sync handle it
        set({ columns: [] });
      },

      async loadTasks(columnId) {
        // Tasks are now loaded via Google Tasks sync
        // This method is kept for compatibility but doesn't do anything
        logger.debug('[KANBAN] loadTasks called for:', columnId);
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
        // Reset store to initial state with NO columns
        // Google Tasks sync will create the appropriate columns
        set({ 
          columns: [], 
          isInitialized: true, 
          error: undefined,
          isSyncing: false 
        });
        
        logger.debug('[KANBAN] All data cleared successfully');
      }
    };
  })
);

export { useKanbanStore };
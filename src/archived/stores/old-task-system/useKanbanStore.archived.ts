import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { logger } from '../core/lib/logger';
import { useGoogleTasksStore } from './googleTasksStore';
import { useTaskMetadataStore } from './taskMetadataStore';

import { TaskMetadata } from './taskMetadataStore';

export interface KanbanTask {
  id: string; // This can be a temporary ID or the Google Task ID
  googleTaskId?: string; // This is the permanent ID from Google
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  position: string;
  updated: string;
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
  devtools(
    persist(
      (set, get) => ({
      columns: [],
      isSyncing: false,
      isInitialized: false,
      error: undefined,

      async initialize() {
        const state = get();
        if (state.isInitialized) return;
        
        // Check if we have old hardcoded columns
        const hasHardcodedColumns = state.columns.some(
          c => c.id === 'todo' || c.id === 'in-progress' || c.id === 'done'
        );
        
        if (hasHardcodedColumns) {
          // Clear old hardcoded columns to let Google Tasks take over
          set({ columns: [], isInitialized: true });
        } else if (state.columns.length === 0) {
          // Only create default columns if no Google sync available
          // This will be replaced by Google Task lists when sync runs
          set({ columns: [], isInitialized: true });
        } else {
          // Just mark as initialized if columns already exist (from localStorage)
          set({ isInitialized: true });
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
        // Generate a temporary ID for local-only tasks
        const tempId = `temp-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newTask: KanbanTask = {
          id: tempId,
          googleTaskId: data.googleTaskId,
          title: data.title,
          notes: data.notes || '',
          due: data.due,
          status: 'needsAction' as const,
          position: String(get().columns.find(c => c.id === columnId)?.tasks.length || 0),
          updated: new Date().toISOString(),
        };

        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? {
                ...c,
                tasks: [...c.tasks, newTask],
              }
            : c
        );

        set({ columns: newColumns });

        // Queue background sync
        setTimeout(async () => {
          try {
            const googleTasksStore = useGoogleTasksStore.getState();
            
            // Check if we have a Google Task List ID for this column
            const googleListId = columnId; // Assuming columnId maps to Google Task List ID
            
            if (googleListId && googleTasksStore.isAuthenticated) {
              const googleTask = await googleTasksStore.createTask(googleListId, {
                title: newTask.title,
                notes: newTask.notes,
                due: newTask.due
              });
              
              if (googleTask && googleTask.id) {
                // Update with permanent ID
                get().updateTask(columnId, tempId, { 
                  id: googleTask.id, 
                  googleTaskId: googleTask.id 
                });
                
                // Migrate metadata - preserve all fields
                const metadataStore = useTaskMetadataStore.getState();
                const tempMetadata = metadataStore.metadata[tempId];
                if (tempMetadata) {
                  // Copy all metadata to the new Google ID
                  metadataStore.setTaskMetadata(googleTask.id, {
                    ...tempMetadata,
                    taskId: googleTask.id  // Update the taskId field
                  });
                  // Remove the temporary metadata entry
                  metadataStore.deleteTaskMetadata(tempId);
                  logger.debug(`[KANBAN] Migrated metadata from ${tempId} to ${googleTask.id}`);
                }
              }
            }
          } catch (error) {
            console.error('Sync failed for new task:', error);
            set({ error: 'Failed to sync new task' });
          }
        }, 0);  // Non-blocking

        return newTask;
      },

      async updateTask(columnId, taskId, updates) {
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? {
                ...c,
                tasks: c.tasks.map(t => {
                  if (t.id === taskId || t.googleTaskId === taskId) {
                    return { ...t, ...updates, updated: new Date().toISOString() };
                  }
                  return t;
                }),
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
        // Get the task to find its Google ID
        const task = get().columns.find(c => c.id === columnId)?.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Optimistic removal
        const newColumns = get().columns.map(c =>
          c.id === columnId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) }
            : c
        );
        
        set({ columns: newColumns });
        
        // Delete from Google Tasks if it has a Google ID
        if (task.googleTaskId) {
          try {
            const googleTasksStore = useGoogleTasksStore.getState();
            await googleTasksStore.deleteTask(columnId, task.googleTaskId);
          } catch (error) {
            console.error('Failed to delete from Google Tasks:', error);
            // Restore the task on error
            set((state) => ({
              columns: state.columns.map(c =>
                c.id === columnId
                  ? { ...c, tasks: [...c.tasks, task] }
                  : c
              )
            }));
            throw error;
          }
        } else {
          // For local-only tasks, clean up metadata
          const metadataStore = useTaskMetadataStore.getState();
          metadataStore.deleteTaskMetadata(taskId);
        }
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
    }),
      {
        name: 'kanban-store', // localStorage key
        partialize: (state) => ({ 
          columns: state.columns,
          isInitialized: state.isInitialized 
        }), // Only persist columns and initialization state
      }
    )
  )
);

export { useKanbanStore };
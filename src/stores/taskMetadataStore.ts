import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TaskMetadata {
  taskId: string;
  labels: string[];
  priority: 'low' | 'normal' | 'high';
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    due: string;
  }>;
  recurring: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate: string;
  };
  lastUpdated: number;
}

interface TaskMetadataStore {
  metadata: Map<string, TaskMetadata>;
  
  // Actions
  setTaskMetadata: (taskId: string, metadata: Partial<TaskMetadata>) => void;
  getTaskMetadata: (taskId: string) => TaskMetadata | null;
  deleteTaskMetadata: (taskId: string) => void;
  clearAllMetadata: () => void;
  
  // Bulk operations
  importFromNotesField: (taskId: string, notes: string) => void;
  exportToNotesField: (taskId: string) => string;
}

export const useTaskMetadataStore = create<TaskMetadataStore>()(
  persist(
    (set, get) => ({
      metadata: new Map(),
      
      setTaskMetadata: (taskId: string, updates: Partial<TaskMetadata>) => {
        set(state => {
          const newMetadata = new Map(state.metadata);
          const existing = newMetadata.get(taskId);
          
          const updatedMetadata: TaskMetadata = {
            taskId,
            labels: updates.labels || existing?.labels || [],
            priority: updates.priority || existing?.priority || 'normal',
            subtasks: updates.subtasks || existing?.subtasks || [],
            recurring: updates.recurring || existing?.recurring || {
              enabled: false,
              frequency: 'weekly',
              interval: 1,
              endDate: ''
            },
            lastUpdated: Date.now()
          };
          
          newMetadata.set(taskId, updatedMetadata);
          
          return { metadata: newMetadata };
        });
      },
      
      getTaskMetadata: (taskId: string) => {
        const metadata = get().metadata.get(taskId);
        return metadata || null;
      },
      
      deleteTaskMetadata: (taskId: string) => {
        set(state => {
          const newMetadata = new Map(state.metadata);
          newMetadata.delete(taskId);
          return { metadata: newMetadata };
        });
      },
      
      clearAllMetadata: () => {
        set({ metadata: new Map() });
      },
      
      importFromNotesField: (taskId: string, notes: string) => {
        try {
          const match = notes.match(/\[LibreOllama:(.+)\]/);
          if (match) {
            const data = JSON.parse(match[1]);
            get().setTaskMetadata(taskId, {
              labels: data.labels || [],
              priority: data.priority || 'normal',
              subtasks: data.subtasks || [],
              recurring: data.recurring || {
                enabled: false,
                frequency: 'weekly',
                interval: 1,
                endDate: ''
              }
            });
          }
        } catch (error) {
          console.error(`Failed to import metadata for task ${taskId}:`, error);
        }
      },
      
      exportToNotesField: (taskId: string) => {
        const metadata = get().getTaskMetadata(taskId);
        if (!metadata) return '';
        
        const exportData = {
          labels: metadata.labels,
          priority: metadata.priority,
          subtasks: metadata.subtasks,
          recurring: metadata.recurring
        };
        
        return `[LibreOllama:${JSON.stringify(exportData)}]`;
      }
    }),
    {
      name: 'task-metadata-store',
      // Custom storage for Map serialization with safety checks
      storage: {
        getItem: (name) => {
          // Check if localStorage is available
          if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, returning null');
            return null;
          }
          
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            return {
              ...data,
              state: {
                ...data.state,
                metadata: new Map(data.state.metadata || [])
              }
            };
          } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          // Check if localStorage is available
          if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, skipping save');
            return;
          }
          
          try {
            const serialized = {
              ...value,
              state: {
                ...value.state,
                metadata: Array.from(value.state.metadata.entries())
              }
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error('Error writing to localStorage:', error);
          }
        },
        removeItem: (name) => {
          // Check if localStorage is available
          if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, skipping remove');
            return;
          }
          
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        },
      },
    }
  )
); 
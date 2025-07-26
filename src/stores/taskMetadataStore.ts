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
  metadata: Record<string, TaskMetadata>;
  
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
      metadata: {},
      
      setTaskMetadata: (taskId: string, updates: Partial<TaskMetadata>) => {
        console.log('=== SETTING METADATA ===');
        console.log('Task ID:', taskId);
        console.log('Updates:', updates);
        
        set(state => {
          const existing = state.metadata[taskId];
          
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
          
          return { 
            metadata: {
              ...state.metadata,
              [taskId]: updatedMetadata
            }
          };
        });
        
        console.log('New metadata state:', get().metadata);
        console.log('Metadata for this task:', get().metadata[taskId]);
      },
      
      getTaskMetadata: (taskId: string) => {
        return get().metadata[taskId] || null;
      },
      
      deleteTaskMetadata: (taskId: string) => {
        set(state => {
          const newMetadata = { ...state.metadata };
          delete newMetadata[taskId];
          return { metadata: newMetadata };
        });
      },
      
      clearAllMetadata: () => {
        set({ metadata: {} });
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
      // Now using default storage since we have plain objects
    }
  )
); 
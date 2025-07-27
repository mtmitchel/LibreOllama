import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface TaskMetadata {
  taskId: string;
  labels: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    due?: string;
  }>;
  recurring: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  deleted?: boolean;
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
    immer((set, get) => ({
      metadata: {},
      
      setTaskMetadata: (taskId: string, updates: Partial<TaskMetadata>) => {
        
        set(state => {
          const existing = state.metadata[taskId];
          
          // With Immer, we can directly mutate and it will create new references
          if (!existing) {
            // Create new metadata entry
            state.metadata[taskId] = {
              taskId,
              labels: [],
              priority: 'normal',
              subtasks: [],
              recurring: {
                enabled: false,
                frequency: 'weekly',
                interval: 1,
                endDate: undefined
              },
              lastUpdated: Date.now(),
              ...updates
            };
          } else {
            // Update existing metadata - Immer ensures new references
            if (updates.labels !== undefined) {
              existing.labels = updates.labels;
            }
            if (updates.priority !== undefined) {
              existing.priority = updates.priority;
            }
            if (updates.subtasks !== undefined) {
              existing.subtasks = updates.subtasks;
            }
            if (updates.recurring !== undefined) {
              existing.recurring = { ...existing.recurring, ...updates.recurring };
            }
            if (updates.deleted !== undefined) {
              existing.deleted = updates.deleted;
            }
            existing.lastUpdated = Date.now();
          }
        });
        
      },
      
      getTaskMetadata: (taskId: string) => {
        return get().metadata[taskId] || null;
      },
      
      deleteTaskMetadata: (taskId: string) => {
        set(state => {
          delete state.metadata[taskId];
        });
      },
      
      clearAllMetadata: () => {
        set(state => {
          state.metadata = {};
        });
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
    })),
    {
      name: 'task-metadata-store',
    }
  )
);
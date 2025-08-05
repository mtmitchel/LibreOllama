import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../core/lib/logger';

interface TaskMetadata {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // Add other metadata that might not persist properly
}

interface TaskMetadataState {
  metadata: Record<string, TaskMetadata>;
  setPriority: (taskId: string, priority: 'low' | 'normal' | 'high' | 'urgent') => void;
  getPriority: (taskId: string) => 'low' | 'normal' | 'high' | 'urgent';
  clearMetadata: (taskId: string) => void;
}

export const useTaskMetadataStore = create<TaskMetadataState>()(
  persist(
    (set, get) => ({
      metadata: {},
      
      setPriority: (taskId, priority) => {
        set(state => ({
          metadata: {
            ...state.metadata,
            [taskId]: {
              ...state.metadata[taskId],
              priority
            }
          }
        }));
        logger.debug('[TaskMetadata] Set priority', { taskId, priority });
      },
      
      getPriority: (taskId) => {
        const metadata = get().metadata[taskId];
        return metadata?.priority || 'normal';
      },
      
      clearMetadata: (taskId) => {
        set(state => {
          const newMetadata = { ...state.metadata };
          delete newMetadata[taskId];
          return { metadata: newMetadata };
        });
      }
    }),
    {
      name: 'task-metadata-store'
    }
  )
);
import { create } from 'zustand';
import { persistNSync } from 'persist-and-sync';

export interface TaskMetadata {
  labels: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

interface TaskMetadataState {
  metadata: Record<string, TaskMetadata>;
  
  // Actions
  setMetadata: (taskId: string, metadata: TaskMetadata) => void;
  updateMetadata: (taskId: string, updates: Partial<TaskMetadata>) => void;
  removeMetadata: (taskId: string) => void;
  
  // Label management
  addLabel: (taskId: string, label: string) => void;
  removeLabel: (taskId: string, label: string) => void;
  
  // Priority management
  setPriority: (taskId: string, priority: TaskMetadata['priority']) => void;
  
  // Subtask management
  addSubtask: (taskId: string, subtask: { id: string; title: string; completed: boolean }) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<{ id: string; title: string; completed: boolean }>) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  
  // Get all unique labels across all tasks
  getAllLabels: () => string[];
}

export const useTaskMetadataStore = create<TaskMetadataState>()(
  persistNSync(
    (set, get) => ({
      metadata: {},
      
      setMetadata: (taskId, metadata) => set(state => ({
        metadata: { ...state.metadata, [taskId]: metadata }
      })),
      
      updateMetadata: (taskId, updates) => set(state => ({
        metadata: {
          ...state.metadata,
          [taskId]: { ...(state.metadata[taskId] || { labels: [], priority: 'normal' }), ...updates }
        }
      })),
      
      removeMetadata: (taskId) => set(state => {
        const { [taskId]: _, ...rest } = state.metadata;
        return { metadata: rest };
      }),
      
      addLabel: (taskId, label) => set(state => {
        const current = state.metadata[taskId] || { labels: [], priority: 'normal' };
        if (current.labels.includes(label)) return state;
        
        return {
          metadata: {
            ...state.metadata,
            [taskId]: { ...current, labels: [...current.labels, label] }
          }
        };
      }),
      
      removeLabel: (taskId, label) => set(state => {
        const current = state.metadata[taskId];
        if (!current) return state;
        
        return {
          metadata: {
            ...state.metadata,
            [taskId]: { ...current, labels: current.labels.filter(l => l !== label) }
          }
        };
      }),
      
      setPriority: (taskId, priority) => set(state => ({
        metadata: {
          ...state.metadata,
          [taskId]: { ...(state.metadata[taskId] || { labels: [] }), priority }
        }
      })),
      
      addSubtask: (taskId, subtask) => set(state => {
        const current = state.metadata[taskId] || { labels: [], priority: 'normal' };
        const subtasks = current.subtasks || [];
        
        return {
          metadata: {
            ...state.metadata,
            [taskId]: { ...current, subtasks: [...subtasks, subtask] }
          }
        };
      }),
      
      updateSubtask: (taskId, subtaskId, updates) => set(state => {
        const current = state.metadata[taskId];
        if (!current || !current.subtasks) return state;
        
        return {
          metadata: {
            ...state.metadata,
            [taskId]: {
              ...current,
              subtasks: current.subtasks.map(st => 
                st.id === subtaskId ? { ...st, ...updates } : st
              )
            }
          }
        };
      }),
      
      removeSubtask: (taskId, subtaskId) => set(state => {
        const current = state.metadata[taskId];
        if (!current || !current.subtasks) return state;
        
        return {
          metadata: {
            ...state.metadata,
            [taskId]: {
              ...current,
              subtasks: current.subtasks.filter(st => st.id !== subtaskId)
            }
          }
        };
      }),
      
      getAllLabels: () => {
        const allLabels = new Set<string>();
        Object.values(get().metadata).forEach(meta => {
          meta.labels.forEach(label => allLabels.add(label));
        });
        return Array.from(allLabels).sort();
      }
    }),
    { 
      name: 'task-metadata-store',
      storage: 'localStorage'
    }
  )
);
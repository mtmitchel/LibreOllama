import { useFeatureFlag } from '../utils/featureFlags';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useGoogleStore } from '../stores/googleStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Unified task store hook that switches between old and new implementations
 * based on feature flags. This enables gradual migration from googleStore
 * to the simplified kanban store.
 */
export function useTaskStore() {
  const useSimplifiedStore = useFeatureFlag('useSimplifiedKanbanStore');

  // New simplified store
  const newStore = useKanbanStore();

  // Old store with consistent interface
  const oldStore = useGoogleStore(
    useShallow((state) => ({
      // Map old store structure to new interface
      columns: state.kanbanColumns.map(col => ({
        id: col.taskList.id,
        title: col.taskList.title,
        tasks: col.tasks.map(task => ({
          id: task.id,
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status,
          position: task.position,
          updated: task.updated,
          metadata: {
            labels: task.labels || [],
            priority: task.priority || 'normal',
            subtasks: task.subtasks || [],
            recurring: task.recurring,
          },
        })),
        isLoading: col.isLoading,
        error: col.error,
      })),
      isSyncing: state.isLoadingTasks,
      isInitialized: state.taskLists.length > 0,
      error: undefined, // Old store doesn't have unified error

      // Wrap old store methods to match new interface
      async initialize() {
        await state.fetchTaskLists();
        await state.fetchAllTasks();
      },

      addColumn(id: string, title: string) {
        // Not implemented in old store
        console.warn('addColumn not implemented in legacy store');
      },

      async loadColumns() {
        await state.fetchTaskLists();
      },

      async loadTasks(columnId: string) {
        await state.fetchTasksForList(columnId);
      },

      async createTask(columnId: string, data: any) {
        await state.createTask(columnId, data);
      },

      async updateTask(columnId: string, taskId: string, updates: any) {
        await state.updateTask(columnId, taskId, updates);
      },

      async moveTask(taskId: string, fromColumn: string, toColumn: string, position?: string) {
        // Old store uses different move logic
        const task = state.kanbanColumns
          .find(col => col.taskList.id === fromColumn)
          ?.tasks.find(t => t.id === taskId);
        
        if (task) {
          await state.moveTask(taskId, fromColumn, toColumn, position);
        }
      },

      async toggleComplete(columnId: string, taskId: string, completed: boolean) {
        await state.toggleTaskCompletion(columnId, taskId, completed);
      },

      async deleteTask(columnId: string, taskId: string) {
        await state.deleteTask(columnId, taskId);
      },

      getTask(taskId: string) {
        for (const column of state.kanbanColumns) {
          const task = column.tasks.find(t => t.id === taskId);
          if (task) {
            return {
              task: {
                id: task.id,
                title: task.title,
                notes: task.notes,
                due: task.due,
                status: task.status,
                position: task.position,
                updated: task.updated,
                metadata: {
                  labels: task.labels || [],
                  priority: task.priority || 'normal',
                  subtasks: task.subtasks || [],
                  recurring: task.recurring,
                },
              },
              columnId: column.taskList.id,
            };
          }
        }
        return null;
      },

      clearError() {
        // Not implemented in old store
        console.warn('clearError not implemented in legacy store');
      },
    }))
  );

  // Return the appropriate store based on feature flag
  return useSimplifiedStore ? newStore : oldStore;
}

/**
 * Hook to check which store implementation is currently active
 */
export function useTaskStoreInfo() {
  const useSimplifiedStore = useFeatureFlag('useSimplifiedKanbanStore');
  
  return {
    isUsingSimplifiedStore: useSimplifiedStore,
    storeName: useSimplifiedStore ? 'useKanbanStore' : 'googleStore',
  };
}

/**
 * Development helper to force switch between stores
 */
export function switchTaskStore(useSimplified: boolean) {
  if (process.env.NODE_ENV === 'development') {
    const { setFeatureFlag } = require('../utils/featureFlags');
    setFeatureFlag('useSimplifiedKanbanStore', useSimplified);
    console.log(`Switched to ${useSimplified ? 'simplified' : 'legacy'} task store`);
  }
} 
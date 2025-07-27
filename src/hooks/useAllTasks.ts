import { useQueries } from '@tanstack/react-query';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
import * as api from '../api/googleTasksApi';

/**
 * Hook that loads tasks for all task lists using useQueries
 */
export function useAllTasks() {
  const { columns, batchUpdateFromGoogle } = useUnifiedTaskStore();
  
  const taskQueries = useQueries({
    queries: columns.filter(col => col.googleTaskListId).map(column => ({
      queryKey: ['tasks', 'tasks', column.googleTaskListId],
      queryFn: async () => {
        const tasks = await api.listTasks(column.googleTaskListId!);
        // Update unified store with tasks
        const updates = tasks.map(task => ({
          googleTaskId: task.id!,
          googleTaskListId: column.googleTaskListId!,
          data: {
            title: task.title || '',
            notes: task.notes,
            due: task.due,
            status: task.status as 'needsAction' | 'completed',
            position: task.position || '0',
            updated: task.updated || new Date().toISOString(),
          },
        }));
        batchUpdateFromGoogle(updates);
        return tasks;
      },
      enabled: !!column.googleTaskListId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    })),
  });
  
  // Check if all queries are loaded
  const isLoading = taskQueries.some(query => query.isLoading);
  const error = taskQueries.find(query => query.error)?.error;
  
  return {
    isLoading,
    error,
    refetchAll: () => {
      taskQueries.forEach(query => query.refetch());
    }
  };
}
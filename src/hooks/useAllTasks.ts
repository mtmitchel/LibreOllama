import { useQueries } from '@tanstack/react-query';
import { useGoogleTasksStoreV2 } from '../stores/useGoogleTasksStoreV2';
import * as api from '../api/googleTasksApi';

/**
 * Hook that loads tasks for all task lists using useQueries
 */
export function useAllTasks() {
  const taskLists = useGoogleTasksStoreV2(state => state.taskLists);
  const setTasks = useGoogleTasksStoreV2(state => state.setTasks);
  
  const taskQueries = useQueries({
    queries: taskLists.map(list => ({
      queryKey: ['tasks', 'tasks', list.id],
      queryFn: async () => {
        const tasks = await api.listTasks(list.id!);
        setTasks(list.id!, tasks);
        return tasks;
      },
      enabled: !!list.id,
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
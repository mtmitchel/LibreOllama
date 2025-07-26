import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/googleTasksApi';
import { useGoogleTasksStoreV2 } from '../stores/useGoogleTasksStoreV2';
import { useTaskMetadataStore } from '../stores/useTaskMetadataStore';
import type { tasks_v1 } from '../api/googleTasksApi';

// Query keys
const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'lists'] as const,
  list: (listId: string) => [...taskKeys.all, 'list', listId] as const,
  tasks: (listId: string) => [...taskKeys.all, 'tasks', listId] as const,
};

// Hook for fetching task lists
export function useTaskLists() {
  const setTaskLists = useGoogleTasksStoreV2(state => state.setTaskLists);
  
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const lists = await api.listTaskLists();
      setTaskLists(lists);
      return lists;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching tasks in a list
export function useTasks(tasklistId: string) {
  const setTasks = useGoogleTasksStoreV2(state => state.setTasks);
  
  return useQuery({
    queryKey: taskKeys.tasks(tasklistId),
    queryFn: async () => {
      const tasks = await api.listTasks(tasklistId);
      setTasks(tasklistId, tasks);
      return tasks;
    },
    enabled: !!tasklistId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for creating a task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const addTask = useGoogleTasksStoreV2(state => state.addTask);
  
  return useMutation({
    mutationFn: async ({ tasklistId, task }: { tasklistId: string; task: tasks_v1.Schema$Task }) => {
      const createdTask = await api.createTask(tasklistId, task);
      return { tasklistId, task: createdTask };
    },
    onSuccess: ({ tasklistId, task }) => {
      addTask(tasklistId, task);
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for updating a task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const updateTask = useGoogleTasksStoreV2(state => state.updateTask);
  
  return useMutation({
    mutationFn: async ({ 
      tasklistId, 
      taskId, 
      updates 
    }: { 
      tasklistId: string; 
      taskId: string; 
      updates: Partial<tasks_v1.Schema$Task> 
    }) => {
      const updatedTask = await api.updateTask(tasklistId, taskId, updates);
      return { tasklistId, taskId, task: updatedTask };
    },
    onSuccess: ({ tasklistId, taskId, task }) => {
      updateTask(tasklistId, taskId, task);
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for deleting a task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const removeTask = useGoogleTasksStoreV2(state => state.removeTask);
  const removeMetadata = useTaskMetadataStore(state => state.removeMetadata);
  
  return useMutation({
    mutationFn: async ({ tasklistId, taskId }: { tasklistId: string; taskId: string }) => {
      await api.deleteTask(tasklistId, taskId);
      return { tasklistId, taskId };
    },
    onSuccess: ({ tasklistId, taskId }) => {
      removeTask(tasklistId, taskId);
      removeMetadata(taskId);
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for moving a task
export function useMoveTask() {
  const queryClient = useQueryClient();
  const updateTask = useGoogleTasksStoreV2(state => state.updateTask);
  
  return useMutation({
    mutationFn: async ({ 
      tasklistId, 
      taskId, 
      parent, 
      previous 
    }: { 
      tasklistId: string; 
      taskId: string; 
      parent?: string; 
      previous?: string; 
    }) => {
      const movedTask = await api.moveTask(tasklistId, taskId, parent, previous);
      return { tasklistId, taskId, task: movedTask };
    },
    onSuccess: ({ tasklistId }) => {
      // Refetch the entire list to get updated positions
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for creating a task list
export function useCreateTaskList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title: string) => {
      return await api.createTaskList(title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Hook for updating a task list
export function useUpdateTaskList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tasklistId, title }: { tasklistId: string; title: string }) => {
      return await api.updateTaskList(tasklistId, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Hook for deleting a task list
export function useDeleteTaskList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tasklistId: string) => {
      await api.deleteTaskList(tasklistId);
      return tasklistId;
    },
    onSuccess: (tasklistId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.removeQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Combined hook for task with metadata
export function useTaskWithMetadata(tasklistId: string, taskId: string) {
  // Use more specific selectors to avoid unnecessary re-renders
  const task = useGoogleTasksStoreV2(state => 
    state.tasks[tasklistId]?.find(t => t.id === taskId)
  );
  
  const metadata = useTaskMetadataStore(state => state.metadata[taskId]);
  
  return {
    task,
    metadata: metadata || { labels: [], priority: 'normal' as const },
    isLoading: !task && !!taskId,
  };
}

// Hook for updating task metadata
export function useUpdateTaskMetadata() {
  const setTaskMetadata = useTaskMetadataStore(state => state.setTaskMetadata);
  const getTaskMetadata = useTaskMetadataStore(state => state.getTaskMetadata);
  
  return {
    updateMetadata: setTaskMetadata,
    setMetadata: setTaskMetadata,
    getMetadata: getTaskMetadata,
  };
}

// Hook to get all unique labels
export function useAllLabels() {
  // Get all labels from metadata
  const metadata = useTaskMetadataStore(state => state.metadata);
  
  const labelSet = new Set<string>();
  Object.values(metadata).forEach((meta) => {
    meta.labels?.forEach(label => labelSet.add(label));
  });
  
  return Array.from(labelSet).sort();
}
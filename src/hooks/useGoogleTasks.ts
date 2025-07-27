import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/googleTasksApi';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
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
  const { addColumn, updateColumn } = useUnifiedTaskStore();
  
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const lists = await api.listTaskLists();
      // Update unified store columns
      lists.forEach(list => {
        addColumn(list.id, list.title, list.id);
        updateColumn(list.id, { googleTaskListId: list.id });
      });
      return lists;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching tasks in a list
export function useTasks(tasklistId: string) {
  const { batchUpdateFromGoogle } = useUnifiedTaskStore();
  
  return useQuery({
    queryKey: taskKeys.tasks(tasklistId),
    queryFn: async () => {
      const tasks = await api.listTasks(tasklistId);
      // Update unified store with tasks
      const updates = tasks.map(task => ({
        googleTaskId: task.id!,
        googleTaskListId: tasklistId,
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
    enabled: !!tasklistId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for creating a task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { createTask, markTaskSynced } = useUnifiedTaskStore();
  
  return useMutation({
    mutationFn: async ({ tasklistId, task }: { tasklistId: string; task: tasks_v1.Schema$Task }) => {
      const createdTask = await api.createTask(tasklistId, task);
      return { tasklistId, task: createdTask };
    },
    onSuccess: ({ tasklistId, task }) => {
      if (task.id) {
        // Create in unified store and mark as synced
        const taskId = createTask({
          columnId: tasklistId,
          title: task.title || '',
          notes: task.notes,
          due: task.due,
          googleTaskListId: tasklistId,
        });
        markTaskSynced(taskId, task.id, tasklistId);
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for updating a task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { getTaskByGoogleId, updateTask } = useUnifiedTaskStore();
  
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
      // Update in unified store
      const unifiedTask = getTaskByGoogleId(taskId);
      if (unifiedTask) {
        updateTask(unifiedTask.id, {
          title: task.title || unifiedTask.title,
          notes: task.notes,
          due: task.due,
          status: task.status as 'needsAction' | 'completed',
          updated: task.updated || new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for deleting a task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { getTaskByGoogleId, deleteTask } = useUnifiedTaskStore();
  
  return useMutation({
    mutationFn: async ({ tasklistId, taskId }: { tasklistId: string; taskId: string }) => {
      await api.deleteTask(tasklistId, taskId);
      return { tasklistId, taskId };
    },
    onSuccess: ({ tasklistId, taskId }) => {
      // Delete from unified store
      const unifiedTask = getTaskByGoogleId(taskId);
      if (unifiedTask) {
        deleteTask(unifiedTask.id);
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks(tasklistId) });
    },
  });
}

// Hook for moving a task
export function useMoveTask() {
  const queryClient = useQueryClient();
  
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
  const { getTaskByGoogleId } = useUnifiedTaskStore();
  
  const unifiedTask = getTaskByGoogleId(taskId);
  
  return {
    task: unifiedTask ? {
      id: unifiedTask.googleTaskId || unifiedTask.id,
      title: unifiedTask.title,
      notes: unifiedTask.notes,
      due: unifiedTask.due,
      status: unifiedTask.status,
      position: unifiedTask.position,
      updated: unifiedTask.updated,
    } : undefined,
    metadata: {
      labels: unifiedTask?.labels || [],
      priority: unifiedTask?.priority || 'normal' as const,
    },
    isLoading: !unifiedTask && !!taskId,
  };
}

// Hook for updating task metadata
export function useUpdateTaskMetadata() {
  const { getTaskByGoogleId, updateTask } = useUnifiedTaskStore();
  
  const setTaskMetadata = (googleTaskId: string, metadata: { labels?: string[]; priority?: 'low' | 'normal' | 'high' | 'urgent' }) => {
    const task = getTaskByGoogleId(googleTaskId);
    if (task) {
      updateTask(task.id, metadata);
    }
  };
  
  const getTaskMetadata = (googleTaskId: string) => {
    const task = getTaskByGoogleId(googleTaskId);
    return task ? {
      labels: task.labels || [],
      priority: task.priority || 'normal' as const,
    } : undefined;
  };
  
  return {
    updateMetadata: setTaskMetadata,
    setMetadata: setTaskMetadata,
    getMetadata: getTaskMetadata,
  };
}

// Hook to get all unique labels
export function useAllLabels() {
  const { tasks } = useUnifiedTaskStore();
  
  const labelSet = new Set<string>();
  Object.values(tasks).forEach((task) => {
    task.labels?.forEach(label => labelSet.add(label));
  });
  
  return Array.from(labelSet).sort();
}
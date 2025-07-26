import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { GoogleTask, GoogleTaskList, TaskCreateData } from '../types/google';

interface TaskMetadata {
  id: number;
  google_task_id: string;
  task_list_id: string;
  priority: string;
  created_at: string;
  updated_at: string;
  labels: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
  subtasks: Array<{
    id: number;
    title: string;
    completed: boolean;
    position: number;
  }>;
}

interface CreateTaskMetadata {
  google_task_id: string;
  task_list_id: string;
  priority?: string;
  labels?: string[];
  subtasks?: Array<{
    title: string;
    completed: boolean;
    position: number;
  }>;
}

interface UpdateTaskMetadata {
  priority?: string;
  labels?: string[];
  subtasks?: Array<{
    id?: number;
    title: string;
    completed: boolean;
    position: number;
  }>;
}

// Query keys factory
export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'lists'] as const,
  list: (listId: string) => [...taskQueryKeys.all, 'list', listId] as const,
  task: (taskId: string) => [...taskQueryKeys.all, 'task', taskId] as const,
  metadata: (taskId: string) => [...taskQueryKeys.all, 'metadata', taskId] as const,
  allMetadata: () => [...taskQueryKeys.all, 'metadata'] as const,
  labels: () => ['labels'] as const,
};

// Hook to fetch task lists
export function useTaskLists(accountId: string) {
  return useQuery({
    queryKey: taskQueryKeys.lists(),
    queryFn: async () => {
      const response = await invoke<GoogleTaskList[]>('get_task_lists', { accountId });
      return response;
    },
    enabled: !!accountId,
  });
}

// Hook to fetch tasks for a specific list
export function useTasks(accountId: string, taskListId: string) {
  return useQuery({
    queryKey: taskQueryKeys.list(taskListId),
    queryFn: async () => {
      const response = await invoke<{ items: GoogleTask[] }>('get_tasks', {
        accountId,
        taskListId,
        showCompleted: false,
        showDeleted: false,
        maxResults: 100,
      });
      return response.items;
    },
    enabled: !!accountId && !!taskListId,
  });
}

// Hook to fetch task metadata
export function useTaskMetadata(googleTaskId: string) {
  return useQuery({
    queryKey: taskQueryKeys.metadata(googleTaskId),
    queryFn: async () => {
      const response = await invoke<TaskMetadata | null>('get_task_metadata', {
        googleTaskId,
      });
      return response;
    },
    enabled: !!googleTaskId,
  });
}

// Hook to create a task
export function useCreateTask(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskListId,
      taskData,
      metadata,
    }: {
      taskListId: string;
      taskData: TaskCreateData;
      metadata?: Omit<CreateTaskMetadata, 'google_task_id' | 'task_list_id'>;
    }) => {
      // Create task in Google Tasks (without metadata)
      const googleTask = await invoke<GoogleTask>('create_task', {
        accountId,
        taskListId,
        taskData: {
          title: taskData.title,
          notes: taskData.notes,
          due: taskData.due,
          parent: taskData.parent,
          previous: taskData.position,
        },
      });

      // Create metadata in local database if provided
      if (metadata) {
        await invoke<TaskMetadata>('create_task_metadata', {
          data: {
            google_task_id: googleTask.id,
            task_list_id: taskListId,
            ...metadata,
          },
        });
      }

      return googleTask;
    },
    onSuccess: (_, variables) => {
      // Invalidate the task list query
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.taskListId) });
      // Invalidate all metadata queries
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.allMetadata() });
    },
  });
}

// Hook to update a task
export function useUpdateTask(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskListId,
      taskId,
      updates,
      metadata,
    }: {
      taskListId: string;
      taskId: string;
      updates: Partial<GoogleTask>;
      metadata?: UpdateTaskMetadata;
    }) => {
      // Update task in Google Tasks (without metadata)
      const googleTask = await invoke<GoogleTask>('update_task', {
        accountId,
        taskListId,
        taskId,
        taskData: {
          title: updates.title,
          notes: updates.notes,
          status: updates.status,
          due: updates.due,
          completed: updates.completed,
        },
      });

      // Update metadata in local database if provided
      if (metadata) {
        await invoke<TaskMetadata>('update_task_metadata', {
          googleTaskId: taskId,
          updates: metadata,
        });
      }

      return googleTask;
    },
    onSuccess: (_, variables) => {
      // Invalidate the task list query
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.taskListId) });
      // Invalidate the specific task metadata
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.metadata(variables.taskId) });
    },
  });
}

// Hook to delete a task
export function useDeleteTask(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskListId,
      taskId,
    }: {
      taskListId: string;
      taskId: string;
    }) => {
      // Delete from Google Tasks
      await invoke('delete_task', {
        accountId,
        taskListId,
        taskId,
      });

      // Delete metadata from local database
      await invoke('delete_task_metadata', {
        googleTaskId: taskId,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the task list query
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.taskListId) });
      // Remove the task metadata from cache
      queryClient.removeQueries({ queryKey: taskQueryKeys.metadata(variables.taskId) });
    },
  });
}

// Hook to move a task
export function useMoveTask(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      fromListId,
      toListId,
      parent,
      previous,
    }: {
      taskId: string;
      fromListId: string;
      toListId: string;
      parent?: string;
      previous?: string;
    }) => {
      const googleTask = await invoke<GoogleTask>('move_task', {
        accountId,
        taskListId: toListId,
        taskId,
        parent,
        previous,
      });

      // Update task list ID in metadata if moving between lists
      if (fromListId !== toListId) {
        const metadata = await invoke<TaskMetadata | null>('get_task_metadata', {
          googleTaskId: taskId,
        });
        
        if (metadata) {
          await invoke('update_task_metadata', {
            googleTaskId: taskId,
            updates: {
              priority: metadata.priority,
              labels: metadata.labels.map(l => l.name),
              subtasks: metadata.subtasks,
            },
          });
        }
      }

      return googleTask;
    },
    onSuccess: (_, variables) => {
      // Invalidate both source and destination lists
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.fromListId) });
      if (variables.fromListId !== variables.toListId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(variables.toListId) });
      }
    },
  });
}

// Hook to fetch all labels
export function useLabels() {
  return useQuery({
    queryKey: taskQueryKeys.labels(),
    queryFn: async () => {
      const response = await invoke<Array<{
        id: number;
        name: string;
        color?: string;
        created_at: string;
      }>>('get_all_labels');
      return response;
    },
  });
}

// Hook to create or update task metadata
export function useUpsertTaskMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      googleTaskId,
      taskListId,
      metadata,
    }: {
      googleTaskId: string;
      taskListId: string;
      metadata: Omit<CreateTaskMetadata, 'google_task_id' | 'task_list_id'>;
    }) => {
      // Check if metadata exists
      const existing = await invoke<TaskMetadata | null>('get_task_metadata', {
        googleTaskId,
      });

      if (existing) {
        // Update existing metadata
        return await invoke<TaskMetadata>('update_task_metadata', {
          googleTaskId,
          updates: metadata,
        });
      } else {
        // Create new metadata
        return await invoke<TaskMetadata>('create_task_metadata', {
          data: {
            google_task_id: googleTaskId,
            task_list_id: taskListId,
            ...metadata,
          },
        });
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the task metadata query
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.metadata(variables.googleTaskId) });
      // Invalidate labels if they were updated
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.labels() });
    },
  });
}
import { invoke } from '@tauri-apps/api/core';
import { 
  GoogleAccount, 
  GoogleTask, 
  GoogleTaskList, 
  TaskMoveRequest, 
  ApiResponse, 
  PaginatedResponse,
  GoogleApiError 
} from '../../types/google';

// Always use real Tauri invoke - no mock data
const apiInvoke = invoke;

class GoogleTasksService {
  private async handleApiError(error: any): Promise<GoogleApiError> {
    console.error('Google Tasks API Error:', error);
    return {
      code: error.code || 500,
      message: error.message || 'An error occurred',
      status: error.status || 'INTERNAL_ERROR'
    };
  }

  async getTaskLists(account: GoogleAccount): Promise<ApiResponse<GoogleTaskList[]>> {
    try {
      const response = await apiInvoke('get_task_lists', {
        accountId: account.id,
      });
      
      return {
        success: true,
        data: response as GoogleTaskList[]
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async getTasks(
    account: GoogleAccount,
    taskListId: string,
    showCompleted: boolean = false,
    showDeleted: boolean = false,
    maxResults: number = 100
  ): Promise<ApiResponse<PaginatedResponse<GoogleTask>>> {
    try {
      const response = await apiInvoke('get_tasks', {
        accountId: account.id,
        taskListId,
        showCompleted,
        showDeleted,
        maxResults,
      });

      return {
        success: true,
        data: response as PaginatedResponse<GoogleTask>
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async createTask(
    account: GoogleAccount,
    taskListId: string,
    taskData: {
      title: string;
      notes?: string;
      due?: string;
      parent?: string;
      previous?: string;
    }
  ): Promise<ApiResponse<GoogleTask>> {
    try {
      const response = await apiInvoke('create_task', {
        accountId: account.id,
        taskListId,
        taskData,
      });

      return {
        success: true,
        data: response as GoogleTask
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async updateTask(
    account: GoogleAccount,
    taskListId: string,
    taskId: string,
    taskData: {
      title?: string;
      notes?: string;
      status?: 'needsAction' | 'completed';
      due?: string;
      completed?: string;
    }
  ): Promise<ApiResponse<GoogleTask>> {
    try {
      const response = await apiInvoke('update_task', {
        accountId: account.id,
        taskListId,
        taskId,
        taskData,
      });

      return {
        success: true,
        data: response as GoogleTask
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async moveTask(
    account: GoogleAccount,
    taskIdOrRequest: string | TaskMoveRequest,
    fromListId?: string,
    toListId?: string,
    options: { parent?: string; previous?: string } = {}
  ): Promise<ApiResponse<GoogleTask>> {
    // Support both the new unified object signature and the legacy positional signature
    let request: TaskMoveRequest;

    if (typeof taskIdOrRequest === 'string') {
      // Legacy call: moveTask(account, taskId, fromListId, toListId, { previous })
      request = {
        taskId: taskIdOrRequest,
        taskListId: toListId ?? fromListId ?? '', // target list (fall back to fromListId if only two lists)
        parent: options.parent,
        previous: options.previous,
      } as TaskMoveRequest;
    } else {
      // New unified object call
      request = taskIdOrRequest;
    }

    try {
      const response = await apiInvoke('move_task', {
        accountId: account.id,
        taskListId: request.taskListId,
        taskId: request.taskId,
        options: {
          parent: request.parent,
          previous: request.previous,
        }
      });
       
      return {
        success: true,
        data: response as GoogleTask
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async deleteTask(
    account: GoogleAccount,
    taskListId: string,
    taskId: string
  ): Promise<ApiResponse<void>> {
    try {
      await apiInvoke('delete_task', {
        accountId: account.id,
        taskListId,
        taskId,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async markTaskCompleted(
    account: GoogleAccount,
    taskListId: string,
    taskId: string,
    completed: boolean
  ): Promise<ApiResponse<GoogleTask>> {
    return this.updateTask(account, taskListId, taskId, {
      status: completed ? 'completed' : 'needsAction',
      completed: completed ? new Date().toISOString() : undefined,
    });
  }

  // Task List Management Functions
  async updateTaskList(
    account: GoogleAccount,
    taskListId: string,
    title: string
  ): Promise<ApiResponse<GoogleTaskList>> {
    try {
      const response = await apiInvoke('update_task_list', {
        accountId: account.id,
        taskListId,
        title,
      });

      return {
        success: true,
        data: response as GoogleTaskList
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async createTaskList(
    account: GoogleAccount,
    title: string
  ): Promise<ApiResponse<GoogleTaskList>> {
    try {
      const response = await apiInvoke('create_task_list', {
        accountId: account.id,
        title,
      });

      return {
        success: true,
        data: response as GoogleTaskList
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async deleteTaskList(
    account: GoogleAccount,
    taskListId: string
  ): Promise<ApiResponse<void>> {
    try {
      await apiInvoke('delete_task_list', {
        accountId: account.id,
        taskListId,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async archiveTaskList(
    account: GoogleAccount,
    taskListId: string
  ): Promise<ApiResponse<void>> {
    try {
      await apiInvoke('archive_task_list', {
        accountId: account.id,
        taskListId,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async getAllTasks(
    account: GoogleAccount,
    taskLists: GoogleTaskList[]
  ): Promise<Record<string, GoogleTask[]>> {
    const results: Record<string, GoogleTask[]> = {};
    
    for (const list of taskLists) {
      try {
        const response = await this.getTasks(account, list.id);
        results[list.id] = response.success && response.data ? response.data.items ?? [] : [];
      } catch (error) {
        console.error(`Failed to fetch tasks for list ${list.id}:`, error);
        results[list.id] = [];
      }
    }
    
    return results;
  }
}

export const googleTasksService = new GoogleTasksService(); 
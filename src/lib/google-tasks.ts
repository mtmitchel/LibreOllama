// Google Tasks API Service for LibreOllama

import { GoogleAuthService } from './google-auth';
import {
  GoogleTaskList,
  GoogleTask,
  GoogleTaskListsResponse,
  GoogleTasksResponse
} from './google-types';

export class GoogleTasksService {
  private authService: GoogleAuthService;
  private baseUrl = 'https://www.googleapis.com/tasks/v1';

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
  }

  /**
   * Get list of user's task lists
   */
  async getTaskLists(): Promise<GoogleTaskList[]> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleTaskListsResponse>(
        `${this.baseUrl}/users/@me/lists`
      );

      return response.items || [];
    } catch (error) {
      console.error('Failed to fetch task lists:', error);
      throw error;
    }
  }

  /**
   * Get tasks from a specific task list
   */
  async getTasks(
    taskListId: string,
    options: {
      maxResults?: number;
      showCompleted?: boolean;
      showDeleted?: boolean;
      showHidden?: boolean;
      completedMax?: string;
      completedMin?: string;
      dueMax?: string;
      dueMin?: string;
      updatedMin?: string;
    } = {}
  ): Promise<GoogleTask[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.maxResults) params.set('maxResults', options.maxResults.toString());
      if (options.showCompleted !== undefined) params.set('showCompleted', options.showCompleted.toString());
      if (options.showDeleted !== undefined) params.set('showDeleted', options.showDeleted.toString());
      if (options.showHidden !== undefined) params.set('showHidden', options.showHidden.toString());
      if (options.completedMax) params.set('completedMax', options.completedMax);
      if (options.completedMin) params.set('completedMin', options.completedMin);
      if (options.dueMax) params.set('dueMax', options.dueMax);
      if (options.dueMin) params.set('dueMin', options.dueMin);
      if (options.updatedMin) params.set('updatedMin', options.updatedMin);

      const url = `${this.baseUrl}/lists/${encodeURIComponent(taskListId)}/tasks`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

      const response = await this.authService.makeAuthenticatedRequest<GoogleTasksResponse>(fullUrl);

      return response.items || [];
    } catch (error) {
      console.error(`Failed to fetch tasks for list ${taskListId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks from all task lists
   */
  async getAllTasks(options?: {
    maxResults?: number;
    showCompleted?: boolean;
    showDeleted?: boolean;
  }): Promise<{ taskList: GoogleTaskList; tasks: GoogleTask[] }[]> {
    try {
      const taskLists = await this.getTaskLists();
      
      const taskPromises = taskLists.map(async (taskList) => {
        try {
          const tasks = await this.getTasks(taskList.id, options);
          return { taskList, tasks };
        } catch (error) {
          console.warn(`Failed to fetch tasks for list ${taskList.title}:`, error);
          return { taskList, tasks: [] };
        }
      });

      return await Promise.all(taskPromises);
    } catch (error) {
      console.error('Failed to fetch all tasks:', error);
      throw error;
    }
  }

  /**
   * Get incomplete tasks (not completed)
   */
  async getIncompleteTasks(taskListId?: string): Promise<GoogleTask[]> {
    try {
      if (taskListId) {
        return this.getTasks(taskListId, { showCompleted: false });
      }

      const allTasksData = await this.getAllTasks({ showCompleted: false });
      return allTasksData.flatMap(data => data.tasks);
    } catch (error) {
      console.error('Failed to fetch incomplete tasks:', error);
      throw error;
    }
  }

  /**
   * Get tasks with due dates
   */
  async getTasksWithDueDates(taskListId?: string): Promise<GoogleTask[]> {
    try {
      const tasks = taskListId 
        ? await this.getTasks(taskListId, { showCompleted: false })
        : (await this.getAllTasks({ showCompleted: false })).flatMap(data => data.tasks);

      return tasks.filter(task => task.due && task.status === 'needsAction');
    } catch (error) {
      console.error('Failed to fetch tasks with due dates:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(taskListId?: string): Promise<GoogleTask[]> {
    try {
      const tasksWithDueDates = await this.getTasksWithDueDates(taskListId);
      const now = new Date();

      return tasksWithDueDates.filter(task => {
        if (!task.due) return false;
        const dueDate = new Date(task.due);
        return dueDate < now;
      });
    } catch (error) {
      console.error('Failed to fetch overdue tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskListId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleTask>(
        `${this.baseUrl}/lists/${encodeURIComponent(taskListId)}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(task)
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskListId: string, taskId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleTask>(
        `${this.baseUrl}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(task)
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    try {
      const task = {
        status: 'completed' as const,
        completed: new Date().toISOString()
      };

      return this.updateTask(taskListId, taskId, task);
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  }

  /**
   * Mark task as incomplete
   */
  async uncompleteTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    try {
      const task = {
        status: 'needsAction' as const,
        completed: undefined
      };

      return this.updateTask(taskListId, taskId, task);
    } catch (error) {
      console.error('Failed to uncomplete task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
        {
          method: 'DELETE'
        }
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  /**
   * Create a new task list
   */
  async createTaskList(title: string): Promise<GoogleTaskList> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleTaskList>(
        `${this.baseUrl}/users/@me/lists`,
        {
          method: 'POST',
          body: JSON.stringify({ title })
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to create task list:', error);
      throw error;
    }
  }

  /**
   * Update a task list
   */
  async updateTaskList(taskListId: string, title: string): Promise<GoogleTaskList> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleTaskList>(
        `${this.baseUrl}/users/@me/lists/${encodeURIComponent(taskListId)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ title })
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to update task list:', error);
      throw error;
    }
  }

  /**
   * Delete a task list
   */
  async deleteTaskList(taskListId: string): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/users/@me/lists/${encodeURIComponent(taskListId)}`,
        {
          method: 'DELETE'
        }
      );
    } catch (error) {
      console.error('Failed to delete task list:', error);
      throw error;
    }
  }

  /**
   * Move task to another position or parent
   */
  async moveTask(
    taskListId: string,
    taskId: string,
    options: {
      parent?: string;
      previous?: string;
    } = {}
  ): Promise<GoogleTask> {
    try {
      const params = new URLSearchParams();
      if (options.parent) params.set('parent', options.parent);
      if (options.previous) params.set('previous', options.previous);

      const url = `${this.baseUrl}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}/move`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

      const response = await this.authService.makeAuthenticatedRequest<GoogleTask>(
        fullUrl,
        { method: 'POST' }
      );

      return response;
    } catch (error) {
      console.error('Failed to move task:', error);
      throw error;
    }
  }

  /**
   * Convert Google Task to LibreOllama format
   */
  convertToLibreOllamaTask(task: GoogleTask, taskListTitle?: string): any {
    const dueDate = task.due ? new Date(task.due) : undefined;
    const completedDate = task.completed ? new Date(task.completed) : undefined;

    return {
      id: task.id,
      title: task.title || 'Untitled Task',
      description: task.notes || '',
      status: task.status === 'completed' ? 'done' : 'todo',
      dueDate: dueDate?.toISOString(),
      completedAt: completedDate?.toISOString(),
      createdAt: new Date(task.updated).toISOString(), // Using updated as created isn't available
      updatedAt: task.updated,
      priority: this.getPriorityFromTask(task),
      tags: this.getTagsFromTask(task, taskListTitle),
      source: 'google-tasks',
      googleTaskId: task.id,
      googleTaskListId: task.selfLink ? this.extractTaskListIdFromSelfLink(task.selfLink) : undefined,
      parentTaskId: task.parent,
      position: task.position,
      hasSubtasks: false, // Will be determined when loading subtasks
      links: task.links?.map(link => ({
        url: link.link,
        description: link.description,
        type: link.type
      })) || []
    };
  }

  /**
   * Get priority from task (heuristic based on due date and notes)
   */
  private getPriorityFromTask(task: GoogleTask): 'low' | 'medium' | 'high' {
    const notes = (task.notes || '').toLowerCase();
    
    // Check for priority keywords in notes
    if (notes.includes('urgent') || notes.includes('high priority') || notes.includes('important')) {
      return 'high';
    }
    
    if (notes.includes('low priority') || notes.includes('whenever')) {
      return 'low';
    }

    // Check due date proximity
    if (task.due) {
      const dueDate = new Date(task.due);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 1) return 'high';
      if (daysUntilDue <= 7) return 'medium';
    }

    return 'medium';
  }

  /**
   * Extract tags from task notes and task list
   */
  private getTagsFromTask(task: GoogleTask, taskListTitle?: string): string[] {
    const tags: string[] = [];
    
    // Add task list as a tag
    if (taskListTitle) {
      tags.push(taskListTitle.toLowerCase().replace(/\s+/g, '-'));
    }

    // Extract hashtags from notes
    const notes = task.notes || '';
    const hashtagMatches = notes.match(/#[\w-]+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1).toLowerCase()));
    }

    // Add status-based tags
    if (task.status === 'completed') {
      tags.push('completed');
    }

    if (task.due) {
      const dueDate = new Date(task.due);
      const now = new Date();
      if (dueDate < now) {
        tags.push('overdue');
      } else if (dueDate.toDateString() === now.toDateString()) {
        tags.push('due-today');
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract task list ID from self link
   */
  private extractTaskListIdFromSelfLink(selfLink: string): string | undefined {
    const match = selfLink.match(/\/lists\/([^\/]+)\/tasks/);
    return match ? match[1] : undefined;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<{
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    overdueTasks: number;
    taskListsCount: number;
    tasksWithDueDates: number;
  }> {
    try {
      const allTasksData = await this.getAllTasks({ showCompleted: true });
      const allTasks = allTasksData.flatMap(data => data.tasks);
      
      const completedTasks = allTasks.filter(task => task.status === 'completed').length;
      const incompleteTasks = allTasks.filter(task => task.status === 'needsAction').length;
      const tasksWithDueDates = allTasks.filter(task => task.due).length;
      
      const now = new Date();
      const overdueTasks = allTasks.filter(task => {
        if (!task.due || task.status === 'completed') return false;
        return new Date(task.due) < now;
      }).length;

      return {
        totalTasks: allTasks.length,
        completedTasks,
        incompleteTasks,
        overdueTasks,
        taskListsCount: allTasksData.length,
        tasksWithDueDates
      };
    } catch (error) {
      console.error('Failed to get task statistics:', error);
      throw error;
    }
  }
}
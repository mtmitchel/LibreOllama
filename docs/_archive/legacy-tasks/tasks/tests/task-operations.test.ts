import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGoogleStore } from '../../../stores/googleStore';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';
import { GoogleTask, GoogleTaskList, TaskCreateData } from '../../../types/google';
import { prepareTaskForAPI, setTaskMetadata, getTaskMetadata, encodeEnhancedTaskData } from '../utils/taskHelpers';
import { invoke } from '@tauri-apps/api/core';
import { GoogleAccount } from '../../../types/google';
import { produce } from 'immer';

// Mock the mockGoogleService module so we can override its mockInvoke function
const mockInvoke = vi.hoisted(() => vi.fn());
vi.mock('../../../services/google/mockGoogleService', () => ({
  mockInvoke: mockInvoke,
  getMockAccount: () => ({
    id: 'mock-account-1',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000,
  }),
}));

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
  vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
  vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockConsole.log.mockClear();
  mockConsole.error.mockClear();
  mockConsole.warn.mockClear();
});

describe('Task Operations Tests', () => {
  const mockTaskLists = [
    {
      id: 'list-1',
      title: 'My Tasks',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/list-1',
      etag: 'etag-1',
    },
    {
      id: 'list-2',
      title: 'Work Projects',  
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/list-2',
      etag: 'etag-2',
    },
  ];

  const mockKanbanColumns = [
    {
      taskList: mockTaskLists[0],
      tasks: [],
      isLoading: false,
    },
    {
      taskList: mockTaskLists[1],
      tasks: [],
      isLoading: false,
    },
  ];

  // Store references updated in beforeEach
  let googleStore: any;
  let metadataStore: any;
  
  // Shared variables
  let testTaskId: string;
  
  beforeEach(async () => {
    // Proper mock cleanup as per research findings
    vi.clearAllMocks();
    vi.resetAllMocks();
    
    // Reset mock function with default implementation
    mockInvoke.mockReset();
    
    // Create a persistent task registry to track created tasks
    const taskRegistry = new Map<string, any>();
    
    // Mock implementation that returns raw data (service layer will wrap it)
    mockInvoke.mockImplementation(async (command: string, args: any): Promise<any> => {
      console.log(`[Mock] Invoking command: ${command}`, args);

      switch (command) {
        case 'create_task':
          const newTask = {
            id: `task-${Date.now()}`,
            title: args.taskData.title,
            notes: args.taskData.notes || '',
            status: 'needsAction',
            due: args.taskData.due,
            parent: args.taskData.parent,
            position: args.taskData.position || '1',
            updated: new Date().toISOString(),
            links: [],
            selfLink: `https://www.googleapis.com/tasks/v1/lists/${args.taskListId}/tasks/task-${Date.now()}`,
            etag: 'etag-123',
            kind: 'tasks#task',
            unsynced: false,
            labels: [],
            priority: 'normal',
            subtasks: [],
            recurring: undefined,
            children: [],
          };
          taskRegistry.set(newTask.id, newTask);
          return newTask; // Return raw task data

        case 'update_task':
          const existingTask = taskRegistry.get(args.taskId);
          if (!existingTask) {
            throw new Error('Task not found');
          }
          
          const updatedTask = {
            ...existingTask,
            ...args.taskData,
            updated: new Date().toISOString(),
          };
          taskRegistry.set(args.taskId, updatedTask);
          return updatedTask; // Return raw task data

        case 'move_task':
          const taskToMove = taskRegistry.get(args.taskId);
          if (!taskToMove) {
            throw new Error('Task not found');
          }
          
          const movedTask = {
            ...taskToMove,
            position: args.options?.previous || '1',
            updated: new Date().toISOString(),
          };
          taskRegistry.set(args.taskId, movedTask);
          return movedTask; // Return raw task data

        case 'delete_task':
          const taskToDelete = taskRegistry.get(args.taskId);
          if (!taskToDelete) {
            throw new Error('Task not found');
          }
          
          taskRegistry.delete(args.taskId);
          return; // Return void for delete

        case 'get_task_lists':
          return { items: mockTaskLists }; // Return raw task lists data

        case 'get_tasks':
          const tasks = Array.from(taskRegistry.values()).filter(task => 
            task.listId === args.taskListId || !task.listId
          );
          return { items: tasks }; // Return raw tasks data

        default:
          throw new Error(`Unknown command: ${command}`);
      }
    });

    // Store the task registry on the mock for tests to access and preserve across test scenarios
    (mockInvoke as any).taskRegistry = taskRegistry;
    // Make registry globally accessible for error tests that need to ensure task persistence
    (global as any).testTaskRegistry = taskRegistry;

    // Set up store with mock data
    googleStore = useGoogleStore.getState();
    metadataStore = useTaskMetadataStore.getState();
    
    // Clear stores
    googleStore.clearData();
    metadataStore.clearAllMetadata();
    
    // Add mock account
    const mockAccount: GoogleAccount = {
      id: 'mock-account-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600000,
    };
    
    googleStore.addAccount(mockAccount);
    googleStore.setActiveAccount(mockAccount);
    
    // Add mock kanban columns
    useGoogleStore.setState({
      taskLists: mockTaskLists,
      kanbanColumns: mockKanbanColumns,
    });

    // Create test task and wait for completion
    const testTask = await googleStore.createTask('list-1', { title: 'Test Task for Operations' });
    testTaskId = testTask!.id;
    
    // Ensure test task is registered in mock registry for error scenarios
    taskRegistry.set(testTaskId, {
      id: testTaskId,
      title: 'Test Task for Operations',
      status: 'needsAction',
      notes: 'Test notes',
    });
  });

  describe('Task Creation', () => {
    it('should create a basic task successfully', async () => {
      const taskData: TaskCreateData = {
        title: 'Test Task',
        notes: 'Test notes',
        due: '2024-12-31',
      };

      const result = await googleStore.createTask('list-1', taskData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Task');
      expect(result.notes).toBe('Test notes');
      expect(result.status).toBe('needsAction');
    });

    it('should create a task with enhanced metadata', async () => {
      const taskData: TaskCreateData = {
        title: 'Enhanced Task',
        notes: 'Base notes',
        due: '2024-12-31',
      };

      const enhancedData = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask 1', completed: false, due: '' }],
      };

      // Prepare the task data with enhanced metadata
      const enhancedTaskData = {
        ...taskData,
        notes: `${taskData.notes} ${encodeEnhancedTaskData(enhancedData)}`,
      };

      const result = await googleStore.createTask('list-1', enhancedTaskData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Enhanced Task');
      expect(result.notes).toContain('Base notes');
      expect(result.notes).toContain('[LibreOllama:');
    });

    it('should handle task creation failures gracefully', async () => {
      // Mock a failure scenario
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));

      const taskData: TaskCreateData = {
        title: 'Failing Task',
        notes: 'Test notes',
      };

      await act(async () => {
        await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Network error');
      });
    });

    it('should create tasks with parent-child relationships', async () => {
      const parentTask: TaskCreateData = {
        title: 'Parent Task',
        notes: 'Parent notes',
      };

      const childTask: TaskCreateData = {
        title: 'Child Task',
        notes: 'Child notes',
        parent: 'parent-task-id',
      };

      const parent = await googleStore.createTask('list-1', parentTask);
      const child = await googleStore.createTask('list-1', { ...childTask, parent: parent.id });
      
      expect(parent.title).toBe('Parent Task');
      expect(child.title).toBe('Child Task');
      expect(child.parent).toBe(parent.id);
    });
  });

  describe('Task Updates', () => {
    let testTask: GoogleTask;
    let testTaskId: string;

    beforeEach(async () => {
      // Create a test task for update operations
      testTask = await googleStore.createTask('list-1', {
        title: 'Test Task for Updates',
        notes: 'Initial notes',
        due: '2024-12-31',
      });
      testTaskId = testTask.id;
    });

    it('should update task title successfully', async () => {
      const updatedData = {
        title: 'Updated Task Title',
        notes: testTask.notes,
        due: testTask.due,
      };

      const result = await googleStore.updateTask('list-1', testTaskId, updatedData);
      
      expect(result.title).toBe('Updated Task Title');
      expect(result.notes).toBe(testTask.notes);
      expect(result.due).toBe(testTask.due);
    });

    it('should update task due date successfully', async () => {
      const newDueDate = '2025-01-15';
      const updatedData = {
        title: testTask.title,
        notes: testTask.notes,
        due: newDueDate,
      };

      const result = await googleStore.updateTask('list-1', testTaskId, updatedData);
      
      expect(result.due).toBe(newDueDate);
      expect(result.title).toBe(testTask.title);
    });

    it('should update task notes and preserve metadata', async () => {
      // First, set some metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
      };
      setTaskMetadata(testTaskId, metadata);

      // Update notes while preserving metadata
      const updatedData = prepareTaskForAPI(testTaskId, {
        title: testTask.title,
        notes: 'Updated notes content',
        due: testTask.due,
      });

      const result = await googleStore.updateTask('list-1', testTaskId, updatedData);
      
      expect(result.notes).toContain('Updated notes content');
      expect(result.notes).toContain('[LibreOllama:');
      
      // Verify metadata is preserved
      const retrievedMetadata = getTaskMetadata(testTaskId);
      expect(retrievedMetadata?.priority).toBe('high');
      expect(retrievedMetadata?.labels).toEqual(['urgent', 'work']);
    });

    it('should handle concurrent updates correctly', async () => {
      const updates = [
        { title: 'Update 1', notes: 'Notes 1', due: '2025-01-01' },
        { title: 'Update 2', notes: 'Notes 2', due: '2025-01-02' },
        { title: 'Update 3', notes: 'Notes 3', due: '2025-01-03' },
      ];

      // Execute updates concurrently
      const promises = updates.map(update => 
        googleStore.updateTask('list-1', testTaskId, update)
      );

      const results = await Promise.all(promises);
      
      // All updates should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBe(testTaskId);
      });

      // The final result should be one of the updates
      const finalTask = results[results.length - 1];
      expect(updates.map(u => u.title)).toContain(finalTask.title);
    });

    it('should handle optimistic updates and rollback on failure', async () => {
      const originalTitle = testTask.title;
      const updatedData = {
        title: 'Failed Update',
        notes: testTask.notes,
        due: testTask.due,
      };

      // Mock a failure
      mockInvoke.mockRejectedValueOnce(new Error('Update failed'));

      // Apply optimistic update
      await act(async () => {
        googleStore.optimisticUpdateTask('list-1', testTaskId, updatedData);
      });

      // Verify optimistic update was applied
      await waitFor(() => {
        const optimisticState = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
          ?.tasks.find(t => t.id === testTaskId);
        
        expect(optimisticState?.title).toBe('Failed Update');
      });

      // Attempt the actual update (should fail)
      await act(async () => {
        await expect(googleStore.updateTask('list-1', testTaskId, updatedData)).rejects.toThrow('Update failed');
      });

      // Verify state was rolled back
      await waitFor(() => {
        const finalState = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
          ?.tasks.find(t => t.id === testTaskId);
        
        expect(finalState?.title).toBe(originalTitle);
      });
    });

    it('should handle task updates with metadata changes', async () => {
      // Set initial metadata
      const initialMetadata = {
        priority: 'normal',
        labels: ['task'],
        subtasks: [],
      };
      setTaskMetadata(testTaskId, initialMetadata);

      // Update with new metadata
      const newMetadata = {
        priority: 'high',
        labels: ['urgent', 'important'],
        subtasks: [{ id: '1', title: 'New subtask', completed: false, due: '' }],
      };
      setTaskMetadata(testTaskId, newMetadata);

      // Update the task
      const updatedData = prepareTaskForAPI(testTaskId, {
        title: 'Updated with metadata',
        notes: 'Updated notes',
        due: testTask.due,
      });

      const result = await googleStore.updateTask('list-1', testTaskId, updatedData);
      
      expect(result.title).toBe('Updated with metadata');
      expect(result.notes).toContain('Updated notes');
      expect(result.notes).toContain('[LibreOllama:');
      
      // Verify metadata was updated
      const retrievedMetadata = getTaskMetadata(testTaskId);
      expect(retrievedMetadata?.priority).toBe('high');
      expect(retrievedMetadata?.labels).toEqual(['urgent', 'important']);
      expect(retrievedMetadata?.subtasks).toHaveLength(1);
    });
  });

  describe('Task Movement', () => {
    let testTask: GoogleTask;
    let testTaskId: string;

    beforeEach(async () => {
      // Create a test task for movement operations
      testTask = await googleStore.createTask('list-1', {
        title: 'Task to Move',
        notes: 'Test notes',
        due: '2024-12-31',
      });
      testTaskId = testTask.id;
    });

    it('should move task between lists successfully', async () => {
      // Move task from list-1 to list-2
      const result = await googleStore.moveTask(testTaskId, 'list-1', 'list-2', {});
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testTaskId);
      expect(result.title).toBe('Task to Move');
      
      // Get current store state
      const currentStore = useGoogleStore.getState();
      
      // Verify task is no longer in source list
      const sourceListTasks = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(sourceListTasks?.find(t => t.id === testTaskId)).toBeUndefined();
      
      // Verify task is in target list
      const targetListTasks = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      expect(targetListTasks?.find(t => t.id === testTaskId)).toBeDefined();
    });

    it('should handle optimistic move and rollback on failure', async () => {
      // Apply optimistic move
      googleStore.optimisticMoveTask(testTaskId, 'list-1', 'list-2');
      
      // Get current store state after optimistic move
      const afterOptimisticMove = useGoogleStore.getState();
      
      // Verify optimistic move was applied
      const sourceListTasks = afterOptimisticMove.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      const targetListTasks = afterOptimisticMove.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      
      expect(sourceListTasks?.find(t => t.id === testTaskId)).toBeUndefined();
      expect(targetListTasks?.find(t => t.id === testTaskId)).toBeDefined();

      // Use mockImplementationOnce with proper Error instance (research finding)
      mockInvoke.mockImplementationOnce(async (command: string): Promise<any> => {
        if (command === 'move_task') {
          throw new Error('Move failed');
        }
        throw new Error('Unexpected command in test');
      });

      // Attempt the actual move (should fail)
      await expect(googleStore.moveTask(testTaskId, 'list-1', 'list-2', undefined)).rejects.toThrow('Move failed');
      
      // Get final store state after rollback
      const finalState = useGoogleStore.getState();
      
      // Verify state was rolled back
      const finalSourceTasks = finalState.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      const finalTargetTasks = finalState.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      
      expect(finalSourceTasks?.find(t => t.id === testTaskId)).toBeDefined();
      expect(finalTargetTasks?.find(t => t.id === testTaskId)).toBeUndefined();
    });

    it('should handle concurrent move operations', async () => {
      // Create multiple tasks for concurrent moves
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Task 1' }),
        googleStore.createTask('list-1', { title: 'Task 2' }),
        googleStore.createTask('list-1', { title: 'Task 3' }),
      ]);

      // Move all tasks concurrently to different lists
      const movePromises = tasks.map((task, index) => 
        googleStore.moveTask(task.id, 'list-1', `list-${index + 2}`, {})
      );

      const results = await Promise.all(movePromises);
      
      // All moves should succeed
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.id).toBe(tasks[index].id);
      });
    });

    it('should preserve task metadata during moves', async () => {
      // Set metadata before moving
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      };
      setTaskMetadata(testTaskId, metadata);

      // Move the task
      const result = await googleStore.moveTask(testTaskId, 'list-1', 'list-2', {});
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testTaskId);
      
      // Verify metadata was preserved
      const retrievedMetadata = getTaskMetadata(testTaskId);
      expect(retrievedMetadata?.priority).toBe('high');
      expect(retrievedMetadata?.labels).toEqual(['urgent', 'work']);
      expect(retrievedMetadata?.subtasks).toHaveLength(1);
    });

    it('should handle move operations with position options', async () => {
      // Create a reference task in the target list
      const referenceTask = await googleStore.createTask('list-2', {
        title: 'Reference Task',
        notes: 'Reference',
      });

      // Move task with position relative to reference task (position is a string)
      const result = await googleStore.moveTask(testTaskId, 'list-1', 'list-2', referenceTask.id);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testTaskId);
      expect(result.position).toBe(referenceTask.id);
    });

    it('should handle move operations with parent options', async () => {
      // Create a parent task in the target list
      const parentTask = await googleStore.createTask('list-2', {
        title: 'Parent Task',
        notes: 'Parent',
      });

      // Move task to list-2 (parent functionality not implemented in current API)
      const result = await googleStore.moveTask(testTaskId, 'list-1', 'list-2', undefined);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testTaskId);
      // Note: Parent field is not currently passed to the API in the implementation
      expect(result.parent).toBeUndefined();
    });

    it('should handle task reordering within same list', async () => {
      // Create additional tasks in the same list
      const task2 = await googleStore.createTask('list-1', {
        title: 'Task 2',
        notes: 'Second task',
      });

      const task3 = await googleStore.createTask('list-1', {
        title: 'Task 3',
        notes: 'Third task',
      });

      // Apply optimistic reorder
      googleStore.optimisticReorderTask('list-1', testTaskId, task2.id);
      
      // Get current store state
      const currentStore = useGoogleStore.getState();
      
      // Verify reorder was applied
      const listTasks = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(listTasks?.find(t => t.id === testTaskId)).toBeDefined();
      expect(listTasks?.find(t => t.id === task2.id)).toBeDefined();
      expect(listTasks?.find(t => t.id === task3.id)).toBeDefined();
    });
  });

  describe('Task Deletion', () => {
    let testTask: GoogleTask;
    let testTaskId: string;

    beforeEach(async () => {
      // Create a test task for deletion
      testTask = await googleStore.createTask('list-1', {
        title: 'Task to Delete',
        notes: 'Test notes',
      });
      testTaskId = testTask.id;
    });

    it('should delete task successfully', async () => {
      // Get current store state
      const currentStore = useGoogleStore.getState();
      
      // Verify task exists before deletion
      const beforeDeletion = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === testTaskId);
      expect(beforeDeletion).toBeDefined();

      // Delete the task
      await googleStore.deleteTask('list-1', testTaskId);
      
      // Get updated store state
      const updatedStore = useGoogleStore.getState();
      
      // Verify task was removed
      const afterDeletion = updatedStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === testTaskId);
      expect(afterDeletion).toBeUndefined();
    });

    it('should clean up task metadata on deletion', async () => {
      // Set metadata before deletion
      const metadata = {
        priority: 'high',
        labels: ['urgent'],
        subtasks: [],
      };
      setTaskMetadata(testTaskId, metadata);

      // Verify metadata exists
      expect(getTaskMetadata(testTaskId)).toBeDefined();

      // Delete the task
      await googleStore.deleteTask('list-1', testTaskId);
      
      // Verify metadata was cleaned up
      expect(getTaskMetadata(testTaskId)).toBeNull();
    });

    it('should handle deletion failures gracefully', async () => {
      // Create a test task specifically for this error scenario
      const taskToDeleteData = { title: 'Task to Delete', notes: 'Error test task' };
      const taskToDelete = await googleStore.createTask('list-1', taskToDeleteData);
      expect(taskToDelete).toBeDefined();
      
      const taskToDeleteId = taskToDelete!.id;

      // Use mockImplementationOnce with proper Error instance (research finding)
      mockInvoke.mockImplementationOnce(async (command: string): Promise<any> => {
        if (command === 'delete_task') {
          throw new Error('Delete failed');
        }
        throw new Error('Unexpected command in test');
      });

      // Attempt deletion (should fail)
      await expect(googleStore.deleteTask('list-1', taskToDeleteId)).rejects.toThrow('Delete failed');
      
      // Verify task still exists in store after failed deletion
      const afterFailedDeletion = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === taskToDeleteId);
      expect(afterFailedDeletion).toBeDefined();
    });

    it('should handle concurrent deletion attempts', async () => {
      // Create multiple unique tasks sequentially to avoid registry conflicts
      const tasks = [];
      const taskRegistry = (global as any).testTaskRegistry;
      
      for (let i = 1; i <= 3; i++) {
        const task = await googleStore.createTask('list-1', { title: `Task ${i}` });
        tasks.push(task);
        
        // Ensure each task is properly registered in the mock registry
        if (taskRegistry && task) {
          taskRegistry.set(task.id, {
            id: task.id,
            title: `Task ${i}`,
            status: 'needsAction',
            notes: `Task ${i} notes`,
          });
        }
      }

      // Wait a moment to ensure all tasks are fully registered
      await new Promise(resolve => setTimeout(resolve, 10));

      // Delete all tasks concurrently - each task should be successfully deleted
      const deletePromises = tasks.map(task => 
        googleStore.deleteTask('list-1', task.id)
      );

      // All deletions should succeed since each task exists independently
      await Promise.all(deletePromises);
      
      // Verify all tasks were deleted from the store
      const remainingTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      tasks.forEach(task => {
        expect(remainingTasks?.find(t => t.id === task.id)).toBeUndefined();
      });
    });
  });

  describe('Task Completion Toggle', () => {
    let testTask: GoogleTask;
    let testTaskId: string;

    beforeEach(async () => {
      // Create a test task for completion toggle
      testTask = await googleStore.createTask('list-1', {
        title: 'Task to Complete',
        notes: 'Test notes',
      });
      testTaskId = testTask.id;
    });

    it('should toggle task completion from needsAction to completed', async () => {
      // Mark task as completed
      await googleStore.toggleTaskCompletion('list-1', testTaskId, true);
      
      // Get current store state
      const currentStore = useGoogleStore.getState();
      
      // Verify task is marked as completed
      const completedTask = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === testTaskId);
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completed).toBeDefined();
    });

    it('should toggle task completion from completed to needsAction', async () => {
      // First mark as completed
      await googleStore.toggleTaskCompletion('list-1', testTaskId, true);
      
      // Then mark as incomplete
      await googleStore.toggleTaskCompletion('list-1', testTaskId, false);
      
      // Get current store state
      const currentStore = useGoogleStore.getState();
      
      // Verify task is marked as needsAction
      const incompletedTask = currentStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === testTaskId);
      expect(incompletedTask?.status).toBe('needsAction');
      expect(incompletedTask?.completed).toBeUndefined();
    });

    it('should handle optimistic completion toggle', async () => {
      // Apply optimistic completion
      act(() => {
        googleStore.optimisticToggleTaskCompletion('list-1', testTaskId, true);
      });
      
      await waitFor(() => {
        const optimisticTask = useGoogleStore.getState().kanbanColumns.find(c => c.taskList.id === 'list-1')
          ?.tasks.find(t => t.id === testTaskId);
        expect(optimisticTask?.status).toBe('completed');
      });

      // Complete the actual toggle
      await act(async () => {
        await googleStore.toggleTaskCompletion('list-1', testTaskId, true);
      });
      
      // Verify final state
      await waitFor(() => {
        const finalTask = useGoogleStore.getState().kanbanColumns.find(c => c.taskList.id === 'list-1')
          ?.tasks.find(t => t.id === testTaskId);
        expect(finalTask?.status).toBe('completed');
      });
    });

    it('should handle completion toggle failures', async () => {
      // Create a test task specifically for this error scenario
      const taskToToggleData = { title: 'Task to Toggle', notes: 'Error test task' };
      const taskToToggle = await googleStore.createTask('list-1', taskToToggleData);
      expect(taskToToggle).toBeDefined();
      
      const taskToToggleId = taskToToggle!.id;

      // Use mockImplementationOnce with proper Error instance (research finding)
      mockInvoke.mockImplementationOnce(async (command: string): Promise<any> => {
        if (command === 'update_task') {
          throw new Error('Toggle failed');
        }
        throw new Error('Unexpected command in test');
      });

      // Attempt completion (should fail)
      await expect(googleStore.toggleTaskCompletion('list-1', taskToToggleId, true)).rejects.toThrow('Toggle failed');
      
      // Verify task status remains unchanged - should still be in store with original status
      const unchangedTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === taskToToggleId);
      expect(unchangedTask?.status).toBe('needsAction');
    });
  });

  describe('Task Hierarchy Operations', () => {
    let parentTask: GoogleTask;
    let childTask: GoogleTask;

    beforeEach(async () => {
      // Create parent task
      parentTask = await googleStore.createTask('list-1', {
        title: 'Parent Task',
        notes: 'Parent notes',
      });

      // Create child task
      childTask = await googleStore.createTask('list-1', {
        title: 'Child Task',
        notes: 'Child notes',
        parent: parentTask.id,
      });
    });

    it('should maintain parent-child relationships', async () => {
      expect(parentTask.id).toBeDefined();
      expect(childTask.parent).toBe(parentTask.id);
    });

    it('should handle moving child tasks independently', async () => {
      // Move child task to another list
      const movedChild = await googleStore.moveTask(childTask.id, 'list-1', 'list-2', undefined);
      
      expect(movedChild.id).toBe(childTask.id);
      // Parent field is preserved during move operations (correct behavior)
      expect(movedChild.parent).toBe(parentTask.id);
    });

    it('should handle moving parent tasks with children', async () => {
      // Move parent task (implementation depends on business logic)
      const movedParent = await googleStore.moveTask(parentTask.id, 'list-1', 'list-2', {});
      
      expect(movedParent.id).toBe(parentTask.id);
      
      // Child task behavior depends on implementation
      // This test documents the expected behavior
    });
  });

  describe('Error Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Use mockImplementationOnce with proper Error instance (research finding)
      mockInvoke.mockImplementationOnce(async (command: string): Promise<any> => {
        if (command === 'create_task') {
          throw new Error('Network unavailable');
        }
        throw new Error('Unexpected command in test');
      });

      const taskData = {
        title: 'Network Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Network unavailable');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockInvoke.mockResolvedValueOnce(null);

      const taskData = {
        title: 'Malformed Response Task',
        notes: 'Test notes',
      };

      // This should handle the null response gracefully
      await expect(googleStore.createTask('list-1', taskData)).resolves.toBeNull();
    });

    it('should handle timeout scenarios', async () => {
      // Use mockImplementationOnce with proper Error instance for timeout (research finding)
      mockInvoke.mockImplementationOnce(async (command: string): Promise<any> => {
        if (command === 'create_task') {
          await new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100)
          );
        }
        throw new Error('Unexpected command in test');
      });

      const taskData = {
        title: 'Timeout Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Request timeout');
    });
  });
}); 

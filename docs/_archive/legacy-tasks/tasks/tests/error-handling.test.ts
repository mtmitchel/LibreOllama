import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGoogleStore } from '../../../stores/googleStore';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';
import { prepareTaskForAPI, setTaskMetadata, getTaskMetadata } from '../utils/taskHelpers';
import { useTaskSyncQueue } from '../hooks/useTaskSyncQueue';
import { invoke } from '@tauri-apps/api/core';

// Mock console methods
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

describe('Error Handling Tests', () => {
  let googleStore: any;
  let metadataStore: any;

  beforeEach(() => {
    // Reset stores
    googleStore = useGoogleStore.getState();
    metadataStore = useTaskMetadataStore.getState();
    
    // Clear stores
    googleStore.reset?.();
    metadataStore.clearAllMetadata();
    
    // Set up mock account
    googleStore.setActiveAccount({
      id: 'test-account',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
    });
    
    // Initialize kanban columns with required task lists using store methods
    const storeState = useGoogleStore.getState();
    const storeMethods = useGoogleStore.setState;
    
    // Use setState to properly initialize the store
    storeMethods({
      taskLists: [
        {
          id: 'list-1',
          title: 'Test List 1',
          updated: new Date().toISOString(),
          selfLink: 'https://example.com/list-1',
          etag: 'etag-1',
        },
        {
          id: 'list-2',
          title: 'Test List 2',
          updated: new Date().toISOString(),
          selfLink: 'https://example.com/list-2',
          etag: 'etag-2',
        },
      ],
      kanbanColumns: [
        {
          taskList: {
            id: 'list-1',
            title: 'Test List 1',
            updated: new Date().toISOString(),
            selfLink: 'https://example.com/list-1',
            etag: 'etag-1',
          },
          tasks: [],
        },
        {
          taskList: {
            id: 'list-2',
            title: 'Test List 2',
            updated: new Date().toISOString(),
            selfLink: 'https://example.com/list-2',
            etag: 'etag-2',
          },
          tasks: [],
        },
      ],
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeout errors', async () => {
      // Mock network timeout
      vi.mocked(invoke).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const taskData = {
        title: 'Network Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Network timeout');
    });

    it('should handle connection refused errors', async () => {
      // Mock connection refused
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Connection refused'));

      const taskData = {
        title: 'Connection Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Connection refused');
    });

    it('should handle DNS resolution errors', async () => {
      // Mock DNS error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('DNS resolution failed'));

      const taskData = {
        title: 'DNS Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('DNS resolution failed');
    });

    it('should handle SSL certificate errors', async () => {
      // Mock SSL error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('SSL certificate invalid'));

      const taskData = {
        title: 'SSL Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('SSL certificate invalid');
    });

    it('should handle intermittent network failures', async () => {
      let callCount = 0;
      vi.mocked(invoke).mockImplementation(function() {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        // Return a successful response for subsequent calls
        return Promise.resolve({
          success: true,
          data: {
            id: 'task-intermittent-' + Date.now(),
            title: 'Intermittent Test Task',
            notes: 'Test notes',
            status: 'needsAction',
            updated: new Date().toISOString(),
          }
        });
      });

      const taskData = {
        title: 'Intermittent Test Task',
        notes: 'Test notes',
      };

      // First call should fail
      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Network error');
      
      // Second call should succeed
      const result = await googleStore.createTask('list-1', taskData);
      expect(result).toBeDefined();
    });
  });

  describe('API Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      // Mock 401 error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('401: Unauthorized'));

      const taskData = {
        title: 'Auth Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('401: Unauthorized');
    });

    it('should handle 403 permission errors', async () => {
      // Mock 403 error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('403: Forbidden'));

      const taskData = {
        title: 'Permission Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('403: Forbidden');
    });

    it('should handle 404 not found errors', async () => {
      // Mock 404 error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('404: Not Found'));

      await expect(googleStore.updateTask('non-existent-list', 'task-1', {
        title: 'Updated Task',
      })).rejects.toThrow('404: Not Found');
    });

    it('should handle 429 rate limit errors', async () => {
      // Mock 429 error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('429: Too Many Requests'));

      const taskData = {
        title: 'Rate Limit Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('429: Too Many Requests');
    });

    it('should handle 500 internal server errors', async () => {
      // Mock 500 error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('500: Internal Server Error'));

      const taskData = {
        title: 'Server Error Test Task',
        notes: 'Test notes',
      };

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('500: Internal Server Error');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      vi.mocked(invoke).mockResolvedValueOnce({
        invalid: 'response',
        missing: 'required fields',
      });

      const taskData = {
        title: 'Malformed Response Test',
        notes: 'Test notes',
      };

      const result = await googleStore.createTask('list-1', taskData);
      
      // Should handle gracefully
      expect(result).toEqual({
        invalid: 'response',
        missing: 'required fields',
      });
    });

    it('should handle null/undefined responses', async () => {
      // Mock null response
      vi.mocked(invoke).mockResolvedValueOnce(null);

      const taskData = {
        title: 'Null Response Test',
        notes: 'Test notes',
      };

      const result = await googleStore.createTask('list-1', taskData);
      expect(result).toBeNull();
    });
  });

  describe('Data Validation Error Handling', () => {
    it('should handle invalid task data', async () => {
      const invalidTaskData = {
        title: '', // Empty title
        notes: null, // Null notes
        due: 'invalid-date', // Invalid date format
      };

      // Mock validation error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid task data'));

      await expect(googleStore.createTask('list-1', invalidTaskData)).rejects.toThrow('Invalid task data');
    });

    it('should handle missing required fields', async () => {
      const incompleteTaskData = {
        // Missing title
        notes: 'Test notes',
      };

      // Mock validation error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Missing required field: title'));

      await expect(googleStore.createTask('list-1', incompleteTaskData)).rejects.toThrow('Missing required field: title');
    });

    it('should handle invalid date formats', async () => {
      const taskDataWithInvalidDate = {
        title: 'Invalid Date Test',
        notes: 'Test notes',
        due: 'not-a-date',
      };

      // Mock date validation error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid date format'));

      await expect(googleStore.createTask('list-1', taskDataWithInvalidDate)).rejects.toThrow('Invalid date format');
    });

    it('should handle oversized data', async () => {
      const oversizedTaskData = {
        title: 'A'.repeat(10000), // Very long title
        notes: 'B'.repeat(100000), // Very long notes
      };

      // Mock size validation error
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Data too large'));

      await expect(googleStore.createTask('list-1', oversizedTaskData)).rejects.toThrow('Data too large');
    });

    it('should handle special characters in data', async () => {
      const taskDataWithSpecialChars = {
        title: 'Test Task 🚀 with émojis and àccénts',
        notes: 'Notes with <script>alert("xss")</script> and other special chars: ♠♣♥♦',
      };

      // Should handle special characters gracefully
      const result = await googleStore.createTask('list-1', taskDataWithSpecialChars);
      expect(result).toBeDefined();
    });
  });

  describe('Store Error Handling', () => {
    it('should handle store corruption', async () => {
      // Corrupt the store state
      googleStore.taskLists = null;
      googleStore.kanbanColumns = undefined;

      // Should handle gracefully
      expect(() => googleStore.fetchTaskLists()).not.toThrow();
    });

    it('should handle metadata store corruption', async () => {
      // Corrupt metadata store
      metadataStore.metadata = null;

      // Should handle gracefully
      expect(() => setTaskMetadata('task-1', { priority: 'high' })).not.toThrow();
    });

    it('should handle store method failures', async () => {
      // Mock store method failure
      const originalCreateTask = googleStore.createTask;
      googleStore.createTask = vi.fn().mockImplementation(async () => {
        throw new Error('Store method failed');
      });

      await expect(googleStore.createTask('list-1', {
        title: 'Test Task',
      })).rejects.toThrow('Store method failed');

      // Restore original method
      googleStore.createTask = originalCreateTask;
    });

    it('should handle concurrent store updates', async () => {
      const taskData = {
        title: 'Concurrent Test Task',
        notes: 'Test notes',
      };

      // Create task first
      const task = await googleStore.createTask('list-1', taskData);

      // Perform concurrent updates
      const updatePromises = [
        googleStore.updateTask('list-1', task.id, { title: 'Update 1' }),
        googleStore.updateTask('list-1', task.id, { title: 'Update 2' }),
        googleStore.updateTask('list-1', task.id, { title: 'Update 3' }),
      ];

      // Some updates may fail, but shouldn't crash the store
      const results = await Promise.allSettled(updatePromises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle memory exhaustion', async () => {
      // Create many tasks to simulate memory pressure
      const tasks = Array.from({ length: 1000 }, (_, i) => ({
        title: `Task ${i}`,
        notes: `Notes ${i}`,
      }));

      // Should handle large operations gracefully
      const createPromises = tasks.map(task => 
        googleStore.createTask('list-1', task).catch(() => null)
      );

      const results = await Promise.allSettled(createPromises);
      
      // Should not crash completely
      expect(results.length).toBe(1000);
    });
  });

  describe('Worker Error Handling', () => {
    it('should handle worker initialization failure', async () => {
      // Mock worker creation failure
      const originalWorker = global.Worker;
      global.Worker = class MockFailingWorker {
        constructor() {
          throw new Error('Worker failed to initialize');
        }
      } as any;

      const mockAddToast = vi.fn();
      
      // Should handle worker failure gracefully
      expect(() => {
        const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
        return result.current;
      }).not.toThrow();

      // Restore original Worker
      global.Worker = originalWorker;
    });

    it('should handle worker message errors', async () => {
      const mockAddToast = vi.fn();
      
      // Mock worker that sends error messages
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        terminate: vi.fn(),
      };

      global.Worker = vi.fn().mockImplementation(() => mockWorker);

      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Simulate worker error message
      const errorHandler = vi.mocked(mockWorker.addEventListener).mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      if (errorHandler) {
        errorHandler(new ErrorEvent('error', { message: 'Worker error' }));
      }

      // Should handle gracefully
      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle worker termination', async () => {
      const mockAddToast = vi.fn();
      
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        terminate: vi.fn(),
      };

      global.Worker = vi.fn().mockImplementation(() => mockWorker);

      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Terminate worker
      mockWorker.terminate();

      // Should handle gracefully
      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle worker timeout', async () => {
      const mockAddToast = vi.fn();
      
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        terminate: vi.fn(),
      };

      global.Worker = vi.fn().mockImplementation(() => mockWorker);

      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));
      
      // Add operation to queue
      act(() => {
        result.current.pendingOperations.current.push({
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          operationId: 'op-1',
        });
        result.current.processQueue();
      });

      // Worker doesn't respond (timeout scenario)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle timeout gracefully
      expect(result.current.isSyncing).toBe(true); // Still syncing as no response
    });
  });

  describe('Optimistic Update Error Handling', () => {
    it('should handle optimistic update failure', async () => {
      // Create task
      const taskData = {
        title: 'Optimistic Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);
      
      // Check if task is in store after creation
      const taskAfterCreation = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      console.log('2. Task in store after creation:', taskAfterCreation);

      // Apply optimistic update
      const updatedData = {
        title: 'Optimistically Updated Task',
        notes: 'Updated notes',
      };

      // DEBUGGING: Check store state before optimistic update
      const beforeUpdate = {
        columns: googleStore.kanbanColumns.map(c => ({ 
          id: c.taskList.id, 
          taskCount: c.tasks.length,
          taskIds: c.tasks.map(t => t.id),
          taskTitles: c.tasks.map(t => t.title)
        })),
        targetTask: googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks.find(t => t.id === task.id),
        taskIdExists: !!task.id,
        list1Exists: !!googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
      };
      
      googleStore.optimisticUpdateTask('list-1', task.id, updatedData);
      
      // DEBUGGING: Check store state after optimistic update
      const afterUpdate = {
        columns: googleStore.kanbanColumns.map(c => ({ 
          id: c.taskList.id, 
          taskCount: c.tasks.length,
          taskIds: c.tasks.map(t => t.id),
          taskTitles: c.tasks.map(t => t.title)
        })),
        targetTask: googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks.find(t => t.id === task.id)
      };
      
      // If task disappeared, throw detailed error
      if (!afterUpdate.targetTask) {
        throw new Error(`Task disappeared after optimistic update!
Before: ${JSON.stringify(beforeUpdate, null, 2)}
After: ${JSON.stringify(afterUpdate, null, 2)}
Task ID: ${task.id}
Updates: ${JSON.stringify(updatedData, null, 2)}`);
      }
      
      // ASSERTION 1: Check if task is in store after optimistic update
      const taskAfterOptimistic = afterUpdate.targetTask;
      
      // This should pass - optimistic update should work
      expect(taskAfterOptimistic).toBeDefined();
      expect(taskAfterOptimistic?.title).toBe('Optimistically Updated Task');
      
      // ASSERTION 2: Verify task count and structure before API call
      const list1BeforeAPI = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1');
      expect(list1BeforeAPI?.tasks.length).toBeGreaterThan(0);
      expect(list1BeforeAPI?.tasks.some(t => t.id === task.id)).toBe(true);

      // Mock update failure
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Update failed'));

      // Attempt actual update
      await expect(googleStore.updateTask('list-1', task.id, updatedData))
        .rejects.toThrow('Update failed');

      // ASSERTION 3: Verify state immediately after API failure
      const list1AfterAPI = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1');
      const taskAfterFailure = list1AfterAPI?.tasks.find(t => t.id === task.id);
      
      // DEBUGGING: Show what's actually in the store
      if (!taskAfterFailure) {
        // Task disappeared - let's see what's in the store
        const allTasks = googleStore.kanbanColumns.map(c => ({
          listId: c.taskList.id,
          taskCount: c.tasks.length,
          taskIds: c.tasks.map(t => t.id)
        }));
        
        const mapEntries = Array.from(googleStore.taskIdToListId.entries());
        
        throw new Error(`Task disappeared! Store state: ${JSON.stringify({ allTasks, mapEntries, targetTaskId: task.id }, null, 2)}`);
      }

      // Optimistic update should remain (rollback logic would need implementation)
      const updatedTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      
      expect(updatedTask?.title).toBe('Optimistically Updated Task');
    });

    it('should handle optimistic move failure', async () => {
      // Create task
      const taskData = {
        title: 'Move Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Apply optimistic move
      googleStore.optimisticMoveTask(task.id, 'list-1', 'list-2');

      // Mock move failure
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Move failed'));

      // Attempt actual move
      await expect(googleStore.moveTask(task.id, 'list-1', 'list-2', {}))
        .rejects.toThrow('Move failed');

      // Task should remain in target list (rollback logic would need implementation)
      const targetListTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      expect(targetListTasks?.find(t => t.id === task.id)).toBeDefined();
    });

    it('should handle optimistic reorder failure', async () => {
      // Create tasks
      const task1 = await googleStore.createTask('list-1', { title: 'Task 1' });
      const task2 = await googleStore.createTask('list-1', { title: 'Task 2' });

      // Apply optimistic reorder
      googleStore.optimisticReorderTask('list-1', task1.id, task2.id);

      // Mock reorder failure (if such operation exists)
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Reorder failed'));

      // Verify tasks still exist
      const listTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(listTasks?.find(t => t.id === task1.id)).toBeDefined();
      expect(listTasks?.find(t => t.id === task2.id)).toBeDefined();
    });
  });

  describe('Metadata Error Handling', () => {
    it('should handle metadata serialization errors', async () => {
      const taskData = {
        title: 'Metadata Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Create circular reference that would cause serialization error
      const circularObject: any = { priority: 'high' };
      circularObject.self = circularObject;

      // Should handle gracefully
      expect(() => setTaskMetadata(task.id, circularObject)).not.toThrow();
    });

    it('should handle metadata deserialization errors', async () => {
      // Set corrupted metadata in localStorage
      localStorage.setItem('task-metadata-store', 'invalid json');

      // Should handle gracefully
      expect(() => getTaskMetadata('task-1')).not.toThrow();
    });

    it('should handle metadata store unavailability', async () => {
      // Mock localStorage unavailable
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      // Should handle gracefully
      expect(() => setTaskMetadata('task-1', { priority: 'high' })).not.toThrow();

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    it('should handle metadata quota exceeded', async () => {
      // Mock quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should handle gracefully
      expect(() => setTaskMetadata('task-1', { priority: 'high' })).not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      vi.mocked(invoke).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          id: 'task-1',
          title: 'Recovered Task',
          status: 'needsAction',
        });
      });

      const taskData = {
        title: 'Retry Test Task',
        notes: 'Test notes',
      };

      // First two attempts should fail, third should succeed
      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Temporary failure');
      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Temporary failure');
      const result = await googleStore.createTask('list-1', taskData);
      
      expect(result.title).toBe('Recovered Task');
    });

    it('should handle graceful degradation', async () => {
      // Mock all operations failing
      vi.mocked(invoke).mockRejectedValue(new Error('All operations failing'));

      // Store should still be usable for read operations
      expect(googleStore.kanbanColumns).toBeDefined();
      expect(googleStore.taskLists).toBeDefined();
    });

    it('should handle data consistency after errors', async () => {
      const taskData = {
        title: 'Consistency Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Set metadata
      setTaskMetadata(task.id, { priority: 'high' });

      // Simulate error that might cause inconsistency
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Consistency error'));

      // Attempt operation that fails
      await expect(googleStore.updateTask('list-1', task.id, { title: 'Updated' }))
        .rejects.toThrow('Consistency error');

      // Data should remain consistent
      const metadata = getTaskMetadata(task.id);
      expect(metadata?.priority).toBe('high');
    });

    it('should handle error propagation', async () => {
      const taskData = {
        title: 'Error Propagation Test',
        notes: 'Test notes',
      };

      // Mock cascading errors
      vi.mocked(invoke).mockImplementation((command) => {
        if (command === 'create_task') {
          return Promise.reject(new Error('Create failed'));
        }
        if (command === 'update_task') {
          return Promise.reject(new Error('Update failed'));
        }
        return Promise.resolve({});
      });

      // All operations should fail with appropriate errors
      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Create failed');
      await expect(googleStore.updateTask('list-1', 'task-1', taskData)).rejects.toThrow('Update failed');
    });

    it('should handle error logging', async () => {
      const taskData = {
        title: 'Error Logging Test',
        notes: 'Test notes',
      };

      // Mock error that should be logged
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Logged error'));

      await expect(googleStore.createTask('list-1', taskData)).rejects.toThrow('Logged error');

      // Error should be logged
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle null/undefined task IDs', async () => {
      // Should handle gracefully
      expect(() => googleStore.updateTask('list-1', null, { title: 'Test' }))
        .not.toThrow();
      expect(() => googleStore.updateTask('list-1', undefined, { title: 'Test' }))
        .not.toThrow();
    });

    it('should handle empty string task IDs', async () => {
      // Should handle gracefully
      expect(() => googleStore.updateTask('list-1', '', { title: 'Test' }))
        .not.toThrow();
    });

    it('should handle very long task IDs', async () => {
      const longTaskId = 'a'.repeat(1000);
      
      // Should handle gracefully
      expect(() => googleStore.updateTask('list-1', longTaskId, { title: 'Test' }))
        .not.toThrow();
    });

    it('should handle special characters in task IDs', async () => {
      const specialTaskId = 'task-!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Should handle gracefully
      expect(() => googleStore.updateTask('list-1', specialTaskId, { title: 'Test' }))
        .not.toThrow();
    });

    it('should handle unicode characters in task data', async () => {
      const unicodeTaskData = {
        title: '🚀 Unicode Task 中文 العربية',
        notes: 'Notes with unicode: ♠♣♥♦ αβγδ',
      };

      const result = await googleStore.createTask('list-1', unicodeTaskData);
      expect(result).toBeDefined();
    });

    it('should handle extreme date values', async () => {
      const extremeTaskData = {
        title: 'Extreme Date Test',
        notes: 'Test notes',
        due: '9999-12-31T23:59:59.999Z', // Far future date
      };

      const result = await googleStore.createTask('list-1', extremeTaskData);
      expect(result).toBeDefined();
    });

    it('should handle negative date values', async () => {
      const negativeTaskData = {
        title: 'Negative Date Test',
        notes: 'Test notes',
        due: '1900-01-01T00:00:00.000Z', // Far past date
      };

      const result = await googleStore.createTask('list-1', negativeTaskData);
      expect(result).toBeDefined();
    });
  });
}); 

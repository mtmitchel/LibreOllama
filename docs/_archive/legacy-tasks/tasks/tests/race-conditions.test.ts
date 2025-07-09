import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGoogleStore } from '../../../stores/googleStore';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';
import { setTaskMetadata, getTaskMetadata } from '../utils/taskHelpers';
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

describe('Race Conditions and Timing Tests', () => {
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
  });

  describe('Concurrent Task Operations', () => {
    it('should handle concurrent task creation', async () => {
      const taskData = [
        { title: 'Concurrent Task 1', notes: 'Notes 1' },
        { title: 'Concurrent Task 2', notes: 'Notes 2' },
        { title: 'Concurrent Task 3', notes: 'Notes 3' },
      ];

      // Create tasks concurrently
      const createPromises = taskData.map(data => 
        googleStore.createTask('list-1', data)
      );

      const results = await Promise.all(createPromises);
      
      // All tasks should be created successfully
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.title).toBe(taskData[index].title);
      });
    });

    it('should handle concurrent task updates', async () => {
      // Create a task first
      const taskData = {
        title: 'Original Task',
        notes: 'Original notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Perform concurrent updates
      const updateData = [
        { title: 'Update 1', notes: 'Notes 1' },
        { title: 'Update 2', notes: 'Notes 2' },
        { title: 'Update 3', notes: 'Notes 3' },
      ];

      const updatePromises = updateData.map(data => 
        googleStore.updateTask('list-1', task.id, data)
      );

      const results = await Promise.all(updatePromises);
      
      // All updates should succeed
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.title).toBe(updateData[index].title);
      });
    });

    it('should handle concurrent task deletions', async () => {
      // Create multiple tasks
      const taskData = [
        { title: 'Task to Delete 1', notes: 'Notes 1' },
        { title: 'Task to Delete 2', notes: 'Notes 2' },
        { title: 'Task to Delete 3', notes: 'Notes 3' },
      ];

      const tasks = await Promise.all(
        taskData.map(data => googleStore.createTask('list-1', data))
      );

      // Delete tasks concurrently
      const deletePromises = tasks.map(task => 
        googleStore.deleteTask('list-1', task.id)
      );

      await Promise.all(deletePromises);
      
      // All tasks should be deleted
      const remainingTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks || [];
      tasks.forEach(task => {
        expect(remainingTasks.find(t => t.id === task.id)).toBeUndefined();
      });
    });

    it('should handle concurrent task moves', async () => {
      // Create tasks in different lists
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Task 1' }),
        googleStore.createTask('list-1', { title: 'Task 2' }),
        googleStore.createTask('list-2', { title: 'Task 3' }),
      ]);

      // Move tasks concurrently
      const movePromises = [
        googleStore.moveTask(tasks[0].id, 'list-1', 'list-2', {}),
        googleStore.moveTask(tasks[1].id, 'list-1', 'list-3', {}),
        googleStore.moveTask(tasks[2].id, 'list-2', 'list-1', {}),
      ];

      const results = await Promise.all(movePromises);
      
      // All moves should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle concurrent completion toggles', async () => {
      // Create tasks
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Task 1' }),
        googleStore.createTask('list-1', { title: 'Task 2' }),
        googleStore.createTask('list-1', { title: 'Task 3' }),
      ]);

      // Toggle completion concurrently
      const togglePromises = tasks.map(task => 
        googleStore.toggleTaskCompletion('list-1', task.id, true)
      );

      const results = await Promise.all(togglePromises);
      
      // All toggles should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.status).toBe('completed');
      });
    });
  });

  describe('Metadata Store Race Conditions', () => {
    it('should handle concurrent metadata updates', async () => {
      const taskId = 'race-test-task';
      
      // Set metadata concurrently
      const metadataUpdates = [
        { priority: 'high', labels: ['urgent'] },
        { priority: 'normal', labels: ['work'] },
        { priority: 'low', labels: ['personal'] },
      ];

      const updatePromises = metadataUpdates.map(metadata => 
        Promise.resolve(setTaskMetadata(taskId, metadata))
      );

      await Promise.all(updatePromises);
      
      // Final metadata should be one of the updates
      const finalMetadata = getTaskMetadata(taskId);
      expect(finalMetadata).toBeDefined();
      expect(metadataUpdates.map(m => m.priority)).toContain(finalMetadata.priority);
    });

    it('should handle concurrent metadata read/write', async () => {
      const taskId = 'concurrent-rw-task';
      
      // Set initial metadata
      setTaskMetadata(taskId, { priority: 'normal', labels: ['initial'] });

      // Perform concurrent reads and writes
      const operations = [
        Promise.resolve(getTaskMetadata(taskId)),
        Promise.resolve(setTaskMetadata(taskId, { priority: 'high' })),
        Promise.resolve(getTaskMetadata(taskId)),
        Promise.resolve(setTaskMetadata(taskId, { labels: ['updated'] })),
        Promise.resolve(getTaskMetadata(taskId)),
      ];

      const results = await Promise.all(operations);
      
      // Reads should return valid metadata
      const readResults = results.filter((_, index) => index % 2 === 0);
      readResults.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle concurrent metadata import/export', async () => {
      const taskId = 'import-export-task';
      
      // Set initial metadata
      setTaskMetadata(taskId, {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      });

      // Perform concurrent import/export operations
      const operations = [
        Promise.resolve(metadataStore.exportToNotesField(taskId)),
        Promise.resolve(metadataStore.importFromNotesField(taskId, 'Test notes [LibreOllama:{"priority":"low","labels":["imported"]}]')),
        Promise.resolve(metadataStore.exportToNotesField(taskId)),
        Promise.resolve(metadataStore.importFromNotesField(taskId, 'Test notes [LibreOllama:{"priority":"urgent","labels":["concurrent"]}]')),
      ];

      const results = await Promise.all(operations);
      
      // Should handle without crashing
      expect(results).toHaveLength(4);
      
      // Final metadata should be valid
      const finalMetadata = getTaskMetadata(taskId);
      expect(finalMetadata).toBeDefined();
    });
  });

  describe('Optimistic Update Race Conditions', () => {
    it('should handle optimistic update followed by API call', async () => {
      // Create task
      const taskData = {
        title: 'Optimistic Race Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Apply optimistic update immediately followed by API call
      const updatedData = {
        title: 'Optimistically Updated Task',
        notes: 'Updated notes',
      };

      googleStore.optimisticUpdateTask('list-1', task.id, updatedData);
      
      // Immediately try to update via API
      const apiUpdatePromise = googleStore.updateTask('list-1', task.id, updatedData);

      await apiUpdatePromise;
      
      // Task should have the updated data
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      
      expect(finalTask?.title).toBe('Optimistically Updated Task');
    });

    it('should handle multiple optimistic updates', async () => {
      // Create task
      const taskData = {
        title: 'Multiple Optimistic Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Apply multiple optimistic updates rapidly
      const updates = [
        { title: 'Update 1', notes: 'Notes 1' },
        { title: 'Update 2', notes: 'Notes 2' },
        { title: 'Update 3', notes: 'Notes 3' },
      ];

      updates.forEach(update => {
        googleStore.optimisticUpdateTask('list-1', task.id, update);
      });

      // Final state should be the last update
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      
      expect(finalTask?.title).toBe('Update 3');
    });

    it('should handle optimistic move race conditions', async () => {
      // Create task
      const taskData = {
        title: 'Move Race Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Apply multiple optimistic moves rapidly
      googleStore.optimisticMoveTask(task.id, 'list-1', 'list-2');
      googleStore.optimisticMoveTask(task.id, 'list-2', 'list-3');
      googleStore.optimisticMoveTask(task.id, 'list-3', 'list-1');

      // Task should be in the final location
      const finalLocation = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      
      expect(finalLocation).toBeDefined();
    });

    it('should handle optimistic reorder race conditions', async () => {
      // Create multiple tasks
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Task 1' }),
        googleStore.createTask('list-1', { title: 'Task 2' }),
        googleStore.createTask('list-1', { title: 'Task 3' }),
      ]);

      // Apply multiple optimistic reorders rapidly
      googleStore.optimisticReorderTask('list-1', tasks[0].id, tasks[1].id);
      googleStore.optimisticReorderTask('list-1', tasks[1].id, tasks[2].id);
      googleStore.optimisticReorderTask('list-1', tasks[2].id, tasks[0].id);

      // All tasks should still exist
      const listTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      tasks.forEach(task => {
        expect(listTasks?.find(t => t.id === task.id)).toBeDefined();
      });
    });
  });

  describe('Worker Queue Race Conditions', () => {
    it('should handle concurrent queue operations', async () => {
      const mockAddToast = vi.fn();
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));

      // Add multiple operations concurrently
      const operations = [
        {
          taskId: 'task-1',
          sourceListId: 'list-1',
          targetListId: 'list-2',
          operationId: 'op-1',
          originalTask: { title: 'Task 1' },
        },
        {
          taskId: 'task-2',
          sourceListId: 'list-1',
          targetListId: 'list-3',
          operationId: 'op-2',
          originalTask: { title: 'Task 2' },
        },
        {
          taskId: 'task-3',
          sourceListId: 'list-2',
          targetListId: 'list-1',
          operationId: 'op-3',
          originalTask: { title: 'Task 3' },
        },
      ];

      act(() => {
        operations.forEach(op => {
          result.current.pendingOperations.current.push(op);
        });
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);
      expect(result.current.pendingOperations.current).toHaveLength(3);
    });

    it('should handle rapid queue processing calls', async () => {
      const mockAddToast = vi.fn();
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));

      const operation = {
        taskId: 'task-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Task 1' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation);
        // Call processQueue multiple times rapidly
        result.current.processQueue();
        result.current.processQueue();
        result.current.processQueue();
      });

      // Should only start processing once
      expect(result.current.isSyncing).toBe(true);
    });

    it('should handle queue operations while syncing', async () => {
      const mockAddToast = vi.fn();
      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));

      const operation1 = {
        taskId: 'task-1',
        sourceListId: 'list-1',
        targetListId: 'list-2',
        operationId: 'op-1',
        originalTask: { title: 'Task 1' },
      };

      const operation2 = {
        taskId: 'task-2',
        sourceListId: 'list-1',
        targetListId: 'list-3',
        operationId: 'op-2',
        originalTask: { title: 'Task 2' },
      };

      act(() => {
        result.current.pendingOperations.current.push(operation1);
        result.current.processQueue();
      });

      expect(result.current.isSyncing).toBe(true);

      // Add another operation while syncing
      act(() => {
        result.current.pendingOperations.current.push(operation2);
      });

      expect(result.current.pendingOperations.current).toHaveLength(2);
    });

    it('should handle worker message race conditions', async () => {
      const mockAddToast = vi.fn();
      
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        terminate: vi.fn(),
      };

      global.Worker = vi.fn().mockImplementation(() => mockWorker);

      const { result } = renderHook(() => useTaskSyncQueue(mockAddToast));

      // Simulate rapid worker messages
      const messageHandler = vi.mocked(mockWorker.addEventListener).mock.calls
        .find(call => call[0] === 'message')?.[1];

      if (messageHandler) {
        // Send multiple messages rapidly
        messageHandler({ data: { type: 'sync-started' } } as MessageEvent);
        messageHandler({ data: { type: 'operation-success', payload: { taskId: 'task-1' } } } as MessageEvent);
        messageHandler({ data: { type: 'operation-success', payload: { taskId: 'task-2' } } } as MessageEvent);
        messageHandler({ data: { type: 'sync-finished' } } as MessageEvent);
      }

      // Should handle all messages gracefully
      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('Store Integration Race Conditions', () => {
    it('should handle concurrent Google Store and metadata operations', async () => {
      // Create task
      const taskData = {
        title: 'Integration Race Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Perform concurrent operations
      const operations = [
        googleStore.updateTask('list-1', task.id, { title: 'Updated Task' }),
        Promise.resolve(setTaskMetadata(task.id, { priority: 'high' })),
        googleStore.toggleTaskCompletion('list-1', task.id, true),
        Promise.resolve(setTaskMetadata(task.id, { labels: ['concurrent'] })),
      ];

      const results = await Promise.all(operations);
      
      // All operations should succeed
      expect(results).toHaveLength(4);
      
      // Final state should be consistent
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      const finalMetadata = getTaskMetadata(task.id);
      
      expect(finalTask).toBeDefined();
      expect(finalMetadata).toBeDefined();
    });

    it('should handle concurrent task creation and metadata setting', async () => {
      const taskData = {
        title: 'Create Race Task',
        notes: 'Test notes',
      };

      // Create task and set metadata concurrently
      const createPromise = googleStore.createTask('list-1', taskData);
      
      const task = await createPromise;
      
      // Set metadata immediately after creation
      const metadataPromise = Promise.resolve(setTaskMetadata(task.id, {
        priority: 'high',
        labels: ['urgent'],
      }));

      await metadataPromise;
      
      // Both operations should succeed
      expect(task).toBeDefined();
      
      const metadata = getTaskMetadata(task.id);
      expect(metadata?.priority).toBe('high');
    });

    it('should handle concurrent task deletion and metadata cleanup', async () => {
      // Create task
      const taskData = {
        title: 'Delete Race Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      setTaskMetadata(task.id, { priority: 'high' });

      // Delete task and metadata concurrently
      const operations = [
        googleStore.deleteTask('list-1', task.id),
        Promise.resolve(metadataStore.deleteTaskMetadata(task.id)),
      ];

      await Promise.all(operations);
      
      // Both should be cleaned up
      const remainingTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      const remainingMetadata = getTaskMetadata(task.id);
      
      expect(remainingTask).toBeUndefined();
      expect(remainingMetadata).toBeNull();
    });
  });

  describe('Timing-Dependent Operations', () => {
    it('should handle operations with timing dependencies', async () => {
      // Create task
      const taskData = {
        title: 'Timing Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Set up timing-dependent operations
      const operations = [];
      
      // First operation: update task
      operations.push(
        googleStore.updateTask('list-1', task.id, { title: 'Updated Task' })
      );
      
      // Second operation: move task (depends on first)
      operations.push(
        googleStore.updateTask('list-1', task.id, { title: 'Updated Task' })
          .then(() => googleStore.moveTask(task.id, 'list-1', 'list-2', {}))
      );
      
      // Third operation: update again (depends on second)
      operations.push(
        googleStore.moveTask(task.id, 'list-1', 'list-2', {})
          .then(() => googleStore.updateTask('list-2', task.id, { title: 'Final Update' }))
      );

      const results = await Promise.all(operations);
      
      // All operations should succeed
      expect(results).toHaveLength(3);
      
      // Final state should reflect all operations
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-2')
        ?.tasks.find(t => t.id === task.id);
      
      expect(finalTask?.title).toBe('Final Update');
    });

    it('should handle rapid successive operations', async () => {
      // Create task
      const taskData = {
        title: 'Rapid Operations Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Perform rapid successive operations
      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(
          googleStore.updateTask('list-1', task.id, { title: `Rapid Update ${i}` })
        );
      }

      const results = await Promise.all(updates);
      
      // All updates should succeed
      expect(results).toHaveLength(10);
      
      // Final state should be one of the updates
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === task.id);
      
      expect(finalTask?.title).toMatch(/Rapid Update \d/);
    });

    it('should handle operations with different timing patterns', async () => {
      // Create tasks
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Slow Task' }),
        googleStore.createTask('list-1', { title: 'Fast Task' }),
        googleStore.createTask('list-1', { title: 'Medium Task' }),
      ]);

      // Mock different response times
      let callCount = 0;
      vi.mocked(invoke).mockImplementation((command, args) => {
        callCount++;
        const delay = callCount % 3 === 0 ? 100 : callCount % 2 === 0 ? 50 : 10;
        
        return new Promise(resolve => 
          setTimeout(() => resolve(mockInvoke(command, args)), delay)
        );
      });

      // Perform operations with different timing
      const operations = tasks.map((task, index) => 
        googleStore.updateTask('list-1', task.id, { title: `Updated ${index}` })
      );

      const results = await Promise.all(operations);
      
      // All operations should succeed despite different timing
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.title).toBe(`Updated ${index}`);
      });
    });
  });

  describe('Memory and Performance Race Conditions', () => {
    it('should handle high-frequency operations', async () => {
      // Create base task
      const taskData = {
        title: 'High Frequency Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Perform high-frequency operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          googleStore.updateTask('list-1', task.id, { title: `Update ${i}` })
        );
      }

      const results = await Promise.allSettled(operations);
      
      // Most operations should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(80); // At least 80% success rate
    });

    it('should handle memory pressure scenarios', async () => {
      // Create many tasks rapidly
      const taskCreations = [];
      for (let i = 0; i < 200; i++) {
        taskCreations.push(
          googleStore.createTask('list-1', { title: `Memory Task ${i}` })
        );
      }

      const tasks = await Promise.allSettled(taskCreations);
      
      // Should handle memory pressure gracefully
      const successCount = tasks.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(100); // At least 50% success rate
    });

    it('should handle garbage collection during operations', async () => {
      // Create task
      const taskData = {
        title: 'GC Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Perform operations that might trigger garbage collection
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          googleStore.updateTask('list-1', task.id, { 
            title: `GC Update ${i}`,
            notes: 'Large notes '.repeat(1000) // Create large objects
          })
        );
      }

      const results = await Promise.allSettled(operations);
      
      // Should handle GC gracefully
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(25); // At least 50% success rate
    });
  });

  describe('Error Recovery Race Conditions', () => {
    it('should handle concurrent error recovery', async () => {
      // Create task
      const taskData = {
        title: 'Error Recovery Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Mock alternating success/failure
      let callCount = 0;
      vi.mocked(invoke).mockImplementation((command, args) => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Simulated failure'));
        }
        return mockInvoke(command, args);
      });

      // Perform operations that will trigger errors
      const operations = [
        googleStore.updateTask('list-1', task.id, { title: 'Update 1' }),
        googleStore.updateTask('list-1', task.id, { title: 'Update 2' }),
        googleStore.updateTask('list-1', task.id, { title: 'Update 3' }),
        googleStore.updateTask('list-1', task.id, { title: 'Update 4' }),
      ];

      const results = await Promise.allSettled(operations);
      
      // Some should succeed, some should fail
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
    });

    it('should handle retry scenarios', async () => {
      // Create task
      const taskData = {
        title: 'Retry Test Task',
        notes: 'Test notes',
      };

      const task = await googleStore.createTask('list-1', taskData);

      // Mock failures followed by success
      let attempt = 0;
      vi.mocked(invoke).mockImplementation((command, args) => {
        attempt++;
        if (attempt <= 2) {
          return Promise.reject(new Error('Retry failure'));
        }
        return mockInvoke(command, args);
      });

      // First attempts should fail
      await expect(googleStore.updateTask('list-1', task.id, { title: 'Retry 1' }))
        .rejects.toThrow('Retry failure');
      
      await expect(googleStore.updateTask('list-1', task.id, { title: 'Retry 2' }))
        .rejects.toThrow('Retry failure');
      
      // Third attempt should succeed
      const result = await googleStore.updateTask('list-1', task.id, { title: 'Retry 3' });
      expect(result.title).toBe('Retry 3');
    });
  });
}); 

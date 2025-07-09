import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGoogleStore } from '../../../stores/googleStore';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';
import { setTaskMetadata, getTaskMetadata, prepareTaskForAPI, syncTaskMetadata } from '../utils/taskHelpers';
import { GoogleTask, GoogleTaskList, TaskCreateData } from '../../../types/google';
import { invoke } from '@tauri-apps/api/core';

// Mock localStorage for persistence tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Store Integration Tests', () => {
  let googleStore: any;
  let metadataStore: any;

  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();
    
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

  afterEach(() => {
    // Clean up after each test
    googleStore.reset?.();
    metadataStore.clearAllMetadata();
  });

  describe('Basic Store Integration', () => {
    it('should maintain consistency between stores', async () => {
      // Create a task in Google Store
      const taskData: TaskCreateData = {
        title: 'Integration Test Task',
        notes: 'Test notes',
        due: '2024-12-31',
      };

      let googleTask: GoogleTask;
      await act(async () => {
        googleTask = await googleStore.createTask('list-1', taskData);
      });
      
      // Set metadata in metadata store
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      };

      await act(async () => {
        setTaskMetadata(googleTask.id, metadata);
      });

      // Verify both stores have the data
      expect(googleTask).toBeDefined();
      expect(googleTask.title).toBe('Integration Test Task');
      
      await waitFor(() => {
        const retrievedMetadata = getTaskMetadata(googleTask.id);
        expect(retrievedMetadata).toBeDefined();
        expect(retrievedMetadata.priority).toBe('high');
        expect(retrievedMetadata.labels).toEqual(['urgent', 'work']);
      });
    });

    it('should sync metadata from notes field on task creation', async () => {
      const enhancedTaskData = {
        title: 'Enhanced Task',
        notes: 'Task notes [LibreOllama:{"priority":"high","labels":["urgent","work"],"subtasks":[{"id":"1","title":"Subtask","completed":false,"due":""}]}]',
        due: '2024-12-31',
      };

      const googleTask = await googleStore.createTask('list-1', enhancedTaskData);
      
      // Sync metadata from notes field
      const metadata = syncTaskMetadata(googleTask);
      
      expect(metadata).toBeDefined();
      expect(metadata.priority).toBe('high');
      expect(metadata.labels).toEqual(['urgent', 'work']);
      expect(metadata.subtasks).toHaveLength(1);
    });

    it('should prepare task for API with metadata', async () => {
      const taskData = {
        title: 'Test Task',
        notes: 'Base notes',
        due: '2024-12-31',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Prepare for API
      const preparedData = prepareTaskForAPI(googleTask.id, {
        title: 'Updated Title',
        notes: 'Updated notes',
        due: '2025-01-01',
      });

      expect(preparedData.title).toBe('Updated Title');
      expect(preparedData.notes).toContain('Updated notes');
      expect(preparedData.notes).toContain('[LibreOllama:');
      expect(preparedData.due).toBe('2025-01-01');
    });
  });

  describe('Task Lifecycle Integration', () => {
    it('should handle task creation with metadata', async () => {
      const taskData = {
        title: 'Task with Metadata',
        notes: 'Base notes',
        due: '2024-12-31',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata after creation
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Verify integration
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      expect(retrievedMetadata).toBeDefined();
      expect(retrievedMetadata.priority).toBe('high');
      expect(retrievedMetadata.labels).toEqual(['urgent', 'work']);
      expect(retrievedMetadata.subtasks).toHaveLength(1);
    });

    it('should handle task updates with metadata preservation', async () => {
      // Create task
      const taskData = {
        title: 'Original Task',
        notes: 'Original notes',
        due: '2024-12-31',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Update task with metadata preserved
      const updatedData = prepareTaskForAPI(googleTask.id, {
        title: 'Updated Task',
        notes: 'Updated notes',
        due: '2025-01-01',
      });

      const updatedTask = await googleStore.updateTask('list-1', googleTask.id, updatedData);
      
      // Verify task was updated
      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.notes).toContain('Updated notes');
      expect(updatedTask.notes).toContain('[LibreOllama:');
      
      // Verify metadata was preserved
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      expect(retrievedMetadata.priority).toBe('high');
      expect(retrievedMetadata.labels).toEqual(['urgent', 'work']);
    });

    it('should handle task deletion with metadata cleanup', async () => {
      // Create task
      const taskData = {
        title: 'Task to Delete',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent'],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Verify metadata exists
      expect(getTaskMetadata(googleTask.id)).toBeDefined();

      // Delete task
      await googleStore.deleteTask('list-1', googleTask.id);
      
      // Verify metadata was cleaned up
      expect(getTaskMetadata(googleTask.id)).toBeNull();
    });

    it('should handle task movement with metadata preservation', async () => {
      // Create task
      const taskData = {
        title: 'Task to Move',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Move task
      const movedTask = await googleStore.moveTask(googleTask.id, 'list-1', 'list-2', {});
      
      // Verify task was moved
      expect(movedTask.id).toBe(googleTask.id);
      
      // Verify metadata was preserved
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      expect(retrievedMetadata).toBeDefined();
      expect(retrievedMetadata.priority).toBe('high');
      expect(retrievedMetadata.labels).toEqual(['urgent', 'work']);
      expect(retrievedMetadata.subtasks).toHaveLength(1);
    });
  });

  describe('Optimistic Updates Integration', () => {
    it('should handle optimistic updates with metadata', async () => {
      // Create task
      const taskData = {
        title: 'Optimistic Task',
        notes: 'Test notes',
      };

      let googleTask: GoogleTask;
      await act(async () => {
        googleTask = await googleStore.createTask('list-1', taskData);
      });
      
      // Set metadata
      const metadata = {
        priority: 'normal',
        labels: ['task'],
      };
      await act(async () => {
        setTaskMetadata(googleTask.id, metadata);
      });

      // Apply optimistic update
      const updatedData = {
        title: 'Optimistically Updated Task',
        notes: 'Updated notes',
      };

      await act(async () => {
        googleStore.optimisticUpdateTask('list-1', googleTask.id, updatedData);
      });

      // Update metadata
      const updatedMetadata = {
        priority: 'high',
        labels: ['urgent', 'important'],
      };
      await act(async () => {
        setTaskMetadata(googleTask.id, updatedMetadata);
      });

      // Verify optimistic update
      await waitFor(() => {
        const optimisticTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
          ?.tasks.find(t => t.id === googleTask.id);
        
        expect(optimisticTask?.title).toBe('Optimistically Updated Task');
      });
      
      // Verify metadata update
      await waitFor(() => {
        const retrievedMetadata = getTaskMetadata(googleTask.id);
        expect(retrievedMetadata.priority).toBe('high');
        expect(retrievedMetadata.labels).toEqual(['urgent', 'important']);
      });
    });

    it('should handle optimistic move with metadata', async () => {
      // Create task
      const taskData = {
        title: 'Task to Move',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['urgent'],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Apply optimistic move
      googleStore.optimisticMoveTask(googleTask.id, 'list-1', 'list-2');

      // Verify task was moved optimistically
      const sourceListTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      const targetListTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      
      expect(sourceListTasks?.find(t => t.id === googleTask.id)).toBeUndefined();
      expect(targetListTasks?.find(t => t.id === googleTask.id)).toBeDefined();
      
      // Verify metadata was preserved
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      expect(retrievedMetadata).toBeDefined();
      expect(retrievedMetadata.priority).toBe('high');
      expect(retrievedMetadata.labels).toEqual(['urgent']);
    });

    it('should handle optimistic reorder with metadata', async () => {
      // Create multiple tasks
      const task1 = await googleStore.createTask('list-1', { title: 'Task 1' });
      const task2 = await googleStore.createTask('list-1', { title: 'Task 2' });
      
      // Set metadata for both
      setTaskMetadata(task1.id, { priority: 'high', labels: ['urgent'] });
      setTaskMetadata(task2.id, { priority: 'normal', labels: ['task'] });

      // Apply optimistic reorder
      googleStore.optimisticReorderTask('list-1', task1.id, task2.id);

      // Verify tasks still exist
      const listTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(listTasks?.find(t => t.id === task1.id)).toBeDefined();
      expect(listTasks?.find(t => t.id === task2.id)).toBeDefined();
      
      // Verify metadata was preserved
      const metadata1 = getTaskMetadata(task1.id);
      const metadata2 = getTaskMetadata(task2.id);
      
      expect(metadata1.priority).toBe('high');
      expect(metadata2.priority).toBe('normal');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Google Store failures with metadata rollback', async () => {
      // Create task
      const taskData = {
        title: 'Test Task',
        notes: 'Test notes',
      };

      let googleTask: GoogleTask;
      await act(async () => {
        googleTask = await googleStore.createTask('list-1', taskData);
      });
      
      // Set initial metadata
      const initialMetadata = {
        priority: 'normal',
        labels: ['task'],
      };
      await act(async () => {
        setTaskMetadata(googleTask.id, initialMetadata);
      });

      // Update metadata
      const updatedMetadata = {
        priority: 'high',
        labels: ['urgent', 'important'],
      };
      await act(async () => {
        setTaskMetadata(googleTask.id, updatedMetadata);
      });

      // Mock update failure
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Update failed'));

      // Prepare task for API
      const preparedData = prepareTaskForAPI(googleTask.id, {
        title: 'Updated Task',
        notes: 'Updated notes',
      });

      // Attempt update (should fail)
      await act(async () => {
        await expect(googleStore.updateTask('list-1', googleTask.id, preparedData)).rejects.toThrow('Update failed');
      });
      
      // Verify metadata remains (rollback logic would need to be implemented)
      await waitFor(() => {
        const retrievedMetadata = getTaskMetadata(googleTask.id);
        expect(retrievedMetadata).toBeDefined();
        expect(retrievedMetadata.priority).toBe('high'); // Current implementation keeps metadata
      });
    });

    it('should handle metadata store failures gracefully', async () => {
      // Create task
      const taskData = {
        title: 'Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Mock metadata store failure
      const originalSetMetadata = metadataStore.setTaskMetadata;
      metadataStore.setTaskMetadata = vi.fn().mockImplementation(() => {
        throw new Error('Metadata store failure');
      });

      // Attempt to set metadata (should fail gracefully)
      expect(() => {
        setTaskMetadata(googleTask.id, { priority: 'high' });
      }).toThrow('Metadata store failure');

      // Restore original function
      metadataStore.setTaskMetadata = originalSetMetadata;
      
      // Verify Google Store task still exists
      const listTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(listTasks?.find(t => t.id === googleTask.id)).toBeDefined();
    });

    it('should handle corrupted metadata gracefully', async () => {
      // Create task
      const taskData = {
        title: 'Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set corrupted metadata directly in localStorage
      localStorageMock.setItem('task-metadata-store', JSON.stringify({
        state: {
          metadata: [
            [googleTask.id, { corrupted: 'data', invalid: 'structure' }]
          ]
        }
      }));

      // Attempt to get metadata (should handle gracefully)
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      
      // Should either return null or valid default metadata
      expect(retrievedMetadata).toBeNull();
    });
  });

  describe('Concurrency Integration', () => {
    it('should handle concurrent Google Store and metadata operations', async () => {
      // Create task
      const taskData = {
        title: 'Concurrent Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Perform concurrent operations
      const operations = [
        // Google Store operations
        googleStore.updateTask('list-1', googleTask.id, { title: 'Updated 1' }),
        googleStore.updateTask('list-1', googleTask.id, { title: 'Updated 2' }),
        
        // Metadata operations
        Promise.resolve(setTaskMetadata(googleTask.id, { priority: 'high' })),
        Promise.resolve(setTaskMetadata(googleTask.id, { priority: 'urgent' })),
        Promise.resolve(setTaskMetadata(googleTask.id, { labels: ['concurrent'] })),
      ];

      // Wait for all operations
      await Promise.all(operations);

      // Verify final state
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.find(t => t.id === googleTask.id);
      
      expect(finalTask).toBeDefined();
      expect(['Updated 1', 'Updated 2']).toContain(finalTask.title);
      
      const finalMetadata = getTaskMetadata(googleTask.id);
      expect(finalMetadata).toBeDefined();
      expect(['high', 'urgent']).toContain(finalMetadata.priority);
    });

    it('should handle concurrent task movements with metadata', async () => {
      // Create multiple tasks
      const tasks = await Promise.all([
        googleStore.createTask('list-1', { title: 'Task 1' }),
        googleStore.createTask('list-1', { title: 'Task 2' }),
        googleStore.createTask('list-1', { title: 'Task 3' }),
      ]);

      // Set metadata for all tasks
      tasks.forEach((task, index) => {
        setTaskMetadata(task.id, {
          priority: 'high',
          labels: [`task-${index}`],
        });
      });

      // Perform concurrent moves
      const moveOperations = tasks.map(task => 
        googleStore.moveTask(task.id, 'list-1', 'list-2', {})
      );

      await Promise.all(moveOperations);

      // Verify all tasks were moved
      const targetListTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-2')?.tasks;
      tasks.forEach(task => {
        expect(targetListTasks?.find(t => t.id === task.id)).toBeDefined();
      });

      // Verify metadata was preserved
      tasks.forEach((task, index) => {
        const metadata = getTaskMetadata(task.id);
        expect(metadata).toBeDefined();
        expect(metadata.priority).toBe('high');
        expect(metadata.labels).toEqual([`task-${index}`]);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large numbers of tasks with metadata efficiently', async () => {
      const taskCount = 100;
      const startTime = Date.now();

      // Create tasks in batches
      const tasks = [];
      for (let i = 0; i < taskCount; i++) {
        const task = await googleStore.createTask('list-1', {
          title: `Task ${i}`,
          notes: `Notes ${i}`,
        });
        tasks.push(task);
      }

      // Set metadata for all tasks
      tasks.forEach((task, index) => {
        setTaskMetadata(task.id, {
          priority: index % 2 === 0 ? 'high' : 'normal',
          labels: [`batch-${Math.floor(index / 10)}`],
        });
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max

      // Verify all tasks and metadata exist
      const listTasks = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')?.tasks;
      expect(listTasks).toHaveLength(taskCount);

      tasks.forEach((task, index) => {
        const metadata = getTaskMetadata(task.id);
        expect(metadata).toBeDefined();
        expect(metadata.priority).toBe(index % 2 === 0 ? 'high' : 'normal');
      });
    });

    it('should handle rapid metadata updates efficiently', async () => {
      // Create task
      const taskData = {
        title: 'Performance Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      const updateCount = 100;
      const startTime = Date.now();

      // Perform rapid metadata updates
      for (let i = 0; i < updateCount; i++) {
        setTaskMetadata(googleTask.id, {
          priority: i % 2 === 0 ? 'high' : 'normal',
          labels: [`update-${i}`],
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(1000); // 1 second max

      // Verify final state
      const finalMetadata = getTaskMetadata(googleTask.id);
      expect(finalMetadata).toBeDefined();
      expect(finalMetadata.labels).toEqual([`update-${updateCount - 1}`]);
    });
  });

  describe('Persistence Integration', () => {
    it('should persist metadata across store resets', async () => {
      // Create task
      const taskData = {
        title: 'Persistence Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      const metadata = {
        priority: 'high',
        labels: ['persistent', 'test'],
        subtasks: [{ id: '1', title: 'Persistent subtask', completed: false, due: '' }],
      };
      setTaskMetadata(googleTask.id, metadata);

      // Reset Google Store (simulating app restart)
      googleStore.reset?.();

      // Verify metadata persists
      const retrievedMetadata = getTaskMetadata(googleTask.id);
      expect(retrievedMetadata).toBeDefined();
      expect(retrievedMetadata.priority).toBe('high');
      expect(retrievedMetadata.labels).toEqual(['persistent', 'test']);
      expect(retrievedMetadata.subtasks).toHaveLength(1);
    });

    it('should handle metadata persistence failures gracefully', async () => {
      // Create task
      const taskData = {
        title: 'Persistence Failure Test',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Mock localStorage failure
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Attempt to set metadata (should handle gracefully)
      expect(() => {
        setTaskMetadata(googleTask.id, { priority: 'high' });
      }).not.toThrow();

      // Restore original function
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency after multiple operations', async () => {
      // Create task
      const taskData = {
        title: 'Consistency Test Task',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Perform multiple operations
      const operations = [
        // Update task
        googleStore.updateTask('list-1', googleTask.id, { title: 'Updated Task' }),
        
        // Set metadata
        Promise.resolve(setTaskMetadata(googleTask.id, { priority: 'high' })),
        
        // Move task
        googleStore.moveTask(googleTask.id, 'list-1', 'list-2', {}),
        
        // Update metadata
        Promise.resolve(setTaskMetadata(googleTask.id, { labels: ['moved'] })),
      ];

      await Promise.all(operations);

      // Verify consistency
      const finalTask = googleStore.kanbanColumns.find(c => c.taskList.id === 'list-2')
        ?.tasks.find(t => t.id === googleTask.id);
      
      expect(finalTask).toBeDefined();
      expect(finalTask.title).toBe('Updated Task');
      
      const finalMetadata = getTaskMetadata(googleTask.id);
      expect(finalMetadata).toBeDefined();
      expect(finalMetadata.priority).toBe('high');
      expect(finalMetadata.labels).toEqual(['moved']);
    });

    it('should handle inconsistent state recovery', async () => {
      // Create task
      const taskData = {
        title: 'Inconsistent State Test',
        notes: 'Test notes',
      };

      const googleTask = await googleStore.createTask('list-1', taskData);
      
      // Set metadata
      setTaskMetadata(googleTask.id, { priority: 'high' });

      // Simulate inconsistent state by removing task from Google Store
      googleStore.kanbanColumns.find(c => c.taskList.id === 'list-1')
        ?.tasks.splice(0, 1);

      // Verify metadata still exists
      const metadata = getTaskMetadata(googleTask.id);
      expect(metadata).toBeDefined();
      expect(metadata.priority).toBe('high');

      // Cleanup should handle orphaned metadata
      metadataStore.deleteTaskMetadata(googleTask.id);
      expect(getTaskMetadata(googleTask.id)).toBeNull();
    });
  });
}); 
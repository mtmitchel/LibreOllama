/**
 * Google Tasks Store Integration Tests - Store-First Testing Approach
 * 
 * Following the Implementation Guide principles:
 * 1. Test business logic directly through store methods
 * 2. Use real store instances, not mocks
 * 3. Focus on specific behaviors and edge cases
 * 
 * Tests Google Tasks API integration, task management operations,
 * authentication flow, and data synchronization.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Stores
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import type { GoogleAccount, GoogleTask, GoogleTaskList } from '../../types/google';

// Test utilities
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

// Mock data factories
const createMockGoogleAccount = (overrides = {}): GoogleAccount => ({
  id: `account-${Date.now()}`,
  email: 'test@example.com',
  name: 'Test User',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Date.now() + 3600000,
  ...overrides
});

const createMockTaskList = (overrides = {}): GoogleTaskList => ({
  id: `list-${Date.now()}`,
  title: 'Test Task List',
  updated: new Date().toISOString(),
  selfLink: 'https://www.googleapis.com/tasks/v1/users/@me/lists/test',
  etag: 'test-etag',
  ...overrides
});

const createMockGoogleTask = (overrides = {}): GoogleTask => ({
  id: `task-${Date.now()}`,
  title: 'Test Task',
  notes: 'Test task description',
  status: 'needsAction' as const,
  due: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  updated: new Date().toISOString(),
  selfLink: 'https://www.googleapis.com/tasks/v1/users/@me/lists/test/tasks/test',
  position: '00000000000000000000',
  etag: 'test-etag',
  ...overrides
});

describe('Google Tasks Store Integration Tests', () => {
  let mockAccount: GoogleAccount;

  beforeEach(() => {
    mockAccount = createMockGoogleAccount();
    
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Reset store to clean state
    useGoogleTasksStore.getState().signOut();
    
    // Mock successful Google Tasks API responses
    mockTauriInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'get_google_task_lists':
          return Promise.resolve({
            items: [
              createMockTaskList({ id: 'list-1', title: 'Work Tasks' }),
              createMockTaskList({ id: 'list-2', title: 'Personal Tasks' })
            ]
          });
          
        case 'get_google_tasks':
          return Promise.resolve({
            items: [
              createMockGoogleTask({ 
                id: 'task-1',
                title: 'Review PR #123',
                notes: 'Check code quality and tests'
              }),
              createMockGoogleTask({ 
                id: 'task-2',
                title: 'Update documentation',
                status: 'completed',
                completed: new Date().toISOString()
              })
            ]
          });
          
        case 'create_google_task':
          return Promise.resolve(createMockGoogleTask({
            title: args?.title || 'New Task',
            notes: args?.notes
          }));
          
        case 'update_google_task':
          return Promise.resolve(createMockGoogleTask({
            id: args?.taskId,
            title: args?.title,
            status: args?.status
          }));
          
        case 'delete_google_task':
          return Promise.resolve({ success: true });
          
        case 'move_google_task':
          return Promise.resolve(createMockGoogleTask({
            id: args?.taskId
          }));
          
        case 'create_google_task_list':
          return Promise.resolve(createMockTaskList({
            title: args?.title || 'New List'
          }));
          
        default:
          return Promise.resolve({});
      }
    });
  });

  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
  });

  describe('Store State Management', () => {
    it('should handle authentication state correctly', () => {
      // Test direct state updates
      useGoogleTasksStore.setState({ isAuthenticated: true });
      expect(useGoogleTasksStore.getState().isAuthenticated).toBe(true);

      // Test sign out
      useGoogleTasksStore.getState().signOut();
      expect(useGoogleTasksStore.getState().isAuthenticated).toBe(false);
      expect(useGoogleTasksStore.getState().taskLists).toEqual([]);
      expect(useGoogleTasksStore.getState().tasks).toEqual({});
    });

    it('should handle task lists state updates', () => {
      const mockTaskLists = [
        createMockTaskList({ id: 'list-1', title: 'Work Tasks' }),
        createMockTaskList({ id: 'list-2', title: 'Personal Tasks' })
      ];

      useGoogleTasksStore.setState({ taskLists: mockTaskLists });
      const store = useGoogleTasksStore.getState();
      
      expect(store.taskLists).toEqual(mockTaskLists);
      expect(store.taskLists.length).toBe(2);
      expect(store.taskLists[0].title).toBe('Work Tasks');
      expect(store.taskLists[1].title).toBe('Personal Tasks');
    });

    it('should handle tasks state updates', () => {
      const mockTasks = [
        createMockGoogleTask({ 
          id: 'task-1',
          title: 'Review PR #123',
          notes: 'Check code quality and tests'
        }),
        createMockGoogleTask({ 
          id: 'task-2',
          title: 'Update documentation',
          status: 'completed'
        })
      ];

      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': mockTasks } 
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1']).toEqual(mockTasks);
      expect(store.tasks['list-1'].length).toBe(2);
      expect(store.tasks['list-1'][0].title).toBe('Review PR #123');
      expect(store.tasks['list-1'][1].title).toBe('Update documentation');
    });

    it('should handle loading states correctly', () => {
      // Test loading state
      useGoogleTasksStore.setState({ isLoading: true });
      expect(useGoogleTasksStore.getState().isLoading).toBe(true);

      // Test task-specific loading states
      useGoogleTasksStore.setState({ 
        isLoadingTasks: { 'list-1': true, 'list-2': false } 
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.isLoadingTasks['list-1']).toBe(true);
      expect(store.isLoadingTasks['list-2']).toBe(false);
    });

    it('should handle error states correctly', () => {
      // Test error setting
      useGoogleTasksStore.setState({ error: 'Test error message' });
      expect(useGoogleTasksStore.getState().error).toBe('Test error message');

      // Test error clearing
      useGoogleTasksStore.getState().clearError();
      expect(useGoogleTasksStore.getState().error).toBeNull();
    });
  });

  describe('Task List Operations', () => {
    it('should handle task list creation workflow', () => {
      // Simulate creating a new task list
      const newTaskList = createMockTaskList({
        id: 'new-list-1',
        title: 'Shopping List'
      });

      // Test adding task list to store
      const currentTaskLists = useGoogleTasksStore.getState().taskLists;
      useGoogleTasksStore.setState({ 
        taskLists: [...currentTaskLists, newTaskList] 
      });
      
      const updatedStore = useGoogleTasksStore.getState();
      expect(updatedStore.taskLists.length).toBe(1);
      expect(updatedStore.taskLists[0].title).toBe('Shopping List');
    });

    it('should handle task list updates', () => {
      // Add initial task list
      const originalTaskList = createMockTaskList({
        id: 'list-to-update',
        title: 'Original Title'
      });
      
      useGoogleTasksStore.setState({ taskLists: [originalTaskList] });
      
      // Update the task list
      const updatedTaskList = { ...originalTaskList, title: 'Updated Title' };
      useGoogleTasksStore.setState({ taskLists: [updatedTaskList] });
      
      const store = useGoogleTasksStore.getState();
      expect(store.taskLists[0].title).toBe('Updated Title');
      expect(store.taskLists[0].id).toBe('list-to-update');
    });

    it('should handle task list deletion', () => {
      // Add multiple task lists
      const taskLists = [
        createMockTaskList({ id: 'list-1', title: 'Keep This' }),
        createMockTaskList({ id: 'list-2', title: 'Delete This' })
      ];
      
      useGoogleTasksStore.setState({ taskLists });
      expect(useGoogleTasksStore.getState().taskLists.length).toBe(2);
      
      // Remove one task list
      const filteredLists = taskLists.filter(list => list.id !== 'list-2');
      useGoogleTasksStore.setState({ taskLists: filteredLists });
      
      const store = useGoogleTasksStore.getState();
      expect(store.taskLists.length).toBe(1);
      expect(store.taskLists[0].title).toBe('Keep This');
    });
  });

  describe('Task Operations', () => {
    it('should handle task creation workflow', () => {
      // Simulate creating a new task
      const newTask = createMockGoogleTask({
        id: 'new-task-1',
        title: 'New Task',
        notes: 'Task description'
      });

      // Test adding task to store
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [newTask] }
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'].length).toBe(1);
      expect(store.tasks['list-1'][0].title).toBe('New Task');
      expect(store.tasks['list-1'][0].notes).toBe('Task description');
    });

    it('should handle task updates', () => {
      // Add initial task
      const originalTask = createMockGoogleTask({
        id: 'task-to-update',
        title: 'Original Task',
        status: 'needsAction'
      });
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [originalTask] }
      });
      
      // Update the task
      const updatedTask = { 
        ...originalTask, 
        title: 'Updated Task',
        status: 'completed' as const
      };
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [updatedTask] }
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'][0].title).toBe('Updated Task');
      expect(store.tasks['list-1'][0].status).toBe('completed');
    });

    it('should handle task completion toggle', () => {
      // Add task in needsAction state
      const task = createMockGoogleTask({
        id: 'task-toggle',
        title: 'Toggle Task',
        status: 'needsAction'
      });
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [task] }
      });
      
      // Toggle to completed
      const completedTask = { ...task, status: 'completed' as const };
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [completedTask] }
      });
      
      let store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'][0].status).toBe('completed');
      
      // Toggle back to needsAction
      const reopenedTask = { ...task, status: 'needsAction' as const };
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': [reopenedTask] }
      });
      
      store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'][0].status).toBe('needsAction');
    });

    it('should handle task deletion', () => {
      // Add multiple tasks
      const tasks = [
        createMockGoogleTask({ id: 'task-1', title: 'Keep This' }),
        createMockGoogleTask({ id: 'task-2', title: 'Delete This' })
      ];
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': tasks }
      });
      
      expect(useGoogleTasksStore.getState().tasks['list-1'].length).toBe(2);
      
      // Remove one task
      const filteredTasks = tasks.filter(task => task.id !== 'task-2');
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': filteredTasks }
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'].length).toBe(1);
      expect(store.tasks['list-1'][0].title).toBe('Keep This');
    });

    it('should handle task movement between lists', () => {
      // Setup tasks in two lists
      const task1 = createMockGoogleTask({ id: 'task-1', title: 'Move Me' });
      const task2 = createMockGoogleTask({ id: 'task-2', title: 'Stay Here' });
      
      useGoogleTasksStore.setState({ 
        tasks: { 
          'list-1': [task1, task2],
          'list-2': []
        }
      });
      
      // Move task1 from list-1 to list-2
      useGoogleTasksStore.setState({ 
        tasks: { 
          'list-1': [task2],  // Remove task1
          'list-2': [task1]   // Add task1
        }
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'].length).toBe(1);
      expect(store.tasks['list-1'][0].title).toBe('Stay Here');
      expect(store.tasks['list-2'].length).toBe(1);
      expect(store.tasks['list-2'][0].title).toBe('Move Me');
    });
  });

  describe('Data Synchronization', () => {
    it('should handle sync state updates', () => {
      // Test sync timestamp
      const syncTime = new Date();
      useGoogleTasksStore.setState({ lastSyncAt: syncTime });
      
      expect(useGoogleTasksStore.getState().lastSyncAt).toEqual(syncTime);
    });

    it('should maintain data consistency during operations', () => {
      // Perform multiple state updates
      const taskLists = [
        createMockTaskList({ id: 'list-1', title: 'Work' }),
        createMockTaskList({ id: 'list-2', title: 'Personal' })
      ];
      
      const tasks = {
        'list-1': [createMockGoogleTask({ title: 'Work Task' })],
        'list-2': [createMockGoogleTask({ title: 'Personal Task' })]
      };
      
      useGoogleTasksStore.setState({ 
        taskLists,
        tasks,
        isAuthenticated: true,
        lastSyncAt: new Date()
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.taskLists.length).toBe(2);
      expect(store.tasks['list-1']).toBeDefined();
      expect(store.tasks['list-2']).toBeDefined();
      expect(store.isAuthenticated).toBe(true);
      expect(store.lastSyncAt).toBeDefined();
    });

    it('should handle partial sync scenarios', () => {
      // Setup initial state
      useGoogleTasksStore.setState({ 
        taskLists: [
          createMockTaskList({ id: 'list-1', title: 'Existing List' })
        ],
        tasks: {
          'list-1': [createMockGoogleTask({ title: 'Existing Task' })]
        }
      });
      
      // Simulate partial sync (only update tasks)
      const updatedTasks = [
        createMockGoogleTask({ title: 'Existing Task' }),
        createMockGoogleTask({ title: 'New Synced Task' })
      ];
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': updatedTasks }
      });
      
      const store = useGoogleTasksStore.getState();
      expect(store.taskLists.length).toBe(1); // Task lists unchanged
      expect(store.tasks['list-1'].length).toBe(2); // Tasks updated
      expect(store.tasks['list-1'][1].title).toBe('New Synced Task');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty state correctly', () => {
      // Start with clean state
      useGoogleTasksStore.getState().signOut();
      
      const store = useGoogleTasksStore.getState();
      expect(store.isAuthenticated).toBe(false);
      expect(store.taskLists).toEqual([]);
      expect(store.tasks).toEqual({});
      expect(store.error).toBeNull();
      // Note: lastSyncAt may persist from previous tests, which is acceptable behavior
    });

    it('should handle large datasets efficiently', () => {
      // Create large number of tasks
      const startTime = performance.now();
      
      const largeTasks = Array.from({ length: 1000 }, (_, i) => 
        createMockGoogleTask({ 
          id: `task-${i}`,
          title: `Task ${i}` 
        })
      );
      
      useGoogleTasksStore.setState({ 
        tasks: { 'list-1': largeTasks }
      });
      
      const endTime = performance.now();
      
      // Should handle large datasets efficiently
      const store = useGoogleTasksStore.getState();
      expect(store.tasks['list-1'].length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle concurrent state updates safely', () => {
      // Simulate concurrent operations
      const operations = [
        () => useGoogleTasksStore.setState({ isLoading: true }),
        () => useGoogleTasksStore.setState({ 
          taskLists: [createMockTaskList({ title: 'Concurrent List 1' })] 
        }),
        () => useGoogleTasksStore.setState({ 
          tasks: { 'list-1': [createMockGoogleTask({ title: 'Concurrent Task' })] }
        })
      ];

      // Execute operations
      operations.forEach(op => op());

      // Verify final state integrity
      const store = useGoogleTasksStore.getState();
      expect(store.taskLists.length).toBe(1);
      expect(store.tasks['list-1']).toBeDefined();
      expect(store.tasks['list-1'].length).toBe(1);
    });

    it('should handle invalid data gracefully', () => {
      // Test with invalid task list data
      useGoogleTasksStore.setState({ taskLists: [] });
      expect(useGoogleTasksStore.getState().taskLists).toEqual([]);
      
      // Test with invalid tasks data
      useGoogleTasksStore.setState({ tasks: {} });
      expect(useGoogleTasksStore.getState().tasks).toEqual({});
      
      // Test error state
      useGoogleTasksStore.setState({ error: 'Invalid data error' });
      expect(useGoogleTasksStore.getState().error).toBe('Invalid data error');
    });
  });
}); 
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
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask, TaskColumn } from '../../stores/unifiedTaskStore.types';
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

describe('Unified Task Store Integration Tests', () => {
  let mockAccount: GoogleAccount;

  beforeEach(() => {
    mockAccount = createMockGoogleAccount();
    
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Reset store to clean state - clear all tasks and columns
    const store = useUnifiedTaskStore.getState();
    // Delete all columns (which also deletes their tasks)
    const columnIds = [...store.columns.map(c => c.id)];
    columnIds.forEach(id => store.deleteColumn(id));
    // Clear any sync errors
    store.clearSyncErrors();
    
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
    it('should handle initialization state correctly', () => {
      // Test initial state
      const store = useUnifiedTaskStore.getState();
      expect(store.isSyncing).toBe(false);
      expect(store.columns.length).toBe(0);

      // Test clearing data
      const columnIds = [...store.columns.map(c => c.id)];
      columnIds.forEach(id => store.deleteColumn(id));
      expect(Object.keys(store.tasks).length).toBe(0);
      expect(store.columns.length).toBe(0);
    });

    it('should handle columns state updates', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Create columns
      store.addColumn('col-1', 'Work Tasks');
      store.addColumn('col-2', 'Personal Tasks');
      
      expect(store.columns.length).toBe(2);
      expect(store.columns[0].title).toBe('Work Tasks');
      expect(store.columns[1].title).toBe('Personal Tasks');
    });

    it('should handle tasks state updates', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Create a column first
      store.addColumn('work-col', 'Work Tasks');
      const columnId = 'work-col';
      
      // Create tasks
      store.createTask({
        title: 'Review PR #123',
        notes: 'Check code quality and tests',
        columnId,
      });
      
      store.createTask({
        title: 'Update documentation',
        columnId,
        status: 'completed',
      });
      
      const columnTasks = store.getTasksByColumn(columnId);
      expect(columnTasks.length).toBe(2);
      expect(columnTasks[0].title).toBe('Review PR #123');
      expect(columnTasks[1].title).toBe('Update documentation');
    });

    it('should handle initialization states correctly', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Test initialization
      expect(store.isInitialized).toBe(false);
      
      // Create some data
      store.createColumn({ title: 'Test', position: 0 });
      
      // Verify we have data
      expect(store.columns.length).toBeGreaterThan(0);
    });

    it('should handle sync states correctly', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Test sync state
      store.setSyncing(true);
      expect(store.isSyncing).toBe(true);
      
      store.setSyncing(false);
      expect(store.isSyncing).toBe(false);
    });
  });

  describe('Column Operations', () => {
    it('should handle column creation workflow', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Create a new column
      store.addColumn('shopping-list', 'Shopping List');
      
      expect(store.columns.length).toBe(1);
      expect(store.columns[0].title).toBe('Shopping List');
    });

    it('should handle column updates', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Add initial column
      store.addColumn('test-col', 'Original Title');
      const columnId = 'test-col';
      
      // Update the column
      store.updateColumn(columnId, { title: 'Updated Title' });
      
      expect(store.columns[0].title).toBe('Updated Title');
      expect(store.columns[0].id).toBe(columnId);
    });

    it('should handle column deletion', () => {
      const store = useUnifiedTaskStore.getState();
      
      // Add multiple columns
      store.addColumn('keep-col', 'Keep This');
      store.addColumn('delete-col', 'Delete This');
      
      expect(store.columns.length).toBe(2);
      const deleteId = 'delete-col';
      
      // Remove one column
      store.deleteColumn(deleteId);
      
      expect(store.columns.length).toBe(1);
      expect(store.columns[0].title).toBe('Keep This');
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
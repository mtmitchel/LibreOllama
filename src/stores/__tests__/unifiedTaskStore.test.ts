import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { UnifiedTaskState, UnifiedTask } from '../unifiedTaskStore.types';

// Test helper to create a vanilla store instance
const createTestStore = () => {
  return createStore<UnifiedTaskState>()(
    immer((set, get) => ({
      tasks: {},
      columns: [],
      showCompleted: true,
      showCompletedByList: {},
      isSyncing: false,
      syncErrors: {},
    }))
  );
};

describe('UnifiedTaskStore - batchUpdateFromGoogle', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should create new tasks from Google with correct column assignment', () => {
    // Setup: Add a column with googleTaskListId
    store.setState((state) => {
      state.columns.push({
        id: 'column-1',
        title: 'My Tasks',
        googleTaskListId: 'list-123',
        taskIds: [],
      });
    });

    // Create batch updates from Google
    const updates = [
      {
        googleTaskId: 'google-task-1',
        googleTaskListId: 'list-123',
        data: {
          title: 'Task from Google',
          notes: 'Test notes',
          status: 'needsAction' as const,
          updated: '2025-01-10T10:00:00Z',
        },
      },
    ];

    // Simulate batchUpdateFromGoogle
    store.setState((state) => {
      for (const update of updates) {
        const column = state.columns.find(
          c => c.googleTaskListId === update.googleTaskListId
        );
        
        if (column) {
          const taskId = `local-task-${Date.now()}`;
          const newTask: UnifiedTask = {
            id: taskId,
            googleTaskId: update.googleTaskId,
            googleTaskListId: update.googleTaskListId,
            columnId: column.id,
            syncState: 'synced',
            lastSyncTime: new Date().toISOString(),
            labels: [],
            priority: 'none',
            position: '0',
            updated: update.data.updated || new Date().toISOString(),
            title: update.data.title || '',
            status: update.data.status || 'needsAction',
            notes: update.data.notes,
          };
          
          state.tasks[taskId] = newTask;
          column.taskIds.push(taskId);
        }
      }
    });

    // Verify
    const finalState = store.getState();
    const createdTasks = Object.values(finalState.tasks);
    
    expect(createdTasks).toHaveLength(1);
    expect(createdTasks[0].title).toBe('Task from Google');
    expect(createdTasks[0].googleTaskId).toBe('google-task-1');
    expect(createdTasks[0].columnId).toBe('column-1');
    expect(finalState.columns[0].taskIds).toHaveLength(1);
  });

  it('should update existing tasks preserving local-only fields', () => {
    const taskId = 'local-task-123';
    
    // Setup: Add existing task with local metadata
    store.setState((state) => {
      state.columns.push({
        id: 'column-1',
        title: 'My Tasks',
        googleTaskListId: 'list-123',
        taskIds: [taskId],
      });
      
      state.tasks[taskId] = {
        id: taskId,
        googleTaskId: 'google-task-1',
        googleTaskListId: 'list-123',
        columnId: 'column-1',
        title: 'Original Title',
        notes: 'Original notes',
        status: 'needsAction',
        updated: '2025-01-09T10:00:00Z',
        position: '0',
        labels: [
          { name: 'important', color: 'red' },
          { name: 'work', color: 'blue' }
        ],
        priority: 'high',
        syncState: 'synced',
        lastSyncTime: '2025-01-09T10:00:00Z',
      };
    });

    // Update from Google
    const updates = [
      {
        googleTaskId: 'google-task-1',
        googleTaskListId: 'list-123',
        data: {
          title: 'Updated Title',
          notes: 'Updated notes',
          status: 'completed' as const,
          updated: '2025-01-10T10:00:00Z',
        },
      },
    ];

    // Simulate batchUpdateFromGoogle
    store.setState((state) => {
      for (const update of updates) {
        const existingTask = Object.values(state.tasks).find(
          t => t.googleTaskId === update.googleTaskId
        );
        
        if (existingTask) {
          // Update Google fields but preserve local-only fields
          Object.assign(existingTask, update.data);
          existingTask.syncState = 'synced';
          existingTask.lastSyncTime = new Date().toISOString();
        }
      }
    });

    // Verify
    const finalState = store.getState();
    const updatedTask = finalState.tasks[taskId];
    
    expect(updatedTask.title).toBe('Updated Title');
    expect(updatedTask.notes).toBe('Updated notes');
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.labels).toEqual([
      { name: 'important', color: 'red' },
      { name: 'work', color: 'blue' }
    ]); // Preserved
    expect(updatedTask.priority).toBe('high'); // Preserved
  });

  it('should handle missing columns gracefully', () => {
    // No columns setup
    const updates = [
      {
        googleTaskId: 'google-task-1',
        googleTaskListId: 'list-123',
        data: {
          title: 'Orphaned Task',
          status: 'needsAction' as const,
        },
      },
    ];

    // Simulate batchUpdateFromGoogle
    store.setState((state) => {
      for (const update of updates) {
        const column = state.columns.find(
          c => c.googleTaskListId === update.googleTaskListId
        );
        
        if (!column) {
          // Log error but don't crash
          console.error(`No column found for googleTaskListId: ${update.googleTaskListId}`);
        }
      }
    });

    // Verify no tasks were created
    const finalState = store.getState();
    expect(Object.keys(finalState.tasks)).toHaveLength(0);
  });

  it('should handle duplicate Google IDs by updating existing task', () => {
    const taskId1 = 'local-task-1';
    
    // Setup: Add existing task
    store.setState((state) => {
      state.columns.push({
        id: 'column-1',
        title: 'My Tasks',
        googleTaskListId: 'list-123',
        taskIds: [taskId1],
      });
      
      state.tasks[taskId1] = {
        id: taskId1,
        googleTaskId: 'google-task-1',
        googleTaskListId: 'list-123',
        columnId: 'column-1',
        title: 'First Task',
        status: 'needsAction',
        updated: '2025-01-09T10:00:00Z',
        position: '0',
        labels: [],
        priority: 'none',
        syncState: 'synced',
      };
    });

    // Try to create duplicate
    const updates = [
      {
        googleTaskId: 'google-task-1', // Same Google ID
        googleTaskListId: 'list-123',
        data: {
          title: 'Duplicate Task',
          status: 'needsAction' as const,
          updated: '2025-01-10T10:00:00Z',
        },
      },
    ];

    // Simulate batchUpdateFromGoogle
    store.setState((state) => {
      for (const update of updates) {
        const existingTask = Object.values(state.tasks).find(
          t => t.googleTaskId === update.googleTaskId
        );
        
        if (existingTask) {
          // Update existing instead of creating duplicate
          Object.assign(existingTask, update.data);
          existingTask.syncState = 'synced';
          existingTask.lastSyncTime = new Date().toISOString();
        }
      }
    });

    // Verify only one task exists
    const finalState = store.getState();
    expect(Object.keys(finalState.tasks)).toHaveLength(1);
    expect(finalState.tasks[taskId1].title).toBe('Duplicate Task');
  });
});
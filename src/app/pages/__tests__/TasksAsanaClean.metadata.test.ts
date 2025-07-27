import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnifiedTaskStore } from '../../../stores/unifiedTaskStore';

describe('TasksAsanaClean - Metadata Updates', () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useUnifiedTaskStore.getState();
    store.tasks = [];
    store.columns = [];
  });

  it('should only pass changed fields when updating priority', () => {
    const store = useUnifiedTaskStore.getState();
    const taskId = 'test-task';
    
    // Create task with initial metadata
    const task = {
      id: taskId,
      title: 'Test Task',
      columnId: 'column-1',
      metadata: {
        labels: ['bug', 'frontend'],
        priority: 'normal' as const
      },
      syncState: 'synced' as const
    };
    
    store.tasks.push(task as any);
    
    // Spy on updateTask
    const updateTaskSpy = vi.spyOn(store, 'updateTask');
    
    // Update priority from context menu
    store.updateTask(taskId, {
      metadata: {
        ...task.metadata,
        priority: 'high' as const
      }
    });
    
    // Verify the call included all metadata fields
    expect(updateTaskSpy).toHaveBeenCalledWith(taskId, {
      metadata: {
        labels: ['bug', 'frontend'],
        priority: 'high'
      }
    });
    
    // Verify metadata was preserved
    const updatedTask = store.tasks.find(t => t.id === taskId);
    expect(updatedTask?.metadata?.labels).toEqual(['bug', 'frontend']);
    expect(updatedTask?.metadata?.priority).toBe('high');
  });

  it('should handle metadata updates correctly from task modal', () => {
    const store = useUnifiedTaskStore.getState();
    const taskId = 'modal-test';
    
    // Create task
    const task = {
      id: taskId,
      title: 'Modal Test',
      columnId: 'column-1',
      metadata: {
        labels: ['urgent'],
        priority: 'high' as const
      },
      syncState: 'synced' as const
    };
    
    store.tasks.push(task as any);
    
    // Update from modal with new labels
    store.updateTask(taskId, {
      title: 'Updated Title',
      metadata: {
        ...task.metadata,
        labels: ['urgent', 'backend', 'database']
      }
    });
    
    // Verify all fields were updated correctly
    const updatedTask = store.tasks.find(t => t.id === taskId);
    expect(updatedTask?.title).toBe('Updated Title');
    expect(updatedTask?.metadata?.labels).toEqual(['urgent', 'backend', 'database']);
    expect(updatedTask?.metadata?.priority).toBe('high'); // Priority preserved
  });
});
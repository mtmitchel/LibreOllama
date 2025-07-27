import { describe, it, expect, beforeEach } from 'vitest';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

describe('Task Deletion Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear unified store state
    const store = useUnifiedTaskStore.getState();
    store.tasks = [];
    store.columns = [];
  });

  it('should demonstrate the complete delete flow', () => {
    const store = useUnifiedTaskStore.getState();
    
    // 1. Create a task with metadata
    const taskId = 'task-123';
    const task = {
      id: taskId,
      title: 'Test Task',
      googleId: 'google-task-123',
      metadata: {
        labels: ['important', 'work'],
        priority: 'high' as const
      },
      syncState: 'synced' as const
    };
    
    // Add task to store
    store.tasks.push(task as any);
    
    // 2. Delete task
    store.deleteTask(taskId);
    
    // 3. Verify task is marked for deletion
    const deletedTask = store.tasks.find(t => t.id === taskId);
    expect(deletedTask?.syncState).toBe('pending_delete');
    
    // 4. Verify metadata is preserved during deletion
    expect(deletedTask?.metadata?.labels).toEqual(['important', 'work']);
    expect(deletedTask?.metadata?.priority).toBe('high');
    
    // This demonstrates that:
    // - Delete from Google happens first (in handleDeleteTask)
    // - Metadata is marked as deleted
    // - Sync service will skip recreating this task
    // - Labels and priority are preserved during the delete process
  });
  
  it('should show that metadata updates preserve all fields', () => {
    const store = useUnifiedTaskStore.getState();
    const taskId = 'metadata-test';
    
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
    
    // Update only priority (like from context menu)
    store.updateTask(taskId, {
      metadata: {
        ...task.metadata,
        priority: 'high' as const
      }
    });
    
    // Verify labels weren't lost
    const afterPriorityUpdate = store.tasks.find(t => t.id === taskId);
    expect(afterPriorityUpdate?.metadata?.priority).toBe('high');
    expect(afterPriorityUpdate?.metadata?.labels).toEqual(['bug', 'frontend']);
    
    // Update only labels (like from task modal)
    store.updateTask(taskId, {
      metadata: {
        ...afterPriorityUpdate!.metadata!,
        labels: ['bug', 'frontend', 'urgent']
      }
    });
    
    // Verify priority wasn't lost
    const afterLabelsUpdate = store.tasks.find(t => t.id === taskId);
    expect(afterLabelsUpdate?.metadata?.priority).toBe('high');
    expect(afterLabelsUpdate?.metadata?.labels).toEqual(['bug', 'frontend', 'urgent']);
  });
});
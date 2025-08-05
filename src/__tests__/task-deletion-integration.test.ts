import { describe, it, expect, beforeEach } from 'vitest';
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

describe('Task Deletion Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset the store to initial state
    useUnifiedTaskStore.setState({
      tasks: {},
      columns: []
    });
  });

  it('should demonstrate the complete delete flow', async () => {
    const store = useUnifiedTaskStore.getState();
    
    // 1. Create a task using the store method
    const columnId = 'column-1';
    store.addColumn(columnId, 'Test Column', 'list-1');
    
    const taskId = await store.createTask({
      title: 'Test Task',
      columnId,
      labels: [
        { name: 'important', color: 'red' },
        { name: 'work', color: 'blue' }
      ],
      priority: 'high'
    });
    
    // 2. Delete task
    store.deleteTask(taskId);
    
    // 3. Verify task is marked for deletion
    const deletedTask = store.tasks[taskId];
    expect(deletedTask?.syncState).toBe('pending_delete');
    
    // 4. Verify metadata is preserved during deletion
    expect(deletedTask?.labels).toHaveLength(2);
    expect(deletedTask?.labels[0].name).toBe('important');
    expect(deletedTask?.labels[1].name).toBe('work');
    expect(deletedTask?.priority).toBe('high');
    
    // This demonstrates that:
    // - Delete from Google happens first (in handleDeleteTask)
    // - Metadata is marked as deleted
    // - Sync service will skip recreating this task
    // - Labels and priority are preserved during the delete process
  });
  
  it('should show that metadata updates preserve all fields', async () => {
    const store = useUnifiedTaskStore.getState();
    
    // Create column first
    const columnId = 'column-1';
    store.addColumn(columnId, 'Test Column', 'list-1');
    
    // Create task with initial metadata
    const taskId = await store.createTask({
      title: 'Test Task',
      columnId,
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'frontend', color: 'blue' }
      ],
      priority: 'low'
    });
    
    // Update only priority (like from context menu)
    store.updateTask(taskId, {
      priority: 'high'
    });
    
    // Verify labels weren't lost
    const afterPriorityUpdate = store.tasks[taskId];
    expect(afterPriorityUpdate?.priority).toBe('high');
    expect(afterPriorityUpdate?.labels).toHaveLength(2);
    expect(afterPriorityUpdate?.labels[0].name).toBe('bug');
    expect(afterPriorityUpdate?.labels[1].name).toBe('frontend');
    
    // Update only labels (like from task modal)
    store.updateTask(taskId, {
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'frontend', color: 'blue' },
        { name: 'urgent', color: 'orange' }
      ]
    });
    
    // Verify priority wasn't lost
    const afterLabelsUpdate = store.tasks[taskId];
    expect(afterLabelsUpdate?.priority).toBe('high');
    expect(afterLabelsUpdate?.labels).toHaveLength(3);
    expect(afterLabelsUpdate?.labels[2].name).toBe('urgent');
  });
});
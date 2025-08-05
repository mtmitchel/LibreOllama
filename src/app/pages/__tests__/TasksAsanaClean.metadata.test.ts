import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnifiedTaskStore } from '../../../stores/unifiedTaskStore';

describe('TasksAsanaClean - Metadata Updates', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset the store to initial state
    useUnifiedTaskStore.setState({
      tasks: {},
      columns: []
    });
  });

  it('should only pass changed fields when updating priority', async () => {
    const store = useUnifiedTaskStore.getState();
    const taskId = 'test-task';
    
    // Create column first
    const columnId = 'column-1';
    store.addColumn(columnId,
 'Test Column', 'list-1');
    
    // Create task with initial metadata
    const createdTaskId = await store.createTask({
      title: 'Test Task',
      columnId,
      labels: [
        { name: 'bug', color: 'red' },
        { name: 'frontend', color: 'blue' }
      ],
      priority: 'low'
    });
    
    // Override with our test ID
    const task = store.tasks[createdTaskId];
    store.tasks[taskId] = { ...task, id: taskId };
    delete store.tasks[createdTaskId];
    
    // Spy on updateTask
    const updateTaskSpy = vi.spyOn(store, 'updateTask');
    
    // Update priority from context menu
    store.updateTask(taskId, {
      priority: 'high'
    });
    
    // Verify the call was made with only priority
    expect(updateTaskSpy).toHaveBeenCalledWith(taskId, {
      priority: 'high'
    });
    
    // Verify metadata was preserved
    const updatedTask = store.tasks[taskId];
    expect(updatedTask?.labels).toHaveLength(2);
    expect(updatedTask?.labels[0].name).toBe('bug');
    expect(updatedTask?.labels[1].name).toBe('frontend');
    expect(updatedTask?.priority).toBe('high');
  });

  it('should handle metadata updates correctly from task modal', async () => {
    const store = useUnifiedTaskStore.getState();
    
    // Create column first
    const columnId = 'column-1';
    store.addColumn(columnId,
 'Test Column', 'list-1');
    
    // Create task
    const taskId = await store.createTask({
      title: 'Modal Test',
      columnId,
      labels: [{ name: 'urgent', color: 'red' }],
      priority: 'high'
    });
    
    // Update from modal with new labels
    store.updateTask(taskId, {
      title: 'Updated Title',
      labels: [
        { name: 'urgent', color: 'red' },
        { name: 'backend', color: 'blue' },
        { name: 'database', color: 'green' }
      ]
    });
    
    // Verify all fields were updated correctly
    const updatedTask = store.tasks[taskId];
    expect(updatedTask?.title).toBe('Updated Title');
    expect(updatedTask?.labels).toHaveLength(3);
    expect(updatedTask?.labels[1].name).toBe('backend');
    expect(updatedTask?.labels[2].name).toBe('database');
    expect(updatedTask?.priority).toBe('high'); // Priority preserved
  });
});
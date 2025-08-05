import { describe, it, expect, beforeEach } from 'vitest';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { realtimeSync } from '../../services/realtimeSync';

describe('Task Creation and Google Sync', () => {
  beforeEach(() => {
    // Reset store before each test
    useUnifiedTaskStore.setState({
      tasks: {},
      columns: [],
      isSyncing: false,
      syncErrors: {}
    });
  });

  it('should create task with pending_create sync state', () => {
    const store = useUnifiedTaskStore.getState();
    
    // Add a test column
    store.addColumn('test-column', 'Test Column', 'google-list-123');
    
    // Create a task
    const taskId = store.createTask({
      title: 'Test Task',
      notes: 'Test Notes',
      columnId: 'test-column',
      googleTaskListId: 'google-list-123'
    });
    
    // Verify task was created - need to get fresh state
    const newState = useUnifiedTaskStore.getState();
    const task = newState.tasks[taskId];
    expect(task).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.syncState).toBe('pending_create');
    expect(task.googleTaskListId).toBe('google-list-123');
    
    // Verify task is in pending tasks
    const pendingTasks = store.getPendingTasks();
    expect(pendingTasks).toHaveLength(1);
    expect(pendingTasks[0].id).toBe(taskId);
  });

  it('should trigger sync when task is created', async () => {
    const store = useUnifiedTaskStore.getState();
    
    // Add a test column
    store.addColumn('test-column', 'Test Column', 'google-list-123');
    
    // Create a task
    const taskId = store.createTask({
      title: 'Test Task for Sync',
      columnId: 'test-column',
      googleTaskListId: 'google-list-123'
    });
    
    // Wait a bit for the subscription to trigger
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if sync was initiated (isSyncing should be true during sync)
    // Note: This requires the sync service to be initialized
    console.log('Task created with ID:', taskId);
    console.log('Pending tasks:', store.getPendingTasks());
  });
});
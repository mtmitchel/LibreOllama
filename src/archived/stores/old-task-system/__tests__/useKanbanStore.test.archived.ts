import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useKanbanStore } from '../useKanbanStore';

describe('useKanbanStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useKanbanStore.setState({ 
      columns: [], 
      isInitialized: false 
    });
  });

  it('should initialize with default columns when no Google sync', () => {
    const store = useKanbanStore.getState();
    
    act(() => {
      store.initializeKanban();
    });

    expect(store.columns).toHaveLength(3);
    expect(store.columns[0].id).toBe('todo');
    expect(store.columns[0].title).toBe('To Do');
    expect(store.columns[1].id).toBe('in-progress');
    expect(store.columns[2].id).toBe('in-progress');
    expect(store.columns[2].id).toBe('done');
    expect(store.isInitialized).toBe(true);
  });

  it('should create a task and add it to the correct column', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize first
    act(() => {
      store.initializeKanban();
    });

    // Create a task
    let newTask;
    await act(async () => {
      newTask = await store.createTask('todo', {
        title: 'New Test Task',
        notes: 'Test notes',
        metadata: {
          labels: ['test'],
          priority: 'high'
        }
      });
    });

    const todoColumn = store.columns.find(c => c.id === 'todo');
    expect(todoColumn?.tasks).toHaveLength(1);
    expect(todoColumn?.tasks[0].title).toBe('New Test Task');
    expect(todoColumn?.tasks[0].metadata?.priority).toBe('high');
  });

  it('should update a task within a column', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize and create a task
    act(() => {
      store.initializeKanban();
    });

    let task;
    await act(async () => {
      task = await store.createTask('todo', {
        title: 'Original Title'
      });
    });

    // Update the task
    await act(async () => {
      await store.updateTask('todo', task.id, {
        title: 'Updated Title',
        metadata: {
          priority: 'low'
        }
      });
    });

    const todoColumn = store.columns.find(c => c.id === 'todo');
    const updatedTask = todoColumn?.tasks.find(t => t.id === task.id);
    expect(updatedTask?.title).toBe('Updated Title');
    expect(updatedTask?.metadata?.priority).toBe('low');
  });

  it('should delete a task from its column', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize and create a task
    act(() => {
      store.initializeKanban();
    });

    let task;
    await act(async () => {
      task = await store.createTask('todo', {
        title: 'Task to Delete'
      });
    });

    expect(store.columns[0].tasks).toHaveLength(1);

    // Delete the task
    await act(async () => {
      await store.deleteTask('todo', task.id);
    });

    expect(store.columns[0].tasks).toHaveLength(0);
  });

  it('should correctly move a task between columns', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize and create a task
    act(() => {
      store.initializeKanban();
    });

    let task;
    await act(async () => {
      task = await store.createTask('todo', {
        title: 'Task to Move'
      });
    });

    // Move task from todo to in-progress
    act(() => {
      store.moveTask(task.id, 'todo', 'in-progress', 0);
    });

    const todoColumn = store.columns.find(c => c.id === 'todo');
    const inProgressColumn = store.columns.find(c => c.id === 'in-progress');

    expect(todoColumn?.tasks).toHaveLength(0);
    expect(inProgressColumn?.tasks).toHaveLength(1);
    expect(inProgressColumn?.tasks[0].title).toBe('Task to Move');
  });

  it('should add and remove columns', () => {
    const store = useKanbanStore.getState();
    
    act(() => {
      store.addColumn('new-column', 'New Column');
    });

    expect(store.columns).toHaveLength(1);
    expect(store.columns[0].id).toBe('new-column');
    expect(store.columns[0].title).toBe('New Column');

    act(() => {
      store.removeColumn('new-column');
    });

    expect(store.columns).toHaveLength(0);
  });

  it('should reorder tasks within a column', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize
    act(() => {
      store.initializeKanban();
    });

    // Create multiple tasks
    let task1, task2, task3;
    await act(async () => {
      task1 = await store.createTask('todo', { title: 'Task 1' });
      task2 = await store.createTask('todo', { title: 'Task 2' });
      task3 = await store.createTask('todo', { title: 'Task 3' });
    });

    // Reorder: move Task 3 to position 1 (between Task 1 and Task 2)
    act(() => {
      store.reorderTasks('todo', 2, 1);
    });

    const todoColumn = store.columns.find(c => c.id === 'todo');
    expect(todoColumn?.tasks[0].title).toBe('Task 1');
    expect(todoColumn?.tasks[1].title).toBe('Task 3');
    expect(todoColumn?.tasks[2].title).toBe('Task 2');
  });

  it('should clear all data', async () => {
    const store = useKanbanStore.getState();
    
    // Initialize and create some data
    act(() => {
      store.initializeKanban();
    });

    await act(async () => {
      await store.createTask('todo', { title: 'Task 1' });
      await store.createTask('in-progress', { title: 'Task 2' });
    });

    expect(store.columns[0].tasks).toHaveLength(1);
    expect(store.columns[1].tasks).toHaveLength(1);

    // Clear all data
    act(() => {
      store.clearAllData();
    });

    expect(store.columns).toHaveLength(0);
    expect(store.isInitialized).toBe(false);
  });

  it('should not create duplicate default columns on re-initialization', () => {
    const store = useKanbanStore.getState();
    
    // Initialize twice
    act(() => {
      store.initializeKanban();
      store.initializeKanban();
    });

    expect(store.columns).toHaveLength(3);
    expect(store.columns.filter(c => c.id === 'todo')).toHaveLength(1);
  });
}); 
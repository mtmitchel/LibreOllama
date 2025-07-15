import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKanbanStore } from '../../stores/useKanbanStore';

// Mock Tauri commands
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('Project-Task Association Integration', () => {
  beforeEach(() => {
    // Reset stores before each test using store-first pattern
    const store = useKanbanStore.getState();
    store.clearAllData();
  });

  it('should assign a task to a project', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useKanbanStore.getState();

    // Create a task directly through store
    const createdTask = await store.createTask('todo', {
      title: 'Test Task',
      notes: 'Test notes'
    });

    expect(createdTask).toBeDefined();
    expect(createdTask.title).toBe('Test Task');
    expect(createdTask.id).not.toMatch(/^temp-/);

    // Assign task to project
    store.assignTaskToProject(createdTask.id, 'project-1');

    // Verify task is assigned to project
    const updatedStore = useKanbanStore.getState();
    const assignedTask = updatedStore.columns
      .flatMap(c => c.tasks)
      .find(t => t.id === createdTask.id);
    
    expect(assignedTask).toBeDefined();
    expect(assignedTask!.projectId).toBe('project-1');

    // Verify kanban store can retrieve project tasks
    const projectTasks = updatedStore.getTasksByProject('project-1');
    expect(projectTasks).toHaveLength(1);
    expect(projectTasks[0].id).toBe(createdTask.id);
  });

  it('should remove a task from a project', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useKanbanStore.getState();

    // Create task
    const createdTask = await store.createTask('todo', {
      title: 'Test Task',
      notes: 'Test notes'
    });

    // Assign to project first
    store.assignTaskToProject(createdTask.id, 'project-1');

    // Verify assignment
    let updatedStore = useKanbanStore.getState();
    let assignedTask = updatedStore.columns
      .flatMap(c => c.tasks)
      .find(t => t.id === createdTask.id);
    expect(assignedTask?.projectId).toBe('project-1');

    // Remove from project
    store.removeTaskFromProject(createdTask.id);

    // Verify task is no longer assigned to project
    updatedStore = useKanbanStore.getState();
    const unassignedTask = updatedStore.columns
      .flatMap(c => c.tasks)
      .find(t => t.id === createdTask.id);
    expect(unassignedTask?.projectId).toBeUndefined();

    // Verify project has no tasks
    const projectTasks = updatedStore.getTasksByProject('project-1');
    expect(projectTasks).toHaveLength(0);
  });

  it('should get tasks by project', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useKanbanStore.getState();

    // Create multiple tasks
    const task1 = await store.createTask('todo', {
      title: 'Task 1',
      notes: 'Task 1 notes'
    });
    
    const task2 = await store.createTask('in-progress', {
      title: 'Task 2', 
      notes: 'Task 2 notes'
    });

    const task3 = await store.createTask('done', {
      title: 'Task 3',
      notes: 'Task 3 notes'
    });

    // Assign tasks to different projects
    store.assignTaskToProject(task1.id, 'project-1');
    store.assignTaskToProject(task2.id, 'project-1');
    store.assignTaskToProject(task3.id, 'project-2');

    // Test getTasksByProject
    const updatedStore = useKanbanStore.getState();
    const project1Tasks = updatedStore.getTasksByProject('project-1');
    const project2Tasks = updatedStore.getTasksByProject('project-2');
    const nonExistentProjectTasks = updatedStore.getTasksByProject('project-3');

    expect(project1Tasks).toHaveLength(2);
    expect(project1Tasks.map(t => t.title)).toContain('Task 1');
    expect(project1Tasks.map(t => t.title)).toContain('Task 2');

    expect(project2Tasks).toHaveLength(1);
    expect(project2Tasks[0].title).toBe('Task 3');

    expect(nonExistentProjectTasks).toHaveLength(0);
  });

  it('should get unassigned tasks', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useKanbanStore.getState();

    // Create multiple tasks
    const task1 = await store.createTask('todo', {
      title: 'Task 1',
      notes: 'Task 1 notes'
    });
    
    const task2 = await store.createTask('in-progress', {
      title: 'Task 2',
      notes: 'Task 2 notes'
    });

    const task3 = await store.createTask('done', {
      title: 'Task 3',
      notes: 'Task 3 notes'
    });

    // Assign some tasks to projects, leave others unassigned
    store.assignTaskToProject(task1.id, 'project-1');
    // task2 and task3 remain unassigned

    // Test getUnassignedTasks
    const updatedStore = useKanbanStore.getState();
    const unassignedTasks = updatedStore.getUnassignedTasks();

    expect(unassignedTasks).toHaveLength(2);
    expect(unassignedTasks.map(t => t.title)).toContain('Task 2');
    expect(unassignedTasks.map(t => t.title)).toContain('Task 3');
    expect(unassignedTasks.map(t => t.title)).not.toContain('Task 1');
  });

  it('should calculate project task counts correctly', async () => {
    // ✅ BEST PRACTICE: Direct store testing from Canvas model
    const store = useKanbanStore.getState();

    // Create multiple tasks
    const task1 = await store.createTask('todo', {
      title: 'Task 1',
      notes: 'Task 1 notes'
    });
    
    const task2 = await store.createTask('in-progress', {
      title: 'Task 2',
      notes: 'Task 2 notes'
    });

    const task3 = await store.createTask('done', {
      title: 'Task 3',
      notes: 'Task 3 notes'
    });

    const task4 = await store.createTask('todo', {
      title: 'Task 4',
      notes: 'Task 4 notes'
    });

    // Assign tasks to projects
    store.assignTaskToProject(task1.id, 'project-1');
    store.assignTaskToProject(task2.id, 'project-1');
    store.assignTaskToProject(task3.id, 'project-2');
    // task4 remains unassigned

    // Verify counts
    const updatedStore = useKanbanStore.getState();
    const project1Tasks = updatedStore.getTasksByProject('project-1');
    const project2Tasks = updatedStore.getTasksByProject('project-2');
    const unassignedTasks = updatedStore.getUnassignedTasks();

    expect(project1Tasks).toHaveLength(2);
    expect(project2Tasks).toHaveLength(1);
    expect(unassignedTasks).toHaveLength(1);

    // Verify total task count
    const allTasks = updatedStore.columns.flatMap(c => c.tasks);
    expect(allTasks).toHaveLength(4);
  });
}); 
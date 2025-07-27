import { describe, it, expect, beforeEach, vi } from 'vitest';
import { kanbanGoogleSync } from '../kanbanGoogleTasksSync';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useTaskMetadataStore } from '../../stores/taskMetadataStore';

// Mock the stores
vi.mock('../../stores/useKanbanStore');
vi.mock('../../stores/googleTasksStore');
vi.mock('../../stores/taskMetadataStore');

describe('kanbanGoogleTasksSync Service', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock basic store states
    vi.mocked(useKanbanStore.getState).mockReturnValue({
      columns: [],
      addColumn: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      clearAllData: vi.fn()
    } as any);
    
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue({
      isAuthenticated: true,
      taskLists: [],
      tasks: {},
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn()
    } as any);
    
    vi.mocked(useTaskMetadataStore.getState).mockReturnValue({
      getTaskMetadata: vi.fn(),
      setTaskMetadata: vi.fn()
    } as any);
  });

  it('should create a new Kanban task if a new task exists in Google', async () => {
    // Setup: Mock Google store has a task that Kanban store does not
    const googleTask = {
      id: 'google-task-1',
      title: 'New Google Task',
      notes: 'Task notes',
      due: '2025-12-01',
      status: 'needsAction',
      updated: new Date().toISOString()
    };
    
    const mockKanbanStore = {
      columns: [{ id: 'list-1', title: 'My List', tasks: [] }],
      createTask: vi.fn().mockResolvedValue({
        id: 'kanban-task-1',
        title: 'New Google Task',
        notes: 'Task notes',
        due: '2025-12-01',
        status: 'needsAction',
        position: '',
        updated: new Date().toISOString(),
        metadata: {
          googleTaskId: 'google-task-1'
        }
      })
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [{ id: 'list-1', title: 'My List' }],
      tasks: { 'list-1': [googleTask] }
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'list-1', googleTaskListId: 'list-1' }
    ]));
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: kanbanStore.createTask to have been called with the correct data
    expect(mockKanbanStore.createTask).toHaveBeenCalledWith('list-1', expect.objectContaining({
      title: 'New Google Task',
      notes: 'Task notes',
      due: '2025-12-01',
      metadata: expect.objectContaining({
        googleTaskId: 'google-task-1'
      })
    }));
  });

  it('should NOT re-create a task that was deleted locally but still exists in Google', async () => {
    // Setup: Mock Google store has a task. Mock Metadata store has an entry for that task's ID with deleted: true
    const googleTask = {
      id: 'google-task-deleted',
      title: 'Deleted Task',
      status: 'needsAction',
      updated: new Date().toISOString()
    };
    
    const mockKanbanStore = {
      columns: [{ id: 'list-1', title: 'My List', tasks: [] }],
      createTask: vi.fn()
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [{ id: 'list-1', title: 'My List' }],
      tasks: { 'list-1': [googleTask] }
    };
    
    const mockMetadataStore = {
      getTaskMetadata: vi.fn().mockImplementation((id) => 
        id === 'google-task-deleted' ? { deleted: true } : null
      ),
      setTaskMetadata: vi.fn()
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    vi.mocked(useTaskMetadataStore.getState).mockReturnValue(mockMetadataStore as any);
    
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'list-1', googleTaskListId: 'list-1' }
    ]));
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: kanbanStore.createTask should NOT be called for that task
    expect(mockKanbanStore.createTask).not.toHaveBeenCalled();
  });

  it('should update an existing Kanban task if its counterpart in Google is newer', async () => {
    const oldDate = new Date('2025-01-01').toISOString();
    const newDate = new Date('2025-01-02').toISOString();
    
    const kanbanTask = {
      id: 'kanban-task-1',
      title: 'Old Title',
      updated: oldDate,
      metadata: { googleTaskId: 'google-task-1' }
    };
    
    const googleTask = {
      id: 'google-task-1',
      title: 'Updated Title',
      notes: 'Updated notes',
      status: 'needsAction',
      updated: newDate
    };
    
    const mockKanbanStore = {
      columns: [{ id: 'list-1', title: 'My List', tasks: [kanbanTask] }],
      updateTask: vi.fn()
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [{ id: 'list-1', title: 'My List' }],
      tasks: { 'list-1': [googleTask] }
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'list-1', googleTaskListId: 'list-1' }
    ]));
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: kanbanStore.updateTask to have been called with updated data
    expect(mockKanbanStore.updateTask).toHaveBeenCalledWith('list-1', 'kanban-task-1', expect.objectContaining({
      title: 'Updated Title',
      notes: 'Updated notes'
    }));
  });

  it('should remove Kanban tasks that no longer exist in Google', async () => {
    const kanbanTask = {
      id: 'kanban-task-removed',
      title: 'Task to Remove',
      metadata: { googleTaskId: 'google-task-removed' }
    };
    
    const mockKanbanStore = {
      columns: [{ id: 'list-1', title: 'My List', tasks: [kanbanTask] }],
      deleteTask: vi.fn()
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [{ id: 'list-1', title: 'My List' }],
      tasks: { 'list-1': [] } // No tasks in Google
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'list-1', googleTaskListId: 'list-1' }
    ]));
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: kanbanStore.deleteTask to have been called
    expect(mockKanbanStore.deleteTask).toHaveBeenCalledWith('list-1', 'kanban-task-removed');
  });

  it('should setup column mappings based on Google Task lists', async () => {
    const mockKanbanStore = {
      columns: [],
      addColumn: vi.fn()
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [
        { id: 'glist-1', title: 'Personal' },
        { id: 'glist-2', title: 'Work' }
      ],
      tasks: {}
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    
    // Action: Setup column mappings
    await kanbanGoogleSync.setupColumnMappings();
    
    // Expect: columns to be created
    expect(mockKanbanStore.addColumn).toHaveBeenCalledWith('glist-1', 'Personal');
    expect(mockKanbanStore.addColumn).toHaveBeenCalledWith('glist-2', 'Work');
    
    // Verify mappings were saved
    const savedMappings = JSON.parse(localStorage.getItem('kanban-google-sync-mappings') || '[]');
    expect(savedMappings).toEqual([
      { kanbanColumnId: 'glist-1', googleTaskListId: 'glist-1' },
      { kanbanColumnId: 'glist-2', googleTaskListId: 'glist-2' }
    ]);
  });

  it('should handle sync when not authenticated', async () => {
    const mockGoogleStore = {
      isAuthenticated: false,
      taskLists: [],
      tasks: {}
    };
    
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: No errors and no operations performed
    expect(useKanbanStore.getState).not.toHaveBeenCalled();
  });

  it('should handle metadata preservation during sync', async () => {
    const googleTask = {
      id: 'google-task-meta',
      title: 'Task with Metadata',
      status: 'needsAction',
      updated: new Date().toISOString()
    };
    
    const mockMetadata = {
      labels: ['important', 'backend'],
      priority: 'high',
      subtasks: []
    };
    
    const mockKanbanStore = {
      columns: [{ id: 'list-1', title: 'My List', tasks: [] }],
      createTask: vi.fn()
    };
    
    const mockGoogleStore = {
      isAuthenticated: true,
      taskLists: [{ id: 'list-1', title: 'My List' }],
      tasks: { 'list-1': [googleTask] }
    };
    
    const mockMetadataStore = {
      getTaskMetadata: vi.fn().mockReturnValue(mockMetadata),
      setTaskMetadata: vi.fn()
    };
    
    vi.mocked(useKanbanStore.getState).mockReturnValue(mockKanbanStore as any);
    vi.mocked(useGoogleTasksStore.getState).mockReturnValue(mockGoogleStore as any);
    vi.mocked(useTaskMetadataStore.getState).mockReturnValue(mockMetadataStore as any);
    
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'list-1', googleTaskListId: 'list-1' }
    ]));
    
    // Action: Run syncAll()
    await kanbanGoogleSync.syncAll();
    
    // Expect: task created with metadata
    expect(mockKanbanStore.createTask).toHaveBeenCalledWith('list-1', expect.objectContaining({
      metadata: expect.objectContaining({
        labels: ['important', 'backend'],
        priority: 'high',
        googleTaskId: 'google-task-meta'
      })
    }));
  });
});
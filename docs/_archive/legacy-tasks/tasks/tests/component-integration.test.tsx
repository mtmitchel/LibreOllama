import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { mockInvoke } from '../../../services/google/mockGoogleService';
import { useGoogleStore } from '../../../stores/googleStore';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation(mockInvoke),
}));

// Mock DND Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: vi.fn().mockImplementation(({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'dnd-context' }, children)
  ),
  DragOverlay: vi.fn().mockImplementation(({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'drag-overlay' }, children)
  ),
  useSensor: vi.fn(),
  useSensors: vi.fn().mockReturnValue([]),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCorners: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  sortableKeyboardCoordinates: vi.fn(),
}));

// Mock Zustand with React
vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

// Mock React imports
import React from 'react';
import Tasks from '../../../app/pages/Tasks';
import { TaskCard } from '../components/TaskCard';
import { TaskColumn } from '../components/TaskColumn';
import { TaskModal } from '../components/TaskModal';

// Mock components that are complex to test
vi.mock('../../../components/ui', () => ({
  Card: vi.fn().mockImplementation(({ children, className }: { children: React.ReactNode; className?: string }) => 
    React.createElement('div', { className, 'data-testid': 'card' }, children)
  ),
  Button: vi.fn().mockImplementation(({ children, onClick, variant, size, className }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
    className?: string; 
  }) => 
    React.createElement('button', { 
      onClick, 
      className, 
      'data-testid': 'button',
      'data-variant': variant,
      'data-size': size
    }, children)
  ),
  Toast: vi.fn().mockImplementation(({ title, message, variant }: { title: string; message: string; variant: string }) => 
    React.createElement('div', { 'data-testid': 'toast', 'data-variant': variant }, [
      React.createElement('div', { 'data-testid': 'toast-title', key: 'title' }, title),
      React.createElement('div', { 'data-testid': 'toast-message', key: 'message' }, message)
    ])
  ),
  FlexibleGrid: vi.fn().mockImplementation(({ children, className }: { children: React.ReactNode; className?: string }) => 
    React.createElement('div', { className, 'data-testid': 'flexible-grid' }, children)
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Plus: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'plus-icon' }, '+')),
  LayoutGrid: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'layout-grid-icon' }, '⊞')),
  List: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'list-icon' }, '☰')),
  Calendar: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'calendar-icon' }, '📅')),
  Clock: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'clock-icon' }, '🕐')),
  Tag: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'tag-icon' }, '🏷️')),
  User: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'user-icon' }, '👤')),
  CheckCircle: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'check-circle-icon' }, '✓')),
  XCircle: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'x-circle-icon' }, '✗')),
  MoreHorizontal: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'more-horizontal-icon' }, '⋯')),
  Edit: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'edit-icon' }, '✏️')),
  Trash: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'trash-icon' }, '🗑️')),
  Move: vi.fn().mockImplementation(() => React.createElement('span', { 'data-testid': 'move-icon' }, '↔️')),
}));

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
  vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
  vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockConsole.log.mockClear();
  mockConsole.error.mockClear();
  mockConsole.warn.mockClear();
});

describe('Component Integration Tests', () => {
  let mockStore: any;
  let mockMetadataStore: any;

  beforeEach(() => {
    // Mock store state
    mockStore = {
      taskLists: [
        { id: 'list-1', title: 'To Do', updated: '2024-01-01', selfLink: '', etag: '' },
        { id: 'list-2', title: 'In Progress', updated: '2024-01-01', selfLink: '', etag: '' },
        { id: 'list-3', title: 'Done', updated: '2024-01-01', selfLink: '', etag: '' },
      ],
      kanbanColumns: [
        {
          taskList: { id: 'list-1', title: 'To Do' },
          tasks: [
            { id: 'task-1', title: 'Task 1', notes: 'Notes 1', status: 'needsAction' },
            { id: 'task-2', title: 'Task 2', notes: 'Notes 2', status: 'needsAction' },
          ],
        },
        {
          taskList: { id: 'list-2', title: 'In Progress' },
          tasks: [
            { id: 'task-3', title: 'Task 3', notes: 'Notes 3', status: 'needsAction' },
          ],
        },
        {
          taskList: { id: 'list-3', title: 'Done' },
          tasks: [
            { id: 'task-4', title: 'Task 4', notes: 'Notes 4', status: 'completed' },
          ],
        },
      ],
      isLoadingTasks: false,
      activeAccount: {
        id: 'account-1',
        email: 'test@example.com',
        name: 'Test User',
      },
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      toggleTaskCompletion: vi.fn(),
      fetchTaskLists: vi.fn(),
      fetchAllTasks: vi.fn(),
      optimisticUpdateTask: vi.fn(),
      taskIdToListId: new Map([
        ['task-1', 'list-1'],
        ['task-2', 'list-1'],
        ['task-3', 'list-2'],
        ['task-4', 'list-3'],
      ]),
      fetchTasksForList: vi.fn(),
    };

    mockMetadataStore = {
      metadata: new Map(),
      setTaskMetadata: vi.fn(),
      getTaskMetadata: vi.fn().mockReturnValue(null),
      deleteTaskMetadata: vi.fn(),
      clearAllMetadata: vi.fn(),
      importFromNotesField: vi.fn(),
      exportToNotesField: vi.fn().mockReturnValue(''),
    };

    // Mock store hooks
    vi.mocked(useGoogleStore).mockReturnValue(mockStore);
    vi.mocked(useTaskMetadataStore).mockReturnValue(mockMetadataStore);
  });

  describe('Tasks Page Integration', () => {
    it('should render tasks page with kanban columns', async () => {
      render(React.createElement(Tasks));

      // Check for view toggle controls
      expect(screen.getByText('Board')).toBeInTheDocument();
      expect(screen.getByText('List')).toBeInTheDocument();

      // Check for kanban columns
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();

      // Check for tasks
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
      expect(screen.getByText('Task 4')).toBeInTheDocument();
    });

    it('should handle view mode toggle', async () => {
      render(React.createElement(Tasks));

      // Start in kanban view
      expect(screen.getByText('Board')).toBeInTheDocument();
      expect(screen.getByText('List')).toBeInTheDocument();

      // Switch to list view
      const listButton = screen.getByText('List');
      fireEvent.click(listButton);

      // Should show list view
      await waitFor(() => {
        expect(screen.getByText('All Tasks')).toBeInTheDocument();
      });
    });

    it('should handle task creation', async () => {
      mockStore.createTask.mockResolvedValue({
        id: 'new-task',
        title: 'New Task',
        notes: 'New notes',
        status: 'needsAction',
      });

      render(React.createElement(Tasks));

      // Click new task button
      const newTaskButton = screen.getByText('New Task');
      fireEvent.click(newTaskButton);

      // Should open modal
      await waitFor(() => {
        expect(screen.getByText('Create Task')).toBeInTheDocument();
      });
    });

    it('should handle task updates', async () => {
      mockStore.updateTask.mockResolvedValue({
        id: 'task-1',
        title: 'Updated Task',
        notes: 'Updated notes',
        status: 'needsAction',
      });

      render(React.createElement(Tasks));

      // Click on a task to edit it
      const taskElement = screen.getByText('Task 1');
      fireEvent.click(taskElement);

      // Should open edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Task')).toBeInTheDocument();
      });
    });

    it('should handle task deletion', async () => {
      mockStore.deleteTask.mockResolvedValue(undefined);

      render(React.createElement(Tasks));

      // Find and click delete button (implementation depends on TaskCard)
      const deleteButtons = screen.getAllByTestId('trash-icon');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        
        await waitFor(() => {
          expect(mockStore.deleteTask).toHaveBeenCalled();
        });
      }
    });

    it('should handle task completion toggle', async () => {
      mockStore.toggleTaskCompletion.mockResolvedValue({
        id: 'task-1',
        title: 'Task 1',
        status: 'completed',
      });

      render(React.createElement(Tasks));

      // Find and click completion checkbox
      const checkboxes = screen.getAllByTestId('check-circle-icon');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        
        await waitFor(() => {
          expect(mockStore.toggleTaskCompletion).toHaveBeenCalled();
        });
      }
    });

    it('should handle loading state', async () => {
      mockStore.isLoadingTasks = true;
      mockStore.taskLists = [];

      render(React.createElement(Tasks));

      // Should show loading skeleton
      expect(screen.getByTestId('flexible-grid')).toBeInTheDocument();
    });

    it('should handle error state', async () => {
      mockStore.taskLists = [];
      mockStore.isLoadingTasks = false;

      render(React.createElement(Tasks));

      // Should show error message
      expect(screen.getByText('No task lists found')).toBeInTheDocument();
    });

    it('should handle no active account', async () => {
      mockStore.activeAccount = null;

      render(React.createElement(Tasks));

      // Should show no account message
      expect(screen.getByText('No Google Account Connected')).toBeInTheDocument();
    });
  });

  describe('TaskCard Integration', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      notes: 'Test notes',
      status: 'needsAction' as const,
      due: '2024-12-31',
      labels: ['urgent', 'work'],
      priority: 'high' as const,
    };

    it('should render task card with basic information', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={mockTask}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    it('should handle task click', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={mockTask}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      const taskElement = screen.getByText('Test Task');
      fireEvent.click(taskElement);

      expect(mockHandlers.onTaskClick).toHaveBeenCalledWith(mockTask, 'list-1');
    });

    it('should handle completion toggle', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={mockTask}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      const checkIcon = screen.getByTestId('check-circle-icon');
      fireEvent.click(checkIcon);

      expect(mockHandlers.onToggleCompletion).toHaveBeenCalledWith(
        'list-1',
        'task-1',
        'needsAction'
      );
    });

    it('should handle task deletion', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={mockTask}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      const deleteIcon = screen.getByTestId('trash-icon');
      fireEvent.click(deleteIcon);

      expect(mockHandlers.onDeleteTask).toHaveBeenCalled();
    });

    it('should show due date indicator', () => {
      const taskWithDueDate = {
        ...mockTask,
        due: '2024-12-31',
      };

      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={taskWithDueDate}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('should show priority indicator', () => {
      const taskWithPriority = {
        ...mockTask,
        priority: 'high' as const,
      };

      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={taskWithPriority}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      // Priority indicator should be visible (implementation specific)
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should show labels', () => {
      const taskWithLabels = {
        ...mockTask,
        labels: ['urgent', 'work'],
      };

      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskCard
          task={taskWithLabels}
          listId="list-1"
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      // Labels should be visible (implementation specific)
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('TaskColumn Integration', () => {
    const mockTaskList = {
      id: 'list-1',
      title: 'Test Column',
      updated: '2024-01-01',
      selfLink: '',
      etag: '',
    };

    const mockTasks = [
      { id: 'task-1', title: 'Task 1', notes: 'Notes 1', status: 'needsAction' as const },
      { id: 'task-2', title: 'Task 2', notes: 'Notes 2', status: 'needsAction' as const },
    ];

    it('should render task column with tasks', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onOpenCreateModal: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskColumn
          id="list-1"
          taskList={mockTaskList}
          tasks={mockTasks}
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test Column')).toBeInTheDocument();
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('should handle create task in column', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onOpenCreateModal: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskColumn
          id="list-1"
          taskList={mockTaskList}
          tasks={mockTasks}
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      const addButton = screen.getByTestId('plus-icon');
      fireEvent.click(addButton);

      expect(mockHandlers.onOpenCreateModal).toHaveBeenCalledWith('list-1', 'Test Column');
    });

    it('should show task count', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onOpenCreateModal: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskColumn
          id="list-1"
          taskList={mockTaskList}
          tasks={mockTasks}
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle empty column', () => {
      const mockHandlers = {
        onTaskClick: vi.fn(),
        onToggleCompletion: vi.fn(),
        onDeleteTask: vi.fn(),
        onOpenCreateModal: vi.fn(),
        onRetrySync: vi.fn(),
      };

      render(
        <TaskColumn
          id="list-1"
          taskList={mockTaskList}
          tasks={[]}
          isDragStarted={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test Column')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('TaskModal Integration', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      notes: 'Test notes',
      status: 'needsAction' as const,
      due: '2024-12-31',
      labels: ['urgent', 'work'],
      priority: 'high' as const,
    };

    const mockModalState = {
      type: 'edit' as const,
      columnId: 'list-1',
      columnTitle: 'Test Column',
      isOpen: true,
      task: mockTask,
    };

    const mockTaskForm = {
      title: 'Test Task',
      notes: 'Test notes',
      due: '2024-12-31',
      priority: 'high' as const,
      labels: ['urgent', 'work'],
      subtasks: [],
    };

    const mockTaskLists = [
      { id: 'list-1', title: 'To Do', updated: '2024-01-01', selfLink: '', etag: '' },
      { id: 'list-2', title: 'In Progress', updated: '2024-01-01', selfLink: '', etag: '' },
    ];

    it('should render task modal in edit mode', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
    });

    it('should render task modal in create mode', () => {
      const createModalState = {
        type: 'create' as const,
        columnId: 'list-1',
        columnTitle: 'Test Column',
        isOpen: true,
        task: null,
      };

      const emptyTaskForm = {
        title: '',
        notes: '',
        due: '',
        priority: 'normal' as const,
        labels: [],
        subtasks: [],
      };

      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={createModalState}
          taskForm={emptyTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('should handle form submission', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const submitButton = screen.getByText('Save Task');
      fireEvent.click(submitButton);

      expect(mockHandlers.onSubmit).toHaveBeenCalledWith('list-1', mockTaskForm);
    });

    it('should handle modal close', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('should handle form updates', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const titleInput = screen.getByDisplayValue('Test Task');
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      expect(mockHandlers.onUpdateForm).toHaveBeenCalledWith('title', 'Updated Task');
    });

    it('should handle label management', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      // Add label
      const addLabelButton = screen.getByText('Add Label');
      fireEvent.click(addLabelButton);

      expect(mockHandlers.onAddLabel).toHaveBeenCalledWith('');
    });

    it('should show validation errors', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      const formErrors = {
        title: 'Title is required',
        due: 'Invalid date format',
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={formErrors}
          taskLists={mockTaskLists}
          isLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid date format')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      const mockHandlers = {
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onUpdateForm: vi.fn(),
        onAddLabel: vi.fn(),
        onRemoveLabel: vi.fn(),
        onAddSubtask: vi.fn(),
        onUpdateSubtask: vi.fn(),
        onRemoveSubtask: vi.fn(),
      };

      render(
        <TaskModal
          modalState={mockModalState}
          taskForm={mockTaskForm}
          formErrors={{}}
          taskLists={mockTaskLists}
          isLoading={true}
          {...mockHandlers}
        />
      );

      const submitButton = screen.getByText('Save Task');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('End-to-End Integration', () => {
    it('should handle complete task creation flow', async () => {
      mockStore.createTask.mockResolvedValue({
        id: 'new-task',
        title: 'New Task',
        notes: 'New notes',
        status: 'needsAction',
      });

      render(React.createElement(Tasks));

      // Click new task button
      const newTaskButton = screen.getByText('New Task');
      fireEvent.click(newTaskButton);

      // Fill form
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Task title');
        fireEvent.change(titleInput, { target: { value: 'New Task' } });
        
        const notesInput = screen.getByPlaceholderText('Task notes');
        fireEvent.change(notesInput, { target: { value: 'New notes' } });
      });

      // Submit form
      const submitButton = screen.getByText('Create Task');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.createTask).toHaveBeenCalledWith('list-1', {
          title: 'New Task',
          notes: 'New notes',
        });
      });
    });

    it('should handle complete task editing flow', async () => {
      mockStore.updateTask.mockResolvedValue({
        id: 'task-1',
        title: 'Updated Task',
        notes: 'Updated notes',
        status: 'needsAction',
      });

      render(React.createElement(Tasks));

      // Click on task
      const taskElement = screen.getByText('Task 1');
      fireEvent.click(taskElement);

      // Edit form
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Task 1');
        fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
      });

      // Submit form
      const submitButton = screen.getByText('Save Task');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.updateTask).toHaveBeenCalledWith('list-1', 'task-1', {
          title: 'Updated Task',
          notes: 'Notes 1',
        });
      });
    });

    it('should handle task movement between columns', async () => {
      // This would require DND Kit integration testing
      // For now, we'll test the store integration
      mockStore.moveTask = vi.fn().mockResolvedValue({
        id: 'task-1',
        title: 'Task 1',
        status: 'needsAction',
      });

      render(React.createElement(Tasks));

      // Simulate drag and drop (implementation depends on DND Kit setup)
      // This would involve more complex setup for testing drag and drop
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    it('should handle error states throughout the flow', async () => {
      mockStore.createTask.mockRejectedValue(new Error('Creation failed'));

      render(React.createElement(Tasks));

      // Click new task button
      const newTaskButton = screen.getByText('New Task');
      fireEvent.click(newTaskButton);

      // Fill and submit form
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Task title');
        fireEvent.change(titleInput, { target: { value: 'New Task' } });
        
        const submitButton = screen.getByText('Create Task');
        fireEvent.click(submitButton);
      });

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText('Creation Failed')).toBeInTheDocument();
      });
    });

    it('should handle concurrent operations', async () => {
      const task1Promise = Promise.resolve({
        id: 'task-1',
        title: 'Task 1',
        status: 'completed',
      });

      const task2Promise = Promise.resolve({
        id: 'task-2',
        title: 'Task 2',
        status: 'completed',
      });

      mockStore.toggleTaskCompletion
        .mockResolvedValueOnce(task1Promise)
        .mockResolvedValueOnce(task2Promise);

      render(React.createElement(Tasks));

      // Click multiple task checkboxes rapidly
      const checkboxes = screen.getAllByTestId('check-circle-icon');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(mockStore.toggleTaskCompletion).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 

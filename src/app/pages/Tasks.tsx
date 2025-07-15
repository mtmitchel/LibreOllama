import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Toast, FlexibleGrid, Input } from '../../components/ui';
import { Plus, List as ListIcon, CheckSquare, RefreshCw, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

import { useHeader } from '../contexts/HeaderContext';

// Import stores
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import type { GoogleTask, GoogleTaskList } from '../../types/google';

// Simple Task Card component for Google Tasks
const GoogleTaskCard = React.memo(({ task, onTaskClick, onToggleCompletion, onDeleteTask }: {
  task: GoogleTask;
  onTaskClick: (task: GoogleTask) => void;
  onToggleCompletion: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}) => {
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onTaskClick(task);
  }, [onTaskClick, task]);

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompletion(task.id, task.status !== 'completed');
  }, [onToggleCompletion, task.id, task.status]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
  }, [onDeleteTask, task.id]);

  return (
    <div className="border-border-default hover:border-border-hover rounded-lg border bg-card transition-all duration-200 hover:shadow-md">
      <div className="cursor-pointer p-4" onClick={handleCardClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-primary">{task.title}</h4>
            {task.notes && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">{task.notes}</p>
            )}
            {task.due && (
              <p className="mt-1 text-xs text-warning">Due: {new Date(task.due).toLocaleDateString()}</p>
            )}
            {task.status === 'completed' && task.completed && (
              <p className="mt-1 text-xs text-success">Completed: {new Date(task.completed).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleClick}
              className={`flex size-4 items-center justify-center rounded border-2 ${
                task.status === 'completed' 
                  ? 'text-success-ghost border-success bg-success' 
                  : 'border-border-default hover:border-success'
              }`}
              title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.status === 'completed' && '✓'}
            </button>
            <button
              onClick={handleDeleteClick}
              className="hover:text-error-hover p-1 text-error"
              title="Delete task"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
GoogleTaskCard.displayName = 'GoogleTaskCard';

const TaskListColumn = React.memo(({ taskList, tasks, isLoading, onTaskClick, onToggleCompletion, onDeleteTask, onCreateTask }: {
  taskList: GoogleTaskList;
  tasks: GoogleTask[];
  isLoading: boolean;
  onTaskClick: (task: GoogleTask) => void;
  onToggleCompletion: (taskListId: string, taskId: string, completed: boolean) => void;
  onDeleteTask: (taskListId: string, taskId: string) => void;
  onCreateTask: (taskListId: string) => void;
}) => {
  const handleCreateTask = useCallback(() => {
    onCreateTask(taskList.id);
  }, [onCreateTask, taskList.id]);

  const handleTaskClick = useCallback((task: GoogleTask) => {
    onTaskClick(task);
  }, [onTaskClick]);

  const handleToggleCompletion = useCallback((taskId: string, completed: boolean) => {
    onToggleCompletion(taskList.id, taskId, completed);
  }, [onToggleCompletion, taskList.id]);

  const handleDeleteTask = useCallback((taskId: string) => {
    onDeleteTask(taskList.id, taskId);
  }, [onDeleteTask, taskList.id]);

  return (
    <Card className="h-fit">
      <div className="border-border-default flex items-center justify-between border-b p-4">
        <h3 className="font-semibold text-primary">{taskList.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{tasks.length}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCreateTask}
            className="size-6 p-0"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      <div className="min-h-40 space-y-3 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {tasks.map(task => (
              <GoogleTaskCard
                key={task.id}
                task={task}
                onTaskClick={handleTaskClick}
                onToggleCompletion={(taskId, completed) => handleToggleCompletion(taskId, completed)}
                onDeleteTask={(taskId) => handleDeleteTask(taskId)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-tertiary">
                  <Plus size={24} className="text-secondary" />
                </div>
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs">Click + to create a task</p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
});
TaskListColumn.displayName = 'TaskListColumn';

const SimpleTaskModal = ({ isOpen, task, taskListId, onClose, onSubmit, onDelete }: {
  isOpen: boolean;
  task?: GoogleTask | null;
  taskListId?: string;
  onClose: () => void;
  onSubmit: (taskListId: string, data: { title: string; notes?: string; due?: string }) => void;
  onDelete?: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        due: '',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskListId) {
      onSubmit(taskListId, {
        title: formData.title,
        notes: formData.notes || undefined,
        due: formData.due ? formData.due + 'T00:00:00.000Z' : undefined,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-primary">
                {task ? 'Edit Task' : 'Create Task'}
              </h2>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-primary">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="border-border-default w-full rounded-md border bg-card p-2 text-primary"
                  placeholder="Task title..."
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-primary">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="border-border-default w-full rounded-md border bg-card p-2 text-primary"
                  placeholder="Task description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-primary">Due date</label>
                <input
                  type="date"
                  value={formData.due}
                  onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                  className="border-border-default w-full rounded-md border bg-card p-2 text-primary"
                />
              </div>
            </div>

            <div className="border-border-default flex items-center justify-between border-t p-6">
              <div>
                {task && onDelete && (
                  <Button type="button" variant="outline" onClick={onDelete} className="border-error text-error">
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {task ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default function Tasks() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<GoogleTask | null>(null);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'due' | 'status' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    variant: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>>([]);

  // Use centralized Google authentication
  const activeGoogleAccount = useActiveGoogleAccount();
  const { setHeaderProps, clearHeaderProps } = useHeader();

  // Use the Google Tasks store
  const {
    taskLists,
    tasks: allTasks,
    isLoading,
    isLoadingTasks,
    error,
    fetchTaskLists,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    clearError,
    authenticate,
    isAuthenticated,
    isHydrated,
    syncAllTasks,
  } = useGoogleTasksStore();

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const allTasksFlat = Object.values(allTasks).flat();
    
    // Filter by search query
    let filtered = allTasksFlat.filter(task => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        (task.notes && task.notes.toLowerCase().includes(query))
      );
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'due': {
          const aDue = a.due ? new Date(a.due).getTime() : 0;
          const bDue = b.due ? new Date(b.due).getTime() : 0;
          comparison = aDue - bDue;
          break;
        }
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'created': {
          const aCreated = a.updated ? new Date(a.updated).getTime() : 0;
          const bCreated = b.updated ? new Date(b.updated).getTime() : 0;
          comparison = aCreated - bCreated;
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTasks, searchQuery, sortBy, sortOrder]);

  // Group filtered tasks by task list for display
  const groupedFilteredTasks = useMemo(() => {
    const grouped: Record<string, GoogleTask[]> = {};
    
    taskLists.forEach(taskList => {
      grouped[taskList.id] = filteredAndSortedTasks.filter(task => {
        // Find which task list this task belongs to
        return allTasks[taskList.id]?.some(t => t.id === task.id);
      });
    });
    
    return grouped;
  }, [taskLists, filteredAndSortedTasks, allTasks]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTaskLists(),
        syncAllTasks()
      ]);
      addToast('success', 'Refresh Complete', 'Tasks updated successfully');
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
      addToast('error', 'Refresh Failed', 'Failed to refresh tasks. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTaskLists, syncAllTasks]);

  const addToast = (variant: 'success' | 'error' | 'warning', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, variant, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Initialize authentication and fetch data
  useEffect(() => {
    if (activeGoogleAccount && !isAuthenticated && isHydrated) {
      // TODO: Convert GoogleAccountSettings to GoogleAccount format for authentication
      // authenticate(activeGoogleAccount);
    }
  }, [activeGoogleAccount, isAuthenticated, isHydrated, authenticate]);

  useEffect(() => {
    if (isAuthenticated && taskLists.length === 0) {
      fetchTaskLists().catch((err) => {
        console.error('Failed to fetch task lists:', err);
        addToast('error', 'Loading Failed', 'Failed to load task lists. Please refresh the page.');
      });
    }
  }, [isAuthenticated, taskLists.length, fetchTaskLists]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      addToast('error', 'Error', error);
      clearError();
    }
  }, [error, clearError]);

  // Setup header when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Tasks"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  // Task handlers
  const handleTaskClick = useCallback((task: GoogleTask) => {
    // Find which task list this task belongs to
    const taskListId = Object.keys(allTasks).find(listId => 
      allTasks[listId].some(t => t.id === task.id)
    );
    setSelectedTask(task);
    setSelectedTaskListId(taskListId || '');
    setIsCreating(false);
    setIsModalOpen(true);
  }, [allTasks]);

  const handleCreateTask = useCallback((taskListId: string) => {
    setSelectedTaskListId(taskListId);
    setSelectedTask(null);
    setIsCreating(true);
    setIsModalOpen(true);
  }, []);

  const handleToggleCompletion = useCallback(async (taskListId: string, taskId: string, completed: boolean) => {
    try {
      await toggleTaskComplete(taskListId, taskId, completed);
      addToast('success', 'Task Updated', `Task marked as ${completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      addToast('error', 'Update Failed', 'Failed to update task. Please try again.');
    }
  }, [toggleTaskComplete]);

  const handleDeleteTask = useCallback(async (taskListId: string, taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskListId, taskId);
        addToast('success', 'Task Deleted', 'Task deleted successfully');
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to delete task:', error);
        addToast('error', 'Delete Failed', 'Failed to delete task. Please try again.');
      }
    }
  }, [deleteTask]);

  const handleModalSubmit = useCallback(async (taskListId: string, data: { title: string; notes?: string; due?: string }) => {
    try {
      if (isCreating) {
        await createTask(taskListId, data);
        addToast('success', 'Task Created', 'Task created successfully');
      } else if (selectedTask) {
        await updateTask(taskListId, selectedTask.id, data);
        addToast('success', 'Task Updated', 'Task updated successfully');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      addToast('error', 'Save Failed', 'Failed to save task. Please try again.');
    }
  }, [isCreating, selectedTask, createTask, updateTask]);

  const handleModalDelete = useCallback(async () => {
    if (selectedTask && selectedTaskListId) {
      await handleDeleteTask(selectedTaskListId, selectedTask.id);
    }
  }, [selectedTask, selectedTaskListId, handleDeleteTask]);

  // Check centralized Google authentication
  if (!activeGoogleAccount || !activeGoogleAccount.services?.tasks) {
    return (
      <div className="flex h-full items-center justify-center bg-content p-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-primary">
            No Google Account Connected
          </h2>
          <p className="mb-4 text-secondary">
            Please connect a Google account in Settings to access your Google Tasks
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/settings')}
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isLoading) {
    return (
      <div className="size-full p-6">
        <Card className="mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-32 animate-pulse rounded bg-tertiary"></div>
            </div>
                          <div className="h-8 w-24 animate-pulse rounded bg-tertiary"></div>
          </div>
        </Card>
        
        <FlexibleGrid 
          minItemWidth={320} 
          gap={6} 
          className="w-full"
        >
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="h-64 animate-pulse rounded bg-tertiary"
            ></div>
          ))}
        </FlexibleGrid>
      </div>
    );
  }

  return (
    <div className="size-full p-6">
      {/* Toast Container */}
      <div className="fixed right-8 top-20 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            variant={toast.variant} 
            title={toast.title} 
            message={toast.message} 
            onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
          />
        ))}
      </div>

      {/* Header Controls */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={20} className="text-primary" />
              <span className="font-semibold">Google Tasks</span>
            </div>
            {(isLoading || isRefreshing) && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span>{isRefreshing ? 'Refreshing...' : 'Loading...'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {taskLists.length > 0 && (
              <Button 
                variant="primary" 
                onClick={() => handleCreateTask(taskLists[0].id)} 
                className="flex items-center gap-2"
              >
                <Plus size={16} /> New Task
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="border-border-default space-y-3 border-t p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="border-border-default flex items-center gap-3 border-t pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'title' | 'due' | 'status' | 'created')}
                  className="border-border-default rounded border bg-card px-2 py-1 text-sm text-primary"
                >
                  <option value="created">Date created</option>
                  <option value="title">Title</option>
                  <option value="due">Due date</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content */}
      <div className="w-full">
        <FlexibleGrid 
          minItemWidth={320} 
          gap={6}
          className="w-full"
        >
          {taskLists.map(taskList => (
            <div key={taskList.id} className="min-w-0 flex-1">
              <TaskListColumn
                taskList={taskList}
                tasks={groupedFilteredTasks[taskList.id] || []}
                isLoading={isLoadingTasks[taskList.id] || false}
                onTaskClick={handleTaskClick}
                onToggleCompletion={handleToggleCompletion}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
              />
            </div>
          ))}
        </FlexibleGrid>
      </div>

      {/* Task Modal */}
      <SimpleTaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        taskListId={selectedTaskListId}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={selectedTask ? handleModalDelete : undefined}
      />

      {taskLists.length === 0 && isAuthenticated && !isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div 
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-card"
            >
              <ListIcon size={24} className="text-muted" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-primary">No task lists found</h3>
            <p className="mb-6 text-muted">Your Google Task lists will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
} 
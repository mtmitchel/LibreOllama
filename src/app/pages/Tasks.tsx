import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Toast, FlexibleGrid } from '../../components/ui';
import { Plus, LayoutGrid, List as ListIcon, Calendar, CheckSquare } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
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
    <div className="bg-card rounded-lg border border-border-default hover:border-border-hover transition-all duration-200 hover:shadow-md">
      <div className="p-4 cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-primary truncate">{task.title}</h4>
            {task.notes && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{task.notes}</p>
            )}
            {task.due && (
              <p className="text-xs text-warning mt-1">Due: {new Date(task.due).toLocaleDateString()}</p>
            )}
            {task.status === 'completed' && task.completed && (
              <p className="text-xs text-success mt-1">Completed: {new Date(task.completed).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleClick}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                task.status === 'completed' 
                  ? 'bg-success border-success text-success-ghost' 
                  : 'border-border-default hover:border-success'
              }`}
              title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.status === 'completed' && '✓'}
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-error hover:text-error-hover p-1"
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
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="font-semibold text-primary">{taskList.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{tasks.length}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCreateTask}
            className="h-6 w-6 p-0"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-3 min-h-40">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                <div className="w-12 h-12 rounded-full bg-secondary-ghost flex items-center justify-center mb-3">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-primary">
                {task ? 'Edit Task' : 'Create Task'}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  placeholder="Task title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  placeholder="Task description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due}
                  onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-border-default">
              <div>
                {task && onDelete && (
                  <Button type="button" variant="outline" onClick={onDelete} className="text-error border-error">
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
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    clearError,
    authenticate,
    isAuthenticated,
    isHydrated,
  } = useGoogleTasksStore();

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
      authenticate(activeGoogleAccount);
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
      <div className="flex h-full bg-[var(--bg-primary)] items-center justify-center p-6 lg:p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Google Account Connected
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
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
      <div className="w-full h-full p-6 lg:p-8">
        <Card className="mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="h-8 bg-[var(--bg-secondary)] rounded animate-pulse w-32"></div>
            </div>
            <div className="h-8 bg-[var(--bg-secondary)] rounded animate-pulse w-24"></div>
          </div>
        </Card>
        
        <FlexibleGrid minItemWidth={320} gap={6} className="w-full">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-[var(--bg-secondary)] rounded animate-pulse"></div>
          ))}
        </FlexibleGrid>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-20 right-8 z-50 space-y-2">
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
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
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
      </Card>

      {/* Main Content */}
      <div className="w-full">
        <FlexibleGrid minItemWidth={320} gap={6} className="w-full">
          {taskLists.map(taskList => (
            <div key={taskList.id} className="flex-1 min-w-0">
              <TaskListColumn
                taskList={taskList}
                tasks={allTasks[taskList.id] || []}
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
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <ListIcon size={24} className="text-muted" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No task lists found</h3>
            <p className="text-muted mb-6">Your Google Task lists will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
} 
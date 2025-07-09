import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Toast, FlexibleGrid } from '../../components/ui';
import { Plus, LayoutGrid, List as ListIcon, Calendar, Repeat } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useShallow } from 'zustand/shallow';

// Import our simplified store
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { KanbanTask, TaskMetadata } from '../../stores/useKanbanStore';

// Draggable TaskCard component
const TaskCard = React.memo(({ task, onTaskClick, onToggleCompletion, onDeleteTask }: {
  task: KanbanTask;
  onTaskClick: (task: KanbanTask) => void;
  onToggleCompletion: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open modal if clicking on buttons or drag handle
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-drag-handle]')) {
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
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border border-border-default hover:border-border-hover transition-all duration-200 hover:shadow-md relative ${
        isDragging ? 'shadow-xl border-primary z-50 rotate-3' : ''
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        data-drag-handle
        className="absolute left-2 top-2 p-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-60 transition-opacity"
        title="Drag to move task"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="3" r="1"/>
          <circle cx="9" cy="3" r="1"/>
          <circle cx="3" cy="6" r="1"/>
          <circle cx="9" cy="6" r="1"/>
          <circle cx="3" cy="9" r="1"/>
          <circle cx="9" cy="9" r="1"/>
        </svg>
      </div>

      {/* Clickable Content Area */}
      <div 
        className="p-4 pl-8 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-primary truncate">{task.title}</h4>
            {task.notes && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{task.notes}</p>
            )}
            {task.due && (
              <p className="text-xs text-warning mt-1">Due: {new Date(task.due + 'T00:00:00').toLocaleDateString()}</p>
            )}
            {task.metadata && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.metadata.priority !== 'normal' && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.metadata.priority === 'urgent' ? 'bg-error-ghost text-error' :
                      task.metadata.priority === 'high' ? 'bg-warning-ghost text-warning' :
                      'bg-info-ghost text-info'
                    }`}>
                      {task.metadata.priority}
                    </span>
                  )}
                  {task.metadata.labels.slice(0, 3).map(label => (
                    <span key={label} className="text-xs px-2 py-1 bg-secondary-ghost text-secondary rounded">
                      {label}
                    </span>
                  ))}
                  {task.metadata.labels.length > 3 && (
                    <span className="text-xs text-muted">+{task.metadata.labels.length - 3}</span>
                  )}
                  {task.metadata.recurring?.enabled && (
                    <span className="text-xs px-2 py-1 bg-info-ghost text-info rounded flex items-center gap-1">
                      <Repeat size={10} />
                      {task.metadata.recurring.frequency}
                    </span>
                  )}
                </div>
                {task.metadata.subtasks && task.metadata.subtasks.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <ListIcon size={12} />
                    <span>
                      {task.metadata.subtasks.filter(st => st.completed).length}/{task.metadata.subtasks.length} subtasks
                    </span>
                    {task.metadata.subtasks.some(st => !st.completed && st.due && new Date(st.due) < new Date()) && (
                      <span className="text-warning ml-1">• overdue</span>
                    )}
                  </div>
                )}
              </div>
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

const TaskColumn = React.memo(({ column, onTaskClick, onToggleCompletion, onDeleteTask, onCreateTask }: {
  column: { id: string; title: string; tasks: KanbanTask[]; isLoading: boolean; error?: string };
  onTaskClick: (task: KanbanTask) => void;
  onToggleCompletion: (columnId: string, taskId: string, completed: boolean) => void;
  onDeleteTask: (columnId: string, taskId: string) => void;
  onCreateTask: (columnId: string) => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleCreateTask = useCallback(() => {
    onCreateTask(column.id);
  }, [onCreateTask, column.id]);

  const handleTaskClick = useCallback((task: KanbanTask) => {
    onTaskClick(task);
  }, [onTaskClick]);

  const handleToggleCompletion = useCallback((taskId: string, completed: boolean) => {
    onToggleCompletion(column.id, taskId, completed);
  }, [onToggleCompletion, column.id]);

  const handleDeleteTask = useCallback((taskId: string) => {
    onDeleteTask(column.id, taskId);
  }, [onDeleteTask, column.id]);

  return (
    <Card className="h-fit">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="font-semibold text-primary">{column.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{column.tasks.length}</span>
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
      <div 
        ref={setNodeRef}
        className={`p-4 space-y-3 min-h-40 transition-all duration-200 ${
          isOver ? 'bg-accent-ghost border-2 border-dashed border-accent-primary' : 'border-2 border-transparent'
        }`}
      >
        {column.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : column.error ? (
          <div className="text-error text-sm text-center py-4">{column.error}</div>
        ) : (
          column.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskClick={handleTaskClick}
              onToggleCompletion={(taskId, completed) => handleToggleCompletion(taskId, completed)}
              onDeleteTask={(taskId) => handleDeleteTask(taskId)}
            />
          ))
        )}
        {column.tasks.length === 0 && !column.isLoading && !column.error && (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <div className="w-12 h-12 rounded-full bg-secondary-ghost flex items-center justify-center mb-3">
              <Plus size={24} className="text-secondary" />
            </div>
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs">Drag tasks here or click + to create</p>
          </div>
        )}
      </div>
    </Card>
  );
});

const SimpleTaskModal = ({ isOpen, task, onClose, onSubmit, onDelete }: {
  isOpen: boolean;
  task?: KanbanTask | null;
  onClose: () => void;
  onSubmit: (data: { title: string; notes?: string; due?: string; metadata?: TaskMetadata }) => void;
  onDelete?: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
    priority: 'normal' as TaskMetadata['priority'],
    labels: [] as string[],
    subtasks: [] as Array<{ id: string; title: string; completed: boolean; due?: string }>,
    recurringEnabled: false,
    recurringFrequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringInterval: 1,
    recurringEndDate: '',
  });

  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        notes: task.notes || '',
        due: task.due || '',
        priority: task.metadata?.priority || 'normal',
        labels: task.metadata?.labels || [],
        subtasks: task.metadata?.subtasks || [],
        recurringEnabled: task.metadata?.recurring?.enabled || false,
        recurringFrequency: task.metadata?.recurring?.frequency || 'daily',
        recurringInterval: task.metadata?.recurring?.interval || 1,
        recurringEndDate: task.metadata?.recurring?.endDate || '',
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        due: '',
        priority: 'normal',
        labels: [],
        subtasks: [],
        recurringEnabled: false,
        recurringFrequency: 'daily',
        recurringInterval: 1,
        recurringEndDate: '',
      });
    }
  }, [task, isOpen]);

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, {
          id: `subtask-${Date.now()}`,
          title: newSubtask.trim(),
          completed: false,
        }]
      }));
      setNewSubtask('');
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const removeSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      notes: formData.notes,
      due: formData.due ? formData.due : undefined,
      metadata: {
        priority: formData.priority,
        labels: formData.labels,
        subtasks: formData.subtasks,
        recurring: formData.recurringEnabled ? {
          enabled: true,
          frequency: formData.recurringFrequency,
          interval: formData.recurringInterval,
          endDate: formData.recurringEndDate ? formData.recurringEndDate : undefined,
        } : undefined,
      },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskMetadata['priority'] }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Labels Section */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Labels</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    className="flex-1 p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                    placeholder="Add a label..."
                  />
                  <Button type="button" onClick={addLabel} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.labels.map(label => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-ghost text-secondary rounded text-xs"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="hover:text-error ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Subtasks</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    className="flex-1 p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                    placeholder="Add a subtask..."
                  />
                  <Button type="button" onClick={addSubtask} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.subtasks.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 border border-border-default rounded bg-secondary-ghost"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            subtask.completed 
                              ? 'bg-success border-success text-success-ghost' 
                              : 'border-border-default hover:border-success'
                          }`}
                        >
                          {subtask.completed && '✓'}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted' : 'text-primary'}`}>
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-error hover:text-error-hover p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Section */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Recurring</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={formData.recurringEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringEnabled: e.target.checked }))}
                    className="w-4 h-4 border border-border-default rounded"
                  />
                  <label htmlFor="recurring-enabled" className="text-sm text-primary">
                    Make this task recurring
                  </label>
                </div>
                
                {formData.recurringEnabled && (
                  <div className="pl-6 space-y-3 border-l-2 border-secondary-ghost">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Frequency</label>
                        <select
                          value={formData.recurringFrequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringFrequency: e.target.value as any }))}
                          className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Interval</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.recurringInterval}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringInterval: parseInt(e.target.value) || 1 }))}
                          className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.recurringEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                        className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                      />
                    </div>
                    <p className="text-xs text-info">
                      Repeats every {formData.recurringInterval} {formData.recurringFrequency.replace('ly', '')}
                      {formData.recurringInterval > 1 ? 's' : ''}
                      {formData.recurringEndDate && ` until ${new Date(formData.recurringEndDate + 'T00:00:00').toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>
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
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    variant: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>>([]);

  // Use the simplified kanban store
  const {
    columns,
    isSyncing,
    isInitialized,
    error,
    initialize,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleComplete,
    getTask,
    clearError,
  } = useKanbanStore();

  const addToast = (variant: 'success' | 'error' | 'warning', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, variant, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Drag and drop state
  const [dragState, setDragState] = useState<{
    activeTask: KanbanTask | null;
    sourceColumnId: string | null;
  }>({
    activeTask: null,
    sourceColumnId: null,
  });

  // Initialize the store
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        console.error('Failed to initialize kanban store:', err);
        addToast('error', 'Initialization Failed', 'Failed to load task data. Please refresh the page.');
      });
    }
  }, [isInitialized, initialize]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      addToast('error', 'Error', error);
      clearError();
    }
  }, [error, clearError]);

  // Task handlers
  const handleTaskClick = useCallback((task: KanbanTask) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsModalOpen(true);
  }, []);

  const handleCreateTask = useCallback((columnId: string) => {
    setSelectedColumnId(columnId);
    setSelectedTask(null);
    setIsCreating(true);
    setIsModalOpen(true);
  }, []);

  const handleToggleCompletion = useCallback(async (columnId: string, taskId: string, completed: boolean) => {
    try {
      await toggleComplete(columnId, taskId, completed);
      addToast('success', 'Task Updated', `Task marked as ${completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      addToast('error', 'Update Failed', 'Failed to update task. Please try again.');
    }
  }, [toggleComplete]);

  const handleDeleteTask = useCallback(async (columnId: string, taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(columnId, taskId);
        addToast('success', 'Task Deleted', 'Task deleted successfully');
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to delete task:', error);
        addToast('error', 'Delete Failed', 'Failed to delete task. Please try again.');
      }
    }
  }, [deleteTask]);

  const handleModalSubmit = useCallback(async (data: { title: string; notes?: string; due?: string; metadata?: TaskMetadata }) => {
    try {
      if (isCreating) {
        await createTask(selectedColumnId, data);
        addToast('success', 'Task Created', 'Task created successfully');
      } else if (selectedTask) {
        const taskData = getTask(selectedTask.id);
        if (taskData) {
          await updateTask(taskData.columnId, selectedTask.id, {
            title: data.title,
            notes: data.notes,
            due: data.due,
            metadata: data.metadata,
          });
          addToast('success', 'Task Updated', 'Task updated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      addToast('error', 'Save Failed', 'Failed to save task. Please try again.');
    }
  }, [isCreating, selectedColumnId, selectedTask, createTask, updateTask, getTask]);

  const handleModalDelete = useCallback(async () => {
    if (selectedTask) {
      const taskData = getTask(selectedTask.id);
      if (taskData) {
        await handleDeleteTask(taskData.columnId, selectedTask.id);
      }
    }
  }, [selectedTask, getTask, handleDeleteTask]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const taskData = getTask(taskId);
    if (taskData) {
      setDragState({
        activeTask: taskData.task,
        sourceColumnId: taskData.columnId,
      });
    }
  }, [getTask]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over logic if needed
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDragState({ activeTask: null, sourceColumnId: null });

    if (!over || !dragState.sourceColumnId || !dragState.activeTask) return;

    const targetColumnId = over.id as string;
    const taskId = active.id as string;

    if (dragState.sourceColumnId !== targetColumnId) {
      try {
        await moveTask(taskId, dragState.sourceColumnId, targetColumnId);
        addToast('success', 'Task Moved', 'Task moved successfully');
      } catch (error) {
        console.error('Failed to move task:', error);
        addToast('error', 'Move Failed', 'Failed to move task. Please try again.');
      }
    }
  }, [dragState, moveTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5, delay: 0, tolerance: 3 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!isInitialized && columns.length === 0) {
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

      {/* View Toggle Controls */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-1">
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('kanban')} 
                className="flex items-center gap-2"
              >
                <LayoutGrid size={16} /> Board
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className="flex items-center gap-2"
              >
                <ListIcon size={16} /> List
              </Button>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          {columns.length > 0 && (
            <Button 
              variant="primary" 
              onClick={() => handleCreateTask(columns[0].id)} 
              className="flex items-center gap-2"
            >
              <Plus size={16} /> New Task
            </Button>
          )}
        </div>
      </Card>

      {/* Main Content */}
      {viewMode === 'kanban' && (
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragOver={handleDragOver} 
          onDragEnd={handleDragEnd} 
          collisionDetection={closestCorners}
        >
          <div className="w-full">
            <FlexibleGrid minItemWidth={320} gap={6} className="w-full">
              {columns.map(column => (
                <div key={column.id} className="flex-1 min-w-0">
                  <TaskColumn
                    column={column}
                    onTaskClick={handleTaskClick}
                    onToggleCompletion={handleToggleCompletion}
                    onDeleteTask={handleDeleteTask}
                    onCreateTask={handleCreateTask}
                  />
                </div>
              ))}
            </FlexibleGrid>
          </div>
          <DragOverlay 
            dropAnimation={{ 
              duration: 300, 
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' 
            }}
            className="cursor-grabbing"
          >
            {dragState.activeTask ? (
              <div className="p-4 bg-card rounded-lg border-2 border-primary shadow-2xl transform rotate-3 opacity-90">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h4 className="font-medium text-primary">{dragState.activeTask.title}</h4>
                </div>
                {dragState.activeTask.metadata?.priority !== 'normal' && (
                  <span className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
                    dragState.activeTask.metadata?.priority === 'urgent' ? 'bg-error-ghost text-error' :
                    dragState.activeTask.metadata?.priority === 'high' ? 'bg-warning-ghost text-warning' :
                    'bg-info-ghost text-info'
                  }`}>
                    {dragState.activeTask.metadata?.priority}
                  </span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      
      {viewMode === 'list' && (
        <Card className="w-full max-w-none">
          <div className="p-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-primary">
              All Tasks ({columns.reduce((sum, col) => sum + col.tasks.length, 0)})
            </h2>
          </div>
          <div className="divide-y divide-border-default">
            {columns.flatMap(column => 
              column.tasks.map(task => (
                <div key={`${column.id}-${task.id}`} className="p-4">
                  <TaskCard
                    task={task}
                    onTaskClick={handleTaskClick}
                    onToggleCompletion={(taskId, completed) => handleToggleCompletion(column.id, taskId, completed)}
                    onDeleteTask={(taskId) => handleDeleteTask(column.id, taskId)}
                  />
                </div>
              ))
            )}
          </div>
          {columns.every(col => col.tasks.length === 0) && (
            <div className="text-center p-6 text-muted">
              No tasks found. 
              <Button 
                variant="ghost" 
                onClick={() => columns.length > 0 && handleCreateTask(columns[0].id)} 
                className="text-primary hover:text-primary-hover ml-1"
              >
                Create one now!
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Task Modal */}
      <SimpleTaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={selectedTask ? handleModalDelete : undefined}
      />

      {columns.length === 0 && isInitialized && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <ListIcon size={24} className="text-muted" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No task lists found</h3>
            <p className="text-muted mb-6">Your task lists will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
} 
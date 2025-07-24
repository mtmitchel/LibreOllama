import React, { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useKanbanStore, KanbanTask } from '../../stores/useKanbanStore';
import { EditTaskModal } from './EditTaskModal';
import { Button, ContextMenu, ConfirmDialog } from '../ui';
import { Calendar, CheckSquare, Square, MoreHorizontal, User, Tag, Edit2, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanTaskCardProps {
  task: KanbanTask;
  columnId: string;
  isDragging?: boolean;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  task,
  columnId,
  isDragging = false,
}) => {
  const { updateTask, deleteTask, toggleComplete } = useKanbanStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Set up draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isDraggingFromHook,
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId,
    },
  });

  const isBeingDragged = isDragging || isDraggingFromHook;

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleComplete(columnId, task.id, task.status !== 'completed');
    } catch (error) {
      // Failed to toggle task completion
    }
  }, [toggleComplete, columnId, task.id, task.status]);

  // Handle task update
  const handleUpdateTask = useCallback(async (updates: {
    title: string;
    notes?: string;
    due?: string;
  }) => {
    try {
      await updateTask(columnId, task.id, updates);
      setIsEditModalOpen(false);
    } catch (error) {
      // Failed to update task
    }
  }, [updateTask, columnId, task.id]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async () => {
    setShowDeleteConfirm(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    try {
      await deleteTask(columnId, task.id);
      setIsEditModalOpen(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Failed to delete task
    }
  }, [deleteTask, columnId, task.id]);

  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsEditModalOpen(true);
  }, []);

  const isCompleted = task.status === 'completed';
  const isOverdue = task.due && new Date(task.due) < new Date() && !isCompleted;

  return (
    <>
      <ContextMenu
        items={[
          {
            label: 'Edit task',
            icon: <Edit2 size={14} />,
            onClick: () => setIsEditModalOpen(true)
          },
          {
            label: isCompleted ? 'Mark as incomplete' : 'Mark as complete',
            icon: <CheckCircle2 size={14} />,
            onClick: () => toggleComplete(columnId, task.id, !isCompleted)
          },
          {
            label: 'Duplicate task',
            icon: <Copy size={14} />,
            onClick: async () => {
              const { createTask } = useKanbanStore.getState();
              await createTask(columnId, {
                title: `${task.title} (copy)`,
                notes: task.notes,
                due: task.due,
                metadata: task.metadata
              });
            }
          },
          { separator: true },
          {
            label: 'Delete task',
            icon: <Trash2 size={14} />,
            onClick: handleDeleteTask,
            destructive: true
          }
        ]}
      >
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={`
            group relative bg-card border border-border-default rounded-lg p-3 cursor-pointer
            transition-all duration-200 hover:shadow-md hover:border-border-hover
            ${isBeingDragged ? 'opacity-50 rotate-2 scale-105' : ''}
            ${isCompleted ? 'opacity-75' : ''}
            ${isOverdue ? 'border-l-4 border-l-error' : ''}
          `}
          onClick={handleCardClick}
        >
        {/* Task Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Completion Checkbox */}
            <button
              onClick={handleToggleComplete}
              className={`
                flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center
                transition-colors duration-200
                ${isCompleted 
                  ? 'bg-success border-success text-white' 
                  : 'border-border-default hover:border-success'
                }
              `}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isCompleted && <CheckSquare size={12} />}
            </button>

            {/* Task Title */}
            <h4 className={`
              font-medium text-sm leading-tight flex-1 min-w-0
              ${isCompleted ? 'line-through text-muted' : 'text-primary'}
            `}>
              {task.title}
            </h4>
          </div>

          {/* More Options */}
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
            title="Edit task"
          >
            <MoreHorizontal size={12} />
          </Button>
        </div>

        {/* Task Notes */}
        {task.notes && (
          <p className="text-xs text-muted line-clamp-2 mb-2">
            {task.notes}
          </p>
        )}

        {/* Task Metadata */}
        <div className="space-y-2">
          {/* Due Date and Priority Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {/* Due Date */}
              {task.due && (
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full
                  ${isOverdue ? 'bg-error-ghost text-error' : 'bg-tertiary text-secondary'}
                `}>
                  <Calendar size={10} />
                  <span>{format(new Date(task.due), 'MMM d')}</span>
                </div>
              )}

              {/* Recurring Indicator */}
              {task.metadata?.recurring?.enabled && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent-soft text-accent-primary">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  <span className="capitalize">{task.metadata.recurring.frequency}</span>
                </div>
              )}

              {/* Priority Indicator */}
              {task.metadata?.priority && task.metadata.priority !== 'normal' && (
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${task.metadata.priority === 'high' ? 'bg-warning-ghost text-warning' : ''}
                  ${task.metadata.priority === 'urgent' ? 'bg-error-ghost text-error' : ''}
                  ${task.metadata.priority === 'low' ? 'bg-tertiary text-muted' : ''}
                `}>
                  {task.metadata.priority}
                </div>
              )}
            </div>
          </div>

          {/* Labels/Tags */}
          {task.metadata?.labels && task.metadata.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.metadata.labels.slice(0, 3).map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent-primary"
                >
                  {label}
                </span>
              ))}
              {task.metadata.labels.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tertiary text-muted">
                  +{task.metadata.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtasks Progress */}
        {task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border-default">
            <div className="flex items-center gap-2 text-xs text-muted">
              <CheckSquare size={10} />
              <span>
                {task.metadata.subtasks.filter(st => st.completed).length}/
                {task.metadata.subtasks.length} subtasks
              </span>
            </div>
          </div>
        )}

        </div>
      </ContextMenu>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        task={task}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
};
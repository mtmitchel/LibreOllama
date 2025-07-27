import React, { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';

type KanbanTask = UnifiedTask;
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
  const { updateTask, deleteTask } = useUnifiedTaskStore();
  
  const toggleComplete = async (columnId: string, taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'completed' : 'needsAction' });
  };
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
      await updateTask(task.id, updates);
      setIsEditModalOpen(false);
    } catch (error) {
      // Failed to update task
    }
  }, [updateTask, task.id]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async () => {
    setShowDeleteConfirm(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    try {
      await deleteTask(task.id);
      setIsEditModalOpen(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Failed to delete task
    }
  }, [deleteTask, task.id]);

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
              const { createTask } = useUnifiedTaskStore.getState();
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
            border-border-default hover:shadow-primary/5 hover:border-border-hover group relative cursor-pointer rounded-lg border
            bg-card p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
            ${isBeingDragged ? 'rotate-2 scale-105 opacity-50 shadow-xl' : ''}
            ${isCompleted ? 'bg-tertiary/30 opacity-75' : ''}
            ${isOverdue ? 'shadow-error/5 border-l-4 border-l-error' : ''}
          `}
          onClick={handleCardClick}
        >
        {/* Task Header */}
        <div className="mb-2.5 flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            {/* Completion Checkbox */}
            <button
              onClick={handleToggleComplete}
              className={`
                mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all
                duration-200
                ${isCompleted 
                  ? 'scale-110 border-success bg-success text-white' 
                  : 'border-border-default hover:bg-success/5 hover:border-success'
                }
              `}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isCompleted && <CheckSquare size={12} />}
            </button>

            {/* Task Title */}
            <h4 className={`
              min-w-0 flex-1 text-sm font-medium leading-snug
              ${isCompleted ? 'text-muted line-through' : 'text-primary'}
            `}>
              {task.title}
            </h4>
          </div>

          {/* More Options */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 opacity-0 hover:bg-tertiary group-hover:opacity-100"
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
          <p className="pl-6.5 mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {task.notes}
          </p>
        )}

        {/* Task Metadata */}
        <div className="pl-6.5 space-y-2">
          {/* Due Date and Priority Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Due Date */}
            {task.due && (
              <div className={`
                flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-medium
                ${isOverdue 
                  ? 'border-error/20 border bg-error-ghost text-error' 
                  : 'bg-tertiary text-secondary'
                }
              `}>
                <Calendar size={10} />
                <span>{format(new Date(task.due), 'MMM d')}</span>
              </div>
            )}

            {/* Priority Indicator */}
            {task.metadata?.priority && task.metadata.priority !== 'normal' && (
              <div className={`
                rounded-full border px-2.5 py-1.5 text-xs font-medium
                ${task.metadata.priority === 'high' ? 'border-warning/20 bg-warning-ghost text-warning' : ''}
                ${task.metadata.priority === 'urgent' ? 'border-error/20 bg-error-ghost text-error' : ''}
                ${task.metadata.priority === 'low' ? 'border-border-default bg-tertiary text-muted' : ''}
              `}>
                {task.metadata.priority}
              </div>
            )}

            {/* Recurring Indicator */}
            {task.metadata?.recurring?.enabled && (
              <div className="border-accent/20 flex items-center gap-1.5 rounded-full border bg-accent-soft px-2.5 py-1.5 font-medium text-accent-primary">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                <span className="capitalize">{task.metadata.recurring.frequency}</span>
              </div>
            )}
          </div>

          {/* Labels/Tags */}
          {task.metadata?.labels && task.metadata.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.metadata.labels.slice(0, 3).map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-primary"
                >
                  {label}
                </span>
              ))}
              {task.metadata.labels.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-tertiary px-2 py-0.5 text-xs font-medium text-muted">
                  +{task.metadata.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtasks Progress */}
        {task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
          <div className="border-border-default mt-2 border-t pt-2">
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
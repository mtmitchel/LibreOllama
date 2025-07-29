import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button, ContextMenu } from '../ui';
import { Calendar, CheckSquare, MoreHorizontal, Flag, Tag, RotateCcw, Edit3, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';

// Helper to parse Google Tasks date (midnight UTC) for display
const parseTaskDate = (dateStr: string): Date => {
  // Google Tasks stores dates as YYYY-MM-DDT00:00:00.000Z
  // We parse just the date part to avoid timezone shifts
  const datePart = dateStr.split('T')[0];
  // Create date at noon to avoid any timezone edge cases
  return new Date(datePart + 'T12:00:00');
};

interface UnifiedTaskCardProps {
  task: UnifiedTask;
  columnId: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  variant?: 'default' | 'compact';
  showMetadata?: boolean;
}

export const UnifiedTaskCard: React.FC<UnifiedTaskCardProps> = ({
  task,
  columnId,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  variant = 'default',
  showMetadata = true,
}) => {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isCompleted = task.status === 'completed';
  const isOverdue = task.due && parseTaskDate(task.due) < new Date() && !isCompleted;
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsMenu]);
  
  // Priority colors
  const priorityColors = {
    urgent: { bg: 'bg-error-ghost', border: 'border-error/20', text: 'text-error' },
    high: { bg: 'bg-warning-ghost', border: 'border-warning/20', text: 'text-warning' },
    normal: { bg: '', border: '', text: '' },
    low: { bg: 'bg-tertiary', border: 'border-border-default', text: 'text-muted' }
  };

  const priority = task.priority || 'normal';
  const priorityStyle = priorityColors[priority as keyof typeof priorityColors] || priorityColors.normal;
  
  // Context menu items
  const contextMenuItems = [
    {
      label: 'Edit',
      icon: <Edit3 size={14} />,
      onClick: onEdit
    },
    {
      label: 'Duplicate',
      icon: <Copy size={14} />,
      onClick: onDuplicate
    },
    { separator: true },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: onDelete,
      destructive: true
    }
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <ContextMenu items={contextMenuItems}>
        <div
          className={`
          border-border-default hover:shadow-primary/5 hover:border-border-hover group relative cursor-pointer rounded-lg border
          bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
          ${isCompleted ? 'bg-tertiary/30 opacity-75' : ''}
          ${isOverdue ? 'shadow-error/5 border-l-4 border-l-error' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${variant === 'compact' ? 'p-2.5' : 'p-3.5'}
        `}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractive = target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button');
          if (!isInteractive) {
            onEdit();
          }
        }}
      >
      {/* Task Header */}
      <div className={`flex items-start justify-between gap-2.5 ${variant === 'compact' ? 'mb-2' : 'mb-2.5'}`}>
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {/* Completion Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
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
            min-w-0 flex-1 font-medium leading-snug
            ${isCompleted ? 'text-muted line-through' : 'text-primary'}
            ${variant === 'compact' ? 'text-sm truncate' : 'text-sm'}
          `}>
            {task.title}
          </h4>
        </div>

        {/* More Options */}
        <div className="relative" ref={optionsMenuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 opacity-0 hover:bg-tertiary group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptionsMenu(!showOptionsMenu);
            }}
            title="Task options"
          >
            <MoreHorizontal size={12} />
          </Button>
          
          {showOptionsMenu && (
            <div className="absolute right-0 top-full z-[9999] mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(false);
                  onEdit();
                }}
                className="flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50"
              >
                <Edit3 size={14} className="mr-2" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(false);
                  onDuplicate();
                }}
                className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Copy size={14} className="mr-2" />
                Duplicate
              </button>
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(false);
                  onDelete();
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 last:rounded-b-lg hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Notes - Filter out URLs */}
      {task.notes && variant !== 'compact' && !task.notes.startsWith('http') && (
        <p className="pl-6.5 mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted">
          {task.notes}
        </p>
      )}

      {/* Task Metadata */}
      {showMetadata && (
        <div className="pl-6.5 space-y-2">
          {/* Due Date, Priority, and Recurring Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Due Date */}
            {task.due && (
              <div className={`
                flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium
                ${isOverdue 
                  ? 'border-error/20 border bg-error-ghost text-error' 
                  : 'bg-tertiary text-secondary'
                }
              `}>
                <Calendar size={10} />
                <span>{format(parseTaskDate(task.due), 'MMM d')}</span>
              </div>
            )}

            {/* Priority Indicator */}
            {priority !== 'normal' && (
              <div className={`
                flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium
                ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}
              `}>
                <Flag size={10} />
                <span className="capitalize">{priority}</span>
              </div>
            )}

            {/* Recurring Indicator - if task has recurring pattern in notes */}
            {task.notes?.toLowerCase().includes('recurring') && (
              <div className="border-accent/20 flex items-center gap-1.5 rounded-full border bg-accent-soft px-2.5 py-1 font-medium text-accent-primary">
                <RotateCcw size={10} />
                <span>Recurring</span>
              </div>
            )}
          </div>

          {/* Labels/Tags */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-primary"
                >
                  <Tag size={8} />
                  {label}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-tertiary px-2 py-0.5 text-xs font-medium text-muted">
                  +{task.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Subtasks Progress */}
          {task.attachments && task.attachments.filter(a => a.type === 'subtask').length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <CheckSquare size={10} />
              <span>
                {task.attachments.filter(a => a.type === 'subtask' && a.url === 'completed').length}/
                {task.attachments.filter(a => a.type === 'subtask').length} subtasks
              </span>
            </div>
          )}
        </div>
      )}
        </div>
      </ContextMenu>
    </div>
  );
};

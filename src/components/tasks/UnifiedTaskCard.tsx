import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ContextMenu } from '../ui';
import { Calendar, CheckSquare, Flag, Tag, RotateCcw, Edit3, Copy, Trash2, User, RefreshCw } from 'lucide-react';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { parseGoogleTaskDate, formatTaskDate } from '../../utils/dateUtils';
import '../../styles/asana-design-system.css';

interface UnifiedTaskCardProps {
  task: UnifiedTask;
  columnId: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  variant?: 'default' | 'compact';
  showMetadata?: boolean;
  isSelected?: boolean;
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
  isSelected = false,
}) => {
  
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
  // Use date_date_only if available to prevent timezone issues
  const dueDateString = task.due_date_only || task.due;
  const isOverdue = dueDateString && parseGoogleTaskDate(dueDateString) < new Date() && !isCompleted;
  
  const priority = task.priority || 'none';
  
  // Context menu items
  const contextMenuItems = [
    {
      label: isCompleted ? 'Mark incomplete' : 'Mark completed',
      icon: <CheckSquare size={14} />,
      onClick: onToggle
    },
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
          asana-card group relative
          ${isCompleted ? 'opacity-60' : ''}
          ${isDragging ? 'asana-card dragging' : ''}
        `}
        style={{
          marginBottom: '8px',
          minHeight: variant === 'compact' ? '36px' : '44px',
          outline: isSelected ? '2px solid #4573D2' : 'none',
          outlineOffset: '2px'
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractive = target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button');
          if (!isInteractive) {
            onEdit();
          }
        }}
      >
      {/* Task Content */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          {/* Completion Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`asana-checkbox ${isCompleted ? 'checked' : ''}`}
            style={{ marginTop: '1px' }}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 4.5L6 12L2.5 8.5" stroke={isCompleted ? "white" : "#D4D6DA"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Task Title */}
          <h4 className={`asana-task-title ${isCompleted ? 'completed' : ''} flex-1`}>
            {task.title}
          </h4>
        </div>
        
        {/* Metadata Row */}
        {showMetadata && (task.due || (task.priority && task.priority !== 'none') || (task.labels && task.labels.length > 0)) && (
          <div className="flex items-center gap-2 flex-wrap" style={{ marginLeft: '30px' }}>
            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <>
                {task.labels.map((label, index) => (
                  <span
                    key={index}
                    className={`label label-${label.color}`}
                  >
                    {label.name}
                  </span>
                ))}
              </>
            )}
            
            {/* Due Date */}
            {(task.due_date_only || task.due) && (
              <div className="flex items-center gap-1" style={{
                fontSize: '12px',
                color: isOverdue ? 'var(--red-600)' : 'var(--text-muted)',
                backgroundColor: isOverdue ? 'var(--red-50)' : 'transparent',
                padding: isOverdue ? '2px 8px' : '2px 0',
                borderRadius: isOverdue ? '12px' : '0',
                fontWeight: isOverdue ? 500 : 400
              }}>
                <Calendar size={12} />
                <span>
                  {formatTaskDate(parseGoogleTaskDate(task.due_date_only || task.due))}
                </span>
              </div>
            )}
            
            {/* Priority */}
            {task.priority && task.priority !== 'none' && (
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: task.priority === 'high' ? 'var(--red-50)' : task.priority === 'medium' ? 'var(--amber-50)' : '#e0f2fe',
                color: task.priority === 'high' ? 'var(--red-600)' : task.priority === 'medium' ? 'var(--amber-600)' : '#0369a1'
              }}>
                {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
              </span>
            )}
            
            {/* Recurring */}
            {task.recurring?.enabled && (
              <div className="flex items-center gap-1" style={{
                fontSize: '12px',
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-bg)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 500
              }}>
                <RefreshCw size={12} />
                <span>{task.recurring.frequency}</span>
              </div>
            )}
            
          </div>
        )}
      </div>

        </div>
      </ContextMenu>
    </div>
  );
};

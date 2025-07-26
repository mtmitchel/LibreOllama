import React, { useState } from 'react';
import { useDraggable } from "@dnd-kit/core";
import { Calendar, CheckCircle2, Circle, Edit, Flag, Trash2, Tag } from 'lucide-react';
import { KanbanTask } from '../../stores/useKanbanStore';
import { asanaTypography, priorityConfig } from '../../constants/asanaDesignSystem';

interface DraggableTaskCardProps {
  task: KanbanTask;
  columnId: string;
  isActive: boolean;
  contextMenu: any;
  setContextMenu: any;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSaveEdit: (task: KanbanTask) => void;
  onEditTask?: (task: KanbanTask, columnId: string) => void;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  columnId,
  isActive,
  contextMenu,
  setContextMenu,
  editingTask,
  setEditingTask,
  editingTitle,
  setEditingTitle,
  onSaveEdit,
  onEditTask
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
  } : undefined;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
      columnId
    });
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        // Only open edit modal if not dragging and not clicking on input or button elements
        const target = e.target as HTMLElement;
        const isInteractive = target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button');
        if (!isDragging && onEditTask && !isInteractive) {
          onEditTask(task, columnId);
        }
      }}
      className={`p-5 bg-white cursor-pointer transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ 
        borderRadius: '18px',
        boxShadow: isDragging ? '0 8px 32px rgba(50, 50, 93, 0.25)' : '0 2px 8px rgba(50, 50, 93, 0.08)',
        border: 'none',
        transition: 'box-shadow 0.18s, transform 0.12s',
        ...(style || {})
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(50, 50, 93, 0.13)';
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(50, 50, 93, 0.08)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
      }}
    >
      {/* Title */}
      {editingTask === task.id ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={() => onSaveEdit(task)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit(task);
            } else if (e.key === 'Escape') {
              setEditingTask(null);
              setEditingTitle('');
            }
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded"
          style={asanaTypography.h3}
          autoFocus
        />
      ) : (
        <h4 
          style={{ 
            ...asanaTypography.h3, 
            marginBottom: '8px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
          onDoubleClick={() => {
            setEditingTask(task.id);
            setEditingTitle(task.title);
          }}
        >
          {task.title}
        </h4>
      )}

      {/* Labels and Priority - Side by side below title */}
      {((task.metadata?.labels && task.metadata.labels.length > 0) || (task.metadata?.priority && task.metadata.priority !== 'normal')) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Labels */}
          {task.metadata?.labels?.map((label: string, index: number) => {
            // Capitalize first letter of each label
            const displayLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
            return (
              <span
                key={label}
                className="px-2.5 py-1 rounded-lg"
                style={{ 
                  ...asanaTypography.label,
                  textTransform: 'none',
                  backgroundColor: '#EDF1F5',
                  color: '#796EFF'
                }}
              >
                {displayLabel}
              </span>
            );
          })}
          
          {/* Priority */}
          {task.metadata?.priority && task.metadata.priority !== 'normal' && (
            <span 
              className="px-3 py-1 rounded-lg"
              style={{ 
                ...asanaTypography.label,
                textTransform: 'none',
                backgroundColor: priorityConfig[task.metadata.priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
                color: priorityConfig[task.metadata.priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
              }}
            >
              {/* Capitalize first letter of priority */}
              {(priorityConfig[task.metadata.priority as keyof typeof priorityConfig]?.label || task.metadata.priority).charAt(0).toUpperCase() + 
                (priorityConfig[task.metadata.priority as keyof typeof priorityConfig]?.label || task.metadata.priority).slice(1).toLowerCase() + ' priority'
              }
            </span>
          )}
        </div>
      )}
      
      {/* Description/Notes */}
      {task.notes && (
        <p 
          style={{ 
            ...asanaTypography.body,
            marginBottom: '12px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {task.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3" 
           style={{ borderTop: '1px solid #F1F2F3' }}>
        <div className="flex items-center gap-3">
          {/* Due date */}
          {task.due && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} style={{ color: '#9CA6AF' }} />
              <span style={asanaTypography.small}>
                {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {/* Subtasks */}
          {task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={14} style={{ color: '#14A085' }} />
              <span style={asanaTypography.small}>
                {task.metadata.subtasks.filter(st => st.completed).length}/{task.metadata.subtasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Status icon */}
        {task.status === 'completed' ? (
          <CheckCircle2 size={16} style={{ color: '#14A085' }} />
        ) : (
          <Circle size={16} style={{ color: '#DDD' }} />
        )}
      </div>
    </div>
  );
};
import React, { memo, useMemo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, CircleDashed, Trash2, Flag, Hash, GripVertical, AlertTriangle } from 'lucide-react';
import type { SortableTaskItemProps } from '../types';
import { 
  isTaskOverdue, 
  formatDueDate, 
  getStatusBadge, 
  parseEnhancedTaskData, 
  cleanTaskNotes, 
  getSubtaskData 
} from '../utils/taskHelpers';
import { Card, Button, Tag } from '../../../components/ui';
import { useGoogleStore } from '../../../stores/googleStore';

// Memoized TaskCard for performance
export const TaskCard = memo<SortableTaskItemProps>(({ 
  task, 
  listId, 
  onTaskClick, 
  onToggleCompletion, 
  onDeleteTask, 
  isDragStarted,
  onRetrySync
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    // Disable drag handle when dragging is already started
    disabled: isDragStarted
  });

  // Get sync state from store
  const syncState = useGoogleStore(state => state.taskSyncState.get(task.id));
  const isUnsynced = syncState?.status === 'failed';

  // Memoized calculations to prevent recalculation on every render
  const taskData = useMemo(() => {
    // FIRST: prefer already-extracted props from store enhancement
    const directLabels = (task as any).labels as string[] | undefined;
    const directPriority = (task as any).priority as any;

    // Fallback to legacy notes parsing for backward-compat / tasks that still store metadata inline
    const enhancedDataInNotes = parseEnhancedTaskData(task.notes || '');

    const labels = directLabels ?? enhancedDataInNotes.labels ?? [];
    const priority = directPriority ?? enhancedDataInNotes.priority ?? 'normal';

    const cleanNotes = cleanTaskNotes(task.notes || '');
    const isCompleted = task.status === 'completed';
    const isOverdue = isTaskOverdue(task) && !isCompleted;
    const subtaskData = getSubtaskData(task);
    const statusBadge = getStatusBadge(task);

    return {
      labels,
      priority,
      cleanNotes,
      isCompleted,
      isOverdue,
      ...subtaskData,
      statusBadge,
    };
  }, [task]);

  // Optimized drag style calculation
  const dragStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }), [transform, transition, isDragging]);

  // Memoized event handlers
  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    if (!isDragStarted && !e.defaultPrevented) {
      onTaskClick(task, listId);
    }
  }, [isDragStarted, onTaskClick, task, listId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDragStarted) {
      e.preventDefault();
      onTaskClick(task, listId);
    }
  }, [isDragStarted, onTaskClick, task, listId]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCompletion(listId, task.id, task.status);
  }, [onToggleCompletion, listId, task.id, task.status]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteTask(e, listId, task.id);
  }, [onDeleteTask, listId, task.id]);

  return (
    <div ref={setNodeRef} style={dragStyle}>
      <Card
        className={`group relative bg-[var(--bg-surface)] cursor-pointer transition-all duration-200 hover:bg-[var(--bg-surface-hover)] hover:shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 ${
          isDragging ? 'shadow-lg border-primary rotate-1' : ''
        } ${
          isUnsynced 
            ? 'border-l-4 border-l-error bg-error-ghost border-error'
            : taskData.isCompleted 
              ? 'border-l-4 border-l-success bg-success-ghost border-border-default' 
              : 'border-border-default hover:border-border-hover'
        }`}
        onClick={handleTaskClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Task: ${task.title}. ${taskData.isCompleted ? 'Completed.' : ''} ${task.due ? `Due ${formatDueDate(task.due)}.` : ''} ${taskData.hasSubtasks ? `${taskData.completedSubtasks} of ${taskData.subtaskCount} subtasks.` : ''} Click to edit.`}
      >
      {/* OPTIMIZED: Dedicated drag handle instead of invisible overlay */}
      <div 
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing z-30"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder task"
        title="Drag to reorder"
      >
        <GripVertical size={16} className="text-muted hover:text-primary" />
      </div>

      {/* Action Icons - Optimized positioning */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="p-2 text-muted hover:text-error hover:bg-error-ghost rounded focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-1"
          aria-label={`Delete task: ${task.title}`}
          title="Delete task"
          tabIndex={-1}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Main Content - OPTIMIZED: Add left padding for drag handle */}
      <div style={{ padding: 'var(--space-4) var(--space-5)', paddingLeft: 'calc(var(--space-5) + 24px)' }} className="relative z-10">
        
        {/* ZONE 1: Title + Checkbox */}
        <div className="flex items-start gap-3 pr-8">
          {/* Status Checkbox */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="flex-shrink-0 mt-1 text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
            aria-label={taskData.isCompleted ? "Mark as incomplete" : "Mark as complete"}
            title={taskData.isCompleted ? "Mark as incomplete" : "Mark as complete"}
            tabIndex={-1}
          >
            {taskData.isCompleted ? (
              <CheckCircle size={18} className="text-success" />
            ) : (
              <CircleDashed size={18} className="text-muted" />
            )}
          </Button>
          
          {/* Task Title */}
          <div className="flex-1 min-w-0">
            <h3 
              className={`transition-colors leading-tight font-semibold text-base ${
                taskData.isCompleted ? 'text-muted line-through' : 'text-primary'
              }`}
            >
              {task.title}
            </h3>
            
            {/* NEW: Unsynced Indicator */}
            {isUnsynced && (
              <div className="mt-2 flex items-center gap-2 text-error text-sm">
                <AlertTriangle size={14} />
                <span>Sync failed.</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-error h-auto p-0 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetrySync?.(task.id);
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Priority indicator */}
            {(taskData.priority === 'high' || taskData.priority === 'urgent') && (
              <div className="mt-1">
                <Tag 
                  variant="solid" 
                  color={taskData.priority === 'urgent' ? 'error' : 'warning'} 
                  size="sm"
                  className="inline-flex items-center gap-1"
                >
                  <Flag size={10} />
                  {taskData.priority === 'urgent' ? 'Urgent' : 'High Priority'}
                </Tag>
              </div>
            )}
          </div>
        </div>

        {/* ZONE 2: Description */}
        {taskData.cleanNotes && (
          <div className="pl-6 mt-2">
            <p 
              className={`leading-relaxed text-sm ${
                taskData.isCompleted ? 'text-muted' : 'text-secondary'
              }`}
            >
              {taskData.cleanNotes}
            </p>
          </div>
        )}

        {/* Labels */}
        {taskData.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-6 mt-2">
            {taskData.labels.slice(0, 3).map((label: string, index: number) => (
              <Tag 
                key={index} 
                variant="ghost" 
                color="primary" 
                size="sm"
                className="inline-flex items-center gap-1"
              >
                <Hash size={8} />
                {label}
              </Tag>
            ))}
            {taskData.labels.length > 3 && (
              <Tag 
                variant="ghost" 
                color="muted" 
                size="sm"
              >
                +{taskData.labels.length - 3}
              </Tag>
            )}
          </div>
        )}

        {/* ZONE 3: Metadata Row */}
        {(taskData.hasSubtasks || task.due || taskData.statusBadge) && (
          <div 
            className="flex items-center border-t border-border-muted pt-2 mt-3"
            style={{ 
              fontSize: '0.85rem',
              marginLeft: 'var(--space-6)'
            }}
          >
            <div className="flex items-center gap-3">
              {/* Checklist progress */}
              {taskData.hasSubtasks && (
                <div className="flex items-center gap-1 text-muted">
                  <CheckCircle size={12} />
                  <span>✓ {taskData.completedSubtasks}/{taskData.subtaskCount}</span>
                </div>
              )}
              
              {/* Due Date */}
              {task.due && (
                <>
                  {taskData.hasSubtasks && <span className="text-border-muted">•</span>}
                  <span className={`${
                    taskData.isOverdue ? 'text-error font-medium' : taskData.isCompleted ? 'text-muted' : 'text-secondary'
                  }`}>
                    Due {taskData.isOverdue ? 'yesterday' : formatDueDate(task.due)}
                  </span>
                </>
              )}
            </div>
            
            {/* Status Badge */}
            {taskData.statusBadge && (
              <Tag 
                variant="solid" 
                color="muted" 
                size="sm"
                className="ml-auto"
              >
                {taskData.statusBadge.text}
              </Tag>
            )}
          </div>
        )}
      </div>
    </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.notes === nextProps.task.notes &&
    prevProps.task.due === nextProps.task.due &&
    prevProps.task.priority === (nextProps.task as any).priority &&
    JSON.stringify((prevProps.task as any).labels) === JSON.stringify((nextProps.task as any).labels) &&
    prevProps.listId === nextProps.listId &&
    prevProps.isDragStarted === nextProps.isDragStarted
  );
}); 
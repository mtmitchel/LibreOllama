import React, { memo, useMemo, useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { GoogleTask, GoogleTaskList } from '../types';
import { TaskCard } from './TaskCard';
import { Card, Button, Tag } from '../../../components/ui';

interface DroppableColumnProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export interface TaskColumnProps {
  id: string;
  taskList: GoogleTaskList;
  tasks: GoogleTask[];
  onTaskClick: (task: GoogleTask, listId: string) => void;
  onToggleCompletion: (taskListId: string, taskId: string, currentStatus: 'needsAction' | 'completed') => void;
  onDeleteTask: (e: React.MouseEvent, taskListId: string, taskId: string) => void;
  onOpenCreateModal: (columnId: string, columnTitle: string) => void;
  isDragStarted: boolean;
  onRetrySync?: (taskId: string) => void;
}

// Memoized droppable column component that forwards ref so the parent can access the scroll container
const DroppableColumn = memo(
  React.forwardRef<HTMLDivElement, DroppableColumnProps>(
    ({ children, id, className }, ref) => {
      const { setNodeRef, isOver } = useDroppable({ id });

      // Merge DnD kit's setNodeRef with forwarded ref so both get the DOM element
      const setRefs = React.useCallback(
        (node: HTMLDivElement | null) => {
          setNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        },
        [ref, setNodeRef]
      );

      return (
        <div
          ref={setRefs}
          className={`${className} ${isOver ? 'bg-primary-ghost border-primary border-2 border-dashed' : ''} transition-colors duration-150`}
        >
          {children}
        </div>
      );
    }
  )
);

// Optimized TaskColumn with memoization
export const TaskColumn = memo<TaskColumnProps>(({
  taskList,
  tasks,
  onTaskClick,
  onToggleCompletion,
  onDeleteTask,
  onOpenCreateModal,
  isDragStarted,
  onRetrySync,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoized task IDs for SortableContext
  const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);
  
  const { taskCount, completedCount } = useMemo(() => {
    return {
      taskCount: tasks.filter(t => t.status === 'needsAction').length,
      completedCount: tasks.filter(t => t.status === 'completed').length,
    }
  }, [tasks]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleOpenCreateModal = useCallback(() => {
    onOpenCreateModal(taskList.id, taskList.title);
  }, [onOpenCreateModal, taskList.id, taskList.title]);

  // Memoized empty state component
  const emptyState = useMemo(() => {
    if (tasks.length > 0) return null;
    
    return (
      <div className="text-center py-8 text-muted">
        <p>No tasks yet</p>
        <p className="text-sm mt-1">Create your first task below</p>
      </div>
    );
  }, [tasks.length]);

  return (
    <Card className="flex flex-col h-full min-h-[600px] bg-[var(--bg-tertiary)] w-full">
      {/* Column Header - Optimized */}
      <div className="p-4 border-b border-border-default bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">
            {taskList.title}
          </h2>
          <div className="flex items-center gap-3">
            <Tag variant="solid" color="primary" size="sm">
              {taskCount}
            </Tag>
            {completedCount > 0 && (
              <Tag variant="solid" color="success" size="sm">
                ✓ {completedCount}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container - Optimized with better visual feedback */}
      <DroppableColumn 
        id={taskList.id} 
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="p-4 space-y-3">
          {tasks.length === 0 ? (
            emptyState
          ) : (
            <SortableContext 
              items={taskIds} 
              strategy={verticalListSortingStrategy}
            >
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  listId={taskList.id}
                  onTaskClick={onTaskClick}
                  onToggleCompletion={onToggleCompletion}
                  onDeleteTask={onDeleteTask}
                  isDragStarted={isDragStarted}
                  onRetrySync={onRetrySync}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DroppableColumn>

      {/* Add Task Button - Optimized event handler */}
      <div className="p-4 bg-[var(--bg-surface)] border-t border-border-default rounded-b-[var(--radius-lg)]">
        <Button
          variant="ghost"
          onClick={handleOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 py-3 text-muted bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary-hover)] hover:text-primary rounded-[var(--radius-md)] border border-dashed border-border-muted hover:border-border-default transition-all duration-200"
          aria-label={`Add new task to ${taskList.title}`}
        >
          <Plus size={18} />
          <span className="font-medium">Add Task</span>
        </Button>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.taskList.id === nextProps.taskList.id &&
    prevProps.taskList.title === nextProps.taskList.title &&
    prevProps.tasks.length === nextProps.tasks.length &&
    prevProps.isDragStarted === nextProps.isDragStarted &&
    // Check if task statuses have changed
    prevProps.tasks.every((prevTask, index) => {
      const nextTask = nextProps.tasks[index];
      return nextTask && 
        prevTask.id === nextTask.id && 
        prevTask.status === nextTask.status &&
        prevTask.title === nextTask.title &&
        (prevTask as any).unsynced === (nextTask as any).unsynced;
    })
  );
}); 
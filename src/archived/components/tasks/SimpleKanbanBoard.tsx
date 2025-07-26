import React, { useState } from 'react';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { useTaskWithMetadata, useUpdateTask, useMoveTask } from '../../hooks/useGoogleTasks';
import { Badge } from '../ui/badge';
import { Calendar, Flag, GripVertical, MoreVertical, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SimpleKanbanBoardProps {
  taskLists: tasks_v1.Schema$TaskList[];
  allTasks: Record<string, tasks_v1.Schema$Task[]>;
  onTaskClick?: (task: tasks_v1.Schema$Task, listId: string) => void;
  onContextMenu?: (e: React.MouseEvent, task: tasks_v1.Schema$Task, listId: string) => void;
}

// Asana-style typography
const asanaTypography = {
  body: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#151B26'
  },
  small: {
    fontSize: '12px',
    color: '#9CA6AF'
  },
};

// Asana-style priority config
const priorityConfig = {
  urgent: {
    bgColor: '#FFE5E5',
    textColor: '#D32F2F',
    label: 'Urgent'
  },
  high: { 
    bgColor: '#FFEEF0',
    textColor: '#E85D75',
    label: 'High'
  },
  normal: { 
    bgColor: '#F3F4F6',
    textColor: '#6B6F76',
    label: 'Normal'
  },
  low: { 
    bgColor: '#E8F5F3',
    textColor: '#26B38D',
    label: 'Low'
  }
};

// Sortable task card
const SortableTaskCard: React.FC<{
  task: tasks_v1.Schema$Task;
  listId: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}> = ({ task, listId, onClick, onContextMenu }) => {
  const { metadata } = useTaskWithMetadata(listId, task.id!);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(50, 50, 93, 0.05)',
        border: '1px solid #E8E8E9',
        marginBottom: '8px',
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "bg-white p-4 cursor-pointer transition-all",
        isDragging && "opacity-50"
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          onClick?.();
        }
      }}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(50, 50, 93, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(50, 50, 93, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start gap-3">
        <button
          className="flex-shrink-0 mt-0.5"
          onClick={(e) => {
            e.stopPropagation();
            // Toggle complete logic here if needed
          }}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={18} style={{ color: '#14A085' }} />
          ) : (
            <Circle size={18} style={{ color: '#DDD' }} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 
            style={{ 
              ...asanaTypography.body,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color: task.status === 'completed' ? '#9CA3AF' : '#151B26'
            }}
          >
            {task.title}
          </h4>
          
          {task.notes && (
            <p style={{ ...asanaTypography.small, marginTop: '4px' }}>
              {task.notes}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {task.due && (
              <div className="flex items-center gap-1.5">
                <Calendar size={12} style={{ color: '#9CA6AF' }} />
                <span style={asanaTypography.small}>
                  {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            
            {metadata.priority !== 'normal' && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: priorityConfig[metadata.priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
                  color: priorityConfig[metadata.priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
                }}
              >
                <Flag size={10} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>
                  {priorityConfig[metadata.priority as keyof typeof priorityConfig]?.label || metadata.priority}
                </span>
              </div>
            )}
            
            {metadata.labels.length > 0 && (
              <div className="flex gap-1">
                {metadata.labels.map((label, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                    style={{ fontSize: '11px' }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

// Task list column
const TaskListColumn: React.FC<{
  list: tasks_v1.Schema$TaskList;
  tasks: tasks_v1.Schema$Task[];
  onTaskClick?: (task: tasks_v1.Schema$Task) => void;
  onContextMenu?: (e: React.MouseEvent, task: tasks_v1.Schema$Task) => void;
}> = ({ list, tasks, onTaskClick, onContextMenu }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-h-[400px] w-80" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#151B26' }}>{list.title}</h3>
        <span style={{ fontSize: '14px', color: '#6B6F76' }}>{tasks.length}</span>
      </div>
      
      <SortableContext
        items={tasks.map(t => t.id!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              listId={list.id!}
              onClick={() => onTaskClick?.(task)}
              onContextMenu={(e) => onContextMenu?.(e, task)}
            />
          ))}
        </div>
      </SortableContext>
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No tasks yet</p>
        </div>
      )}
    </div>
  );
};

export const SimpleKanbanBoard: React.FC<SimpleKanbanBoardProps> = ({
  taskLists,
  allTasks,
  onTaskClick,
  onContextMenu,
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const moveTask = useMoveTask();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      // Find which list the task is being moved within
      let sourceListId: string | null = null;
      let targetListId: string | null = null;
      
      for (const [listId, tasks] of Object.entries(allTasks)) {
        if (tasks.some(t => t.id === active.id)) {
          sourceListId = listId;
        }
        if (tasks.some(t => t.id === over?.id)) {
          targetListId = listId;
        }
      }
      
      if (sourceListId && targetListId && sourceListId === targetListId) {
        // Moving within the same list
        const tasks = allTasks[sourceListId];
        const oldIndex = tasks.findIndex(t => t.id === active.id);
        const newIndex = tasks.findIndex(t => t.id === over?.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Call the API to update position
          moveTask.mutate({
            tasklistId: sourceListId,
            taskId: active.id as string,
            previous: newIndex > 0 ? tasks[newIndex - 1].id : undefined,
          });
        }
      }
    }
    
    setActiveId(null);
  };
  
  const activeTask = activeId
    ? Object.values(allTasks).flat().find(t => t.id === activeId)
    : null;
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {taskLists.map((list) => (
          <TaskListColumn
            key={list.id}
            list={list}
            tasks={allTasks[list.id!] || []}
            onTaskClick={(task) => onTaskClick?.(task, list.id!)}
            onContextMenu={(e, task) => onContextMenu?.(e, task, list.id!)}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeId && activeTask ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 opacity-90">
            <h4 className="font-medium text-gray-900">{activeTask.title}</h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
import React, { useMemo, useCallback } from 'react';
import { Board } from '@caldwell619/react-kanban';
import type { ColumnType, CardType } from '@caldwell619/react-kanban';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { useTaskWithMetadata, useUpdateTask, useMoveTask } from '../../hooks/useGoogleTasks';
import { useTaskMetadataStore } from '../../stores/useTaskMetadataStore';
import { Badge } from '../ui/badge';
import { Calendar, Clock, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KanbanBoardProps {
  taskLists: tasks_v1.Schema$TaskList[];
  allTasks: Record<string, tasks_v1.Schema$Task[]>;
  onTaskClick?: (task: tasks_v1.Schema$Task, listId: string) => void;
}

// Priority colors
const priorityColors = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  low: 'bg-gray-500 text-white',
};

// Custom card component
const TaskCard: React.FC<{
  task: tasks_v1.Schema$Task;
  listId: string;
  onClick?: () => void;
}> = ({ task, listId, onClick }) => {
  const { metadata } = useTaskWithMetadata(listId, task.id!);
  
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      
      {task.notes && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.notes}</p>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {metadata.labels.map((label, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {label}
          </Badge>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        {task.due && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.due).toLocaleDateString()}</span>
          </div>
        )}
        
        {metadata.priority !== 'normal' && (
          <div className={cn('px-2 py-1 rounded text-xs font-medium', priorityColors[metadata.priority])}>
            <Flag className="w-3 h-3 inline mr-1" />
            {metadata.priority}
          </div>
        )}
      </div>
      
      {metadata.subtasks && metadata.subtasks.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {metadata.subtasks.filter(st => st.completed).length}/{metadata.subtasks.length} subtasks
        </div>
      )}
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  taskLists,
  allTasks,
  onTaskClick,
}) => {
  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  
  // Transform data for the Kanban board
  const boardData = useMemo(() => {
    const columns: Record<string, ColumnType<CardType>> = {};
    
    taskLists.forEach((list) => {
      const tasks = allTasks[list.id!] || [];
      
      columns[list.id!] = {
        id: list.id!,
        title: list.title!,
        cards: tasks.map(task => ({
          id: task.id!,
          title: task.title!,
          description: task.notes || '',
          // Store the full task object for custom rendering
          metadata: { task, listId: list.id! },
        })),
      };
    });
    
    return { columns };
  }, [taskLists, allTasks]);
  
  // Handle card movement
  const handleCardMove = useCallback(
    async (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      destinationIndex: number
    ) => {
      // Find the previous task ID for positioning
      const destinationTasks = allTasks[destinationColumnId] || [];
      const previousTaskId = destinationIndex > 0 
        ? destinationTasks[destinationIndex - 1]?.id 
        : undefined;
      
      // If moving within the same list, just reorder
      if (sourceColumnId === destinationColumnId) {
        await moveTask.mutateAsync({
          tasklistId: sourceColumnId,
          taskId: cardId,
          previous: previousTaskId,
        });
      } else {
        // Moving to a different list requires creating in new list and deleting from old
        const sourceTask = allTasks[sourceColumnId]?.find(t => t.id === cardId);
        if (!sourceTask) return;
        
        // Update the task to move it to the new list
        // Note: Google Tasks API doesn't support cross-list moves directly,
        // so this would need to be implemented as delete + create
        console.warn('Cross-list task movement not yet implemented');
      }
    },
    [allTasks, moveTask]
  );
  
  return (
    <div className="h-full">
      <Board
        initialBoard={boardData}
        onCardMove={handleCardMove}
        renderCard={(card) => {
          const { task, listId } = card.metadata as { task: tasks_v1.Schema$Task; listId: string };
          return (
            <TaskCard
              task={task}
              listId={listId}
              onClick={() => onTaskClick?.(task, listId)}
            />
          );
        }}
        renderColumnHeader={(column) => (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span className="text-sm text-gray-500">{column.cards.length}</span>
          </div>
        )}
        columnStyle={{
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          minHeight: '400px',
        }}
        cardStyle={{
          marginBottom: '0.5rem',
        }}
      />
    </div>
  );
};
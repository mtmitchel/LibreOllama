
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, GripVertical, Calendar, Tag, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TaskItem, KanbanColumn, TaskStatus } from '@/lib/types';
import { mockTaskItems, mockKanbanColumns } from '@/lib/mock-data'; // Mock data
import { ScrollArea } from '../ui/scroll-area';

const priorityColors = {
  low: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function TasksKanbanView() {
  const [columns, setColumns] = useState<KanbanColumn[]>(mockKanbanColumns);
  const [draggingTask, setDraggingTask] = useState<TaskItem | null>(null);
  const [draggingFromCol, setDraggingFromCol] = useState<TaskStatus | null>(null);

  // Effect to initialize columns on client to avoid hydration issues if mock data changes
  useEffect(() => {
    const initialColumns: KanbanColumn[] = [
      { id: 'todo', title: 'To Do', tasks: mockTaskItems.filter(t => t.status === 'todo') },
      { id: 'inprogress', title: 'In Progress', tasks: mockTaskItems.filter(t => t.status === 'inprogress') },
      { id: 'done', title: 'Done', tasks: mockTaskItems.filter(t => t.status === 'done') },
    ];
    setColumns(initialColumns);
  }, []);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: TaskItem, fromColumnId: TaskStatus) => {
    e.dataTransfer.setData('taskId', task.id);
    setDraggingTask(task); 
    setDraggingFromCol(fromColumnId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toColumnId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    if (draggingTask && draggingFromCol && draggingFromCol !== toColumnId) {
      const updatedTask = { ...draggingTask, status: toColumnId, updatedAt: new Date().toISOString() };
      
      setColumns(prevColumns => {
        return prevColumns.map(column => {
          if (column.id === draggingFromCol) {
            return { ...column, tasks: column.tasks.filter(t => t.id !== taskId) };
          }
          if (column.id === toColumnId) {
            return { ...column, tasks: [...column.tasks, updatedTask].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) };
          }
          return column;
        });
      });
    }
    setDraggingTask(null);
    setDraggingFromCol(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const handleEditTask = (task: TaskItem) => alert(`Editing task: ${task.title} (not implemented)`);
  const handleDeleteTask = (taskId: string, columnId: TaskStatus) => {
     setColumns(prevColumns => 
        prevColumns.map(column => 
            column.id === columnId 
            ? { ...column, tasks: column.tasks.filter(t => t.id !== taskId) } 
            : column
        )
     );
     alert(`Deleting task (mock): ${taskId} (not fully implemented)`);
  }
  const handleAddTask = (columnId: TaskStatus) => alert(`Adding new task to ${columnId} (not implemented)`);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
      {columns.map(column => (
        <Card 
          key={column.id} 
          className="w-80 min-w-[320px] flex-shrink-0 flex flex-col max-h-full bg-muted/30"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <CardHeader className="flex-row items-center justify-between border-b py-3 px-4">
            <CardTitle className="text-base font-semibold">{column.title} ({column.tasks.length})</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddTask(column.id)}>
              <PlusCircle size={18} />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-3 space-y-3">
              {column.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No tasks here. Drag one or click '+' to add.</p>
              )}
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, column.id)}
                  className={`p-3 bg-card border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-1.5
                    ${draggingTask?.id === task.id ? 'opacity-50 ring-2 ring-primary' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-tight flex-1 mr-2">{task.title}</p>
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-xs mt-1.5">
                    {task.dueDate && (
                      <Badge variant="outline" className="flex items-center gap-1 py-0.5 px-1.5">
                        <Calendar size={12} /> {formatDate(task.dueDate)}
                      </Badge>
                    )}
                    {task.priority && (
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 py-0.5 px-1.5 border ${priorityColors[task.priority] || 'border-transparent'}`}
                      >
                        <AlertCircle size={12} /> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    )}
                     {task.tags && task.tags.length > 0 && task.tags.slice(0,2).map(tag => (
                        <Badge key={tag} variant="secondary" className="py-0.5 px-1.5 text-xs">
                            <Tag size={12} className="mr-1 opacity-70"/>{tag}
                        </Badge>
                    ))}
                    {task.tags && task.tags.length > 2 && <Badge variant="outline" className="py-0.5 px-1.5 text-xs">+{task.tags.length - 2} more</Badge>}
                  </div>
                   <div className="flex gap-1.5 mt-2 pt-1.5 border-t border-dashed">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEditTask(task)}>
                            <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTask(task.id, column.id)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      ))}
    </div>
  );
}

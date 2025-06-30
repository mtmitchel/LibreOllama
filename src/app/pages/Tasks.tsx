import React, { useState, useEffect } from 'react';
import { Card } from '../../core/shared-ui';
import { Plus, List, LayoutGrid, MoreHorizontal, CircleDashed, LoaderCircle, CheckCircle } from 'lucide-react';
import { useHeader, HeaderProps, SecondaryAction } from '../contexts/HeaderContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  overdue?: boolean;
  assignee?: string;
  status: 'todo' | 'inprogress' | 'done';
}

interface Column {
  id: 'todo' | 'inprogress' | 'done';
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
}

interface DragState {
  isDragging: boolean;
  draggedTask: Task | null;
  draggedFrom: string | null;
  draggedOver: string | null;
}

const initialTasks: Task[] = [
  { id: 'TASK-001', title: 'Finalize Q3 budget report', description: 'Review all department submissions and compile final numbers.', priority: 'high', dueDate: '2025-06-10', overdue: true, assignee: 'AS', status: 'todo' },
  { id: 'TASK-002', title: 'Develop new landing page mockups', priority: 'medium', dueDate: '2025-06-15', assignee: 'BD', status: 'todo' },
  { id: 'TASK-003', title: 'User testing for mobile app v2.1', description: 'Coordinate with QA and recruit participants.', priority: 'high', dueDate: '2025-06-20', assignee: 'CH', status: 'inprogress' },
  { id: 'TASK-004', title: 'Update documentation for API changes', priority: 'low', assignee: 'DM', status: 'inprogress' },
  { id: 'TASK-005', title: 'Onboard new marketing intern', priority: 'medium', dueDate: '2025-06-05', overdue: true, assignee: 'AS', status: 'done' },
  { id: 'TASK-006', title: 'Prepare presentation for stakeholder meeting', description: 'Include Q2 performance and Q3 roadmap.', priority: 'high', assignee: 'BD', status: 'done' },
];

export default function Tasks() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTask: null,
    draggedFrom: null,
    draggedOver: null
  });

  useEffect(() => {
    const newHeaderProps: HeaderProps = {
      title: "Tasks",
      primaryAction: {
        label: 'New Task',
        onClick: () => console.log('New Task clicked'),
        icon: <Plus size={16} />,
      },
      secondaryActions: [
        {
          label: 'List View',
          onClick: () => setViewMode('list'),
          icon: <List size={16} />,
          variant: viewMode === 'list' ? 'secondary' : 'ghost',
        } as SecondaryAction,
        {
          label: 'Kanban View',
          onClick: () => setViewMode('kanban'),
          icon: <LayoutGrid size={16} />,
          variant: viewMode === 'kanban' ? 'secondary' : 'ghost',
        } as SecondaryAction,
      ]
    };
    setHeaderProps(newHeaderProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, viewMode]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDragState({
      isDragging: true,
      draggedTask: task,
      draggedFrom: task.status,
      draggedOver: null
    });
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragState({
      isDragging: false,
      draggedTask: null,
      draggedFrom: null,
      draggedOver: null
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setDragState(prev => ({
      ...prev,
      draggedOver: columnId
    }));
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only reset draggedOver if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        draggedOver: null
      }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('text/plain');
    const { draggedTask, draggedFrom } = dragState;
    
    if (!draggedTask || !taskId || targetColumnId === draggedFrom) {
      setDragState({
        isDragging: false,
        draggedTask: null,
        draggedFrom: null,
        draggedOver: null
      });
      return;
    }

    // Update task status
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: targetColumnId as Task['status'] }
          : task
      )
    );

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedTask: null,
      draggedFrom: null,
      draggedOver: null
    });

    // Show success feedback
    console.log(`Task "${draggedTask.title}" moved from ${draggedFrom} to ${targetColumnId}`);
  };

  const columns: Column[] = [
    {
      id: 'todo',
      title: 'To Do',
      icon: <CircleDashed size={16} className="text-muted-foreground" />,
      tasks: tasks.filter(task => task.status === 'todo'),
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      icon: <LoaderCircle size={16} className="text-blue-500 animate-spin" />,
      tasks: tasks.filter(task => task.status === 'inprogress'),
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle size={16} className="text-green-500" />,
      tasks: tasks.filter(task => task.status === 'done'),
    },
  ];

  const getPriorityClass = (priority: string) => {
    if (priority === 'high') return 'bg-red-50 text-red-600';
    if (priority === 'medium') return 'bg-yellow-50 text-yellow-600';
    return 'bg-green-50 text-green-600';
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-6 min-w-max">
            {columns.map(column => (
              <div
                key={column.id}
                className={`w-80 min-w-80 max-w-sm flex-shrink-0 transition-all duration-200 ${
                  dragState.draggedOver === column.id 
                    ? 'ring-2 ring-blue-400 bg-blue-50 shadow-lg scale-105 rounded-lg' 
                    : ''
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <Card className="h-full flex flex-col bg-bg-surface">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      {column.icon}
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                      <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                        {column.tasks.length}
                      </span>
                    </div>
                    <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal size={18}/>
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {column.tasks.map(task => (
                      <div
                        key={task.id}
                        className="cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <Card 
                          className={`bg-card hover:shadow-md transition-all duration-200 border border-border ${
                            dragState.draggedTask?.id === task.id ? 'opacity-50 scale-95' : 'hover:scale-102'
                          }`}
                          padding="default"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <p className="font-semibold text-foreground select-none">{task.title}</p>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                              {task.id}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2 select-none">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityClass(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className={`text-xs ${task.overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                  Due: {task.dueDate}
                                </span>
                              )}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                              {task.assignee}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                    
                    {/* Drop zone indicator */}
                    {dragState.isDragging && dragState.draggedOver === column.id && (
                      <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-4 text-center text-blue-600 text-sm animate-pulse">
                        Drop task here
                      </div>
                    )}
                    
                    <button className="w-full text-sm flex items-center justify-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border hover:border-blue-500">
                      <Plus size={16} /> Add task
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto pt-6">
          <Card className="max-w-4xl mx-auto">
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">All Tasks ({tasks.length})</h2>
            </div>
            <ul className="divide-y divide-border">
              {tasks.map(task => (
                <li key={task.id} className="p-4 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {task.status === 'todo' && <CircleDashed size={18} className="text-muted-foreground" />}
                        {task.status === 'inprogress' && <LoaderCircle size={18} className="text-blue-500 animate-spin" />}
                        {task.status === 'done' && <CheckCircle size={18} className="text-green-500" />}
                        <span className="font-medium text-foreground">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${task.overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                            Due: {task.dueDate}
                          </span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {task.assignee}
                        </div>
                        <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal size={16}/>
                        </button>
                    </div>
                  </div>
                  {task.description && <p className="text-sm text-muted-foreground mt-1 ml-9">{task.description}</p>}
                </li>
              ))}
            </ul>
            {tasks.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                    No tasks found. <button onClick={() => console.log('New Task')} className="text-blue-600 hover:underline">Create one now!</button>
                </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

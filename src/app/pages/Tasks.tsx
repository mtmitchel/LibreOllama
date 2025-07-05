import React, { useState, useEffect } from 'react';
import { Card, Spinner, Tag, Avatar, Button } from '../../components/ui';
import { Plus, List, LayoutGrid, MoreHorizontal, CircleDashed, CheckCircle } from 'lucide-react';
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
      icon: <CircleDashed size={16} style={{ color: 'var(--text-muted)' }} />,
      tasks: tasks.filter(task => task.status === 'todo'),
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      icon: <Spinner size="sm" color="primary" />,
      tasks: tasks.filter(task => task.status === 'inprogress'),
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle size={16} style={{ color: 'var(--success)' }} />,
      tasks: tasks.filter(task => task.status === 'done'),
    },
  ];

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'success';
  };

  const formatPriority = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <div className="flex flex-col h-full p-6 lg:p-8">
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto">
          <div 
            className="grid gap-6 w-full"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
            }}
          >
            {columns.map(column => (
              <div
                key={column.id}
                className={`min-w-0 transition-all duration-200
                    ${dragState.draggedOver === column.id ? 'border-2 border-primary bg-accent-ghost rounded-lg shadow-lg scale-102 p-2' : 'border-none'}
                  `}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <Card className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border-default">
                      <div className="flex items-center gap-2">
                        {column.icon}
                        <h3 className="font-semibold text-primary text-base">
                          {column.title}
                        </h3>
                        <Tag variant="solid" color="muted" size="sm">
                          {column.tasks.length}
                        </Tag>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted p-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <MoreHorizontal size={18}/>
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
                      {column.tasks.map(task => (
                        <div
                          key={task.id}
                          className="cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                        >
                          <Card 
                            className={`transition-all duration-200 hover:shadow-md border border-border-default cursor-grab
                              ${dragState.draggedTask?.id === task.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                            `}
                            padding="default"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <p className="select-none font-semibold text-primary text-sm">
                                {task.title}
                              </p>
                              <Tag variant="solid" color="muted" size="xs" className="font-mono">
                                {task.id}
                              </Tag>
                            </div>
                            {task.description && (
                              <p className="select-none text-sm text-muted mt-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Tag variant="solid" color={getPriorityColor(task.priority)} size="sm">
                                  {formatPriority(task.priority)}
                                </Tag>
                                {task.dueDate && (
                                  <span className={`text-xs ${task.overdue ? 'text-error' : 'text-muted'}`}>
                                    Due: {task.dueDate}
                                  </span>
                                )}
                              </div>
                              <Avatar name={task.assignee} size="sm" />
                            </div>
                          </Card>
                        </div>
                      ))}
                      
                      {/* Drop zone indicator */}
                      {dragState.isDragging && dragState.draggedOver === column.id && (
                        <div className="animate-pulse text-center border-2 border-dashed border-primary bg-accent-ghost rounded-lg p-4 text-primary text-sm">
                          Drop task here
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-center focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 hover:scale-102 text-sm text-muted p-2 border border-dashed border-border-default rounded-md"
                      >
                        <Plus size={16} className="mr-2" /> 
                        Add task
                      </Button>
                    </div>
                  </Card>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto">
          <Card className="w-full max-w-none">
            <div className="p-4 border-b border-border-default">
              <h2 className="text-lg font-semibold text-primary">
                All Tasks ({tasks.length})
              </h2>
            </div>
            <ul className="border-t border-border-default">
              {tasks.map(task => (
                <li 
                  key={task.id} 
                  className="transition-colors hover:bg-bg-secondary p-4 border-b border-border-subtle"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.status === 'todo' && <CircleDashed size={18} className="text-muted" />}
                      {task.status === 'inprogress' && <Spinner size="sm" color="primary" />}
                      {task.status === 'done' && <CheckCircle size={18} className="text-success" />}
                      <span className="font-medium text-primary text-base">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Tag variant="solid" color={getPriorityColor(task.priority)} size="sm">
                        {formatPriority(task.priority)}
                      </Tag>
                      {task.dueDate && (
                        <span className={`text-xs ${task.overdue ? 'text-error' : 'text-muted'}`}>
                          Due: {task.dueDate}
                        </span>
                      )}
                      <Avatar name={task.assignee} size="sm" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted p-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <MoreHorizontal size={16}/>
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted mt-1 ml-9">
                      {task.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {tasks.length === 0 && (
              <div className="text-center p-6 text-muted">
                No tasks found. 
                <button 
                  onClick={() => console.log('New Task')} 
                  className="hover:underline focus:ring-2 focus:ring-primary focus:ring-offset-2 text-primary ml-1"
                >
                  Create one now!
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

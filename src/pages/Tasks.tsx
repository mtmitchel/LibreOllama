import React, { useState, useEffect } from 'react'; // Removed useCallback
import { Card } from '../components/ui/Card';
import { Plus, List, LayoutGrid, MoreHorizontal, CircleDashed, LoaderCircle, CheckCircle } from 'lucide-react';
import { useHeader, HeaderProps, SecondaryAction } from '../contexts/HeaderContext'; // Added SecondaryAction

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
  const [tasks, setTasks] = useState<Task[]>(initialTasks); // setTasks will be used for future task manipulations
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
          variant: viewMode === 'list' ? 'secondary' : 'ghost', // Corrected variant
        } as SecondaryAction, // Added type assertion
        {
          label: 'Kanban View',
          onClick: () => setViewMode('kanban'),
          icon: <LayoutGrid size={16} />,
          variant: viewMode === 'kanban' ? 'secondary' : 'ghost', // Corrected variant
        } as SecondaryAction, // Added type assertion
      ]
    };
    setHeaderProps(newHeaderProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, viewMode]);
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
    return 'bg-green-50 text-green-600'; // Default to low priority color
  };

  return (
    <div className="flex flex-col h-full">
      {viewMode === 'kanban' && (        <div className="flex-1 overflow-x-auto flex gap-6 pb-4 pt-6">
          {columns.map(column => (
            <Card key={column.id} className="w-80 flex-shrink-0 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{column.tasks.length}</span>
                </div>
                <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal size={18}/></button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {column.tasks.map(task => (
                  <Card key={task.id} className="bg-card cursor-pointer hover:shadow-md transition-shadow border border-border" padding="default">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{task.id}</span>
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground mt-2">{task.description}</p>}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                        {task.dueDate && <span className={`text-xs ${task.overdue ? 'text-red-600' : 'text-muted-foreground'}`}>Due: {task.dueDate}</span>}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{task.assignee}</div>
                    </div>
                  </Card>
                ))}
                <button className="w-full text-sm flex items-center justify-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-dashed border-border hover:border-blue-500">
                  <Plus size={16} /> Add task
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {viewMode === 'list' && (        <div className="flex-1 overflow-y-auto pt-6">
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
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                        {task.dueDate && <span className={`text-xs ${task.overdue ? 'text-red-600' : 'text-muted-foreground'}`}>Due: {task.dueDate}</span>}
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{task.assignee}</div>
                        <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal size={16}/></button>
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

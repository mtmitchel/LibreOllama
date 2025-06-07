import React, { useState } from 'react';
import { Card } from '../components/ui/Card'; // Use your reusable Card
import { Plus, List, LayoutGrid, MoreHorizontal, CircleDashed, LoaderCircle, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  overdue?: boolean;
  assignee?: string; // Assuming assignee is represented by initials or a short name
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const columns: Column[] = [
    {
      id: 'todo',
      title: 'To Do',
      icon: <CircleDashed size={16} className="text-text-secondary" />,
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

  // Dummy getPriorityClass for demonstration
  const getPriorityClass = (priority: string) => {
    if (priority === 'high') return 'bg-error/20 text-error';
    if (priority === 'medium') return 'bg-warning/20 text-warning';
    return 'bg-success/20 text-success';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My tasks</h1>
        <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm"><List size={16}/>List</button>
            <button className="btn btn-primary btn-sm"><LayoutGrid size={16}/>Kanban</button>
            <button className="btn btn-primary btn-sm"><Plus size={16}/>New task</button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {columns.map(column => (
          <div key={column.id} className="w-80 flex-shrink-0 bg-bg-secondary rounded-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-semibold text-text-primary">{column.title}</h3>
                <span className="text-xs font-medium bg-background text-text-secondary rounded-full px-2 py-0.5">{column.tasks.length}</span>
              </div>
              <button className="text-text-secondary hover:text-text-primary"><MoreHorizontal size={18}/></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {column.tasks.map(task => (
                <Card key={task.id} className="bg-surface cursor-pointer">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-semibold text-text-primary">{task.title}</p>
                    <span className="text-xs text-text-muted font-mono bg-bg-secondary px-1.5 py-0.5 rounded">{task.id}</span>
                  </div>
                  {task.description && <p className="text-sm text-text-secondary mt-2">{task.description}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                      {task.dueDate && <span className={`text-xs ${task.overdue ? 'text-error' : 'text-text-secondary'}`}>Due: {task.dueDate}</span>}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold border-2 border-background">{task.assignee}</div>
                  </div>
                </Card>
              ))}
              <button className="w-full text-sm flex items-center justify-center gap-2 p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                <Plus size={16} /> Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

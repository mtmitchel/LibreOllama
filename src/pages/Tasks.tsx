import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  CircleDashed,
  LoaderCircle,
  CheckCircle,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate?: string;
  project?: string;
  overdue?: boolean;
}

interface Column {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  tasks: Task[];
}

const Tasks: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'TSK-101',
      title: 'Design new logo concepts',
      description: 'Create 3 initial logo concepts for the upcoming branding refresh. Focus on modern and clean aesthetics.',
      status: 'todo',
      priority: 'high',
      assignee: 'AK',
      dueDate: 'Yesterday',
      project: 'Branding',
      overdue: true
    },
    {
      id: 'TSK-102',
      title: 'Write Q3 blog post series outline',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'SM',
      project: 'Content'
    },
    {
      id: 'TSK-103',
      title: 'Develop user authentication flow',
      description: 'Implement OAuth 2.0 and password-based login.',
      status: 'in-progress',
      priority: 'high',
      assignee: 'LU',
      dueDate: 'Jul 28',
      project: 'App V2'
    },
    {
      id: 'TSK-104',
      title: 'Setup CI/CD pipeline',
      description: '',
      status: 'done',
      priority: 'medium',
      assignee: 'AK',
      project: 'DevOps'
    },
    {
      id: 'TSK-105',
      title: 'User interviews round 1',
      description: '',
      status: 'done',
      priority: 'low',
      assignee: 'SM',
      project: 'Research'
    }
  ]);

  const columns: Column[] = [
    {
      id: 'todo',
      title: 'To do',
      icon: <CircleDashed className="w-[18px] h-[18px]" />,
      iconColor: 'var(--text-muted)',
      tasks: tasks.filter(task => task.status === 'todo')
    },
    {
      id: 'in-progress',
      title: 'In progress',
      icon: <LoaderCircle className="w-[18px] h-[18px]" />,
      iconColor: 'var(--accent-primary)',
      tasks: tasks.filter(task => task.status === 'in-progress')
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle className="w-[18px] h-[18px]" />,
      iconColor: 'var(--success)',
      tasks: tasks.filter(task => task.status === 'done')
    }
  ];

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'kanban-task-priority high';
      case 'medium': return 'kanban-task-priority medium';
      case 'low': return 'kanban-task-priority low';
      default: return 'kanban-task-priority medium';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--warning)';
    }
  };

  const addNewTask = (columnId: string) => {
    const newTask: Task = {
      id: `TSK-${Date.now()}`,
      title: 'New Task',
      description: 'Task description',
      status: columnId as 'todo' | 'in-progress' | 'done',
      priority: 'medium',
      assignee: 'AK',
      project: 'General'
    };
    setTasks([...tasks, newTask]);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewTask = () => {
    addNewTask('todo');
  };

  // Set page-specific header props when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "My tasks",
      primaryAction: {
        label: 'New task',
        onClick: handleNewTask,
        icon: <Plus size={16} />
      },
      secondaryActions: [
        {
          label: view === 'kanban' ? 'Switch to List' : 'Switch to Kanban',
          onClick: () => setView(view === 'kanban' ? 'list' : 'kanban'),
          variant: 'ghost' as const
        }
      ]
    });

    // Clean up header props when component unmounts
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, view, handleNewTask]);

  return (
    <div className="w-full">
      {/* Kanban Board View */}
      {view === 'kanban' && (
        <div className="flex overflow-x-auto gap-6 pb-4">
          {columns.map(column => (
            <Card key={column.id} className="w-80 flex-shrink-0" padding="none">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: column.iconColor }}>
                    {React.cloneElement(column.icon as React.ReactElement, { style: { color: column.iconColor } })}
                    <span>{column.title}</span>
                    <span className="bg-bg-surface text-text-secondary text-xs px-2 py-1 rounded-full ml-1">{column.tasks.length}</span>
                  </div>
                  <button className="p-1 hover:bg-bg-surface rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 space-y-3">
                {column.tasks.map(task => (
                  <Card
                    key={task.id}
                    className={`hover:shadow-sm transition-all duration-200 cursor-pointer group ${task.status === 'done' ? 'opacity-70' : 'opacity-100'} bg-surface`}
                    padding="none"
                  >
                    {/* Task content with proper padding */}
                    <div className="p-4">
                      {/* Header section with improved layout */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-text-primary leading-tight flex-1 pr-2">{task.title}</h3>
                        {task.id && <span className="text-xs text-text-secondary flex-shrink-0 font-mono">{task.id}</span>}
                      </div>
                      
                      {/* Description with better spacing */}
                      {task.description && (
                        <p className="text-sm text-text-secondary mb-4 leading-relaxed">{task.description}</p>
                      )}
                      
                      {/* Footer section with improved layout */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {/* Priority badge with better styling */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          
                          {/* Due date with better styling */}
                          {task.dueDate && (
                            <span className={`text-xs font-medium ${
                              task.overdue ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-text-secondary'
                            }`}>
                              Due: {task.dueDate}
                            </span>
                          )}
                        </div>
                        
                        {/* Assignee avatar with better styling */}
                        <div className="w-7 h-7 bg-bg-surface rounded-full flex items-center justify-center text-xs font-medium text-text-primary flex-shrink-0 ml-2">
                          {task.assignee}
                        </div>
                      </div>
                    </div>
                    
                    {/* Project tag at bottom if exists */}
                    {task.project && (
                      <div className="px-4 pb-3">
                        <span className="inline-flex items-center text-xs text-text-secondary bg-bg-surface px-2 py-1 rounded">
                          {task.project}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              
              <div className="p-6 pt-4">
                <button
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-lg border border-dashed border-border-subtle hover:border-border-primary transition-colors"
                  onClick={() => addNewTask(column.id)}
                >
                  <Plus className="w-4 h-4" />
                  Add task
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    <input type="checkbox" className="rounded-sm" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Assignee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    <MoreHorizontal className="w-4 h-4" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded-sm" />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-text-primary">{task.title}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary capitalize">
                      {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        ></span>
                        {task.priority}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{task.dueDate || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="w-7 h-7 bg-bg-surface rounded-full flex items-center justify-center text-xs font-medium text-text-primary">
                        {task.assignee}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{task.project || '-'}</td>
                    <td className="py-3 px-4">
                      <button className="p-1 hover:bg-bg-surface rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Tasks;

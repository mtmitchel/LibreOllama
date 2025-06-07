import React, { useState } from 'react';
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
import { PageLayout } from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';

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

  const headerProps = {
    title: "My tasks",
    primaryAction: {
      label: 'New task',
      onClick: handleNewTask,
      icon: <Plus size={16} />
    },
    viewSwitcher: (
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            view === 'kanban' 
              ? 'bg-primary text-white' 
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-surface'
          }`}
          onClick={() => setView('kanban')}
        >
          <LayoutGrid className="w-4 h-4 mr-2 inline" />
          Kanban
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            view === 'list' 
              ? 'bg-primary text-white' 
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-surface'
          }`}
          onClick={() => setView('list')}
        >
          <List className="w-4 h-4 mr-2 inline" />
          List
        </button>
      </div>
    )
  };

  return (
    <PageLayout headerProps={headerProps}>

      {/* Kanban Board View */}
      {view === 'kanban' && (
        <div className="flex overflow-x-auto gap-6 pb-4">
          {columns.map(column => (
            <Card as="li" key={column.id} className="w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: column.iconColor }}>
                  {React.cloneElement(column.icon as React.ReactElement, { style: { color: column.iconColor } })}
                  <span>{column.title}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full ml-1">{column.tasks.length}</span>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="kanban-column-content">
                {column.tasks.map(task => (
                  <Card
                    key={task.id} 
                    className={`mb-3 hover:shadow-sm transition-all duration-200 cursor-pointer group ${task.status === 'done' ? 'opacity-70' : 'opacity-100'}`}
                    padding="none"
                  >
                    {/* Task content with proper padding */}
                    <div className="p-4">
                      {/* Header section with improved layout */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-tight flex-1 pr-2">{task.title}</h3>
                        {task.id && <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-mono">{task.id}</span>}
                      </div>
                      
                      {/* Description with better spacing */}
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{task.description}</p>
                      )}
                      
                      {/* Footer section with improved layout */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {/* Priority badge with better styling */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                            task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          }`}>
                            {task.priority}
                          </span>
                          
                          {/* Due date with better styling */}
                          {task.dueDate && (
                            <span className={`text-xs font-medium ${
                              task.overdue ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Due: {task.dueDate}
                            </span>
                          )}
                        </div>
                        
                        {/* Assignee avatar with better styling */}
                        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">
                          {task.assignee}
                        </div>
                      </div>
                    </div>
                    
                    {/* Project tag at bottom if exists */}
                    {task.project && (
                      <div className="px-4 pb-3">
                        <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                          {task.project}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              <div className="mt-4">
                <button 
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
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
        <div className="task-list-view block">
          <table className="task-list-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="rounded-sm" /></th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Project</th>
                <th><MoreHorizontal /></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td><input type="checkbox" className="rounded-sm" /></td>
                  <td>{task.title}</td>
                  <td className="capitalize">
                    {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                  </td>
                  <td>
                    <span 
                      className="priority-dot w-2 h-2 rounded-full inline-block mr-2"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    ></span>
                    {task.priority}
                  </td>
                  <td>{task.dueDate || '-'}</td>
                  <td>
                    <span className="assignee-avatar-sm">{task.assignee}</span>
                  </td>
                  <td>{task.project || '-'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm">
                      <MoreHorizontal />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};

export default Tasks;

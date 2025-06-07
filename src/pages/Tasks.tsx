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
        <div className="kanban-board-wrapper">
          {columns.map(column => (
            <Card as="li" key={column.id} className="kanban-column w-80 flex-shrink-0">
              <div className="kanban-column-header">
                <div className="kanban-column-title" style={{ color: column.iconColor }}>
                  {React.cloneElement(column.icon as React.ReactElement, { style: { color: column.iconColor } })}
                  {column.title}
                </div>
                <span className="kanban-column-count">{column.tasks.length}</span>
                <button className="btn btn-ghost btn-sm">
                  <MoreHorizontal />
                </button>
              </div>
              <div className="kanban-column-content">
                {column.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`kanban-task ${task.status === 'done' ? 'opacity-70' : 'opacity-100'}`}
                  >
                    <div className="kanban-task-header">
                      <div className="kanban-task-title">{task.title}</div>
                      {task.id && <div className="kanban-task-id">{task.id}</div>}
                    </div>
                    {task.description && (
                      <div className="kanban-task-description">{task.description}</div>
                    )}
                    <div className="kanban-task-footer">
                      <div className="kanban-task-meta">
                        <span className={getPriorityClass(task.priority)}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`kanban-task-due ${task.overdue ? 'overdue' : ''}`}>
                            Due: {task.dueDate}
                          </span>
                        )}
                      </div>
                      <div className="kanban-task-assignee">{task.assignee}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-task-btn-wrapper">
                <button 
                  className="btn add-task-btn btn-sm"
                  onClick={() => addNewTask(column.id)}
                >
                  <Plus />
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

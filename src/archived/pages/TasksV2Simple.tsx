import React, { useEffect, useState } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Button, LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { SimpleKanbanBoard } from '../../components/tasks/SimpleKanbanBoard';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { QuickAddTask } from '../../components/tasks/QuickAddTask';
import { useGoogleTasksStoreV2 } from '../../stores/useGoogleTasksStoreV2';
import { useTaskMetadataStore } from '../../stores/useTaskMetadataStore';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { 
  RefreshCw, 
  Plus, 
  Search,
  Filter,
  Settings
} from 'lucide-react';

export default function TasksV2Simple() {
  const { setHeaderProps } = useHeader();
  const [selectedTask, setSelectedTask] = useState<{ task: tasks_v1.Schema$Task; listId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get data from stores
  const taskLists = useGoogleTasksStoreV2(state => state.taskLists);
  const allTasks = useGoogleTasksStoreV2(state => state.tasks);
  const allLabels = useTaskMetadataStore(state => state.getAllLabels());
  
  // Set up header
  useEffect(() => {
    setHeaderProps({
      title: 'Tasks',
      secondaryActions: [
        {
          label: 'Refresh',
          icon: <RefreshCw className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement refresh
            console.log('Refresh tasks');
          },
          variant: 'ghost'
        },
        {
          label: 'Filter',
          icon: <Filter className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement filter
          },
          variant: 'ghost'
        },
        {
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement settings
          },
          variant: 'ghost'
        }
      ]
    });
  }, [setHeaderProps]);
  
  // Filter tasks based on search
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery) return allTasks;
    
    const filtered: Record<string, tasks_v1.Schema$Task[]> = {};
    const query = searchQuery.toLowerCase();
    
    Object.entries(allTasks).forEach(([listId, tasks]) => {
      filtered[listId] = tasks.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
      );
    });
    
    return filtered;
  }, [allTasks, searchQuery]);
  
  // Mock data for development
  const mockTaskLists: tasks_v1.Schema$TaskList[] = [
    { id: '1', title: 'Personal' },
    { id: '2', title: 'Work' },
    { id: '3', title: 'Shopping' }
  ];
  
  const mockTasks: Record<string, tasks_v1.Schema$Task[]> = {
    '1': [
      { id: '1-1', title: 'Buy groceries', status: 'needsAction' },
      { id: '1-2', title: 'Call dentist', status: 'needsAction', due: new Date().toISOString() },
      { id: '1-3', title: 'Workout', status: 'completed' }
    ],
    '2': [
      { id: '2-1', title: 'Finish project proposal', status: 'needsAction', notes: 'Due by end of week' },
      { id: '2-2', title: 'Team meeting', status: 'needsAction', due: new Date().toISOString() }
    ],
    '3': [
      { id: '3-1', title: 'Milk', status: 'needsAction' },
      { id: '3-2', title: 'Bread', status: 'needsAction' },
      { id: '3-3', title: 'Eggs', status: 'needsAction' }
    ]
  };
  
  // Use mock data if no real data
  const displayTaskLists = taskLists.length > 0 ? taskLists : mockTaskLists;
  const displayTasks = Object.keys(allTasks).length > 0 ? filteredTasks : mockTasks;
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search Bar */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {displayTaskLists.length > 0 && (
            <QuickAddTask
              taskListId={displayTaskLists[0].id!}
              allLabels={allLabels}
            />
          )}
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-auto">
        {displayTaskLists.length === 0 ? (
          <EmptyState
            title="No task lists found"
            message="Create your first task list to get started"
            icon="📋"
            action={{
              label: 'Create Task List',
              onClick: () => console.log('Create task list')
            }}
          />
        ) : (
          <SimpleKanbanBoard
            taskLists={displayTaskLists}
            allTasks={displayTasks}
            onTaskClick={(task, listId) => setSelectedTask({ task, listId })}
          />
        )}
      </div>
      
      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask.task}
          taskListId={selectedTask.listId}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          allLabels={allLabels}
        />
      )}
    </div>
  );
}
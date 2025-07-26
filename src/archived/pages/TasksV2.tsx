import React, { useEffect, useState } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Button, LoadingState, ErrorState } from '../../components/ui';
import { SimpleKanbanBoard } from '../../components/tasks/SimpleKanbanBoard';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { QuickAddTask } from '../../components/tasks/QuickAddTask';
import { useTaskLists, useAllLabels } from '../../hooks/useGoogleTasks';
import { useAllTasks } from '../../hooks/useAllTasks';
import { useGoogleTasksStoreV2 } from '../../stores/useGoogleTasksStoreV2';
import { initGapiClient } from '../../api/googleTasksApi';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { 
  LayoutGrid, 
  RefreshCw, 
  Plus, 
  Search,
  Filter,
  Settings
} from 'lucide-react';

export default function TasksV2() {
  const { setHeaderProps } = useHeader();
  const [selectedTask, setSelectedTask] = useState<{ task: tasks_v1.Schema$Task; listId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Get data from stores
  const taskLists = useGoogleTasksStoreV2(state => state.taskLists);
  const allTasks = useGoogleTasksStoreV2(state => state.tasks);
  const allLabels = useAllLabels();
  
  // Queries
  const { isLoading: isLoadingLists, error: listsError, refetch: refetchLists } = useTaskLists();
  const { isLoading: isLoadingTasks, error: tasksError, refetchAll: refetchTasks } = useAllTasks();
  
  // Initialize Google API
  useEffect(() => {
    const initializeGapi = async () => {
      try {
        // TODO: Get API key and client ID from settings
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        if (!apiKey || !clientId) {
          setInitError('Google API credentials not configured');
          return;
        }
        
        await initGapiClient(apiKey, clientId);
        setIsInitialized(true);
      } catch (error) {
        setInitError('Failed to initialize Google API');
        console.error('Failed to initialize Google API:', error);
      }
    };
    
    initializeGapi();
  }, []);
  
  // Set up header
  useEffect(() => {
    setHeaderProps({
      title: 'Tasks',
      secondaryActions: [
        {
          label: 'Refresh',
          icon: <RefreshCw className="h-4 w-4" />,
          onClick: () => {
            refetchLists();
            refetchTasks();
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
  
  if (initError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorState
          title="Initialization Error"
          message={initError}
        />
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingState text="Initializing Google Tasks..." />
      </div>
    );
  }
  
  if (listsError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorState
          title="Failed to load task lists"
          message={listsError.message}
          onRetry={() => refetchLists()}
        />
      </div>
    );
  }
  
  if (isLoadingLists || isLoadingTasks) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingState text={isLoadingLists ? "Loading task lists..." : "Loading tasks..."} />
      </div>
    );
  }
  
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
          {taskLists.length > 0 && (
            <QuickAddTask
              taskListId={taskLists[0].id!}
              allLabels={allLabels}
            />
          )}
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-auto">
        {taskLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 text-5xl">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No task lists found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first task list to get started
            </p>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Task List
            </Button>
          </div>
        ) : (
          <SimpleKanbanBoard
            taskLists={taskLists}
            allTasks={filteredTasks}
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
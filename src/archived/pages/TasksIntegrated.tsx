import React, { useEffect, useState } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Button, LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { SimpleKanbanBoard } from '../../components/tasks/SimpleKanbanBoard';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { QuickAddTask } from '../../components/tasks/QuickAddTask';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { useTaskMetadataStore } from '../../stores/taskMetadataStore';
import { useGoogleTasksIntegration } from '../../hooks/useGoogleTasksIntegration';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { 
  RefreshCw, 
  Plus, 
  Search,
  Filter,
  Settings,
  AlertCircle
} from 'lucide-react';
import { logger } from '../../core/lib/logger';

export default function TasksIntegrated() {
  const { setHeaderProps } = useHeader();
  const [selectedTask, setSelectedTask] = useState<{ task: tasks_v1.Schema$Task; listId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const account = useActiveGoogleAccount();
  const { hasTasksAccess } = useGoogleTasksIntegration();
  
  // Get data from the existing Google Tasks store
  const {
    taskLists,
    tasks,
    isLoading,
    error,
    fetchTaskLists,
    syncAllTasks
  } = useGoogleTasksStore();
  
  // Get all unique labels from metadata
  const allLabels = React.useMemo(() => {
    try {
      const metadata = useTaskMetadataStore.getState().metadata;
      const labelSet = new Set<string>();
      
      // Handle both Map and object formats
      if (metadata instanceof Map) {
        metadata.forEach((meta) => {
          meta.labels?.forEach(label => labelSet.add(label));
        });
      } else if (typeof metadata === 'object') {
        Object.values(metadata).forEach((meta: any) => {
          meta.labels?.forEach((label: string) => labelSet.add(label));
        });
      }
      
      return Array.from(labelSet).sort();
    } catch (error) {
      console.error('Error getting labels:', error);
      return [];
    }
  }, []);
  
  // Set up header
  useEffect(() => {
    setHeaderProps({
      title: 'Tasks',
      secondaryActions: [
        {
          label: 'Refresh',
          icon: <RefreshCw className="h-4 w-4" />,
          onClick: async () => {
            if (account?.id) {
              await syncAllTasks();
            }
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
  }, [setHeaderProps, account?.id]);
  
  // Initialize tasks when component mounts
  useEffect(() => {
    if (account?.id && hasTasksAccess) {
      logger.info('[TasksIntegrated] Fetching task lists...');
      fetchTaskLists(account.id);
    }
  }, [account?.id, hasTasksAccess]);
  
  // Filter tasks based on search
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery) return tasks;
    
    const filtered: Record<string, tasks_v1.Schema$Task[]> = {};
    const query = searchQuery.toLowerCase();
    
    Object.entries(tasks).forEach(([listId, taskList]) => {
      filtered[listId] = taskList.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
      );
    });
    
    return filtered;
  }, [tasks, searchQuery]);
  
  // Convert to the expected format
  const formattedTaskLists: tasks_v1.Schema$TaskList[] = taskLists.map(list => ({
    id: list.id,
    title: list.title,
    updated: list.updated,
    selfLink: list.selfLink,
    etag: list.etag,
    kind: list.kind
  }));
  
  const formattedTasks: Record<string, tasks_v1.Schema$Task[]> = {};
  Object.entries(filteredTasks).forEach(([listId, taskList]) => {
    formattedTasks[listId] = taskList.map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      status: task.status as 'needsAction' | 'completed' | undefined,
      due: task.due,
      completed: task.completed,
      deleted: task.deleted,
      hidden: task.hidden,
      parent: task.parent,
      position: task.position,
      selfLink: task.selfLink,
      etag: task.etag,
      kind: task.kind,
      updated: task.updated
    }));
  });
  
  // Show auth prompt if not authenticated
  if (!account) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          title="Sign in to access Google Tasks"
          message="Please sign in with your Google account to view and manage your tasks"
          icon="🔐"
          action={{
            label: 'Go to Settings',
            onClick: () => window.location.href = '/settings'
          }}
        />
      </div>
    );
  }
  
  // Show scope error if Tasks access not granted
  if (!hasTasksAccess) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tasks Access Required</h3>
          <p className="text-secondary mb-4">
            Your account doesn't have access to Google Tasks. Please re-authenticate and grant Tasks permissions.
          </p>
          <Button
            onClick={() => window.location.href = '/settings'}
            variant="primary"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <ErrorState
          title="Failed to load tasks"
          message={error}
          onRetry={() => account?.id && fetchTaskLists(account.id)}
        />
      </div>
    );
  }
  
  if (isLoading && taskLists.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <LoadingState text="Loading your tasks..." />
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
          {formattedTaskLists.length > 0 && (
            <QuickAddTask
              taskListId={formattedTaskLists[0].id!}
              allLabels={allLabels}
            />
          )}
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-auto">
        {formattedTaskLists.length === 0 ? (
          <EmptyState
            title="No task lists found"
            message="Create your first task list in Google Tasks to get started"
            icon="📋"
          />
        ) : (
          <SimpleKanbanBoard
            taskLists={formattedTaskLists}
            allTasks={formattedTasks}
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
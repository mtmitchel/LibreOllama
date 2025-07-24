import React, { useEffect, useState } from 'react';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { kanbanGoogleSync, setupAutoSync } from '../../services/kanbanGoogleTasksSync';

type ViewMode = 'kanban' | 'list';

export default function Tasks() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const activeAccount = useActiveGoogleAccount();
  const {
    isAuthenticated,
    isHydrated,
    authenticate,
    fetchTaskLists,
    syncAllTasks,
  } = useGoogleTasksStore();

  // Setup header when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Tasks"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  // Auto-authenticate with Google Tasks
  useEffect(() => {
    if (activeAccount && !isAuthenticated && isHydrated) {
      authenticate(activeAccount as any);
    }
  }, [activeAccount, isAuthenticated, isHydrated, authenticate]);

  // Setup auto-sync when authenticated
  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      setupAutoSync();
      // Initial sync - fetch task lists first, then sync
      const performInitialSync = async () => {
        try {
          await fetchTaskLists();
          await syncAllTasks();
          await kanbanGoogleSync.setupColumnMappings();
          await kanbanGoogleSync.syncAll();
        } catch (error) {
          // Initial sync failed - handled by sync service
        }
      };
      performInitialSync();
    }
  }, [isAuthenticated, isHydrated, fetchTaskLists, syncAllTasks]);

  // Persist view mode preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('tasks-view-mode') as ViewMode;
    if (savedViewMode && (savedViewMode === 'kanban' || savedViewMode === 'list')) {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('tasks-view-mode', mode);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Fetch latest from Google
      await fetchTaskLists();
      await syncAllTasks();
      // Recreate columns based on Google Task lists
      await kanbanGoogleSync.setupColumnMappings();
      // Sync tasks
      await kanbanGoogleSync.syncAll();
    } catch (error) {
      // Sync failed - handled by sync service
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* View Toggle */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              Sync with Google
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-tertiary rounded-lg">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('kanban')}
            className="flex items-center gap-2 px-3 py-2"
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
            className="flex items-center gap-2 px-3 py-2"
          >
            <List size={16} />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 p-6 pt-4">
        {viewMode === 'kanban' ? (
          <KanbanBoard className="h-full" />
        ) : (
          <TaskListView className="h-full" />
        )}
      </div>

      {/* Sync Status */}
      {isAuthenticated && (
        <div className="px-6 pb-2 text-xs text-gray-500 text-center">
          Connected to Google Tasks • Auto-sync enabled
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import { LayoutGrid, List, RefreshCw, Plus, Search, X, ArrowUpDown, ChevronDown, GripVertical, Calendar, Type } from 'lucide-react';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { kanbanGoogleSync, setupAutoSync } from '../../services/kanbanGoogleTasksSync';
import { useKanbanStore } from '../../stores/useKanbanStore';

type ViewMode = 'kanban' | 'list';

export default function Tasks() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'due' | 'title'>('created');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  const activeAccount = useActiveGoogleAccount();
  const {
    isAuthenticated,
    isHydrated,
    authenticate,
    fetchTaskLists,
    syncAllTasks,
    createTaskList,
    updateTaskList,
    deleteTaskList,
  } = useGoogleTasksStore();
  
  const { columns } = useKanbanStore();
  
  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortMenu]);

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

  // Handle create new list
  const handleCreateList = async () => {
    if (!newListTitle.trim() || isCreatingList) return;
    
    setIsCreatingList(true);
    try {
      await createTaskList(newListTitle.trim());
      setNewListTitle("");
      setShowNewListDialog(false);
      
      // Sync the new list to Kanban columns
      await fetchTaskLists();
      await kanbanGoogleSync.setupColumnMappings();
    } catch (error) {
      console.error('Failed to create task list:', error);
      alert('Failed to create task list. Please try again.');
    } finally {
      setIsCreatingList(false);
    }
  };

  // Handle rename list
  const handleRenameList = async (listId: string, newTitle: string) => {
    try {
      await updateTaskList(listId, newTitle);
      
      // Sync the renamed list to Kanban columns
      await fetchTaskLists();
      await kanbanGoogleSync.setupColumnMappings();
    } catch (error) {
      console.error('Failed to rename task list:', error);
    }
  };

  // Handle delete list
  const handleDeleteList = async (listId: string) => {
    if (window.confirm("Are you sure you want to delete this task list? This action cannot be undone.")) {
      try {
        await deleteTaskList(listId);
        
        // Sync the deletion to Kanban columns
        await fetchTaskLists();
        await kanbanGoogleSync.setupColumnMappings();
      } catch (error) {
        console.error('Failed to delete task list:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              console.log('New List button clicked, isAuthenticated:', isAuthenticated);
              if (!isAuthenticated) {
                alert('Please connect your Google account in Settings to create task lists.');
                return;
              }
              setShowNewListDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2"
            disabled={!isAuthenticated}
          >
            <Plus size={16} />
            New List
          </Button>
          
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted bg-accent-soft px-3 py-1.5 rounded-full">
              <RefreshCw size={14} className="animate-spin" />
              <span>Syncing tasks...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-border-default text-primary h-8 w-full rounded-md border pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </Button>
            )}
          </div>
          
          {/* List View Controls - only show in list view */}
          {viewMode === 'list' && (
            <>
              {/* Task Count */}
              <span className="text-sm text-secondary bg-card px-3 py-1.5 rounded-full font-medium">
                {columns.flatMap(c => c.tasks).filter(task => 
                  selectedListId === 'all' || columns.find(c => c.id === selectedListId)?.tasks.includes(task)
                ).length} tasks
              </span>
              
              {/* List Filter */}
              <div className="relative">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="h-8 pl-3 pr-8 text-sm border border-border-default rounded-lg bg-card text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">All lists</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
              </div>
              
              {/* Sort Menu */}
              <div className="relative" ref={sortMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-2 hover:bg-tertiary"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <ArrowUpDown size={14} />
                  <span className="text-sm">Sort</span>
                </Button>
                
                {showSortMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border-default bg-card shadow-lg">
                    <button
                      onClick={() => {
                        setSortBy('created');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary first:rounded-t-lg ${
                        sortBy === 'created' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <GripVertical size={14} className="mr-2" />
                      Date created
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('due');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary ${
                        sortBy === 'due' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <Calendar size={14} className="mr-2" />
                      Due date
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('title');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary last:rounded-b-lg ${
                        sortBy === 'title' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <Type size={14} className="mr-2" />
                      Title
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
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
      </div>

      {/* View Content */}
      <div className="flex-1 p-6 pt-0">
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            className="h-full" 
            searchQuery={searchQuery}
            onDeleteList={handleDeleteList}
            onRenameList={handleRenameList}
          />
        ) : (
          <TaskListView 
            className="h-full" 
            searchQuery={searchQuery}
            showHeader={false}
            selectedListId={selectedListId}
            sortBy={sortBy}
          />
        )}
      </div>

      {/* Sync Status */}
      {isAuthenticated && (
        <div className="px-6 pb-2 text-xs text-gray-500 text-center">
          Connected to Google Tasks • Auto-sync enabled
        </div>
      )}

      {/* New List Dialog */}
      {showNewListDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border-default rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primary mb-2">Create New Task List</h3>
              <p className="text-sm text-muted mb-4">Give your task list a descriptive name to help organize your work.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    List name
                  </label>
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="e.g., Personal Tasks, Work Projects, Shopping..."
                    className="w-full px-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateList();
                      } else if (e.key === 'Escape') {
                        setShowNewListDialog(false);
                        setNewListTitle("");
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowNewListDialog(false);
                      setNewListTitle("");
                    }}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateList}
                    disabled={!newListTitle.trim() || isCreatingList}
                    className="px-4 py-2"
                  >
                    {isCreatingList ? (
                      <>
                        <RefreshCw size={14} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create List'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
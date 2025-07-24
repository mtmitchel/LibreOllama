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
    <div className="flex h-full flex-col">
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
            <div className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm text-muted">
              <RefreshCw size={14} className="animate-spin" />
              <span>Syncing tasks...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative max-w-md flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border-default focus:ring-primary/20 h-8 w-full rounded-md border bg-card pl-9 pr-3 text-sm text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
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
              <span className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-secondary">
                {columns.flatMap(c => c.tasks).filter(task => 
                  selectedListId === 'all' || columns.find(c => c.id === selectedListId)?.tasks.includes(task)
                ).length} tasks
              </span>
              
              {/* List Filter */}
              <div className="relative">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="border-border-default focus:ring-primary/20 h-8 cursor-pointer appearance-none rounded-lg border bg-card pl-3 pr-8 text-sm text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2"
                >
                  <option value="all">All lists</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-secondary" />
              </div>
              
              {/* Sort Menu */}
              <div className="relative" ref={sortMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-8 items-center gap-2 px-3 hover:bg-tertiary"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <ArrowUpDown size={14} />
                  <span className="text-sm">Sort</span>
                </Button>
                
                {showSortMenu && (
                  <div className="border-border-default absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card shadow-lg">
                    <button
                      onClick={() => {
                        setSortBy('created');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-tertiary ${
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
                      className={`flex w-full items-center px-3 py-2 text-sm last:rounded-b-lg hover:bg-tertiary ${
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
          
          <div className="flex items-center gap-1 rounded-lg bg-tertiary p-1">
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
        <div className="px-6 pb-2 text-center text-xs text-gray-500">
          Connected to Google Tasks • Auto-sync enabled
        </div>
      )}

      {/* New List Dialog */}
      {showNewListDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border-default w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary">Create New Task List</h3>
              <p className="mb-4 text-sm text-muted">Give your task list a descriptive name to help organize your work.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    List name
                  </label>
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="e.g., Personal Tasks, Work Projects, Shopping..."
                    className="border-border-default focus:ring-primary/20 w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:outline-none focus:ring-2"
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
                        <RefreshCw size={14} className="mr-2 animate-spin" />
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
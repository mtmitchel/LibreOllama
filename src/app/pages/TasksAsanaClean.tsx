import React, { useEffect, useState, useRef } from 'react';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import './styles/TasksAsanaClean.css';
import { 
  LayoutGrid, List, RefreshCw, Plus, Search, X, ArrowUpDown, ChevronDown, 
  GripVertical, Calendar, Type, RotateCcw
} from 'lucide-react';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { realtimeSync } from '../../services/realtimeSync';

type ViewMode = 'kanban' | 'list';

export default function TasksAsanaClean() {
  const { clearHeaderProps } = useHeader();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [showDeleteListDialog, setShowDeleteListDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<{ id: string; title: string } | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'due' | 'title'>('created');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const activeAccount = useActiveGoogleAccount();
  const isAuthenticated = !!activeAccount;

  const { columns, createTask, deleteColumn, updateColumn } = useUnifiedTaskStore();

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

  useEffect(() => {
    clearHeaderProps();
    realtimeSync.initialize().catch(console.error);
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  useEffect(() => {
    if (activeAccount) {
      handleSync();
    }
  }, [activeAccount]);

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
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync tasks. Please check your Google account permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    
    setIsCreatingList(true);
    try {
      // This should be handled by the backend now
      // await createTaskList(newListTitle.trim());
      setNewListTitle("");
      setShowNewListDialog(false);
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Failed to create task list:', error);
      alert('Failed to create task list. Please try again.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    if (!activeAccount) {
      alert('Please sign in with Google to rename task lists');
      return;
    }
    
    try {
      updateColumn(listId, { title: newTitle });
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Failed to rename task list:', error);
      alert('Failed to rename list. Please try again.');
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete || !activeAccount) {
      alert('Please sign in with Google to delete task lists');
      return;
    }
    
    try {
      deleteColumn(listToDelete.id);
      setShowDeleteListDialog(false);
      setListToDelete(null);
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Failed to delete task list:', error);
      alert('Failed to delete list. Please try again.');
    }
  };

  const openDeleteListDialog = (listId: string, listTitle: string) => {
    setListToDelete({ id: listId, title: listTitle });
    setShowDeleteListDialog(true);
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC' }}>
      {/* Header Controls */}
      <div className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
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
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md outline-none transition-all"
              style={{ 
                fontSize: '14px',
                backgroundColor: '#F6F7F8',
                border: '1px solid transparent',
                width: '240px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
                e.currentTarget.style.borderColor = 'transparent';
              }}
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
          
          {/* List View Controls */}
          {viewMode === 'list' && (
            <>
              <span className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-secondary">
                {columns.flatMap(c => c.taskIds).length} tasks
              </span>
              
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
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            className="h-full"
            searchQuery={searchQuery}
            onDeleteList={openDeleteListDialog}
            onRenameList={handleRenameList}
          />
        ) : (
          <TaskListView 
            className="h-full" 
            searchQuery={searchQuery}
            showHeader={false}
            selectedListId={selectedListId}
            sortBy={sortBy}
            onEditTask={() => {}}
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

      {/* Delete List Dialog */}
      {showDeleteListDialog && listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border-default w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary">Delete Task List</h3>
              <p className="mb-4 text-sm text-muted">
                Are you sure you want to delete "{listToDelete.title}"? This action cannot be undone and all tasks in this list will be permanently removed.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteListDialog(false);
                    setListToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteList}
                >
                  Delete List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

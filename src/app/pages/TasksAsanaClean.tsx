import React, { useEffect, useState, useRef } from 'react';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { TaskSidePanel } from '../../components/tasks';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import './styles/TasksAsanaClean.css';
import '../../styles/asana-tokens.css';
import '../../styles/asana-design-system.css';
import { 
  LayoutGrid, List, RefreshCw, Plus, Search, X, ArrowUpDown, ChevronDown, 
  GripVertical, Calendar, Type, RotateCcw, Filter, MoreHorizontal, Eye, EyeOff
} from 'lucide-react';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { realtimeSync } from '../../services/realtimeSync';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';

type ViewMode = 'kanban' | 'list';

export default function TasksAsanaClean() {
  const { clearHeaderProps } = useHeader();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tasks-view-mode') as ViewMode;
    return saved === 'list' || saved === 'kanban' ? saved : 'kanban';
  });
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
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);

  const activeAccount = useActiveGoogleAccount();
  const isAuthenticated = !!activeAccount;

  const { columns, createTask, deleteColumn, updateColumn, updateTask, deleteTask, tasks } = useUnifiedTaskStore();

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

  // Remove this useEffect as it's redundant and might be causing issues
  // The initial state already handles localStorage

  const handleViewModeChange = (mode: ViewMode) => {
    console.log('Changing view mode to:', mode);
    setViewMode(mode);
    localStorage.setItem('tasks-view-mode', mode);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks[taskId];
    if (task) {
      setSelectedTask(task);
      setIsTaskPanelOpen(true);
    }
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
    <>
      {/* Header - matching UnifiedHeader style */}
      <header className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
        {/* Left side - View toggle and title */}
        <div className="flex items-center gap-4">
          {/* View toggle buttons */}
          <div className="flex items-center bg-secondary rounded-lg" style={{ 
            padding: '2px', 
            backgroundColor: '#F6F7F8'
          }}>
            <button
              type="button"
              onClick={() => {
                handleViewModeChange('kanban');
              }}
              style={{ 
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'kanban' ? '#151B26' : '#6B6F76',
                fontSize: '14px', 
                fontWeight: 500, 
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <LayoutGrid size={16} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleViewModeChange('list');
              }}
              style={{ 
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? '#151B26' : '#6B6F76',
                fontSize: '14px', 
                fontWeight: 500, 
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>
          
          {/* Page title */}
          <h1 className="text-xl font-semibold" style={{ color: '#151B26' }}>Tasks</h1>
        </div>

        {/* Center - Search */}
        <div className="relative max-w-md flex-1 mx-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl outline-none transition-all w-full"
            style={{ 
              fontSize: '14px',
              backgroundColor: '#F6F7F8',
              border: '1px solid transparent'
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
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2">
          
          {/* List View Controls */}
          {viewMode === 'list' && (
            <>
              <div className="relative">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="h-8 cursor-pointer appearance-none rounded-lg border pl-3 pr-8 text-sm transition-colors"
                  style={{
                    backgroundColor: '#F6F7F8',
                    borderColor: 'transparent',
                    color: '#151B26'
                  }}
                >
                  <option value="all">All lists</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#6B6F76' }} />
              </div>
              
              <div className="relative" ref={sortMenuRef}>
                <button
                  className="flex h-8 items-center gap-2 px-3 rounded-lg transition-colors"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  style={{
                    backgroundColor: '#F6F7F8',
                    color: '#6B6F76',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E8E9EA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F6F7F8';
                  }}
                >
                  <ArrowUpDown size={14} />
                  <span>Sort</span>
                </button>
                
                {showSortMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-white shadow-lg" style={{ borderColor: '#E8E8E9' }}>
                    <button
                      onClick={() => {
                        setSortBy('created');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50 ${
                        sortBy === 'created' ? 'bg-gray-100' : ''
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
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === 'due' ? 'bg-gray-100' : ''
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
                      className={`flex w-full items-center px-3 py-2 text-sm last:rounded-b-lg hover:bg-gray-50 ${
                        sortBy === 'title' ? 'bg-gray-100' : ''
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
          
          {/* Filter Button */}
          <button 
            className="px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: '#F6F7F8',
              color: '#6B6F76',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8E9EA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F6F7F8';
            }}
          >
            <Filter size={16} />
            Filter
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-colors"
            style={{
              backgroundColor: '#F6F7F8',
              color: '#6B6F76',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E8E9EA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F6F7F8';
            }}
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {/* Primary action button */}
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please connect your Google account in Settings to create task lists.');
                return;
              }
              // TODO: This should create a task, not a list
              setShowNewListDialog(true);
            }}
            disabled={!isAuthenticated}
            style={{
              backgroundColor: '#796EFF',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            Add task
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-full flex-col bg-sidebar">
        {/* View Content */}
        <div className="flex-1 overflow-hidden" style={{ 
        marginRight: isTaskPanelOpen ? '512px' : '0', // 480px panel + 32px gap
        transition: 'margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {viewMode === 'kanban' ? (
          <KanbanBoard
            className="h-full"
            searchQuery={searchQuery}
            onDeleteList={(listId: string) => openDeleteListDialog(listId, '')}
            onRenameList={handleRenameList}
            onEditTask={handleEditTask}
            selectedTaskId={selectedTask?.id}
            isSidePanelOpen={isTaskPanelOpen}
          />
        ) : (
          <TaskListView 
            className="h-full" 
            searchQuery={searchQuery}
            showHeader={false}
            selectedListId={selectedListId}
            sortBy={sortBy}
            onEditTask={(task: UnifiedTask, columnId: string) => handleEditTask(task.id)}
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
                  variant="destructive"
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

      {/* Task Side Panel */}
      {isTaskPanelOpen && (
        <TaskSidePanel
          task={selectedTask}
          isOpen={isTaskPanelOpen}
          onClose={() => {
            setIsTaskPanelOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={async (taskId, updates) => {
            await updateTask(taskId, updates);
            // Trigger sync to ensure changes appear in Google immediately
            realtimeSync.requestSync(500);
          }}
          onDelete={async (taskId) => {
            await deleteTask(taskId);
            setIsTaskPanelOpen(false);
            setSelectedTask(null);
            // Trigger sync to ensure deletion appears in Google immediately
            realtimeSync.requestSync(500);
          }}
        />
      )}
      </div>
    </>
  );
}

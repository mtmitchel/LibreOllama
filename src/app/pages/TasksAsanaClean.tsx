import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { TaskSidePanel } from '../../components/tasks';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui/design-system/Button';
import { FilterDropdown } from '../../components/ui/design-system';
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showQuickTaskCreator, setShowQuickTaskCreator] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const activeAccount = useActiveGoogleAccount();
  const isAuthenticated = !!activeAccount;

  const { columns, createTask, deleteColumn, updateColumn, updateTask, deleteTask, tasks } = useUnifiedTaskStore();

  // Get all unique labels from tasks
  const availableLabels = useMemo(() => {
    const labelMap = new Map<string, { name: string; color: string }>();
    Object.values(tasks).forEach(task => {
      if (task.labels && task.labels.length > 0) {
        task.labels.forEach(label => {
          if (typeof label === 'string') {
            labelMap.set(label, { name: label, color: 'gray' });
          } else {
            labelMap.set(label.name, { name: label.name, color: label.color });
          }
        });
      }
    });
    return Array.from(labelMap.values());
  }, [tasks]);

  // Filter tasks by selected labels
  const filteredTasks = useMemo(() => {
    if (selectedLabels.length === 0) return tasks;
    
    const filtered: typeof tasks = {};
    Object.entries(tasks).forEach(([id, task]) => {
      if (task.labels && task.labels.length > 0) {
        const taskLabelNames = task.labels.map(label => 
          typeof label === 'string' ? label : label.name
        );
        if (selectedLabels.some(selectedLabel => taskLabelNames.includes(selectedLabel))) {
          filtered[id] = task;
        }
      }
    });
    return filtered;
  }, [tasks, selectedLabels]);

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

  // Open a specific task when taskId is present in the URL
  useEffect(() => {
    const deepLinkId = searchParams.get('taskId');
    if (!deepLinkId) return;
    const task = tasks[deepLinkId];
    if (task) {
      setSelectedTask(task);
      setIsTaskPanelOpen(true);
    }
  }, [searchParams, tasks]);

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

  const handleQuickCreateTask = async (title: string) => {
    try {
      // Use the first column or the selected list
      const targetColumn = selectedListId !== 'all' 
        ? columns.find(c => c.id === selectedListId) 
        : columns[0];
      
      if (!targetColumn) {
        alert('Please create a task list first.');
        return;
      }

      await createTask({
        title,
        columnId: targetColumn.id,
        priority: 'none',
        labels: []
      });
      
      setShowQuickTaskCreator(false);
      await handleSync(); // Sync to show the new task
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  return (
    <>
      {/* Header - matching UnifiedHeader style */}
      <header className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: 'var(--asana-bg-primary)', borderBottom: '1px solid var(--asana-border-default)', position: 'relative', zIndex: 10 }}>
        {/* Left side - View toggle and title */}
        <div className="flex items-center gap-4">
          {/* View toggle buttons */}
          <div className="flex items-center rounded-lg" style={{ padding: '2px', backgroundColor: 'var(--asana-bg-input)' }}>
            <button
              type="button"
              onClick={() => {
                handleViewModeChange('kanban');
              }}
              style={{ 
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? 'var(--asana-bg-primary)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--asana-text-primary)' : 'var(--asana-text-secondary)',
                fontSize: '14px', 
                fontWeight: 500, 
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'kanban' ? 'var(--asana-shadow-sm)' : 'none'
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
                backgroundColor: viewMode === 'list' ? 'var(--asana-bg-primary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--asana-text-primary)' : 'var(--asana-text-secondary)',
                fontSize: '14px', 
                fontWeight: 500, 
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'list' ? 'var(--asana-shadow-sm)' : 'none'
              }}
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>
          
          {/* Page title */}
          <h1 className="text-xl font-semibold" style={{ color: 'var(--asana-text-primary)' }}>Tasks</h1>
        </div>

        {/* Center - Search */}
        <div className="relative max-w-md flex-1 mx-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--asana-text-placeholder)' }} />
          <input
            id="task-search-input"
            name="taskSearch"
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
            className="pl-10 pr-4 py-2 rounded-xl outline-none transition-all w-full"
            style={{ 
              fontSize: '14px',
              backgroundColor: 'var(--asana-bg-input)',
              border: '1px solid transparent'
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
              e.currentTarget.style.borderColor = 'var(--asana-border-hover)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[color:var(--bg-hover)] transition-colors"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 200 }}>
          
          {/* List View Controls */}
          {viewMode === 'list' && (
            <>
              <div className="relative">
                <select
                  id="task-list-filter-select"
                  name="selectedListId"
                  value={selectedListId}
                  onChange={(e) => {
                    setSelectedListId(e.target.value);
                  }}
                  aria-label="Filter tasks by list"
                  className="h-8 cursor-pointer appearance-none rounded-lg border pl-3 pr-8 text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All lists</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
                 <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--asana-text-secondary)' }} />
              </div>
              
              <div className="relative" ref={sortMenuRef}>
                <button
                  className="flex h-8 items-center gap-2 px-3 rounded-lg transition-colors"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  style={{
                    backgroundColor: 'var(--asana-bg-input)',
                    color: 'var(--asana-text-secondary)',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--state-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                  }}
                >
                  <ArrowUpDown size={14} />
                  <span>Sort</span>
                </button>
                
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white shadow-lg" style={{ borderColor: 'var(--asana-border-default)', zIndex: 1000 }}>
                    <button
                      onClick={() => {
                        setSortBy('created');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-[color:var(--bg-hover)] ${
                        sortBy === 'created' ? 'bg-[color:var(--bg-selected-bg)]' : ''
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
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-[color:var(--bg-hover)] ${
                        sortBy === 'due' ? 'bg-[color:var(--bg-selected-bg)]' : ''
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
                      className={`flex w-full items-center px-3 py-2 text-sm last:rounded-b-lg hover:bg-[color:var(--bg-hover)] ${
                        sortBy === 'title' ? 'bg-[color:var(--bg-selected-bg)]' : ''
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
            ref={filterButtonRef}
            className="px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-colors"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              backgroundColor: selectedLabels.length > 0 ? 'var(--accent-primary)' : 'var(--bg-input)',
              color: selectedLabels.length > 0 ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              fontWeight: 500,
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              if (selectedLabels.length === 0) {
                e.currentTarget.style.backgroundColor = 'var(--state-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLabels.length === 0) {
                e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
              }
            }}
          >
            <Filter size={16} />
            Filter
            {selectedLabels.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[color:var(--bg-overlay)]">
                {selectedLabels.length}
              </span>
            )}
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-colors"
            style={{
              backgroundColor: 'var(--asana-bg-input)',
              color: 'var(--asana-text-secondary)',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--state-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
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
                alert('Please connect your Google account in Settings to create tasks.');
                return;
              }
              if (columns.length === 0) {
                alert('Please create a task list first. You can do this from the Kanban view.');
                return;
              }
              setShowQuickTaskCreator(true);
            }}
            disabled={!isAuthenticated}
            style={{
              backgroundColor: 'var(--accent-primary)',
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
      <div className="flex h-full flex-col bg-sidebar" style={{ position: 'relative', zIndex: 1 }}>
        {/* View Content */}
        <div className="flex-1 overflow-hidden" style={{ 
        marginRight: isTaskPanelOpen ? '512px' : '0', // 480px panel + 32px gap
        transition: 'margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
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
            selectedLabels={selectedLabels}
          />
        ) : (
          <TaskListView 
            className="h-full" 
            searchQuery={searchQuery}
            showHeader={false}
            selectedListId={selectedListId}
            sortBy={sortBy}
            selectedLabels={selectedLabels}
            onEditTask={(task: UnifiedTask, columnId: string) => handleEditTask(task.id)}
          />
        )}
      </div>

      {/* Sync Status */}
      {isAuthenticated && (
        <div className="px-6 pb-2 text-center text-xs text-[color:var(--text-muted)]">
          Connected to Google Tasks • Auto-sync enabled
        </div>
      )}

      {/* New List Dialog */}
      {showNewListDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg-overlay)] p-4 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg-overlay)] p-4 backdrop-blur-sm">
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
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('taskId');
              return next;
            });
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

      {/* Filter Dropdown - Conditional rendering based on state */}
      {showFilterDropdown && (
        <div className="absolute z-50" style={{ top: filterButtonRef.current?.offsetTop, left: filterButtonRef.current?.offsetLeft }}>
          <FilterDropdown
            options={availableLabels.map(label => ({
              value: label.name,
              label: label.name,
              color: label.color
            }))}
            selectedValues={selectedLabels}
            onSelectionChange={setSelectedLabels}
            title="Filter by labels"
            onClose={() => setShowFilterDropdown(false)}
          />
        </div>
      )}

      {/* Quick Task Creator Modal */}
      {showQuickTaskCreator && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg-overlay)]"
          onClick={() => setShowQuickTaskCreator(false)}
        >
          <div 
            className="bg-[color:var(--bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create new task</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                if (title?.trim()) {
                  handleQuickCreateTask(title.trim());
                }
              }}
            >
              <input
                type="text"
                name="title"
                placeholder="Task title..."
                autoFocus
                className="w-full px-3 py-2 border border-[color:var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)] focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowQuickTaskCreator(false);
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowQuickTaskCreator(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Create task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

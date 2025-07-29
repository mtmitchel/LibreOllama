import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { TaskColumn } from '../../stores/unifiedTaskStore.types';

type KanbanColumnType = TaskColumn & {
  tasks: any[];
  isLoading?: boolean;
  error?: string;
};
import { UnifiedTaskCard } from '../tasks/UnifiedTaskCard';
import { InlineTaskCreator } from './InlineTaskCreator';
import { Card, ConfirmDialog } from '../ui';
import { Plus, MoreHorizontal, ArrowUpDown, Calendar, Type, GripVertical, Trash2, Edit3 } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  className?: string;
  searchQuery?: string;
  onDelete?: (columnId: string) => void;
  onRename?: (columnId: string, newTitle: string) => void;
}

type SortOption = 'order' | 'date' | 'title';

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  className = '',
  searchQuery = '',
  onDelete,
  onRename
}) => {
  const { createTask } = useUnifiedTaskStore();
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const [deleteConfirm, setDeleteConfirm] = useState<{ taskId: string; title: string } | null>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  // Load sort preference from localStorage
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(`kanban-sort-${column.id}`);
    return (saved as SortOption) || 'order';
  });
  
  // Save sort preference when it changes
  React.useEffect(() => {
    localStorage.setItem(`kanban-sort-${column.id}`, sortBy);
  }, [sortBy, column.id]);
  
  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    
    if (showSortMenu || showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortMenu, showOptionsMenu]);

  // Close inline creator when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showInlineCreator && !target.closest('.inline-task-creator')) {
        setShowInlineCreator(false);
      }
    };
    
    if (showInlineCreator) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInlineCreator]);

  // Set up droppable
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  // Filter and sort tasks based on search query and sort option
  const sortedTasks = useMemo(() => {
    let tasks = [...column.tasks];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(task => {
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesLabels = task.metadata?.labels?.some(label => 
          label.toLowerCase().includes(query)
        );
        return matchesTitle || matchesNotes || matchesLabels;
      });
    }
    
    switch (sortBy) {
      case 'order':
        // Sort by position (manual order)
        return tasks.sort((a, b) => {
          const posA = parseInt(a.position || '0');
          const posB = parseInt(b.position || '0');
          return posA - posB;
        });
      
      case 'date':
        // Sort by due date (earliest first, no date at end)
        return tasks.sort((a, b) => {
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        });
      
      case 'title':
        // Sort alphabetically by title
        return tasks.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return tasks;
    }
  }, [column.tasks, sortBy, searchQuery]);

  // Handle task creation
  const handleCreateTask = useCallback(async (data: {
    title: string;
    notes?: string;
    due?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    labels?: string[];
  }) => {
    try {
      await createTask({
        title: data.title,
        notes: data.notes,
        due: data.due,
        columnId: column.id,
        googleTaskListId: column.googleTaskListId,
        priority: data.priority || 'normal',
        labels: data.labels || []
      });
      setShowInlineCreator(false);
      
      // The sync will be triggered automatically by the subscription in realtimeSync
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error; // Re-throw to let InlineTaskCreator handle it
    }
  }, [createTask, column.id, column.googleTaskListId]);

  // Handle rename submission
  const handleRenameSubmit = useCallback(async () => {
    if (!renameValue.trim() || !onRename) return;
    
    try {
      await onRename(column.id, renameValue.trim());
      setIsRenaming(false);
      setShowOptionsMenu(false);
    } catch (error) {
      // Failed to rename task list
    }
  }, [onRename, column.id, renameValue]);

  // Handle rename cancel
  const handleRenameCancel = useCallback(() => {
    setRenameValue(column.title);
    setIsRenaming(false);
  }, [column.title]);

  return (
    <>
      <div 
        ref={setNodeRef}
        className={`flex h-full flex-col ${className} ${
          isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
        {/* Column Header */}
        <div className="h-10 rounded-md bg-neutral-50 border border-neutral-100 px-3 py-0 flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  } else if (e.key === 'Escape') {
                    handleRenameCancel();
                  }
                }}
                className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-0.5 text-sm font-medium text-neutral-900 focus:border-blue-500 focus:outline-none"
                aria-label="List name"
                autoFocus
              />
            ) : (
              <>
                <h3 className="truncate text-sm font-medium text-neutral-900">{column.title}</h3>
                <span className="text-[12px] text-neutral-500 ml-1 align-baseline">{sortedTasks.length}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <div className="relative" ref={sortMenuRef}>
              <button
                className="flex size-6 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-200"
                title="Sort tasks"
                aria-label="Sort tasks"
                aria-expanded={showSortMenu}
                aria-haspopup="menu"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={12} />
              </button>
              
              {showSortMenu && (
                <div className="absolute right-0 top-full z-[9998] mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg" role="menu" aria-label="Sort options">
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50 ${
                      sortBy === 'order' ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <GripVertical size={14} className="mr-2" />
                    My order
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('date');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                      sortBy === 'date' ? 'bg-neutral-100' : ''
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
                      sortBy === 'title' ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <Type size={14} className="mr-2" />
                    Title
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowInlineCreator(true)}
              className="flex size-6 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-200"
              title="Add task"
              aria-label="Add new task"
            >
              <Plus size={14} />
            </button>
            
            <div className="relative" ref={optionsMenuRef}>
              <button
                className="flex size-6 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-200 cursor-pointer relative z-10"
                style={{ pointerEvents: 'auto' }}
                title="List options"
                aria-label="List options menu"
                aria-expanded={showOptionsMenu}
                aria-haspopup="menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(!showOptionsMenu);
                }}
              >
                <MoreHorizontal size={14} />
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 top-full z-[9999] mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg" role="menu" aria-label="List options">
                  {onRename && (
                    <button
                      onClick={() => {
                        setIsRenaming(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50"
                    >
                      <Edit3 size={14} className="mr-2" />
                      Rename list
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onDelete(column.id);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 last:rounded-b-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete list
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column Content */}
        <div className="min-h-40 flex-1 bg-neutral-50 border border-neutral-100 rounded-xl p-3 overflow-y-auto">
          <div className="space-y-2">
          {column.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : column.error ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-error-ghost">
                <svg className="size-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="mb-1 text-sm font-medium text-error">Error loading tasks</p>
              <p className="text-xs text-muted">{column.error}</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {searchQuery && column.tasks.length > 0 ? (
                <>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-tertiary opacity-60">
                    <svg className="size-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="mb-1 text-sm font-medium text-primary">No matching tasks</p>
                  <p className="max-w-48 text-xs text-muted">No tasks match your search in this list</p>
                </>
              ) : (
                <>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100">
                    <Plus size={20} className="text-gray-400" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-gray-900">No tasks yet</p>
                  <p className="max-w-32 text-xs text-gray-500">Drop tasks here or click "Add task" to create your first task</p>
                </>
              )}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <UnifiedTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onToggle={() => {
                  const { updateTask } = useUnifiedTaskStore.getState();
                  updateTask(task.id, { 
                    status: task.status === 'completed' ? 'needsAction' : 'completed' 
                  });
                }}
                onEdit={() => {
                  // For now, we'll just log - you can implement a modal or inline editor
                  console.log('Edit task:', task);
                }}
                onDelete={() => {
                  setDeleteConfirm({ taskId: task.id, title: task.title });
                }}
                onDuplicate={() => {
                  const { createTask } = useUnifiedTaskStore.getState();
                  createTask({
                    title: `${task.title} (copy)`,
                    notes: task.notes,
                    due: task.due,
                    columnId: task.columnId,
                    priority: task.priority,
                    labels: task.labels
                  });
                }}
              />
            ))
          )}
          
          {/* Inline Creator - inside column scroll */}
          {showInlineCreator && (
            <div className="mt-2">
              <InlineTaskCreator
                columnId={column.id}
                onSubmit={handleCreateTask}
                onCancel={() => setShowInlineCreator(false)}
              />
            </div>
          )}
          
          {/* Add task link - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInlineCreator(true);
            }}
            className="mt-1.5 text-left text-[13px] text-neutral-600 hover:text-neutral-800 hover:underline px-2 py-1.5 w-full cursor-pointer relative z-10"
            style={{ pointerEvents: 'auto' }}
          >
            + Add task
          </button>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (deleteConfirm) {
            console.log('Deleting task:', deleteConfirm);
            try {
              const { deleteTask } = useUnifiedTaskStore.getState();
              await deleteTask(deleteConfirm.taskId);
              console.log('Task deleted successfully');
              setDeleteConfirm(null);
            } catch (error) {
              console.error('Failed to delete task:', error);
              // TODO: Show error notification
            }
          }
        }}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
};
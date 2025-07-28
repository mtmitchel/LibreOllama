import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { TaskColumn } from '../../stores/unifiedTaskStore.types';

type KanbanColumnType = TaskColumn & {
  tasks: any[];
  isLoading?: boolean;
  error?: string;
};
import { KanbanTaskCard } from './KanbanTaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { Card, Button } from '../ui';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
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

  // Debug modal state changes
  React.useEffect(() => {
    }, [isCreateModalOpen, column.id]);

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
  }) => {
    try {
      createTask({
        title: data.title,
        notes: data.notes,
        due: data.due,
        columnId: column.id,
        googleTaskListId: column.googleTaskListId
      });
      setIsCreateModalOpen(false);
      
      // The sync will be triggered automatically by the subscription in realtimeSync
    } catch (error) {
      console.error('Failed to create task:', error);
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
          isOver ? 'bg-accent-soft ring-2 ring-primary ring-opacity-50' : ''
        }`}
      >
        <Card className="flex h-full flex-col shadow-sm">
        {/* Column Header */}
        <div className="border-border-default flex items-center justify-between border-b bg-tertiary px-3 py-2.5">
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
                className="border-border-default focus:ring-primary/20 min-w-0 flex-1 rounded border bg-card px-2 py-1 text-sm font-semibold text-primary focus:border-primary focus:outline-none focus:ring-2"
                autoFocus
              />
            ) : (
              <>
                <h3 className="truncate text-sm font-semibold text-primary">{column.title}</h3>
                <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-secondary shadow-sm">
                  {sortedTasks.length}{searchQuery && ` / ${column.tasks.length}`}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <div className="relative" ref={sortMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-xs font-medium hover:bg-card"
                title="Sort tasks"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={12} />
              </Button>
              
              {showSortMenu && (
                <div className="border-border-default absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-tertiary ${
                      sortBy === 'order' ? 'bg-accent-soft' : ''
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
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary ${
                      sortBy === 'date' ? 'bg-accent-soft' : ''
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
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreateModalOpen(true)}
              className="size-7 hover:bg-card"
              title="Add task"
            >
              <Plus size={16} />
            </Button>
            
            <div className="relative" ref={optionsMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 hover:bg-card"
                title="List options"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <MoreHorizontal size={16} />
              </Button>
              
              {showOptionsMenu && (
                <div className="border-border-default absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card shadow-lg">
                  {onRename && (
                    <button
                      onClick={() => {
                        setIsRenaming(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-tertiary"
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
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 last:rounded-b-lg hover:bg-red-50 hover:bg-tertiary"
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
        <div className="min-h-40 flex-1 space-y-2 overflow-y-auto p-2.5">
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
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-tertiary opacity-60">
                    <Plus size={20} className="text-secondary" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-primary">No tasks yet</p>
                  <p className="max-w-32 text-xs text-muted">Drop tasks here or click the + button to create your first task</p>
                </>
              )}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
              />
            ))
          )}
        </div>
        </Card>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        columnTitle={column.title}
      />
    </>
  );
};
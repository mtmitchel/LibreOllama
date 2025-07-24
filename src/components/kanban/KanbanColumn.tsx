import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useKanbanStore, KanbanColumn as KanbanColumnType } from '../../stores/useKanbanStore';
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
  const { createTask } = useKanbanStore();
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
      await createTask(column.id, data);
      setIsCreateModalOpen(false);
    } catch (error) {
      // Failed to create task
    }
  }, [createTask, column.id]);

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
        className={`flex flex-col h-full ${className} ${
          isOver ? 'ring-2 ring-primary ring-opacity-50 bg-accent-soft' : ''
        }`}
      >
        <Card className="flex flex-col h-full shadow-sm">
        {/* Column Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-default bg-tertiary">
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
                className="font-semibold text-primary text-sm bg-card border border-border-default rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 min-w-0"
                autoFocus
              />
            ) : (
              <>
                <h3 className="font-semibold text-primary text-sm truncate">{column.title}</h3>
                <span className="text-xs text-secondary bg-card px-2.5 py-1 rounded-full font-medium shadow-sm flex-shrink-0">
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
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border-default bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary first:rounded-t-lg ${
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
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border-default bg-card shadow-lg">
                  {onRename && (
                    <button
                      onClick={() => {
                        setIsRenaming(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary first:rounded-t-lg"
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
                      className="flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary text-red-600 hover:bg-red-50 last:rounded-b-lg"
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
        <div className="flex-1 p-2.5 space-y-2 overflow-y-auto min-h-40">
          {column.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : column.error ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 bg-error-ghost rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-error text-sm font-medium mb-1">Error loading tasks</p>
              <p className="text-xs text-muted">{column.error}</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {searchQuery && column.tasks.length > 0 ? (
                <>
                  <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mb-4 opacity-60">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-primary mb-1">No matching tasks</p>
                  <p className="text-xs text-muted max-w-48">No tasks match your search in this list</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mb-4 opacity-60">
                    <Plus size={20} className="text-secondary" />
                  </div>
                  <p className="text-sm font-medium text-primary mb-1">No tasks yet</p>
                  <p className="text-xs text-muted max-w-32">Drop tasks here or click the + button to create your first task</p>
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
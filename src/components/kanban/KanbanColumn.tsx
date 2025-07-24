import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useKanbanStore, KanbanColumn as KanbanColumnType } from '../../stores/useKanbanStore';
import { KanbanTaskCard } from './KanbanTaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { Card, Button } from '../ui';
import { Plus, MoreHorizontal, ArrowUpDown, Calendar, Type, GripVertical } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  className?: string;
}

type SortOption = 'order' | 'date' | 'title';

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  className = '' 
}) => {
  const { createTask } = useKanbanStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Load sort preference from localStorage
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(`kanban-sort-${column.id}`);
    return (saved as SortOption) || 'order';
  });
  
  // Save sort preference when it changes
  React.useEffect(() => {
    localStorage.setItem(`kanban-sort-${column.id}`, sortBy);
  }, [sortBy, column.id]);
  
  // Close sort menu when clicking outside
  React.useEffect(() => {
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

  // Sort tasks based on current sort option
  const sortedTasks = useMemo(() => {
    const tasks = [...column.tasks];
    
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
  }, [column.tasks, sortBy]);

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

  return (
    <>
      <div 
        ref={setNodeRef}
        className={`flex flex-col h-full ${className} ${
          isOver ? 'ring-2 ring-primary ring-opacity-50 bg-accent-soft' : ''
        }`}
      >
        <Card className="flex flex-col h-full">
        {/* Column Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-primary">{column.title}</h3>
            <span className="text-xs text-muted bg-tertiary px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={sortMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 py-1"
                title="Sort tasks"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} className="mr-1" />
                <span className="text-xs">Sort</span>
              </Button>
              
              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border-default bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary ${
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
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary ${
                      sortBy === 'title' ? 'bg-accent-soft' : ''
                    }`}
                  >
                    <Type size={14} className="mr-2" />
                    Title
                  </button>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => {
                  setIsCreateModalOpen(true);
              }}
              className="h-8 w-8 p-1 rounded hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              title="Add task"
              style={{ zIndex: 10 }}
            >
              <Plus size={16} />
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Column options"
            >
              <MoreHorizontal size={14} />
            </Button>
          </div>
        </div>

        {/* Column Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-40">
          {column.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : column.error ? (
            <div className="text-center py-8">
              <p className="text-error text-sm">{column.error}</p>
            </div>
          ) : column.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mb-3">
                <Plus size={20} className="text-secondary" />
              </div>
              <p className="text-sm font-medium">No tasks yet</p>
              <p className="text-xs">Drop tasks here or click + to create</p>
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
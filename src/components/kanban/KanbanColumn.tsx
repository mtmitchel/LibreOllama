import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { TaskColumn } from '../../stores/unifiedTaskStore.types';
import { realtimeSync } from '../../services/realtimeSync';
import '../../styles/asana-design-system.css';

type KanbanColumnType = TaskColumn & {
  tasks: any[];
  isLoading?: boolean;
  error?: string;
};
import { UnifiedTaskCard } from '../tasks/UnifiedTaskCard';
import { InlineTaskCreator } from './InlineTaskCreator';
import { Card, ConfirmDialog } from '../ui';
import { Plus, MoreHorizontal, ArrowUpDown, Calendar, Type, GripVertical, Trash2, Edit3, Flag, Eye, EyeOff } from 'lucide-react';
import { parseGoogleTaskDate } from '../../utils/dateUtils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  className?: string;
  searchQuery?: string;
  onDelete?: (columnId: string) => void;
  onRename?: (columnId: string, newTitle: string) => void;
  onEditTask?: (taskId: string) => void;
  selectedTaskId?: string;
  style?: React.CSSProperties;
}

type SortOption = 'order' | 'date' | 'title' | 'priority';

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  className = '',
  searchQuery = '',
  onDelete,
  onRename,
  onEditTask,
  selectedTaskId
}) => {
  const { createTask, setShowCompleted } = useUnifiedTaskStore();
  const showCompleted = useUnifiedTaskStore(state => 
    state.showCompletedByList[column.id] ?? state.showCompleted
  );
  
  console.log('🔍 KanbanColumn - Column:', column.id, 'showCompleted:', showCompleted);
  
  console.log('🔄 KanbanColumn render for column:', column.id, 'showCompleted:', showCompleted, 'tasks:', column.tasks.length);
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
        const matchesLabels = task.metadata?.labels?.some((label: any) => 
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
          return parseGoogleTaskDate(a.due).getTime() - parseGoogleTaskDate(b.due).getTime();
        });
      
      case 'title':
        // Sort alphabetically by title
        return tasks.sort((a, b) => a.title.localeCompare(b.title));
      
      case 'priority':
        // Sort by priority (urgent first, then high, normal, low)
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
        return tasks.sort((a, b) => {
          const aPriority = priorityOrder[(a.priority || 'none') as keyof typeof priorityOrder];
          const bPriority = priorityOrder[(b.priority || 'none') as keyof typeof priorityOrder];
          return aPriority - bPriority;
        });
      
      default:
        return tasks;
    }
  }, [column.tasks, sortBy, searchQuery]);

  // Handle task creation
  const handleCreateTask = useCallback(async (data: {
    title: string;
    notes?: string;
    due?: string;
    priority?: 'high' | 'medium' | 'low' | 'none';
    labels?: string[];
  }) => {
    try {
      await createTask({
        title: data.title,
        notes: data.notes,
        due: data.due,
        columnId: column.id,
        googleTaskListId: column.googleTaskListId,
        priority: data.priority || 'none',
        labels: (data.labels || []).map(label => ({ 
          name: label, 
          color: 'gray' as const 
        }))
      });
      setShowInlineCreator(false);
      
      // Trigger sync to ensure the new task appears in Google immediately
      await realtimeSync.requestSync(500); // Small delay to ensure Google has processed the task
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
        className={`asana-column flex h-full flex-col ${className} ${
          isOver ? 'ring-2 ring-blue-400 ring-opacity-30' : ''
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
        {/* Column Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
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
                className="asana-input min-w-0 flex-1"
                aria-label="List name"
                autoFocus
              />
            ) : (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E1E1F', margin: 0, letterSpacing: '-0.01em' }}>{column.title}</h3>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#6B6F76',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>{sortedTasks.length}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <div className="relative" ref={sortMenuRef}>
              <button
                className="asana-button-ghost flex size-7 items-center justify-center" 
                style={{ padding: '4px', minWidth: 'auto' }}
                title="Sort tasks"
                aria-label="Sort tasks"
                aria-expanded={showSortMenu}
                aria-haspopup="menu"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} />
              </button>
              
              {showSortMenu && (
                <div className="absolute right-0 top-full z-[9998] mt-1 w-48 bg-white rounded-lg" 
                  style={{ 
                    boxShadow: 'var(--asana-shadow-overlay)', 
                    border: '1px solid var(--asana-border-default)' 
                  }} 
                  role="menu" 
                  aria-label="Sort options"
                >
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg transition-colors ${
                      sortBy === 'order' ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <GripVertical size={14} className="mr-2" />
                    Date created
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
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                      sortBy === 'title' ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <Type size={14} className="mr-2" />
                    Title
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('priority');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm last:rounded-b-lg hover:bg-gray-50 ${
                      sortBy === 'priority' ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <Flag size={14} className="mr-2" />
                    Priority
                  </button>
                </div>
              )}
            </div>
            
            
            <div className="relative" ref={optionsMenuRef}>
              <button
                className="asana-button-ghost flex size-7 items-center justify-center cursor-pointer relative z-10"
                style={{ padding: '4px', minWidth: 'auto', pointerEvents: 'auto' }}
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
                <div className="absolute right-0 top-full z-[9999] mt-1 w-48 bg-white rounded-lg" 
                  style={{ 
                    boxShadow: 'var(--asana-shadow-overlay)', 
                    border: '1px solid var(--asana-border-default)' 
                  }}
                  role="menu" 
                  aria-label="List options"
                >
                  <button
                    onClick={() => {
                      console.log('🎯 Toggle button clicked! Current showCompleted:', showCompleted, 'for column:', column.id);
                      setShowCompleted(!showCompleted, column.id);
                      setShowOptionsMenu(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50"
                  >
                    {showCompleted ? <EyeOff size={14} className="mr-2" /> : <Eye size={14} className="mr-2" />}
                    {showCompleted ? 'Hide completed' : 'Show completed'}
                  </button>
                  {onRename && (
                    <button
                      onClick={() => {
                        setIsRenaming(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50"
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
        <div className="flex-1 overflow-y-auto asana-scrollbar" style={{ padding: '0 4px', minHeight: '160px' }}>
          <div style={{ padding: '2px' }}>
          
          {/* Add task button - at the top */}
          {!showInlineCreator && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInlineCreator(true);
              }}
              className="flex items-center gap-2 w-full cursor-pointer relative z-10 mb-2 rounded-lg transition-all"
              style={{ 
                fontSize: '14px',
                color: '#6B6F76',
                padding: '8px 12px',
                pointerEvents: 'auto',
                backgroundColor: 'transparent',
                border: '1px dashed rgba(0, 0, 0, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1E1E1F';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B6F76';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              }}
            >
              <div className="asana-checkbox" style={{ width: '18px', height: '18px' }} />
              <span>Add task</span>
            </button>
          )}
          
          {/* Inline Creator - at the top */}
          {showInlineCreator && (
            <div className="mb-2">
              <InlineTaskCreator
                columnId={column.id}
                onSubmit={handleCreateTask}
                onCancel={() => setShowInlineCreator(false)}
              />
            </div>
          )}
          
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
                <></>
              )}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <UnifiedTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                isSelected={task.id === selectedTaskId}
                onToggle={async () => {
                  const { updateTask } = useUnifiedTaskStore.getState();
                  await updateTask(task.id, { 
                    status: task.status === 'completed' ? 'needsAction' : 'completed' 
                  });
                  
                  // Trigger sync to ensure completion status appears in Google immediately
                  await realtimeSync.requestSync(500);
                }}
                onEdit={() => {
                  if (onEditTask) {
                    onEditTask(task.id);
                  }
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
            const { deleteTask } = useUnifiedTaskStore.getState();
            
            // Fire and forget - task is optimistically removed so UI can close immediately
            deleteTask(deleteConfirm.taskId).then(() => {
              console.log('Task deleted successfully');
              // Trigger sync to ensure deletion appears in Google immediately
              realtimeSync.requestSync(500);
            }).catch(error => {
              console.error('Failed to delete task:', error);
              // TODO: Show error notification and possibly restore the task
            });
            
            setDeleteConfirm(null);
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
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { useFilteredTasks } from '../../hooks/useFilteredTasks';
import { parseGoogleTaskDate, formatTaskDate } from '../../utils/dateUtils';

type KanbanTask = UnifiedTask;
import { TaskSidebar } from './TaskSidebar';
import { Card, Button, Input } from '../ui';
import { Plus, Search, Filter, Calendar, CheckSquare, Square, Tag, MoreHorizontal, RotateCcw, ArrowUpDown, GripVertical, Type, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListViewProps {
  className?: string;
  searchQuery?: string;
  showHeader?: boolean;
  selectedListId?: string;
  sortBy?: 'created' | 'due' | 'title';
  onEditTask?: (task: KanbanTask, columnId: string) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ 
  className = '', 
  searchQuery: parentSearchQuery = '',
  showHeader = true,
  selectedListId: parentSelectedListId,
  sortBy: parentSortBy,
  onEditTask
}) => {
  const {
    columns,
    updateTask,
    deleteTask,
    createTask,
  } = useUnifiedTaskStore();
  
  const toggleComplete = async (columnId: string, taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'completed' : 'needsAction' });
    // Trigger sync to ensure completion status appears in Google immediately
    const { realtimeSync } = await import('../../services/realtimeSync');
    realtimeSync.requestSync(500);
  };

  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = parentSearchQuery || localSearchQuery;
  const [localSelectedListId, setLocalSelectedListId] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'created' | 'due' | 'title'>('created');
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Use parent props if provided, otherwise use local state
  const selectedListId = parentSelectedListId ?? localSelectedListId;
  const sortBy = parentSortBy ?? localSortBy;

  // Get all tasks using memoized hook
  const allTasks = useFilteredTasks(selectedListId);

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.labels?.some(label => {
          const labelName = typeof label === 'string' ? label : label.name;
          return labelName.toLowerCase().includes(query);
        });
        if (!matchesTitle && !matchesNotes && !matchesTags) return false;
      }

      // No status filter needed - list selection handles filtering

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return parseGoogleTaskDate(a.due).getTime() - parseGoogleTaskDate(b.due).getTime();
        case 'created':
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });

  // Handle task click
  const handleTaskClick = useCallback((task: KanbanTask & { columnId: string }) => {
    if (onEditTask) {
      onEditTask(task, task.columnId);
    } else {
      setSelectedTask(task);
      setSelectedColumnId(task.columnId);
      setIsEditModalOpen(true);
    }
  }, [onEditTask]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (task: KanbanTask & { columnId: string }) => {
    try {
      await toggleComplete(task.columnId, task.id, task.status !== 'completed');
    } catch (error) {
      // Failed to toggle task completion
    }
  }, [toggleComplete]);

  // Handle task update
  const handleUpdateTask = useCallback(async (updates: {
    title: string;
    notes?: string;
    due?: string;
    priority?: 'high' | 'medium' | 'low' | 'none';
    labels?: string[];
    recurring?: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval?: number;
      endDate?: string;
    };
  }) => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await updateTask(selectedTask.id, {
        ...updates,
        recurring: updates.recurring
      });
      setIsEditModalOpen(false);
      
      // Trigger sync to ensure changes appear in Google immediately
      const { realtimeSync } = await import('../../services/realtimeSync');
      realtimeSync.requestSync(500);
    } catch (error) {
      // Failed to update task
      throw error;
    }
  }, [updateTask, selectedTask, selectedColumnId]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await deleteTask(selectedTask.id);
      setIsEditModalOpen(false);
      
      // Trigger sync to ensure deletion appears in Google immediately
      const { realtimeSync } = await import('../../services/realtimeSync');
      realtimeSync.requestSync(500);
    } catch (error) {
      // Failed to delete task
    }
  }, [deleteTask, selectedTask, selectedColumnId]);

  // Handle create task
  const handleCreateTask = useCallback(async (data: {
    title: string;
    notes?: string;
    due?: string;
    metadata?: any;
  }) => {
    try {
      // Create in the first column by default
      const firstColumn = columns[0];
      if (firstColumn) {
        await createTask({
          title: data.title,
          notes: data.notes,
          due: data.due,
          columnId: firstColumn.id,
          googleTaskListId: firstColumn.googleTaskListId,
          labels: data.metadata?.labels || [],
          priority: data.metadata?.priority || 'none'
        });
        setIsCreateModalOpen(false);
        
        // Trigger sync to ensure new task appears in Google immediately
        const { realtimeSync } = await import('../../services/realtimeSync');
        realtimeSync.requestSync(500);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [createTask, columns]);

  return (
    <>
      <div className={`flex h-full flex-col ${className}`}>
        {/* Streamlined Filters Bar */}
        {showHeader && (
          <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Task Count */}
            <span className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-secondary">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>

            {/* List Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedListId}
                onChange={(e) => setLocalSelectedListId(e.target.value)}
                className="border-border-default focus:ring-primary/20 h-8 cursor-pointer appearance-none rounded-lg border bg-card pl-3 pr-8 text-sm text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2"
              >
                <option value="all">All lists</option>
                {columns.map(column => (
                  <option key={column.id} value={column.id}>{column.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-secondary" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Menu Button */}
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
                      setLocalSortBy('created');
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
                      setLocalSortBy('due');
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
                      setLocalSortBy('title');
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
          </div>
        </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-tertiary">
                <CheckSquare size={24} className="text-secondary" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-primary">
                {searchQuery || selectedListId !== 'all' ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="mb-4 text-secondary">
                {searchQuery || selectedListId !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first task to get started'
                }
              </p>
              {!searchQuery && selectedListId === 'all' && (
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create task
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isOverdue = task.due && parseGoogleTaskDate(task.due) < new Date() && !isCompleted;
                const completedSubtasks = task.metadata?.subtasks?.filter(st => st.completed).length || 0;
                const totalSubtasks = task.metadata?.subtasks?.length || 0;

                return (
                  <Card
                    key={task.id}
                    className={`hover:border-border-hover cursor-pointer p-4 transition-all duration-200 hover:shadow-md ${
                      isCompleted ? 'opacity-75' : ''
                    } ${isOverdue ? 'border-l-4 border-l-error' : ''}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Completion Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className={`
                          mt-1 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors
                          duration-200
                          ${isCompleted 
                            ? 'border-success bg-success text-white' 
                            : 'border-border-default hover:border-success'
                          }
                        `}
                      >
                        {isCompleted && <CheckSquare size={14} />}
                      </button>

                      {/* Task Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-base font-medium leading-tight ${
                              isCompleted ? 'text-secondary line-through' : 'text-primary'
                            }`}>
                              {task.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded-full bg-tertiary px-2 py-1 text-xs text-secondary">
                                {task.columnTitle}
                              </span>
                              {task.priority && task.priority !== 'none' && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  backgroundColor: task.priority === 'high' ? 'var(--red-50)' : task.priority === 'medium' ? 'var(--amber-50)' : '#e0f2fe',
                                  color: task.priority === 'high' ? 'var(--red-600)' : task.priority === 'medium' ? 'var(--amber-600)' : '#0369a1'
                                }}>
                                  {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>

                        {/* Task Notes */}
                        {task.notes && (
                          <p className="mb-3 line-clamp-2 text-sm text-secondary">
                            {task.notes}
                          </p>
                        )}

                        {/* Task Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            {/* Due Date */}
                            {task.due && (
                              <div className="flex items-center gap-1" style={{
                                color: isOverdue ? 'var(--red-600)' : 'var(--text-secondary)'
                              }}>
                                <Calendar size={12} />
                                <span>{formatTaskDate(parseGoogleTaskDate(task.due))}</span>
                              </div>
                            )}

                            {/* Subtasks Progress */}
                            {totalSubtasks > 0 && (
                              <div className="flex items-center gap-1 text-secondary">
                                <CheckSquare size={12} />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                              </div>
                            )}

                            {/* Recurring Indicator */}
                            {task.metadata?.recurring?.enabled && (
                              <div className="flex items-center gap-1 text-accent-primary">
                                <RotateCcw size={12} />
                                <span className="capitalize">{task.metadata.recurring.frequency}</span>
                              </div>
                            )}
                          </div>

                          {/* Labels */}
                          {task.metadata?.labels && task.metadata.labels.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag size={12} className="text-secondary" />
                              <span className="text-xs text-secondary">
                                {task.metadata.labels.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Labels Preview */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.labels.slice(0, 3).map((label, index) => {
                              // Handle both string labels and object labels
                              const labelName = typeof label === 'string' ? label : label.name;
                              const labelColor = typeof label === 'string' ? 
                                // For string labels, compute color based on hash
                                (() => {
                                  const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink', 'teal', 'yellow', 'cyan', 'gray'];
                                  let hash = 0;
                                  for (let i = 0; i < labelName.length; i++) {
                                    hash = ((hash << 5) - hash) + labelName.charCodeAt(i);
                                    hash = hash & hash;
                                  }
                                  const colorIndex = Math.abs(hash) % colors.length;
                                  return colors[colorIndex];
                                })() : 
                                label.color;
                              
                              const colorClass = `label-${labelColor}`;
                              
                              return (
                                <span
                                  key={index}
                                  className={`label ${colorClass}`}
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                >
                                  {labelName}
                                </span>
                              );
                            })}
                            {task.labels.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-tertiary px-2 py-0.5 text-xs font-medium text-secondary">
                                +{task.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isEditModalOpen}
        task={isEditModalOpen ? selectedTask : null}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
};
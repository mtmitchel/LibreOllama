import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useKanbanStore, KanbanTask } from '../../stores/useKanbanStore';
import { EditTaskModal } from './EditTaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { Card, Button, Input } from '../ui';
import { Plus, Search, Filter, Calendar, CheckSquare, Square, Tag, MoreHorizontal, RotateCcw, ArrowUpDown, GripVertical, Type, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListViewProps {
  className?: string;
  searchQuery?: string;
  showHeader?: boolean;
  selectedListId?: string;
  sortBy?: 'created' | 'due' | 'title';
}

export const TaskListView: React.FC<TaskListViewProps> = ({ 
  className = '', 
  searchQuery: parentSearchQuery = '',
  showHeader = true,
  selectedListId: parentSelectedListId,
  sortBy: parentSortBy
}) => {
  const {
    columns,
    updateTask,
    deleteTask,
    toggleComplete,
    createTask,
  } = useKanbanStore();

  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = parentSearchQuery || localSearchQuery;
  const [localSelectedListId, setLocalSelectedListId] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'created' | 'due' | 'title'>('created');
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Use parent props if provided, otherwise use local state
  const selectedListId = parentSelectedListId ?? localSelectedListId;
  const sortBy = parentSortBy ?? localSortBy;

  // Get all tasks from all columns or filtered by list
  const allTasks = columns
    .filter(column => selectedListId === 'all' || column.id === selectedListId)
    .flatMap(column => 
      column.tasks.map(task => ({ ...task, columnId: column.id, columnTitle: column.title }))
    );

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.metadata?.labels?.some(label => 
          label.toLowerCase().includes(query)
        );
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
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        case 'created':
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });

  // Handle task click
  const handleTaskClick = useCallback((task: KanbanTask & { columnId: string }) => {
    setSelectedTask(task);
    setSelectedColumnId(task.columnId);
    setIsEditModalOpen(true);
  }, []);

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
    metadata?: any;
  }) => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await updateTask(selectedColumnId, selectedTask.id, updates);
      setIsEditModalOpen(false);
    } catch (error) {
      // Failed to update task
    }
  }, [updateTask, selectedTask, selectedColumnId]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await deleteTask(selectedColumnId, selectedTask.id);
      setIsEditModalOpen(false);
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
        await createTask(firstColumn.id, data);
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      // Failed to create task
    }
  }, [createTask, columns]);

  return (
    <>
      <div className={`h-full flex flex-col ${className}`}>
        {/* Streamlined Filters Bar */}
        {showHeader && (
          <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            {/* Task Count */}
            <span className="text-sm text-secondary bg-card px-3 py-1.5 rounded-full font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>

            {/* List Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedListId}
                onChange={(e) => setLocalSelectedListId(e.target.value)}
                className="h-8 pl-3 pr-8 text-sm border border-border-default rounded-lg bg-card text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All lists</option>
                {columns.map(column => (
                  <option key={column.id} value={column.id}>{column.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Menu Button */}
            <div className="relative" ref={sortMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 flex items-center gap-2 hover:bg-tertiary"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} />
                <span className="text-sm">Sort</span>
              </Button>
              
              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border-default bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setLocalSortBy('created');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary first:rounded-t-lg ${
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
          </div>
        </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare size={24} className="text-secondary" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">
                {searchQuery || selectedListId !== 'all' ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-secondary mb-4">
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
                const isOverdue = task.due && new Date(task.due) < new Date() && !isCompleted;
                const completedSubtasks = task.metadata?.subtasks?.filter(st => st.completed).length || 0;
                const totalSubtasks = task.metadata?.subtasks?.length || 0;

                return (
                  <Card
                    key={task.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-border-hover ${
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
                          flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center
                          transition-colors duration-200
                          ${isCompleted 
                            ? 'bg-success border-success text-white' 
                            : 'border-border-default hover:border-success'
                          }
                        `}
                      >
                        {isCompleted && <CheckSquare size={14} />}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-base leading-tight ${
                              isCompleted ? 'line-through text-secondary' : 'text-primary'
                            }`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-secondary bg-tertiary px-2 py-1 rounded-full">
                                {task.columnTitle}
                              </span>
                              {task.metadata?.priority && task.metadata.priority !== 'normal' && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  task.metadata.priority === 'high' ? 'bg-warning-ghost text-warning' :
                                  task.metadata.priority === 'urgent' ? 'bg-error-ghost text-error' :
                                  'bg-tertiary text-muted'
                                }`}>
                                  {task.metadata.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
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
                          <p className="text-sm text-secondary line-clamp-2 mb-3">
                            {task.notes}
                          </p>
                        )}

                        {/* Task Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            {/* Due Date */}
                            {task.due && (
                              <div className={`flex items-center gap-1 ${
                                isOverdue ? 'text-error' : 'text-secondary'
                              }`}>
                                <Calendar size={12} />
                                <span>{format(new Date(task.due), 'MMM d, yyyy')}</span>
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
                        {task.metadata?.labels && task.metadata.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.metadata.labels.slice(0, 3).map((label, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent-primary"
                              >
                                {label}
                              </span>
                            ))}
                            {task.metadata.labels.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tertiary text-secondary">
                                +{task.metadata.labels.length - 3}
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

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={selectedTask}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        columnTitle="New task"
      />
    </>
  );
};
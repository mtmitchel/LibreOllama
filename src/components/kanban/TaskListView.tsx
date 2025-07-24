import React, { useState, useCallback } from 'react';
import { useKanbanStore, KanbanTask } from '../../stores/useKanbanStore';
import { EditTaskModal } from './EditTaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { Card, Button, Input } from '../ui';
import { Plus, Search, Filter, Calendar, CheckSquare, Square, Tag, MoreHorizontal, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListViewProps {
  className?: string;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ className = '' }) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'due' | 'priority' | 'created'>('created');

  // Get all tasks from all columns
  const allTasks = columns.flatMap(column => 
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

      // Status filter
      if (filterStatus === 'active' && task.status === 'completed') return false;
      if (filterStatus === 'completed' && task.status !== 'completed') return false;

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
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.metadata?.priority || 'normal'];
          const bPriority = priorityOrder[b.metadata?.priority || 'normal'];
          return bPriority - aPriority;
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-primary">Task list</h2>
            <span className="text-sm text-secondary">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New task
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-border-default rounded-md bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            >
              <option value="all">All tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border-default rounded-md bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            >
              <option value="created">Date created</option>
              <option value="title">Title</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </Card>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare size={24} className="text-secondary" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-secondary mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first task to get started'
                }
              </p>
              {!searchQuery && filterStatus === 'all' && (
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
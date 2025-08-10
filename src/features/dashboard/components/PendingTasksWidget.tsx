import React, { useMemo } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Heading, Text } from '../../../components/ui';
import { WidgetHeader, Dropdown } from '../../../components/ui/design-system';
import { MoreHorizontal, CheckSquare, Plus, Calendar } from 'lucide-react';
import { useUnifiedTaskStore } from '../../../stores/unifiedTaskStore';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

export const PendingTasksWidget: React.FC = () => {
  const { columns, getTasksByColumn, updateTask, tasks } = useUnifiedTaskStore();
  
  const toggleComplete = (columnId: string, taskId: string, completed: boolean) => {
    // Get the full task to include all fields in update - prevent clearing other fields
    const task = tasks[taskId];
    if (task) {
      const updates: any = {
        title: task.title,
        status: completed ? 'completed' : 'needsAction'
      };
      // Only include fields that have values - don't send empty/null values
      if (task.notes) updates.notes = task.notes;
      if (task.due) updates.due = task.due;
      if (task.priority && task.priority !== 'none') updates.priority = task.priority;
      if (task.labels && task.labels.length > 0) updates.labels = task.labels;
      if (task.timeBlock) updates.timeBlock = task.timeBlock;
      
      updateTask(taskId, updates);
    }
  };

  // Memoize the pending tasks calculation to prevent re-render loops
  const pendingTasks = useMemo(() => {
    if (!columns || !Array.isArray(columns)) {
      return [];
    }

    try {
      // Get all tasks from all columns
      const allTasks = columns.flatMap(column => 
        getTasksByColumn(column.id).map(task => ({
          ...task,
          columnId: column.id,
          completed: task.status === 'completed'
        }))
      );

      return allTasks
        .filter(task => task && !task.completed)
        .sort((a, b) => {
          // Sort by due date (tasks with due dates first, then by priority)
          if (a.due && b.due) {
            return new Date(a.due).getTime() - new Date(b.due).getTime();
          }
          if (a.due && !b.due) return -1;
          if (!a.due && b.due) return 1;
          
          // If no due dates, sort by priority
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const aPriority = a.priority || 'normal';
          const bPriority = b.priority || 'normal';
          return (priorityOrder[bPriority as keyof typeof priorityOrder] || 0) - (priorityOrder[aPriority as keyof typeof priorityOrder] || 0);
        })
        .slice(0, 5); // Show max 5 tasks
    } catch (error) {
      console.error('Error processing tasks:', error);
      return [];
    }
  }, [columns]);

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      if (isPast(date)) return 'Overdue';
      return format(date, 'MMM d');
    } catch {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-text-tertiary';
    }
  };

  const getColumnName = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    return column?.title || 'Unknown';
  };

  const handleAddTask = () => {
    // Navigate to tasks page
    window.location.href = '/tasks';
  };

  const handleViewTasks = () => {
    window.location.href = '/tasks';
  };

  const handleToggleTask = (taskId: string, columnId: string) => {
    try {
      if (toggleComplete) {
        toggleComplete(columnId, taskId, true);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <div className="asana-card asana-card-padded">
      <WidgetHeader
        title="Pending tasks"
        actions={(
          <Dropdown
            items={[
              { value: 'add', label: 'Add new task', icon: <Plus className="mr-2 size-4" /> },
              { value: 'view', label: 'View all tasks' }
            ]}
            onSelect={(v: string) => {
              if (v === 'add') handleAddTask();
              else if (v === 'view') handleViewTasks();
            }}
            placement="bottom-end"
            trigger={(
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" aria-label="Pending tasks menu">
                <MoreHorizontal className="size-4" />
              </Button>
            )}
          />
        )}
      />
      
      {pendingTasks.length === 0 ? (
        <div className="py-2 text-center">
          <CheckSquare className="mx-auto mb-1 size-5 text-tertiary" />
          <Text variant="secondary" size="xs">No pending tasks</Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddTask}
            className="mt-1 h-auto px-2 py-0.5 text-[11px]"
          >
            Add your first task
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pendingTasks.map((task) => {
            const dueDate = formatDueDate(task.due);
            const isOverdue = task.due && isPast(new Date(task.due));
            const priority = task.priority;
            
            return (
              <li key={task.id} className="flex items-start gap-2 py-1">
                <button
                  onClick={() => handleToggleTask(task.id, task.columnId)}
                  className="border-border-primary mt-0.5 size-3.5 shrink-0 rounded-sm border transition-colors hover:bg-secondary"
                  aria-label={`Mark ${task.title} as completed`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Text size="xs" weight="medium" variant="body" className="min-w-0 flex-1 leading-snug">
                      {task.title}
                    </Text>
                    <div className="flex shrink-0 items-center gap-2">
                      {priority && (
                        <span className={`text-[11px] font-medium ${getPriorityColor(priority)}`}>
                          {priority[0].toUpperCase()}
                        </span>
                      )}
                      {dueDate && (
                        <Text size="xs" className={isOverdue ? 'font-medium text-red-500' : 'text-secondary'}>
                          {dueDate}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}; 
import React, { useMemo } from 'react';
import { Card, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, CheckSquare, Plus, Calendar } from 'lucide-react';
import { useKanbanStore } from '../../../stores/useKanbanStore';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

export const PendingTasksWidget: React.FC = () => {
  const { tasks, columns, toggleTaskCompleted } = useKanbanStore();

  // Memoize the pending tasks calculation to prevent re-render loops
  const pendingTasks = useMemo(() => {
    if (!tasks || typeof tasks !== 'object') {
      return [];
    }

    try {
      return Object.values(tasks)
        .filter(task => task && !task.completed)
        .sort((a, b) => {
          // Sort by due date (tasks with due dates first, then by priority)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // If no due dates, sort by priority
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        })
        .slice(0, 5); // Show max 5 tasks
    } catch (error) {
      console.error('Error processing tasks:', error);
      return [];
    }
  }, [tasks]);

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
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-[var(--text-tertiary)]';
    }
  };

  const getColumnName = (columnId: string) => {
    return columns?.[columnId]?.title || 'Unknown';
  };

  const handleAddTask = () => {
    // Navigate to tasks page
    window.location.href = '/tasks';
  };

  const handleViewTasks = () => {
    window.location.href = '/tasks';
  };

  const handleToggleTask = (taskId: string) => {
    try {
      if (toggleTaskCompleted) {
        toggleTaskCompleted(taskId);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
        <Heading level={3}>Pending tasks</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={handleAddTask}>
              <Plus className="w-4 h-4 mr-2" />
              Add new task
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleViewTasks}>
              View all tasks
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      
      {pendingTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckSquare className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <Text variant="secondary" size="sm">No pending tasks</Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddTask}
            className="mt-2"
          >
            Add your first task
          </Button>
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {pendingTasks.map((task) => {
            const dueDate = formatDueDate(task.dueDate);
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate));
            
            return (
              <li key={task.id} className="flex items-start" style={{ gap: 'var(--space-3)' }}>
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className="mt-1 w-4 h-4 border border-[var(--border-primary)] rounded hover:bg-[var(--background-secondary)] transition-colors flex-shrink-0"
                  aria-label={`Mark ${task.title} as completed`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-1)' }}>
                    <Text size="sm" weight="medium" variant="body" className="flex-1 min-w-0">
                      {task.title}
                    </Text>
                    {task.priority && (
                      <span className={`text-xs font-medium ml-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Text size="xs" variant="secondary">
                      {getColumnName(task.columnId)}
                    </Text>
                    {dueDate && (
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                        <Calendar className="w-3 h-3" />
                        <Text size="xs" className={isOverdue ? 'text-red-500' : ''}>
                          {dueDate}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}; 
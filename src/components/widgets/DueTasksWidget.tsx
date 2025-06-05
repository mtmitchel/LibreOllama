import React from 'react';
import { CheckSquare, Clock, AlertCircle, Target, Zap, ArrowDown, ArrowRight } from 'lucide-react';
import { WidgetWrapper } from '../ui/widget-wrapper';
import { CustomCheckbox } from '../ui/custom-checkbox';
import { Badge } from '../ui/badge';
import { PriorityIndicator, TimeStatusIndicator } from '../ui/status-indicator';
import { designTokens } from '../../lib/design-tokens';
import type { TaskItem } from '../../lib/types';

export interface DueTasksWidgetProps {
  tasks: TaskItem[];
  onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
  onNavigate?: (workflow: string) => void;
}

export function DueTasksWidget({
  tasks,
  onTaskUpdate,
  onNavigate
}: DueTasksWidgetProps) {
  // Filter for due tasks (today and overdue)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const dueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'done') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate <= today;
  });

  const overdueTasks = dueTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    onTaskUpdate?.(taskId, {
      status: completed ? 'done' : 'todo'
    });
  };

  const handleMoreOptions = () => {
    console.log('Tasks options clicked');
  };

  const handleWidgetClick = () => {
    onNavigate?.('tasks');
  };

  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'high':
        return {
          color: 'bg-red-500',
          icon: AlertCircle,
          badge: 'destructive',
          text: 'High Priority'
        };
      case 'medium':
        return {
          color: 'bg-amber-500',
          icon: Zap,
          badge: 'default',
          text: 'Medium Priority'
        };
      case 'low':
        return {
          color: 'bg-emerald-500',
          icon: ArrowDown,
          badge: 'secondary',
          text: 'Low Priority'
        };
      default:
        return {
          color: 'bg-gray-400',
          icon: Target,
          badge: 'outline',
          text: 'Normal'
        };
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', variant: 'default' as const };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', variant: 'secondary' as const };
    } else if (date < today) {
      const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${daysOverdue}d overdue`, variant: 'destructive' as const };
    } else {
      return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        variant: 'outline' as const
      };
    }
  };

  return (
    <WidgetWrapper
      title="Due Tasks"
      moreOptions
      onMoreOptions={handleMoreOptions}
      onClick={handleWidgetClick}
    >
      <div className="space-y-4">
        {dueTasks.length > 0 ? (
          <>
            {/* V2 Summary Stats */}
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-red-300">
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {dueTasks.slice(0, 5).map(task => {
              const priorityConfig = getPriorityConfig(task.priority);
              const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
              const PriorityIcon = priorityConfig.icon;

              return (
                <div
                  key={task.id}
                  className="group flex items-start gap-4 p-4 rounded-lg hover:bg-slate-700/50 transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* V2 Priority indicator with icon */}
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${priorityConfig.color}`}
                    />
                    <PriorityIcon className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* V2 Checkbox */}
                  <CustomCheckbox
                    size="sm"
                    checked={task.status === 'done'}
                    onCheckedChange={(checked) => handleTaskToggle(task.id, checked)}
                    className="mt-1"
                  />
                  
                  {/* V2 Task details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className={`text-sm font-medium leading-tight ${
                      task.status === 'done'
                        ? 'text-slate-400 line-through'
                        : 'text-white'
                    }`}>
                      {task.title}
                    </p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {dueDateInfo && (
                        <TimeStatusIndicator
                          status={dueDateInfo.variant === 'destructive' ? 'overdue' : 'today'}
                          label={dueDateInfo.text}
                          size="sm"
                        />
                      )}
                      
                      {task.priority && (
                        <PriorityIndicator
                          priority={task.priority as 'high' | 'medium' | 'low' | 'normal'}
                          size="sm"
                          showLabel={false}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* V2 Action indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
            
            {dueTasks.length > 5 && (
              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer border border-slate-700/50">
                  <Target className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-300 font-medium">
                    +{dueTasks.length - 5} more tasks due
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckSquare className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-white mb-2">
              All caught up!
            </p>
            <p className="text-xs text-slate-400">
              No tasks due today. Great work!
            </p>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronDown, Plus, ArrowUpDown, CheckCircle2, Circle, 
  Calendar, Flag, Clock, Hash, GripVertical, Type,
  Edit3, Copy, Trash2, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { DraggableTask } from './dnd/DraggableTask';
import { InlineTaskCreator } from '../../../../components/kanban/InlineTaskCreator';
import { ContextMenu } from '../../../../components/ui';
import type { GoogleTask } from '../../../../types/google';

interface CalendarTaskSidebarEnhancedProps {
  taskLists: Array<{ id: string; title: string; googleTaskListId?: string }>;
  tasks: Record<string, GoogleTask>;
  selectedListId: string;
  onListChange: (listId: string) => void;
  onTaskClick: (task: GoogleTask) => void;
  onTaskComplete: (listId: string, taskId: string, completed: boolean) => Promise<void>;
  onTaskCreate: (data: Partial<GoogleTask>) => Promise<void>;
  onTaskDelete?: (listId: string, taskId: string) => Promise<void>;
  onTaskDuplicate?: (task: GoogleTask) => Promise<void>;
}

export const CalendarTaskSidebarEnhanced: React.FC<CalendarTaskSidebarEnhancedProps> = ({
  taskLists,
  tasks,
  selectedListId,
  onListChange,
  onTaskClick,
  onTaskComplete,
  onTaskCreate,
  onTaskDelete,
  onTaskDuplicate
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'due' | 'priority' | 'created'>('created');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const tasksArray = Object.values(tasks);
    
    // Filter by list and completion status
    let filtered;
    if (selectedListId === 'all') {
      filtered = tasksArray;
    } else {
      // Find the selected list to get its googleTaskListId
      const selectedList = taskLists.find(list => list.id === selectedListId);
      const googleListId = selectedList?.googleTaskListId;
      filtered = googleListId 
        ? tasksArray.filter(task => task.googleTaskListId === googleListId)
        : [];
    }
      
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }
    
    // Sort tasks
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (priorityOrder[a.priority || 'normal'] || 2) - (priorityOrder[b.priority || 'normal'] || 2);
        case 'created':
          return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
        default:
          return 0;
      }
    });
  }, [tasks, selectedListId, showCompleted, sortBy]);
  
  // Remove date grouping - not needed anymore
  /*const groupedTasks = useMemo(() => {
    const groups: Record<string, GoogleTask[]> = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      allOthers: [] // Catch-all for remaining tasks
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + (7 - thisWeekEnd.getDay()));
    const nextWeekEnd = new Date(thisWeekEnd);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    
    filteredTasks.forEach(task => {
      if (!task.due) {
        // Tasks without due dates go to "all others"
        groups.allOthers.push(task);
      } else {
        const dueDate = new Date(task.due);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          // Overdue tasks go to "all others"
          groups.allOthers.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          groups.tomorrow.push(task);
        } else if (dueDate > tomorrow && dueDate <= thisWeekEnd) {
          groups.thisWeek.push(task);
        } else if (dueDate > thisWeekEnd && dueDate <= nextWeekEnd) {
          groups.nextWeek.push(task);
        } else {
          // Tasks due later than next week go to "all others"
          groups.allOthers.push(task);
        }
      }
    });
    
    return groups;
  }, [filteredTasks]);*/
  
  const handleCreateTask = async (data: { 
    title: string; 
    notes?: string; 
    due?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    labels?: string[];
  }) => {
    await onTaskCreate({
      title: data.title,
      notes: data.notes,
      due: data.due,
      priority: data.priority,
      googleTaskListId: selectedListId === 'all' 
        ? taskLists[0]?.googleTaskListId 
        : taskLists.find(list => list.id === selectedListId)?.googleTaskListId
    });
  };
  
  // Remove section rendering - not needed anymore
  /*const renderTaskGroup = (title: string, tasks: GoogleTask[], sectionKey: string, color: string) => {
    if (tasks.length === 0) return null;
    
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div key={sectionKey} className="mb-4">
        <button
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-2">
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
            />
            <span className="text-sm font-medium text-gray-700">{title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
              {tasks.length}
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {tasks.map(task => {
              const contextMenuItems = [
                {
                  label: 'Edit',
                  icon: <Edit3 size={14} />,
                  onClick: () => {
                    onTaskClick(task);
                  }
                },
                {
                  label: 'Mark as ' + (task.status === 'completed' ? 'incomplete' : 'complete'),
                  icon: <CheckCircle2 size={14} />,
                  onClick: () => onTaskComplete(task.googleTaskListId || '', task.id, task.status !== 'completed')
                },
                { separator: true },
                {
                  label: 'Duplicate',
                  icon: <Copy size={14} />,
                  onClick: () => onTaskDuplicate?.(task),
                  disabled: !onTaskDuplicate
                },
                {
                  label: 'Refresh',
                  icon: <RefreshCw size={14} />,
                  onClick: () => {
                    // Trigger a refresh of this specific task
                    window.location.reload();
                  }
                },
                { separator: true },
                {
                  label: 'Delete',
                  icon: <Trash2 size={14} />,
                  onClick: () => onTaskDelete?.(task.googleTaskListId || '', task.id),
                  destructive: true,
                  disabled: !onTaskDelete
                }
              ];
              
              return (
              <DraggableTask key={task.id} task={task}>
                <ContextMenu items={contextMenuItems}>
                  <div
                    className={`
                      group px-3 py-2 bg-white rounded-md border border-gray-200
                      hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer
                      ${task.status === 'completed' ? 'opacity-60' : ''}
                    `}
                    onClick={() => onTaskClick(task)}
                  >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskComplete(task.parent || '', task.id, task.status !== 'completed');
                      }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={16} className="text-purple-600" />
                      ) : (
                        <Circle size={16} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      
                      {(task.due || task.notes) && (
                        <div className="flex items-center gap-3 mt-1">
                          {task.due && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{format(new Date(task.due), 'MMM d')}</span>
                            </div>
                          )}
                          
                          {task.notes && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Hash size={12} />
                              <span className="truncate max-w-[100px]">{task.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger context menu programmatically
                        const event = new MouseEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          clientX: e.clientX,
                          clientY: e.clientY
                        });
                        e.currentTarget.parentElement?.parentElement?.dispatchEvent(event);
                      }}
                    >
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>
                  </div>
                </ContextMenu>
              </DraggableTask>
              );
            })}
          </div>
        )}
      </div>
    );
  };*/
  
  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tasks</h3>
        
        {/* List selector */}
        <select
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={selectedListId}
          onChange={(e) => onListChange(e.target.value)}
        >
          <option value="all">All tasks</option>
          {taskLists.map(list => (
            <option key={list.id} value={list.id}>{list.title}</option>
          ))}
        </select>
        
        {/* Add task button */}
        <div className="mt-3">
          {isCreating ? (
            <InlineTaskCreator
              columnId={selectedListId === 'all' ? taskLists[0]?.id || '' : selectedListId}
              onSubmit={handleCreateTask}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors font-medium"
            >
              <Plus size={16} />
              <span>Add task</span>
            </button>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          {/* Sort Menu Button */}
          <div className="relative" ref={sortMenuRef}>
            <button
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <ArrowUpDown size={14} />
              <span>Sort</span>
            </button>
            
            {showSortMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={() => {
                    setSortBy('created');
                    setShowSortMenu(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50 ${
                    sortBy === 'created' ? 'bg-purple-50 text-purple-600' : ''
                  }`}
                >
                  <GripVertical size={14} className="mr-2" />
                  Date created
                </button>
                <button
                  onClick={() => {
                    setSortBy('due');
                    setShowSortMenu(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                    sortBy === 'due' ? 'bg-purple-50 text-purple-600' : ''
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
                    sortBy === 'title' ? 'bg-purple-50 text-purple-600' : ''
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
                    sortBy === 'priority' ? 'bg-purple-50 text-purple-600' : ''
                  }`}
                >
                  <Flag size={14} className="mr-2" />
                  Priority
                </button>
              </div>
            )}
          </div>
          
          <button
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide' : 'Show'} completed
          </button>
        </div>
      </div>
      
      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No tasks found</p>
            <p className="text-xs mt-1">
              {showCompleted ? 'Try creating a new task' : 'Try showing completed tasks'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTasks.map(task => {
              const contextMenuItems = [
                {
                  label: 'Edit',
                  icon: <Edit3 size={14} />,
                  onClick: () => {
                    onTaskClick(task);
                  }
                },
                {
                  label: 'Mark as ' + (task.status === 'completed' ? 'incomplete' : 'complete'),
                  icon: <CheckCircle2 size={14} />,
                  onClick: () => onTaskComplete(task.googleTaskListId || '', task.id, task.status !== 'completed')
                },
                { separator: true },
                {
                  label: 'Duplicate',
                  icon: <Copy size={14} />,
                  onClick: () => onTaskDuplicate?.(task),
                  disabled: !onTaskDuplicate
                },
                {
                  label: 'Refresh',
                  icon: <RefreshCw size={14} />,
                  onClick: () => {
                    // Trigger a refresh of this specific task
                    window.location.reload();
                  }
                },
                { separator: true },
                {
                  label: 'Delete',
                  icon: <Trash2 size={14} />,
                  onClick: () => onTaskDelete?.(task.googleTaskListId || '', task.id),
                  destructive: true,
                  disabled: !onTaskDelete
                }
              ];
              
              return (
              <DraggableTask key={task.id} task={task}>
                <ContextMenu items={contextMenuItems}>
                  <div
                    className={`
                      group px-3 py-2 bg-white rounded-md border border-gray-200
                      hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer
                      ${task.status === 'completed' ? 'opacity-60' : ''}
                    `}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskComplete(task.googleTaskListId || '', task.id, task.status !== 'completed');
                        }}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={16} className="text-purple-600" />
                        ) : (
                          <Circle size={16} className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </div>
                        
                        {(task.due || task.notes) && (
                          <div className="flex items-center gap-3 mt-1">
                            {task.due && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>{format(new Date(task.due), 'MMM d')}</span>
                              </div>
                            )}
                            
                            {task.notes && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Hash size={12} />
                                <span className="truncate max-w-[100px]">{task.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                </ContextMenu>
              </DraggableTask>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
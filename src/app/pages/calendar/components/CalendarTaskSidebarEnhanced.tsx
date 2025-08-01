import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronDown, Plus, ArrowUpDown, CheckCircle2, Circle, 
  MoreHorizontal, Calendar, Flag, Clock, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { DraggableTask } from './dnd/DraggableTask';
import type { GoogleTask } from '../../../../types/google';

interface CalendarTaskSidebarEnhancedProps {
  taskLists: Array<{ id: string; title: string }>;
  tasks: Record<string, GoogleTask>;
  selectedListId: string;
  onListChange: (listId: string) => void;
  onTaskClick: (task: GoogleTask) => void;
  onTaskComplete: (listId: string, taskId: string, completed: boolean) => Promise<void>;
  onTaskCreate: (data: Partial<GoogleTask>) => Promise<void>;
  onContextMenu?: (e: React.MouseEvent, task: GoogleTask) => void;
}

export const CalendarTaskSidebarEnhanced: React.FC<CalendarTaskSidebarEnhancedProps> = ({
  taskLists,
  tasks,
  selectedListId,
  onListChange,
  onTaskClick,
  onTaskComplete,
  onTaskCreate,
  onContextMenu
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'due' | 'priority' | 'created'>('due');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['today', 'upcoming', 'no-date']));
  
  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const tasksArray = Object.values(tasks);
    
    // Filter by list and completion status
    let filtered = selectedListId === 'all' 
      ? tasksArray 
      : tasksArray.filter(task => task.parent === selectedListId);
      
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
  
  // Group tasks by date sections
  const groupedTasks = useMemo(() => {
    const groups: Record<string, GoogleTask[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDate: []
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
        groups.noDate.push(task);
      } else {
        const dueDate = new Date(task.due);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          groups.overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          groups.tomorrow.push(task);
        } else if (dueDate <= thisWeekEnd) {
          groups.thisWeek.push(task);
        } else if (dueDate <= nextWeekEnd) {
          groups.nextWeek.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });
    
    return groups;
  }, [filteredTasks]);
  
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    await onTaskCreate({
      title: newTaskTitle,
      parent: selectedListId === 'all' ? taskLists[0]?.id : selectedListId
    });
    
    setNewTaskTitle('');
    setIsCreating(false);
  };
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  const renderTaskGroup = (title: string, tasks: GoogleTask[], sectionKey: string, color: string) => {
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
            {tasks.map(task => (
              <DraggableTask key={task.id} task={task}>
                <div
                  className={`
                    group px-3 py-2 bg-white rounded-md border border-gray-200
                    hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer
                    ${task.status === 'completed' ? 'opacity-60' : ''}
                  `}
                  onClick={() => onTaskClick(task)}
                  onContextMenu={(e) => onContextMenu?.(e, task)}
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
                        onContextMenu?.(e, task);
                      }}
                    >
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </DraggableTask>
            ))}
          </div>
        )}
      </div>
    );
  };
  
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
          <option value="all">All Lists</option>
          {taskLists.map(list => (
            <option key={list.id} value={list.id}>{list.title}</option>
          ))}
        </select>
        
        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          <button
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            onClick={() => setSortBy(sortBy === 'due' ? 'title' : 'due')}
          >
            <ArrowUpDown size={14} />
            <span>Sort by {sortBy}</span>
          </button>
          
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
        {renderTaskGroup('Overdue', groupedTasks.overdue, 'overdue', 'bg-red-100 text-red-700')}
        {renderTaskGroup('Today', groupedTasks.today, 'today', 'bg-blue-100 text-blue-700')}
        {renderTaskGroup('Tomorrow', groupedTasks.tomorrow, 'tomorrow', 'bg-green-100 text-green-700')}
        {renderTaskGroup('This Week', groupedTasks.thisWeek, 'thisWeek', 'bg-purple-100 text-purple-700')}
        {renderTaskGroup('Next Week', groupedTasks.nextWeek, 'nextWeek', 'bg-yellow-100 text-yellow-700')}
        {renderTaskGroup('Later', groupedTasks.later, 'later', 'bg-gray-100 text-gray-700')}
        {renderTaskGroup('No Date', groupedTasks.noDate, 'noDate', 'bg-gray-100 text-gray-600')}
      </div>
      
      {/* Create task */}
      <div className="p-4 border-t border-gray-200">
        {isCreating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsCreating(false);
              }}
              placeholder="Task name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <button
              onClick={handleCreateTask}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <Plus size={16} />
            <span>Add task</span>
          </button>
        )}
      </div>
    </div>
  );
};
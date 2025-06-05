import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Circle,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import type { TaskItem, ExtendedCalendarDisplayEvent } from '../../lib/types';

interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  progress: number; // 0-100
  dependencies: string[];
  assignees?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  parent?: string;
  children?: string[];
  isGroup?: boolean;
  color?: string;
}

interface GanttViewProps {
  tasks?: TaskItem[];
  events?: ExtendedCalendarDisplayEvent[];
  className?: string;
  onTaskClick?: (task: GanttTask) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
}

type TimeScale = 'days' | 'weeks' | 'months';

export function GanttView({
  tasks = [],
  events = [],
  className = '',
  onTaskClick,
  onTaskUpdate
}: GanttViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks');
  const [viewStartDate, setViewStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay()); // Start of week
    return date;
  });
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Convert tasks and events to Gantt format
  const ganttTasks = useMemo((): GanttTask[] => {
    const converted: GanttTask[] = [];
    
    // Convert TaskItems to GanttTasks
    tasks.forEach(task => {
      const startDate = task.dueDate ? new Date(task.dueDate) : new Date();
      const duration = Math.max(1, Math.ceil((task.estimatedMinutes || 60) / (8 * 60))); // Convert to work days
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
      
      converted.push({
        id: task.id,
        title: task.title,
        startDate,
        endDate,
        duration,
        progress: task.status === 'done' ? 100 : task.status === 'inprogress' ? 50 : 0,
        dependencies: [],
        priority: task.priority || 'medium',
        status: task.status === 'done' ? 'completed' : 
                task.status === 'inprogress' ? 'in-progress' : 'not-started',
        color: task.priority === 'high' ? '#ef4444' : 
               task.priority === 'medium' ? '#f59e0b' : '#10b981'
      });
    });
    
    // Convert calendar events to Gantt tasks
    events.forEach(event => {
      if (event.taskId) {
        const duration = Math.max(1, Math.ceil(
          (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60 * 24)
        ));
        
        converted.push({
          id: `event-${event.id}`,
          title: event.title,
          startDate: new Date(event.start),
          endDate: new Date(event.end),
          duration,
          progress: Math.random() * 100, // Mock progress
          dependencies: [],
          priority: 'medium',
          status: 'in-progress',
          color: event.color || '#3b82f6'
        });
      }
    });
    
    // Add sample project groups
    if (converted.length > 0) {
      converted.unshift({
        id: 'project-1',
        title: 'Q1 Development Sprint',
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 2, 31),
        duration: 90,
        progress: 65,
        dependencies: [],
        priority: 'high',
        status: 'in-progress',
        isGroup: true,
        children: converted.slice(0, Math.ceil(converted.length / 2)).map(t => t.id),
        color: '#8b5cf6'
      });
    }
    
    return converted;
  }, [tasks, events]);

  // Calculate time grid based on scale
  const timeGrid = useMemo(() => {
    const grid: { date: Date; label: string; isHeader: boolean }[] = [];
    const endDate = new Date(viewStartDate);
    
    let increment: number;
    let periods: number;
    
    switch (timeScale) {
      case 'days':
        increment = 1;
        periods = 14; // 2 weeks
        endDate.setDate(endDate.getDate() + periods);
        break;
      case 'weeks':
        increment = 7;
        periods = 12; // 3 months
        endDate.setDate(endDate.getDate() + periods * 7);
        break;
      case 'months':
        increment = 30;
        periods = 12; // 1 year
        endDate.setMonth(endDate.getMonth() + periods);
        break;
    }
    
    const currentDate = new Date(viewStartDate);
    while (currentDate <= endDate) {
      let label: string;
      switch (timeScale) {
        case 'days':
          label = currentDate.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
          break;
        case 'weeks':
          label = `Week ${Math.ceil(currentDate.getDate() / 7)}`;
          break;
        case 'months':
          label = currentDate.toLocaleDateString([], { month: 'short' });
          break;
      }
      
      grid.push({
        date: new Date(currentDate),
        label,
        isHeader: false
      });
      
      currentDate.setDate(currentDate.getDate() + increment);
    }
    
    return grid;
  }, [viewStartDate, timeScale]);

  // Calculate task bar position and width
  const getTaskBarStyle = useCallback((task: GanttTask) => {
    const gridStart = viewStartDate;
    const gridEnd = timeGrid[timeGrid.length - 1]?.date || new Date();
    const totalDuration = gridEnd.getTime() - gridStart.getTime();
    
    const taskStart = Math.max(task.startDate.getTime(), gridStart.getTime());
    const taskEnd = Math.min(task.endDate.getTime(), gridEnd.getTime());
    
    const startOffset = ((taskStart - gridStart.getTime()) / totalDuration) * 100;
    const width = ((taskEnd - taskStart) / totalDuration) * 100;
    
    return {
      left: `${Math.max(0, startOffset)}%`,
      width: `${Math.max(1, width)}%`
    };
  }, [viewStartDate, timeGrid]);

  // Navigate timeline
  const navigateTimeline = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(viewStartDate);
    
    switch (timeScale) {
      case 'days':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
        break;
      case 'weeks':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 84 : -84)); // 12 weeks
        break;
      case 'months':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 12 : -12));
        break;
    }
    
    setViewStartDate(newDate);
  }, [viewStartDate, timeScale]);

  // Get status icon
  const getStatusIcon = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Circle className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Render task row
  const renderTaskRow = (task: GanttTask, depth: number = 0) => {
    const isSelected = selectedTask === task.id;
    const isHovered = hoveredTask === task.id;
    const barStyle = getTaskBarStyle(task);
    
    return (
      <div
        key={task.id}
        className={`flex border-b border-gray-100 ${
          isSelected ? 'bg-blue-50' : isHovered ? 'bg-gray-50' : ''
        }`}
        onMouseEnter={() => setHoveredTask(task.id)}
        onMouseLeave={() => setHoveredTask(null)}
        onClick={() => {
          setSelectedTask(task.id);
          onTaskClick?.(task);
        }}
      >
        {/* Task information column */}
        <div className="w-80 p-3 border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
            {getStatusIcon(task.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium truncate ${
                  task.isGroup ? 'font-semibold' : ''
                }`}>
                  {task.title}
                </h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    task.priority === 'high' ? 'border-red-300 text-red-700' :
                    task.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                    'border-green-300 text-green-700'
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.duration}d
                </span>
                {task.assignees && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {task.assignees.length}
                  </span>
                )}
                <span>{task.progress}%</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                <DropdownMenuItem>Add Dependency</DropdownMenuItem>
                <DropdownMenuItem>Assign Team Member</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete Task</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Timeline column */}
        <div className="flex-1 relative h-16 p-2">
          <div className="relative h-full">
            {/* Task bar */}
            <div
              className={`absolute top-2 h-8 rounded transition-all duration-200 cursor-pointer ${
                task.isGroup ? 'bg-opacity-40' : ''
              } ${isHovered ? 'shadow-lg' : 'shadow-sm'}`}
              style={{
                ...barStyle,
                backgroundColor: task.color || '#3b82f6'
              }}
            >
              {/* Progress overlay */}
              <div
                className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded"
                style={{ width: `${task.progress}%` }}
              />
              
              {/* Task bar content */}
              <div className="flex items-center justify-between h-full px-2 text-white text-xs">
                <span className="truncate font-medium">{task.title}</span>
                <span>{task.progress}%</span>
              </div>
            </div>
            
            {/* Dependencies lines (simplified) */}
            {task.dependencies.length > 0 && (
              <div className="absolute top-6 left-0 w-2 h-2 bg-gray-400 rounded-full" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Project Timeline</h2>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeScale} onValueChange={(value: TimeScale) => setTimeScale(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => setViewStartDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Time scale header */}
      <div className="flex border-b bg-gray-50">
        <div className="w-80 p-3 border-r border-gray-200 flex-shrink-0 font-medium text-sm">
          Tasks
        </div>
        <div className="flex-1 flex">
          {timeGrid.map((period, index) => (
            <div
              key={index}
              className="flex-1 p-2 border-r border-gray-200 text-center text-sm font-medium"
              style={{ minWidth: '60px' }}
            >
              {period.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks and timeline */}
      <ScrollArea className="flex-1">
        <div className="min-h-full">
          {ganttTasks.length > 0 ? (
            ganttTasks.map(task => renderTaskRow(task))
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks or projects to display</p>
                <p className="text-sm">Add tasks to see timeline visualization</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Today line indicator */}
      <div className="absolute top-20 bottom-0 pointer-events-none">
        {(() => {
          const today = new Date();
          const gridStart = viewStartDate;
          const gridEnd = timeGrid[timeGrid.length - 1]?.date || new Date();
          
          if (today >= gridStart && today <= gridEnd) {
            const totalDuration = gridEnd.getTime() - gridStart.getTime();
            const todayOffset = ((today.getTime() - gridStart.getTime()) / totalDuration) * 100;
            
            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `calc(320px + ${todayOffset}%)` }}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
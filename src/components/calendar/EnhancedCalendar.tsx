import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Play, 
  AlertTriangle, 
  Zap,
  Brain,
  Target,
  Timer,
  ExternalLink,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { useCalendar } from '../../hooks/use-calendar';
import { useFocusMode } from '../../hooks/use-focus-mode';
import { useDragState } from '../../hooks/use-drag-drop';
import { dragDropManager, DropOperations, DragData } from '../../lib/drag-drop-system';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { PomodoroTimer } from '../focus/PomodoroTimer';
import type { CalendarViewMode, TaskItem, ExtendedCalendarDisplayEvent } from '../../lib/types';

interface EnhancedCalendarProps {
  className?: string;
  defaultView?: CalendarViewMode;
  showFocusIntegration?: boolean;
  enableDragDrop?: boolean;
  showOverdueTasks?: boolean;
}

export function EnhancedCalendar({
  className = '',
  defaultView = 'week',
  showFocusIntegration = true,
  enableDragDrop = true,
  showOverdueTasks = true
}: EnhancedCalendarProps) {
  const {
    events,
    view,
    selectedDate,
    timeSlots,
    freeTimeSlots,
    isLoading,
    error,
    addTimeBlockedTask,
    findOptimalTimeSlots,
    changeView,
    navigateToDate,
    config
  } = useCalendar();

  const { focusMode, togglePomodoroTimer } = useFocusMode();
  const dragState = useDragState();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarDisplayEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [hoveredTimeSlot, setHoveredTimeSlot] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update current time every minute for "now" line
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Register drag-drop zone for time slots
  useEffect(() => {
    if (!enableDragDrop) return;

    const cleanup = dragDropManager.registerDropZone({
      id: 'calendar-timeslots',
      accepts: ['task'],
      onDrop: async (dragData: DragData, position) => {
        if (dragData.type !== 'task' || !position) return false;

        try {
          // Find the time slot based on drop position
          const element = document.elementFromPoint(position.x, position.y);
          const timeSlotElement = element?.closest('[data-time-slot]');
          
          if (!timeSlotElement) return false;

          const timeSlotId = timeSlotElement.getAttribute('data-time-slot');
          const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
          
          if (!timeSlot || !timeSlot.isAvailable) return false;

          const task = dragData.metadata.originalTask as TaskItem;
          await addTimeBlockedTask(task, timeSlot.start, task.estimatedMinutes);
          
          return true;
        } catch (error) {
          console.error('Failed to add time-blocked task:', error);
          return false;
        }
      },
      onDragOver: (dragData) => {
        return dragData.type === 'task';
      },
      onDragEnter: () => {
        // Visual feedback when dragging over calendar
      },
      onDragLeave: () => {
        setHoveredTimeSlot(null);
      }
    });

    return cleanup;
  }, [enableDragDrop, timeSlots, addTimeBlockedTask]);

  // Handle view navigation
  const navigateView = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    navigateToDate(newDate);
  }, [view, selectedDate, navigateToDate]);

  // Start focus session for event
  const startFocusSession = useCallback((event: ExtendedCalendarDisplayEvent) => {
    if (event.taskId && showFocusIntegration) {
      // Start Pomodoro timer with task context
      togglePomodoroTimer();
      // Could integrate with task tracking here
      console.log('Starting focus session for:', event.title);
    }
  }, [togglePomodoroTimer, showFocusIntegration]);

  // Get overdue tasks for today's view
  const getOverdueTasks = useCallback((): TaskItem[] => {
    // This would typically come from a task management hook
    // For now, return mock overdue tasks
    return [
      {
        id: 'overdue-1',
        title: 'Review quarterly report',
        description: 'Overdue by 2 days',
        status: 'todo',
        priority: 'high',
        isOverdue: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedMinutes: 45
      }
    ];
  }, []);

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get current time position for "now" line
  const getCurrentTimePosition = (): { top: string; visible: boolean } => {
    if (view !== 'day' && view !== 'week') return { top: '0%', visible: false };
    
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(config.workingHours.start, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(config.workingHours.end, 0, 0, 0);
    
    if (now < todayStart || now > todayEnd) {
      return { top: '0%', visible: false };
    }
    
    const totalMinutes = (todayEnd.getTime() - todayStart.getTime()) / (1000 * 60);
    const currentMinutes = (now.getTime() - todayStart.getTime()) / (1000 * 60);
    const percentage = (currentMinutes / totalMinutes) * 100;
    
    return { top: `${percentage}%`, visible: true };
  };

  // Render time slot
  const renderTimeSlot = (slot: any, index: number) => {
    const isHovered = hoveredTimeSlot === slot.id;
    const isDragTarget = dragState.isDragging && dragState.dragData?.type === 'task';
    const nowPosition = getCurrentTimePosition();
    
    return (
      <div
        key={slot.id}
        data-time-slot={slot.id}
        data-drop-zone="calendar-timeslots"
        className={`
          relative border-b border-gray-100 h-16 transition-all duration-200
          ${slot.isAvailable ? 'hover:bg-blue-50' : ''}
          ${isHovered && isDragTarget ? 'bg-blue-100 border-blue-300' : ''}
          ${isDragTarget && slot.isAvailable ? 'drop-zone-valid' : ''}
        `}
        onMouseEnter={() => isDragTarget && setHoveredTimeSlot(slot.id)}
        onMouseLeave={() => setHoveredTimeSlot(null)}
      >
        {/* Time label */}
        <div className="absolute left-0 top-0 text-xs text-gray-500 px-2 py-1">
          {formatTime(slot.start)}
        </div>
        
        {/* Events in this slot */}
        {slot.events.map((event: ExtendedCalendarDisplayEvent) => (
          <EventCard
            key={event.id}
            event={event}
            onSelect={setSelectedEvent}
            onStartFocus={showFocusIntegration ? startFocusSession : undefined}
          />
        ))}
        
        {/* Free time indicator */}
        {slot.isAvailable && (
          <div className="absolute right-2 top-2 opacity-50">
            <Plus className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        {/* Now line overlay */}
        {nowPosition.visible && index === Math.floor(timeSlots.length * parseFloat(nowPosition.top) / 100) && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
            style={{ top: nowPosition.top }}
          >
            <div className="absolute left-0 top-0 w-2 h-2 bg-red-500 rounded-full -translate-y-1"></div>
          </div>
        )}
      </div>
    );
  };

  const EventCard = ({ 
    event, 
    onSelect, 
    onStartFocus 
  }: { 
    event: ExtendedCalendarDisplayEvent; 
    onSelect: (event: ExtendedCalendarDisplayEvent) => void;
    onStartFocus?: (event: ExtendedCalendarDisplayEvent) => void;
  }) => {
    const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60);
    const progress = event.taskId ? Math.random() * 100 : 0; // Mock progress
    
    return (
      <Card 
        className={`
          absolute left-14 right-2 mx-1 cursor-pointer transition-all hover:shadow-md
          ${event.color ? '' : 'border-blue-200 bg-blue-50'}
        `}
        style={{ backgroundColor: event.color }}
        onClick={() => {
          onSelect(event);
          setShowEventDialog(true);
        }}
      >
        <CardContent className="p-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{event.title}</h4>
              <p className="text-xs text-gray-600">{Math.round(duration)} min</p>
            </div>
            
            {onStartFocus && event.taskId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(event);
                }}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Progress bar for task-based events */}
          {event.taskId && (
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Time indicators */}
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{formatTime(new Date(event.start))}</span>
            {event.source === 'google-calendar' && (
              <ExternalLink className="h-3 w-3" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`} ref={calendarRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateView('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateView('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h2 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString([], { 
              month: 'long', 
              year: 'numeric',
              ...(view === 'day' ? { day: 'numeric' } : {})
            })}
          </h2>
          
          {showFocusIntegration && focusMode.options.pomodoroTimer && (
            <PomodoroTimer className="ml-4" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: CalendarViewMode) => changeView(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => navigateToDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Overdue Tasks Banner */}
      {showOverdueTasks && view === 'day' && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Overdue Tasks</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getOverdueTasks().map(task => (
              <Badge key={task.id} variant="destructive" className="text-xs">
                {task.title} ({task.estimatedMinutes}m)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Free Time Suggestions */}
      {freeTimeSlots.length > 0 && view === 'day' && (
        <div className="bg-green-50 border-b border-green-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Suggested Free Time</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {freeTimeSlots.slice(0, 3).map((slot, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {formatTime(slot.start)} - {formatTime(slot.end)} ({slot.duration}m)
                <Zap className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="relative">
              {/* Time slots */}
              {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
              
              {/* Drag overlay */}
              {dragState.isDragging && dragState.dragData?.type === 'task' && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-20">
                  <div className="text-blue-700 font-medium">
                    Drop task to schedule: {dragState.dragData.content}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent && (
              <>
                <div>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(new Date(selectedEvent.start))} - {formatTime(new Date(selectedEvent.end))}
                  </div>
                  {selectedEvent.source && (
                    <Badge variant="outline">{selectedEvent.source}</Badge>
                  )}
                </div>
                
                {selectedEvent.taskId && showFocusIntegration && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => startFocusSession(selectedEvent)}
                      className="flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      Start Focus Session
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={togglePomodoroTimer}
                      className="flex items-center gap-2"
                    >
                      <Timer className="h-4 w-4" />
                      Pomodoro Timer
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
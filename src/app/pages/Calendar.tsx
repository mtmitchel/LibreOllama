import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, Plus, X, Calendar as CalendarIcon, Clock, MapPin, FileText, Flag, Hash, Repeat, List as ListIcon, CheckCircle, CircleDashed } from 'lucide-react';
import { Card, Button, Tag, Input } from '../../components/ui';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useHeader } from '../contexts/HeaderContext';
import { useKanbanStore, KanbanTask } from '../../stores/useKanbanStore';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { GoogleCalendarEvent } from '../../types/google';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Schedule Task Modal Component
const ScheduleTaskModal = ({ 
  isOpen, 
  task, 
  selectedDate, 
  onClose, 
  onSchedule 
}: {
  isOpen: boolean;
  task: KanbanTask | null;
  selectedDate: Date | null;
  onClose: () => void;
  onSchedule: (data: { 
    title: string; 
    startTime: string; 
    endTime: string; 
    description?: string; 
    location?: string 
  }) => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
  });

  useEffect(() => {
    if (task && selectedDate) {
      setFormData({
        title: task.title,
        startTime: '09:00',
        endTime: '10:00',
        description: task.notes || '',
        location: '',
      });
    }
  }, [task, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(formData);
    onClose();
  };

  if (!isOpen || !task || !selectedDate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Schedule Task</h2>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-3 bg-secondary-ghost rounded-lg">
              <p className="text-sm text-muted">
                Scheduling for: <strong>{selectedDate.toLocaleDateString()}</strong>
              </p>
              <p className="text-sm font-medium text-primary mt-1">{task.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event title..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event location..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-6 border-t border-border-default">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Calendar: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>('dayGridMonth');
  const [showTaskPanel, setShowTaskPanel] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
  const [selectedTaskForScheduling, setSelectedTaskForScheduling] = useState<KanbanTask | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);

  // Use both stores - simplified kanban store for tasks, legacy google store for calendar events
  const {
    columns,
    isSyncing,
    isInitialized,
    initialize: initializeKanban,
    deleteTask,
    toggleComplete,
  } = useKanbanStore();

  const { 
    accounts, 
    activeAccount, 
    calendarEvents, 
    isLoadingCalendar,
    setActiveAccount, 
    fetchCalendarEvents,
    createCalendarEvent,
  } = useGoogleCalendarStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeKanban().catch((err) => {
        console.error('Failed to initialize kanban store:', err);
        setError('Failed to load tasks. Please refresh the page.');
      });
    }
  }, [isInitialized, initializeKanban]);

  useEffect(() => {
    // Set a mock active account if none exists
    if (!activeAccount) {
      const mockAccount = {
        id: 'mock-account',
        email: 'user@example.com',
        name: 'Mock User',
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresAt: Date.now() + 3600000,
      };
      setActiveAccount(mockAccount);
    }
  }, [activeAccount, setActiveAccount]);

  useEffect(() => {
    if (activeAccount) {
      setError(null);
      fetchCalendarEvents().catch((err) => {
        console.error('Failed to fetch calendar events:', err);
        setError('Failed to load calendar events. Please try again.');
      });
    }
  }, [activeAccount, fetchCalendarEvents]);

  // Convert Google Calendar events to FullCalendar format
  const fullCalendarEvents = calendarEvents.map(event => ({
    id: event.id,
    title: event.summary,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    allDay: !event.start.dateTime,
    extendedProps: {
      description: event.description,
      location: event.location,
      status: event.status,
    }
  }));

  const goToToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (direction === 'prev') {
        api.prev();
      } else {
        api.next();
      }
    }
  };

  const changeView = (newView: CalendarView) => {
    setView(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };

  const formatTaskDueDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const isTaskOverdue = (task: KanbanTask): boolean => {
    if (!task.due) return false;
    const dueDate = new Date(task.due);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status === 'needsAction';
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDateInfo(selectInfo);
    
    // Pre-fill times based on selection
    const startTime = selectInfo.start.toISOString().slice(11, 16);
    const endTime = selectInfo.end.toISOString().slice(11, 16);
    
    setEventForm({
      title: '',
      description: '',
      location: '',
      startTime: startTime,
      endTime: endTime,
    });
    
    setShowEventModal(true);
  };

  const handleTaskDrop = (info: any) => {
    const droppedData = JSON.parse(info.draggedEl.dataset.task || '{}');
    
    if (droppedData.type === 'task' && droppedData.taskData) {
      const task = droppedData.taskData as KanbanTask;
      const dropDate = info.date || new Date();
      
      setSelectedTaskForScheduling(task);
      setSelectedScheduleDate(dropDate);
      setShowScheduleModal(true);
      
      // Prevent the default behavior
      info.draggedEl.parentNode?.removeChild(info.draggedEl);
    }
  };

  const handleScheduleTask = async (scheduleData: {
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
  }) => {
    if (!selectedTaskForScheduling || !selectedScheduleDate) return;

    try {
      const startDateTime = new Date(selectedScheduleDate);
      const endDateTime = new Date(selectedScheduleDate);
      
      // Set times
      const [startHours, startMinutes] = scheduleData.startTime.split(':');
      const [endHours, endMinutes] = scheduleData.endTime.split(':');
      
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const eventData = {
        summary: scheduleData.title,
        description: scheduleData.description || `Scheduled from task: ${selectedTaskForScheduling.title}`,
        location: scheduleData.location,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await createCalendarEvent(eventData);
      
      // Optionally mark the task as completed
      const taskData = useKanbanStore.getState().getTask(selectedTaskForScheduling.id);
      if (taskData && confirm('Mark the original task as completed?')) {
        await toggleComplete(taskData.columnId, selectedTaskForScheduling.id, true);
      }
      
      setShowScheduleModal(false);
      setSelectedTaskForScheduling(null);
      setSelectedScheduleDate(null);
      
    } catch (err) {
      console.error('Failed to schedule task:', err);
      setError('Failed to schedule task. Please try again.');
    }
  };

  const handleEventFormSubmit = async () => {
    if (!eventForm.title.trim() || !selectedDateInfo) return;

    setIsCreatingEvent(true);
    setError(null);

    try {
      const startDateTime = new Date(selectedDateInfo.start);
      const endDateTime = new Date(selectedDateInfo.end);
      
      // Update times if provided
      if (eventForm.startTime) {
        const [hours, minutes] = eventForm.startTime.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes));
      }
      
      if (eventForm.endTime) {
        const [hours, minutes] = eventForm.endTime.split(':');
        endDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      const eventData = {
        summary: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await createCalendarEvent(eventData);
      setShowEventModal(false);
      setSelectedDateInfo(null);
      setEventForm({ title: '', description: '', location: '', startTime: '', endTime: '' });
      
      if (selectedDateInfo.view?.calendar) {
        selectedDateInfo.view.calendar.unselect();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedDateInfo(null);
    setEditingEvent(null);
    setEventForm({ title: '', description: '', location: '', startTime: '', endTime: '' });
    
    if (selectedDateInfo?.view?.calendar) {
      selectedDateInfo.view.calendar.unselect();
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    
    // Pre-fill form with existing event data
    const startTime = new Date(event.start).toISOString().slice(11, 16);
    const endTime = event.end ? new Date(event.end).toISOString().slice(11, 16) : startTime;
    
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      description: event.extendedProps.description || '',
      location: event.extendedProps.location || '',
      startTime: startTime,
      endTime: endTime,
    });
    setShowEventModal(true);
  };

  const handleEventDrop = (dropInfo: any) => {
    // Handle event drag and drop
    console.log('Event moved:', dropInfo);
  };

  // Get all tasks from the simplified store
  const allTasks = columns.flatMap(column => column.tasks);
  const filteredTasks = allTasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return task.status === 'needsAction';
    if (taskFilter === 'completed') return task.status === 'completed';
    return true;
  });

  useEffect(() => {
    const headerProps = {
      title: "Calendar",
    };

    setHeaderProps(headerProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-primary mb-2">No Google Account Connected</h2>
          <p className="text-muted">Please connect a Google account to view your calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
          <div className="flex-1 flex flex-col gap-6 p-6">
            {/* Error Display */}
            {error && (
              <Card className="border-error bg-error-ghost">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0 text-error">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-error font-medium">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="text-error hover:bg-error-ghost"
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            )}
            
            {/* Calendar Navigation */}
            <Card> 
              <div className="flex items-center justify-between gap-4 p-4"> 
                {/* Left side - Navigation */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigateCalendar('prev')}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigateCalendar('next')}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Next"
                  >
                    <ChevronRight size={20} />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={goToToday} 
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Today
                  </Button>
                </div>

                {/* Center - View Toggle */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-1">
                  <Button
                    variant={view === 'dayGridMonth' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('dayGridMonth')}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === 'timeGridWeek' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('timeGridWeek')}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === 'timeGridDay' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('timeGridDay')}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Day
                  </Button>
                </div>

                {/* Right side - Toggle Tasks Panel */}
                <Button
                  variant={showTaskPanel ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowTaskPanel(!showTaskPanel)}
                  className="flex items-center gap-2"
                >
                  <ListChecks size={16} />
                  {showTaskPanel ? 'Hide Tasks' : 'Show Tasks'}
                </Button>
              </div>
            </Card>

            {/* FullCalendar */}
            <Card className="flex-1"> 
              <div className="h-full p-4">
                {isLoadingCalendar ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted">Loading calendar...</p>
                    </div>
                  </div>
                ) : (
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={view}
                    headerToolbar={false} // We handle navigation ourselves
                    height="100%"
                    events={fullCalendarEvents}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    editable={true}
                    droppable={true}
                    drop={handleTaskDrop}
                    eventDisplay="block"
                    dayHeaderFormat={{ weekday: 'short' }}
                    aspectRatio={1.8}
                    nowIndicator={true}
                    eventColor="#3b82f6"
                    eventBorderColor="#2563eb"
                    eventTextColor="#ffffff"
                    loading={(isLoading) => {
                      console.log('FullCalendar loading state:', isLoading);
                    }}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Task Panel */}
        {showTaskPanel && (
          <Card className="w-80 flex-shrink-0 h-full flex flex-col"> 
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-primary">
                  Tasks
                </h3>
                <Tag variant="solid" color="muted" size="sm">
                  {filteredTasks.length}
                </Tag>
              </div>
              <div className="flex items-center gap-2">
                {isSyncing && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowTaskPanel(false)}
                  className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Close tasks panel"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            {/* Task Filter Buttons */}
            <div className="flex gap-1 p-3 border-b border-border-default">
              <Button
                variant={taskFilter === 'pending' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('pending')}
                className="text-xs flex-1"
              >
                Pending ({allTasks.filter(t => t.status === 'needsAction').length})
              </Button>
              <Button
                variant={taskFilter === 'completed' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('completed')}
                className="text-xs flex-1"
              >
                Done ({allTasks.filter(t => t.status === 'completed').length})
              </Button>
              <Button
                variant={taskFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTaskFilter('all')}
                className="text-xs flex-1"
              >
                All ({allTasks.length})
              </Button>
            </div>

            {/* Drag Instructions */}
            <div className="p-3 bg-info-ghost border-b border-border-default">
              <p className="text-xs text-info">
                💡 Drag tasks onto calendar dates to schedule them as events
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <p>No tasks found.</p>
                  <p className="text-xs mt-1">Tasks from your kanban board will appear here.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="group transition-all duration-200 hover:shadow-md hover:scale-102 p-3 bg-bg-secondary cursor-grab border border-border-default"
                    draggable
                    data-task={JSON.stringify({
                      type: 'task',
                      taskId: task.id,
                      taskTitle: task.title,
                      taskData: task
                    })}
                    onDragStart={(e) => {
                      setDraggedTask(task);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedTask(null)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle size={14} className="text-success" />
                        ) : (
                          <CircleDashed size={14} className="text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          {/* Priority indicator */}
                          {task.metadata?.priority && task.metadata.priority !== 'normal' && (
                            <Flag size={10} className={`
                              ${task.metadata.priority === 'urgent' ? 'text-error' : ''}
                              ${task.metadata.priority === 'high' ? 'text-orange-500' : ''}
                              ${task.metadata.priority === 'low' ? 'text-muted' : ''}
                            `} />
                          )}
                          <h4 className="text-sm font-medium text-primary truncate flex-1">
                            {task.title}
                          </h4>
                          {task.metadata?.recurring?.enabled && (
                            <Repeat size={10} className="text-muted" />
                          )}
                        </div>
                        
                        {task.notes && (
                          <p className="text-xs text-muted mb-2 line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                        
                        {/* Labels */}
                        {task.metadata?.labels && task.metadata.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.metadata.labels.slice(0, 2).map((label, index) => (
                              <span key={index} className="text-xs px-1 py-0.5 bg-accent-ghost text-accent-primary rounded">
                                {label}
                              </span>
                            ))}
                            {task.metadata.labels.length > 2 && (
                              <span className="text-xs text-muted">+{task.metadata.labels.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Due date */}
                        {task.due && (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock size={10} />
                            <span className={isTaskOverdue(task) ? 'text-error' : 'text-muted'}>
                              Due {formatTaskDueDate(task.due)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X size={16} />
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  placeholder="Event title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Start</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">End</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  placeholder="Event location..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t border-border-default">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleEventFormSubmit}
                disabled={isCreatingEvent}
              >
                {isCreatingEvent ? 'Creating...' : (editingEvent ? 'Update' : 'Create')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Task Modal */}
      <ScheduleTaskModal
        isOpen={showScheduleModal}
        task={selectedTaskForScheduling}
        selectedDate={selectedScheduleDate}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedTaskForScheduling(null);
          setSelectedScheduleDate(null);
        }}
        onSchedule={handleScheduleTask}
      />
    </>
  );
};

export default Calendar;
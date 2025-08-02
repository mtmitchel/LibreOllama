import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, 
  ListChecks, Sidebar
} from 'lucide-react';

import { useHeader } from '../contexts/HeaderContext';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useActiveGoogleAccount } from '../../stores/settingsStore';

// Import calendar components
import { CalendarHeader } from './calendar/components/CalendarHeader';
import { CalendarTaskSidebarEnhanced } from './calendar/components/CalendarTaskSidebarEnhanced';
import { CalendarMonthGrid } from './calendar/components/grid/CalendarMonthGrid';
import { CalendarWeekGrid } from './calendar/components/grid/CalendarWeekGrid';
import { CalendarQuickViewModal } from './calendar/components/CalendarQuickViewModal';
import { AsanaEventModal } from './calendar/components/AsanaEventModal';
import { AsanaTaskModal } from './calendar/components/AsanaTaskModal';
import { CompactTaskEditModal } from './calendar/components/CompactTaskEditModal';

// Import utilities and types
import { CalendarView, CalendarEvent, DraggedItem } from './calendar/types/calendar';
import { navigateDate, getDateRange, getWeekDays } from './calendar/utils/dateUtils';
import { useCalendarOperations } from './calendar/hooks/useCalendarOperations';

// Import styles
import './styles/calendar-asana.css';
import './styles/calendar-custom.css';

export default function CalendarCustom() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const activeAccount = useActiveGoogleAccount();
  const { createTask } = useUnifiedTaskStore();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [showTasksSidebar, setShowTasksSidebar] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('all');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [quickViewModal, setQuickViewModal] = useState<{
    isOpen: boolean;
    events: CalendarEvent[];
    position?: { x: number; y: number };
  }>({ isOpen: false, events: [] });
  
  // Use the calendar operations hook
  const {
    calendars,
    taskLists,
    googleTasks,
    calendarEventsWithTasks,
    isLoading,
    error,
    isAuthenticated,
    fetchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    createGoogleTask,
    updateGoogleTask,
    deleteGoogleTask,
    syncAllTasks,
    refreshData
  } = useCalendarOperations();
  
  // Get date range for current view
  const dateRange = useMemo(() => 
    getDateRange(currentDate, view), 
    [currentDate, view]
  );
  
  // Get week dates for week view
  const weekDates = useMemo(() => 
    view === 'week' ? getWeekDays(currentDate) : [],
    [currentDate, view]
  );
  
  // Filter events based on search and convert dates
  const filteredEvents = useMemo(() => {
    // DON'T convert dates - they should already be Date objects from the hook
    // Just pass them through as-is to preserve the allDay flag
    const eventsWithDates = calendarEventsWithTasks;
    
    if (!searchQuery) return eventsWithDates;
    
    const query = searchQuery.toLowerCase();
    return eventsWithDates.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.extendedProps?.description?.toLowerCase().includes(query) ||
      event.extendedProps?.location?.toLowerCase().includes(query)
    );
  }, [calendarEventsWithTasks, searchQuery]);
  
  // Navigation handlers
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    setCurrentDate(navigateDate(currentDate, direction, view));
  }, [currentDate, view]);
  
  const handleViewChange = useCallback((newView: string) => {
    // Map FullCalendar view names to our custom calendar view names
    const viewMap: Record<string, CalendarView> = {
      'dayGridMonth': 'month',
      'timeGridWeek': 'week',
      'timeGridDay': 'day',
      'month': 'month',
      'week': 'week',
      'day': 'day'
    };
    
    const mappedView = viewMap[newView] || 'month';
    setView(mappedView);
  }, []);
  
  // Event handlers
  const handleEventClick = useCallback((event: CalendarEvent, e?: React.MouseEvent) => {
    // Show quick view modal instead of full modal
    const position = e ? { x: e.clientX, y: e.clientY } : undefined;
    setQuickViewModal({
      isOpen: true,
      events: [event],
      position
    });
  }, []);
  
  const handleDateClick = useCallback((date: Date, time?: Date) => {
    const startDate = time || date;
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    
    setSelectedEvent({
      id: '',
      title: '',
      start: startDate,
      end: endDate,
      allDay: !time,
      type: 'event',
      source: 'local'
    });
    setShowEventModal(true);
  }, []);
  
  const handleMoreClick = useCallback((events: CalendarEvent[], e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewModal({
      isOpen: true,
      events,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);
  
  const handleEventResize = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId);
      if (!event) return;
      
      // Update the event with new times
      await updateCalendarEvent({
        ...event,
        start: event.allDay 
          ? { date: format(newStart, 'yyyy-MM-dd') }
          : { dateTime: newStart.toISOString() },
        end: event.allDay
          ? { date: format(newEnd, 'yyyy-MM-dd') }
          : { dateTime: newEnd.toISOString() }
      });
      
      // Refresh to show updated event
      await refreshData();
    } catch (error) {
      console.error('Failed to resize event:', error);
      alert('Failed to resize event. Please try again.');
    }
  }, [filteredEvents, updateCalendarEvent, refreshData]);
  
  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === 'task') {
      setDraggedItem({
        type: 'task',
        data: active.data.current.task
      });
    } else if (active.data.current?.type === 'event') {
      setDraggedItem({
        type: 'event',
        data: active.data.current.event
      });
    }
  }, []);
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedItem) {
      setDraggedItem(null);
      return;
    }
    
    // Handle dropping task on calendar
    if (draggedItem.type === 'task' && over.data.current?.date) {
      const task = draggedItem.data as any;
      const dropDate = over.data.current.date;
      const dropTime = over.data.current.time;
      const isAllDay = over.data.current.allDay;
      
      // Calculate start and end times for the time block
      let startDateTime: Date;
      let endDateTime: Date;
      
      if (dropTime) {
        // Dropped on a specific time slot
        startDateTime = new Date(dropTime);
        endDateTime = new Date(dropTime);
        endDateTime.setHours(endDateTime.getHours() + 1); // Default 1 hour duration
      } else {
        // Dropped on a day (all-day event or default time)
        startDateTime = new Date(dropDate);
        if (isAllDay) {
          // Create all-day event
          endDateTime = new Date(dropDate);
          endDateTime.setDate(endDateTime.getDate() + 1);
        } else {
          // Create at default time (9 AM)
          startDateTime.setHours(9, 0, 0, 0);
          endDateTime = new Date(startDateTime);
          endDateTime.setHours(10, 0, 0, 0);
        }
      }
      
      try {
        // Create calendar event from task
        // Store metadata in description as JSON for now until extendedProperties work
        const metadata = {
          sourceTaskId: task.id,
          sourceTaskListId: task.googleTaskListId,
          isTimeBlock: true,
          isCompleted: task.status === 'completed',
          taskStatus: task.status
        };
        
        await createCalendarEvent({
          id: '', // Empty ID for new events
          summary: `[Task] ${task.title}`,
          description: `${task.notes || ''}\n\n---METADATA---\n${JSON.stringify(metadata)}`,
          start: isAllDay 
            ? { date: format(startDateTime, 'yyyy-MM-dd') }
            : { dateTime: startDateTime.toISOString() },
          end: isAllDay
            ? { date: format(endDateTime, 'yyyy-MM-dd') }
            : { dateTime: endDateTime.toISOString() },
          calendarId: 'primary', // Add calendar ID
          extendedProperties: {
            private: {
              sourceTaskId: task.id,
              sourceTaskListId: task.googleTaskListId,
              isTimeBlock: 'true',
              isCompleted: task.status === 'completed' ? 'true' : 'false',
              taskStatus: task.status
            }
          }
        });
        
        // Refresh calendar to show the new event
        await refreshData();
        
      } catch (error) {
        console.error('Failed to create time block from task:', error);
        alert('Failed to create time block. Please try again.');
      }
    }
    
    setDraggedItem(null);
  }, [draggedItem, createCalendarEvent, updateGoogleTask]);
  
  // Clear header props on unmount
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);
  
  // Load calendar data when component mounts
  useEffect(() => {
    if (activeAccount && isAuthenticated) {
      fetchCalendarEvents();
      syncAllTasks();
    }
  }, [activeAccount, isAuthenticated, fetchCalendarEvents, syncAllTasks]);
  
  // Handle authentication
  if (!activeAccount || !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Connect Your Google Account
          </h2>
          <p className="mb-6 text-gray-600">
            Please connect your Google account to view your calendar and tasks.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC' }}>
        {/* Header */}
        <CalendarHeader 
          currentDate={currentDate}
          currentViewTitle={format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          view={view === 'month' ? 'dayGridMonth' : view === 'week' ? 'timeGridWeek' : 'timeGridDay'}
          showTasksSidebar={showTasksSidebar}
          onNavigate={handleNavigate}
          onDateSelect={setCurrentDate}
          onViewChange={handleViewChange}
          onToggleTasksSidebar={() => setShowTasksSidebar(!showTasksSidebar)}
          onNewEvent={() => handleDateClick(new Date())}
        />
        
        {/* Main Content Area */}
        <div className="flex flex-1 gap-6 p-6 min-h-0 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {view === 'month' && (
              <CalendarMonthGrid
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onMoreClick={handleMoreClick}
              />
            )}
            
            {view === 'week' && (
              <CalendarWeekGrid
                currentDate={currentDate}
                weekDates={weekDates}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onEventResize={handleEventResize}
              />
            )}
            
            {view === 'day' && (
              <CalendarWeekGrid
                currentDate={currentDate}
                weekDates={[currentDate]}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onEventResize={handleEventResize}
              />
            )}
          </div>
          
          {/* Task Sidebar */}
          {showTasksSidebar && (
            <CalendarTaskSidebarEnhanced 
              taskLists={taskLists}
              tasks={googleTasks}
              selectedListId={selectedTaskListId}
              onListChange={setSelectedTaskListId}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setShowTaskModal(true);
              }}
              onTaskComplete={async (listId, taskId, completed) => {
                try {
                  console.log('Completing task:', { listId, taskId, completed });
                  await updateGoogleTask(listId, taskId, {
                    status: completed ? 'completed' : 'needsAction'
                  });
                  await refreshData();
                } catch (error) {
                  console.error('Failed to complete task:', error);
                  alert('Failed to update task status');
                }
              }}
              onTaskCreate={createGoogleTask}
              onTaskDelete={async (listId, taskId) => {
                try {
                  await deleteGoogleTask(listId, taskId);
                  await refreshData();
                } catch (error) {
                  console.error('Failed to delete task:', error);
                  alert('Failed to delete task');
                }
              }}
              onTaskDuplicate={async (task) => {
                try {
                  const duplicateData = {
                    title: `${task.title} (copy)`,
                    notes: task.notes,
                    due: task.due,
                    priority: task.priority,
                    labels: task.labels,
                    columnId: task.columnId,
                    googleTaskListId: task.googleTaskListId
                  };
                  console.log('Duplicating task:', duplicateData);
                  await createTask(duplicateData);
                  await refreshData();
                } catch (error) {
                  console.error('Failed to duplicate task:', error);
                  alert('Failed to duplicate task: ' + (error as any).message);
                }
              }}
            />
          )}
        </div>
        
        {/* Event Modal */}
        <AsanaEventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSave={async (eventData) => {
            try {
              if (selectedEvent?.id) {
                await updateCalendarEvent(selectedEvent.id, eventData);
                alert('Event updated successfully!');
              } else {
                await createCalendarEvent(eventData);
                alert('Event created successfully!');
              }
              // Force a complete refresh of all calendar data
              await refreshData();
              setShowEventModal(false);
              setSelectedEvent(null);
            } catch (error) {
              console.error('Failed to save event:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              alert('Failed to save event: ' + errorMessage);
              // Log the full error details for debugging
              console.log('Event data that failed:', eventData);
            }
          }}
          onDelete={async (eventId) => {
            try {
              await deleteCalendarEvent(eventId);
              await fetchCalendarEvents();
              setShowEventModal(false);
              setSelectedEvent(null);
            } catch (error) {
              console.error('Failed to delete event:', error);
            }
          }}
          calendars={calendars}
        />
        
        {/* Task Modal - Compact for editing */}
        {showTaskModal && (
          <CompactTaskEditModal
            isOpen={showTaskModal}
            task={selectedTask}
            onClose={() => {
              setShowTaskModal(false);
              setSelectedTask(null);
            }}
            onSubmit={async (data) => {
              try {
                const listId = selectedTask?.googleTaskListId || 
                             (selectedTaskListId === 'all' ? taskLists[0]?.googleTaskListId : 
                              taskLists.find(list => list.id === selectedTaskListId)?.googleTaskListId);
                if (!listId || !selectedTask) return;
                
                await updateGoogleTask(listId, selectedTask.id, {
                  title: data.title,
                  notes: data.notes,
                  due: data.due,
                  priority: data.priority
                });
                
                await refreshData();
                setShowTaskModal(false);
                setSelectedTask(null);
              } catch (error) {
                console.error('Failed to save task:', error);
                alert('Failed to save task. Please try again.');
              }
            }}
            onDelete={selectedTask ? async () => {
              try {
                const listId = selectedTask.googleTaskListId;
                if (!listId) return;
                
                await deleteGoogleTask(listId, selectedTask.id);
                await refreshData();
                setShowTaskModal(false);
                setSelectedTask(null);
              } catch (error) {
                console.error('Failed to delete task:', error);
                alert('Failed to delete task. Please try again.');
              }
            } : undefined}
          />
        )}
        
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem && (
            <div className="bg-white shadow-xl rounded-lg p-3 opacity-90 border border-gray-200 cursor-grabbing">
              <div className="flex items-center gap-2">
                {draggedItem.type === 'task' && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                )}
                <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                  {draggedItem.type === 'task' 
                    ? (draggedItem.data as any).title 
                    : (draggedItem.data as any).title}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Drop to create time block
              </div>
            </div>
          )}
        </DragOverlay>
        
        {/* Quick View Modal */}
        <CalendarQuickViewModal
          isOpen={quickViewModal.isOpen}
          events={quickViewModal.events}
          position={quickViewModal.position}
          onClose={() => setQuickViewModal({ isOpen: false, events: [] })}
          onEdit={(event) => {
            setQuickViewModal({ isOpen: false, events: [] });
            if (event.type === 'task' && event.taskData) {
              setSelectedTask(event.taskData);
              setShowTaskModal(true);
            } else {
              setSelectedEvent(event);
              setShowEventModal(true);
            }
          }}
          onComplete={async (event) => {
            if (event.type === 'task' && event.taskData) {
              const listId = selectedTaskListId === 'all' ? taskLists[0]?.id : selectedTaskListId;
              if (listId && event.taskData.id) {
                await updateGoogleTask(listId, event.taskData.id, {
                  status: event.isCompleted ? 'needsAction' : 'completed'
                });
                await syncAllTasks();
              }
            }
            setQuickViewModal({ isOpen: false, events: [] });
          }}
          onDelete={async (event) => {
            if (event.type === 'task' && event.taskData) {
              const listId = selectedTaskListId === 'all' ? taskLists[0]?.id : selectedTaskListId;
              if (listId && event.taskData.id) {
                await deleteGoogleTask(listId, event.taskData.id);
                await syncAllTasks();
              }
            } else if (event.id) {
              await deleteCalendarEvent(event.id);
              await fetchCalendarEvents();
            }
            setQuickViewModal({ isOpen: false, events: [] });
          }}
        />
      </div>
    </DndContext>
  );
}
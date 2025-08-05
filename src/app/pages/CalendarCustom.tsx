import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, 
  ListChecks, Sidebar
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

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
  const { createTask, updateTask } = useUnifiedTaskStore();
  
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
      
      // Check if it's a time-blocked task
      if (event.extendedProps?.isTimeBlock && event.extendedProps?.taskData) {
        // Update the task's time block
        const task = event.extendedProps.taskData;
        await updateTask(task.id, {
          title: task.title, // Must include title or Google will clear it
          timeBlock: {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString()
          }
        });
      } else {
        // Regular calendar event
        await updateCalendarEvent({
          ...event,
          start: event.allDay 
            ? { date: format(newStart, 'yyyy-MM-dd') }
            : { dateTime: newStart.toISOString() },
          end: event.allDay
            ? { date: format(newEnd, 'yyyy-MM-dd') }
            : { dateTime: newEnd.toISOString() }
        });
      }
      
      // Refresh to show updated event
      await refreshData();
    } catch (error) {
      console.error('Failed to resize event:', error);
      alert('Failed to resize event. Please try again.');
    }
  }, [filteredEvents, updateCalendarEvent, updateGoogleTask, refreshData]);
  
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
        // Dropped on a day - ensure we use local date to avoid timezone issues
        // Parse the date components to create a date in local timezone
        const year = dropDate.getFullYear();
        const month = dropDate.getMonth();
        const day = dropDate.getDate();
        
        // Create date in local timezone
        startDateTime = new Date(year, month, day, 9, 0, 0, 0); // 9 AM local time
        endDateTime = new Date(year, month, day, 10, 0, 0, 0);   // 10 AM local time
      }
      
      try {
        // Create due date string in YYYY-MM-DD format
        const year = startDateTime.getFullYear();
        const month = String(startDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(startDateTime.getDate()).padStart(2, '0');
        const dueDateString = `${year}-${month}-${day}`;
        
        console.log('🔴 TIMEZONE DEBUG - Updating task:', {
          taskId: task.id,
          title: task.title,
          googleTaskListId: task.googleTaskListId,
          dropDate: dropDate,
          dropDateString: dropDate.toString(),
          dropDateISO: dropDate.toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          dueDate: dueDateString,
          localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          dropTime: dropTime,
          isAllDay: isAllDay,
          timeBlock: {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
          },
          willParseTo: new Date(`${dueDateString}T00:00:00.000Z`).toString()
        });
        
        // First update the task's due date via the unified store
        // This ensures custom fields like timeBlock are handled properly
        await updateTask(task.id, {
          title: task.title, // Must include title or Google will clear it
          due: dueDateString, // Send YYYY-MM-DD format directly
          timeBlock: {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
          }
        });
        
        // Debug - check if the task has timeBlock after update
        const { tasks } = useUnifiedTaskStore.getState();
        const updatedTask = tasks[task.id];
        console.log('🔴 TIMEBLOCK DEBUG - Task after update:', {
          taskId: updatedTask?.id,
          hasTimeBlock: !!updatedTask?.timeBlock,
          timeBlock: updatedTask?.timeBlock
        });
        
        // Refresh to show the updated task
        await refreshData();
        
        // Debug - check task after refresh
        setTimeout(() => {
          const { tasks } = useUnifiedTaskStore.getState();
          const syncedTask = tasks[task.id];
          console.log('🔴 TIMEBLOCK DEBUG - Task after sync:', {
            taskId: syncedTask?.id,
            hasTimeBlock: !!syncedTask?.timeBlock,
            timeBlock: syncedTask?.timeBlock
          });
        }, 2000);
        
      } catch (error: any) {
        console.error('Failed to add time block to task:', error);
        
        // Check if this is a database schema error
        if (error.toString().includes('no such column') || error.toString().includes('task_metadata')) {
          console.error('Database schema error detected - migrations may need to be run');
          alert('Database schema update required. Please restart the application to apply updates.');
        } else {
          alert('Failed to add time block. Please try again.');
        }
      }
    }
    
    setDraggedItem(null);
  }, [draggedItem, createCalendarEvent, updateTask, refreshData]);
  
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
        <div>
          <CalendarHeader 
            currentDate={currentDate}
            currentViewTitle={format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
            view={view === 'month' ? 'dayGridMonth' : view === 'week' ? 'timeGridWeek' : 'timeGridDay'}
            showTasksSidebar={showTasksSidebar}
            searchQuery={searchQuery}
            onNavigate={handleNavigate}
            onDateSelect={setCurrentDate}
            onViewChange={handleViewChange}
            onToggleTasksSidebar={() => setShowTasksSidebar(!showTasksSidebar)}
            onNewEvent={() => handleDateClick(new Date())}
            onSearchChange={setSearchQuery}
          />
        </div>
        
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
                  // Use updateTask to ensure metadata is preserved
                  await updateTask(taskId, {
                    status: completed ? 'completed' : 'needsAction'
                  });
                  await refreshData();
                } catch (error) {
                  console.error('Failed to complete task:', error);
                  alert('Failed to update task status');
                }
              }}
              onTaskCreate={async (taskData) => {
                try {
                  await createGoogleTask(taskData);
                  // Refresh data in the background without blocking the UI
                  refreshData().catch(err => console.error('Failed to refresh after task creation:', err));
                } catch (error) {
                  console.error('Failed to create task:', error);
                  alert('Failed to create task');
                  throw error; // Re-throw so the inline creator knows it failed
                }
              }}
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
                
                console.log('🔴 CALENDAR UPDATE DEBUG - Before update:', {
                  taskId: selectedTask.id,
                  listId: listId,
                  updateData: {
                    title: data.title,
                    notes: data.notes,
                    due: data.due,
                    priority: data.priority,
                    timeBlock: data.timeBlock
                  }
                });
                
                // Only send changed fields to avoid timezone shifts
                const updatePayload: any = {};
                
                // Always include title to prevent Google from clearing it
                updatePayload.title = data.title;
                
                // Only include other fields if they changed
                if (data.notes !== selectedTask.notes) updatePayload.notes = data.notes;
                
                // CRITICAL: Only update due date if it actually changed
                if (data.due !== (selectedTask.due_date_only || selectedTask.due?.split('T')[0])) {
                  updatePayload.due = data.due;
                  updatePayload.due_date_only = data.due;
                }
                
                if (data.priority !== selectedTask.priority) updatePayload.priority = data.priority;
                
                // Handle timeBlock changes - CRITICAL: Always preserve timeBlock
                // If data.timeBlock is undefined, it means the user didn't modify time fields
                // and we should preserve the existing timeBlock
                if ('timeBlock' in data) {
                  // timeBlock is explicitly included in the data
                  if (data.timeBlock === null) {
                    // User wants to clear the timeBlock
                    updatePayload.timeBlock = null;
                  } else if (data.timeBlock !== undefined) {
                    // Always include timeBlock in updatePayload to ensure it's preserved
                    // The unifiedTaskStore needs this to maintain the timeBlock
                    updatePayload.timeBlock = data.timeBlock;
                  }
                } else if (selectedTask.timeBlock) {
                  // If timeBlock is not in data but task has timeBlock, preserve it
                  // This handles cases where the modal might not include timeBlock in data
                  updatePayload.timeBlock = selectedTask.timeBlock;
                }
                
                console.log('🔵 Task update - Only sending changed fields:', {
                  taskId: selectedTask.id,
                  original: {
                    title: selectedTask.title,
                    priority: selectedTask.priority,
                    due: selectedTask.due,
                    due_date_only: selectedTask.due_date_only,
                    notes: selectedTask.notes,
                    timeBlock: selectedTask.timeBlock
                  },
                  newData: data,
                  updatePayload,
                  changedFields: Object.keys(updatePayload),
                  timeBlockStatus: {
                    originalHasTimeBlock: !!selectedTask.timeBlock,
                    dataTimeBlockValue: data.timeBlock,
                    isTimeBlockIncludedInUpdate: 'timeBlock' in updatePayload,
                    updatePayloadTimeBlock: updatePayload.timeBlock
                  }
                });
                
                // CRITICAL FIX: For tasks with timeBlocks, follow the same pattern as drag-and-drop
                // The working commit always sends title, due, and timeBlock together
                if (selectedTask.timeBlock && 'timeBlock' in updatePayload) {
                  // Ensure we always have a due date for time-blocked tasks
                  if (!updatePayload.due) {
                    updatePayload.due = selectedTask.due_date_only || selectedTask.due || data.due;
                  }
                  
                  console.log('🔴 CRITICAL FIX - Ensuring complete data for time-blocked task:', {
                    taskId: selectedTask.id,
                    hasTitle: !!updatePayload.title,
                    hasDue: !!updatePayload.due,
                    hasTimeBlock: !!updatePayload.timeBlock,
                    updatePayload
                  });
                }
                
                // Use updateTask from unified store to ensure metadata like timeBlock is preserved
                await updateTask(selectedTask.id, updatePayload);
                
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
                
                // Close modal immediately for better UX
                setShowTaskModal(false);
                setSelectedTask(null);
                
                // Delete task in background
                await deleteGoogleTask(listId, selectedTask.id);
                
                // Refresh data to update the view
                await refreshData();
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
            
            // Check if it's a task (including time-blocked tasks)
            if ((event.type === 'task' || event.extendedProps?.type === 'task') && event.extendedProps?.taskData) {
              // Task (including time-blocked tasks)
              setSelectedTask(event.extendedProps.taskData);
              setShowTaskModal(true);
            } else {
              // Regular calendar event
              setSelectedEvent(event);
              setShowEventModal(true);
            }
          }}
          onToggleComplete={async (event) => {
            const taskData = event.extendedProps?.taskData || event.taskData;
            if ((event.type === 'task' || event.extendedProps?.type === 'task') && taskData) {
              const listId = taskData.googleTaskListId || (selectedTaskListId === 'all' ? taskLists[0]?.googleTaskListId : selectedTaskListId);
              if (listId && taskData.id) {
                const isCompleted = event.extendedProps?.isCompleted || event.isCompleted;
                // Use updateTask to ensure metadata is preserved
                await updateTask(taskData.id, {
                  status: isCompleted ? 'needsAction' : 'completed'
                });
                await refreshData();
              }
            }
            setQuickViewModal({ isOpen: false, events: [] });
          }}
          onDelete={async (event) => {
            const taskData = event.extendedProps?.taskData || event.taskData;
            if ((event.type === 'task' || event.extendedProps?.type === 'task') && taskData) {
              const listId = taskData.googleTaskListId || (selectedTaskListId === 'all' ? taskLists[0]?.googleTaskListId : selectedTaskListId);
              if (listId && taskData.id) {
                await deleteGoogleTask(listId, taskData.id);
                await refreshData();
              }
            } else if (event.id) {
              await deleteCalendarEvent(event.id);
              await fetchCalendarEvents();
            }
            setQuickViewModal({ isOpen: false, events: [] });
          }}
          onEventClick={handleEventClick}
        />
      </div>
    </DndContext>
  );
}
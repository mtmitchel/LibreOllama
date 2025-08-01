import React, { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, View, Event as RBCEvent } from 'react-big-calendar';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useHeader } from '../contexts/HeaderContext';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/calendar-asana.css';
import './styles/calendar-experiment.css';
import './styles/calendar-big-calendar-experiment.css';

// Import extracted components
import { CalendarHeader } from './calendar/components/CalendarHeader';
import { CalendarTaskSidebar } from './calendar/components/CalendarTaskSidebar';
import { AsanaEventModal } from './calendar/components/AsanaEventModal';
import { TaskContextMenu } from './calendar/components/TaskContextMenu';
import { AsanaTaskModal } from './calendar/components/AsanaTaskModal';
import { EventComponent, EventWrapper } from './calendar/components/CalendarEventComponents';

// Import hooks and utilities
import { useCalendarOperations } from './calendar/hooks/useCalendarOperations';
import { useCalendarState } from './calendar/hooks/useCalendarState';
import { useCalendarEventHandlers } from './calendar/hooks/useCalendarEventHandlers';
import { convertEventsForRBC, filterEventsBySearch, getEventStyle } from './calendar/utils/eventConversion';
import { localizer, viewMapping, calendarConfig, debugConfig } from './calendar/config/calendarConfig';

export default function CalendarBigCalendarExperiment() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const activeAccount = useActiveGoogleAccount();
  
  // Use extracted state hook
  const state = useCalendarState();

  // Use the calendar operations hook
  const {
    calendars,
    taskLists,
    googleTasks,
    calendarEventsWithTasks,
    isLoading,
    error: operationsError,
    isAuthenticated,
    fetchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    updateGoogleTask,
    createGoogleTask,
    deleteGoogleTask,
    syncAllTasks,
    handleQuickTask,
    uploadAttachment,
    removeAttachment
  } = useCalendarOperations();

  // Use event handlers hook
  const eventHandlers = useCalendarEventHandlers({ 
    state, 
    createGoogleTask, 
    syncAllTasks 
  });

  // Clear header props on unmount
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Load calendar data when component mounts
  useEffect(() => {
    console.log('Calendar data loading effect:', { activeAccount, isAuthenticated, taskLists: taskLists.length, googleTasks: Object.keys(googleTasks).length });
    if (activeAccount && isAuthenticated) {
      fetchCalendarEvents();
      syncAllTasks();
    }
  }, [activeAccount, isAuthenticated, fetchCalendarEvents, syncAllTasks]);


  // Debug: Log tasks specifically (one-time on mount)
  useEffect(() => {
    if (!debugConfig.enabled) return;
    
    const logTasksDebug = () => {
      console.log(`📊 [RBC] Total events loaded: ${calendarEventsWithTasks.length}`);
      console.log(`📊 [RBC] Google tasks object keys: ${Object.keys(googleTasks).length}`);
      
      // Log raw google tasks data
      if (Object.keys(googleTasks).length > 0) {
        const tasksArray = Object.values(googleTasks);
        console.log(`📋 [RBC] Raw Google tasks count: ${tasksArray.length}`);
        
        // Check for August 2025 tasks in raw data
        const august2025TasksRaw = tasksArray.filter((task: any) => {
          if (task.due) {
            const taskDate = new Date(task.due);
            return taskDate.getFullYear() === 2025 && taskDate.getMonth() === 7;
          }
          return false;
        });
        console.log(`🔍 [RBC] August 2025 tasks in raw data: ${august2025TasksRaw.length}`, august2025TasksRaw.slice(0, 3));
      }
      
      if (calendarEventsWithTasks.length > 0) {
        const tasks = calendarEventsWithTasks.filter(event => event.extendedProps?.type === 'task');
        console.log(`📋 [RBC] Total tasks on calendar: ${tasks.length}`);
        
        // Group tasks by month
        const tasksByMonth: Record<string, any[]> = {};
        tasks.forEach(task => {
          const taskDate = new Date(task.start);
          const monthKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
          if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
          tasksByMonth[monthKey].push(task);
        });
        
        // Log tasks by month
        Object.entries(tasksByMonth).forEach(([month, monthTasks]) => {
          console.log(`📅 [RBC] ${month}: ${monthTasks.length} tasks`, monthTasks.slice(0, 3).map(t => ({
            title: t.title,
            date: t.start,
            taskData: t.extendedProps?.taskData
          })));
        });
        
        // Specifically check for August 2025 tasks
        const august2025Tasks = tasks.filter(task => {
          const taskDate = new Date(task.start);
          return taskDate.getFullYear() === 2025 && taskDate.getMonth() === 7; // August is month 7 (0-indexed)
        });
        console.log(`🔍 [RBC] August 2025 tasks: ${august2025Tasks.length}`, august2025Tasks);
      }
    };
    
    // Only log once after a delay to avoid logging during rapid updates
    const timeoutId = setTimeout(logTasksDebug, 1000);
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run once

  // Convert and filter events for React Big Calendar
  const filteredCalendarEvents = useMemo(() => {
    const convertedEvents = convertEventsForRBC(calendarEventsWithTasks);
    return filterEventsBySearch(convertedEvents, state.searchQuery);
  }, [calendarEventsWithTasks, state.searchQuery]);

  // Event style getter for React Big Calendar
  const eventStyleGetter = useCallback((event: any) => {
    return getEventStyle(event);
  }, []);

  // Custom event components with context menu handler
  const CustomEventWrapper = useCallback((props: any) => {
    return <EventWrapper {...props} onContextMenu={(e, task) => {
      state.setContextMenu({ x: e.clientX, y: e.clientY, task, listId: '' });
    }} />;
  }, [state]);

  const CustomEventComponent = useCallback((props: any) => {
    return <EventComponent {...props} view={state.view} />;
  }, [state.view]);

  const components = useMemo(() => ({
    event: CustomEventComponent,
    eventWrapper: CustomEventWrapper
  }), [CustomEventComponent, CustomEventWrapper]);

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
    <>
      <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC' }}>
        {/* Header */}
        <CalendarHeader 
          currentDate={state.currentCalendarDate}
          currentViewTitle={state.currentViewTitle}
          view={state.view === 'month' ? 'dayGridMonth' : state.view === 'week' ? 'timeGridWeek' : state.view === 'day' ? 'timeGridDay' : 'listWeek'}
          showTasksSidebar={state.showTasksSidebar}
          onNavigate={eventHandlers.navigateCalendar}
          onDateSelect={(date) => {
            state.setCurrentCalendarDate(date);
          }}
          onViewChange={eventHandlers.handleViewChange}
          onToggleTasksSidebar={() => state.setShowTasksSidebar(!state.showTasksSidebar)}
          onNewEvent={() => {
            state.setSelectedEvent(null);
            state.setShowEventModal(true);
          }}
        />

      {/* Main Content Area - Calendar and Sidebar */}
      <div className="flex flex-1 gap-6 bg-primary p-6 min-h-0">
        {/* Calendar Section */}
        <div className="border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm calendar-container">
          <div className="cal-asana-calendar-wrapper flex-1" style={{ paddingRight: '0', overflow: 'hidden' }}>
            <div 
              ref={state.calendarContainerRef}
              className="cal-asana-grid h-full" 
              style={{ overflow: 'hidden' }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              <Calendar
                ref={state.calendarRef}
                localizer={localizer}
                events={filteredCalendarEvents}
                view={state.view}
                onView={eventHandlers.changeView}
                date={state.currentCalendarDate}
                onNavigate={state.setCurrentCalendarDate}
                onSelectSlot={eventHandlers.handleSelectSlot}
                onSelectEvent={eventHandlers.handleSelectEvent}
                selectable
                components={components}
                eventPropGetter={eventStyleGetter}
                style={{ height: '100%' }}
                {...calendarConfig}
              />
            </div>
          </div>
        </div>

        {/* Task Sidebar */}
        {state.showTasksSidebar && (
          <CalendarTaskSidebar 
            taskLists={taskLists}
            googleTasks={googleTasks}
            selectedTaskListId={state.selectedTaskListId}
            showInlineCreator={state.showInlineCreator}
            onTaskListChange={state.setSelectedTaskListId}
            onTaskClick={eventHandlers.handleTaskEdit}
            onTaskComplete={eventHandlers.handleTaskComplete}
            onTaskCreate={eventHandlers.handleTaskCreate}
            onShowInlineCreator={state.setShowInlineCreator}
            onContextMenu={eventHandlers.handleContextMenu}
          />
        )}
      </div>
    </div>

      {/* Event Modal */}
      <AsanaEventModal
        isOpen={state.showEventModal}
        onClose={() => {
          state.setShowEventModal(false);
          state.setSelectedEvent(null);
        }}
        event={state.selectedEvent}
        onSave={async (eventData) => {
          try {
            console.log('📅 Saving event data:', eventData);
            if (eventData.id) {
              await updateCalendarEvent(eventData.id, eventData);
            } else {
              const eventToCreate = {
                summary: eventData.title,
                description: eventData.description,
                start: eventData.start,
                end: eventData.end,
                calendarId: eventData.calendarId,
                location: eventData.location,
                attendees: eventData.attendees ? eventData.attendees.map((email: string) => ({ email })) : []
              };
              await createCalendarEvent(eventToCreate);
            }
            state.setShowEventModal(false);
            state.setSelectedEvent(null);
            await fetchCalendarEvents();
          } catch (error) {
            console.error('Error saving event:', error);
          }
        }}
        calendars={calendars}
        selectedDateInfo={state.selectedDateInfo}
      />

      {/* Task Modal */}
      <AsanaTaskModal
        isOpen={state.showTaskModal}
        task={state.editingTask}
        onClose={() => {
          state.setShowTaskModal(false);
          state.setEditingTask(null);
        }}
        onSubmit={async (data) => {
          try {
            const listId = state.selectedTaskListId === 'all' ? taskLists[0]?.id : state.selectedTaskListId;
            if (!listId) return;
            
            if (state.editingTask) {
              await updateGoogleTask(listId, state.editingTask.id, data);
            } else {
              await createGoogleTask({ ...data, columnId: listId });
            }
            
            await syncAllTasks();
            state.setShowTaskModal(false);
            state.setEditingTask(null);
          } catch (error) {
            console.error('Error saving task:', error);
          }
        }}
        onDelete={state.editingTask ? async () => {
          try {
            const listId = state.selectedTaskListId === 'all' ? taskLists[0]?.id : state.selectedTaskListId;
            if (!listId || !state.editingTask) return;
            
            await deleteGoogleTask(listId, state.editingTask.id);
            await syncAllTasks();
            state.setShowTaskModal(false);
            state.setEditingTask(null);
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      {state.showDeleteTaskDialog && state.taskToDelete && (
        <ConfirmDialog
          isOpen={state.showDeleteTaskDialog}
          title="Delete task?"
          message={`Are you sure you want to delete "${state.taskToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={async () => {
            try {
              const { deleteTask, getTaskByGoogleId } = useUnifiedTaskStore.getState();
              const unifiedTask = state.taskToDelete ? getTaskByGoogleId(state.taskToDelete.id) : null;
              
              if (unifiedTask) {
                await deleteTask(unifiedTask.id);
              }
              
              state.setShowDeleteTaskDialog(false);
              state.setTaskToDelete(null);
            } catch (error) {
              console.error('Error deleting task:', error);
              state.setError('Failed to delete task. Please try again.');
            }
          }}
          onClose={() => {
            state.setShowDeleteTaskDialog(false);
            state.setTaskToDelete(null);
          }}
        />
      )}

      {/* Context Menu */}
      <TaskContextMenu
        contextMenu={state.contextMenu}
        onEdit={eventHandlers.handleTaskEdit}
        onSchedule={(task) => {
          console.log('Schedule task:', task);
        }}
        onDuplicate={eventHandlers.handleTaskDuplicate}
        onUpdatePriority={eventHandlers.handleUpdatePriority}
        onDelete={eventHandlers.handleTaskDelete}
        onClose={() => state.setContextMenu(null)}
      />
    </>
  );
}
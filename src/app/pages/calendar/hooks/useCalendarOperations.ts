import { useCallback, useMemo, useState } from 'react';
import { useGoogleCalendarStore } from '../../../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';
import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../../../types/google';
import { useActiveGoogleAccount } from '../../../../stores/settingsStore';
import { CalendarEvent } from '../types';
import { realtimeSync } from '../../../../services/realtimeSync';

export const useCalendarOperations = () => {
  const {
    events: calendarEvents,
    calendars,
    isLoading: isCalendarLoading,
    error: calendarError,
    fetchEvents: fetchCalendarEvents,
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    syncCalendar,
    isAuthenticated: isCalendarAuthenticated
  } = useGoogleCalendarStore();

  const { tasks: unifiedTasks, columns, createTask, updateTask, deleteTask } = useUnifiedTaskStore();
  const activeAccount = useActiveGoogleAccount();
  
  // Use the singleton Google Tasks service

  // Combine calendar events and tasks into a unified event list
  const calendarEventsWithTasks = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    // Add calendar events
    calendarEvents.forEach(event => {
      events.push({
        ...event,
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        allDay: !event.start?.dateTime,
        backgroundColor: '#796EFF',
        borderColor: '#796EFF',
        textColor: '#FFFFFF',
        extendedProps: {
          ...event,
          type: 'event' as const,
          description: event.description,
          location: event.location,
          attendees: event.attendees,
          calendarId: event.calendarId,
          calendarName: event.calendarName
        }
      });
    });
    
    // Add unified tasks with due dates
    Object.values(unifiedTasks).forEach(task => {
      if (task.due) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          start: task.due,
          allDay: true,
          backgroundColor: task.status === 'completed' ? '#E0E0E0' : '#FFF3E0',
          borderColor: task.status === 'completed' ? '#BDBDBD' : '#FFB74D',
          textColor: task.status === 'completed' ? '#757575' : '#E65100',
          extendedProps: {
            type: 'task' as const,
            taskId: task.id,
            taskData: task,
            listId: task.columnId
          }
        } as CalendarEvent);
      }
    });
    
    return events;
  }, [calendarEvents, unifiedTasks]);

  // Task sync using realtimeSync
  const syncAllTasks = useCallback(async () => {
    if (!activeAccount) return;
    
    console.log('🔄 [TASKS] Starting task sync...');
    
    try {
      await realtimeSync.syncNow();
      console.log('✅ [TASKS] Tasks synced successfully');
    } catch (error) {
      console.error('❌ [TASKS] Failed to sync tasks:', error);
    }
  }, [activeAccount]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    const promises = [];
    
    if (isCalendarAuthenticated) {
      promises.push(syncCalendar());
    }
    
    if (activeAccount) {
      promises.push(syncAllTasks());
    }
    
    await Promise.all(promises);
  }, [isCalendarAuthenticated, activeAccount, syncCalendar, syncAllTasks]);

  return {
    // Data
    calendarEvents,
    calendars,
    taskLists: columns, // Use columns as task lists
    googleTasks: unifiedTasks, // Use unified tasks
    calendarEventsWithTasks,
    
    // Loading states
    isCalendarLoading,
    isLoading: isCalendarLoading,
    
    // Errors
    calendarError,
    error: calendarError,
    
    // Authentication
    isCalendarAuthenticated,
    isTasksAuthenticated: !!activeAccount,
    isAuthenticated: isCalendarAuthenticated || !!activeAccount,
    
    // Calendar operations
    fetchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    syncCalendar,
    
    // Task operations (unified)
    createGoogleTask: createTask,
    updateGoogleTask: updateTask,
    deleteGoogleTask: deleteTask,
    syncAllTasks,
    
    // General operations
    refreshData
  };
};
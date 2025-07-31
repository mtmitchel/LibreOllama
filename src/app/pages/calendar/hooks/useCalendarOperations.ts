import { useCallback, useMemo, useState } from 'react';
import { useGoogleCalendarStore } from '../../../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';
import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../../../types/google';
import { useActiveGoogleAccount } from '../../../../stores/settingsStore';
import { CalendarEvent } from '../types';
import { realtimeSync } from '../../../../services/realtimeSync';
import { addDays, format } from 'date-fns';

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
      const isAllDay = !event.start?.dateTime;
      const isRecurringInstance = event.id.includes('_') || !!event.recurringEventId;
      let startDate = event.start?.dateTime || event.start?.date || '';
      let endDate = event.end?.dateTime || event.end?.date || '';
      
      // Check if this is a true multi-day event vs recurring instance
      const isTrueMultiDay = isAllDay && 
        event.start?.date && 
        event.end?.date && 
        event.start.date !== event.end.date && 
        !isRecurringInstance;
      
      // Debug logging - enhanced
      if (event.summary?.includes('Staying at Bo') || event.summary?.includes('Reds') || event.summary?.includes('Diamondbacks')) {
        console.log(`🔍 [DEBUG] Event "${event.summary}":`, {
          id: event.id,
          isRecurringInstance,
          isTrueMultiDay,
          originalStart: event.start,
          originalEnd: event.end,
          processedStart: startDate,
          processedEnd: endDate,
          recurrence: event.recurrence,
          recurringEventId: event.recurringEventId
        });
      }
      
      // CRITICAL FIX: Add one day to end date for all-day events
      // FullCalendar treats end dates as exclusive for all-day events
      if (isAllDay && endDate && event.start?.date && event.end?.date) {
        // Only add a day if this is a date-only format (YYYY-MM-DD)
        if (endDate.length === 10 && !endDate.includes('T')) {
          const adjustedEnd = addDays(new Date(endDate), 1);
          endDate = format(adjustedEnd, 'yyyy-MM-dd');
          
          if (isTrueMultiDay) {
            console.log(`📅 True multi-day event "${event.summary}": ${event.start.date} to ${event.end.date} (adjusted to ${endDate})`);
          }
        }
      }
      
      // CRITICAL: Ensure dates are in ISO format for FullCalendar
      // For all-day events, FullCalendar expects YYYY-MM-DD format
      if (isAllDay && startDate && startDate.includes('T')) {
        startDate = startDate.split('T')[0];
      }
      if (isAllDay && endDate && endDate.includes('T')) {
        endDate = endDate.split('T')[0];
      }
      
      const processedEvent = {
        ...event,
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: startDate,
        end: endDate,
        allDay: isAllDay,
        backgroundColor: isTrueMultiDay ? '#d8d0ff' : '#796EFF',
        borderColor: isTrueMultiDay ? '#c7bbff' : '#796EFF',
        textColor: isTrueMultiDay ? '#4a3f99' : '#FFFFFF',
        // Remove display property - let FullCalendar handle it naturally
        extendedProps: {
          ...event,
          type: isTrueMultiDay ? 'multiday' : (isRecurringInstance ? 'recurring_instance' : 'event') as const,
          isRecurring: isRecurringInstance,
          isTrueMultiDay,
          description: event.description,
          location: event.location,
          attendees: event.attendees,
          calendarId: event.calendarId,
          calendarName: event.calendarName
        }
      };
      events.push(processedEvent);
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
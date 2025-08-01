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
    // Debug input data
    console.log('🔍 DEBUG: All unified tasks:', Object.values(unifiedTasks));
    console.log('🔍 DEBUG: Tasks with due dates:', Object.values(unifiedTasks).filter(task => task.due));
    
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
        const isCompleted = task.status === 'completed';
        const taskDueDate = new Date(task.due);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Skip old completed tasks (older than 30 days)
        if (isCompleted && taskDueDate < thirtyDaysAgo) {
          return;
        }
        
        // Debug logging for Aug/Sep tasks
        const month = taskDueDate.getMonth() + 1;
        if (month === 8 || month === 9) {
          console.log('🔍 Processing Aug/Sep task:', {
            id: task.id,
            title: task.title,
            originalDue: task.due,
            parsedDate: taskDueDate,
            isValidDate: !isNaN(taskDueDate.getTime()),
            month: month,
            year: taskDueDate.getFullYear()
          });
        }
        
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          start: new Date(task.due), // Convert to Date object
          end: new Date(task.due),   // Add required end date
          allDay: true,
          backgroundColor: isCompleted ? '#F5F5F5' : '#FFF3E0',
          borderColor: isCompleted ? '#E0E0E0' : '#FFB74D',
          textColor: isCompleted ? '#9E9E9E' : '#E65100',
          extendedProps: {
            type: 'task' as const,
            taskId: task.id,
            taskData: task,
            listId: task.columnId,
            isCompleted: isCompleted
          }
        } as CalendarEvent);
      }
    });
    
    // Add test event to verify calendar works
    events.push({
      id: 'test-aug-2025',
      title: 'TEST: August Event',
      start: new Date(2025, 7, 15), // August 15, 2025
      end: new Date(2025, 7, 15),
      allDay: true,
      backgroundColor: '#FF0000',
      borderColor: '#FF0000',
      textColor: '#FFFFFF',
      extendedProps: {
        type: 'test' as const
      }
    } as CalendarEvent);
    
    // Debug final events
    console.log('🔍 Final events array:', events);
    console.log('🔍 Task events only:', events.filter(event => event.extendedProps?.type === 'task'));
    console.log('🔍 Aug/Sep events:', events.filter(event => {
      const eventDate = new Date(event.start);
      const month = eventDate.getMonth() + 1;
      return month === 8 || month === 9;
    }));
    
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
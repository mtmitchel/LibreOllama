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
  
  // Wrapper functions to adapt unified task store to the expected interface
  const createGoogleTask = useCallback(async (data: any) => {
    await createTask(data);
  }, [createTask]);
  
  const updateGoogleTask = useCallback(async (listId: string, taskId: string, updates: any) => {
    await updateTask(taskId, updates);
  }, [updateTask]);
  
  const deleteGoogleTask = useCallback(async (listId: string, taskId: string) => {
    await deleteTask(taskId);
  }, [deleteTask]);
  
  // Use the singleton Google Tasks service

  // Combine calendar events and tasks into a unified event list
  const calendarEventsWithTasks = useMemo(() => {
    
    const events: CalendarEvent[] = [];
    
    // Add calendar events
    calendarEvents.forEach(event => {
      // Enhanced event classification to handle edge cases
      const classifyEvent = () => {
        // PRIORITY: Check for dateTime presence first (Google API can have inconsistent allDay flags)
        const hasStartDateTime = event.start?.dateTime && 
                                event.start.dateTime.trim() !== '';
        const hasEndDateTime = event.end?.dateTime && 
                              event.end.dateTime.trim() !== '';
        
        // If event has dateTime, it's definitely a timed event regardless of allDay flag
        if (hasStartDateTime && hasEndDateTime) {
          return { isAllDay: false, reason: 'has valid dateTime (overrides allDay flag)' };
        }
        
        // Check for date-only format (all-day events)
        const hasDateOnly = event.start?.date && !hasStartDateTime;
        
        if (hasDateOnly) {
          return { isAllDay: true, reason: 'date-only format' };
        }
        
        // Check for explicit all-day marker (only if no dateTime present)
        if (event.allDay === true) {
          return { isAllDay: true, reason: 'explicit allDay property (no dateTime)' };
        }
        
        // Log malformed events
        console.warn('⚠️ Malformed event detected:', {
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end
        });
        
        // Default to all-day for safety
        return { isAllDay: true, reason: 'malformed event' };
      };
      
      const { isAllDay, reason } = classifyEvent();
      const isRecurringInstance = event.id.includes('_') || !!event.recurringEventId;
      let startDate = event.start?.dateTime || event.start?.date || '';
      let endDate = event.end?.dateTime || event.end?.date || '';
      
      // ONLY log baseball games to reduce console spam
      if (event.summary?.includes('Dodgers (5) @ Reds (2)')) {
        console.log('🏈 DODGERS GAME DEBUG:');
        console.log('  Title:', event.summary);
        console.log('  Classification isAllDay:', isAllDay);
        console.log('  Classification reason:', reason);
        console.log('  Has dateTime:', !!(event.start?.dateTime && event.end?.dateTime));
        console.log('  Start dateTime:', event.start?.dateTime);
        console.log('  End dateTime:', event.end?.dateTime);
        console.log('  Start date:', event.start?.date);
        console.log('  End date:', event.end?.date);
        console.log('  Original allDay flag:', event.allDay);
      }
      
      // Safe date parsing with validation
      const parseEventDate = (dateString: string, isAllDayEvent: boolean = false): Date => {
        if (!dateString || dateString.trim() === '') {
          console.error('Invalid date string:', dateString);
          return new Date(); // Fallback to current time
        }
        
        try {
          if (isAllDayEvent) {
            // For all-day events, create local midnight
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
          } else {
            // For timed events, parse with timezone awareness
            const date = new Date(dateString);
            
            // Validate the parsed date
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date: ${dateString}`);
            }
            
            return date;
          }
        } catch (error) {
          console.error('Date parsing error:', error, dateString);
          return new Date(); // Fallback to current time
        }
      };
      
      // Parse dates based on event type
      if (isAllDay) {
        if (event.start?.date) {
          startDate = parseEventDate(event.start.date, true);
          endDate = event.end?.date ? parseEventDate(event.end.date, true) : startDate;
        } else {
          console.error('All-day event missing date:', event);
          return; // Skip this event
        }
      } else {
        if (event.start?.dateTime) {
          startDate = parseEventDate(event.start.dateTime, false);
          endDate = event.end?.dateTime ? parseEventDate(event.end.dateTime, false) : startDate;
          
          // Validate timed event dates
          if (startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
              endDate.getHours() === 0 && endDate.getMinutes() === 0) {
            console.warn('⚠️ Timed event parsed as midnight:', {
              title: event.summary,
              originalStart: event.start.dateTime,
              parsedStart: startDate.toISOString()
            });
          }
        } else {
          console.error('Timed event missing dateTime:', event);
          return; // Skip this event
        }
      }
      
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
      
      // No need to adjust end date anymore since we're handling timezone correctly above
      
      // CRITICAL: Ensure dates are in correct format for our custom calendar
      // For all-day events from date strings, keep as is
      // For all-day events from Date objects, they're already handled above
      
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
          calendarName: event.calendarName,
          // Add original start/end for debugging
          originalStart: event.start,
          originalEnd: event.end
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
        
        // Parse task due date as local date to avoid UTC timezone issues
        let taskDate: Date;
        if (typeof task.due === 'string' && task.due.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // For YYYY-MM-DD format, create date using local timezone
          const [year, month, day] = task.due.split('-').map(Number);
          taskDate = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          // For other formats or Date objects
          taskDate = new Date(task.due);
        }
        
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          start: taskDate,
          end: taskDate,
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
    console.log('🔍 Timed events (allDay=false):', events.filter(event => !event.allDay).map(e => ({
      id: e.id,
      title: e.title,
      allDay: e.allDay,
      start: e.start,
      end: e.end,
      originalStart: e.extendedProps?.originalStart
    })));
    console.log('🔍 All-day events (allDay=true):', events.filter(event => event.allDay).map(e => ({
      id: e.id,
      title: e.title,
      allDay: e.allDay,
      type: e.extendedProps?.type
    })));
    
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

  // Placeholder methods for missing functionality
  const handleQuickTask = useCallback(async (taskData: any) => {
    console.log('Quick task not implemented yet', taskData);
  }, []);

  const uploadAttachment = useCallback(async (taskId: string, file: File) => {
    console.log('Upload attachment not implemented yet', taskId, file);
  }, []);

  const removeAttachment = useCallback(async (taskId: string, attachmentId: string) => {
    console.log('Remove attachment not implemented yet', taskId, attachmentId);
  }, []);

  // Debug task lists
  console.log('🔍 Task lists (columns):', columns);
  console.log('🔍 Active account:', activeAccount);

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
    createGoogleTask,
    updateGoogleTask,
    deleteGoogleTask,
    syncAllTasks,
    
    // Additional operations
    handleQuickTask,
    uploadAttachment,
    removeAttachment,
    
    // General operations
    refreshData
  };
};
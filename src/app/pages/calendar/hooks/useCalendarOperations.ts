import { useCallback, useMemo, useState } from 'react';
import { useGoogleCalendarStore } from '../../../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';
import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../../../types/google';
import { useActiveGoogleAccount } from '../../../../stores/settingsStore';
import { CalendarEvent } from '../types/calendar';
import { realtimeSync } from '../../../../services/realtimeSync';
import { addDays, format } from 'date-fns';
import { parseGoogleTaskDate } from '../../../../utils/dateUtils';

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

  const { tasks: unifiedTasks, columns, createTask, updateTask, deleteTask, getVisibleTasks, showCompleted } = useUnifiedTaskStore();
  const activeAccount = useActiveGoogleAccount();
  
  // Wrapper functions to adapt unified task store to the expected interface
  const createGoogleTask = useCallback(async (data: any) => {
    // Map the googleTaskListId (or parent for backward compatibility) to columnId
    let googleTaskListId = data.googleTaskListId || data.parent;
    
    // If no googleTaskListId provided, use the first available column
    if (!googleTaskListId && columns.length > 0) {
      googleTaskListId = columns[0].googleTaskListId;
    }
    
    const column = columns.find(c => c.googleTaskListId === googleTaskListId);
    if (!column) {
      console.error('No column found for task list:', googleTaskListId, 'Available columns:', columns);
      throw new Error('No task lists available. Please create a task list first.');
    }
    
    await createTask({
      ...data,
      columnId: column.id,
      googleTaskListId: googleTaskListId
    });
  }, [createTask, columns]);
  
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
        
        // For Google Calendar events, all-day is determined by the presence of 'date' vs 'dateTime'
        
        // Log malformed events for debugging
        // console.warn('⚠️ Malformed event detected:', { id: event.id, summary: event.summary });
        
        // Default to all-day for safety
        return { isAllDay: true, reason: 'malformed event' };
      };
      
      const { isAllDay, reason } = classifyEvent();
      const isRecurringInstance = event.id.includes('_') || !!(event as any).recurringEventId;
      let startDate: Date;
      let endDate: Date;
      
      
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
          // Check for potential timezone parsing issues
          if (startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
              endDate.getHours() === 0 && endDate.getMinutes() === 0) {
            // console.warn('⚠️ Timed event parsed as midnight:', { title: event.summary });
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
      
      // No need to adjust end date anymore since we're handling timezone correctly above
      
      // CRITICAL: Ensure dates are in correct format for our custom calendar
      // For all-day events from date strings, keep as is
      // For all-day events from Date objects, they're already handled above
      
      const processedEvent: CalendarEvent = {
        ...event,
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: startDate,
        end: endDate,
        allDay: isAllDay,
        backgroundColor: isTrueMultiDay ? '#d8d0ff' : '#796EFF',
        borderColor: isTrueMultiDay ? '#c7bbff' : '#796EFF',
        textColor: isTrueMultiDay ? '#4a3f99' : '#FFFFFF',
        type: isTrueMultiDay ? 'multiday' : (isRecurringInstance ? 'recurring_instance' : 'event'),
        source: 'google',
        // Remove display property - let FullCalendar handle it naturally
        extendedProps: {
          // Preserve the private and shared properties from Google Calendar
          private: event.extendedProperties?.private || {},
          shared: event.extendedProperties?.shared || {},
          // Add our custom properties
          type: isTrueMultiDay ? 'multiday' : (isRecurringInstance ? 'recurring_instance' : 'event'),
          isRecurring: isRecurringInstance,
          isTrueMultiDay,
          description: event.description,
          location: event.location,
          attendees: event.attendees,
          calendarId: event.calendarId,
          calendarName: (event as any).calendarName,
          // Add original start/end for debugging
          originalStart: event.start,
          originalEnd: event.end
        }
      };
      events.push(processedEvent);
    });
    
    // Add unified tasks with due dates (filtered based on showCompleted)
    getVisibleTasks().forEach(task => {
      // Debug log for tasks with timeBlocks but no due date
      if (task.timeBlock && !task.due) {
        console.log('🔴 WARNING - Task with timeBlock but NO due date (will not show on calendar):', {
          taskId: task.id,
          title: task.title,
          timeBlock: task.timeBlock,
          due: task.due,
          fullTask: task
        });
      }
      
      if (task.due) {
        const isCompleted = task.status === 'completed';
        const taskDueDate = parseGoogleTaskDate(task.due);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Skip old completed tasks (older than 30 days)
        if (isCompleted && taskDueDate < thirtyDaysAgo) {
          return;
        }
        
        const month = taskDueDate.getMonth() + 1;
        
        // Parse task due date as local date to avoid UTC timezone issues
        let taskDate: Date;
        if (typeof task.due === 'string' && task.due.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // For YYYY-MM-DD format, create date using local timezone
          const [year, month, day] = task.due.split('-').map(Number);
          taskDate = new Date(year, month - 1, day); // month is 0-indexed
          if (task.title.includes('TZTEST')) console.log('🔴 TIMEZONE DEBUG - Parsed YYYY-MM-DD:', {
            title: task.title,
            originalDue: task.due,
            parsedDate: taskDate.toString(),
            parsedISO: taskDate.toISOString()
          });
        } else if (typeof task.due === 'string' && task.due.includes('T00:00:00.000Z')) {
          // Special handling for Google Tasks dates which always return midnight UTC
          // Extract just the date part and create a local date
          const datePart = task.due.split('T')[0];
          const [year, month, day] = datePart.split('-').map(Number);
          taskDate = new Date(year, month - 1, day); // Create in local timezone
          if (task.title.includes('TZTEST')) console.log('🔴 TIMEZONE DEBUG - Parsed Google midnight UTC as local date:', {
            title: task.title,
            originalDue: task.due,
            extractedDate: datePart,
            parsedDate: taskDate.toString(),
            parsedISO: taskDate.toISOString()
          });
        } else {
          // For other formats or Date objects
          taskDate = parseGoogleTaskDate(task.due);
          if (task.title.includes('TZTEST')) console.log('🔴 TIMEZONE DEBUG - Parsed ISO date:', {
            title: task.title,
            originalDue: task.due,
            parsedDate: taskDate.toString(),
            parsedISO: taskDate.toISOString()
          });
        }
        
        // Check if task has a time block
        if (task.timeBlock) {
          console.log('🔵 TIMEBLOCK DEBUG - Task has timeBlock:', {
            taskId: task.id,
            title: task.title,
            timeBlock: task.timeBlock,
            startTime: task.timeBlock.startTime,
            endTime: task.timeBlock.endTime
          });
          // Create a timed event for time-blocked tasks
          const startTime = new Date(task.timeBlock.startTime);
          const endTime = new Date(task.timeBlock.endTime);
          
          events.push({
            id: `task-${task.id}`,
            title: task.title,
            start: startTime,
            end: endTime,
            allDay: false,
            backgroundColor: isCompleted ? '#F5F5F5' : '#E3F2FD',
            borderColor: isCompleted ? '#E0E0E0' : '#2196F3',
            textColor: isCompleted ? '#9E9E9E' : '#1565C0',
            type: 'task',
            source: 'google',
            extendedProps: {
              type: 'task' as const,
              taskId: task.id,
              taskData: task,
              listId: task.columnId,
              isCompleted: isCompleted,
              isTimeBlock: true
            }
          } as CalendarEvent);
        } else {
          // Regular all-day task
          if (task.title.includes('TZTEST')) {
            console.log('🔴 TIMEBLOCK DEBUG - Task has NO timeBlock:', {
              taskId: task.id,
              title: task.title,
              fullTask: task
            });
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
            type: 'task',
            source: 'google',
            extendedProps: {
              type: 'task' as const,
              taskId: task.id,
              taskData: task,
              listId: task.columnId,
              isCompleted: isCompleted
            }
          } as CalendarEvent);
        }
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
      type: 'event',
      source: 'local',
      extendedProps: {
        type: 'test' as const
      }
    } as CalendarEvent);
    
    return events;
  }, [calendarEvents, getVisibleTasks, showCompleted]);

  // Task sync using realtimeSync
  const syncAllTasks = useCallback(async () => {
    if (!activeAccount) return;
    
    try {
      await realtimeSync.syncNow();
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

  // Task lists and active account are available for debugging if needed

  // Convert ALL tasks to object format for compatibility
  // IMPORTANT: Don't pre-filter tasks here - let the sidebar handle its own filtering
  const allTasksObject = useMemo(() => {
    const tasksObject: Record<string, any> = {};
    Object.values(unifiedTasks).forEach(task => {
      tasksObject[task.id] = task;
    });
    return tasksObject;
  }, [unifiedTasks]);

  return {
    // Data
    calendarEvents,
    calendars,
    taskLists: columns, // Use columns as task lists
    googleTasks: allTasksObject, // Use ALL tasks (sidebar will filter)
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
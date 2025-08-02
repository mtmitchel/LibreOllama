import moment from 'moment';
import type { CalendarEvent } from '../types';

/**
 * Helper to parse date strings as local dates (not UTC)
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // For date-only format (YYYY-MM-DD), parse as local date to avoid timezone shift
  if (dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0); // month is 0-indexed
  }
  
  // For datetime format, use standard parsing
  return new Date(dateStr);
}

/**
 * Convert calendar events to React Big Calendar format
 */
export function convertEventsForRBC(calendarEventsWithTasks: CalendarEvent[]): any[] {
  return calendarEventsWithTasks.map(event => {
    // Use local date parsing for all-day events to prevent timezone issues
    let startDate = event.allDay ? parseLocalDate(event.start) : new Date(event.start || new Date());
    let endDate = event.allDay ? parseLocalDate(event.end) : new Date(event.end || event.start || new Date());
    
    // React Big Calendar and FullCalendar BOTH use exclusive end dates for all-day events
    // The dates from useCalendarOperations are already adjusted for exclusive handling
    
    return {
      ...event,
      start: startDate,
      end: endDate,
      resource: event.extendedProps // React Big Calendar uses 'resource' for custom data
    };
  });
}

/**
 * Filter events based on search query
 */
export function filterEventsBySearch(events: any[], searchQuery: string): any[] {
  if (!searchQuery) return events;
  
  const lowerQuery = searchQuery.toLowerCase();
  return events.filter(event => 
    event.title?.toLowerCase().includes(lowerQuery) ||
    event.extendedProps?.description?.toLowerCase().includes(lowerQuery) ||
    event.resource?.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get event style properties for React Big Calendar
 */
export function getEventStyle(event: any): { className: string; style: any } {
  let className = '';
  let style: any = {};

  // Check if it's a multi-day event
  const isMultiDay = event.allDay && event.start && event.end &&
                    moment(event.start).format('YYYY-MM-DD') !== moment(event.end).format('YYYY-MM-DD');

  // Check for event type from either extendedProps or resource
  const eventType = event.extendedProps?.type || event.resource?.type;
  const isTask = eventType === 'task';
  const isTrueMultiDay = event.extendedProps?.isTrueMultiDay || event.resource?.isTrueMultiDay;
  const isCompleted = event.extendedProps?.isCompleted || event.resource?.isCompleted;

  if (isMultiDay || isTrueMultiDay) {
    className = 'fc-multi-day-event multi-day-event';
    style.backgroundColor = event.backgroundColor || '#d8d0ff';
    style.borderColor = event.borderColor || '#c7bbff';
    style.color = event.textColor || '#4a3f99';
  }

  // Check if it's a task
  if (isTask) {
    className += ' fc-event-task';
    if (!isMultiDay) {
      style.backgroundColor = event.backgroundColor || '#FFF3E0';
      style.borderColor = event.borderColor || '#FFB74D';
      style.color = event.textColor || '#E65100';
    }
  }

  // Apply opacity for completed items
  if (isCompleted) {
    style.opacity = 0.6;
  }

  return {
    className,
    style
  };
}
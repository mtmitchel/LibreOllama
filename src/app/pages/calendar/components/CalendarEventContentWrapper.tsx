import React from 'react';
import { CalendarEventContent } from './CalendarEventContent';
import type { CalendarEvent } from '../types';

interface ReactBigCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  [key: string]: any;
}

interface CalendarEventContentWrapperProps {
  event: ReactBigCalendarEvent;
  view: { type: string };
}

export const CalendarEventContentWrapper: React.FC<CalendarEventContentWrapperProps> = ({ event, view }) => {
  // Handle date conversion - React Big Calendar uses Date objects, FullCalendar uses strings/Date
  const startDate = event.start instanceof Date ? event.start : (event.start ? new Date(event.start) : null);
  const endDate = event.end instanceof Date ? event.end : (event.end ? new Date(event.end) : null);
  
  // Convert React Big Calendar event format to FullCalendar format
  const fullCalendarArg = {
    event: {
      title: event.title || '',
      start: startDate,
      end: endDate,
      allDay: event.allDay || false,
      extendedProps: event.extendedProps || event.resource || {
        type: event.extendedProps?.type || event.resource?.type || (event.extendedProps?.taskData || event.resource?.taskData ? 'task' : 'event'),
        taskData: event.extendedProps?.taskData || event.resource?.taskData,
        location: event.extendedProps?.location || event.resource?.location || event.location,
        attendees: event.extendedProps?.attendees || event.resource?.attendees || event.attendees,
        conferenceLink: event.extendedProps?.conferenceLink || event.resource?.conferenceLink || event.conferenceLink
      }
    },
    view: {
      type: view.type === 'month' ? 'dayGridMonth' : 
            view.type === 'week' ? 'timeGridWeek' : 
            view.type === 'day' ? 'timeGridDay' : 
            'listWeek'
    },
    timeText: event.allDay ? null : (startDate && !isNaN(startDate.getTime()) ? startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : null)
  };

  return <CalendarEventContent arg={fullCalendarArg} />;
};
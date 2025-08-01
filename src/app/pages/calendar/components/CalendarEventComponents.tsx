import React from 'react';
import moment from 'moment';
import { CalendarEventContentWrapper } from './CalendarEventContentWrapper';

interface EventComponentProps {
  event: any;
  view?: string;
}

export const EventComponent: React.FC<EventComponentProps> = ({ event, view = 'month' }) => {
  const isMultiDay = event.allDay && event.start && event.end &&
                    moment(event.start).format('YYYY-MM-DD') !== moment(event.end).format('YYYY-MM-DD');
  
  // For multi-day events, use simple rendering
  if (isMultiDay && view === 'month') {
    return (
      <div className="fc-event-title">
        {event.title}
      </div>
    );
  }
  
  // For other events, use the custom component wrapper
  return <CalendarEventContentWrapper event={event} view={{ type: view }} />;
};

interface EventWrapperProps {
  event: any;
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent, task: any) => void;
}

export const EventWrapper: React.FC<EventWrapperProps> = ({ event, children, onContextMenu }) => {
  const isTaskEvent = event.resource?.type === 'task' && event.resource?.taskData;
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isTaskEvent && onContextMenu) {
      const task = event.resource.taskData;
      onContextMenu(e, task);
    }
    
    return false;
  };
  
  return (
    <div 
      data-event-id={event.id}
      data-event-type={event.resource?.type || 'event'}
      data-is-task={isTaskEvent.toString()}
      data-task-data={isTaskEvent ? JSON.stringify(event.resource.taskData) : undefined}
      onContextMenu={handleContextMenu}
    >
      {children}
    </div>
  );
};
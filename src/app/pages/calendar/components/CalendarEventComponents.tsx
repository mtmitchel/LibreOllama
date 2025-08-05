import React from 'react';
import moment from 'moment';

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
  
  // For single-day events, render based on type
  const isTask = event.resource?.type === 'task' || event.extendedProps?.type === 'task';
  const taskData = event.resource?.taskData || event.extendedProps?.taskData;
  
  return (
    <div className={`fc-event-content ${isTask ? 'task-event' : 'calendar-event'}`}>
      <div className="fc-event-title">
        {event.title}
      </div>
      {taskData?.priority && taskData.priority !== 'none' && (
        <span className={`priority-badge priority-${taskData.priority}`}>
          {taskData.priority}
        </span>
      )}
    </div>
  );
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
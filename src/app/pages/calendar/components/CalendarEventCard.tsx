import React from 'react';
import { Clock, MapPin, Users, Check } from 'lucide-react';
import { CalendarEvent } from '../types/calendar';

interface CalendarEventCardProps {
  event: CalendarEvent;
  view: 'month' | 'week' | 'day' | 'agenda';
  onClick?: (e: React.MouseEvent) => void;
  isAllDay?: boolean;
  isMultiDay?: boolean;
  dayPosition?: 'start' | 'middle' | 'end';
  showTime?: boolean;
  timeText?: string;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  view,
  onClick,
  isAllDay,
  isMultiDay,
  dayPosition,
  showTime,
  timeText
}) => {
  const isTask = event.type === 'task' || event.extendedProps?.type === 'task';
  const isCompleted = event.isCompleted || event.extendedProps?.isCompleted || event.extendedProps?.completed;
  
  // Color based on event type and source
  const getEventColor = () => {
    if (isTask) {
      if (isCompleted) return 'bg-gray-50 border-gray-300 text-gray-500';
      return 'bg-green-50 border-green-300 text-green-900';
    }
    
    if (isMultiDay || event.type === 'multiday') {
      return 'bg-purple-100 border-purple-300 text-purple-900';
    }
    
    // Default event color - matching the Asana purple theme
    return 'bg-purple-50 border-purple-300 text-purple-900';
  };
  
  // Style adjustments for different views
  const getViewStyles = () => {
    if (view === 'month') {
      return `
        px-2 py-1 text-xs font-medium
        ${isMultiDay ? 'h-6' : 'h-auto'}
        ${dayPosition === 'start' ? 'rounded-l-md rounded-r-none' : ''}
        ${dayPosition === 'middle' ? 'rounded-none border-l-0 border-r-0' : ''}
        ${dayPosition === 'end' ? 'rounded-r-md rounded-l-none border-l-0' : ''}
        ${!dayPosition ? 'rounded-md' : ''}
      `;
    }
    
    if (view === 'week' || view === 'day') {
      if (isAllDay) {
        return 'px-2 py-1 text-xs font-medium rounded-md';
      }
      return 'p-2 text-sm rounded-md h-full';
    }
    
    return 'p-3 rounded-md';
  };
  
  return (
    <div
      className={`
        ${getEventColor()}
        ${getViewStyles()}
        border cursor-pointer transition-all duration-150
        hover:shadow-sm hover:scale-[1.02] hover:z-20
        relative overflow-hidden
        ${isCompleted ? 'opacity-60' : ''}
      `}
      onClick={onClick}
      title={event.title}
    >
      <div className={`flex items-center ${view === 'month' ? 'gap-1' : 'gap-1.5'}`}>
        {/* Task checkbox for task events */}
        {isTask && (
          <div className="flex-shrink-0">
            <div
              className={`
                ${view === 'month' ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full border-2
                ${isCompleted ? 'bg-green-600 border-green-600' : 'border-gray-400 bg-white'}
                flex items-center justify-center flex-shrink-0
              `}
            >
              <Check 
                size={view === 'month' ? 10 : 12} 
                className={isCompleted ? "text-white" : "text-gray-400"} 
                strokeWidth={3} 
              />
            </div>
          </div>
        )}
        
        {/* Event content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={`
            font-medium truncate
            ${isCompleted ? 'line-through' : ''}
            ${view === 'month' ? 'text-xs' : 'text-sm'}
          `}>
            {event.title}
          </div>
          
          {/* Time for timed events in week/day view */}
          {showTime && timeText && (view === 'week' || view === 'day') && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
              <Clock size={10} />
              <span>{timeText}</span>
            </div>
          )}
          
          {/* Additional details for larger views */}
          {(view === 'day' || view === 'agenda') && (
            <div className="mt-1 space-y-1">
              {event.location && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin size={10} />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Users size={10} />
                  <span>{event.attendees.length} attendees</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Calendar color indicator for non-task events */}
        {!isTask && event.calendarName && view !== 'month' && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color || '#796EFF' }}
            title={event.calendarName}
          />
        )}
      </div>
      
      {/* Multi-day indicator */}
      {isMultiDay && view === 'month' && dayPosition === 'start' && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-current" />
        </div>
      )}
    </div>
  );
};
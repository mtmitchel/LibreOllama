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
  
  // Color variations for visual hierarchy - Asana purple palette
  const getEventColor = () => {
    if (isTask) {
      if (isCompleted) return 'bg-gray-100 text-gray-600';
      return 'bg-emerald-100 text-emerald-800';
    }
    
    // Multi-day events get deeper purple
    if (isMultiDay || event.type === 'multiday') {
      return 'bg-purple-200 text-purple-900';
    }
    
    // Varied purple shades for different event types - maintaining Asana aesthetic
    const colors = [
      'bg-purple-100 text-purple-800',   // Light purple
      'bg-indigo-100 text-indigo-800',   // Indigo variant
      'bg-violet-100 text-violet-800',   // Violet variant
      'bg-blue-100 text-blue-800',       // Blue accent
      'bg-purple-150 text-purple-900'    // Medium purple
    ];
    
    // Use event ID to consistently assign colors
    const colorIndex = event.id ? parseInt(event.id.slice(-1), 16) % colors.length : 0;
    return colors[colorIndex] || colors[0];
  };
  
  // Compact, rounded styling like Google Calendar but with Asana aesthetics
  const getViewStyles = () => {
    if (view === 'month') {
      return `
        px-2 py-0.5 text-xs font-medium
        ${isMultiDay ? 'h-5' : 'h-5'}
        ${dayPosition === 'start' ? 'rounded-l-lg rounded-r-none' : ''}
        ${dayPosition === 'middle' ? 'rounded-none' : ''}
        ${dayPosition === 'end' ? 'rounded-r-lg rounded-l-none' : ''}
        ${!dayPosition ? 'rounded-lg' : ''}
      `;
    }
    
    if (view === 'week' || view === 'day') {
      if (isAllDay) {
        return 'px-2 py-0.5 text-xs font-medium rounded-lg w-full min-w-0 h-5';
      }
      return 'px-2 py-1 text-xs rounded-lg h-full font-medium';
    }
    
    return 'px-3 py-2 rounded-lg text-sm font-medium';
  };
  
  return (
    <div
      className={`
        ${getEventColor()}
        ${getViewStyles()}
        cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02] hover:z-20
        relative overflow-hidden
        ${isCompleted ? 'opacity-70' : ''}
        shadow-sm
      `}
      onClick={onClick}
      title={event.title}
    >
      <div className={`flex items-center ${view === 'month' ? 'gap-1.5' : 'gap-2'}`}>
        {/* Task checkbox for task events */}
        {isTask && (
          <div className="flex-shrink-0">
            <div
              className={`
                w-3 h-3 rounded-full border-2
                ${isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-gray-400 bg-white'}
                flex items-center justify-center flex-shrink-0
              `}
            >
              <Check 
                size={8} 
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
            font-medium truncate leading-tight
            ${isCompleted ? 'line-through' : ''}
            text-xs
          `}>
            {event.title}
          </div>
          
          {/* Time for timed events in week/day view */}
          {showTime && timeText && (view === 'week' || view === 'day') && (
            <div className="flex items-center gap-1 mt-0.5 text-xs opacity-75">
              <Clock size={8} />
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
        
        {/* Color dot indicator for non-task events */}
        {!isTask && view === 'month' && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 opacity-60"
            style={{ backgroundColor: event.color || '#8B5CF6' }}
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
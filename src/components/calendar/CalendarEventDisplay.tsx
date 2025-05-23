"use client";

import type { CalendarDisplayEvent, CalendarViewMode } from '@/lib/types';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { useCalendar } from '@/contexts/CalendarContext'; 
import React from 'react'; // Import React for CSSProperties

interface CalendarEventDisplayProps {
  event: CalendarDisplayEvent;
  viewMode: CalendarViewMode;
  showTime?: boolean;
  style?: React.CSSProperties; // For absolute positioning
}

export default function CalendarEventDisplay({ event, viewMode, showTime = true, style }: CalendarEventDisplayProps) {
  const { setEditingEvent, setIsEventModalOpen } = useCalendar();

  const eventColor = event.color || 'hsl(var(--primary))';
  
  const isMonthAllDay = viewMode === 'month' && event.isAllDay;

  // Default styling for month view all-day, where it takes full background
  let backgroundColor = isMonthAllDay 
    ? eventColor 
    : (event.color ? `${eventColor}33` : 'hsl(var(--accent))'); // Lighter bg for timed or non-month-all-day
  
  let textColor = isMonthAllDay 
    ? 'hsl(var(--primary-foreground))' 
    : (event.color || 'hsl(var(--accent-foreground))');
  
  let borderColor = event.color || 'hsl(var(--primary))';

  // Adjust styling for absolutely positioned timed events in Day/Week view
  if ((viewMode === 'day' || viewMode === 'week') && !event.isAllDay) {
    backgroundColor = `${eventColor}CC`; // More opaque for distinct blocks
    textColor = 'hsl(var(--primary-foreground))'; // Ensure contrast
    // borderColor is already eventColor
  }


  const startTime = format(event.start, 'h:mmaa');
  const endTime = format(event.end, 'h:mmaa');

  const handleEventClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent day click if event is inside a clickable day cell
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  if (viewMode === 'month') { 
     return (
      <div 
        className="text-xs p-0.5 mb-0.5 rounded-sm truncate cursor-pointer hover:opacity-80 overflow-hidden" 
        style={{ 
            backgroundColor: event.isAllDay ? (event.color || 'hsl(var(--primary))') : (event.color ? `${event.color}4D` : 'hsl(var(--accent))'),
            color: event.isAllDay ? 'hsl(var(--primary-foreground))' : (event.color || 'hsl(var(--accent-foreground))'),
            borderLeft: event.isAllDay ? 'none' : `3px solid ${event.color || 'hsl(var(--primary))'}`,
            ...style // For month view, style prop might not be used much
        }}
        title={`${event.title}${!event.isAllDay ? ` (${startTime} - ${endTime})` : ' (All day)'}`}
        onClick={handleEventClick}
      >
        {!event.isAllDay && <span className="font-semibold">{format(event.start, 'ha')}</span>}
        <span className="ml-1">{event.title}</span>
      </div>
    );
  }

  // For DayView and WeekView timed events (and potentially all-day events if rendered similarly)
  return (
    <div 
      className="p-1 rounded text-xs border shadow-sm cursor-pointer hover:shadow-md overflow-hidden flex flex-col justify-start items-start w-full" 
      style={{
        backgroundColor,
        color: textColor,
        borderColor: borderColor,
        ...style // This will include top, height, position: 'absolute', etc.
      }}
      title={event.description || event.title}
      onClick={handleEventClick}
    >
      <p className="font-semibold truncate w-full">{event.title}</p>
      {showTime && !event.isAllDay && (
        <p className="text-[10px] opacity-90 flex items-center"> {/* Smaller text for time */}
          <Clock size={10} className="mr-0.5 opacity-70 shrink-0"/> {startTime} - {endTime}
        </p>
      )}
       {event.isAllDay && (viewMode === 'day' || viewMode === 'week') && ( // Show (All day) text if not in month compact view
         <p className="text-xs opacity-90">(All day)</p>
       )}
    </div>
  );
}

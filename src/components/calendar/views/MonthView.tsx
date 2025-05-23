
"use client";

import React from 'react';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { Badge } from '@/components/ui/badge';
import { isSameDay, format, isWithinInterval, addDays, startOfDay, isSameMonth } from 'date-fns';
import type { CalendarDisplayEvent } from '@/lib/types';
import { cn } from "@/lib/utils";

// Helper function to get events for a specific day
const getEventsForDay = (day: Date, events: CalendarDisplayEvent[]) => {
  return events.filter(event => 
    isWithinInterval(day, { start: startOfDay(event.start), end: startOfDay(event.end) }) || 
    (isSameDay(event.start, day) && !event.isAllDay)
  ).sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return a.start.getTime() - b.start.getTime();
  });
};

export default function MonthView() {
  const { currentDate, setCurrentDate, visibleEvents, setCurrentViewMode, setEditingEvent, setIsEventModalOpen } = useCalendar();

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setCurrentViewMode('day'); // Switch to day view on click
  };

  const handleEventClick = (event: CalendarDisplayEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent day click when clicking an event
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };
  
  const DayContent = (day: Date) : JSX.Element => {
    const dayEvents = getEventsForDay(day, visibleEvents);
    const dayNumber = format(day, 'd');
    const MAX_EVENTS_TO_SHOW = 2; // Max events before showing "+ X more"

    return (
      <div 
        className="relative h-full w-full flex flex-col p-1 text-xs overflow-hidden cursor-pointer"
        onClick={() => handleDayClick(day)}
      >
        <span className={cn(
          "self-end font-medium text-xs w-5 h-5 flex items-center justify-center rounded-full mb-0.5",
          isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
        )}>
          {dayNumber}
        </span>
        <div className="flex-grow overflow-y-auto space-y-0.5">
          {dayEvents.slice(0, MAX_EVENTS_TO_SHOW).map(event => (
             <div 
                key={event.id} 
                className="truncate text-xs rounded px-1 py-0.5" 
                style={{ 
                  backgroundColor: event.isAllDay ? (event.color ? `${event.color}` : 'hsl(var(--primary))') : (event.color ? `${event.color}33` : 'hsl(var(--accent))'), 
                  color: event.isAllDay ? 'hsl(var(--primary-foreground))' : (event.color || 'hsl(var(--accent-foreground))'),
                  borderColor: event.color || 'hsl(var(--primary))',
                  borderLeftWidth: event.isAllDay ? '0px' : '2px',
                }}
                title={event.title}
                onClick={(e) => handleEventClick(event, e)}
              >
              {event.isAllDay ? event.title : <><span className="font-semibold">{format(event.start, 'ha')}</span> {event.title}</>}
            </div>
          ))}
          {dayEvents.length > MAX_EVENTS_TO_SHOW && (
            <div className="text-xs text-muted-foreground mt-0.5" onClick={(e) => {e.stopPropagation(); handleDayClick(day);}}>
              + { dayEvents.length - MAX_EVENTS_TO_SHOW } more
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="p-0 h-full flex flex-col">
      <ShadCalendar
        mode="single" // Still single for selection, but we use it as a month display
        selected={currentDate}
        onSelect={(date) => date && handleDayClick(date)} // Using day click from DayContent, but keep this for accessibility
        month={currentDate}
        onMonthChange={setCurrentDate} // Allows month navigation
        className="rounded-md border-0 flex-grow" // Make calendar take available space
        classNames={{
          months: "flex flex-col sm:flex-row space-y-0 sm:space-x-0 sm:space-y-0 h-full",
          month: "space-y-1 flex flex-col h-full",
          table: "w-full border-collapse space-y-0 h-full flex flex-col",
          head_row: "flex flex-none",
          head_cell:"text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center py-2 border-b border-r last:border-r-0",
          row: "flex w-full flex-1 min-h-[6rem]", // Each week row takes up space
          cell: cn(
            "h-auto w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 border-b border-r flex-1 flex flex-col last:border-r-0",
             "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:z-20" // Enhanced focus
          ),
          day: cn(
            "h-full w-full p-0 font-normal aria-selected:opacity-100 rounded-none focus:outline-none", // remove button like styling from day itself
          ),
          day_selected: "", // Handled by DayContent
          day_today: "", // Handled by DayContent for number background
          day_outside: "day-outside text-muted-foreground opacity-30", // Keep outside days muted
          day_disabled: "text-muted-foreground opacity-30",
          caption: "flex justify-center py-2 relative items-center text-lg font-medium border-b",
          caption_label: "text-lg",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
        }}
        components={{
          DayContent: ({ date, activeModifiers, displayMonth }) => {
            // Only render DayContent for days within the current displayMonth
            if (!isSameMonth(date, displayMonth)) {
                 // For outside days, render a minimal, non-interactive cell
                return <div className="h-full w-full opacity-30 p-1"><span className="float-right text-xs">{format(date, 'd')}</span></div>;
            }
            return DayContent(date);
          }
        }}
      />
    </div>
  );
}

import { buttonVariants } from "@/components/ui/button";


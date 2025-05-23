
"use client";

import React, { useState } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, isSameDay, addHours, startOfDay, endOfDay, isWithinInterval, getMinutes, getHours } from 'date-fns';
import CalendarEventDisplay from '@/components/calendar/CalendarEventDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CalendarDisplayEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i); // 0-23
const HOUR_HEIGHT_PIXELS = 56; // Corresponds to h-14 (formerly h-16, 64px)

export default function DayView() {
  const { currentDate, visibleEvents, setIsEventModalOpen, setEditingEvent, setSelectedDateForNewEvent } = useCalendar();
  const [draggedOverHour, setDraggedOverHour] = useState<number | null>(null);

  const dayEvents = visibleEvents.filter(event => 
    isWithinInterval(currentDate, { start: startOfDay(event.start), end: endOfDay(event.end) }) ||
    (isSameDay(event.start, currentDate)) // Include events that start on this day
  ).sort((a,b) => a.start.getTime() - b.start.getTime());

  const allDayEvents = dayEvents.filter(event => 
    event.isAllDay && isWithinInterval(currentDate, { start: startOfDay(event.start), end: startOfDay(event.end) })
  );

  const timedEvents = dayEvents.filter(event => !event.isAllDay && isSameDay(event.start, currentDate));

  const calculateEventPosition = (event: CalendarDisplayEvent) => {
    const startHour = getHours(event.start);
    const startMinute = getMinutes(event.start);
    const endHour = getHours(event.end);
    const endMinute = getMinutes(event.end);

    const top = (startHour + startMinute / 60) * HOUR_HEIGHT_PIXELS;
    
    const durationInMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    let height = (durationInMinutes / 60) * HOUR_HEIGHT_PIXELS;

    // Ensure a minimum height for very short events to be clickable/visible
    height = Math.max(height, HOUR_HEIGHT_PIXELS / 2); // Min height of 30 mins slot

    return { top, height };
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, hour: number) => {
    e.preventDefault();
    setDraggedOverHour(null); // Clear highlight on drop
    const taskId = e.dataTransfer.getData("taskId");
    const taskTitle = e.dataTransfer.getData("taskTitle");
    const taskDuration = parseInt(e.dataTransfer.getData("taskDuration"), 10) || 60; // Default to 60 mins

    if (taskId && taskTitle) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();

        const newEventStart = new Date(year, month, day, hour, 0, 0);
        const newEventEnd = new Date(newEventStart.getTime() + taskDuration * 60000);
        
        setEditingEvent({
            // Temporary event structure for modal prefill
            id: '', // Will be generated on save
            title: taskTitle,
            start: newEventStart,
            end: newEventEnd,
            isAllDay: false,
            calendarId: 'tasks_cal', // Default to tasks calendar or a configurable default
            description: `Scheduled from task: ${taskTitle}`,
        });
        setSelectedDateForNewEvent(newEventStart);
        setIsEventModalOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, hour: number) => {
    e.preventDefault();
    // Check if dataTransfer contains the type we expect from tasks
    if (Array.from(e.dataTransfer.types).includes("tasktype")) {
        setDraggedOverHour(hour);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, hour: number) => {
    e.preventDefault();
     if (Array.from(e.dataTransfer.types).includes("tasktype")) {
        setDraggedOverHour(hour);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOverHour(null);
  };


  return (
    <div className="flex flex-col h-full">
      {allDayEvents.length > 0 && (
        <div className="p-2 border-b bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1 pl-1">All-day</div>
          <div className="space-y-0.5">
            {allDayEvents.map(event => (
              <CalendarEventDisplay key={event.id} event={event} viewMode="day" showTime={false} />
            ))}
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="relative grid grid-cols-[auto_1fr] min-h-full"> {/* Ensure min-h-full for event positioning */}
          {/* Time Column */}
          <div className="sticky left-0 bg-background z-10">
            {HOURS_IN_DAY.map(hour => (
              <div 
                key={`time-${hour}`} 
                className="h-14 text-right pr-2 pt-0.5 border-r text-xs text-muted-foreground" // h-14 for 56px
                style={{ height: `${HOUR_HEIGHT_PIXELS}px` }}
              >
                {hour > 0 ? format(addHours(new Date(2000,0,1,hour),0), 'ha') : ''}
              </div>
            ))}
          </div>

          {/* Event Column */}
          <div className="relative border-r">
            {/* Background hour lines */}
            {HOURS_IN_DAY.map(hour => (
              <div 
                key={`cell-${hour}`} 
                className={cn(
                  "border-b relative transition-colors duration-150", // h-14 for 56px
                  draggedOverHour === hour && "bg-accent"
                )}
                style={{ height: `${HOUR_HEIGHT_PIXELS}px` }}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragEnter={(e) => handleDragEnter(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
              >
                {/* This div acts as a drop target for each hour slot */}
              </div>
            ))}
            
            {/* Positioned Events Layer */}
            <div className="absolute inset-0 z-5"> {/* Events will be placed here */}
               {timedEvents.map(event => {
                 const {top, height} = calculateEventPosition(event);
                 return (
                   <CalendarEventDisplay 
                      key={event.id} 
                      event={event} 
                      viewMode="day" 
                      showTime={true}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '2px', // Small gap from the time gutter
                        right: '2px', // Small gap from the edge
                        zIndex: 10, // Ensure events are above grid lines
                        width: 'calc(100% - 4px)',
                      }}
                    />
                 );
               })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}



"use client";

import React, { useState } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, eachDayOfInterval, isSameDay, addHours, isWithinInterval, startOfDay, endOfDay, getHours, getMinutes } from 'date-fns';
import CalendarEventDisplay from '@/components/calendar/CalendarEventDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CalendarDisplayEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i); // 0-23
const HOUR_HEIGHT_PIXELS = 56; // Corresponds to h-14 (formerly h-16, 64px)

interface DraggedOverCell {
  day: string; // Store day as string to avoid date object comparison issues in state
  hour: number;
}

export default function WeekView() {
  const { displayedDateRange, visibleEvents, setCurrentDate, setCurrentViewMode, setIsEventModalOpen, setEditingEvent, setSelectedDateForNewEvent } = useCalendar();
  const daysInWeek = eachDayOfInterval({ start: displayedDateRange.start, end: displayedDateRange.end });
  const [draggedOverCell, setDraggedOverCell] = useState<DraggedOverCell | null>(null);


  const getEventsForDay = (day: Date) => {
    return visibleEvents.filter(event => 
      isWithinInterval(day, { start: startOfDay(event.start), end: endOfDay(event.end) }) ||
      (isSameDay(event.start, day)) 
    ).sort((a,b) => a.start.getTime() - b.start.getTime());
  };
  
  const getAllDayEventsForDay = (day: Date) => {
    return getEventsForDay(day).filter(event => event.isAllDay && isWithinInterval(day, { start: startOfDay(event.start), end: startOfDay(event.end) }));
  };

  const getTimedEventsForDay = (day: Date) => {
    return getEventsForDay(day).filter(event => !event.isAllDay && isSameDay(event.start, day));
  };

  const handleDayHeaderClick = (day: Date) => {
    setCurrentDate(day);
    setCurrentViewMode('day');
  };

  const calculateEventPosition = (event: CalendarDisplayEvent) => {
    const startHour = getHours(event.start);
    const startMinute = getMinutes(event.start);
    const endHour = getHours(event.end);
    const endMinute = getMinutes(event.end);

    const top = (startHour + startMinute / 60) * HOUR_HEIGHT_PIXELS;
    
    const durationInMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    let height = (durationInMinutes / 60) * HOUR_HEIGHT_PIXELS;
    height = Math.max(height, HOUR_HEIGHT_PIXELS / 2); // Min height of 30 mins slot

    return { top, height };
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dayDate: Date, hour: number) => {
    e.preventDefault();
    setDraggedOverCell(null); // Clear highlight
    const taskId = e.dataTransfer.getData("taskId");
    const taskTitle = e.dataTransfer.getData("taskTitle");
    const taskDuration = parseInt(e.dataTransfer.getData("taskDuration"), 10) || 60;

    if (taskId && taskTitle) {
        const newEventStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hour, 0, 0);
        const newEventEnd = new Date(newEventStart.getTime() + taskDuration * 60000);
        
        setEditingEvent({
            id: '', 
            title: taskTitle,
            start: newEventStart,
            end: newEventEnd,
            isAllDay: false,
            calendarId: 'tasks_cal', 
            description: `Scheduled from task: ${taskTitle}`,
        });
        setSelectedDateForNewEvent(newEventStart);
        setIsEventModalOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dayDate: Date, hour: number) => {
    e.preventDefault();
    if (Array.from(e.dataTransfer.types).includes("tasktype")) {
      setDraggedOverCell({ day: dayDate.toISOString().split('T')[0], hour });
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, dayDate: Date, hour: number) => {
    e.preventDefault();
     if (Array.from(e.dataTransfer.types).includes("tasktype")) {
       setDraggedOverCell({ day: dayDate.toISOString().split('T')[0], hour });
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOverCell(null);
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-none border-b">
        <div className="w-16 border-r sticky left-0 bg-background z-10"></div> 
        {daysInWeek.map(day => (
          <div 
            key={day.toString()} 
            className="flex-1 text-center p-2 border-r cursor-pointer hover:bg-muted" 
            onClick={() => handleDayHeaderClick(day)}
          >
            <div className={cn(
                "text-xs", 
                isSameDay(day, new Date()) ? 'text-primary font-semibold' : 'text-muted-foreground'
            )}>
              {format(day, 'EEE')}
            </div>
            <div className={cn(
                "text-2xl font-medium", 
                isSameDay(day, new Date()) ? 'text-primary' : ''
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-none border-b bg-muted/30">
        <div className="w-16 border-r p-1 text-xs text-muted-foreground text-center sticky left-0 bg-background z-10">All-day</div>
        {daysInWeek.map(day => (
          <div key={`allday-${day.toString()}`} className="flex-1 border-r p-1 min-h-[2.5rem] space-y-0.5">
            {getAllDayEventsForDay(day).map(event => (
              <CalendarEventDisplay key={event.id} event={event} viewMode="week" showTime={false} />
            ))}
          </div>
        ))}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="relative grid grid-cols-[auto_repeat(7,1fr)] min-h-full"> {/* Ensure min-h-full */}
          {/* Time Column */}
          <div className="sticky left-0 bg-background z-10">
            {HOURS_IN_DAY.map(hour => (
              <div 
                key={`time-${hour}`} 
                className="h-14 text-right pr-1 pt-0.5 border-r text-xs text-muted-foreground" // h-14 for 56px
                style={{ height: `${HOUR_HEIGHT_PIXELS}px` }}
              >
                {hour > 0 ? format(addHours(new Date(2000,0,1,hour),0), 'ha') : ''}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {daysInWeek.map(dayDate => (
            <div key={`daycol-${dayDate.toString()}`} className="relative border-r">
              {/* Background hour lines */}
              {HOURS_IN_DAY.map(hour => (
                <div 
                  key={`cell-${dayDate.toString()}-${hour}`} 
                  className={cn(
                    "border-b relative transition-colors duration-150", // h-14 for 56px
                    draggedOverCell?.day === dayDate.toISOString().split('T')[0] && draggedOverCell?.hour === hour && "bg-accent"
                  )}
                  style={{ height: `${HOUR_HEIGHT_PIXELS}px` }}
                  onDragOver={(e) => handleDragOver(e, dayDate, hour)}
                  onDragEnter={(e) => handleDragEnter(e, dayDate, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayDate, hour)}
                >
                </div>
              ))}
              {/* Positioned Events Layer for this day */}
              <div className="absolute inset-0 z-5">
                 {getTimedEventsForDay(dayDate).map(event => {
                   const {top, height} = calculateEventPosition(event);
                   return (
                     <CalendarEventDisplay 
                        key={event.id} 
                        event={event} 
                        viewMode="week" 
                        showTime={true}
                        style={{
                          position: 'absolute',
                          top: `${top}px`,
                          height: `${height}px`,
                          left: '1px', 
                          right: '1px',
                          zIndex: 10,
                          width: 'calc(100% - 2px)',
                        }}
                      />
                   );
                 })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}


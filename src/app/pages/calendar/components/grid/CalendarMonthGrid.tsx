import React, { useMemo } from 'react';
import { format, isSameMonth, isToday, startOfDay, isSameDay, endOfDay } from 'date-fns';
import { CalendarEvent, MonthViewDay } from '../../types/calendar';
import { getMonthGridDates, isMultiDayEvent, calculateMultiDayEventLayouts, MultiDayEventLayout } from '../../utils/dateUtils';
import { sortEventsWithTaskPriority } from '../../utils/eventSorting';
import { CalendarEventCard } from '../CalendarEventCard';
import { DroppableCalendarCell } from '../dnd/DroppableCalendarCell';

interface CalendarMonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent, e?: React.MouseEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: CalendarEvent, date: Date) => void;
  onMoreClick?: (events: CalendarEvent[], e: React.MouseEvent) => void;
  maxEventsPerDay?: number;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
  onMoreClick,
  maxEventsPerDay = 2
}) => {
  // Generate grid dates
  const gridDates = useMemo(() => getMonthGridDates(currentDate), [currentDate]);
  
  // Process events and layouts
  const { singleDayEventsByDate, multiDayLayoutsByWeek, maxMultiDayRows } = useMemo(() => {
    // Separate single-day and multi-day events
    const singleDayEvents: CalendarEvent[] = [];
    const multiDayEvents: CalendarEvent[] = [];
    
    events.forEach(event => {
      // Tasks should NEVER be multi-day events
      const isTask = event.extendedProps?.type === 'task';
      if (event.allDay && !isTask && isMultiDayEvent(event.start, event.end)) {
        multiDayEvents.push(event);
      } else {
        singleDayEvents.push(event);
      }
    });
    
    // Group single-day events by date
    const singleDayMap = new Map<string, CalendarEvent[]>();
    singleDayEvents.forEach(event => {
      const key = format(event.start, 'yyyy-MM-dd');
      if (!singleDayMap.has(key)) singleDayMap.set(key, []);
      singleDayMap.get(key)!.push(event);
    });
    
    // Sort events within each day to prioritize tasks over sports games
    singleDayMap.forEach((events, key) => {
      singleDayMap.set(key, sortEventsWithTaskPriority(events));
    });
    
    // Calculate multi-day layouts per week
    const layoutsByWeek: MultiDayEventLayout[][] = [];
    const maxRows: number[] = [];
    
    for (let week = 0; week < gridDates.length / 7; week++) {
      const weekDates = gridDates.slice(week * 7, (week + 1) * 7);
      const weekStart = startOfDay(weekDates[0]);
      const weekEnd = endOfDay(weekDates[6]);
      
      // Get multi-day events that overlap with this week
      const weekMultiDayEvents = multiDayEvents.filter(event => {
        const eventStart = startOfDay(event.start);
        const eventEnd = endOfDay(event.end);
        // Event overlaps if it starts before week ends AND ends after week starts
        return eventStart <= weekEnd && eventEnd >= weekStart;
      });
      
      // Sort by start date, then by duration (longer first)
      weekMultiDayEvents.sort((a, b) => {
        const startDiff = a.start.getTime() - b.start.getTime();
        if (startDiff !== 0) return startDiff;
        const durationA = a.end.getTime() - a.start.getTime();
        const durationB = b.end.getTime() - b.start.getTime();
        return durationB - durationA;
      });
      
      // Calculate layouts
      const weekLayouts: MultiDayEventLayout[] = [];
      const rows: Array<{ endDay: number }> = [];
      
      weekMultiDayEvents.forEach(event => {
        const eventStart = startOfDay(event.start);
        const eventEnd = startOfDay(event.end);
        
        // Calculate start and end columns for this week
        let startCol = -1;
        let endCol = -1;
        
        for (let i = 0; i < weekDates.length; i++) {
          const date = startOfDay(weekDates[i]);
          if (date >= eventStart && startCol === -1) {
            startCol = i;
          }
          // For all-day events, we need to subtract one day from end since it's exclusive
          const effectiveEnd = new Date(eventEnd);
          effectiveEnd.setDate(effectiveEnd.getDate() - 1);
          if (date <= effectiveEnd) {
            endCol = i;
          }
        }
        
        // Clamp to week boundaries
        if (startCol === -1) startCol = 0;
        if (endCol === -1) endCol = 6;
        if (endCol > 6) endCol = 6;
        
        // Find first available row
        let row = -1;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].endDay < startCol) {
            row = i;
            rows[i].endDay = endCol;
            break;
          }
        }
        
        if (row === -1) {
          row = rows.length;
          rows.push({ endDay: endCol });
        }
        
        weekLayouts.push({
          eventId: event.id,
          row,
          startCol,
          endCol,
          event
        });
      });
      
      layoutsByWeek.push(weekLayouts);
      maxRows.push(rows.length);
    }
    
    return {
      singleDayEventsByDate: singleDayMap,
      multiDayLayoutsByWeek: layoutsByWeek,
      maxMultiDayRows: maxRows
    };
  }, [events, gridDates]);
  
  // Week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(day => (
          <div
            key={day}
            className="px-3 py-2 text-xs font-medium text-gray-500 text-center"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Render weeks */}
        {Array.from({ length: gridDates.length / 7 }).map((_, weekIndex) => {
          const weekDates = gridDates.slice(weekIndex * 7, (weekIndex + 1) * 7);
          const weekLayouts = multiDayLayoutsByWeek[weekIndex];
          const multiDayRows = maxMultiDayRows[weekIndex];
          
          return (
            <div key={weekIndex} className="relative border-b border-gray-200 last:border-b-0 flex-1 flex flex-col">
              {/* Days grid */}
              <div className="grid grid-cols-7 relative flex-1">
                {weekDates.map((date, dayIndex) => {
                  const dayEvents = singleDayEventsByDate.get(format(date, 'yyyy-MM-dd')) || [];
                  const totalEventsForDay = dayEvents.length;
                  const visibleEvents = dayEvents.slice(0, maxEventsPerDay);
                  const moreCount = totalEventsForDay - visibleEvents.length;
                  
                  // Calculate multi-day events that actually pass through THIS specific day
                  const multiDayEventsForThisDay = weekLayouts.filter(layout => 
                    dayIndex >= layout.startCol && dayIndex <= layout.endCol
                  );
                  const multiDayRowsForThisDay = multiDayEventsForThisDay.length > 0
                    ? Math.max(...multiDayEventsForThisDay.map(l => l.row)) + 1
                    : 0;
                  
                  return (
                    <DroppableCalendarCell
                      key={date.toISOString()}
                      date={date}
                      onDrop={onEventDrop}
                      onClick={() => onDateClick?.(date)}
                      className={`
                        h-full p-2 border-r border-gray-200 last:border-r-0
                        ${!isSameMonth(date, currentDate) ? 'bg-gray-50 text-gray-400' : ''}
                        ${isToday(date) ? 'bg-blue-50' : ''}
                        hover:bg-gray-50 cursor-pointer transition-colors
                      `}
                    >
                      <div className="flex flex-col h-full">
                        {/* Date number */}
                        <div className={`
                          text-sm font-medium mb-1
                          ${isToday(date) ? 'text-blue-600' : ''}
                        `}>
                          {format(date, 'd')}
                        </div>
                        
                        {/* Multi-day events space - only for events that pass through this day */}
                        {multiDayRowsForThisDay > 0 && (
                          <div style={{ height: `${multiDayRowsForThisDay * 24}px` }} />
                        )}
                        
                        {/* Single-day events */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {visibleEvents.map((event) => (
                            <CalendarEventCard
                              key={event.id}
                              event={event}
                              view="month"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event, e);
                              }}
                            />
                          ))}
                          
                          {moreCount > 0 && (
                            <button
                              className="w-full text-left text-xs text-blue-600 hover:text-blue-700 font-medium px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onMoreClick) {
                                  onMoreClick(dayEvents, e);
                                }
                              }}
                            >
                              +{moreCount} more
                            </button>
                          )}
                        </div>
                      </div>
                    </DroppableCalendarCell>
                  );
                })}
              </div>
              
              {/* Multi-day events overlay - positioned after date numbers */}
              {multiDayRows > 0 && (
                <div 
                  className="absolute left-0 right-0 pointer-events-none" 
                  style={{ 
                    top: '28px', // Position below date numbers (text-sm + mb-1 ≈ 28px)
                    height: `${multiDayRows * 24}px` 
                  }}
                >
                  {weekLayouts.map(layout => {
                    const spanCols = layout.endCol - layout.startCol + 1;
                    
                    return (
                      <div
                        key={layout.eventId}
                        className="absolute pointer-events-auto"
                        style={{
                          top: `${layout.row * 24}px`,
                          left: `${(layout.startCol / 7) * 100}%`,
                          width: `${(spanCols / 7) * 100}%`,
                          height: '22px',
                          paddingLeft: layout.startCol === 0 ? '8px' : '0',
                          paddingRight: layout.endCol === 6 ? '8px' : '0'
                        }}
                      >
                        <CalendarEventCard
                          event={layout.event}
                          view="month"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(layout.event, e);
                          }}
                          isMultiDay={true}
                          dayPosition={
                            layout.startCol > 0 && layout.endCol < 6 ? 'middle' :
                            layout.startCol === 0 && layout.endCol === 6 ? undefined :
                            layout.startCol === 0 ? 'start' :
                            layout.endCol === 6 ? 'end' : 'middle'
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
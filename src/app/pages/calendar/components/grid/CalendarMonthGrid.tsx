import React, { useMemo } from 'react';
import { format, isSameMonth, isToday, startOfDay } from 'date-fns';
import { CalendarEvent, MonthViewDay } from '../../types/calendar';
import { getMonthGridDates, isMultiDayEvent } from '../../utils/dateUtils';
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
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    events.forEach(event => {
      const startKey = format(event.start, 'yyyy-MM-dd');
      const endKey = format(event.end, 'yyyy-MM-dd');
      
      if (event.allDay && isMultiDayEvent(event.start, event.end)) {
        // Handle multi-day events
        let current = startOfDay(event.start);
        while (current <= event.end) {
          const key = format(current, 'yyyy-MM-dd');
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(event);
          current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
      } else {
        // Single day event
        if (!map.has(startKey)) map.set(startKey, []);
        map.get(startKey)!.push(event);
      }
    });
    
    return map;
  }, [events]);
  
  // Generate month grid data
  const monthData: MonthViewDay[] = useMemo(() => {
    return gridDates.map(date => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      events: eventsByDate.get(format(date, 'yyyy-MM-dd')) || [],
      dayNumber: date.getDate()
    }));
  }, [gridDates, currentDate, eventsByDate]);
  
  // Week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="calendar-custom calendar-month-grid h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
        {weekDays.map(day => (
          <div
            key={day}
            className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
        {monthData.map((day, index) => {
          const { date, isCurrentMonth, isToday, events: dayEvents } = day;
          const visibleEvents = dayEvents.slice(0, maxEventsPerDay);
          const moreCount = dayEvents.length - maxEventsPerDay;
          
          return (
            <DroppableCalendarCell
              key={index}
              date={date}
              className={`
                min-h-[100px] p-2 border-r border-b border-gray-200 overflow-hidden
                ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                ${isToday ? 'bg-blue-50' : ''}
                hover:bg-gray-50 transition-colors cursor-pointer
                ${index % 7 === 6 ? 'border-r-0' : ''}
                ${index >= 35 ? 'border-b-0' : ''}
              `}
            >
              <div
                className="h-full flex flex-col"
                onClick={() => onDateClick?.(date)}
                data-date={format(date, 'yyyy-MM-dd')}
              >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                    ${isToday ? 'text-white bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center' : ''}
                  `}
                >
                  {day.dayNumber}
                </span>
              </div>
              
              {/* Events */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {visibleEvents.map((event, eventIndex) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    view="month"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, e);
                    }}
                    isMultiDay={event.allDay && isMultiDayEvent(event.start, event.end)}
                    dayPosition={
                      event.allDay && isMultiDayEvent(event.start, event.end)
                        ? format(date, 'yyyy-MM-dd') === format(event.start, 'yyyy-MM-dd')
                          ? 'start'
                          : format(date, 'yyyy-MM-dd') === format(event.end, 'yyyy-MM-dd')
                          ? 'end'
                          : 'middle'
                        : undefined
                    }
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
    </div>
  );
};
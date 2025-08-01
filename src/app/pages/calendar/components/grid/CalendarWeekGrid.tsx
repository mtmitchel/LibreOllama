import React, { useMemo, useRef, useEffect } from 'react';
import { format, isToday, isSameDay, startOfDay } from 'date-fns';
import { CalendarEvent, WeekViewColumn } from '../../types/calendar';
import { 
  generateTimeSlots, 
  calculateEventPosition, 
  calculateEventColumns,
  getCurrentTimePosition,
  HOUR_HEIGHT,
  formatEventTime
} from '../../utils/dateUtils';
import { CalendarEventCard } from '../CalendarEventCard';

interface CalendarWeekGridProps {
  currentDate: Date;
  weekDates: Date[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent, e?: React.MouseEvent) => void;
  onDateClick?: (date: Date, time?: Date) => void;
  onEventDrop?: (event: CalendarEvent, date: Date, time?: Date) => void;
  workingHours?: { start: number; end: number };
}

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  currentDate,
  weekDates,
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
  workingHours = { start: 0, end: 24 }
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlots = useMemo(() => generateTimeSlots(0, 24, 30), []);
  
  // Organize events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, { allDay: CalendarEvent[]; timed: CalendarEvent[] }>();
    
    weekDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      map.set(key, { allDay: [], timed: [] });
    });
    
    events.forEach(event => {
      const key = format(event.start, 'yyyy-MM-dd');
      const dayEvents = map.get(key);
      if (dayEvents) {
        if (event.allDay) {
          dayEvents.allDay.push(event);
        } else {
          dayEvents.timed.push(event);
        }
      }
    });
    
    return map;
  }, [weekDates, events]);
  
  // Calculate event positions for each day
  const eventPositions = useMemo(() => {
    const positions = new Map<string, Map<string, any>>();
    
    weekDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      const dayEvents = eventsByDay.get(key)?.timed || [];
      const dayPositions = calculateEventColumns(dayEvents);
      positions.set(key, dayPositions);
    });
    
    return positions;
  }, [weekDates, eventsByDay]);
  
  // Current time indicator position
  const currentTimePosition = getCurrentTimePosition(HOUR_HEIGHT);
  const showCurrentTime = weekDates.some(date => isToday(date));
  
  // Calculate max all-day events for consistent height
  const maxAllDayEvents = Math.max(
    ...Array.from(eventsByDay.values()).map(d => d.allDay.length),
    1
  );
  const allDayHeight = Math.max(60, maxAllDayEvents * 32 + 20); // More padding for better visibility
  
  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Calculate scroll position based on current time
      // Scroll to 1 hour before current time to show some context
      const scrollHour = Math.max(0, currentHour - 1);
      const scrollMinutes = currentHour > 0 ? currentMinutes : 0;
      
      // Calculate exact pixel position
      const hourPosition = scrollHour * HOUR_HEIGHT;
      const minutePosition = (scrollMinutes / 60) * HOUR_HEIGHT;
      
      // Account for sticky headers (72px for day headers + all-day section)
      const headerOffset = 72 + allDayHeight;
      const scrollPosition = hourPosition + minutePosition - headerOffset;
      
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);
    }
  }, [allDayHeight]);
  
  return (
    <div className="calendar-custom calendar-week-grid h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-auto relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `64px repeat(${weekDates.length}, minmax(0, 1fr))`,
          gridTemplateRows: `72px minmax(${allDayHeight}px, auto) 1fr`
        }}
      >
        {/* Sticky time column header */}
        <div 
          className="sticky top-0 z-40 bg-white border-r border-b border-gray-200"
          style={{ gridColumn: '1', gridRow: '1' }}
        />
        
        {/* Day headers - sticky */}
        {weekDates.map((date, index) => (
          <div
            key={`header-${date.toString()}`}
            className={`sticky top-0 z-40 bg-white text-center pt-2 pb-4 border-b ${index < weekDates.length - 1 ? 'border-r' : ''} border-gray-200`}
            style={{ 
              gridColumn: `${index + 2}`,
              gridRow: '1',
              backgroundColor: isToday(date) ? 'rgba(239, 246, 255, 0.5)' : 'white'
            }}
          >
            <div className="text-xs font-semibold text-gray-600 uppercase">
              {format(date, 'EEE')}
            </div>
            <div 
              className={`text-2xl font-medium mt-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}
              style={{ paddingBottom: '8px' }}
            >
              {format(date, 'd')}
            </div>
          </div>
        ))}
        
        {/* All-day label - sticky */}
        <div 
          className="sticky z-30 bg-gray-50 px-2 py-2 text-xs text-gray-500 text-right border-r border-b border-gray-200 flex items-start justify-end"
          style={{ 
            gridColumn: '1', 
            gridRow: '2',
            height: `${allDayHeight}px`,
            top: '72px'
          }}
        >
          all day
        </div>
        
        {/* All-day events - sticky */}
        {weekDates.map((date, index) => {
          const dayEvents = eventsByDay.get(format(date, 'yyyy-MM-dd'));
          
          return (
            <div
              key={`allday-${date.toString()}`}
              className={`sticky z-30 bg-gray-50 p-2 border-b ${index < weekDates.length - 1 ? 'border-r' : ''} border-gray-200`}
              style={{ 
                gridColumn: `${index + 2}`,
                gridRow: '2',
                minHeight: `${allDayHeight}px`,
                top: '72px'
              }}
            >
              <div className="space-y-1">
                {dayEvents?.allDay.map(event => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    view="week"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, e);
                    }}
                    isAllDay
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Time labels - sticky left */}
        <div 
          className="sticky left-0 z-10 bg-white border-r border-gray-200"
          style={{ 
            gridColumn: '1',
            gridRow: '3'
          }}
        >
          {timeSlots
            .filter((_, index) => index % 2 === 0)
            .map((slot, index) => (
              <div
                key={index}
                className="h-[60px] px-2 text-xs text-gray-500 text-right flex items-center justify-end"
                style={{ 
                  marginTop: index === 0 ? '-8px' : '0'
                }}
              >
                {format(slot, 'h a')}
              </div>
            ))}
        </div>
        
        {/* Time grid for each day */}
        {weekDates.map((date, index) => {
          const dayKey = format(date, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dayKey);
          const dayPositions = eventPositions.get(dayKey);
          const isCurrentDay = isToday(date);
          
          return (
            <div
              key={`grid-${date.toString()}`}
              className={`relative ${index < weekDates.length - 1 ? 'border-r' : ''} border-gray-200`}
              style={{
                gridColumn: `${index + 2}`,
                gridRow: '3',
                backgroundColor: isCurrentDay ? 'rgba(239, 246, 255, 0.3)' : 'transparent',
                minHeight: 24 * HOUR_HEIGHT
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hour = Math.floor(y / HOUR_HEIGHT);
                const minutes = Math.floor(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60);
                
                const clickTime = new Date(date);
                clickTime.setHours(hour, minutes, 0, 0);
                
                onDateClick?.(date, clickTime);
              }}
            >
              {/* Hour grid lines */}
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className={`absolute w-full border-t border-gray-100 ${i === workingHours.start || i === workingHours.end ? 'border-gray-200' : ''}`}
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}
              
              {/* Current time indicator for this day */}
              {isCurrentDay && showCurrentTime && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: currentTimePosition }}
                >
                  <div className="h-0.5 bg-red-500" />
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}
              
              {/* Timed events */}
              {dayEvents?.timed.map(event => {
                const position = calculateEventPosition(
                  event,
                  startOfDay(date),
                  HOUR_HEIGHT
                );
                const columnInfo = dayPositions?.get(event.id) || { column: 0, totalColumns: 1 };
                const width = `calc(${100 / columnInfo.totalColumns}% - 8px)`;
                const left = `calc(${(columnInfo.column * 100) / columnInfo.totalColumns}% + 4px)`;
                
                return (
                  <div
                    key={event.id}
                    className="absolute z-10"
                    style={{
                      top: position.top,
                      height: position.height,
                      left,
                      width,
                      minHeight: 20
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, e);
                    }}
                  >
                    <CalendarEventCard
                      event={event}
                      view="week"
                      showTime
                      timeText={formatEventTime(event.start, false)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
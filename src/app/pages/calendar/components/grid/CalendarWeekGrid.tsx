import React, { useMemo, useRef, useEffect } from 'react';
import { format, isToday, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { CalendarEvent, WeekViewColumn } from '../../types/calendar';
import { 
  generateTimeSlots, 
  calculateEventPosition, 
  calculateEventColumns,
  getCurrentTimePosition,
  HOUR_HEIGHT,
  formatEventTime,
  formatEventTimeRange,
  isMultiDayEvent,
  calculateMultiDayEventLayouts
} from '../../utils/dateUtils';
import { CalendarEventCard } from '../CalendarEventCard';
import { DroppableCalendarCell } from '../dnd/DroppableCalendarCell';
import { ResizableEvent } from '../dnd/ResizableEvent';

interface CalendarWeekGridProps {
  currentDate: Date;
  weekDates: Date[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent, e?: React.MouseEvent) => void;
  onDateClick?: (date: Date, time?: Date) => void;
  onEventDrop?: (event: CalendarEvent, date: Date, time?: Date) => void;
  onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => Promise<void>;
  workingHours?: { start: number; end: number };
}

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  currentDate,
  weekDates,
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
  workingHours = { start: 0, end: 24 }
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlots = useMemo(() => generateTimeSlots(0, 24, 30), []);
  
  // Separate and organize events
  const { singleDayAllDayEvents, multiDayLayouts, timedEventsByDay, maxAllDayRows } = useMemo(() => {
    const allDayEvents: CalendarEvent[] = [];
    const multiDayEvents: CalendarEvent[] = [];
    const timedEvents: CalendarEvent[] = [];
    
    // Get week boundaries for filtering
    const weekStart = startOfDay(weekDates[0]);
    const weekEnd = endOfDay(weekDates[weekDates.length - 1]);
    
    
    // Separate events by type - only process events in current week
    events.forEach(event => {
      const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
      const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
      
      
      // For single-day events, check if they fall within the week
      if (event.allDay && !isMultiDayEvent(eventStart, eventEnd)) {
        if (eventStart < weekStart || eventStart > weekEnd) {
          return; // Skip events outside current week
        }
      }
      
      if (event.allDay) {
        // Tasks should NEVER be multi-day events
        const isTask = event.extendedProps?.type === 'task';
        
        if (!isTask && isMultiDayEvent(eventStart, eventEnd)) {
          // Multi-day events need special handling - they may span across weeks
          multiDayEvents.push(event);
        } else {
          allDayEvents.push(event);
        }
      } else {
        // Timed events - only include if in current week
        if (eventStart >= weekStart && eventStart <= weekEnd) {
          timedEvents.push(event);
        }
      }
    });
    
    
    // Calculate multi-day event layouts
    const layouts = calculateMultiDayEventLayouts(multiDayEvents, weekDates);
    const maxRow = layouts.reduce((max, layout) => Math.max(max, layout.row), -1);
    
    // Group single-day all-day events by date
    const singleDayMap = new Map<string, CalendarEvent[]>();
    weekDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      singleDayMap.set(key, []);
    });
    
    allDayEvents.forEach(event => {
      // Ensure we're working with Date objects and handle timezone properly
      const eventDate = event.start instanceof Date ? event.start : new Date(event.start);
      const key = format(eventDate, 'yyyy-MM-dd');
      const dayEvents = singleDayMap.get(key);
      if (dayEvents) {
        dayEvents.push(event);
      }
    });
    
    // Group timed events by date
    const timedMap = new Map<string, CalendarEvent[]>();
    weekDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      timedMap.set(key, []);
    });
    
    timedEvents.forEach(event => {
      const key = format(event.start, 'yyyy-MM-dd');
      const dayEvents = timedMap.get(key);
      if (dayEvents) {
        dayEvents.push(event);
      }
    });
    
    
    return {
      singleDayAllDayEvents: singleDayMap,
      multiDayLayouts: layouts,
      timedEventsByDay: timedMap,
      maxAllDayRows: maxRow + 1
    };
  }, [events, weekDates]);
  
  // Calculate event positions for each day
  const eventPositions = useMemo(() => {
    const positions = new Map<string, Map<string, any>>();
    
    weekDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      const dayEvents = timedEventsByDay.get(key) || [];
      const dayPositions = calculateEventColumns(dayEvents);
      positions.set(key, dayPositions);
    });
    
    return positions;
  }, [weekDates, timedEventsByDay]);
  
  // Current time indicator position
  const currentTimePosition = getCurrentTimePosition(HOUR_HEIGHT);
  const showCurrentTime = weekDates.some(date => isToday(date));
  
  // Calculate total all-day section height
  const maxSingleDayEvents = Math.max(
    ...Array.from(singleDayAllDayEvents.values()).map(events => events.length),
    0
  );
  const allDayHeight = Math.max(
    80, // Minimum height
    (maxAllDayRows * 26) + ((maxSingleDayEvents + 1) * 26) + 20 // Multi-day rows + single-day rows + padding
  );
  
  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTo = 8 * HOUR_HEIGHT; // 8 AM
      scrollContainerRef.current.scrollTop = scrollTo - 50; // Offset a bit to show context
    }
  }, [weekDates[0]?.toISOString()]); // Re-scroll when week changes
  
  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-auto relative"
      style={{
        display: 'grid',
        gridTemplateColumns: `64px repeat(${weekDates.length}, minmax(0, 1fr))`,
        gridTemplateRows: `72px ${allDayHeight}px 1fr`
      }}
    >
      {/* Time header - sticky */}
      <div 
        className="sticky top-0 left-0 z-40 bg-white border-r border-b border-gray-200"
        style={{ gridColumn: '1', gridRow: '1' }}
      />
      
      {/* Date headers - sticky */}
      {weekDates.map((date, index) => (
        <div
          key={date.toString()}
          className={`sticky top-0 z-30 bg-white text-center ${index < weekDates.length - 1 ? 'border-r' : ''} border-b border-gray-200 p-2`}
          style={{ 
            gridColumn: `${index + 2}`, 
            gridRow: '1' 
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
      
      {/* All-day section - using same column approach as time grid */}
      {weekDates.map((date, dayIndex) => {
        const key = format(date, 'yyyy-MM-dd');
        const dayAllDayEvents = singleDayAllDayEvents.get(key) || [];
        const multiDayEventsInColumn = multiDayLayouts.filter(layout => 
          dayIndex >= layout.startCol && dayIndex <= layout.endCol
        );
        
        return (
          <div
            key={`allday-${date.toString()}`}
            className={`sticky z-30 bg-gray-50 border-b ${dayIndex < weekDates.length - 1 ? 'border-r' : ''} border-gray-200 relative`}
            style={{ 
              gridColumn: `${dayIndex + 2}`,
              gridRow: '2',
              height: `${allDayHeight}px`,
              top: '72px'
            }}
          >
            {/* Multi-day events for this column */}
            {multiDayEventsInColumn.map(layout => (
              <div
                key={layout.eventId}
                className="absolute"
                style={{
                  top: `${layout.row * 26 + 4}px`,
                  left: layout.startCol === dayIndex ? '8px' : '0px',
                  right: layout.endCol === dayIndex ? '8px' : '0px',
                  height: '24px'
                }}
              >
                <CalendarEventCard
                  event={layout.event}
                  view="week"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(layout.event, e);
                  }}
                  isAllDay
                  isMultiDay
                />
              </div>
            ))}
            
            {/* Single-day events */}
            <div className="absolute" style={{ top: `${maxAllDayRows * 26 + 8}px`, left: '8px', right: '8px' }}>
              {dayAllDayEvents.map((event, eventIndex) => (
                <div
                  key={event.id}
                  style={{ 
                    height: '24px',
                    marginBottom: '2px'
                  }}
                >
                  <CalendarEventCard
                    event={event}
                    view="week"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, e);
                    }}
                    isAllDay
                  />
                </div>
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
      
      {/* Day columns with timed events */}
      {weekDates.map((date, dayIndex) => {
        const dayKey = format(date, 'yyyy-MM-dd');
        const dayEvents = timedEventsByDay.get(dayKey) || [];
        const dayPositions = eventPositions.get(dayKey) || new Map();
        
        return (
          <div
            key={date.toString()}
            className={`relative ${dayIndex < weekDates.length - 1 ? 'border-r' : ''} border-gray-200`}
            style={{ 
              gridColumn: `${dayIndex + 2}`,
              gridRow: '3'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const hour = Math.floor(y / HOUR_HEIGHT);
              const minutes = Math.floor(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60);
              
              const clickedTime = new Date(date);
              clickedTime.setHours(hour, minutes, 0, 0);
              
              onDateClick?.(date, clickedTime);
            }}
          >
            {/* Hour grid lines and drop zones */}
            {timeSlots.map((slot, slotIndex) => {
              const slotTime = new Date(date);
              slotTime.setHours(slot.getHours(), slot.getMinutes(), 0, 0);
              
              return (
                <DroppableCalendarCell
                  key={`slot-${slotIndex}`}
                  date={date}
                  time={slotTime}
                  className="absolute w-full"
                  style={{ 
                    top: `${slotIndex * (HOUR_HEIGHT / 2)}px`,
                    height: `${HOUR_HEIGHT / 2}px`
                  }}
                >
                  {slotIndex % 2 === 0 && (
                    <div className="absolute top-0 w-full border-t border-gray-100" />
                  )}
                </DroppableCalendarCell>
              );
            })}
            
            {/* Events */}
            {dayEvents.map(event => {
              const position = calculateEventPosition(event, date, HOUR_HEIGHT);
              const columnInfo = dayPositions.get(event.id) || { column: 0, totalColumns: 1 };
              const width = `${100 / columnInfo.totalColumns}%`;
              const left = `${(columnInfo.column * 100) / columnInfo.totalColumns}%`;
              
              // Check extendedProperties first, then fall back to checking description metadata
              let isTimeBlock = event.extendedProperties?.private?.isTimeBlock === 'true' || 
                                 event.extendedProps?.private?.isTimeBlock === 'true';
              
              // If not found in extendedProperties, check description for metadata
              if (!isTimeBlock && event.description) {
                const metadataMatch = event.description.match(/---METADATA---\n(.+?)$/s);
                if (metadataMatch) {
                  try {
                    const metadata = JSON.parse(metadataMatch[1]);
                    isTimeBlock = metadata.isTimeBlock === true;
                  } catch (e) {
                    // Ignore JSON parse errors
                  }
                }
              }
              
              if (isTimeBlock && onEventResize) {
                return (
                  <ResizableEvent
                    key={event.id}
                    event={event}
                    onResize={onEventResize}
                    style={{
                      position: 'absolute',
                      top: `${position.top}px`,
                      height: `${position.height}px`,
                      left,
                      width,
                      minHeight: 20,
                      padding: '0 4px'
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
                      timeText={formatEventTimeRange(event.start, event.end)}
                    />
                  </ResizableEvent>
                );
              }
              
              return (
                <div
                  key={event.id}
                  className="absolute px-1"
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`,
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
                    timeText={formatEventTimeRange(event.start, event.end)}
                  />
                </div>
              );
            })}
            
            {/* Current time indicator */}
            {showCurrentTime && isToday(date) && (
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="absolute -left-2 -top-2 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
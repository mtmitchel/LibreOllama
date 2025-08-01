import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  differenceInDays,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  parseISO,
  isAfter,
  isBefore,
  addMinutes,
  getDay,
  getDaysInMonth,
  setDate
} from 'date-fns';

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day' | 'multiday' | 'agenda';

// Time slot configuration
export const HOUR_HEIGHT = 60; // pixels per hour
export const TIME_SLOT_DURATION = 30; // minutes
export const WORK_DAY_START = 8; // 8 AM
export const WORK_DAY_END = 18; // 6 PM

// Get visible date range for different views
export function getDateRange(date: Date, view: CalendarView, multiDayCount = 3): { start: Date; end: Date } {
  switch (view) {
    case 'month':
      return {
        start: startOfWeek(startOfMonth(date)),
        end: endOfWeek(endOfMonth(date))
      };
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date)
      };
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date)
      };
    case 'multiday':
      return {
        start: startOfDay(date),
        end: endOfDay(addDays(date, multiDayCount - 1))
      };
    case 'agenda':
      return {
        start: startOfDay(date),
        end: endOfDay(addDays(date, 30)) // 30 days forward
      };
    default:
      return { start: date, end: date };
  }
}

// Navigate calendar dates
export function navigateDate(date: Date, direction: 'prev' | 'next' | 'today', view: CalendarView): Date {
  if (direction === 'today') {
    return new Date();
  }

  const delta = direction === 'next' ? 1 : -1;
  
  switch (view) {
    case 'month':
      return addMonths(date, delta);
    case 'week':
    case 'multiday':
      return addWeeks(date, delta);
    case 'day':
      return addDays(date, delta);
    default:
      return date;
  }
}

// Generate time slots for day/week views
export function generateTimeSlots(start = 0, end = 24, interval = TIME_SLOT_DURATION): Date[] {
  const slots: Date[] = [];
  const baseDate = new Date();
  
  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      slots.push(setMinutes(setHours(baseDate, hour), minute));
    }
  }
  
  return slots;
}

// Get calendar grid dates for month view
export function getMonthGridDates(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  const days = differenceInDays(end, start) + 1;
  
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

// Calculate event position in time grid
export function calculateEventPosition(
  event: { start: Date; end: Date },
  dayStart: Date,
  slotHeight: number
): { top: number; height: number } {
  const startMinutes = differenceInMinutes(event.start, startOfDay(event.start));
  const duration = differenceInMinutes(event.end, event.start);
  
  const top = (startMinutes / 60) * slotHeight;
  const height = Math.max((duration / 60) * slotHeight, slotHeight / 2); // Min height of half slot
  
  return { top, height };
}

// Check if event spans multiple days
export function isMultiDayEvent(start: Date, end: Date): boolean {
  return !isSameDay(start, end);
}

// Get event duration in human-readable format
export function getEventDuration(start: Date, end: Date): string {
  const minutes = differenceInMinutes(end, start);
  
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) { // Less than a day
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    return days === 1 ? '1 day' : `${days} days`;
  }
}

// Format time for display
export function formatEventTime(date: Date, allDay: boolean): string {
  if (allDay) return 'All day';
  return format(date, 'h:mm a');
}

// Get week days for header
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Check if date falls within working hours
export function isWorkingHour(date: Date): boolean {
  const hour = getHours(date);
  return hour >= WORK_DAY_START && hour < WORK_DAY_END;
}

// Round time to nearest slot
export function roundToNearestSlot(date: Date, slotMinutes = TIME_SLOT_DURATION): Date {
  const minutes = getMinutes(date);
  const roundedMinutes = Math.round(minutes / slotMinutes) * slotMinutes;
  return setMinutes(date, roundedMinutes);
}

// Get overlapping events for layout calculation
export function getOverlappingEvents(
  events: Array<{ start: Date; end: Date; id: string }>,
  targetEvent: { start: Date; end: Date; id: string }
): typeof events {
  return events.filter(event => 
    event.id !== targetEvent.id &&
    isWithinInterval(event.start, { start: targetEvent.start, end: targetEvent.end }) ||
    isWithinInterval(event.end, { start: targetEvent.start, end: targetEvent.end }) ||
    (isBefore(event.start, targetEvent.start) && isAfter(event.end, targetEvent.end))
  );
}

// Calculate column positions for overlapping events
export function calculateEventColumns(
  events: Array<{ start: Date; end: Date; id: string }>
): Map<string, { column: number; totalColumns: number }> {
  const positions = new Map<string, { column: number; totalColumns: number }>();
  
  // Sort events by start time, then by duration (longer events first)
  const sortedEvents = [...events].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    return differenceInMinutes(b.end, b.start) - differenceInMinutes(a.end, a.start);
  });
  
  sortedEvents.forEach(event => {
    const overlapping = getOverlappingEvents(sortedEvents, event);
    const usedColumns = new Set<number>();
    
    overlapping.forEach(overlap => {
      const pos = positions.get(overlap.id);
      if (pos) usedColumns.add(pos.column);
    });
    
    // Find first available column
    let column = 0;
    while (usedColumns.has(column)) column++;
    
    const totalColumns = Math.max(column + 1, ...Array.from(usedColumns), 1);
    
    // Update all overlapping events with new total
    positions.set(event.id, { column, totalColumns });
    overlapping.forEach(overlap => {
      const pos = positions.get(overlap.id);
      if (pos) positions.set(overlap.id, { ...pos, totalColumns });
    });
  });
  
  return positions;
}

// Get current time position for time indicator
export function getCurrentTimePosition(slotHeight: number): number {
  const now = new Date();
  const minutesSinceMidnight = getHours(now) * 60 + getMinutes(now);
  return (minutesSinceMidnight / 60) * slotHeight;
}

// Parse various date formats
export function parseEventDate(dateInput: string | Date | { date?: string; dateTime?: string }): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  if (typeof dateInput === 'string') {
    return parseISO(dateInput);
  }
  
  if (typeof dateInput === 'object' && dateInput !== null) {
    if (dateInput.dateTime) {
      return parseISO(dateInput.dateTime);
    }
    if (dateInput.date) {
      return parseISO(dateInput.date);
    }
  }
  
  return new Date();
}

// Generate dates for agenda view
export function getAgendaDates(startDate: Date, days = 30): Map<string, Date[]> {
  const dateMap = new Map<string, Date[]>();
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const key = format(date, 'yyyy-MM-dd');
    dateMap.set(key, [date]);
  }
  
  return dateMap;
}
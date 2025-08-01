import { GoogleCalendarEvent, GoogleTask } from '../../../../types/google';

// Core calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  calendarId?: string;
  calendarName?: string;
  location?: string;
  attendees?: Array<{ email: string; name?: string; responseStatus?: string }>;
  creator?: { email: string; name?: string };
  conferenceLink?: string;
  recurrence?: string[];
  recurringEventId?: string;
  googleEventId?: string;
  type: 'event' | 'task' | 'multiday' | 'recurring_instance';
  source: 'google' | 'local';
  isReadOnly?: boolean;
  isCompleted?: boolean;
  taskData?: GoogleTask;
  extendedProps?: Record<string, any>;
}

export interface DraggedItem {
  type: 'event' | 'task';
  data: CalendarEvent | GoogleTask;
  sourceId?: string;
}

export interface CalendarViewport {
  start: Date;
  end: Date;
  view: CalendarView;
  visibleDays: Date[];
}

export type CalendarView = 'month' | 'week' | 'day' | 'multiday' | 'agenda';

export interface TimeSlot {
  date: Date;
  time: string;
  isWorkingHour: boolean;
  events: CalendarEvent[];
}

export interface CalendarGrid {
  dates: Date[];
  weeks: Date[][];
  timeSlots?: TimeSlot[];
}

export interface EventPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  column?: number;
  totalColumns?: number;
}

export interface CalendarContextMenu {
  x: number;
  y: number;
  event?: CalendarEvent;
  task?: GoogleTask;
  date?: Date;
  time?: Date;
}

// Drag and drop types
export interface DropTarget {
  date: Date;
  time?: Date;
  allDay: boolean;
  view: CalendarView;
}

export interface DragState {
  isDragging: boolean;
  draggedItem?: DraggedItem;
  dropTarget?: DropTarget;
  ghostPosition?: { x: number; y: number };
}

// Calendar operations
export interface CalendarOperations {
  createEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  moveEvent: (eventId: string, newStart: Date, newEnd: Date) => Promise<void>;
  createTaskFromDrop: (task: GoogleTask, dropTarget: DropTarget) => Promise<void>;
}

// Calendar state
export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedEvent?: CalendarEvent;
  selectedDate?: Date;
  isLoading: boolean;
  error?: string;
  showTaskSidebar: boolean;
  showEventModal: boolean;
  searchQuery: string;
  filters: CalendarFilters;
}

export interface CalendarFilters {
  calendars: string[];
  showCompleted: boolean;
  showTasks: boolean;
  showAllDay: boolean;
}

// Recurring event types
export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
}

export interface RecurringEventInstance extends CalendarEvent {
  originalStart: Date;
  originalEnd: Date;
  recurrenceId: string;
  isException: boolean;
}

// View-specific types
export interface MonthViewDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  dayNumber: number;
}

export interface WeekViewColumn {
  date: Date;
  isToday: boolean;
  allDayEvents: CalendarEvent[];
  timedEvents: CalendarEvent[];
}

export interface AgendaGroup {
  date: Date;
  events: CalendarEvent[];
  tasks: GoogleTask[];
}

// Event creation/editing
export interface EventFormData {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendarId: string;
  location?: string;
  attendees?: string[];
  recurrence?: RecurrenceRule;
  reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  color?: string;
}

// Calendar configuration
export interface CalendarConfig {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  workingHours: { start: number; end: number };
  timeSlotDuration: number; // in minutes
  defaultEventDuration: number; // in minutes
  maxEventsPerDay: number;
  showWeekNumbers: boolean;
  timeZone: string;
}

// Event interaction callbacks
export interface CalendarCallbacks {
  onEventClick?: (event: CalendarEvent) => void;
  onEventDoubleClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onDateClick?: (date: Date, allDay: boolean) => void;
  onDateDoubleClick?: (date: Date, allDay: boolean) => void;
  onSelectionChange?: (start: Date, end: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (date: Date) => void;
}

// Export all types
export type { GoogleCalendarEvent, GoogleTask };
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

// Calendar localizer
export const localizer = momentLocalizer(moment);

// View mapping from FullCalendar to React Big Calendar
export const viewMapping = {
  'dayGridMonth': 'month',
  'timeGridWeek': 'week', 
  'timeGridDay': 'day',
  'listWeek': 'agenda'
} as const;

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'work_week';

// Calendar configuration
export const calendarConfig = {
  views: ['month', 'week', 'day', 'agenda'] as CalendarView[],
  step: 30,
  showMultiDayTimes: true,
  min: new Date(0, 0, 0, 6, 0, 0), // 6 AM
  max: new Date(0, 0, 0, 22, 0, 0), // 10 PM
  dayLayoutAlgorithm: 'no-overlap' as const,
};

// Debug configuration
export const debugConfig = {
  enabled: false, // Set to true to enable debug logging
  logTaskCounts: true,
  logEventDetails: false,
};
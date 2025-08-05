import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../../types/google';

export interface CalendarEvent {
  id: string;
  title?: string;
  summary?: string;
  description?: string;
  start: any; // Date or string
  end: any; // Date or string
  allDay?: boolean;
  type?: 'event' | 'task';
  taskId?: string;
  calendarId?: string;
  calendarName?: string;
  location?: string;
  attendees?: any[];
  conferenceLink?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    type?: 'event' | 'task' | 'test';
    taskData?: GoogleTask;
    isCompleted?: boolean;
    isTrueMultiDay?: boolean;
    description?: string;
    [key: string]: any;
  };
}

export interface CalendarContextMenu {
  x: number;
  y: number;
  task: GoogleTask;
  listId: string;
}

export interface AsanaEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  onSave: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  calendars: any[];
  selectedDateInfo?: any;
}
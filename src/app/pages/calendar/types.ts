import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../../types/google';

export interface CalendarEvent extends GoogleCalendarEvent {
  type?: 'event' | 'task';
  taskId?: string;
  calendarId?: string;
  calendarName?: string;
  location?: string;
  attendees?: any[];
  conferenceLink?: string;
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
}
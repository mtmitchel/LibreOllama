// Google Calendar and Tasks API Types

export interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  created?: string;
  updated?: string;
  etag?: string;
  calendarId?: string;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
  etag: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
  parent?: string;
  position: string;
  updated: string;
  selfLink: string;
  etag: string;
  links?: Array<{
    type: string;
    description?: string;
    link: string;
  }>;
  // Extended properties for our app
  priority?: 'high' | 'medium' | 'low' | 'none';
  googleTaskListId?: string;
  timeBlock?: {
    startTime: string;
    endTime: string;
  };
  labels?: Array<{
    name: string;
    color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray';
  }>;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  due: string;
}

interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate: string;
}

export interface EnhancedGoogleTask extends GoogleTask {
  subtasks?: SubTask[];
  recurring?: RecurringConfig;
}

// Hierarchical task structure for UI display with enhanced properties
export interface HierarchicalTask extends EnhancedGoogleTask {
  children: HierarchicalTask[];
  depth: number;  // Nesting level for UI rendering
}

// Task creation data with support for parent relationship
export interface TaskCreateData {
  title: string;
  notes?: string;
  due?: string;
  parent?: string;
  position?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    due?: string;
  }>;
  labels?: string[];
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

export interface TaskMoveRequest {
  taskId: string;
  taskListId: string;
  parent?: string;
  previous?: string;
}

export interface CalendarEventCreateRequest {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
  }>;
  recurrence?: string[];
  calendarId?: string;
}

export interface ScheduleTaskModalData {
  taskId: string;
  taskTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

// UI-specific types
export interface TaskCardProps {
  task: HierarchicalTask;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDragStart?: (task: HierarchicalTask) => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

export interface CalendarViewType {
  type: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  title: string;
  buttonText: string;
}

export interface DragDropContext {
  activeTask: HierarchicalTask | null;
  draggedOver: Date | null;
  isDragging: boolean;
}

export interface KanbanColumn {
  taskList: GoogleTaskList;
  tasks: HierarchicalTask[];  // Changed to hierarchical tasks
  isLoading: boolean;
  error?: string;
}

export interface GoogleApiError {
  code: number;
  message: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: GoogleApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  etag?: string;
}


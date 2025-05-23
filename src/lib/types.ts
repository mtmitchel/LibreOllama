export interface Item {
  id: string;
  name: string;
  type: 'chat' | 'note' | 'whiteboard' | 'task' | 'chat_session'; // Added 'chat_session'
  content?: string;
  imageUrl?: string | null; // Made consistent with database type
  createdAt: string;
  updatedAt: string;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  tags?: string[]; // Added tags
  // For chat_session type specifically
  messages?: ChatMessage[];
  pinned?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  children: Folder[];
  items: Item[]; // Items can now conceptually include ChatSession stubs
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  imageUrl?: string;
  whiteboardSketch?: string;
  agentResponse?: any; // For agent test modal
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: string[]; // Added tags
}


// For Calendar View
export type CalendarViewMode = 'day' | 'week' | 'month'; // Simplified, can add 'year' | 'schedule' later if needed

export interface CalendarTask {
  id: string;
  title: string;
  duration: number; // in minutes
  description?: string;
  sourceListId?: string;
  isCompleted?: boolean; // Added for GTasks like panel
  dueDate?: Date; // Added for GTasks like panel
  tags?: string[]; // Added tags
}

export interface CalendarDisplayEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  taskId?: string;
  calendarId: string;
  color?: string;
  isAllDay?: boolean; // Added for all-day events
  description?: string;
  tags?: string[]; // Added tags
}

export interface AvailableCalendar {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  type?: 'primary' | 'secondary' | 'tasks'; // To distinguish types of calendars
}

// For Google Tasks Kanban View & GTasks-like panel
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  priority?: TaskPriority;
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean; // For consistency with CalendarTask
  tags?: string[]; // Added tags
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
}

// For Task List Selection Dropdown
export interface TaskListSource {
  id: string;
  name: string;
}

// For Agent Builder
export interface AgentTool {
  id: string;
  name: string;
  description?: string;
  // Future: inputSchema?: z.ZodTypeAny; outputSchema?: z.ZodTypeAny;
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  instructions: string;
  model: string; // e.g., 'gemini-pro', 'gpt-4'
  tools: string[]; // Array of tool IDs
  startingPrompts?: string[];
  tags?: string[];
  pinned?: boolean; // Added for pinning agents
  // knowledgeBase?: any; // Placeholder for RAG sources
  createdAt: string;
  updatedAt: string;
}

// For Dashboard Widgets
export interface DashboardWidgetConfig {
  id: string;
  name: string;
  component: React.FC<any>; // Allow passing props like widgetConfig
  isVisible: boolean;
  isFullWidth?: boolean;
  type: 'predefined' | 'custom';
  customType?: string; // e.g., 'text-note', 'image-display' for custom widgets
  content?: string; // For simple custom widget content
}

// For n8n Workflow Integration
export type N8nWorkflowStatus = 'active' | 'inactive' | 'error';

export interface N8nWorkflow {
  id: string;
  name: string;
  status: N8nWorkflowStatus;
  lastRun?: string; // ISO date string
  description?: string;
  triggerType?: string; // e.g., 'Webhook', 'Cron', 'Manual'
  tags?: string[]; // Added tags
}

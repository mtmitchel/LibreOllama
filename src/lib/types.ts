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
  isOptimistic?: boolean; // For immediate UI updates before API confirmation
  error?: string; // To store error message if sending failed
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: string[]; // Added tags
  contextId?: string;
  templateId?: string;
  systemMessage?: string;
}

// Advanced Phase 3.3 Types

export interface ConversationContext {
  id: string;
  sessionId: string;
  contextWindowSize: number;
  contextSummary?: string;
  tokenCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface ChatTemplate {
  id: string;
  name: string;
  description?: string;
  systemMessage?: string;
  initialPrompts?: string; // JSON array
  modelConfig?: string; // JSON config
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface PerformanceMetric {
  id: string;
  metricType: 'response_time' | 'token_generation_rate' | 'memory_usage' | 'cache_hit_rate' | 'model_load_time' | 'streaming_latency';
  metricValue: number;
  sessionId?: string;
  modelName?: string;
  timestamp: string;
  metadata?: string; // JSON
}

export interface ModelAnalytics {
  id: string;
  modelName: string;
  totalRequests: number;
  totalTokensGenerated: number;
  averageResponseTime: number;
  lastUsed?: string;
  performanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  preferenceKey: string;
  preferenceValue: string;
  preferenceType: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationLog {
  id: string;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  component?: string;
  sessionId?: string;
  errorCode?: string;
  stackTrace?: string;
  metadata?: string; // JSON
  timestamp: string;
}

export interface ChatExport {
  session: ChatSession;
  messages: ChatMessage[];
  context?: ConversationContext;
  exportTimestamp: string;
  exportVersion: string;
}

export interface SystemHealth {
  database: {
    activeSessions: number;
    totalMessages: number;
    activeAgents: number;
    totalExecutions: number;
    schemaVersion: number;
  };
  cache: {
    totalEntries: number;
  };
  timestamp: string;
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
export type EnergyLevel = 'high' | 'medium' | 'low';

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
  // ADHD-optimized properties
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number;
  isOverdue?: boolean;
  subtasks?: TaskItem[];
  parentId?: string;
  contextTags?: string[];
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

// Calendar-specific types for enhanced functionality
export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  isAvailable: boolean;
  hasEvent: boolean;
  events: ExtendedCalendarDisplayEvent[];
}

export interface FreeTimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
  energySuitability: EnergyLevel;
  confidence: number; // 0-1 for AI confidence
  reasons: string[];
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

// Google APIs Integration Types (Phase 5)
export interface GoogleIntegrationState {
  isConnected: boolean;
  authState: 'authenticated' | 'unauthenticated' | 'expired' | 'error';
  lastSync: string | null;
  syncStatus: 'syncing' | 'idle' | 'error';
  services: {
    calendar: {
      enabled: boolean;
      calendarsCount: number;
      lastEventSync: string | null;
    };
    tasks: {
      enabled: boolean;
      taskListsCount: number;
      lastTaskSync: string | null;
    };
    gmail: {
      enabled: boolean;
      unreadCount: number;
      lastEmailSync: string | null;
    };
  };
}

export interface GoogleCalendarIntegration {
  id: string;
  calendarId: string;
  name: string;
  isSelected: boolean;
  color: string;
  lastSync: string | null;
  eventsCount: number;
}

export interface GoogleTaskIntegration {
  id: string;
  taskListId: string;
  name: string;
  isSelected: boolean;
  lastSync: string | null;
  tasksCount: number;
  incompleteTasks: number;
}

export interface GoogleEmailInsight {
  totalEmails: number;
  unreadCount: number;
  todayReceived: number;
  averageResponseTime: number;
  mostActiveSender: string;
  productivityScore: number;
}

// Extended existing interfaces to support Google integration
export interface ExtendedCalendarDisplayEvent extends CalendarDisplayEvent {
  source?: 'google-calendar' | 'local' | 'other';
  googleEventId?: string;
  googleCalendarId?: string;
  attendeesCount?: number;
  hasConference?: boolean;
  isRecurring?: boolean;
}

export interface ExtendedTaskItem extends TaskItem {
  source?: 'google-tasks' | 'local' | 'other';
  googleTaskId?: string;
  googleTaskListId?: string;
  parentTaskId?: string;
  hasSubtasks?: boolean;
  links?: Array<{
    url: string;
    description: string;
    type: string;
  }>;
}

// Phase 3: Advanced Features Types

// Canvas/Whiteboard Types
export interface CanvasItem {
  id: string;
  type: 'note' | 'task' | 'chat-snippet' | 'sticky-note' | 'image' | 'connection';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  metadata?: {
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    sourceId?: string; // Reference to original note/task/chat
    zIndex?: number;
    // Additional metadata for flexible drag-drop operations
    sourceType?: string;
    timestamp?: string;
    author?: string;
    [key: string]: any; // Allow additional properties
  };
  connections?: string[]; // IDs of connected items
  createdAt: string;
  updatedAt: string;
}

export interface CanvasConnection {
  id: string;
  fromItemId: string;
  toItemId: string;
  type: 'arrow' | 'line' | 'curve';
  style?: {
    color?: string;
    width?: number;
    dashPattern?: number[];
  };
  label?: string;
}

export interface CanvasState {
  id: string;
  name: string;
  items: CanvasItem[];
  connections: CanvasConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  settings: {
    gridEnabled: boolean;
    snapToGrid: boolean;
    gridSize: number;
    backgroundColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

// AI Agent Builder Types
export interface AgentNode {
  id: string;
  type: 'input' | 'processing' | 'tool' | 'output' | 'condition' | 'loop';
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, any>;
    inputs?: Array<{ id: string; type: string; label: string }>;
    outputs?: Array<{ id: string; type: string; label: string }>;
  };
}

export interface AgentConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'smoothstep' | 'step';
}

export interface AgentFlow {
  id: string;
  name: string;
  description?: string;
  nodes: AgentNode[];
  connections: AgentConnection[];
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'research' | 'content' | 'automation' | 'analysis';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  flow: AgentFlow;
  tags: string[];
  usageCount: number;
  rating: number;
}

// Context Engine Types
export interface ContextRelationship {
  id: string;
  fromId: string;
  toId: string;
  fromType: 'note' | 'task' | 'chat' | 'agent';
  toType: 'note' | 'task' | 'chat' | 'agent';
  relationshipType: 'similar' | 'references' | 'depends-on' | 'related' | 'derived-from';
  strength: number; // 0-1 confidence score
  metadata?: {
    keywords?: string[];
    topics?: string[];
    lastAnalyzed?: string;
  };
  createdAt: string;
}

export interface ContextSuggestion {
  id: string;
  targetId: string;
  targetType: 'note' | 'task' | 'chat' | 'agent';
  suggestedId: string;
  suggestedType: 'note' | 'task' | 'chat' | 'agent';
  reason: string;
  confidence: number;
  actionType: 'link' | 'merge' | 'reference' | 'transform';
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'note' | 'task' | 'chat' | 'agent' | 'topic' | 'project';
  size: number; // Based on importance/connections
  color: string;
  metadata?: {
    createdAt?: string;
    lastModified?: string;
    tags?: string[];
    connectionCount?: number;
  };
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'references' | 'similar' | 'depends-on' | 'contains' | 'derived-from';
  weight: number;
  label?: string;
}

// Focus & Productivity Types
export interface FocusProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    uiSimplification: number; // 0-100
    notificationLevel: 'none' | 'minimal' | 'important' | 'all';
    colorScheme: 'default' | 'high-contrast' | 'minimal' | 'warm' | 'cool';
    fontSettings: {
      size: number;
      family: string;
      lineHeight: number;
    };
    layoutPreferences: {
      sidebarVisible: boolean;
      toolbarMinimal: boolean;
      focusHighlight: boolean;
    };
  };
  triggers?: {
    timeOfDay?: string[];
    energyLevel?: EnergyLevel[];
    taskType?: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductivityMetric {
  id: string;
  userId: string;
  date: string;
  metrics: {
    focusSessionCount: number;
    focusSessionDuration: number; // minutes
    tasksCompleted: number;
    notesCreated: number;
    chatInteractions: number;
    energyLevels: Array<{
      timestamp: string;
      level: EnergyLevel;
      context?: string;
    }>;
    distractionCount: number;
    flowStateMinutes: number;
  };
  insights?: {
    peakProductivityHours: string[];
    mostProductiveTaskTypes: string[];
    energyPatterns: string;
    recommendations: string[];
  };
}

export interface SmartNotification {
  id: string;
  type: 'reminder' | 'suggestion' | 'insight' | 'break' | 'energy-check';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  contextAware: boolean;
  timing: {
    scheduledFor?: string;
    energyLevelTrigger?: EnergyLevel;
    activityTrigger?: string;
  };
  actions?: Array<{
    id: string;
    label: string;
    action: string;
  }>;
  isRead: boolean;
  createdAt: string;
}

// Analytics Types
export interface AnalyticsTimeframe {
  start: string;
  end: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface ProductivityInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  actionable: boolean;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  createdAt: string;
}

// Onboarding System Types
export type OnboardingStep = 'welcome' | 'ollama-setup' | 'interactive-tour' | 'sample-data' | 'completion';

export type UserPersona = 'student' | 'professional' | 'creative' | 'researcher';

export interface OnboardingState {
  isActive: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  selectedPersona?: UserPersona;
  skipOptionalSteps: boolean;
  ollamaSetupStatus: 'not-started' | 'checking' | 'installing' | 'downloading-models' | 'completed' | 'error';
  selectedModels: string[];
  sampleDataCreated: boolean;
  tourProgress: {
    noteCreated: boolean;
    aiAsked: boolean;
    linkingDemonstrated: boolean;
    commandPaletteUsed: boolean;
  };
  startedAt: string;
  completedAt?: string;
}

export interface OnboardingProgress {
  step: OnboardingStep;
  title: string;
  description: string;
  isCompleted: boolean;
  isOptional: boolean;
  estimatedMinutes: number;
}

export interface PersonaConfig {
  id: UserPersona;
  title: string;
  description: string;
  icon: string;
  features: string[];
  sampleContent: {
    notes: Array<{ title: string; content: string; tags: string[] }>;
    tasks: Array<{ title: string; description: string; priority: TaskPriority }>;
    chatPrompts: string[];
  };
}

export interface OllamaModel {
  name: string;
  displayName: string;
  size: string;
  description: string;
  isRecommended: boolean;
  isSmall: boolean;
  downloadProgress?: number;
  isDownloaded?: boolean;
}

export interface OnboardingAnalytics {
  stepStartTime: Partial<Record<OnboardingStep, string>>;
  stepCompletionTime: Partial<Record<OnboardingStep, string>>;
  stepSkipped: Partial<Record<OnboardingStep, boolean>>;
  totalOnboardingTime?: number;
  dropOffStep?: OnboardingStep;
  personaSelected?: UserPersona;
  modelsSelected?: string[];
  sampleDataAccepted?: boolean;
  tourCompleted?: boolean;
}

// Enhanced Focus Mode Types
export interface FocusModeOptions {
  typewriterScrolling: boolean;
  sentenceHighlighting: boolean;
  pomodoroTimer: boolean;
  reducedMotion: boolean;
  densityMode: 'compact' | 'comfortable' | 'spacious';
}

export interface PomodoroState {
  isActive: boolean;
  timeRemaining: number; // in seconds
  currentSession: 'focus' | 'break';
  sessionCount: number;
}

export interface FocusModeState {
  isActive: boolean;
  options: FocusModeOptions;
  pomodoro: PomodoroState;
}

export interface TypewriterScrollOptions {
  enabled: boolean;
  centerOffset?: number;
  smoothness?: number;
  threshold?: number;
}

export interface SentenceHighlightOptions {
  enabled: boolean;
  highlightColor?: string;
  highlightOpacity?: number;
  updateDelay?: number;
  includeIncomplete?: boolean;
  minLength?: number;
}

export interface FocusUtilitiesOptions {
  typewriterScrolling?: boolean;
  sentenceHighlighting?: boolean;
  autoApply?: boolean;
}

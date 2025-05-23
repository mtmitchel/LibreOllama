import type { Folder, Item, CalendarTask, CalendarDisplayEvent, TaskItem, KanbanColumn, TaskStatus, AvailableCalendar, TaskListSource, CalendarViewMode, ChatSession, ChatMessage, AgentConfig, AgentTool, N8nWorkflow } from './types';

// Re-export types for external use
export type { Folder, Item } from './types';

// PROTOTYPE NOTE: Direct mutation of mock data arrays (e.g., mockAgents, mockChatSessions)
// is used in some components for rapid UI prototyping.
// In a real application, this would be handled by a proper state management solution
// (like Zustand, Redux, or React Context with more complex reducers) and/or backend API calls.

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36).slice(-4)}`;
const getCurrentTimestamp = () => new Date().toISOString();

// Helper to create dates for today, tomorrow, etc.
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);


export const mockChatMessages: ChatMessage[] = [
  { id: 'msg1', role: 'assistant', content: 'Hello! How can I assist you today with Ollama?', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'msg2', role: 'user', content: 'I need help debugging a Python script.', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: 'msg3', role: 'assistant', content: 'Sure, I can help with that. Can you please share the script and the error message you are encountering?', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
];

export let mockChatSessions: ChatSession[] = [
  {
    id: generateId('chatsession'),
    title: 'Python debugging help',
    messages: mockChatMessages,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    pinned: true,
    tags: ['python', 'debugging', 'ollama'],
  },
  {
    id: generateId('chatsession'),
    title: 'Next.js project ideas',
    messages: [
      { id: 'msg-prj1', role: 'user', content: 'Any cool ideas for a Next.js project?', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'msg-prj2', role: 'assistant', content: 'How about a personal dashboard with AI integrations?', timestamp: new Date(Date.now() - 19 * 60000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 19 * 60000).toISOString(),
    pinned: false,
    tags: ['nextjs', 'project-ideas', 'ai'],
  },
  {
    id: generateId('chatsession'),
    title: 'Recipe search',
    messages: [
       { id: 'msg-rcp1', role: 'user', content: 'Find me a good lasagna recipe.', timestamp: new Date(Date.now() - 50*60000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    pinned: false,
    tags: ['cooking', 'recipes'],
  }
];


export let mockItems: Item[] = [
  {
    id: mockChatSessions[0].id, // Link to a chat session
    name: mockChatSessions[0].title,
    type: 'chat_session',
    createdAt: mockChatSessions[0].createdAt,
    updatedAt: mockChatSessions[0].updatedAt,
    pinned: mockChatSessions[0].pinned,
    tags: mockChatSessions[0].tags,
  },
  {
    id: generateId('note'),
    name: 'Project ideas & notes',
    type: 'note',
    content: '1. Build a dashboard app.\n2. Integrate local LLMs.\nRefer to Chat: Python Debugging Help for some code snippets.',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['project-management', 'ideas', 'development'],
  },
  {
    id: generateId('whiteboard'),
    name: 'System architecture diagram',
    type: 'whiteboard',
    content: 'placeholder_for_whiteboard_data', // This would be actual whiteboard data
    imageUrl: "https://placehold.co/300x200.png?text=SysArch",
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['architecture', 'diagram', 'planning'],
  },
  {
    id: generateId('task'),
    name: 'Review PR #123',
    type: 'task',
    status: 'todo',
    description: 'Check the pull request for the new feature.',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['code-review', 'urgent'],
  },
    {
    id: mockChatSessions[1].id, // Another chat session
    name: mockChatSessions[1].title,
    type: 'chat_session',
    createdAt: mockChatSessions[1].createdAt,
    updatedAt: mockChatSessions[1].updatedAt,
    tags: mockChatSessions[1].tags,
  },
  {
    id: 'note-mock-id-with-image',
    name: 'Note with an image',
    type: 'note',
    content: 'This note has an image embedded!',
    imageUrl: "https://placehold.co/600x400.png?text=Mock+Note+Image",
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['multimedia', 'example'],
  },
];

export let mockFolders: Folder[] = [
  {
    id: generateId('folder'),
    name: 'Projects',
    children: [
      {
        id: generateId('folder'),
        name: 'Dashboard app',
        children: [],
        items: [mockItems[0], mockItems[2]], // Chat session and whiteboard
      },
    ],
    items: [mockItems[3]], // Task
  },
  {
    id: generateId('folder'),
    name: 'General',
    children: [],
    items: [mockItems[1], mockItems[4], mockItems[5]], // Note, chat session, and image note
  },
  {
    id: generateId('folder'),
    name: 'Archived',
    children: [],
    items: [],
  }
];

// Mock data for Calendar View
export const mockTaskListSources: TaskListSource[] = [
  { id: 'google_tasks_main', name: 'Google Tasks - Main' },
  { id: 'project_alpha_tasks', name: 'Project Alpha tasks' },
  { id: 'personal_reminders', name: 'Personal reminders' },
];

export let mockCalendarTasks: CalendarTask[] = [
  { id: 'caltask-1', title: 'Team meeting (recurring)', duration: 60, description: "Weekly sync-up.", sourceListId: 'google_tasks_main', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0), tags: ['meeting', 'work'] },
  { id: 'caltask-2', title: 'Client call - Project Alpha', duration: 90, description: "Discuss project milestones.", sourceListId: 'project_alpha_tasks', dueDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0, 0), tags: ['client', 'project-alpha'] },
  { id: 'caltask-3', title: 'Focus work: API design', duration: 120, description: "Dedicated time for API design.", sourceListId: 'project_alpha_tasks', isCompleted: true, tags: ['development', 'focus'] },
  { id: 'caltask-4', title: 'Grocery shopping', duration: 45, sourceListId: 'personal_reminders', tags: ['personal', 'errands'] },
  { id: 'caltask-5', title: 'Book doctor appointment', duration: 15, sourceListId: 'personal_reminders', dueDate: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 11, 0, 0), tags: ['health', 'personal']},
  { id: 'caltask-6', title: 'Submit expense report', duration: 30, sourceListId: 'google_tasks_main', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), tags: ['admin', 'finance']},
  { id: 'caltask-7', title: 'Prepare presentation slides', duration: 180, description: "For quarterly review.", sourceListId: 'project_alpha_tasks', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), tags: ['presentation', 'review'] },
];

export let mockAvailableCalendars: AvailableCalendar[] = [
  { id: 'personal_cal', name: 'Personal', color: 'hsl(var(--primary))', isSelected: true, type: 'primary' },
  { id: 'work_cal', name: 'Work', color: 'hsl(var(--destructive))', isSelected: true, type: 'primary' },
  { id: 'team_cal', name: 'Team holidays', color: 'hsl(120, 60%, 55%)', isSelected: true, type: 'secondary' },
  { id: 'birthdays_cal', name: 'Birthdays', color: 'hsl(40, 80%, 60%)', isSelected: true, type: 'secondary' },
  { id: 'tasks_cal', name: 'Tasks', color: 'hsl(200,70%,50%)', isSelected:true, type: 'tasks'}
];

const createEvent = (id: string, title: string, calendarId: string, start: Date, end: Date, isAllDay?: boolean, description?: string, tags?: string[]): CalendarDisplayEvent => ({
  id,
  title,
  calendarId,
  start,
  end,
  color: mockAvailableCalendars.find(c => c.id === calendarId)?.color,
  isAllDay,
  description,
  tags,
});

export let mockCalendarEvents: CalendarDisplayEvent[] = [
  createEvent('ev1', 'Morning standup', 'work_cal', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0), new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0), false, undefined, ['work', 'standup']),
  createEvent('ev2', 'Project Alpha sync', 'work_cal', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0), new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0), false, 'Sync on current blockers and progress.', ['project-alpha', 'meeting']),
  createEvent('ev3', 'Lunch with team', 'personal_cal', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30, 0), new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30, 0), false, undefined, ['social', 'team']),
  createEvent('ev4', 'Gym session', 'personal_cal', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0), new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0, 0), false, undefined, ['health', 'fitness']),

  createEvent('ev5', 'Client workshop prep', 'work_cal', new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0, 0), new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0, 0), false, undefined, ['client', 'preparation']),
  createEvent('ev6', 'Dentist appointment', 'personal_cal', new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0, 0), new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0, 0), false, undefined, ['health', 'appointment']),

  createEvent('ev7', 'Team building event', 'team_cal', new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 14, 0, 0), new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 17, 0, 0), false, undefined, ['team', 'social']),

  createEvent('ev8', "Sarah's birthday", 'birthdays_cal', new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), true, undefined, ['birthday']),
  createEvent('ev9', 'Public holiday', 'team_cal', new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth(), 1), true, undefined, ['holiday']), 

  createEvent('ev10', 'Design review', 'work_cal', new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16,0,0), new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17,30,0), false, undefined, ['design', 'review']),

  // Multi-day event
  createEvent('ev11', 'Vacation', 'personal_cal',
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
    true, 'Away on vacation', ['personal', 'travel']),

  // Task derived event example (if tasks are shown on calendar)
  createEvent('taskev1', 'Submit expense report', 'tasks_cal',
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 9,0,0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 9,30,0),
    false, 'Due EOD', ['finance', 'work']),
];


// Mock data for Tasks Kanban View
export let mockTaskItems: TaskItem[] = [
  {
    id: 'taskitem-1',
    title: 'Design new landing page',
    description: 'Create mockups and wireframes for the new landing page design.',
    status: 'todo',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    priority: 'high',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['design', 'ux', 'website'],
  },
  {
    id: 'taskitem-2',
    title: 'Develop authentication module',
    description: 'Implement user login and registration functionality.',
    status: 'inprogress',
    priority: 'high',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['development', 'security', 'backend'],
  },
  {
    id: 'taskitem-3',
    title: 'Write API documentation',
    status: 'todo',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    priority: 'medium',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['documentation', 'api'],
  },
  {
    id: 'taskitem-4',
    title: 'Test payment gateway integration',
    status: 'done',
    priority: 'medium',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    isCompleted: true,
    tags: ['testing', 'payment', 'qa'],
  },
   {
    id: 'taskitem-5',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated build and deployment.',
    status: 'inprogress',
    priority: 'low',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['devops', 'ci-cd'],
  },
  {
    id: 'taskitem-6',
    title: 'User feedback session',
    description: 'Gather feedback from beta users.',
    status: 'todo',
    priority: 'medium',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['ux', 'feedback', 'research'],
  }
];

export let mockKanbanColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To do',
    tasks: mockTaskItems.filter(task => task.status === 'todo')
  },
  {
    id: 'inprogress',
    title: 'In progress',
    tasks: mockTaskItems.filter(task => task.status === 'inprogress')
  },
  {
    id: 'done',
    title: 'Done',
    tasks: mockTaskItems.filter(task => task.status === 'done')
  },
];

// Agent Builder Mock Data
export const mockAgentTools: AgentTool[] = [
  { id: 'tool-web-search', name: 'Web search', description: 'Access real-time information from the web.' },
  { id: 'tool-calculator', name: 'Calculator', description: 'Perform mathematical calculations.' },
  { id: 'tool-file-access', name: 'File system access', description: 'Read and write files from a local directory.' },
  { id: 'tool-calendar', name: 'Calendar integration', description: 'Read and manage calendar events.' },
  { id: 'tool-email', name: 'Email sender', description: 'Send emails on behalf of the user.' },
];

// IMPORTANT: For prototyping, we make mockAgents mutable.
// In a real app, this would be managed by a state management solution or backend.
export let mockAgents: AgentConfig[] = [
  {
    id: 'agent-1',
    name: 'Research assistant',
    description: 'Helps gather and summarize information from the web.',
    avatarUrl: 'https://placehold.co/100x100.png?text=RA',
    instructions: 'You are a helpful research assistant. When asked a question, use the Web Search tool to find relevant articles, then summarize them concisely.',
    model: 'ollama/qwen3:8b',
    tools: ['tool-web-search'],
    startingPrompts: ['Summarize the latest news on AI.', 'What are the key benefits of renewable energy?'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: getCurrentTimestamp(),
    tags: ['research', 'web', 'ai'],
    pinned: true, // Pinned by default
  },
  {
    id: 'agent-2',
    name: 'Math whiz',
    description: 'Solves mathematical problems.',
    avatarUrl: 'https://placehold.co/100x100.png?text=MW',
    instructions: 'You are a math expert. Use the Calculator tool for any calculations. Explain your steps clearly.',
    model: 'ollama/mistral:7b',
    tools: ['tool-calculator'],
    startingPrompts: ['What is 25 * 17?', 'Calculate the area of a circle with radius 5.'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: getCurrentTimestamp(),
    tags: ['math', 'calculator', 'education'],
    pinned: false,
  },
  {
    id: 'agent-3',
    name: 'Calendar coordinator',
    description: 'Manages your schedule and appointments.',
    avatarUrl: 'https://placehold.co/100x100.png?text=CC',
    instructions: 'You are a personal assistant for calendar management. Use the Calendar Integration tool to check availability, create, and modify events.',
    model: 'ollama/llama3',
    tools: ['tool-calendar', 'tool-email'],
    startingPrompts: ['Do I have any meetings tomorrow morning?', 'Schedule a meeting with Bob for next Tuesday at 2 PM about the project update.'],
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    tags: ['calendar', 'scheduling', 'assistant'],
    pinned: false,
  },
];

// n8n Mock Data
export const mockN8nWorkflows: N8nWorkflow[] = [
  {
    id: 'n8n-wf-1',
    name: 'Daily news aggregator',
    status: 'active',
    lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    description: 'Fetches news from various sources and sends a summary email.',
    triggerType: 'Cron',
    tags: ['news', 'automation', 'email'],
  },
  {
    id: 'n8n-wf-2',
    name: 'Social media poster',
    status: 'inactive',
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    description: 'Automatically posts updates to social media platforms.',
    triggerType: 'Manual',
    tags: ['social-media', 'marketing'],
  },
  {
    id: 'n8n-wf-3',
    name: 'Customer support ticket router',
    status: 'active',
    lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    description: 'Routes incoming support tickets to the appropriate team.',
    triggerType: 'Webhook',
    tags: ['support', 'automation', 'tickets'],
  },
  {
    id: 'n8n-wf-4',
    name: 'E-commerce order processing',
    status: 'error',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    description: 'Processes new orders from an e-commerce platform.',
    triggerType: 'Webhook',
    tags: ['ecommerce', 'orders', 'automation'],
  },
];

import { vi } from 'vitest';
import React from 'react';

// Create a proper Vitest mock function with default implementation
const mockInvoke = vi.hoisted(() => {
  return vi.fn().mockImplementation((command: string, args: any): Promise<any> => {
    console.log(`[Mock] Invoking command: ${command}`, args);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          switch (command) {
            case 'get_task_lists':
              resolve([]);
              break;
              
            case 'get_tasks':
              resolve({ items: [] });
              break;
              
            case 'create_task':
              const newTask = {
                id: `task-${Date.now()}`,
                title: args.taskData.title,
                notes: args.taskData.notes,
                status: 'needsAction',
                due: args.taskData.due,
                parent: args.taskData.parent,
                position: args.taskData.position || '1',
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${Date.now()}`,
                etag: `etag-${Date.now()}`,
              };
              resolve(newTask);
              break;
              
            case 'update_task':
              const updatedTask = {
                id: args.taskId,
                title: args.taskData.title || 'Updated Task',
                notes: args.taskData.notes || 'Updated notes',
                status: args.taskData.status || 'needsAction',
                due: args.taskData.due,
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${args.taskId}`,
                etag: `etag-${args.taskId}`,
                completed: args.taskData.completed || (args.taskData.status === 'completed' ? new Date().toISOString() : undefined),
              };
              resolve(updatedTask);
              break;
              
            case 'move_task':
              const movedTask = {
                id: args.taskId,
                title: 'Moved Task',
                notes: 'Moved notes',
                status: 'needsAction',
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${args.taskId}`,
                etag: `etag-${args.taskId}`,
                position: args.options?.previous || '1',
                parent: args.options?.parent,
              };
              resolve(movedTask);
              break;
              
            case 'delete_task':
              resolve(undefined);
              break;
              
            // ✅ ADD CHAT SYSTEM COMMANDS
            case 'get_sessions':
              resolve([
                {
                  id: `session-${Date.now()}`,
                  title: 'Default Chat Session',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  message_count: 0
                }
              ]);
              break;
              
            case 'create_session':
              resolve(`session-${Date.now()}`);
              break;
              
            case 'send_message':
              resolve({
                id: `message-${Date.now()}`,
                session_id: args.sessionIdStr || 'default-session',
                content: args.content || 'Default message',
                role: 'user',
                timestamp: new Date().toISOString()
              });
              break;
              
            case 'get_session_messages':
              resolve([]);
              break;
              
            case 'delete_session':
              resolve(undefined);
              break;
              
            default:
              reject(new Error(`Unknown command: ${command}`));
          }
        } catch (error) {
          reject(error);
        }
      }, 100); // Fast response for tests
    });
  });
});

// Use vi.hoisted for shared mock variables to prevent circular dependencies
const mocks = vi.hoisted(() => ({
  invoke: mockInvoke,
  listen: vi.fn(),
  transformCallback: vi.fn(),
  mockIPC: vi.fn(),
  clearMocks: vi.fn(),
}));

// Export the mockInvoke function for test access
export { mockInvoke };

// Mock the mockGoogleService to return our hoisted mockInvoke
vi.mock('src/services/google/mockGoogleService', () => ({
  mockInvoke: mockInvoke,
  getMockAccount: () => ({
    id: 'mock-account-1',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000,
  }),
}));

// Mock Tauri API with proper IPC patterns
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// Mock Tauri IPC mocks for proper testing
vi.mock('@tauri-apps/api/mocks', () => ({
  mockIPC: mocks.mockIPC,
  clearMocks: mocks.clearMocks,
}));

// Mock Tauri event API
vi.mock('@tauri-apps/api/event', () => ({
  listen: mocks.listen,
  emit: vi.fn(),
}));

// Mock DnD Kit with React.createElement instead of JSX
vi.mock('@dnd-kit/core', () => ({
  DndContext: vi.fn().mockImplementation(({ children }) => 
    React.createElement('div', { 'data-testid': 'dnd-context' }, children)
  ),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  })),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
    active: null,
  })),
  DragOverlay: vi.fn().mockImplementation(({ children }) => 
    React.createElement('div', { 'data-testid': 'drag-overlay' }, children)
  ),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: vi.fn().mockImplementation(({ children }) => 
    React.createElement('div', { 'data-testid': 'sortable-context' }, children)
  ),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  arrayMove: vi.fn((array, from, to) => {
    const newArray = [...array];
    newArray.splice(to, 0, newArray.splice(from, 1)[0]);
    return newArray;
  }),
}));

// Mock React Testing Library with proper async utilities
vi.mock('@testing-library/react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    act: vi.fn().mockImplementation(actual.act),
    waitFor: vi.fn().mockImplementation(actual.waitFor),
    findByText: vi.fn().mockImplementation(actual.findByText),
    findByTestId: vi.fn().mockImplementation(actual.findByTestId),
  };
});

// Mock Web Worker API with proper message handling
global.Worker = vi.fn().mockImplementation(() => {
  const worker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onmessage: null,
    onerror: null,
  };
  
  // Simulate worker behavior
  setTimeout(() => {
    if (worker.onmessage) {
      worker.onmessage({ data: { type: 'sync-started' } } as MessageEvent);
      setTimeout(() => {
        if (worker.onmessage) {
          worker.onmessage({ data: { type: 'sync-finished' } } as MessageEvent);
        }
      }, 100);
    }
  }, 50);
  
  return worker;
});

// Set up proper before/after hooks
beforeEach(() => {
  vi.clearAllMocks();
  // Reset the mock to its default implementation
  mockInvoke.mockReset();
  mockInvoke.mockImplementation((command: string, args: any): Promise<any> => {
    console.log(`[Mock] Invoking command: ${command}`, args);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          switch (command) {
            case 'get_task_lists':
              resolve([]);
              break;
              
            case 'get_tasks':
              resolve({ items: [] });
              break;
              
            case 'create_task':
              const newTask = {
                id: `task-${Date.now()}`,
                title: args.taskData.title,
                notes: args.taskData.notes,
                status: 'needsAction',
                due: args.taskData.due,
                parent: args.taskData.parent,
                position: args.taskData.position || '1',
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${Date.now()}`,
                etag: `etag-${Date.now()}`,
              };
              resolve(newTask);
              break;
              
            case 'update_task':
              const updatedTask = {
                id: args.taskId,
                title: args.taskData.title || 'Updated Task',
                notes: args.taskData.notes || 'Updated notes',
                status: args.taskData.status || 'needsAction',
                due: args.taskData.due,
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${args.taskId}`,
                etag: `etag-${args.taskId}`,
                completed: args.taskData.completed || (args.taskData.status === 'completed' ? new Date().toISOString() : undefined),
              };
              resolve(updatedTask);
              break;
              
            case 'move_task':
              const movedTask = {
                id: args.taskId,
                title: 'Moved Task',
                notes: 'Moved notes',
                status: 'needsAction',
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${args.taskId}`,
                etag: `etag-${args.taskId}`,
                position: args.options?.previous || '1',
                parent: args.options?.parent,
              };
              resolve(movedTask);
              break;
              
            case 'delete_task':
              resolve(undefined);
              break;
              
            // ✅ ADD CHAT SYSTEM COMMANDS
            case 'get_sessions':
              resolve([
                {
                  id: `session-${Date.now()}`,
                  title: 'Default Chat Session',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  message_count: 0
                }
              ]);
              break;
              
            case 'create_session':
              resolve(`session-${Date.now()}`);
              break;
              
            case 'send_message':
              resolve({
                id: `message-${Date.now()}`,
                session_id: args.sessionIdStr || 'default-session',
                content: args.content || 'Default message',
                role: 'user',
                timestamp: new Date().toISOString()
              });
              break;
              
            case 'get_session_messages':
              resolve([]);
              break;
              
            case 'delete_session':
              resolve(undefined);
              break;
              
            default:
              reject(new Error(`Unknown command: ${command}`));
          }
        } catch (error) {
          reject(error);
        }
      }, 100); // Fast response for tests
    });
  });
});

import { GoogleAccount, GoogleTask, GoogleTaskList, GoogleCalendarEvent } from '../../types/google';

// Task operation queue to prevent race conditions
const taskOperationQueue = new Map<string, Promise<any>>();

// Mock data for testing
const mockAccount: GoogleAccount = {
  id: 'mock-account-1',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000, // 1 hour from now
};

const mockTaskLists: GoogleTaskList[] = [
  {
    id: 'list-1',
    title: 'My Tasks',
    updated: new Date().toISOString(),
    selfLink: 'https://example.com/list-1',
    etag: 'etag-1',
  },
  {
    id: 'list-2',
    title: 'Work Projects',
    updated: new Date().toISOString(),
    selfLink: 'https://example.com/list-2',
    etag: 'etag-2',
  },
  {
    id: 'list-3',
    title: 'Personal',
    updated: new Date().toISOString(),
    selfLink: 'https://example.com/list-3',
    etag: 'etag-3',
  },
];

const mockTasks: Record<string, GoogleTask[]> = {
  'list-1': [
    {
      id: 'task-1',
      title: 'Complete project proposal',
      notes: 'Need to finish the technical specifications for LibreOllama project\n__METADATA__{"labels":["urgent","work","project"],"priority":"high","subtasks":[{"id":"st1","title":"Research requirements","completed":true},{"id":"st2","title":"Write technical specs","completed":false},{"id":"st3","title":"Budget breakdown","completed":false}],"recurring":{"enabled":false,"frequency":"weekly","interval":1}}__END_METADATA__',
      status: 'needsAction',
      due: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      position: '1',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-1',
      etag: 'etag-task-1',
    },
    {
      id: 'task-1-sub-1',
      title: 'Draft technical specifications',
      notes: 'First subtask for the project proposal\n__METADATA__{"labels":["writing","documentation"],"priority":"normal","subtasks":[],"recurring":{"enabled":false,"frequency":"daily","interval":1}}__END_METADATA__',
      status: 'needsAction',
      parent: 'task-1',
      position: '1',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-1-sub-1',
      etag: 'etag-task-1-sub-1',
    },
    {
      id: 'task-1-sub-2',
      title: 'Review with team',
      notes: 'Second subtask - get team feedback\n__METADATA__{"labels":["review","teamwork","meeting"],"priority":"normal","subtasks":[{"id":"sub1","title":"Schedule meeting","completed":true},{"id":"sub2","title":"Prepare agenda","completed":false}],"recurring":{"enabled":false,"frequency":"weekly","interval":1}}__END_METADATA__',
      status: 'completed',
      parent: 'task-1',
      position: '2',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-1-sub-2',
      etag: 'etag-task-1-sub-2',
    },
    {
      id: 'task-2',
      title: 'Weekly team standup',
      notes: 'Regular weekly team sync meeting\n__METADATA__{"labels":["meeting","recurring","team"],"priority":"normal","subtasks":[],"recurring":{"enabled":true,"frequency":"weekly","interval":1,"endDate":"2024-12-31"}}__END_METADATA__',
      status: 'needsAction',
      due: new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
      position: '2',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-2',
      etag: 'etag-task-2',
    },
  ],
  'list-2': [
    {
      id: 'task-3',
      title: 'Client presentation prep',
      notes: 'Prepare slides and demo for client meeting\n__METADATA__{"labels":["client","presentation","important","urgent"],"priority":"urgent","subtasks":[{"id":"pres1","title":"Create slide deck","completed":false},{"id":"pres2","title":"Prepare demo","completed":false},{"id":"pres3","title":"Practice presentation","completed":false}],"recurring":{"enabled":false,"frequency":"monthly","interval":1}}__END_METADATA__',
      status: 'needsAction',
      due: new Date(Date.now() + 3 * 86400000).toISOString(),
      position: '1',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-3',
      etag: 'etag-task-3',
    },
    {
      id: 'task-4',
      title: 'Update documentation',
      notes: 'Monthly documentation update\n__METADATA__{"labels":["documentation","maintenance","writing"],"priority":"low","subtasks":[{"id":"doc1","title":"Update API docs","completed":true},{"id":"doc2","title":"Review user guide","completed":false}],"recurring":{"enabled":true,"frequency":"monthly","interval":1}}__END_METADATA__',
      status: 'completed',
      completed: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      position: '2',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-4',
      etag: 'etag-task-4',
    },
  ],
  'list-3': [
    {
      id: 'task-5',
      title: 'Grocery shopping',
      notes: 'Weekly grocery shopping trip\n__METADATA__{"labels":["personal","shopping","weekly"],"priority":"normal","subtasks":[{"id":"shop1","title":"Milk","completed":false},{"id":"shop2","title":"Bread","completed":false},{"id":"shop3","title":"Eggs","completed":true},{"id":"shop4","title":"Vegetables","completed":false}],"recurring":{"enabled":true,"frequency":"weekly","interval":1}}__END_METADATA__',
      status: 'needsAction',
      position: '1',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-5',
      etag: 'etag-task-5',
    },
    {
      id: 'task-6',
      title: 'Daily exercise',
      notes: 'Morning workout routine\n__METADATA__{"labels":["health","fitness","daily","personal"],"priority":"high","subtasks":[{"id":"ex1","title":"30min cardio","completed":true},{"id":"ex2","title":"Strength training","completed":false},{"id":"ex3","title":"Stretching","completed":false}],"recurring":{"enabled":true,"frequency":"daily","interval":1}}__END_METADATA__',
      status: 'needsAction',
      position: '2',
      updated: new Date().toISOString(),
      selfLink: 'https://example.com/task-6',
      etag: 'etag-task-6',
    },
  ],
};

const mockCalendarEvents: GoogleCalendarEvent[] = [
  {
    id: 'event-1',
    summary: 'Team Stand-up',
    description: 'Daily team synchronization',
    start: {
      dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      timeZone: 'UTC',
    },
    status: 'confirmed',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    etag: 'etag-event-1',
  },
  {
    id: 'event-2',
    summary: 'Project Review',
    description: 'Monthly project review meeting',
    start: {
      dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
      timeZone: 'UTC',
    },
    status: 'confirmed',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    etag: 'etag-event-2',
  },
];

// Queue task operations to prevent race conditions
const queueTaskOperation = async <T>(taskId: string, operationType: string, operation: () => Promise<T>): Promise<T> => {
  console.log(`[Mock] Queuing ${operationType} operation for task ${taskId}`);
  
  // Wait for any existing operation on this task to complete
  const existingOperation = taskOperationQueue.get(taskId);
  if (existingOperation) {
    console.log(`[Mock] Waiting for existing operation on task ${taskId} to complete...`);
    try {
      await existingOperation;
    } catch (error) {
      // Ignore errors from previous operations
      console.log(`[Mock] Previous operation for task ${taskId} failed, continuing...`);
    }
  }

  // Create and queue the new operation with proper error handling
  const newOperation = (async () => {
    try {
      console.log(`[Mock] Starting ${operationType} operation for task ${taskId}`);
      const result = await operation();
      console.log(`[Mock] Completed ${operationType} operation for task ${taskId}`);
      return result;
    } catch (error) {
      console.error(`[Mock] Failed ${operationType} operation for task ${taskId}:`, error);
      throw error;
    }
  })();
  
  taskOperationQueue.set(taskId, newOperation);

  try {
    const result = await newOperation;
    return result;
  } finally {
    // Clean up completed operation
    if (taskOperationQueue.get(taskId) === newOperation) {
      taskOperationQueue.delete(taskId);
      console.log(`[Mock] Cleaned up ${operationType} operation for task ${taskId}`);
    }
  }
};

// Mock the Tauri invoke function for development
export const mockInvoke = (command: string, args: any): Promise<any> => {
  console.log(`[Mock] Invoking command: ${command}`, args);
  
  return new Promise((resolve, reject) => {
    // Reduced delay for better performance (was random 200-1200ms, now 100-300ms)
    setTimeout(() => {
      try {
                 switch (command) {
           case 'get_task_lists':
             resolve(mockTaskLists);
             break;
            
          case 'get_tasks':
            const taskListId = args.taskListId;
            const tasks = mockTasks[taskListId] || [];
            resolve({ items: tasks });
            break;
            
          case 'create_task':
            const newTask: GoogleTask = {
              id: `task-${Date.now()}`,
              title: args.taskData.title,
              notes: args.taskData.notes,
              status: 'needsAction',
              due: args.taskData.due, // Already in ISO format from the frontend
              parent: args.taskData.parent, // Support parent field
              position: args.taskData.position || '1',
              updated: new Date().toISOString(),
              selfLink: `https://example.com/task-${Date.now()}`,
              etag: `etag-${Date.now()}`,
            };
            
            // Add to mock data
            if (!mockTasks[args.taskListId]) {
              mockTasks[args.taskListId] = [];
            }
            mockTasks[args.taskListId].push(newTask);
            
            resolve(newTask);
            break;
            
          case 'update_task':
            // Queue update operations to prevent race conditions
            queueTaskOperation(args.taskId, 'update', async () => {
              const listId = args.taskListId;
              const taskId = args.taskId;
              
              console.log(`[Mock] 🔄 Updating task ${taskId} in list ${listId} with data:`, args.taskData);
              
              // Search all lists for the task (in case it was moved)
              let foundTask = null;
              let foundListId = null;
              
              for (const currentListId in mockTasks) {
                const taskList = mockTasks[currentListId];
                const taskIndex = taskList.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                  foundTask = taskList[taskIndex];
                  foundListId = currentListId;
                  
                  const updatedTask = { 
                    ...foundTask, 
                    ...args.taskData, 
                    updated: new Date().toISOString() 
                  };
                  taskList[taskIndex] = updatedTask;
                  
                  console.log(`[Mock] ✅ Task updated successfully in list ${currentListId}`);
                  console.log(`[Mock] Updated fields:`, {
                    title: foundTask.title !== updatedTask.title ? `"${foundTask.title}" -> "${updatedTask.title}"` : 'unchanged',
                    due: foundTask.due !== updatedTask.due ? `"${foundTask.due}" -> "${updatedTask.due}"` : 'unchanged',
                    notes: foundTask.notes !== updatedTask.notes ? `"${foundTask.notes}" -> "${updatedTask.notes}"` : 'unchanged'
                  });
                  return updatedTask;
                }
              }
              
              console.log(`[Mock] ❌ Task ${taskId} not found in any list`);
              throw new Error('Task not found');
            })
            .then(resolve)
            .catch(reject);
            return; // Exit early since we're handling async
            
          case 'move_task':
            // Queue move operations to prevent race conditions
            queueTaskOperation(args.taskId, 'move', async () => {
              const targetListId = args.taskListId;
              const moveTaskId = args.taskId;
              const moveOptions = args.options || {};
              let foundTask = null;
              let sourceListId = null;
              
              // First, find the task in any list
              for (const listId in mockTasks) {
                const taskIndex = mockTasks[listId].findIndex(t => t.id === moveTaskId);
                if (taskIndex !== -1) {
                  // Create a deep copy to preserve all properties
                  foundTask = JSON.parse(JSON.stringify(mockTasks[listId][taskIndex]));
                  sourceListId = listId;
                  
                  // Remove from source list
                  mockTasks[listId].splice(taskIndex, 1);
                  break;
                }
              }
              
              if (!foundTask) {
                console.log(`[Mock] ❌ Task ${moveTaskId} not found in any list`);
                throw new Error('Task not found in any list');
              }
              
              // Update task properties from options
              if (moveOptions.parent !== undefined) {
                foundTask.parent = moveOptions.parent;
              }
              
              if (moveOptions.previous !== undefined) {
                foundTask.position = moveOptions.previous;
              }
              
              foundTask.updated = new Date().toISOString();
              
              // Add to target list
              if (!mockTasks[targetListId]) {
                mockTasks[targetListId] = [];
              }
              mockTasks[targetListId].push(foundTask);
              
              console.log(`[Mock] ✅ Moved task ${moveTaskId} from ${sourceListId} to ${targetListId}`);
              console.log(`[Mock] Task data preserved:`, foundTask);
              return foundTask;
            })
            .then(resolve)
            .catch(reject);
            return; // Exit early since we're handling async
            
          case 'delete_task':
            const delListId = args.taskListId;
            const delTaskId = args.taskId;
            const delTaskList = mockTasks[delListId];
            
            if (delTaskList) {
              const taskIndex = delTaskList.findIndex(t => t.id === delTaskId);
              if (taskIndex !== -1) {
                delTaskList.splice(taskIndex, 1);
                resolve(undefined);
              } else {
                reject(new Error('Task not found'));
              }
            } else {
              reject(new Error('Task list not found'));
            }
            break;
            
          case 'get_calendar_events':
            resolve({ items: mockCalendarEvents });
            break;
            
          case 'create_calendar_event':
            const newEvent: GoogleCalendarEvent = {
              id: `event-${Date.now()}`,
              summary: args.eventData.summary,
              description: args.eventData.description,
              start: args.eventData.start,
              end: args.eventData.end,
              status: 'confirmed',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              etag: `etag-event-${Date.now()}`,
            };
            mockCalendarEvents.push(newEvent);
            resolve(newEvent);
            break;

          // Task List Management
          case 'update_task_list':
            const updatedList = mockTaskLists.find(list => list.id === args.taskListId);
            if (updatedList) {
              updatedList.title = args.title;
              updatedList.updated = new Date().toISOString();
            }
            resolve(updatedList);
            break;

          case 'create_task_list':
            const newTaskList: GoogleTaskList = {
              id: `tasklist-${Date.now()}`,
              title: args.title,
              updated: new Date().toISOString(),
              selfLink: `https://www.googleapis.com/tasks/v1/users/@me/lists/tasklist-${Date.now()}`,
              etag: `etag-list-${Date.now()}`,
            };
            mockTaskLists.push(newTaskList);
            resolve(newTaskList);
            break;

          case 'delete_task_list':
            const deleteListIndex = mockTaskLists.findIndex(list => list.id === args.taskListId);
            if (deleteListIndex !== -1) {
              mockTaskLists.splice(deleteListIndex, 1);
              delete mockTasks[args.taskListId]; // Also delete all tasks in the list
              resolve(undefined);
            } else {
              reject(new Error('Task list not found'));
            }
            break;

          case 'archive_task_list':
            // For mock purposes, we'll just mark it as archived (could add an archived field later)
            const archiveListIndex = mockTaskLists.findIndex(list => list.id === args.taskListId);
            if (archiveListIndex !== -1) {
              // For now, just simulate successful archiving
              console.log(`Task list ${args.taskListId} archived (mock)`);
              resolve(undefined);
            } else {
              reject(new Error('Task list not found'));
            }
            break;
            
          default:
            reject(new Error(`Unknown command: ${command}`));
        }
      } catch (error) {
        reject(error);
      }
    }, Math.random() * 200 + 100); // Reduced delay: 100-300ms for better performance
  });
};

// Export the mock account for testing
export const getMockAccount = (): GoogleAccount => mockAccount; 
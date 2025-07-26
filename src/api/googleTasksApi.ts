import { gapi } from 'gapi-script';
// Type definitions for Google Tasks API
export namespace tasks_v1 {
  export interface Schema$Task {
    id?: string;
    title?: string;
    notes?: string;
    status?: 'needsAction' | 'completed';
    due?: string;
    completed?: string;
    deleted?: boolean;
    hidden?: boolean;
    parent?: string;
    position?: string;
    selfLink?: string;
    etag?: string;
    kind?: string;
    updated?: string;
    links?: Array<{
      type?: string;
      description?: string;
      link?: string;
    }>;
  }
  
  export interface Schema$TaskList {
    id?: string;
    title?: string;
    selfLink?: string;
    updated?: string;
    etag?: string;
    kind?: string;
  }
}

let gapiInitialized = false;

export async function initGapiClient(apiKey: string, clientId: string): Promise<void> {
  if (gapiInitialized) return;
  
  await new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey,
          clientId,
          discoveryDocs: ["https://tasks.googleapis.com/$discovery/rest?version=v1"],
          scope: "https://www.googleapis.com/auth/tasks"
        });
        gapiInitialized = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function listTaskLists(): Promise<tasks_v1.Schema$TaskList[]> {
  const response = await (gapi.client as any).tasks.tasklists.list({
    maxResults: 100
  });
  return response.result.items || [];
}

export async function listTasks(tasklistId: string): Promise<tasks_v1.Schema$Task[]> {
  const response = await (gapi.client as any).tasks.tasks.list({ 
    tasklist: tasklistId,
    maxResults: 100,
    showCompleted: false,
    showDeleted: false
  });
  return response.result.items || [];
}

export async function createTask(
  tasklistId: string, 
  resource: tasks_v1.Schema$Task
): Promise<tasks_v1.Schema$Task> {
  const response = await (gapi.client as any).tasks.tasks.insert({ 
    tasklist: tasklistId, 
    resource 
  });
  return response.result;
}

export async function updateTask(
  tasklistId: string, 
  taskId: string, 
  resource: tasks_v1.Schema$Task
): Promise<tasks_v1.Schema$Task> {
  const response = await (gapi.client as any).tasks.tasks.update({ 
    tasklist: tasklistId, 
    task: taskId, 
    resource 
  });
  return response.result;
}

export async function deleteTask(
  tasklistId: string, 
  taskId: string
): Promise<void> {
  await (gapi.client as any).tasks.tasks.delete({ 
    tasklist: tasklistId, 
    task: taskId 
  });
}

export async function moveTask(
  tasklistId: string,
  taskId: string,
  parent?: string,
  previous?: string
): Promise<tasks_v1.Schema$Task> {
  const response = await (gapi.client as any).tasks.tasks.move({
    tasklist: tasklistId,
    task: taskId,
    parent,
    previous
  });
  return response.result;
}

// Task list management
export async function createTaskList(title: string): Promise<tasks_v1.Schema$TaskList> {
  const response = await (gapi.client as any).tasks.tasklists.insert({
    resource: { title }
  });
  return response.result;
}

export async function updateTaskList(
  tasklistId: string,
  title: string
): Promise<tasks_v1.Schema$TaskList> {
  const response = await (gapi.client as any).tasks.tasklists.update({
    tasklist: tasklistId,
    resource: { title }
  });
  return response.result;
}

export async function deleteTaskList(tasklistId: string): Promise<void> {
  await (gapi.client as any).tasks.tasklists.delete({
    tasklist: tasklistId
  });
}
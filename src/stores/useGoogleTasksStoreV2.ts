import { create } from 'zustand';
import { persistNSync } from 'persist-and-sync';
import type { tasks_v1 } from '../api/googleTasksApi';

interface GoogleTasksState {
  taskLists: tasks_v1.Schema$TaskList[];
  tasks: Record<string, tasks_v1.Schema$Task[]>;
  setTaskLists: (lists: tasks_v1.Schema$TaskList[]) => void;
  setTasks: (listId: string, tasks: tasks_v1.Schema$Task[]) => void;
  updateTask: (listId: string, taskId: string, updates: Partial<tasks_v1.Schema$Task>) => void;
  addTask: (listId: string, task: tasks_v1.Schema$Task) => void;
  removeTask: (listId: string, taskId: string) => void;
}

export const useGoogleTasksStoreV2 = create<GoogleTasksState>()(
  persistNSync(
    (set) => ({
      taskLists: [],
      tasks: {},
      
      setTaskLists: (lists) => set({ taskLists: lists }),
      
      setTasks: (listId, tasks) => set(state => ({ 
        tasks: { ...state.tasks, [listId]: tasks } 
      })),
      
      updateTask: (listId, taskId, updates) => set(state => ({
        tasks: {
          ...state.tasks,
          [listId]: state.tasks[listId]?.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          ) || []
        }
      })),
      
      addTask: (listId, task) => set(state => ({
        tasks: {
          ...state.tasks,
          [listId]: [task, ...(state.tasks[listId] || [])]
        }
      })),
      
      removeTask: (listId, taskId) => set(state => ({
        tasks: {
          ...state.tasks,
          [listId]: state.tasks[listId]?.filter(task => task.id !== taskId) || []
        }
      }))
    }),
    { 
      name: 'google-tasks-store-v2',
      storage: 'localStorage'
    }
  )
);
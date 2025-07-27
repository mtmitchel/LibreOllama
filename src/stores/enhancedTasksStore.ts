/**
 * Enhanced Tasks Store
 * 
 * Centralizes all tasks-related UI state management and business logic
 * that was previously scattered across the TasksAsanaClean component.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { useUnifiedTaskStore } from './unifiedTaskStore';
import type { UnifiedTask } from './unifiedTaskStore.types';
import { googleTasksApi } from '../api/googleTasksApi';
import { realtimeSync } from '../services/realtimeSync';
import { logger } from '../core/lib/logger';

export type ViewMode = 'kanban' | 'list' | 'calendar';
export type SortBy = 'created' | 'due' | 'title' | 'priority';

export interface TaskModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  task: UnifiedTask | null;
  columnId: string | null;
}

export interface ContextMenuState {
  x: number;
  y: number;
  task: UnifiedTask;
  columnId: string;
}

export interface ListDialogState {
  showNewListDialog: boolean;
  showDeleteListDialog: boolean;
  listToDelete: { id: string; title: string } | null;
  newListTitle: string;
  isCreatingList: boolean;
}

export interface TasksUIState {
  // View state
  viewMode: ViewMode;
  selectedListId: string;
  sortBy: SortBy;
  showSortMenu: boolean;
  
  // Search/filter
  searchQuery: string;
  
  // Modal state
  taskModal: TaskModalState;
  contextMenu: ContextMenuState | null;
  listDialog: ListDialogState;
  
  // Sync state
  isSyncing: boolean;
  syncError: string | null;
}

export interface TasksActions {
  // View actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedList: (listId: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortMenu: () => void;
  
  // Search/filter
  setSearchQuery: (query: string) => void;
  
  // Task modal actions
  openCreateTaskModal: (columnId: string) => void;
  openEditTaskModal: (task: UnifiedTask, columnId: string) => void;
  closeTaskModal: () => void;
  
  // Context menu
  showContextMenu: (x: number, y: number, task: UnifiedTask, columnId: string) => void;
  hideContextMenu: () => void;
  
  // List dialog actions
  openNewListDialog: () => void;
  closeNewListDialog: () => void;
  setNewListTitle: (title: string) => void;
  openDeleteListDialog: (list: { id: string; title: string }) => void;
  closeDeleteListDialog: () => void;
  
  // Task operations
  createTask: (taskData: Partial<UnifiedTask>, metadata: any) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<UnifiedTask>, metadata?: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, targetColumnId: string, targetIndex?: number) => Promise<void>;
  
  // List operations
  createList: () => Promise<void>;
  updateList: (listId: string, title: string) => Promise<void>;
  deleteList: () => Promise<void>;
  
  // Sync operations
  syncTasks: () => Promise<void>;
  
  // Utility
  getFilteredTasks: () => UnifiedTask[];
  getSortedTasks: (tasks: UnifiedTask[]) => UnifiedTask[];
}

type TasksStore = TasksUIState & TasksActions;

export const useEnhancedTasksStore = create<TasksStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      viewMode: 'kanban',
      selectedListId: 'all',
      sortBy: 'created',
      showSortMenu: false,
      searchQuery: '',
      taskModal: {
        isOpen: false,
        mode: 'create',
        task: null,
        columnId: null,
      },
      contextMenu: null,
      listDialog: {
        showNewListDialog: false,
        showDeleteListDialog: false,
        listToDelete: null,
        newListTitle: '',
        isCreatingList: false,
      },
      isSyncing: false,
      syncError: null,
      
      // View actions
      setViewMode: (mode) => {
        set(state => {
          state.viewMode = mode;
        });
      },
      
      setSelectedList: (listId) => {
        set(state => {
          state.selectedListId = listId;
        });
      },
      
      setSortBy: (sortBy) => {
        set(state => {
          state.sortBy = sortBy;
          state.showSortMenu = false;
        });
      },
      
      toggleSortMenu: () => {
        set(state => {
          state.showSortMenu = !state.showSortMenu;
        });
      },
      
      // Search/filter
      setSearchQuery: (query) => {
        set(state => {
          state.searchQuery = query;
        });
      },
      
      // Task modal actions
      openCreateTaskModal: (columnId) => {
        set(state => {
          state.taskModal = {
            isOpen: true,
            mode: 'create',
            task: null,
            columnId,
          };
        });
      },
      
      openEditTaskModal: (task, columnId) => {
        set(state => {
          state.taskModal = {
            isOpen: true,
            mode: 'edit',
            task,
            columnId,
          };
        });
      },
      
      closeTaskModal: () => {
        set(state => {
          state.taskModal = {
            isOpen: false,
            mode: 'create',
            task: null,
            columnId: null,
          };
        });
      },
      
      // Context menu
      showContextMenu: (x, y, task, columnId) => {
        set(state => {
          state.contextMenu = { x, y, task, columnId };
        });
      },
      
      hideContextMenu: () => {
        set(state => {
          state.contextMenu = null;
        });
      },
      
      // List dialog actions
      openNewListDialog: () => {
        set(state => {
          state.listDialog.showNewListDialog = true;
          state.listDialog.newListTitle = '';
        });
      },
      
      closeNewListDialog: () => {
        set(state => {
          state.listDialog.showNewListDialog = false;
          state.listDialog.newListTitle = '';
          state.listDialog.isCreatingList = false;
        });
      },
      
      setNewListTitle: (title) => {
        set(state => {
          state.listDialog.newListTitle = title;
        });
      },
      
      openDeleteListDialog: (list) => {
        set(state => {
          state.listDialog.showDeleteListDialog = true;
          state.listDialog.listToDelete = list;
        });
      },
      
      closeDeleteListDialog: () => {
        set(state => {
          state.listDialog.showDeleteListDialog = false;
          state.listDialog.listToDelete = null;
        });
      },
      
      // Task operations
      createTask: async (taskData, metadata) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const { taskModal } = get();
          
          if (!taskModal.columnId) {
            throw new Error('No column selected');
          }
          
          await unifiedStore.createTask({
            title: taskData.title || '',
            notes: taskData.notes || '',
            columnId: taskModal.columnId,
            due: taskData.due,
            metadata: {
              priority: metadata.priority || 'normal',
              labels: metadata.labels || [],
              subtasks: metadata.subtasks || [],
            },
          });
          
          logger.info('[TasksStore] Task created successfully');
          get().closeTaskModal();
        } catch (error) {
          logger.error('[TasksStore] Failed to create task', error);
          set(state => { state.syncError = 'Failed to create task'; });
        }
      },
      
      updateTask: async (taskId, updates, metadata) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          
          // Merge metadata if provided
          if (metadata) {
            const task = Object.values(unifiedStore.tasks).find(t => t.id === taskId);
            if (task) {
              updates = {
                ...updates,
                metadata: {
                  ...task.metadata,
                  ...metadata,
                },
              };
            }
          }
          
          await unifiedStore.updateTask(taskId, updates);
          
          logger.info('[TasksStore] Task updated successfully');
          get().closeTaskModal();
        } catch (error) {
          logger.error('[TasksStore] Failed to update task', error);
          set(state => { state.syncError = 'Failed to update task'; });
        }
      },
      
      deleteTask: async (taskId) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          await unifiedStore.deleteTask(taskId);
          
          logger.info('[TasksStore] Task deleted successfully');
          get().hideContextMenu();
        } catch (error) {
          logger.error('[TasksStore] Failed to delete task', error);
          set(state => { state.syncError = 'Failed to delete task'; });
        }
      },
      
      toggleTaskComplete: async (taskId) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const task = Object.values(unifiedStore.tasks).find(t => t.id === taskId);
          
          if (task) {
            const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
            await unifiedStore.updateTask(taskId, { status: newStatus });
            logger.info('[TasksStore] Task status toggled');
          }
        } catch (error) {
          logger.error('[TasksStore] Failed to toggle task', error);
        }
      },
      
      moveTask: async (taskId, targetColumnId, targetIndex) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          await unifiedStore.moveTask(taskId, targetColumnId, targetIndex);
          
          logger.info('[TasksStore] Task moved successfully');
        } catch (error) {
          logger.error('[TasksStore] Failed to move task', error);
        }
      },
      
      // List operations
      createList: async () => {
        const { newListTitle } = get().listDialog;
        if (!newListTitle.trim()) return;
        
        set(state => {
          state.listDialog.isCreatingList = true;
          state.syncError = null;
        });
        
        try {
          const newList = await googleTasksApi.createTaskList({ title: newListTitle });
          const unifiedStore = useUnifiedTaskStore.getState();
          
          // Add to unified store
          unifiedStore.addColumn(newList.id, newList.title, newList.id);
          
          logger.info('[TasksStore] List created successfully');
          get().closeNewListDialog();
        } catch (error) {
          logger.error('[TasksStore] Failed to create list', error);
          set(state => { state.syncError = 'Failed to create list'; });
        } finally {
          set(state => { state.listDialog.isCreatingList = false; });
        }
      },
      
      updateList: async (listId, title) => {
        try {
          await googleTasksApi.updateTaskList(listId, { title });
          const unifiedStore = useUnifiedTaskStore.getState();
          
          // Update in unified store
          unifiedStore.updateColumn(listId, { title });
          
          logger.info('[TasksStore] List updated successfully');
        } catch (error) {
          logger.error('[TasksStore] Failed to update list', error);
          set(state => { state.syncError = 'Failed to update list'; });
        }
      },
      
      deleteList: async () => {
        const { listToDelete } = get().listDialog;
        if (!listToDelete) return;
        
        try {
          await googleTasksApi.deleteTaskList(listToDelete.id);
          const unifiedStore = useUnifiedTaskStore.getState();
          
          // Delete from unified store
          unifiedStore.deleteColumn(listToDelete.id);
          
          logger.info('[TasksStore] List deleted successfully');
          get().closeDeleteListDialog();
        } catch (error) {
          logger.error('[TasksStore] Failed to delete list', error);
          set(state => { state.syncError = 'Failed to delete list'; });
        }
      },
      
      // Sync operations
      syncTasks: async () => {
        set(state => {
          state.isSyncing = true;
          state.syncError = null;
        });
        
        try {
          await realtimeSync.syncNow();
          logger.info('[TasksStore] Tasks synced successfully');
        } catch (error) {
          logger.error('[TasksStore] Failed to sync tasks', error);
          set(state => { state.syncError = 'Failed to sync tasks'; });
        } finally {
          set(state => { state.isSyncing = false; });
        }
      },
      
      // Utility
      getFilteredTasks: () => {
        const state = get();
        const unifiedStore = useUnifiedTaskStore.getState();
        const { searchQuery, selectedListId } = state;
        
        let tasks = Object.values(unifiedStore.tasks);
        
        // Filter by list
        if (selectedListId !== 'all') {
          tasks = tasks.filter(task => task.columnId === selectedListId);
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          tasks = tasks.filter(task =>
            task.title.toLowerCase().includes(query) ||
            (task.notes && task.notes.toLowerCase().includes(query)) ||
            task.labels.some(label => label.toLowerCase().includes(query))
          );
        }
        
        return tasks;
      },
      
      getSortedTasks: (tasks) => {
        const { sortBy } = get();
        
        return [...tasks].sort((a, b) => {
          switch (sortBy) {
            case 'title':
              return a.title.localeCompare(b.title);
            case 'due':
              if (!a.due && !b.due) return 0;
              if (!a.due) return 1;
              if (!b.due) return -1;
              return new Date(a.due).getTime() - new Date(b.due).getTime();
            case 'priority':
              const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
              const aPriority = a.priority || 'normal';
              const bPriority = b.priority || 'normal';
              return priorityOrder[aPriority] - priorityOrder[bPriority];
            case 'created':
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });
      },
    })),
    {
      name: 'enhanced-tasks-store',
    }
  )
);
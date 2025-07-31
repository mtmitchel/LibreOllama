/**
 * Enhanced Calendar Store
 * 
 * Centralizes all calendar-related state management and business logic
 * that was previously scattered across the Calendar component.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { EventApi, DateSelectArg } from '@fullcalendar/core';
import type { GoogleTask } from '../types/google';
import { useGoogleCalendarStore } from './googleCalendarStore';
import { useUnifiedTaskStore } from './unifiedTaskStore';
import { logger } from '../core/lib/logger';

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

export interface CalendarUIState {
  // View state
  view: CalendarView;
  currentViewTitle: string;
  showTasksInCalendar: boolean;
  
  // Modal state
  showEventModal: boolean;
  showScheduleModal: boolean;
  showTaskModal: boolean;
  showDeleteTaskDialog: boolean;
  
  // Selection state
  selectedDateInfo: DateSelectArg | null;
  selectedTaskForScheduling: GoogleTask | null;
  selectedScheduleDate: Date | null;
  selectedColumnId: string;
  editingEvent: EventApi | null;
  editingTask: GoogleTask | null;
  taskToDelete: GoogleTask | null;
  contextMenu: { x: number; y: number; task: GoogleTask; listId: string } | null;
  
  // Form state
  eventForm: EventFormData;
  searchQuery: string;
  
  // Loading state
  isRefreshing: boolean;
  isCreatingEvent: boolean;
  error: string | null;
}

export interface CalendarActions {
  // View actions
  setView: (view: CalendarView) => void;
  setCurrentViewTitle: (title: string) => void;
  toggleTasksInCalendar: () => void;
  
  // Modal actions
  openEventModal: (dateInfo?: DateSelectArg) => void;
  closeEventModal: () => void;
  openScheduleModal: (task: GoogleTask, date: Date) => void;
  closeScheduleModal: () => void;
  openTaskModal: (columnId: string) => void;
  closeTaskModal: () => void;
  openDeleteTaskDialog: (task: GoogleTask) => void;
  closeDeleteTaskDialog: () => void;
  
  // Selection actions
  setSelectedColumn: (columnId: string) => void;
  setEditingEvent: (event: EventApi | null) => void;
  setEditingTask: (task: GoogleTask | null) => void;
  setContextMenu: (menu: CalendarUIState['contextMenu']) => void;
  
  // Form actions
  updateEventForm: (updates: Partial<EventFormData>) => void;
  resetEventForm: () => void;
  setSearchQuery: (query: string) => void;
  
  // Event operations
  createEvent: () => Promise<void>;
  updateEvent: () => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Task operations
  scheduleTask: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<GoogleTask>) => Promise<void>;
  deleteTask: () => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  
  // Sync operations
  refreshAll: () => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type CalendarStore = CalendarUIState & CalendarActions;

const initialEventForm: EventFormData = {
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
};

export const useEnhancedCalendarStore = create<CalendarStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      view: 'dayGridMonth',
      currentViewTitle: 'Calendar',
      showTasksInCalendar: true,
      showEventModal: false,
      showScheduleModal: false,
      showTaskModal: false,
      showDeleteTaskDialog: false,
      selectedDateInfo: null,
      selectedTaskForScheduling: null,
      selectedScheduleDate: null,
      selectedColumnId: 'all',
      editingEvent: null,
      editingTask: null,
      taskToDelete: null,
      contextMenu: null,
      eventForm: { ...initialEventForm },
      searchQuery: '',
      isRefreshing: false,
      isCreatingEvent: false,
      error: null,
      
      // View actions
      setView: (view) => {
        set(state => {
          state.view = view;
        });
      },
      
      setCurrentViewTitle: (title) => {
        set(state => {
          state.currentViewTitle = title;
        });
      },
      
      toggleTasksInCalendar: () => {
        set(state => {
          state.showTasksInCalendar = !state.showTasksInCalendar;
        });
      },
      
      // Modal actions
      openEventModal: (dateInfo) => {
        set(state => {
          state.showEventModal = true;
          state.selectedDateInfo = dateInfo || null;
          
          // Pre-fill form if date is selected
          if (dateInfo) {
            state.eventForm.startTime = dateInfo.startStr;
            state.eventForm.endTime = dateInfo.endStr;
          }
        });
      },
      
      closeEventModal: () => {
        set(state => {
          state.showEventModal = false;
          state.selectedDateInfo = null;
          state.editingEvent = null;
          state.eventForm = { ...initialEventForm };
          state.error = null;
        });
      },
      
      openScheduleModal: (task, date) => {
        set(state => {
          state.showScheduleModal = true;
          state.selectedTaskForScheduling = task;
          state.selectedScheduleDate = date;
        });
      },
      
      closeScheduleModal: () => {
        set(state => {
          state.showScheduleModal = false;
          state.selectedTaskForScheduling = null;
          state.selectedScheduleDate = null;
        });
      },
      
      openTaskModal: (columnId) => {
        set(state => {
          state.showTaskModal = true;
          state.selectedColumnId = columnId;
        });
      },
      
      closeTaskModal: () => {
        set(state => {
          state.showTaskModal = false;
          state.editingTask = null;
        });
      },
      
      openDeleteTaskDialog: (task) => {
        set(state => {
          state.showDeleteTaskDialog = true;
          state.taskToDelete = task;
        });
      },
      
      closeDeleteTaskDialog: () => {
        set(state => {
          state.showDeleteTaskDialog = false;
          state.taskToDelete = null;
        });
      },
      
      // Selection actions
      setSelectedColumn: (columnId) => {
        set(state => {
          state.selectedColumnId = columnId;
        });
      },
      
      setEditingEvent: (event) => {
        set(state => {
          state.editingEvent = event;
          
          // Pre-fill form if editing
          if (event) {
            const props = event.extendedProps;
            state.eventForm = {
              title: event.title || '',
              description: props.description || '',
              location: props.location || '',
              startTime: event.startStr,
              endTime: event.endStr,
            };
          }
        });
      },
      
      setEditingTask: (task) => {
        set(state => {
          state.editingTask = task;
        });
      },
      
      setContextMenu: (menu) => {
        set(state => {
          state.contextMenu = menu;
        });
      },
      
      // Form actions
      updateEventForm: (updates) => {
        set(state => {
          Object.assign(state.eventForm, updates);
        });
      },
      
      resetEventForm: () => {
        set(state => {
          state.eventForm = { ...initialEventForm };
        });
      },
      
      setSearchQuery: (query) => {
        set(state => {
          state.searchQuery = query;
        });
      },
      
      // Event operations
      createEvent: async () => {
        const state = get();
        set(s => { s.isCreatingEvent = true; s.error = null; });
        
        try {
          const { createEvent } = useGoogleCalendarStore.getState();
          const { eventForm } = state;
          
          await createEvent({
            summary: eventForm.title,
            description: eventForm.description,
            location: eventForm.location,
            start: {
              dateTime: new Date(eventForm.startTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(eventForm.endTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          });
          
          logger.info('[CalendarStore] Event created successfully');
          get().closeEventModal();
        } catch (error) {
          logger.error('[CalendarStore] Failed to create event', error);
          set(s => { s.error = 'Failed to create event'; });
        } finally {
          set(s => { s.isCreatingEvent = false; });
        }
      },
      
      updateEvent: async () => {
        const state = get();
        const { editingEvent, eventForm } = state;
        if (!editingEvent) return;
        
        set(s => { s.isCreatingEvent = true; s.error = null; });
        
        try {
          const { updateEvent } = useGoogleCalendarStore.getState();
          
          await updateEvent(editingEvent.id, {
            summary: eventForm.title,
            description: eventForm.description,
            location: eventForm.location,
            start: {
              dateTime: new Date(eventForm.startTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(eventForm.endTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          });
          
          logger.info('[CalendarStore] Event updated successfully');
          get().closeEventModal();
        } catch (error) {
          logger.error('[CalendarStore] Failed to update event', error);
          set(s => { s.error = 'Failed to update event'; });
        } finally {
          set(s => { s.isCreatingEvent = false; });
        }
      },
      
      deleteEvent: async (eventId) => {
        try {
          const { deleteEvent } = useGoogleCalendarStore.getState();
          await deleteEvent(eventId);
          logger.info('[CalendarStore] Event deleted successfully');
        } catch (error) {
          logger.error('[CalendarStore] Failed to delete event', error);
          set(s => { s.error = 'Failed to delete event'; });
        }
      },
      
      // Task operations
      scheduleTask: async () => {
        const state = get();
        const { selectedTaskForScheduling, selectedScheduleDate } = state;
        if (!selectedTaskForScheduling || !selectedScheduleDate) return;
        
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const task = Object.values(unifiedStore.tasks).find(
            t => t.googleTaskId === selectedTaskForScheduling.id || t.id === selectedTaskForScheduling.id
          );
          
          if (task) {
            await unifiedStore.updateTask(task.id, {
              due: selectedScheduleDate.toISOString(),
            });
            
            logger.info('[CalendarStore] Task scheduled successfully');
            get().closeScheduleModal();
          }
        } catch (error) {
          logger.error('[CalendarStore] Failed to schedule task', error);
          set(s => { s.error = 'Failed to schedule task'; });
        }
      },
      
      updateTask: async (taskId, updates) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const task = Object.values(unifiedStore.tasks).find(
            t => t.googleTaskId === taskId || t.id === taskId
          );
          
          if (task) {
            await unifiedStore.updateTask(task.id, updates);
            logger.info('[CalendarStore] Task updated successfully');
          }
        } catch (error) {
          logger.error('[CalendarStore] Failed to update task', error);
          set(s => { s.error = 'Failed to update task'; });
        }
      },
      
      deleteTask: async () => {
        const { taskToDelete } = get();
        if (!taskToDelete) return;
        
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const task = Object.values(unifiedStore.tasks).find(
            t => t.googleTaskId === taskToDelete.id || t.id === taskToDelete.id
          );
          
          if (task) {
            await unifiedStore.deleteTask(task.id);
            logger.info('[CalendarStore] Task deleted successfully');
            get().closeDeleteTaskDialog();
          }
        } catch (error) {
          logger.error('[CalendarStore] Failed to delete task', error);
          set(s => { s.error = 'Failed to delete task'; });
        }
      },
      
      toggleTaskComplete: async (taskId) => {
        try {
          const unifiedStore = useUnifiedTaskStore.getState();
          const task = Object.values(unifiedStore.tasks).find(
            t => t.googleTaskId === taskId || t.id === taskId
          );
          
          if (task) {
            const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
            await unifiedStore.updateTask(task.id, { status: newStatus });
            logger.info('[CalendarStore] Task status toggled');
          }
        } catch (error) {
          logger.error('[CalendarStore] Failed to toggle task', error);
        }
      },
      
      // Sync operations
      refreshAll: async () => {
        set(s => { s.isRefreshing = true; s.error = null; });
        
        try {
          const { fetchEvents, fetchCalendars } = useGoogleCalendarStore.getState();
          
          await Promise.all([
            fetchCalendars(),
            fetchEvents(),
          ]);
          
          logger.info('[CalendarStore] Data refreshed successfully');
        } catch (error) {
          logger.error('[CalendarStore] Failed to refresh data', error);
          set(s => { s.error = 'Failed to refresh data'; });
        } finally {
          set(s => { s.isRefreshing = false; });
        }
      },
      
      // Error handling
      setError: (error) => {
        set(state => {
          state.error = error;
        });
      },
      
      clearError: () => {
        set(state => {
          state.error = null;
        });
      },
    })),
    {
      name: 'enhanced-calendar-store',
    }
  )
);
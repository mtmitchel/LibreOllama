import { useCallback, useEffect } from 'react';
import moment from 'moment';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';
import type { CalendarState } from './useCalendarState';
import type { GoogleTask } from '../../../../types/google';
import type { UnifiedTask } from '../../../../stores/unifiedTaskStore.types';

type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'work_week';

const viewMapping = {
  'dayGridMonth': 'month',
  'timeGridWeek': 'week', 
  'timeGridDay': 'day',
  'listWeek': 'agenda'
} as const;

interface CalendarEventHandlersProps {
  state: CalendarState;
  createGoogleTask: (data: any) => Promise<void>;
  syncAllTasks: () => Promise<void>;
}

export function useCalendarEventHandlers({ state, createGoogleTask, syncAllTasks }: CalendarEventHandlersProps) {
  const {
    view,
    setView,
    currentCalendarDate,
    setCurrentCalendarDate,
    setCurrentViewTitle,
    setShowEventModal,
    setShowTaskModal,
    setSelectedDateInfo,
    setSelectedEvent,
    setEditingTask,
    setTaskToDelete,
    setShowDeleteTaskDialog,
    setContextMenu,
    calendarContainerRef,
  } = state;

  // Calendar navigation
  const navigateCalendar = useCallback((action: 'prev' | 'next' | 'today') => {
    let newDate = new Date(currentCalendarDate);
    
    switch (action) {
      case 'prev':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else if (view === 'day') {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'next':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else if (view === 'day') {
          newDate.setDate(newDate.getDate() + 1);
        }
        break;
      case 'today':
        newDate = new Date();
        break;
    }
    
    setCurrentCalendarDate(newDate);
  }, [currentCalendarDate, view, setCurrentCalendarDate]);

  // Update view title when date or view changes
  useEffect(() => {
    let title = '';
    if (view === 'month') {
      title = moment(currentCalendarDate).format('MMMM YYYY');
    } else if (view === 'week') {
      const start = moment(currentCalendarDate).startOf('week');
      const end = moment(currentCalendarDate).endOf('week');
      title = `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    } else if (view === 'day') {
      title = moment(currentCalendarDate).format('dddd, MMMM D, YYYY');
    } else if (view === 'agenda') {
      title = 'Agenda';
    }
    setCurrentViewTitle(title);
  }, [currentCalendarDate, view, setCurrentViewTitle]);

  // Change view
  const changeView = useCallback((newView: string) => {
    // Handle React Big Calendar's View type which includes 'work_week'
    if (newView === 'work_week') {
      setView('week'); // Fallback to week view
    } else {
      setView(newView as CalendarView);
    }
  }, [setView]);

  // Handle event selection (date slot selection)
  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedDateInfo({
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: slotInfo.slots.length === 1
    });
    setShowEventModal(true);
  }, [setSelectedDateInfo, setShowEventModal]);

  // Handle event click
  const handleSelectEvent = useCallback((event: any) => {
    // Check if it's a task event
    if (event.resource?.type === 'task' && event.resource?.taskData) {
      const task = event.resource.taskData;
      setEditingTask(task);
      setShowTaskModal(true);
    } else {
      setSelectedEvent(event);
      console.log('Event clicked:', event);
    }
  }, [setEditingTask, setShowTaskModal, setSelectedEvent]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, task: UnifiedTask | GoogleTask, listId: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Convert UnifiedTask to GoogleTask format if needed
    let googleTask: GoogleTask;
    if ('selfLink' in task) {
      googleTask = task as GoogleTask;
    } else {
      googleTask = {
        id: task.googleId || task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
        selfLink: '',
        etag: ''
      } as GoogleTask;
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, task: googleTask, listId });
    return false;
  }, [setContextMenu]);

  // Handle task operations
  const handleTaskComplete = useCallback(async (listId: string, taskId: string, completed: boolean) => {
    const { updateTask, getTaskByGoogleId } = useUnifiedTaskStore.getState();
    const unifiedTask = getTaskByGoogleId(taskId);
    if (unifiedTask) {
      await updateTask(unifiedTask.id, { status: completed ? 'completed' : 'needsAction' });
    }
  }, []);

  const handleTaskCreate = useCallback(async (listId: string, data: any) => {
    await createGoogleTask({
      ...data,
      columnId: listId
    });
    await syncAllTasks();
  }, [createGoogleTask, syncAllTasks]);

  const handleTaskEdit = useCallback((task: UnifiedTask | GoogleTask) => {
    // Handle both UnifiedTask and GoogleTask
    if ('selfLink' in task) {
      // It's a GoogleTask
      setEditingTask(task as GoogleTask);
    } else {
      // It's a UnifiedTask, convert to GoogleTask format
      setEditingTask({
        id: task.googleId || task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
        selfLink: '',
        etag: ''
      } as GoogleTask);
    }
    setShowTaskModal(true);
  }, [setEditingTask, setShowTaskModal]);

  const handleTaskDelete = useCallback((task: UnifiedTask | GoogleTask) => {
    // Convert to GoogleTask format if needed
    let googleTask: GoogleTask;
    if ('selfLink' in task) {
      googleTask = task as GoogleTask;
    } else {
      googleTask = {
        id: task.googleId || task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status,
        selfLink: '',
        etag: ''
      } as GoogleTask;
    }
    setTaskToDelete(googleTask);
    setShowDeleteTaskDialog(true);
  }, [setTaskToDelete, setShowDeleteTaskDialog]);

  const handleTaskDuplicate = useCallback(async (task: UnifiedTask | GoogleTask) => {
    const { getTaskByGoogleId } = useUnifiedTaskStore.getState();
    const taskId = 'selfLink' in task ? task.id : (task.googleId || task.id);
    const unifiedTask = getTaskByGoogleId(taskId);
    if (unifiedTask) {
      await createGoogleTask({
        columnId: unifiedTask.columnId,
        title: `${task.title} (Copy)`,
        notes: task.notes,
        due: task.due,
        priority: unifiedTask.priority,
        labels: unifiedTask.labels,
      });
    }
  }, [createGoogleTask]);

  const handleUpdatePriority = useCallback((task: UnifiedTask | GoogleTask, priority: string) => {
    const { updateTask, getTaskByGoogleId } = useUnifiedTaskStore.getState();
    const taskId = 'selfLink' in task ? task.id : (task.googleId || task.id);
    const unifiedTask = getTaskByGoogleId(taskId);
    if (unifiedTask) {
      updateTask(unifiedTask.id, { priority });
    }
  }, []);

  // Handle view change for header compatibility
  const handleViewChange = useCallback((newView: string) => {
    const rbcView = viewMapping[newView as keyof typeof viewMapping] || 'month';
    changeView(rbcView as CalendarView);
  }, [changeView]);

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const contextMenu = state.contextMenu;
      if (contextMenu && !(event.target as HTMLElement).closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    if (state.contextMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [state.contextMenu, setContextMenu]);

  // Note: Context menu prevention has been removed to restore right-click functionality
  // If you need custom context menus in the future, implement them without preventing the default

  return {
    navigateCalendar,
    changeView,
    handleSelectSlot,
    handleSelectEvent,
    handleContextMenu,
    handleTaskComplete,
    handleTaskCreate,
    handleTaskEdit,
    handleTaskDelete,
    handleTaskDuplicate,
    handleUpdatePriority,
    handleViewChange,
  };
}
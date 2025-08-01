import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer, View, Event as RBCEvent } from 'react-big-calendar';
import moment from 'moment';
import { format, parseISO } from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, RefreshCw, 
  Search, ListChecks, CheckCircle, ChevronDown, Edit2, Copy, Trash2, 
  CheckSquare, Circle, CheckCircle2, Flag, ArrowUpDown, MoreHorizontal,
  User, Tag, Clock, MapPin, Users, FileText, Sidebar
} from 'lucide-react';

import { Button, Card, Text, Heading, Input } from '../../components/ui';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { useHeader } from '../contexts/HeaderContext';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { devLog } from '../../utils/devLog';
import type { GoogleTask } from '../../types/google';
import { googleTasksApi } from '../../api/googleTasksApi';
import { realtimeSync } from '../../services/realtimeSync';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { UnifiedTaskCard } from '../../components/tasks/UnifiedTaskCard';
import { InlineTaskCreator } from '../../components/kanban/InlineTaskCreator';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/calendar-asana.css';
import './styles/calendar-experiment.css';

// Import extracted components - same as FullCalendar
import { CalendarHeader } from './calendar/components/CalendarHeader';
import { CalendarTaskSidebar } from './calendar/components/CalendarTaskSidebar';
import { CalendarEventContentWrapper } from './calendar/components/CalendarEventContentWrapper';
import { AsanaEventModal } from './calendar/components/AsanaEventModal';
import { AsanaDatePicker } from './calendar/components/AsanaDatePicker';
import { AsanaViewControls } from './calendar/components/AsanaViewControls';
import { AsanaSearchBar } from './calendar/components/AsanaSearchBar';
import { AsanaTaskItem } from './calendar/components/AsanaTaskItem';
import { TaskContextMenu } from './calendar/components/TaskContextMenu';
import { AsanaTaskModal } from './calendar/components/AsanaTaskModal';
import type { CalendarEvent, CalendarContextMenu } from './calendar/types';
import { asanaTypography, priorityConfig } from './calendar/config';
import { useCalendarOperations } from './calendar/hooks/useCalendarOperations';

const localizer = momentLocalizer(moment);

// Map FullCalendar views to React Big Calendar views
type CalendarView = 'month' | 'week' | 'day' | 'agenda';

const viewMapping = {
  'dayGridMonth': 'month',
  'timeGridWeek': 'week', 
  'timeGridDay': 'day',
  'listWeek': 'agenda'
} as const;

export default function CalendarBigCalendarExperiment() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const calendarRef = useRef<any>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentViewTitle, setCurrentViewTitle] = useState<string>('Calendar');
  const [editingTask, setEditingTask] = useState<GoogleTask | null>(null);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<GoogleTask | null>(null);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenu | null>(null);
  
  // Tasks Sidebar state
  const [showTasksSidebar, setShowTasksSidebar] = useState(true);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('all');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showInlineCreator, setShowInlineCreator] = useState(false);

  // Use the calendar operations hook
  const {
    calendars,
    taskLists,
    googleTasks,
    calendarEventsWithTasks,
    isLoading,
    error: operationsError,
    isAuthenticated,
    fetchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    updateGoogleTask,
    createGoogleTask,
    deleteGoogleTask,
    syncAllTasks,
    handleQuickTask,
    uploadAttachment,
    removeAttachment
  } = useCalendarOperations();

  const activeAccount = useActiveGoogleAccount();

  // Clear header props on unmount
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Load calendar data when component mounts
  useEffect(() => {
    console.log('Calendar data loading effect:', { activeAccount, isAuthenticated, taskLists: taskLists.length, googleTasks: Object.keys(googleTasks).length });
    if (activeAccount && isAuthenticated) {
      fetchCalendarEvents();
      syncAllTasks();
    }
  }, [activeAccount, isAuthenticated, fetchCalendarEvents, syncAllTasks]);

  // Debug: Log tasks specifically (one-time on mount)
  useEffect(() => {
    const logTasksDebug = () => {
      console.log(`📊 [RBC] Total events loaded: ${calendarEventsWithTasks.length}`);
      console.log(`📊 [RBC] Google tasks object keys: ${Object.keys(googleTasks).length}`);
      
      // Log raw google tasks data
      if (Object.keys(googleTasks).length > 0) {
        const tasksArray = Object.values(googleTasks);
        console.log(`📋 [RBC] Raw Google tasks count: ${tasksArray.length}`);
        
        // Check for August 2025 tasks in raw data
        const august2025TasksRaw = tasksArray.filter((task: any) => {
          if (task.due) {
            const taskDate = new Date(task.due);
            return taskDate.getFullYear() === 2025 && taskDate.getMonth() === 7;
          }
          return false;
        });
        console.log(`🔍 [RBC] August 2025 tasks in raw data: ${august2025TasksRaw.length}`, august2025TasksRaw.slice(0, 3));
      }
      
      if (calendarEventsWithTasks.length > 0) {
        const tasks = calendarEventsWithTasks.filter(event => event.extendedProps?.type === 'task');
        console.log(`📋 [RBC] Total tasks on calendar: ${tasks.length}`);
        
        // Group tasks by month
        const tasksByMonth: Record<string, any[]> = {};
        tasks.forEach(task => {
          const taskDate = new Date(task.start);
          const monthKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
          if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
          tasksByMonth[monthKey].push(task);
        });
        
        // Log tasks by month
        Object.entries(tasksByMonth).forEach(([month, monthTasks]) => {
          console.log(`📅 [RBC] ${month}: ${monthTasks.length} tasks`, monthTasks.slice(0, 3).map(t => ({
            title: t.title,
            date: t.start,
            taskData: t.extendedProps?.taskData
          })));
        });
        
        // Specifically check for August 2025 tasks
        const august2025Tasks = tasks.filter(task => {
          const taskDate = new Date(task.start);
          return taskDate.getFullYear() === 2025 && taskDate.getMonth() === 7; // August is month 7 (0-indexed)
        });
        console.log(`🔍 [RBC] August 2025 tasks: ${august2025Tasks.length}`, august2025Tasks);
      }
    };
    
    // Only log once after a delay to avoid logging during rapid updates
    const timeoutId = setTimeout(logTasksDebug, 1000);
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run once

  // Calendar navigation
  const navigateCalendar = useCallback((action: 'prev' | 'next' | 'today') => {
    // React Big Calendar doesn't expose an API like FullCalendar
    // We'll handle this by updating the date state
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
  }, [currentCalendarDate, view]);

  // View title update
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
  }, [currentCalendarDate, view]);

  const changeView = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Handle event selection (date slot selection)
  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedDateInfo({
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: slotInfo.slots.length === 1
    });
    setShowEventModal(true);
  }, []);

  // Handle event click
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event);
    // You can open event modal or handle differently
    console.log('Event clicked:', event);
  }, []);

  // Convert and filter events for React Big Calendar
  const filteredCalendarEvents = useMemo(() => {
    // Helper to parse date strings as local dates (not UTC)
    const parseLocalDate = (dateStr: string): Date => {
      if (!dateStr) return new Date();
      
      // For date-only format (YYYY-MM-DD), parse as local date to avoid timezone shift
      if (dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0); // month is 0-indexed
      }
      
      // For datetime format, use standard parsing
      return new Date(dateStr);
    };
    
    // Convert date strings to Date objects for React Big Calendar
    const convertedEvents = calendarEventsWithTasks.map(event => {
      // Use local date parsing for all-day events to prevent timezone issues
      let startDate = event.allDay ? parseLocalDate(event.start) : new Date(event.start || new Date());
      let endDate = event.allDay ? parseLocalDate(event.end) : new Date(event.end || event.start || new Date());
      
      // React Big Calendar and FullCalendar BOTH use exclusive end dates for all-day events
      // The dates from useCalendarOperations are already adjusted for exclusive handling
      
      // Removed excessive logging - was causing console spam
      
      return {
        ...event,
        start: startDate,
        end: endDate,
        resource: event.extendedProps // React Big Calendar uses 'resource' for custom data
      };
    });
    
    if (!searchQuery) return convertedEvents;
    
    return convertedEvents.filter(event => 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.extendedProps?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [calendarEventsWithTasks, searchQuery]);

  // Event style getter for React Big Calendar
  const eventStyleGetter = useCallback((event: any) => {
    let className = '';
    let style: any = {};

    // Check if it's a multi-day event
    const isMultiDay = event.allDay && event.start && event.end &&
                      moment(event.start).format('YYYY-MM-DD') !== moment(event.end).format('YYYY-MM-DD');

    // Check for event type from either extendedProps or resource
    const eventType = event.extendedProps?.type || event.resource?.type;
    const isTask = eventType === 'task';
    const isTrueMultiDay = event.extendedProps?.isTrueMultiDay || event.resource?.isTrueMultiDay;
    const isCompleted = event.extendedProps?.isCompleted || event.resource?.isCompleted;

    if (isMultiDay || isTrueMultiDay) {
      className = 'fc-multi-day-event multi-day-event';
      style.backgroundColor = event.backgroundColor || '#d8d0ff';
      style.borderColor = event.borderColor || '#c7bbff';
      style.color = event.textColor || '#4a3f99';
    }

    // Check if it's a task
    if (isTask) {
      className += ' fc-event-task';
      if (!isMultiDay) {
        style.backgroundColor = event.backgroundColor || '#FFF3E0';
        style.borderColor = event.borderColor || '#FFB74D';
        style.color = event.textColor || '#E65100';
      }
    }

    // Apply opacity for completed items
    if (isCompleted) {
      style.opacity = 0.6;
    }

    return {
      className,
      style
    };
  }, []);

  // Custom event component
  const components = useMemo(() => ({
    event: ({ event }: any) => {
      const isMultiDay = event.allDay && event.start && event.end &&
                        moment(event.start).format('YYYY-MM-DD') !== moment(event.end).format('YYYY-MM-DD');
      
      // For multi-day events, use simple rendering
      if (isMultiDay && view === 'month') {
        return <div className="fc-event-title">{event.title}</div>;
      }
      
      // For other events, use the custom component wrapper
      return <CalendarEventContentWrapper event={event} view={{ type: view }} />;
    }
  }), [view]);

  // Handle context menu click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  if (!activeAccount || !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Connect Your Google Account
          </h2>
          <p className="mb-6 text-gray-600">
            Please connect your Google account to view your calendar and tasks.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC' }}>
        {/* Header */}
        <CalendarHeader 
          currentDate={currentCalendarDate}
          currentViewTitle={currentViewTitle}
          view={view === 'month' ? 'dayGridMonth' : view === 'week' ? 'timeGridWeek' : view === 'day' ? 'timeGridDay' : 'listWeek'}
          showTasksSidebar={showTasksSidebar}
          onNavigate={navigateCalendar}
          onDateSelect={(date) => {
            setCurrentCalendarDate(date);
          }}
          onViewChange={(newView) => {
            // Convert FullCalendar view to React Big Calendar view
            const rbcView = viewMapping[newView as keyof typeof viewMapping] || 'month';
            changeView(rbcView as CalendarView);
          }}
          onToggleTasksSidebar={() => setShowTasksSidebar(!showTasksSidebar)}
          onNewEvent={() => {
            setSelectedEvent(null);
            setShowEventModal(true);
          }}
        />

      {/* Main Content Area - Calendar and Sidebar */}
      <div className="flex flex-1 gap-6 bg-primary p-6 min-h-0">
        {/* Calendar Section */}
        <div className="border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="cal-asana-calendar-wrapper flex-1" style={{ paddingRight: '0', overflow: 'hidden' }}>
            <div className="cal-asana-grid h-full" style={{ overflow: 'hidden' }}>
              <Calendar
                ref={calendarRef}
                localizer={localizer}
                events={filteredCalendarEvents}
                view={view}
                onView={changeView}
                date={currentCalendarDate}
                onNavigate={setCurrentCalendarDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                components={components}
                eventPropGetter={eventStyleGetter}
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
                step={30}
                showMultiDayTimes
                min={new Date(0, 0, 0, 6, 0, 0)}
                max={new Date(0, 0, 0, 22, 0, 0)}
                dayLayoutAlgorithm="no-overlap"
              />
            </div>
          </div>
        </div>

        {/* Task Sidebar */}
        {showTasksSidebar && (
          <CalendarTaskSidebar 
            taskLists={taskLists}
            googleTasks={googleTasks}
            selectedTaskListId={selectedTaskListId}
            showInlineCreator={showInlineCreator}
            onTaskListChange={setSelectedTaskListId}
            onTaskClick={(task) => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            onTaskComplete={async (listId, taskId, completed) => {
              const task = googleTasks[listId]?.find(t => t.id === taskId);
              if (task) {
                await updateGoogleTask(listId, taskId, { ...task, status: completed ? 'completed' : 'needsAction' });
              }
            }}
            onTaskCreate={async (listId, data) => {
              await createGoogleTask(listId, data);
              await syncAllTasks();
            }}
            onShowInlineCreator={setShowInlineCreator}
            onContextMenu={(e, task) => {
              const listId = Object.keys(googleTasks).find(id => 
                googleTasks[id].some(t => t.id === task.id)
              ) || selectedTaskListId;
              
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                task,
                listId
              });
            }}
          />
        )}
      </div>
    </div>

      {/* Event Modal */}
      <AsanaEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={async (eventData) => {
          try {
            console.log('📅 Saving event data:', eventData);
            if (eventData.id) {
              await updateCalendarEvent(eventData.id, eventData);
            } else {
              const eventToCreate = {
                summary: eventData.title,
                description: eventData.description,
                start: eventData.start,
                end: eventData.end,
                calendarId: eventData.calendarId,
                location: eventData.location,
                attendees: eventData.attendees ? eventData.attendees.map((email: string) => ({ email })) : []
              };
              await createCalendarEvent(eventToCreate);
            }
            setShowEventModal(false);
            setSelectedEvent(null);
            await fetchCalendarEvents();
          } catch (error) {
            console.error('Error saving event:', error);
          }
        }}
        calendars={calendars}
        selectedDateInfo={selectedDateInfo}
      />

      {/* Task Modal */}
      <AsanaTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        taskLists={taskLists}
        onSave={async (listId, taskData) => {
          try {
            if (editingTask) {
              await updateGoogleTask(listId, editingTask.id, taskData);
            } else {
              await createGoogleTask(listId, taskData);
            }
            await syncAllTasks();
            setShowTaskModal(false);
            setEditingTask(null);
          } catch (error) {
            console.error('Error saving task:', error);
          }
        }}
        onDelete={async (listId, taskId) => {
          try {
            await deleteGoogleTask(listId, taskId);
            await syncAllTasks();
            setShowTaskModal(false);
            setEditingTask(null);
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        }}
      />

      {/* Context Menu */}
      <TaskContextMenu
        isOpen={!!contextMenu}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 0, y: 0 }}
        task={contextMenu?.task || null}
        onEdit={() => {
          if (contextMenu?.task) {
            setEditingTask(contextMenu.task);
            setShowTaskModal(true);
          }
          setContextMenu(null);
        }}
        onDelete={() => {
          if (contextMenu?.task) {
            setTaskToDelete(contextMenu.task);
            setShowDeleteTaskDialog(true);
          }
          setContextMenu(null);
        }}
        onClose={() => setContextMenu(null)}
      />

      {/* Add custom styles for calendar - EXACT COPY from FullCalendar */}
      <style>{`
        /* Design System Constants - 4px Grid */
        :root {
          --grid-unit: 4px;
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
          --space-5: 20px;
          --space-6: 24px;
          --space-8: 32px;
          
          /* Color System */
          --color-bg-primary: #fff;
          --color-bg-secondary: #fafafa;
          --color-bg-hover: #f7f8f9;
          --color-bg-active: #f3f4f6;
          --color-bg-selected: #e7f3ff;
          
          --color-border-light: #f1f1f1;
          --color-border-default: #e8e8e8;
          --color-border-medium: #ddd;
          --color-border-strong: #ccc;
          
          --color-text-primary: #1e1f21;
          --color-text-secondary: #5a5a5a;
          --color-text-tertiary: #999;
          --color-text-muted: #b8b8b8;
          
          --color-purple-light: #f3f0ff;
          --color-purple-base: #796EFF;
          --color-purple-hover: #6b5fff;
          --color-purple-active: #5e52ff;
          
          /* Typography */
          --text-xs: 11px;
          --text-sm: 13px;
          --text-base: 14px;
          --text-lg: 16px;
          --text-xl: 18px;
          
          /* Border Radius */
          --radius-xs: 2px;
          --radius-sm: 4px;
          --radius-md: 6px;
          --radius-lg: 8px;
          --radius-xl: 12px;
          --radius-full: 999px;
          
          /* Shadows */
          --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
          --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.12);
          --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.16);
        }

        /* React Big Calendar Overrides to match FullCalendar exactly */
        .cal-asana-grid .rbc-calendar {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          color: var(--color-text-primary);
          background: transparent;
        }

        /* Hide default toolbar */
        .cal-asana-grid .rbc-toolbar {
          display: none;
        }

        /* Month view header */
        .cal-asana-grid .rbc-header {
          background-color: #fafafa !important;
          border-color: var(--color-border-light) !important;
          padding: var(--space-2) 0 !important;
          font-weight: 600 !important;
          font-size: var(--text-base) !important;
          color: #444 !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }

        /* Month view cells */
        .cal-asana-grid .rbc-month-view {
          border: none !important;
        }

        .cal-asana-grid .rbc-day-bg {
          transition: all var(--asana-transition-fast);
          background: var(--color-bg-primary);
          border-left: 1px solid var(--color-border-light) !important;
          border-top: 1px solid var(--color-border-light) !important;
        }

        .cal-asana-grid .rbc-day-bg:hover {
          background: var(--asana-bg-hover);
        }

        .cal-asana-grid .rbc-today {
          background-color: rgba(99, 102, 241, 0.05) !important;
        }

        .cal-asana-grid .rbc-off-range-bg {
          background-color: #fafafa !important;
          opacity: 0.7;
        }

        /* Day numbers */
        .cal-asana-grid .rbc-date-cell {
          font-size: var(--text-base) !important;
          font-weight: 500 !important;
          color: #444 !important;
          padding: var(--space-2) !important;
        }

        .cal-asana-grid .rbc-now .rbc-date-cell,
        .cal-asana-grid .rbc-today .rbc-date-cell {
          color: #796EFF !important;
          font-weight: 600 !important;
          background: rgba(121, 110, 255, 0.1) !important;
          border-radius: var(--radius-sm) !important;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: var(--space-1);
        }

        /* Events - base styles */
        .cal-asana-grid .rbc-event {
          background-color: #796EFF !important;
          border: none !important;
          color: white !important;
          font-size: var(--text-sm) !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Task events */
        .cal-asana-grid .rbc-event.fc-event-task {
          background-color: #FFF3E0 !important;
          border-color: #FFB74D !important;
          color: #E65100 !important;
        }

        /* Multi-day events */
        .cal-asana-grid .rbc-event.fc-multi-day-event,
        .cal-asana-grid .rbc-event.multi-day-event {
          background-color: #d8d0ff !important;
          border-color: #c7bbff !important;
          color: #4a3f99 !important;
          font-weight: 500 !important;
        }

        /* Event hover states */
        .cal-asana-grid .rbc-event:hover {
          opacity: 0.8;
          cursor: pointer;
        }

        /* Show more link */
        .cal-asana-grid .rbc-show-more {
          color: #796EFF !important;
          font-weight: 500 !important;
          font-size: 12px !important;
        }

        /* Week/Day view adjustments */
        .cal-asana-grid .rbc-time-view {
          border: none !important;
          background: #fff !important;
        }

        .cal-asana-grid .rbc-time-header {
          border-bottom: 1px solid #f1f1f1 !important;
        }

        .cal-asana-grid .rbc-time-content {
          border-top: 1px solid #f1f1f1 !important;
        }

        .cal-asana-grid .rbc-timeslot-group {
          border-left: 1px solid #f1f1f1 !important;
        }

        .cal-asana-grid .rbc-time-slot {
          border-top: 1px solid #f0f0f0 !important;
        }

        /* Time labels */
        .cal-asana-grid .rbc-label {
          color: #999 !important;
          font-size: 12px !important;
          font-weight: 400 !important;
          padding: 0 var(--space-2) !important;
        }

        /* Week/Day view events */
        .cal-asana-grid .rbc-time-view .rbc-event {
          border: 1px solid #e0dcff !important;
          border-radius: 6px !important;
          background-color: #f3f0ff !important;
          color: var(--color-text-primary) !important;
          font-size: var(--text-base) !important;
          padding: var(--space-2) !important;
          min-height: var(--space-8) !important;
        }

        .cal-asana-grid .rbc-time-view .rbc-event:hover {
          background-color: #ebe7ff !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
          border-color: #d4ceff !important;
        }

        /* Current time indicator */
        .cal-asana-grid .rbc-current-time-indicator {
          background-color: #796EFF !important;
          height: 1px !important;
        }

        /* Agenda view */
        .cal-asana-grid .rbc-agenda-view {
          border: none !important;
        }

        .cal-asana-grid .rbc-agenda-table {
          border: none !important;
          font-size: var(--text-base) !important;
        }

        .cal-asana-grid .rbc-agenda-time-cell {
          font-size: var(--text-sm) !important;
          color: var(--color-text-tertiary) !important;
          padding: var(--space-2) var(--space-3) !important;
        }

        .cal-asana-grid .rbc-agenda-event-cell {
          font-size: var(--text-base) !important;
          color: var(--color-text-primary) !important;
          padding: var(--space-2) var(--space-3) !important;
        }

        /* Selection */
        .cal-asana-grid .rbc-slot-selecting {
          background-color: rgba(121, 110, 255, 0.1) !important;
        }

        /* Scrollbar styling */
        .cal-asana-grid ::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }

        .cal-asana-grid ::-webkit-scrollbar-track {
          background: transparent !important;
        }

        .cal-asana-grid ::-webkit-scrollbar-thumb {
          background: #e0e0e0 !important;
          border-radius: 3px !important;
        }

        .cal-asana-grid ::-webkit-scrollbar-thumb:hover {
          background: #ccc !important;
        }

        /* Typography consistency */
        .fc-event-title {
          font-size: var(--text-base) !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          color: var(--color-text-primary) !important;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Popover styling for React Big Calendar */
        .rbc-overlay {
          background-color: white !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.04) !important;
          border-radius: 8px !important;
          z-index: 1000 !important;
          overflow: hidden !important;
          min-width: 220px !important;
          margin-top: 4px !important;
        }

        .rbc-overlay-header {
          background-color: #f7f8fa !important;
          border-bottom: 1px solid #e8eaed !important;
          padding: 12px 16px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          color: #3c4043 !important;
        }

        /* Additional styles from FullCalendar implementation */
        
        /* Base Typography - Consistent System */
        .asana-calendar-view {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        /* Multi-day events - proper spanning style */
        .fc-event.fc-multi-day-event,
        .fc-event.multi-day-event {
          background-color: #d8d0ff !important;
          border-color: #c7bbff !important;
          opacity: 0.9 !important;
        }
        
        .fc-event.fc-multi-day-event:hover,
        .fc-event.multi-day-event:hover {
          background-color: #cfc5ff !important;
          border-color: #bfb1ff !important;
          opacity: 1 !important;
        }
        
        /* Background events (multi-day) */
        .fc-bg-event,
        .fc-event[data-display="background"] {
          background-color: #d8d0ff !important;
          opacity: 0.3 !important;
          border: none !important;
        }
        
        /* Multi-day event segments styling - ensure continuous appearance */
        .fc-daygrid-event.fc-event-start.fc-multi-day-event {
          border-top-right-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
        }
        
        .fc-daygrid-event.fc-event-end.fc-multi-day-event {
          border-top-left-radius: 0 !important;
          border-bottom-left-radius: 0 !important;
        }
        
        .fc-daygrid-event.fc-multi-day-event:not(.fc-event-start):not(.fc-event-end) {
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
        }
        
        /* CRITICAL: Ensure multi-day events use FullCalendar's native spanning */
        .fc-daygrid-block-event .fc-event-main {
          padding: 1px 3px !important;
        }
        
        /* Multi-day event container must allow spanning */
        .fc-daygrid-day-events {
          position: relative !important;
          min-height: 2em !important;
        }
        
        /* Force proper z-index for multi-day events */
        .fc-daygrid-event-harness:has(.fc-multi-day-event) {
          z-index: 5 !important;
        }
        
        /* Multi-day event text */
        .fc-multi-day-event .fc-event-title {
          font-weight: 500 !important;
        }
        
        .fc-daygrid-event-harness {
          margin-bottom: var(--space-1) !important;
        }
        
        /* Hide time by default in month view */
        .fc-daygrid-event .fc-event-time {
          display: none !important;
        }
        
        .fc-daygrid-event:hover .fc-event-time {
          display: inline !important;
          font-size: var(--text-xs) !important;
          color: var(--color-text-tertiary) !important;
          margin-right: var(--space-1) !important;
        }
        
        /* Month event titles - bolder and clearer */
        .fc-daygrid-event .fc-event-title {
          font-weight: 500 !important;
          font-size: var(--text-base) !important;
          color: var(--color-text-primary) !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          display: block !important;
        }
        
        .fc-daygrid-event .fc-event-title-container {
          overflow: hidden !important;
          max-width: 100% !important;
        }
        
        /* Other month days */
        .fc-daygrid-day.fc-day-other {
          background-color: #fafafa !important;
          opacity: 0.7;
        }
        
        /* Popover - Premium Dropdown Component */
        .fc-popover {
          background-color: white !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.04) !important;
          border-radius: 8px !important;
          z-index: 1000 !important;
          overflow: hidden !important;
          min-width: 220px !important;
          margin-top: 4px !important;
          position: relative !important;
        }
        
        /* Arrow indicator for spatial connection */
        .fc-popover::before {
          content: "";
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background-color: white;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          transform: translateX(-50%) rotate(45deg);
          z-index: -1;
        }
        
        .fc-popover-header {
          background-color: #f7f8fa !important;
          border-bottom: 1px solid #e8eaed !important;
          padding: 12px 16px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          color: #3c4043 !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }
        
        .fc-popover-title {
          margin: 0 !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #3c4043 !important;
        }
        
        .fc-popover-close {
          background: none !important;
          border: none !important;
          padding: 4px !important;
          cursor: pointer !important;
          color: #5f6368 !important;
          font-size: 16px !important;
          line-height: 1 !important;
          border-radius: 4px !important;
          transition: background-color 0.15s ease !important;
        }
        
        .fc-popover-close:hover {
          background-color: #f1f3f4 !important;
        }
        
        .fc-popover-body {
          padding: 0 !important;
          max-height: 280px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        
        /* Popover scrollbar */
        .fc-popover-body::-webkit-scrollbar {
          width: 6px !important;
        }
        
        .fc-popover-body::-webkit-scrollbar-track {
          background: transparent !important;
        }
        
        .fc-popover-body::-webkit-scrollbar-thumb {
          background: #dadce0 !important;
          border-radius: 3px !important;
        }
        
        .fc-popover-body::-webkit-scrollbar-thumb:hover {
          background: #bdc1c6 !important;
        }
        
        /* Events in popover */
        .fc-popover .fc-event {
          margin: 6px 12px !important;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          transition: background-color 0.15s ease !important;
        }
        
        .fc-popover .fc-event:hover {
          background-color: #f8f9fa !important;
        }
        
        /* More events link - Clean minimal style */
        .fc-more-link,
        .fc-daygrid-more-link {
          color: #796EFF !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-decoration: none !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          transition: all 0.15s ease !important;
          display: inline-block !important;
          margin: 2px !important;
        }
        
        .fc-more-link:hover,
        .fc-daygrid-more-link:hover {
          background-color: rgba(121, 110, 255, 0.08) !important;
          color: #6b5fff !important;
        }
        
        /* Week and Day view specific */
        .fc-timegrid-event {
          border: 1px solid #e0dcff !important;
          border-left: 1px solid #e0dcff !important;
          border-radius: 6px !important;
          background-color: #f3f0ff !important;
          font-size: var(--text-base) !important;
          padding: var(--space-2) !important;
          min-height: var(--space-8) !important;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          margin: 0 var(--space-1) !important;
          position: relative !important;
          z-index: 2 !important;
        }
        
        .fc-timegrid-event:hover {
          background-color: #ebe7ff !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
          border-color: #d4ceff !important;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          z-index: 10 !important;
        }
        
        .fc-timegrid-event:active {
          background-color: #e8e9ed !important;
          transform: translateY(0) scale(1);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          transition: all 0.05s ease;
        }
        
        .fc-timegrid-event .fc-event-main {
          padding: 0 !important;
        }
        
        /* Remove left borders from time grid events */
        .fc-timegrid-event::before,
        .fc-timegrid-event::after {
          display: none !important;
        }
        
        /* Now indicator - subtle */
        .fc-timegrid-now-indicator-line {
          border-color: #796EFF !important;
          border-width: 1px !important;
        }
        
        .fc-timegrid-now-indicator-arrow {
          display: none !important;
        }
        
        /* Scrollbar - minimal */
        .fc-scroller::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }
        
        .fc-scroller::-webkit-scrollbar-track {
          background: transparent !important;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb {
          background: #e0e0e0 !important;
          border-radius: 3px !important;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #ccc !important;
        }
      `}</style>
    </>
  );
}
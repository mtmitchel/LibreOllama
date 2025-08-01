/**
 * @deprecated This calendar implementation uses FullCalendar and is being replaced by React Big Calendar.
 * DO NOT ADD NEW FEATURES OR MODIFICATIONS TO THIS FILE.
 * 
 * Use CalendarBigCalendarExperiment.tsx for all new development.
 * This file will be removed in a future release.
 * 
 * Migration in progress: Moving from FullCalendar to React Big Calendar
 * Reason: Better integration with React ecosystem and more flexible customization
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import { format, parseISO } from 'date-fns';
import { 
  EventContentArg, 
  DateSelectArg, 
  EventClickArg, 
  EventDropArg,
  EventApi
} from '@fullcalendar/core';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, RefreshCw, 
  Search, ListChecks, CheckCircle, ChevronDown, Edit2, Copy, Trash2, 
  CheckSquare, Circle, CheckCircle2, Flag, ArrowUpDown, MoreHorizontal,
  User, Tag, Clock, MapPin, Users, FileText, Calendar, Sidebar
} from 'lucide-react';

import { Button, Card, Text, Heading, Input } from '../../components/ui';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { useHeader } from '../contexts/HeaderContext';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable, DropArg } from '@fullcalendar/interaction';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { devLog } from '../../utils/devLog';
import type { GoogleTask } from '../../types/google';
import { googleTasksApi } from '../../api/googleTasksApi';
import { realtimeSync } from '../../services/realtimeSync';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { UnifiedTaskCard } from '../../components/tasks/UnifiedTaskCard';
import { InlineTaskCreator } from '../../components/kanban/InlineTaskCreator';
import './styles/calendar-asana.css';
import './styles/calendar-experiment.css';

// Import extracted components
import { CalendarHeader } from './calendar/components/CalendarHeader';
import { CalendarTaskSidebar } from './calendar/components/CalendarTaskSidebar';
import { CalendarEventContent } from './calendar/components/CalendarEventContent';
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

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';


export default function CalendarAsanaStyle() {
  // Deprecation warning
  useEffect(() => {
    console.warn(
      '⚠️ DEPRECATED: CalendarAsanaStyle uses FullCalendar which is being replaced.\n' +
      '🚨 DO NOT ADD NEW FEATURES TO THIS FILE.\n' +
      '✅ Use CalendarBigCalendarExperiment.tsx for all new development.\n' +
      '📅 This component will be removed in a future release.'
    );
  }, []);

  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>('dayGridMonth');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
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
    createGoogleTask,
    updateGoogleTask,
    deleteGoogleTask,
    toggleGoogleTask,
    syncAllTasks,
    refreshData
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
  
  // One-time log to check events
  useEffect(() => {
    if (calendarEventsWithTasks.length > 0) {
      console.log('📅 Total events loaded:', calendarEventsWithTasks.length);
      // Find and log any multi-day events
      const multiDayEvents = calendarEventsWithTasks.filter(event => {
        if (event.allDay && event.start && event.end) {
          const start = new Date(event.start);
          const end = new Date(event.end);
          return start.toDateString() !== end.toDateString();
        }
        return false;
      });
      if (multiDayEvents.length > 0) {
        console.log('📅 Multi-day events found:', multiDayEvents);
      }
    }
  }, [calendarEventsWithTasks.length]); // Only log when count changes


  // Calendar navigation
  const navigateCalendar = useCallback((action: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    switch (action) {
      case 'prev':
        api.prev();
        break;
      case 'next':
        api.next();
        break;
      case 'today':
        api.today();
        break;
    }
    
    setCurrentCalendarDate(api.getDate());
  }, []);

  const goToToday = () => navigateCalendar('today');

  const changeView = (newView: CalendarView) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(newView);
      setView(newView);
    }
  };

  // Filter events based on search
  const filteredCalendarEvents = useMemo(() => {
    // Debug: Log event structure
    if (calendarEventsWithTasks.length > 0 && !searchQuery) {
      console.log('📊 Total events:', calendarEventsWithTasks.length);
      
      // Find true multi-day events
      const multiDayEvents = calendarEventsWithTasks.filter(event => 
        event.extendedProps?.type === 'multiday'
      );
      
      // Find recurring instances  
      const recurringEvents = calendarEventsWithTasks.filter(event =>
        event.extendedProps?.type === 'recurring_instance'
      );
      
      console.log(`📅 True multi-day events (${multiDayEvents.length}):`, multiDayEvents.slice(0, 3));
      console.log(`🔄 Recurring instances (${recurringEvents.length}):`, recurringEvents.slice(0, 3));
      
      // Look for "Staying at Bo's" specifically
      const stayingAtBos = calendarEventsWithTasks.find(event => 
        event.title?.includes('Staying at Bo')
      );
      if (stayingAtBos) {
        console.log('🏠 "Staying at Bo\'s" event:', {
          title: stayingAtBos.title,
          start: stayingAtBos.start,
          end: stayingAtBos.end,
          allDay: stayingAtBos.allDay,
          type: stayingAtBos.extendedProps?.type,
          id: stayingAtBos.id,
          startType: typeof stayingAtBos.start,
          endType: typeof stayingAtBos.end
        });
      }
    }
    
    if (!searchQuery) return calendarEventsWithTasks;
    
    const query = searchQuery.toLowerCase();
    return calendarEventsWithTasks.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.extendedProps?.description?.toLowerCase().includes(query) ||
      event.extendedProps?.location?.toLowerCase().includes(query)
    );
  }, [calendarEventsWithTasks, searchQuery]);
  
  // Ensure events are properly formatted for FullCalendar
  const eventsWithTest = useMemo(() => {
    return filteredCalendarEvents;
  }, [filteredCalendarEvents]);

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
      {/* Deprecation Notice Banner */}
      <div style={{
        backgroundColor: '#FF6B6B',
        color: 'white',
        padding: '12px 24px',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '14px',
        borderBottom: '2px solid #E74C3C',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}>
        ⚠️ DEPRECATED: This calendar uses FullCalendar. Use CalendarBigCalendarExperiment for new development.
      </div>
      
      <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC', marginTop: '50px' }}>
        {/* Header */}
        <CalendarHeader 
          currentDate={currentCalendarDate}
          currentViewTitle={currentViewTitle}
          view={view}
          showTasksSidebar={showTasksSidebar}
          onNavigate={navigateCalendar}
          onDateSelect={(date) => {
            setCurrentCalendarDate(date);
            const api = calendarRef.current?.getApi();
            if (api) {
              api.gotoDate(date);
            }
          }}
          onViewChange={changeView}
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
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={view}
                  headerToolbar={false}
                  events={eventsWithTest}
                  eventContent={(arg) => {
                    const { event, view } = arg;
                    const isMultiDay = event.allDay && event.start && event.end &&
                                       event.start.toDateString() !== event.end.toDateString();

                    // For multi-day events in any dayGrid view (month, week), let FullCalendar render the event
                    // by returning just the title. This allows for the continuous bar display.
                    if (isMultiDay && view.type.includes('dayGrid')) {
                      return { html: `<div class="fc-event-title">${event.title}</div>` };
                    }
                    
                    // For all other event types (e.g., single-day, timeGrid events), use the custom component.
                    return <CalendarEventContent arg={arg} />;
                  }}
                  
                  eventDisplay='auto'  // Let FullCalendar decide the best display mode
                  forceEventDuration={true}  // Force events to have duration
                  allDayMaintainDuration={true}  // Maintain duration for all-day events
                  stickyHeaderDates={false}  // Prevent date headers from sticking
                  displayEventTime={false}  // Don't show time on all-day events
                  // Critical for multi-day event rendering
                  eventOverlap={true}
                  slotEventOverlap={true}
                  dayMaxEventRows={false}  // Don't limit rows for proper multi-day display
                  eventOrderStrict={true}  // Maintain event order
                  displayEventEnd={true}  // Show end date for multi-day events
                  nextDayThreshold="00:00:00"  // Events ending at midnight belong to previous day
                  eventOrder="start,-duration,title"  // Order events properly
                  progressiveEventRendering={true}  // Better performance for many events
                  eventDidMount={(info) => {
                    // Placeholder for future event mount logic
                  }}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={4}  // Show up to 4 events, then "+X more" link
                  weekends={true}
                  fixedWeekCount={false}  // Don't force 6 weeks
                  eventMaxStack={Infinity}  // Show all events stacked
                  nowIndicator={true}
                  height="100%"
                  scrollTime={(() => {
                    // Get current time minus 2 hours for better visibility
                    const now = new Date();
                    const hours = Math.max(0, now.getHours() - 2);
                    return `${hours.toString().padStart(2, '0')}:00:00`;
                  })()}
                  scrollTimeReset={false}
                  eventClassNames={(arg) => {
                    const classes = [];
                    
                    // Check if it's a multi-day event
                    const isMultiDay = arg.event.allDay && arg.event.start && arg.event.end && 
                      arg.event.start.toDateString() !== arg.event.end.toDateString();
                    if (isMultiDay || arg.event.extendedProps?.isTrueMultiDay) {
                      classes.push('fc-multi-day-event');
                    }
                    
                    // Add task-specific classes
                    if (arg.event.extendedProps?.type === 'task') {
                      classes.push('fc-event-task');
                      const priority = arg.event.extendedProps?.taskData?.priority || 'normal';
                      if (priority === 'urgent') classes.push('urgent');
                      else if (priority === 'high') classes.push('high-priority');
                      else if (priority === 'low') classes.push('low-priority');
                    }
                    
                    return classes;
                  }}
                  dayCellClassNames={(arg) => {
                    const classes = ['cal-cell'];
                    if (arg.isToday) classes.push('today');
                    if (arg.dow === 0 || arg.dow === 6) classes.push('weekend');
                    return classes;
                  }}
                    viewClassNames="cal-grid-enhanced"
                    select={(info) => {
                      setSelectedDateInfo(info);
                      setShowEventModal(true);
                    }}
                    eventClick={(info) => {
                      // Handle event click
                      console.log('Event clicked:', info.event);
                    }}
                    datesSet={(dateInfo) => {
                      setCurrentViewTitle(dateInfo.view.title);
                      
                      // Auto-scroll to current time when switching to week/day view
                      if (dateInfo.view.type === 'timeGridWeek' || dateInfo.view.type === 'timeGridDay') {
                        setTimeout(() => {
                          const api = calendarRef.current?.getApi();
                          if (api) {
                            const now = new Date();
                            const hours = Math.max(0, now.getHours() - 2);
                            const scrollTime = `${hours.toString().padStart(2, '0')}:00:00`;
                            api.scrollToTime(scrollTime);
                          }
                        }, 100);
                      }
                    }}
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
              setContextMenu({ x: e.clientX, y: e.clientY, task, listId });
            }}
          />
        )}
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
                start: eventData.start,  // Pass the full start object
                end: eventData.end,      // Pass the full end object
                calendarId: eventData.calendarId,
                location: eventData.location,
                attendees: eventData.attendees ? eventData.attendees.map((email: string) => ({ email })) : []
              };
              console.log('📅 Creating event with data:', eventToCreate);
              await createCalendarEvent(eventToCreate);
            }
            console.log('📅 Refreshing calendar events...');
            await fetchCalendarEvents();
            console.log('📅 Calendar events refreshed');
          } catch (error) {
            console.error('❌ Failed to save event:', error);
            alert(`Failed to save event: ${error}`);
          }
        }}
        onDelete={async (eventId) => {
          try {
            await deleteCalendarEvent(eventId);
            await fetchCalendarEvents();
          } catch (error) {
            console.error('Failed to delete event:', error);
          }
        }}
        calendars={calendars}
      />

      {/* Task Modal */}
      {showTaskModal && (
        <AsanaTaskModal
          isOpen={showTaskModal}
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSubmit={async (data) => {
            try {
              const listId = selectedTaskListId === 'all' ? taskLists[0]?.id : selectedTaskListId;
              if (!listId) return;
              
              if (editingTask) {
                await updateGoogleTask(listId, editingTask.id, data);
              } else {
                await createGoogleTask(listId, data);
              }
              
              setShowTaskModal(false);
              setEditingTask(null);
            } catch (error) {
              console.error('Failed to save task:', error);
              setError('Failed to save task. Please try again.');
            }
          }}
          onDelete={editingTask ? () => {
            setTaskToDelete(editingTask);
            setShowDeleteTaskDialog(true);
            setShowTaskModal(false);
            setEditingTask(null);
          } : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteTaskDialog && taskToDelete && (
        <ConfirmDialog
          isOpen={showDeleteTaskDialog}
          title="Delete task?"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              const taskListId = Object.keys(googleTasks).find(listId => 
                googleTasks[listId].some(t => t.id === taskToDelete.id)
              );
              
              if (taskListId) {
                await deleteGoogleTask(taskListId, taskToDelete.id);
              }
              
              setShowDeleteTaskDialog(false);
              setTaskToDelete(null);
            } catch (error) {
              console.error('Error deleting task:', error);
              setError('Failed to delete task. Please try again.');
            }
          }}
          onCancel={() => {
            setShowDeleteTaskDialog(false);
            setTaskToDelete(null);
          }}
        />
      )}

      {/* Context Menu */}
      <TaskContextMenu
        contextMenu={contextMenu}
        onEdit={(task) => {
          setEditingTask(task);
          setShowTaskModal(true);
        }}
        onSchedule={(task) => {
          console.log('Schedule task:', task);
        }}
        onDuplicate={async (task) => {
          const listId = contextMenu?.listId || selectedTaskListId;
          await createGoogleTask(listId, {
            title: `${task.title} (Copy)`,
            notes: task.notes,
            due: task.due,
          });
        }}
        onUpdatePriority={(task, priority) => {
          const { updateTask, getTaskByGoogleId } = useUnifiedTaskStore.getState();
          const unifiedTask = getTaskByGoogleId(task.id);
          if (unifiedTask) {
            updateTask(unifiedTask.id, { priority });
          }
        }}
        onDelete={(task) => {
          setTaskToDelete(task);
          setShowDeleteTaskDialog(true);
        }}
        onClose={() => setContextMenu(null)}
      />

      {/* Add custom styles for calendar */}
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
          
          /* Typography Scale */
          --text-xs: 11px;
          --text-sm: 12px;
          --text-base: 13px;
          --text-md: 14px;
          --text-lg: 16px;
          
          /* Colors - Match Tasks */
          --color-text-primary: #222;
          --color-text-secondary: #666;
          --color-text-tertiary: #999;
          --color-border-light: #f0f0f0;
          --color-border-medium: #e8e8e8;
          --color-bg-hover: #f7f7f7;
          --color-bg-active: #f0f0f0;
          
          /* Shadows */
          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
          --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.12);
          
          /* Border Radius */
          --radius-sm: 4px;
          --radius-md: 6px;
          --radius-lg: 8px;
        }
        
        /* Base Typography - Consistent System */
        .asana-calendar-view {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        /* Week/Day View - Professional Time Grid */
        .fc-timegrid {
          background: #fafafa !important;
        }
        
        .fc-timegrid-cols {
          background: #fff !important;
        }
        
        .fc-timegrid-slot {
          height: 48px !important; /* 12 * 4px grid */
          border-bottom: 1px solid #e8e8e8 !important;
          border-left: none !important;
          border-right: none !important;
        }
        
        /* Hour markers - system font style */
        .fc-timegrid-slot-label {
          color: #999 !important;
          font-weight: 400 !important;
          font-size: 11px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          padding-right: 8px !important;
        }
        
        .fc-timegrid-slot-label-cushion {
          padding: 2px 4px !important;
        }
        
        /* Subtle hour separators */
        .fc-timegrid-slot.fc-timegrid-slot-major {
          border-bottom-color: #e8e8e8 !important;
          border-bottom-width: 1px !important;
        }
        
        .fc-timegrid-slot.fc-timegrid-slot-minor {
          border-bottom: none !important;
        }
        
        /* Time axis width */
        .fc-timegrid-axis {
          width: 50px !important;
          border-right: 1px solid #e8e8e8 !important;
        }
        
        /* Active hour indication */
        .fc-timegrid-now-indicator-container {
          z-index: 5 !important;
        }
        
        .fc-timegrid-now-indicator-line {
          border-color: #796EFF !important;
          border-width: 2px !important;
        }
        
        /* Current hour slot highlight */
        .fc-timegrid-col.fc-day-today {
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(121, 110, 255, 0.02) 10%, 
            rgba(121, 110, 255, 0.02) 90%, 
            transparent 100%
          ) !important;
        }
        
        /* Grid lines - match task card separators */
        .fc-col-header-cell,
        .fc-daygrid-day,
        .fc-timegrid-col {
          border-color: #e8e8e8 !important;
          border-width: 1px !important;
        }
        
        .fc-timegrid-cols {
          border-right-color: #e8e8e8 !important;
        }
        
        .fc-scrollgrid-sync-table {
          border-color: #e8e8e8 !important;
        }
        
        /* Month View - Clean grid with proper spacing */
        .fc-daygrid-day {
          background: #fff !important;
          transition: background-color 0.15s ease !important;
        }
        
        .fc-daygrid-day:hover {
          background-color: rgba(0, 0, 0, 0.02) !important;
        }
        
        .fc-daygrid-day-frame {
          padding: var(--space-2) !important;
          min-height: calc(var(--space-4) * 5) !important; /* 80px on 4px grid */
        }
        
        .fc-daygrid-day.fc-day-today {
          background-color: rgba(121, 110, 255, 0.03) !important;
        }
        
        /* Event Styling - Modern Card System */
        .fc-event {
          border: none !important;
          border-radius: var(--radius-sm) !important;
          font-weight: 500 !important;
          font-size: var(--text-base) !important;
          padding: var(--space-2) var(--space-3) !important;
          background-color: #fff !important;
          border: 1px solid var(--color-border-medium) !important;
          color: var(--color-text-primary) !important;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        
        .fc-event:hover {
          background-color: #f2f3f7 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
          border-color: rgba(0, 0, 0, 0.08) !important;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        
        .fc-event:active {
          background-color: #e8e9ed !important;
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.05s ease;
        }
        
        /* Remove ALL vertical accent bars */
        .fc-event::before,
        .fc-event::after,
        .fc-daygrid-event::before {
          display: none !important;
        }
        
        /* ALL EVENTS - Light purple background, NO SIDE ACCENTS */
        .fc-event {
          background-color: #f3f0ff !important;
          border: 1px solid #e0dcff !important;
          border-left: 1px solid #e0dcff !important;
          border-radius: 6px !important;
        }
        
        .fc-event:hover {
          background-color: #ebe7ff !important;
          border-color: #d4ceff !important;
        }
        
        /* Month view events - Clean cards with interaction */
        .fc-daygrid-event {
          margin: var(--space-1) !important;
          padding: var(--space-1) var(--space-2) !important;
          position: relative !important;
          overflow: hidden !important;
          max-width: 100% !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        
        .fc-daygrid-event-harness {
          max-width: 100% !important;
          overflow: hidden !important;
        }
        
        .fc-daygrid-event:hover {
          background-color: var(--color-bg-hover) !important;
          border-color: var(--color-border-medium) !important;
          box-shadow: var(--shadow-sm);
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
        
        /* Typography System - Consistent Hierarchy */
        
        /* Date headers */
        .fc-col-header-cell {
          background-color: #fafafa !important;
          border-color: var(--color-border-light) !important;
          padding: var(--space-2) 0 !important;
        }
        
        .fc-col-header-cell-cushion {
          color: #444 !important;
          font-weight: 600 !important;
          font-size: var(--text-base) !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        
        /* Time labels */
        .fc-timegrid-slot-label-cushion {
          color: var(--color-text-tertiary) !important;
          font-weight: 400 !important;
          font-size: var(--text-sm) !important;
        }
        
        /* Event titles */
        .fc-event-title {
          font-size: var(--text-base) !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          color: var(--color-text-primary) !important;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Event time */
        .fc-event-time {
          font-size: var(--text-sm) !important;
          font-weight: 400 !important;
          color: var(--color-text-tertiary) !important;
        }
        
        /* Day numbers in month view */
        .fc-daygrid-day-number {
          font-size: var(--text-base) !important;
          font-weight: 500 !important;
          color: #444 !important;
          padding: var(--space-2) !important;
        }
        
        .fc-day-today .fc-daygrid-day-number {
          color: #796EFF !important;
          font-weight: 600 !important;
          background: rgba(121, 110, 255, 0.1) !important;
          border-radius: var(--radius-sm) !important;
        }
        
        /* 5. All-day row - Clean extension of grid */
        .fc-daygrid-day-bg .fc-daygrid-bg-harness {
          display: none !important;
        }
        
        .fc-scrollgrid-section-liquid {
          height: auto !important;
        }
        
        .fc-daygrid-body {
          background: #fff !important;
        }
        
        /* Clean borders throughout */
        .fc-scrollgrid,
        .fc-scrollgrid-section > td,
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #f1f1f1 !important;
        }
        
        /* More links styling */
        .fc-more-link,
        .fc-daygrid-more-link {
          color: #796EFF !important;
          font-weight: 500 !important;
          font-size: 12px !important;
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
          left: 20px;
          width: 12px;
          height: 12px;
          background: white;
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          transform: rotate(45deg);
          z-index: -1;
        }
        
        .fc-popover-header {
          background-color: #fafafa !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
          padding: 8px 12px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          color: #222 !important;
        }
        
        .fc-popover-body {
          padding: 8px !important;
          background-color: white !important;
          max-height: 320px !important;
          overflow-y: auto !important;
          font-size: 13px !important;
        }
        
        /* Events in popover - tighter inset shadow, reduced radius */
        .fc-popover-body .fc-event {
          margin-bottom: 4px !important;
          padding: 6px 10px !important;
          border-radius: 4px !important;
          background: #fafafa !important;
          border: 1px solid #e8e8e8 !important;
          box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.02) !important;
          transition: all 0.1s ease !important;
        }
        
        .fc-popover-body .fc-event:hover {
          background: #fff !important;
          border-color: #d0d0d0 !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }
        
        /* More link - match "+ Add task" button style */
        .fc-more-link,
        .fc-daygrid-more-link {
          color: #2563EB !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          opacity: 1 !important;
          padding: 4px 8px !important;
          border: 1px dashed #2563EB !important;
          border-radius: 6px !important;
          background-color: transparent !important;
          transition: all 0.15s ease !important;
          display: inline-block !important;
          margin: 2px 0 !important;
        }
        
        .fc-more-link:hover,
        .fc-daygrid-more-link:hover {
          text-decoration: none !important;
          background-color: #EFF6FF !important;
          border-color: #2563EB !important;
          color: #1D4ED8 !important;
        }
        
        /* Remove all unnecessary visual weight */
        .fc-daygrid-event-dot {
          display: none !important;
        }
        
        .fc-daygrid-day.fc-day-today {
          background-color: #fafafa !important;
        }
        
        .fc-highlight {
          background-color: rgba(121, 110, 255, 0.1) !important;
        }
        
        /* Enable proper scrolling for week/day views */
        .cal-asana-grid .fc {
          height: 100% !important;
        }
        
        .cal-asana-grid .fc-view-harness {
          height: 100% !important;
        }
        
        /* Month view - no scroll */
        .cal-asana-grid .fc-daygrid {
          height: 100% !important;
          overflow: hidden !important;
        }
        
        /* Week/Day views - enable scroll */
        .cal-asana-grid .fc-timegrid .fc-scroller {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scroll-behavior: smooth !important;
          max-height: calc(100vh - 280px) !important; /* Account for header and controls */
        }
        
        .cal-asana-grid .fc-daygrid .fc-scroller {
          overflow: hidden !important;
        }
        
        /* Fix all-day event scrollbar issue */
        .fc-daygrid-day-events {
          overflow: visible !important;
          max-height: none !important;
        }
        
        .fc-daygrid-day-frame {
          overflow: visible !important;
        }
        
        .fc-daygrid-event-harness {
          overflow: visible !important;
        }
        
        .fc-daygrid-body {
          overflow: visible !important;
        }
        
        .fc-daygrid-day {
          overflow: visible !important;
        }
        
        /* Week and Day View - Minimal styling */
        .fc-timegrid {
          border-color: #f1f1f1 !important;
        }
        
        /* Time labels */
        .fc-timegrid-axis {
          background-color: #fafafa !important;
          border-color: #f1f1f1 !important;
        }
        
        .fc-timegrid-axis-cushion,
        .fc-timegrid-slot-label-cushion {
          color: #999 !important;
          font-size: 12px !important;
          font-weight: 400 !important;
        }
        
        /* All-day section - consistent task card spacing */
        .fc-timegrid-divider {
          border-color: #e8e8e8 !important;
          background-color: #fafafa !important;
          padding: 8px 0 !important;
        }
        
        .fc-timegrid .fc-scrollgrid-section:first-child {
          min-height: 40px !important;
        }
        
        .fc-timegrid .fc-scrollgrid-section:first-child > td {
          padding: 8px !important;
        }
        
        .fc-timegrid-all-day-slot {
          min-height: 36px !important;
          padding: 6px 8px !important;
          vertical-align: middle !important;
        }
        
        .fc-timegrid .fc-daygrid-body {
          min-height: 36px !important;
        }
        
        .fc-timegrid .fc-daygrid-day-frame {
          padding: 6px !important;
          min-height: 36px !important;
        }
        
        /* Time grid slots */
        .fc-timegrid-slot {
          border-color: #f0f0f0 !important;
        }
        
        .fc-timegrid-slot-minor {
          border-style: none !important;
        }
        
        /* Week/Day view events - Consistent light purple */
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
        
        /* Day view layout */
        .fc-timegrid-col {
          border-color: #f1f1f1 !important;
        }
        
        .fc-timegrid-col-bg {
          background-color: #fff !important;
        }
        
        /* Today column - very subtle */
        .fc-day-today .fc-timegrid-col-bg {
          background-color: #fafafa !important;
        }
        
        /* Event spacing */
        .fc-timegrid-event-harness-inset .fc-timegrid-event {
          margin: 0 2px !important;
        }
        
        /* Day view density */
        .fc-timegrid .fc-daygrid-body {
          row-gap: 2px !important;
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
        
        /* Remove extra visual elements */
        .fc-timegrid-axis-frame,
        .fc-timegrid-axis-chunk {
          border: none !important;
        }
        
        /* Clean week/day headers */
        .fc-timegrid .fc-col-header-cell {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #777 !important;
        }
      `}</style>
    </div>
    </>
  );
}
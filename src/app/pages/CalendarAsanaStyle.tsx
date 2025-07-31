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
    if (!searchQuery) return calendarEventsWithTasks;
    
    const query = searchQuery.toLowerCase();
    return calendarEventsWithTasks.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.extendedProps?.description?.toLowerCase().includes(query) ||
      event.extendedProps?.location?.toLowerCase().includes(query)
    );
  }, [calendarEventsWithTasks, searchQuery]);

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
          <div className="cal-asana-calendar-wrapper flex-1 overflow-hidden" style={{ paddingRight: '0' }}>
            <div className="cal-asana-grid h-full">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={view}
                  headerToolbar={false}
                  events={filteredCalendarEvents}
                  eventContent={(arg) => <CalendarEventContent arg={arg} />}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  nowIndicator={true}
                  height="100%"
                  eventClassNames="cal-asana-event"
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
            if (eventData.id) {
              await updateCalendarEvent(eventData.id, eventData);
            } else {
              await createCalendarEvent({
                summary: eventData.title,
                description: eventData.description,
                start: { dateTime: eventData.start },
                end: { dateTime: eventData.end },
                calendarId: eventData.calendarId,
                location: eventData.location,
                attendees: eventData.attendees.map((email: string) => ({ email }))
              });
            }
            await fetchCalendarEvents();
          } catch (error) {
            console.error('Failed to save event:', error);
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
        .asana-calendar-view {
          font-family: var(--font-sans) !important;
        }
        
        .asana-calendar-day {
          border-color: #E8E8E9 !important;
          background-color: #FFFFFF;
        }
        
        .asana-calendar-day.fc-day-today {
          background-color: #F9FAFB !important;
        }
        
        .fc-day-number {
          color: #151B26;
          font-weight: 500;
          font-size: 14px;
          padding: 8px !important;
        }
        
        .fc-daygrid-day-frame {
          padding: 0 !important;
        }
        
        .fc-daygrid-day-top {
          display: flex;
          justify-content: flex-start;
          padding: 4px 8px;
        }
        
        .fc-daygrid-event {
          margin: 2px 4px;
          border: none;
          font-size: 13px;
        }
        
        .fc-event {
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .fc-event-time {
          font-weight: 400;
          opacity: 0.8;
        }
        
        .fc-event-title {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .fc-h-event {
          border: none;
          background-color: #796EFF;
        }
        
        .fc-daygrid-event-harness {
          margin-top: 1px;
        }
        
        .fc-col-header-cell {
          background-color: #FAFBFC;
          border-color: #E8E8E9 !important;
          padding: 12px 0;
        }
        
        .fc-col-header-cell-cushion {
          color: #6B6F76;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .fc-scrollgrid,
        .fc-scrollgrid-section > td {
          border-color: #E8E8E9 !important;
        }
        
        .fc-daygrid-body {
          border-color: #E8E8E9 !important;
        }
        
        .fc-more-link {
          color: #796EFF;
          font-weight: 500;
          font-size: 12px;
        }
        
        .fc-daygrid-day.fc-day-other {
          background-color: #FAFBFC;
        }
        
        .fc-daygrid-day-events {
          margin-top: 4px;
        }
        
        .fc-popover {
          border-color: #E8E8E9;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .fc-popover-header {
          background-color: #F6F7F8;
          border-color: #E8E8E9;
          padding: 8px 12px;
          font-weight: 600;
          color: #151B26;
        }
        
        .cal-event {
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 13px;
          line-height: 1.3;
          overflow: hidden;
        }
        
        .fc-event-main {
          padding: 4px 8px;
        }
        
        .fc-daygrid-day-events {
          margin-top: 4px;
        }
        
        .fc-daygrid-more-link {
          color: #796EFF !important;
          font-weight: 500;
          font-size: 12px;
        }
        
        .fc-timegrid-slot {
          height: 60px;
          border-color: #E8E8E9 !important;
        }
        
        .fc-timegrid-slot-label {
          color: #9CA6AF;
          font-size: 12px;
          font-weight: 400;
        }
        
        .fc-scrollgrid {
          border-color: #E8E8E9 !important;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #E8E8E9 !important;
        }
        
        /* Ensure calendar fits in viewport */
        .cal-asana-grid .fc {
          height: 100% !important;
        }
        
        .cal-asana-grid .fc-view-harness {
          height: 100% !important;
        }
        
        .cal-asana-grid .fc-daygrid {
          height: 100% !important;
        }
      `}</style>
    </div>
    </>
  );
}
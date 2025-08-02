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
  CheckSquare, CheckCircle2, Circle, MoreHorizontal, User, Tag, Clock,
  MapPin, Users, FileText, Calendar, ArrowUpDown
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Button, Card, Text, Heading, Input } from '../../components/ui';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useHeader } from '../contexts/HeaderContext';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { DropArg } from '@fullcalendar/interaction';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { devLog } from '../../utils/devLog';
import type { GoogleTask } from '../../types/google';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { googleTasksApi } from '../../api/googleTasksApi';
import { realtimeSync } from '../../services/realtimeSync';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { UnifiedTaskCard } from '../../components/tasks/UnifiedTaskCard';
import { InlineTaskCreator } from '../../components/kanban/InlineTaskCreator';
import './styles/calendar-experiment.css';
import './styles/calendar-asana.css'; // Asana style design
import '../../styles/asana-tokens.css';
import '../../styles/asana-design-system.css';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Asana Style View Controls Component
const AsanaViewControls = ({ 
  currentView, 
  onViewChange, 
  onToday,
  calendarRef 
}: { 
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  calendarRef: React.RefObject<FullCalendar>;
}) => {
  const viewOptions = [
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'timeGridWeek', label: 'Week' },
    { value: 'timeGridDay', label: 'Day' },
  ] as const;

  return (
    <div className="cal-asana-view-controls">
      {viewOptions.map(option => (
        <button
          key={option.value}
          className={`cal-asana-view-btn ${currentView === option.value ? 'active' : ''}`}
          onClick={() => onViewChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Asana Search Bar Component
const AsanaSearchBar = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  return (
    <div className="cal-asana-search-container" style={{ width: '100%', maxWidth: '500px' }}>
      <Search size={16} className="cal-asana-search-icon" />
      <input
        type="text"
        className="cal-asana-search"
        placeholder="Search events and tasks..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  );
};

// Simple Asana-style Date Picker
const AsanaDatePicker = ({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: string; 
  onChange: (date: string) => void; 
  onClose: () => void; 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedDate = value ? new Date(value + 'T00:00') : null;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };
  
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    onChange(dateStr);
    onClose();
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  return (
    <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4" style={{ minWidth: '300px' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day.date)}
            className={`
              p-2 text-sm rounded-lg transition-colors
              ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
              ${isToday(day.date) ? 'font-semibold' : ''}
              ${isSelected(day.date) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            `}
            disabled={!day.isCurrentMonth}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          onClick={() => {
            onChange('');
            onClose();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// Asana Style Event Modal Component
const AsanaEventModal = ({ 
  isOpen, 
  onClose,
  event,
  onSave,
  onDelete,
  calendars
}: {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  onSave: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  calendars: any[];
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.extendedProps?.description || '');
      setStartDate(event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm") : '');
      setEndDate(event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm") : '');
      setCalendarId(event.extendedProps?.calendarId || calendars[0]?.id || '');
      setLocation(event.extendedProps?.location || '');
      setAttendees(event.extendedProps?.attendees?.join(', ') || '');
    } else {
      // Reset for new event
      setTitle('');
      setDescription('');
      setCalendarId(calendars[0]?.id || '');
      setLocation('');
      setAttendees('');
    }
  }, [event, calendars]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    const eventData = {
      id: event?.id,
      title,
      description,
      start: startDate,
      end: endDate,
      calendarId,
      location,
      attendees: attendees.split(',').map(a => a.trim()).filter(Boolean)
    };
    onSave(eventData);
    onClose();
  };
  
  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };
  
  return (
    <div className="cal-asana-modal-overlay" onClick={onClose}>
      <div className="cal-asana-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-asana-modal-header">
          <h2 className="cal-asana-modal-title">{event ? 'Edit Event' : 'New Event'}</h2>
          <button
            onClick={onClose}
            className="cal-asana-modal-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="cal-asana-modal-body">
          
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Title</label>
            <input
              type="text"
              className="cal-asana-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>
          
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Calendar</label>
            <select
              className="cal-asana-input cal-asana-select"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            >
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                </option>
              ))}
            </select>
          </div>
            
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Date</label>
            <div className="relative">
              <button
                type="button"
                className="cal-asana-input w-full text-left flex items-center justify-between"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <span>
                  {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Select date'}
                </span>
                <Calendar size={16} className="text-gray-400" />
              </button>
              {showDatePicker && (
                <AsanaDatePicker
                  value={startDate ? startDate.split('T')[0] : ''}
                  onChange={(date) => {
                    const time = startDate ? startDate.split('T')[1] : '09:00';
                    setStartDate(date + 'T' + time);
                    if (!endDate) {
                      setEndDate(date + 'T10:00');
                    }
                    setShowDatePicker(false);
                  }}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>
          </div>
          
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Time</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                className="cal-asana-input"
                value={startDate ? startDate.split('T')[1] : '09:00'}
                onChange={(e) => {
                  const date = startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                  setStartDate(date + 'T' + e.target.value);
                }}
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="time"
                className="cal-asana-input"
                value={endDate ? endDate.split('T')[1] : '10:00'}
                onChange={(e) => {
                  const date = endDate ? endDate.split('T')[0] : startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                  setEndDate(date + 'T' + e.target.value);
                }}
              />
            </div>
          </div>
            
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Location</label>
            <input
              type="text"
              className="cal-asana-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </div>
          
          <div className="cal-asana-form-group">
            <label className="cal-asana-label">Description</label>
            <textarea
              className="cal-asana-input cal-asana-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
            />
          </div>
        </div>
          
        <div className="cal-asana-modal-footer">
          <button className="cal-asana-btn cal-asana-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="cal-asana-btn cal-asana-btn-primary" onClick={handleSave}>
            {event ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Calendar Component with Experimental Design
export default function CalendarExperiment() {
  // Deprecation warning
  useEffect(() => {
    console.warn(
      '⚠️ DEPRECATED: CalendarExperiment uses FullCalendar which is being replaced.\n' +
      '🚨 DO NOT ADD NEW FEATURES TO THIS FILE.\n' +
      '✅ Use CalendarBigCalendarExperiment.tsx for all new development.\n' +
      '📅 This component will be removed in a future release.'
    );
  }, []);
  const { clearHeaderProps } = useHeader();
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [showTasksSidebar, setShowTasksSidebar] = useState(true);
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const activeAccount = useActiveGoogleAccount();

  // Store hooks
  const { 
    calendars,
    events, 
    fetchData,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading: isCalendarLoading 
  } = useGoogleCalendarStore();
  
  const { tasks, columns, getTasksByColumn, createTask, addColumn } = useUnifiedTaskStore();
  
  // Log to see what data we have
  console.log('Calendar - columns:', columns);
  console.log('Calendar - tasks:', tasks);

  useEffect(() => {
    clearHeaderProps();
    // Initialize realtime sync and force data fetch
    const init = async () => {
      await realtimeSync.initialize();
      await realtimeSync.syncNow();
      
      // Set the first available task list as selected
      if (!selectedTaskListId && columns.length > 0) {
        const firstColumn = columns.find(c => c.googleTaskListId);
        if (firstColumn) {
          setSelectedTaskListId(firstColumn.googleTaskListId || '');
        }
      }
    };
    init();
    return () => clearHeaderProps();
  }, [clearHeaderProps, columns, addColumn, selectedTaskListId]);

  useEffect(() => {
    // Initialize data
    const initializeData = async () => {
      try {
        await fetchData ? fetchData() : Promise.resolve();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize calendar data:', error);
        setIsInitialized(true); // Still show UI even if data fails
      }
    };
    
    initializeData();
  }, [fetchData]);

  // Sync when active account changes, just like the tasks page
  useEffect(() => {
    if (activeAccount) {
      handleSync();
    }
  }, [activeAccount]);

  // Set initial selected task list when columns load
  useEffect(() => {
    if (!selectedTaskListId && columns.length > 0) {
      const firstColumn = columns.find(c => c.googleTaskListId);
      if (firstColumn && firstColumn.googleTaskListId) {
        setSelectedTaskListId(firstColumn.googleTaskListId);
      }
    }
  }, [columns, selectedTaskListId]);

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setCurrentCalendarDate(new Date());
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        fetchData(),
        realtimeSync.syncNow() // THIS SYNCS THE TASKS DATA
      ]);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Event handlers
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setIsModalOpen(true);
    // Pre-populate dates
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const event = dropInfo.event;
    const updatedEvent = {
      id: event.id,
      start: event.start?.toISOString(),
      end: event.end?.toISOString(),
    };
    
    try {
      await updateEvent(event.id, updatedEvent);
    } catch (error) {
      console.error('Failed to update event:', error);
      dropInfo.revert();
    }
  };

  const handleEventSave = async (eventData: any) => {
    try {
      if (eventData.id) {
        await updateEvent(eventData.id, eventData);
      } else {
        await createEvent({
          summary: eventData.title,
          description: eventData.description,
          start: { dateTime: eventData.start },
          end: { dateTime: eventData.end },
          calendarId: eventData.calendarId,
          location: eventData.location,
          attendees: eventData.attendees.map((email: string) => ({ email }))
        });
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };


  // Convert calendar events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      allDay: !event.start?.dateTime,
      backgroundColor: calendars.find(cal => cal.id === event.calendarId)?.backgroundColor || '#3788d8',
      borderColor: calendars.find(cal => cal.id === event.calendarId)?.backgroundColor || '#3788d8',
      extendedProps: {
        ...event,
        isTask: false
      }
    }));
  }, [events, calendars]);

  // Show loading state briefly to prevent flicker
  if (!isInitialized && isCalendarLoading) {
    return (
      <div className="cal-asana-loading">
        <RefreshCw className="cal-asana-loading-spinner" size={24} />
        <span>Loading calendar...</span>
      </div>
    );
  }

  // Show loading state briefly to prevent flicker
  if (!isInitialized && isCalendarLoading) {
    return (
      <div className="cal-asana-loading">
        <RefreshCw className="cal-asana-loading-spinner" size={24} />
        <span>Loading calendar...</span>
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
      <div className="flex items-center px-6 py-3" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
            {/* Left side - Today, Navigation and Title */}
            <div className="flex items-center gap-4" style={{ flex: '1 1 0' }}>
              <button 
                onClick={handleToday}
                className="cal-asana-today-btn"
              >
                Today
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    calendarRef.current?.getApi().prev();
                    if (calendarRef.current) {
                      setCurrentCalendarDate(calendarRef.current.getApi().getDate());
                    }
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => {
                    calendarRef.current?.getApi().next();
                    if (calendarRef.current) {
                      setCurrentCalendarDate(calendarRef.current.getApi().getDate());
                    }
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <h1 style={{ 
                fontSize: '20px',
                fontWeight: 600,
                color: '#151B26',
                margin: 0
              }}>
                {format(currentCalendarDate, 'MMMM yyyy')}
              </h1>
            </div>
            
            {/* Center - Search */}
            <div className="flex items-center justify-center" style={{ flex: '1 1 0' }}>
              <AsanaSearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            
            {/* Right side - View Controls and New Event */}
            <div className="flex items-center gap-4 justify-end" style={{ flex: '1 1 0' }}>
              <AsanaViewControls
                currentView={currentView}
                onViewChange={handleViewChange}
                onToday={handleToday}
                calendarRef={calendarRef}
              />
              
              {/* Refresh button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#F6F7F8',
                  color: '#6B6F76',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8E9EA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F6F7F8';
                }}
                title="Refresh"
              >
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              </button>
              
              {/* Toggle tasks sidebar button */}
              <button
                onClick={() => setShowTasksSidebar(!showTasksSidebar)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#F6F7F8',
                  color: '#6B6F76',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8E9EA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F6F7F8';
                }}
                title={showTasksSidebar ? "Hide tasks" : "Show tasks"}
              >
                <ListChecks size={18} />
              </button>
              
              <button
                className="cal-asana-btn cal-asana-btn-primary flex items-center gap-2"
                onClick={() => {
                  setSelectedEvent(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={18} />
                New event
              </button>
            </div>
      </div>

      {/* Main Content Area - Calendar and Sidebar */}
      <div className="flex h-full gap-6 bg-primary p-6" style={{ flexGrow: 1 }}>
        {/* Calendar Section */}
        <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="cal-asana-calendar-wrapper" style={{ paddingRight: '0' }}>
            <div className="cal-asana-grid">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                headerToolbar={false} // We use our custom controls
                events={calendarEvents}
                height="100%"
                editable={true}
                droppable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                eventClassNames="cal-asana-event"
                dateClick={handleDateSelect}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                dayCellClassNames={(arg) => {
                  const classes = ['cal-cell'];
                  if (arg.isToday) classes.push('today');
                  if (arg.dow === 0 || arg.dow === 6) classes.push('weekend');
                  return classes;
                }}
                eventContent={(arg: EventContentArg) => {
                  const isTask = arg.event.extendedProps.isTask;
                  return (
                    <div className="cal-event-content">
                      {isTask && <CheckSquare size={12} className="mr-1" />}
                      <span className="truncate">{arg.event.title}</span>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Task Sidebar */}
        {showTasksSidebar && (
          <div className="border-border-primary flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
              <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
              {/* Custom header with dropdown */}
              <div style={{ width: '100%' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E1E1F', margin: 0 }}>Tasks</h3>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#6B6F76',
                      backgroundColor: '#F3F4F6',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {(() => {
                        const selectedColumn = columns.find(c => c.googleTaskListId === selectedTaskListId);
                        return selectedColumn ? getTasksByColumn(selectedColumn.id).length : 0;
                      })()}
                    </span>
                  </div>
                  
                  {/* Sort button */}
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Sort tasks"
                  >
                    <ArrowUpDown size={14} style={{ color: '#6B6F76' }} />
                  </button>
                </div>
                
                {/* Google Lists Dropdown */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <select
                    value={selectedTaskListId}
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 12px',
                      border: '1px solid #E8E8E9',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#1E1E1F',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#796EFF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E8E8E9';
                    }}
                    onChange={(e) => setSelectedTaskListId(e.target.value)}
                  >
                    {columns.length === 0 && <option value="">No task lists available</option>}
                    {columns.map(column => (
                      column.googleTaskListId && (
                        <option key={column.id} value={column.googleTaskListId}>
                          {column.title}
                        </option>
                      )
                    ))}
                  </select>
                  <ChevronDown 
                    size={16} 
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#6B6F76'
                    }}
                  />
                </div>
                
                {/* Add task button / Inline Creator */}
                {!showInlineCreator ? (
                  <button
                    onClick={() => setShowInlineCreator(true)}
                    className="flex items-center gap-2 w-full cursor-pointer mb-3 rounded-lg transition-all"
                    style={{ 
                      fontSize: '14px',
                      color: '#6B6F76',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: '1px dashed rgba(0, 0, 0, 0.08)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div className="asana-checkbox" style={{ width: '18px', height: '18px' }} />
                    <span>Add task</span>
                  </button>
                ) : (
                  <div className="mb-3">
                    <InlineTaskCreator
                      columnId="cal-sidebar-done"
                      onSubmit={async (data) => {
                        console.log('Calendar onSubmit called with:', data);
                        console.log('Selected task list ID:', selectedTaskListId);
                        console.log('Available columns:', columns);
                        
                        try {
                          // Find the column by googleTaskListId
                          const targetColumn = columns.find(c => c.googleTaskListId === selectedTaskListId);
                          console.log('Target column:', targetColumn);
                          
                          if (!targetColumn) {
                            console.error('No column found for selected task list');
                            return;
                          }
                          
                          console.log('Creating task with:', {
                            title: data.title,
                            notes: data.notes,
                            due: data.due ? `${data.due}T00:00:00.000Z` : undefined,
                            columnId: targetColumn.id,
                            priority: data.priority || 'normal',
                            labels: data.labels || []
                          });
                          
                          await createTask({
                            title: data.title,
                            notes: data.notes,
                            due: data.due ? `${data.due}T00:00:00.000Z` : undefined,
                            columnId: targetColumn.id,
                            priority: data.priority || 'normal',
                            labels: data.labels || []
                          });
                          setShowInlineCreator(false);
                          
                          // Refresh tasks after creation
                          await realtimeSync.syncNow();
                        } catch (error) {
                          console.error('Failed to create task:', error);
                          throw error;
                        }
                      }}
                      onCancel={() => setShowInlineCreator(false)}
                    />
                  </div>
                )}
                
                {/* Tasks */}
                {(() => {
                  const selectedColumn = columns.find(c => c.googleTaskListId === selectedTaskListId);
                  if (!selectedColumn) return null;
                  
                  const columnTasks = getTasksByColumn(selectedColumn.id);
                  
                  if (columnTasks.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No tasks in this list
                      </div>
                    );
                  }
                  
                  return columnTasks.map(task => (
                    <UnifiedTaskCard
                      key={task.id}
                      task={task}
                      columnId={selectedColumn.id}
                      onToggle={async () => {
                        await useUnifiedTaskStore.getState().updateTask(task.id, {
                          completed: !task.completed,
                          status: task.completed ? 'needsAction' : 'completed'
                        });
                      }}
                      onEdit={() => {}}
                      onDelete={async () => {
                        await useUnifiedTaskStore.getState().deleteTask(task.id);
                      }}
                      onDuplicate={() => {}}
                    />
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Event Modal */}
      <AsanaEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        calendars={calendars}
      />
    </div>
    </>
  );
}
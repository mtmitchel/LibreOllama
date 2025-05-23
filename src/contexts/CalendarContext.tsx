
"use client";

import type { CalendarDisplayEvent, AvailableCalendar, CalendarViewMode, CalendarTask } from '@/lib/types';
import { mockCalendarEvents, mockAvailableCalendars, mockCalendarTasks } from '@/lib/mock-data';
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, set, format } from 'date-fns';

interface CalendarContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  currentViewMode: CalendarViewMode;
  setCurrentViewMode: (mode: CalendarViewMode) => void;
  
  displayedDateRange: { start: Date; end: Date };
  
  events: CalendarDisplayEvent[];
  addEvent: (newEventData: Omit<CalendarDisplayEvent, 'id' | 'color'>) => void;
  updateEvent: (updatedEventData: Omit<CalendarDisplayEvent, 'color'> & { id: string }) => void;
  deleteEvent: (eventId: string) => void;
  
  availableCalendars: AvailableCalendar[];
  setAvailableCalendars: React.Dispatch<React.SetStateAction<AvailableCalendar[]>>;
  toggleCalendarVisibility: (calendarId: string) => void;
  
  tasksForScheduling: CalendarTask[];
  setTasksForScheduling: React.Dispatch<React.SetStateAction<CalendarTask[]>>;
  
  visibleEvents: CalendarDisplayEvent[];

  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  goToToday: () => void;

  // Event Modal State
  isEventModalOpen: boolean;
  setIsEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingEvent: CalendarDisplayEvent | null;
  setEditingEvent: React.Dispatch<React.SetStateAction<CalendarDisplayEvent | null>>;
  selectedDateForNewEvent: Date | undefined; // For pre-filling date when creating new event
  setSelectedDateForNewEvent: React.Dispatch<React.SetStateAction<Date | undefined>>;


  isLeftPanelOpen: boolean; // Added for CalendarView layout
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDateState] = useState<Date>(new Date());
  const [currentViewMode, setCurrentViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarDisplayEvent[]>(mockCalendarEvents);
  const [availableCalendars, setAvailableCalendars] = useState<AvailableCalendar[]>(mockAvailableCalendars);
  const [tasksForScheduling, setTasksForScheduling] = useState<CalendarTask[]>(mockCalendarTasks);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarDisplayEvent | null>(null);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<Date | undefined>();


  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true); // For layout
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); 


  const setCurrentDate = (date: Date) => {
    setCurrentDateState(set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }));
  };

  const displayedDateRange = useMemo(() => {
    let start: Date, end: Date;
    const normalizedCurrentDate = set(currentDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

    switch (currentViewMode) {
      case 'day':
        start = normalizedCurrentDate;
        end = normalizedCurrentDate;
        break;
      case 'week':
        start = startOfWeek(normalizedCurrentDate, { weekStartsOn: 1 });
        end = endOfWeek(normalizedCurrentDate, { weekStartsOn: 1 });
        break;
      case 'month':
      default:
        start = startOfMonth(normalizedCurrentDate);
        end = endOfMonth(normalizedCurrentDate);
        break;
    }
    return { start, end };
  }, [currentDate, currentViewMode]);

  const toggleCalendarVisibility = (calendarId: string) => {
    setAvailableCalendars(prev =>
      prev.map(cal => (cal.id === calendarId ? { ...cal, isSelected: !cal.isSelected } : cal))
    );
  };
  
  const addEvent = (newEventData: Omit<CalendarDisplayEvent, 'id' | 'color'>) => {
    const calendar = availableCalendars.find(c => c.id === newEventData.calendarId);
    const newEvent: CalendarDisplayEvent = {
      ...newEventData,
      id: `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      color: calendar?.color,
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  const updateEvent = (updatedEventData: Omit<CalendarDisplayEvent, 'color'> & { id: string }) => {
    const calendar = availableCalendars.find(c => c.id === updatedEventData.calendarId);
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === updatedEventData.id ? { ...updatedEventData, color: calendar?.color } : event
      )
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };


  const visibleEvents = useMemo(() => {
    const selectedCalendarIds = new Set(availableCalendars.filter(c => c.isSelected).map(c => c.id));
    return events.filter(event => selectedCalendarIds.has(event.calendarId));
  }, [events, availableCalendars]);

  const goToNextPeriod = useCallback(() => {
    setCurrentDateState(prevDate => {
      switch (currentViewMode) {
        case 'day': return addDays(prevDate, 1);
        case 'week': return addDays(prevDate, 7);
        case 'month': return addMonths(prevDate, 1);
        default: return prevDate;
      }
    });
  }, [currentViewMode]);

  const goToPreviousPeriod = useCallback(() => {
    setCurrentDateState(prevDate => {
      switch (currentViewMode) {
        case 'day': return addDays(prevDate, -1);
        case 'week': return addDays(prevDate, -7);
        case 'month': return subMonths(prevDate, 1);
        default: return prevDate;
      }
    });
  }, [currentViewMode]);

  const goToToday = useCallback(() => {
    setCurrentDateState(set(new Date(),{hours:0, minutes:0, seconds:0, milliseconds:0}));
  }, []);


  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        currentViewMode,
        setCurrentViewMode,
        displayedDateRange,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        availableCalendars,
        setAvailableCalendars,
        toggleCalendarVisibility,
        tasksForScheduling,
        setTasksForScheduling,
        visibleEvents,
        goToNextPeriod,
        goToPreviousPeriod,
        goToToday,
        isEventModalOpen,
        setIsEventModalOpen,
        editingEvent,
        setEditingEvent,
        selectedDateForNewEvent,
        setSelectedDateForNewEvent,
        isLeftPanelOpen, 
        setIsLeftPanelOpen,
        isRightPanelOpen,
        setIsRightPanelOpen,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

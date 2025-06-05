import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CalendarDisplayEvent, 
  CalendarViewMode, 
  TaskItem, 
  EnergyLevel,
  ExtendedCalendarDisplayEvent 
} from '../lib/types';
import { useGoogleCalendar } from './use-google-integration';
import { useFocusMode } from './use-focus-mode';

export interface CalendarState {
  events: ExtendedCalendarDisplayEvent[];
  view: CalendarViewMode;
  selectedDate: Date;
  timeSlots: TimeSlot[];
  freeTimeSlots: FreeTimeSlot[];
  isLoading: boolean;
  error: string | null;
}

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  isAvailable: boolean;
  hasEvent: boolean;
  events: ExtendedCalendarDisplayEvent[];
}

export interface FreeTimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
  energySuitability: EnergyLevel;
  confidence: number; // 0-1 for AI confidence
  reasons: string[];
}

export interface CalendarOptions {
  workingHours: { start: number; end: number }; // 24h format
  timeSlotDuration: number; // in minutes
  minFreeSlotDuration: number; // in minutes
  energyOptimization: boolean;
  includeGoogleCalendar: boolean;
}

const DEFAULT_OPTIONS: CalendarOptions = {
  workingHours: { start: 9, end: 17 },
  timeSlotDuration: 30,
  minFreeSlotDuration: 15,
  energyOptimization: true,
  includeGoogleCalendar: true
};

export function useCalendar(options: Partial<CalendarOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [calendarState, setCalendarState] = useState<CalendarState>({
    events: [],
    view: 'week',
    selectedDate: new Date(),
    timeSlots: [],
    freeTimeSlots: [],
    isLoading: false,
    error: null
  });

  const { events: googleEvents, isLoading: googleLoading, loadTodaysEvents, loadUpcomingEvents } = useGoogleCalendar();
  const { focusMode } = useFocusMode();
  const [localEvents, setLocalEvents] = useState<ExtendedCalendarDisplayEvent[]>([]);
  const freeTimeAnalysisRef = useRef<NodeJS.Timeout>();

  // Generate time slots for the current view
  const generateTimeSlots = useCallback((date: Date, viewMode: CalendarViewMode): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startDate = new Date(date);
    
    // Adjust start date based on view mode
    if (viewMode === 'week') {
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
    }
    
    const days = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30;
    
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Generate slots for working hours
      for (let hour = config.workingHours.start; hour < config.workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += config.timeSlotDuration) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + config.timeSlotDuration);
          
          const slotEvents = calendarState.events.filter(event => 
            event.start <= slotEnd && event.end >= slotStart
          );
          
          slots.push({
            id: `${slotStart.toISOString()}-${config.timeSlotDuration}`,
            start: slotStart,
            end: slotEnd,
            isAvailable: slotEvents.length === 0,
            hasEvent: slotEvents.length > 0,
            events: slotEvents
          });
        }
      }
    }
    
    return slots;
  }, [calendarState.events, config]);

  // AI-powered free time analysis
  const analyzeFreeTime = useCallback(async (
    events: ExtendedCalendarDisplayEvent[],
    targetDate: Date = new Date()
  ): Promise<FreeTimeSlot[]> => {
    const freeSlots: FreeTimeSlot[] = [];
    const dayStart = new Date(targetDate);
    dayStart.setHours(config.workingHours.start, 0, 0, 0);
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(config.workingHours.end, 0, 0, 0);
    
    // Sort events by start time
    const sortedEvents = [...events]
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === targetDate.toDateString();
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    let currentTime = dayStart;
    
    for (const event of sortedEvents) {
      const eventStart = new Date(event.start);
      
      // Check for free time before this event
      if (currentTime < eventStart) {
        const duration = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
        
        if (duration >= config.minFreeSlotDuration) {
          // AI-powered energy suitability analysis
          const hour = currentTime.getHours();
          let energySuitability: EnergyLevel;
          let confidence = 0.8;
          const reasons: string[] = [];
          
          if (hour >= 9 && hour <= 11) {
            energySuitability = 'high';
            reasons.push('Morning peak productivity hours');
          } else if (hour >= 14 && hour <= 16) {
            energySuitability = 'medium';
            reasons.push('Post-lunch focus period');
            confidence = 0.7;
          } else {
            energySuitability = 'low';
            reasons.push('Lower energy period');
            confidence = 0.6;
          }
          
          // Consider focus mode preferences
          if (focusMode.isActive && duration >= 25) {
            energySuitability = 'high';
            confidence = 0.9;
            reasons.push('Optimal for focus session');
          }
          
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: Math.floor(duration),
            energySuitability,
            confidence,
            reasons
          });
        }
      }
      
      currentTime = new Date(event.end);
    }
    
    // Check for free time after last event
    if (currentTime < dayEnd) {
      const duration = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (duration >= config.minFreeSlotDuration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd),
          duration: Math.floor(duration),
          energySuitability: 'low',
          confidence: 0.5,
          reasons: ['End-of-day slot']
        });
      }
    }
    
    return freeSlots;
  }, [config, focusMode]);

  // Load calendar events
  const loadEvents = useCallback(async (viewMode: CalendarViewMode, date: Date) => {
    setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const allEvents: ExtendedCalendarDisplayEvent[] = [...localEvents];
      
      // Load Google Calendar events if enabled
      if (config.includeGoogleCalendar) {
        if (viewMode === 'day') {
          await loadTodaysEvents();
        } else {
          const days = viewMode === 'week' ? 7 : 30;
          await loadUpcomingEvents(days);
        }
        
        // Convert Google events to extended format
        const extendedGoogleEvents: ExtendedCalendarDisplayEvent[] = googleEvents.map(event => ({
          ...event,
          source: 'google-calendar' as const,
          googleEventId: event.googleEventId,
          googleCalendarId: event.calendarId
        }));
        
        allEvents.push(...extendedGoogleEvents);
      }
      
      // Analyze free time
      const freeSlots = await analyzeFreeTime(allEvents, date);
      
      setCalendarState(prev => ({
        ...prev,
        events: allEvents,
        view: viewMode,
        selectedDate: date,
        timeSlots: generateTimeSlots(date, viewMode),
        freeTimeSlots: freeSlots,
        isLoading: false
      }));
    } catch (error) {
      setCalendarState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load calendar events',
        isLoading: false
      }));
    }
  }, [localEvents, config.includeGoogleCalendar, loadTodaysEvents, loadUpcomingEvents, googleEvents, analyzeFreeTime, generateTimeSlots]);

  // Add time-blocked task to calendar
  const addTimeBlockedTask = useCallback(async (
    task: TaskItem,
    startTime: Date,
    duration?: number
  ): Promise<ExtendedCalendarDisplayEvent> => {
    const eventDuration = duration || task.estimatedMinutes || 60;
    const endTime = new Date(startTime.getTime() + eventDuration * 60000);
    
    const newEvent: ExtendedCalendarDisplayEvent = {
      id: `task-${task.id}-${Date.now()}`,
      title: task.title,
      start: startTime,
      end: endTime,
      taskId: task.id,
      calendarId: 'local',
      description: task.description,
      color: task.priority === 'high' ? '#ef4444' : 
             task.priority === 'medium' ? '#f59e0b' : '#10b981',
      source: 'local',
      isAllDay: false
    };
    
    setLocalEvents(prev => [...prev, newEvent]);
    
    // Trigger refresh of free time analysis
    if (freeTimeAnalysisRef.current) {
      clearTimeout(freeTimeAnalysisRef.current);
    }
    freeTimeAnalysisRef.current = setTimeout(() => {
      analyzeFreeTime([...localEvents, newEvent], calendarState.selectedDate).then(freeSlots => {
        setCalendarState(prev => ({ ...prev, freeTimeSlots: freeSlots }));
      });
    }, 500);
    
    return newEvent;
  }, [localEvents, analyzeFreeTime, calendarState.selectedDate]);

  // Find optimal time slots for a task
  const findOptimalTimeSlots = useCallback((
    task: TaskItem,
    targetDate: Date = new Date(),
    count: number = 3
  ): FreeTimeSlot[] => {
    const taskDuration = task.estimatedMinutes || 60;
    const preferredEnergy = task.energyLevel || 'medium';
    
    return calendarState.freeTimeSlots
      .filter(slot => {
        const slotDate = new Date(slot.start);
        return slotDate.toDateString() === targetDate.toDateString() && 
               slot.duration >= taskDuration;
      })
      .sort((a, b) => {
        let scoreA = a.confidence;
        let scoreB = b.confidence;
        
        // Boost score for energy level match
        if (a.energySuitability === preferredEnergy) scoreA += 0.3;
        if (b.energySuitability === preferredEnergy) scoreB += 0.3;
        
        // Boost score for adequate duration
        if (a.duration >= taskDuration * 1.5) scoreA += 0.2;
        if (b.duration >= taskDuration * 1.5) scoreB += 0.2;
        
        return scoreB - scoreA;
      })
      .slice(0, count);
  }, [calendarState.freeTimeSlots]);

  // Change calendar view
  const changeView = useCallback((newView: CalendarViewMode) => {
    loadEvents(newView, calendarState.selectedDate);
  }, [loadEvents, calendarState.selectedDate]);

  // Navigate to different date
  const navigateToDate = useCallback((newDate: Date) => {
    loadEvents(calendarState.view, newDate);
  }, [loadEvents, calendarState.view]);

  // Initialize calendar
  useEffect(() => {
    loadEvents(calendarState.view, calendarState.selectedDate);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (freeTimeAnalysisRef.current) {
        clearTimeout(freeTimeAnalysisRef.current);
      }
    };
  }, []);

  return {
    ...calendarState,
    isLoading: calendarState.isLoading || googleLoading,
    loadEvents,
    addTimeBlockedTask,
    findOptimalTimeSlots,
    changeView,
    navigateToDate,
    config
  };
}
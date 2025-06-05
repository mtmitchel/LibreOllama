// React Hook for Google APIs Integration in LibreOllama

import { useState, useEffect, useCallback, useRef } from 'react';
import { googleApiManager, GoogleApiManager } from '../lib/google-api-manager';
import {
  GoogleAuthState,
  GoogleIntegrationStatus,
  GoogleSyncConfig,
  GoogleCalendarEvent,
  GoogleTask,
  GmailMessage
} from '../lib/google-types';

interface GoogleIntegrationHookState {
  authState: GoogleAuthState;
  integrationStatus: GoogleIntegrationStatus | null;
  syncConfig: GoogleSyncConfig;
  isLoading: boolean;
  error: string | null;
  quickOverview: {
    todaysEvents: any[];
    incompleteTasks: any[];
    unreadEmails: any[];
    upcomingDeadlines: any[];
  } | null;
}

interface GoogleIntegrationActions {
  authenticate: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  updateSyncConfig: (updates: Partial<GoogleSyncConfig>) => void;
  getQuickOverview: () => Promise<void>;
  performHealthCheck: () => Promise<any>;
}

export function useGoogleIntegration(): GoogleIntegrationHookState & GoogleIntegrationActions {
  const [state, setState] = useState<GoogleIntegrationHookState>({
    authState: googleApiManager.getAuthState(),
    integrationStatus: null,
    syncConfig: googleApiManager.getSyncConfig(),
    isLoading: false,
    error: null,
    quickOverview: null
  });

  const eventListenersRef = useRef<boolean>(false);

  // Set up event handlers
  useEffect(() => {
    if (!eventListenersRef.current) {
      googleApiManager.setEventHandlers({
        onAuthStateChange: (authState: GoogleAuthState) => {
          setState(prev => ({ ...prev, authState }));
        },
        onCalendarEvent: (event: GoogleCalendarEvent) => {
          // Handle calendar event updates
          console.log('Calendar event received:', event);
        },
        onTaskUpdate: (task: GoogleTask) => {
          // Handle task updates
          console.log('Task update received:', task);
        },
        onEmailReceived: (message: GmailMessage) => {
          // Handle new email notifications
          console.log('Email received:', message);
        },
        onError: (error: any) => {
          setState(prev => ({ ...prev, error: error.message }));
        }
      });
      eventListenersRef.current = true;
    }
  }, []);

  // Load initial data when authenticated
  useEffect(() => {
    if (state.authState.isAuthenticated && !state.integrationStatus) {
      refreshStatus();
    }
  }, [state.authState.isAuthenticated]);

  // Authentication actions
  const authenticate = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await googleApiManager.authenticate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleAuthCallback = useCallback(async (code: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await googleApiManager.handleAuthCallback(code);
      await refreshStatus();
      await getQuickOverview();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auth callback failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await googleApiManager.signOut();
      setState(prev => ({
        ...prev,
        integrationStatus: null,
        quickOverview: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Status and configuration actions
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const status = await googleApiManager.getIntegrationStatus();
      setState(prev => ({ ...prev, integrationStatus: status }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh status';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const updateSyncConfig = useCallback((updates: Partial<GoogleSyncConfig>): void => {
    try {
      googleApiManager.updateSyncConfig(updates);
      setState(prev => ({
        ...prev,
        syncConfig: googleApiManager.getSyncConfig(),
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update sync config';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  const getQuickOverview = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const overview = await googleApiManager.getQuickOverview();
      setState(prev => ({ ...prev, quickOverview: overview }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quick overview';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const performHealthCheck = useCallback(async (): Promise<any> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const healthCheck = await googleApiManager.performHealthCheck();
      return healthCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return {
    ...state,
    authenticate,
    handleAuthCallback,
    signOut,
    refreshStatus,
    updateSyncConfig,
    getQuickOverview,
    performHealthCheck
  };
}

// Hook for accessing individual Google services
export function useGoogleServices() {
  return {
    calendar: googleApiManager.getCalendarService(),
    tasks: googleApiManager.getTasksService(),
    gmail: googleApiManager.getGmailService(),
    isAuthenticated: googleApiManager.isAuthenticated()
  };
}

// Hook for Google Calendar integration
export function useGoogleCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarService = googleApiManager.getCalendarService();

  const loadCalendars = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const googleCalendars = await calendarService.getCalendars();
      setCalendars(googleCalendars);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendars';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService]);

  const loadTodaysEvents = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const todaysEvents = await calendarService.getTodaysEvents();
      const convertedEvents = todaysEvents.map(event => 
        calendarService.convertToLibreOllamaEvent(event)
      );
      setEvents(convertedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load today\'s events';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService]);

  const loadUpcomingEvents = useCallback(async (days: number = 7) => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const upcomingEvents = await calendarService.getUpcomingEvents(undefined, days);
      const convertedEvents = upcomingEvents.map(event => 
        calendarService.convertToLibreOllamaEvent(event)
      );
      setEvents(convertedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load upcoming events';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService]);

  return {
    events,
    calendars,
    isLoading,
    error,
    loadCalendars,
    loadTodaysEvents,
    loadUpcomingEvents
  };
}

// Hook for Google Tasks integration
export function useGoogleTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tasksService = googleApiManager.getTasksService();

  const loadTaskLists = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const googleTaskLists = await tasksService.getTaskLists();
      setTaskLists(googleTaskLists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load task lists';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tasksService]);

  const loadIncompleteTasks = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const incompleteTasks = await tasksService.getIncompleteTasks();
      const convertedTasks = incompleteTasks.map(task => 
        tasksService.convertToLibreOllamaTask(task)
      );
      setTasks(convertedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load incomplete tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tasksService]);

  const loadOverdueTasks = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const overdueTasks = await tasksService.getOverdueTasks();
      const convertedTasks = overdueTasks.map(task => 
        tasksService.convertToLibreOllamaTask(task)
      );
      setTasks(convertedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load overdue tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tasksService]);

  return {
    tasks,
    taskLists,
    isLoading,
    error,
    loadTaskLists,
    loadIncompleteTasks,
    loadOverdueTasks
  };
}

// Hook for Gmail integration
export function useGmail() {
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gmailService = googleApiManager.getGmailService();

  const loadUnreadMessages = useCallback(async (maxResults: number = 20) => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const unreadMessages = await gmailService.getUnreadMessages(maxResults);
      const convertedMessages = unreadMessages.map(message => 
        gmailService.convertToLibreOllamaFormat(message)
      );
      setMessages(convertedMessages);
      setUnreadCount(convertedMessages.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load unread messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [gmailService]);

  const loadRecentMessages = useCallback(async (maxResults: number = 20) => {
    if (!googleApiManager.isAuthenticated()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const recentMessages = await gmailService.getRecentMessages(maxResults);
      const convertedMessages = recentMessages.map(message => 
        gmailService.convertToLibreOllamaFormat(message)
      );
      setMessages(convertedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [gmailService]);

  const getEmailStatistics = useCallback(async () => {
    if (!googleApiManager.isAuthenticated()) return null;
    
    try {
      return await gmailService.getEmailStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get email statistics';
      setError(errorMessage);
      return null;
    }
  }, [gmailService]);

  return {
    messages,
    unreadCount,
    isLoading,
    error,
    loadUnreadMessages,
    loadRecentMessages,
    getEmailStatistics
  };
}
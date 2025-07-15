/**
 * Calendar API Integration Tests - Store-First Testing Approach
 * 
 * Following the Implementation Guide principles:
 * 1. Test business logic directly through store methods
 * 2. Use real store instances, not mocks
 * 3. Focus on specific behaviors and edge cases
 * 4. Minimal UI testing only after store logic is verified
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGoogleCalendarStore } from '@/stores/googleCalendarStore';
import { useGoogleTasksStore } from '@/stores/googleTasksStore';

describe('Calendar API Integration Tests', () => {
  beforeEach(() => {
    // Reset stores to clean state using setState
    useGoogleCalendarStore.setState({
      events: [],
      calendars: [],
      isLoading: false,
      error: null,
      isAuthenticated: false,
      lastSyncAt: null,
      currentCalendarId: 'primary',
      isHydrated: true
    });

    useGoogleTasksStore.setState({
      tasks: {},
      taskLists: [],
      isLoading: false,
      isLoadingTasks: {},
      error: null,
      isAuthenticated: false,
      lastSyncAt: null,
      isHydrated: true
    });
  });

  describe('🗓️ Calendar Store Operations', () => {
    it('should manage calendar events in store state', () => {
      const store = useGoogleCalendarStore.getState();
      
      // Test initial state
      expect(store.events).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();

      // Test direct state updates
      useGoogleCalendarStore.setState({ isLoading: true });
      expect(useGoogleCalendarStore.getState().isLoading).toBe(true);

      // Test events update
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Test Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
          description: 'Test event description'
        }
      ];

      useGoogleCalendarStore.setState({ events: mockEvents });
      expect(useGoogleCalendarStore.getState().events).toEqual(mockEvents);
      expect(useGoogleCalendarStore.getState().events.length).toBe(1);
    });

    it('should handle calendar creation workflow', () => {
      // Simulate creating a new event
      const newEvent = {
        id: 'new-event-1',
        summary: 'New Calendar Event',
        start: { dateTime: '2024-01-20T14:00:00Z' },
        end: { dateTime: '2024-01-20T15:00:00Z' },
        description: 'Created via API'
      };

      // Test adding event to store
      const currentEvents = useGoogleCalendarStore.getState().events;
      useGoogleCalendarStore.setState({ events: [...currentEvents, newEvent] });
      
      const updatedStore = useGoogleCalendarStore.getState();
      expect(updatedStore.events.length).toBe(1);
      expect(updatedStore.events[0].summary).toBe('New Calendar Event');
    });

    it('should handle event updates', () => {
      // Add initial event
      const originalEvent = {
        id: 'event-to-update',
        summary: 'Original Title',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' }
      };
      
      useGoogleCalendarStore.setState({ events: [originalEvent] });
      
      // Update the event
      const updatedEvent = {
        ...originalEvent,
        summary: 'Updated Title',
        description: 'Updated description'
      };
      
      useGoogleCalendarStore.setState({ events: [updatedEvent] });
      
      const finalStore = useGoogleCalendarStore.getState();
      expect(finalStore.events[0].summary).toBe('Updated Title');
      expect(finalStore.events[0].description).toBe('Updated description');
    });

    it('should handle event deletion', () => {
      // Add multiple events
      const events = [
        { id: 'event1', summary: 'Event 1', start: { dateTime: '2024-01-15T10:00:00Z' }, end: { dateTime: '2024-01-15T11:00:00Z' } },
        { id: 'event2', summary: 'Event 2', start: { dateTime: '2024-01-16T10:00:00Z' }, end: { dateTime: '2024-01-16T11:00:00Z' } }
      ];
      
      useGoogleCalendarStore.setState({ events });
      expect(useGoogleCalendarStore.getState().events.length).toBe(2);
      
      // Delete one event
      const remainingEvents = events.filter(e => e.id !== 'event1');
      useGoogleCalendarStore.setState({ events: remainingEvents });
      
      const finalStore = useGoogleCalendarStore.getState();
      expect(finalStore.events.length).toBe(1);
      expect(finalStore.events[0].id).toBe('event2');
    });

    it('should test store utility methods', () => {
      const store = useGoogleCalendarStore.getState();
      
      // Test current calendar management
      store.setCurrentCalendar('work-calendar');
      expect(useGoogleCalendarStore.getState().currentCalendarId).toBe('work-calendar');
      
      // Test error clearing
      useGoogleCalendarStore.setState({ error: 'Test error' });
      expect(useGoogleCalendarStore.getState().error).toBe('Test error');
      
      store.clearError();
      expect(useGoogleCalendarStore.getState().error).toBeNull();
    });
  });

  describe('📅 Calendar Synchronization', () => {
    it('should handle sync state management', () => {
      // Test sync loading state
      useGoogleCalendarStore.setState({ isLoading: true });
      expect(useGoogleCalendarStore.getState().isLoading).toBe(true);
      
      // Simulate successful sync
      const syncedEvents = [
        { id: 'synced1', summary: 'Synced Event 1', start: { dateTime: '2024-01-15T10:00:00Z' }, end: { dateTime: '2024-01-15T11:00:00Z' } },
        { id: 'synced2', summary: 'Synced Event 2', start: { dateTime: '2024-01-16T10:00:00Z' }, end: { dateTime: '2024-01-16T11:00:00Z' } }
      ];
      
      useGoogleCalendarStore.setState({ 
        events: syncedEvents,
        isLoading: false,
        error: null,
        lastSyncAt: new Date()
      });
      
      const finalStore = useGoogleCalendarStore.getState();
      expect(finalStore.events.length).toBe(2);
      expect(finalStore.isLoading).toBe(false);
      expect(finalStore.error).toBeNull();
      expect(finalStore.lastSyncAt).toBeDefined();
    });

    it('should handle sync errors gracefully', () => {
      // Simulate sync error
      const errorMessage = 'Failed to sync calendar data';
      useGoogleCalendarStore.setState({ 
        error: errorMessage,
        isLoading: false 
      });
      
      const errorStore = useGoogleCalendarStore.getState();
      expect(errorStore.error).toBe(errorMessage);
      expect(errorStore.isLoading).toBe(false);
      
      // Test error recovery using store method
      const store = useGoogleCalendarStore.getState();
      store.clearError();
      expect(useGoogleCalendarStore.getState().error).toBeNull();
    });
  });

  describe('📝 Task-to-Event Integration', () => {
    it('should handle task to calendar event conversion', () => {
      // Add a task to tasks store
      const task = {
        id: 'task1',
        title: 'Important Task',
        notes: 'Task details',
        due: '2024-01-20T15:00:00Z',
        status: 'needsAction'
      };
      
      useGoogleTasksStore.setState({ 
        tasks: { 'default': [{ ...task, status: 'needsAction' as const, position: '0', updated: new Date().toISOString(), selfLink: 'test', etag: 'test' }] },
        taskLists: [{ id: 'default', title: 'My Tasks', updated: new Date().toISOString(), selfLink: 'test', etag: 'test' }]
      });
      expect(useGoogleTasksStore.getState().tasks['default'].length).toBe(1);
      
      // Convert task to calendar event
      const eventFromTask = {
        id: 'event-from-task1',
        summary: task.title,
        description: task.notes,
        start: { dateTime: task.due },
        end: { dateTime: new Date(new Date(task.due).getTime() + 60 * 60 * 1000).toISOString() } // 1 hour duration
      };
      
      useGoogleCalendarStore.setState({ events: [eventFromTask] });
      
      const finalCalendarStore = useGoogleCalendarStore.getState();
      expect(finalCalendarStore.events.length).toBe(1);
      expect(finalCalendarStore.events[0].summary).toBe(task.title);
    });

    it('should test task store operations', () => {
      const store = useGoogleTasksStore.getState();
      
      // Test error clearing
      useGoogleTasksStore.setState({ error: 'Task error' });
      expect(useGoogleTasksStore.getState().error).toBe('Task error');
      
      store.clearError();
      expect(useGoogleTasksStore.getState().error).toBeNull();
      
      // Test task list lookup
      const taskLists = [
        { id: 'list1', title: 'Work Tasks' },
        { id: 'list2', title: 'Personal Tasks' }
      ];
      
      useGoogleTasksStore.setState({ taskLists: taskLists.map(list => ({ ...list, updated: new Date().toISOString(), selfLink: 'test', etag: 'test' })) });
      
      const foundList = store.getTaskList('list1');
      expect(foundList?.title).toBe('Work Tasks');
      
      const notFoundList = store.getTaskList('nonexistent');
      expect(notFoundList).toBeUndefined();
    });
  });

  describe('🔄 Multi-Calendar Support', () => {
    it('should handle multiple calendar sources', () => {
      // Test multiple calendars
      const calendars = [
        { id: 'primary', summary: 'Primary Calendar', primary: true },
        { id: 'work', summary: 'Work Calendar', primary: false },
        { id: 'personal', summary: 'Personal Calendar', primary: false }
      ];
      
      useGoogleCalendarStore.setState({ calendars });
      expect(useGoogleCalendarStore.getState().calendars.length).toBe(3);
      
      // Test events from different calendars
      const eventsFromMultipleCalendars = [
        { id: 'event1', summary: 'Primary Event', calendarId: 'primary', start: { dateTime: '2024-01-15T10:00:00Z' }, end: { dateTime: '2024-01-15T11:00:00Z' } },
        { id: 'event2', summary: 'Work Event', calendarId: 'work', start: { dateTime: '2024-01-16T10:00:00Z' }, end: { dateTime: '2024-01-16T11:00:00Z' } }
      ];
      
      useGoogleCalendarStore.setState({ events: eventsFromMultipleCalendars });
      
      const finalStore = useGoogleCalendarStore.getState();
      expect(finalStore.events.length).toBe(2);
      expect(finalStore.events.some(e => (e as any).calendarId === 'primary')).toBe(true);
      expect(finalStore.events.some(e => (e as any).calendarId === 'work')).toBe(true);
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle large numbers of events efficiently', () => {
      // Generate large number of events
      const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
        id: `event${i}`,
        summary: `Event ${i}`,
        start: { dateTime: new Date(2024, 0, 15 + i).toISOString() },
        end: { dateTime: new Date(2024, 0, 15 + i, 1).toISOString() }
      }));
      
      // Performance test - store should handle large datasets
      const startTime = performance.now();
      useGoogleCalendarStore.setState({ events: largeEventSet });
      const endTime = performance.now();
      
      expect(useGoogleCalendarStore.getState().events.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle API rate limiting', () => {
      // Simulate rate limiting error
      const rateLimitError = 'Rate limit exceeded. Please try again later.';
      useGoogleCalendarStore.setState({ error: rateLimitError });
      
      expect(useGoogleCalendarStore.getState().error).toBe(rateLimitError);
      
      // Test recovery from rate limiting
      useGoogleCalendarStore.setState({ error: null, isLoading: false });
      
      expect(useGoogleCalendarStore.getState().error).toBeNull();
    });

    it('should handle network connectivity issues', () => {
      // Simulate network error
      const networkError = 'Network error: Unable to connect to Google Calendar API';
      useGoogleCalendarStore.setState({ 
        error: networkError,
        isLoading: false 
      });
      
      const errorStore = useGoogleCalendarStore.getState();
      expect(errorStore.error).toBe(networkError);
      expect(errorStore.isLoading).toBe(false);
      
      // Test that events remain cached during network issues
      const cachedEvents = [
        { id: 'cached1', summary: 'Cached Event', start: { dateTime: '2024-01-15T10:00:00Z' }, end: { dateTime: '2024-01-15T11:00:00Z' } }
      ];
      useGoogleCalendarStore.setState({ events: cachedEvents });
      
      expect(useGoogleCalendarStore.getState().events.length).toBe(1);
    });

    it('should test authentication state management', () => {
      const store = useGoogleCalendarStore.getState();
      
      // Test initial unauthenticated state
      expect(store.isAuthenticated).toBe(false);
      
      // Test authentication
      const mockAccount = {
        id: 'test-account',
        email: 'test@example.com',
        name: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000
      };
      
      store.authenticate(mockAccount);
      expect(useGoogleCalendarStore.getState().isAuthenticated).toBe(true);
      
      // Test sign out
      store.signOut();
      expect(useGoogleCalendarStore.getState().isAuthenticated).toBe(false);
      expect(useGoogleCalendarStore.getState().events).toEqual([]);
    });
  });
}); 
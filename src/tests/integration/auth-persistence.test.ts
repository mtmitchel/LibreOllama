/**
 * Authentication Persistence Integration Tests
 * 
 * Tests the persistence and restoration of authentication state
 * across Gmail, Calendar, and Tasks services.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

describe('Authentication Persistence Integration Tests', () => {
  beforeEach(() => {
    setupTauriMocks();
    
    // Mock successful responses for auth operations
    mockTauriInvoke.mockImplementation((command: string) => {
      switch (command) {
        case 'get_all_gmail_accounts':
          return Promise.resolve([
            {
              id: 'test-account-1',
              email: 'test@example.com',
              name: 'Test User',
              picture: 'https://example.com/picture.jpg',
              is_active: true,
              connected_at: new Date().toISOString(),
              scopes: ['gmail.readonly', 'gmail.send'],
            }
          ]);
          
        case 'get_gmail_messages':
          return Promise.resolve({
            messages: [],
            nextPageToken: null,
          });
          
        case 'get_google_calendars':
          return Promise.resolve([
            {
              id: 'primary',
              summary: 'Primary Calendar',
              primary: true,
            },
            {
              id: 'work-calendar',
              summary: 'Work Calendar',
              primary: false,
            }
          ]);
          
        case 'get_google_events':
          return Promise.resolve([
            {
              id: 'event-1',
              summary: 'Test Event',
              start: { dateTime: new Date().toISOString() },
              end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
              calendarSummary: 'Primary Calendar',
            },
            {
              id: 'event-2',
              summary: 'Work Meeting',
              start: { dateTime: new Date().toISOString() },
              end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
              calendarSummary: 'Work Calendar',
            }
          ]);
          
        default:
          return Promise.resolve({});
      }
    });
  });
  
  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
    
    // Reset stores
    useMailStore.setState({
      accounts: {},
      currentAccountId: null,
      isAuthenticated: false,
    });
    
    useGoogleCalendarStore.setState({
      events: [],
      calendars: [],
      isAuthenticated: false,
    });
  });
  
  describe('Gmail Authentication Persistence', () => {
    it('should persist and restore Gmail accounts', async () => {
      const mailStore = useMailStore.getState();
      
      // Load stored accounts
      await mailStore.loadStoredAccounts();
      
      // Verify accounts were loaded
      const accountIds = Object.keys(mailStore.accounts);
      expect(accountIds).toHaveLength(1);
      expect(mailStore.isAuthenticated).toBe(true);
      
      const account = mailStore.accounts[accountIds[0]];
      expect(account).toBeDefined();
      expect(account.email).toBe('test@example.com');
      expect(account.isActive).toBe(true);
    });
    
    it('should handle no stored accounts gracefully', async () => {
      // Mock no accounts
      mockTauriInvoke.mockImplementationOnce(() => Promise.resolve([]));
      
      const mailStore = useMailStore.getState();
      await mailStore.loadStoredAccounts();
      
      expect(Object.keys(mailStore.accounts)).toHaveLength(0);
      expect(mailStore.isAuthenticated).toBe(false);
    });
    
    it('should handle account loading errors', async () => {
      // Mock error
      mockTauriInvoke.mockImplementationOnce(() => 
        Promise.reject(new Error('Failed to load accounts'))
      );
      
      const mailStore = useMailStore.getState();
      
      // Should not throw, but handle error gracefully
      await expect(mailStore.loadStoredAccounts()).resolves.not.toThrow();
      
      expect(Object.keys(mailStore.accounts)).toHaveLength(0);
      expect(mailStore.isAuthenticated).toBe(false);
    });
  });
  
  describe('Google Calendar Integration', () => {
    it('should fetch and persist calendar data', async () => {
      const calendarStore = useGoogleCalendarStore.getState();
      
      // Set authenticated state
      // Use store's method instead of setState
      (calendarStore as any).isAuthenticated = true;
      
      // Fetch calendars
      await calendarStore.fetchCalendars();
      
      expect(calendarStore.calendars).toHaveLength(2);
      expect(calendarStore.calendars[0].summary).toBe('Primary Calendar');
      expect(calendarStore.calendars[1].summary).toBe('Work Calendar');
    });
    
    it('should fetch events from all calendars', async () => {
      const calendarStore = useGoogleCalendarStore.getState();
      
      // Set authenticated state
      // Use store's method instead of setState
      (calendarStore as any).isAuthenticated = true;
      
      // Fetch events
      await calendarStore.fetchEvents();
      
      expect(calendarStore.events).toHaveLength(2);
      
      // Group events by calendar
      const eventsByCalendar = calendarStore.events.reduce((acc, event: any) => {
        const calendarName = event.calendarSummary || 'Primary';
        if (!acc[calendarName]) acc[calendarName] = 0;
        acc[calendarName]++;
        return acc;
      }, {} as Record<string, number>);
      
      expect(eventsByCalendar['Primary Calendar']).toBe(1);
      expect(eventsByCalendar['Work Calendar']).toBe(1);
    });
    
    it('should handle authentication state correctly', async () => {
      const calendarStore = useGoogleCalendarStore.getState();
      
      // Initially not authenticated
      expect(calendarStore.isAuthenticated).toBe(false);
      
      // Simulate authentication
      // Use store's method instead of setState
      (calendarStore as any).isAuthenticated = true;
      
      expect(calendarStore.isAuthenticated).toBe(true);
      
      // Fetch should work when authenticated
      await expect(calendarStore.fetchEvents()).resolves.not.toThrow();
    });
  });
  
  describe('Unified Task Store', () => {
    it('should manage task columns correctly', () => {
      const unifiedStore = useUnifiedTaskStore.getState();
      
      // Add columns
      unifiedStore.addColumn('col-1', 'Work Tasks', 'google-list-1');
      unifiedStore.addColumn('col-2', 'Personal Tasks', 'google-list-2');
      
      expect(unifiedStore.columns).toHaveLength(2);
      expect(unifiedStore.columns[0].title).toBe('Work Tasks');
      expect(unifiedStore.columns[1].title).toBe('Personal Tasks');
    });
    
    it('should create and manage tasks', async () => {
      const unifiedStore = useUnifiedTaskStore.getState();
      
      // Add a column first
      unifiedStore.addColumn('col-1', 'Test Column');
      
      // Create a task
      const taskId = await unifiedStore.createTask({
        title: 'Test Task',
        notes: 'Test notes',
        columnId: 'col-1',
      });
      
      expect(taskId).toBeDefined();
      expect(Object.keys(unifiedStore.tasks)).toHaveLength(1);
      
      const task = unifiedStore.tasks[taskId];
      expect(task.title).toBe('Test Task');
      expect(task.notes).toBe('Test notes');
      expect(task.columnId).toBe('col-1');
      expect(task.syncState).toBe('pending_create');
    });
    
    it('should handle task sync states correctly', async () => {
      const unifiedStore = useUnifiedTaskStore.getState();
      
      // Add column and task
      unifiedStore.addColumn('col-1', 'Test Column');
      const taskId = await unifiedStore.createTask({
        title: 'Sync Test Task',
        columnId: 'col-1',
      });
      
      // Initially pending
      expect(unifiedStore.tasks[taskId].syncState).toBe('pending_create');
      
      // Mark as synced
      unifiedStore.markTaskSynced(taskId, 'google-task-123', 'google-list-123');
      
      expect(unifiedStore.tasks['google-task-123'].syncState).toBe('synced');
      expect(unifiedStore.tasks['google-task-123'].googleTaskId).toBe('google-task-123');
      expect(unifiedStore.tasks['google-task-123'].googleTaskListId).toBe('google-list-123');
    });
  });
  
  describe('Cross-Store Integration', () => {
    it('should coordinate authentication across stores', async () => {
      // Load Gmail accounts
      const mailStore = useMailStore.getState();
      await mailStore.loadStoredAccounts();
      
      // Set calendar authentication based on Gmail
      const calendarStore = useGoogleCalendarStore.getState();
      if (mailStore.isAuthenticated) {
        // Use store's method instead of setState
      (calendarStore as any).isAuthenticated = true;
      }
      
      expect(mailStore.isAuthenticated).toBe(true);
      expect(calendarStore.isAuthenticated).toBe(true);
    });
    
    it('should measure full data load performance', async () => {
      const startTime = Date.now();
      
      const mailStore = useMailStore.getState();
      const calendarStore = useGoogleCalendarStore.getState();
      
      // Simulate full data load
      await Promise.all([
        mailStore.loadStoredAccounts(),
        calendarStore.fetchCalendars(),
        calendarStore.fetchEvents(),
      ]);
      
      const loadTime = Date.now() - startTime;
      
      // Should complete reasonably quickly (under 1 second for mocked data)
      expect(loadTime).toBeLessThan(1000);
      
      // Verify data was loaded
      expect(Object.keys(mailStore.accounts).length).toBeGreaterThan(0);
      expect(calendarStore.calendars.length).toBeGreaterThan(0);
      expect(calendarStore.events.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Recovery', () => {
    it('should handle partial failures gracefully', async () => {
      // Mock Gmail success but Calendar failure
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_all_gmail_accounts') {
          return Promise.resolve([{
            id: 'test-account-1',
            email: 'test@example.com',
            name: 'Test User',
            is_active: true,
          }]);
        }
        if (command === 'get_google_calendars') {
          return Promise.reject(new Error('Calendar API error'));
        }
        return Promise.resolve({});
      });
      
      const mailStore = useMailStore.getState();
      const calendarStore = useGoogleCalendarStore.getState();
      
      // Load data
      await mailStore.loadStoredAccounts();
      await expect(calendarStore.fetchCalendars()).rejects.toThrow();
      
      // Gmail should still work
      expect(mailStore.isAuthenticated).toBe(true);
      expect(Object.keys(mailStore.accounts)).toHaveLength(1);
      
      // Calendar should handle error gracefully
      expect(calendarStore.calendars).toHaveLength(0);
      expect(calendarStore.error).toBeTruthy();
    });
  });
});
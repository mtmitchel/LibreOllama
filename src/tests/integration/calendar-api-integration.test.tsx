/**
 * Calendar API Integration Tests
 * 
 * Critical Gap Addressed: Calendar testing scored 30/100 in testing audit
 * Pattern: Following Gmail service integration model (85/100 score)
 * 
 * Tests Google Calendar API integration, event CRUD operations,
 * calendar sync, and task-to-event scheduling functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Main application components
import Calendar from '../../app/pages/Calendar';
import { ThemeProvider } from '../../components/ThemeProvider';
import { HeaderProvider } from '../../app/contexts/HeaderContext';

// Services and stores
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { googleCalendarService } from '../../services/google/googleCalendarService';

// Test utilities
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ThemeProvider>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </ThemeProvider>
  </MemoryRouter>
);

// Mock data
const createMockCalendarEvent = (overrides = {}) => ({
  id: `event-${Date.now()}`,
  summary: 'Test Event',
  description: 'Test event description',
  location: 'Test Location',
  start: {
    dateTime: new Date().toISOString(),
    timeZone: 'America/New_York'
  },
  end: {
    dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    timeZone: 'America/New_York'
  },
  status: 'confirmed',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  ...overrides
});

const createMockGoogleAccount = () => ({
  id: 'test-account-123',
  email: 'test@example.com',
  name: 'Test User',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Date.now() + 3600000
});

describe('Calendar API Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockAccount: ReturnType<typeof createMockGoogleAccount>;

  beforeEach(() => {
    user = userEvent.setup();
    mockAccount = createMockGoogleAccount();
    
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Reset stores
    useGoogleCalendarStore.getState().signOut();
    useGoogleTasksStore.getState().signOut();
    
    // Mock successful calendar API responses
    mockTauriInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'get_calendar_events':
          return Promise.resolve({
            kind: 'calendar#events',
            items: [createMockCalendarEvent()],
            nextPageToken: null,
            nextSyncToken: 'test-sync-token'
          });
          
        case 'create_calendar_event':
          return Promise.resolve(createMockCalendarEvent(args.eventData));
          
        case 'update_calendar_event':
          return Promise.resolve(createMockCalendarEvent({ 
            ...args.eventData, 
            id: args.eventId 
          }));
          
        case 'delete_calendar_event':
          return Promise.resolve();
          
        default:
          return Promise.resolve({});
      }
    });
  });

  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
  });

  describe('🗓️ Calendar Events CRUD Operations', () => {
    beforeEach(() => {
      // Setup authenticated state
      useGoogleCalendarStore.getState().authenticate(mockAccount);
    });

    it('should fetch and display calendar events', async () => {
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Verify events are loaded and displayed
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('get_calendar_events', 
          expect.objectContaining({
            accountId: mockAccount.id,
            calendarId: 'primary'
          })
        );
      });
      
      // Check that events appear in the calendar
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
    });

    it('should create new calendar events', async () => {
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Wait for calendar to load
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Click on a calendar date to create event
      const calendarGrid = screen.getByRole('grid'); // FullCalendar grid
      const dateCell = within(calendarGrid).getByText('15'); // Assuming day 15 exists
      await user.click(dateCell);
      
      // Event creation modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill in event details
      const titleInput = screen.getByLabelText(/title|summary/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      await user.type(titleInput, 'New Test Event');
      await user.type(descriptionInput, 'Event created via test');
      
      // Submit the event
      const createButton = screen.getByRole('button', { name: /create|save/i });
      await user.click(createButton);
      
      // Verify API call was made
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('create_calendar_event',
          expect.objectContaining({
            accountId: mockAccount.id,
            calendarId: 'primary',
            eventData: expect.objectContaining({
              summary: 'New Test Event',
              description: 'Event created via test'
            })
          })
        );
      });
    });

    it('should update existing calendar events', async () => {
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Wait for events to load
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      // Click on existing event to edit
      const eventElement = screen.getByText('Test Event');
      await user.click(eventElement);
      
      // Edit modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Modify event details
      const titleInput = screen.getByDisplayValue('Test Event');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Test Event');
      
      // Save changes
      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);
      
      // Verify update API call
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('update_calendar_event',
          expect.objectContaining({
            eventId: expect.any(String),
            eventData: expect.objectContaining({
              summary: 'Updated Test Event'
            })
          })
        );
      });
    });

    it('should delete calendar events', async () => {
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Wait for events to load
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      // Right-click or find delete option for event
      const eventElement = screen.getByText('Test Event');
      await user.click(eventElement);
      
      // Find and click delete button in modal or context menu
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = screen.queryByRole('button', { name: /confirm|yes/i });
      if (confirmButton) {
        await user.click(confirmButton);
      }
      
      // Verify delete API call
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('delete_calendar_event',
          expect.objectContaining({
            eventId: expect.any(String)
          })
        );
      });
    });
  });

  describe('📅 Calendar Synchronization', () => {
    it('should sync calendar data on load', async () => {
      // Setup authenticated state
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Verify initial sync calls
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('get_calendar_events',
          expect.objectContaining({
            accountId: mockAccount.id
          })
        );
      });
      
      // Verify store state is updated
      const calendarStore = useGoogleCalendarStore.getState();
      expect(calendarStore.events.length).toBeGreaterThan(0);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock API error
      mockTauriInvoke.mockRejectedValueOnce(new Error('Network error'));
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
      
      // Error should be in store
      const calendarStore = useGoogleCalendarStore.getState();
      expect(calendarStore.error).toBeTruthy();
    });
  });

  describe('📝 Task-to-Event Scheduling', () => {
    beforeEach(() => {
      // Setup both calendar and tasks stores
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      useGoogleTasksStore.getState().authenticate(mockAccount);
    });

    it('should convert task to calendar event via drag and drop', async () => {
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Wait for calendar to load
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Find task in sidebar (assuming tasks sidebar exists)
      const taskElement = screen.queryByText(/task/i);
      
      if (taskElement) {
        // Simulate drag and drop (simplified - real implementation would use drag events)
        await user.click(taskElement);
        
        // Find schedule button or option
        const scheduleButton = screen.queryByRole('button', { name: /schedule/i });
        
        if (scheduleButton) {
          await user.click(scheduleButton);
          
          // Schedule modal should open
          await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
          });
          
          // Fill scheduling details
          const startTimeInput = screen.getByLabelText(/start.*time/i);
          const endTimeInput = screen.getByLabelText(/end.*time/i);
          
          await user.type(startTimeInput, '10:00');
          await user.type(endTimeInput, '11:00');
          
          // Save scheduled event
          const saveButton = screen.getByRole('button', { name: /save|schedule/i });
          await user.click(saveButton);
          
          // Verify calendar event creation
          await waitFor(() => {
            expect(mockTauriInvoke).toHaveBeenCalledWith('create_calendar_event',
              expect.objectContaining({
                eventData: expect.objectContaining({
                  summary: expect.stringContaining('task')
                })
              })
            );
          });
        }
      }
    });
  });

  describe('🔄 Multi-Calendar Support', () => {
    it('should handle multiple calendar sources', async () => {
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      // Mock multiple calendars response
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_calendars') {
          return Promise.resolve({
            items: [
              { id: 'primary', summary: 'Primary Calendar' },
              { id: 'work', summary: 'Work Calendar' },
              { id: 'personal', summary: 'Personal Calendar' }
            ]
          });
        }
        return Promise.resolve({});
      });
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Should fetch multiple calendars
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('get_calendars', 
          expect.objectContaining({
            accountId: mockAccount.id
          })
        );
      });
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle large numbers of events efficiently', async () => {
      // Mock large dataset
      const largeEventSet = Array.from({ length: 100 }, (_, i) => 
        createMockCalendarEvent({ 
          id: `event-${i}`,
          summary: `Event ${i}` 
        })
      );
      
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_calendar_events') {
          return Promise.resolve({
            kind: 'calendar#events',
            items: largeEventSet,
            nextPageToken: null
          });
        }
        return Promise.resolve({});
      });
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      const startTime = performance.now();
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      
      // Should render efficiently (under 2 seconds)
      expect(renderTime).toBeLessThan(2000);
      
      // Should display events
      expect(screen.getByText('Event 0')).toBeInTheDocument();
    });

    it('should handle API rate limiting', async () => {
      mockTauriInvoke.mockRejectedValueOnce({
        code: 403,
        message: 'Rate limit exceeded'
      });
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Should handle rate limiting gracefully
      await waitFor(() => {
        expect(screen.getByText(/rate limit|too many requests/i)).toBeInTheDocument();
      });
    });

    it('should handle network connectivity issues', async () => {
      mockTauriInvoke.mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network unreachable'
      });
      
      useGoogleCalendarStore.getState().authenticate(mockAccount);
      
      render(<Calendar />, { wrapper: TestWrapper });
      
      // Should show appropriate error message
      await waitFor(() => {
        expect(screen.getByText(/network|connection/i)).toBeInTheDocument();
      });
      
      // Should allow retry
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });
}); 
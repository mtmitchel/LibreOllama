import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GoogleCalendarEvent, GoogleAccount } from '../types/google';

interface GoogleCalendarStore {
  accounts: GoogleAccount[];
  activeAccount: GoogleAccount | null;
  calendarEvents: GoogleCalendarEvent[];
  isLoadingCalendar: boolean;
  error?: string;

  setActiveAccount: (account: GoogleAccount) => void;
  fetchCalendarEvents: () => Promise<void>;
  createCalendarEvent: (eventData: any) => Promise<void>;
  clearError: () => void;
}

const useGoogleCalendarStore = create<GoogleCalendarStore>()(
  devtools((set, get) => ({
    accounts: [],
    activeAccount: null,
    calendarEvents: [],
    isLoadingCalendar: false,
    error: undefined,

    setActiveAccount: (account) => {
      set({ activeAccount: account });
    },

    fetchCalendarEvents: async () => {
      const { activeAccount } = get();
      if (!activeAccount) return;

      set({ isLoadingCalendar: true, error: undefined });

      try {
        // Mock calendar events for now
        const mockEvents: GoogleCalendarEvent[] = [
          {
            id: 'event-1',
            summary: 'Team Meeting',
            description: 'Weekly team sync',
            start: {
              dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            status: 'confirmed',
          },
          {
            id: 'event-2',
            summary: 'Project Review',
            description: 'Quarterly project review',
            start: {
              dateTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(Date.now() + 172800000 + 7200000).toISOString(), // Day after tomorrow + 2 hours
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            status: 'confirmed',
          },
        ];

        set({ calendarEvents: mockEvents, isLoadingCalendar: false });
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        set({ 
          error: 'Failed to fetch calendar events', 
          isLoadingCalendar: false 
        });
      }
    },

    createCalendarEvent: async (eventData) => {
      const { activeAccount } = get();
      if (!activeAccount) return;

      try {
        // Mock event creation
        const newEvent: GoogleCalendarEvent = {
          id: `event-${Date.now()}`,
          summary: eventData.summary,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          location: eventData.location,
          status: 'confirmed',
        };

        set(state => ({
          calendarEvents: [...state.calendarEvents, newEvent]
        }));

        console.log('Event created successfully:', newEvent);
      } catch (error) {
        console.error('Failed to create calendar event:', error);
        set({ error: 'Failed to create calendar event' });
      }
    },

    clearError: () => {
      set({ error: undefined });
    },
  }))
);

export { useGoogleCalendarStore }; 
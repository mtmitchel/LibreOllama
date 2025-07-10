import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GoogleCalendarEvent, GoogleAccount, CalendarEventCreateRequest } from '../types/google';
import { googleCalendarService } from '../services/google/googleCalendarService';
import { useSettingsStore } from './settingsStore';

interface GoogleCalendarState {
  // Authentication
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Data
  events: GoogleCalendarEvent[];
  calendars: any[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastSyncAt: Date | null;
  currentCalendarId: string;
}

interface GoogleCalendarActions {
  // Authentication
  authenticate: (account: GoogleAccount) => void;
  signOut: () => void;
  getCurrentAccount: () => GoogleAccount | null;
  
  // Data fetching
  fetchCalendars: (accountId?: string) => Promise<void>;
  fetchEvents: (timeMin?: string, timeMax?: string, accountId?: string) => Promise<void>;
  syncCalendar: () => Promise<void>;
  
  // Event management
  createEvent: (eventData: CalendarEventCreateRequest) => Promise<void>;
  updateEvent: (eventId: string, eventData: Partial<CalendarEventCreateRequest>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Calendar management
  setCurrentCalendar: (calendarId: string) => void;
  
  // Utility
  clearError: () => void;
  getEvent: (eventId: string) => GoogleCalendarEvent | undefined;
}

type GoogleCalendarStore = GoogleCalendarState & GoogleCalendarActions;

const initialState: GoogleCalendarState = {
  isAuthenticated: false,
  isHydrated: false,
  events: [],
  calendars: [],
  isLoading: false,
  error: null,
  lastSyncAt: null,
  currentCalendarId: 'primary',
};

export const useGoogleCalendarStore = create<GoogleCalendarStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Helper to get current account
        getCurrentAccount: (): GoogleAccount | null => {
          const settingsState = useSettingsStore.getState();
          const account = settingsState.integrations.googleAccounts.find(acc => acc.isActive);
          return account ? account as unknown as GoogleAccount : null;
        },

        // Authentication
        authenticate: (account: GoogleAccount) => {
          console.log('🔐 [GOOGLE-CALENDAR] Authenticating account:', account.email);
          set((state) => {
            state.isAuthenticated = true;
          });
          
          // The account should already be added to settings store by the Settings page
          // Just mark as authenticated here
          
          // Auto-fetch calendars and events after authentication
          get().fetchCalendars(account.id);
          get().fetchEvents(undefined, undefined, account.id);
        },

        signOut: () => {
          console.log('🚪 [GOOGLE-CALENDAR] Signing out');
          set((state) => {
            state.isAuthenticated = false;
            state.events = [];
            state.calendars = [];
            state.error = null;
          });
        },

        // Data fetching
        fetchCalendars: async (accountId?: string) => {
          const account = accountId ? useSettingsStore.getState().integrations.googleAccounts.find(a => a.id === accountId) : get().getCurrentAccount();
          if (!account) {
            set((state) => {
              state.error = 'No authenticated account found';
            });
            return;
          }

          try {
            console.log('📅 [GOOGLE-CALENDAR] Fetching calendars for:', account.email);
            const response = await googleCalendarService.getCalendars(account as GoogleAccount);
            
            if (response.success && response.data) {
              set((state) => {
                state.calendars = response.data!;
              });
            } else {
              throw new Error(response.error?.message || 'Failed to fetch calendars');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-CALENDAR] Failed to fetch calendars:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch calendars';
            });
          }
        },

        fetchEvents: async (timeMin?: string, timeMax?: string, accountId?: string) => {
          const account = accountId ? useSettingsStore.getState().integrations.googleAccounts.find(a => a.id === accountId) : get().getCurrentAccount();
          if (!account) {
            set((state) => {
              state.error = 'No authenticated account found';
            });
            return;
          }

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            console.log('📆 [GOOGLE-CALENDAR] Fetching events for:', account.email);
            
            // Set default time range if not provided (current month)
            const now = new Date();
            const defaultTimeMin = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const defaultTimeMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            
            const response = await googleCalendarService.getEvents(
              account as GoogleAccount, 
              get().currentCalendarId, 
              defaultTimeMin, 
              defaultTimeMax
            );
            
            if (response.success && response.data) {
              set((state) => {
                state.events = response.data!.items || [];
                state.isLoading = false;
                state.lastSyncAt = new Date();
              });
            } else {
              throw new Error(response.error?.message || 'Failed to fetch events');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-CALENDAR] Failed to fetch events:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch events';
              state.isLoading = false;
            });
          }
        },

        syncCalendar: async () => {
          console.log('🔄 [GOOGLE-CALENDAR] Syncing calendar');
          await Promise.all([
            get().fetchCalendars(),
            get().fetchEvents()
          ]);
        },

        // Event management
        createEvent: async (eventData: CalendarEventCreateRequest) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log('➕ [GOOGLE-CALENDAR] Creating event:', eventData.summary);
            const response = await googleCalendarService.createEvent(
              account, 
              eventData, 
              get().currentCalendarId
            );

            if (response.success && response.data) {
              set((state) => {
                state.events.unshift(response.data!);
              });
            } else {
              throw new Error(response.error?.message || 'Failed to create event');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-CALENDAR] Failed to create event:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to create event';
            });
          }
        },

        updateEvent: async (eventId: string, eventData: Partial<CalendarEventCreateRequest>) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`✏️ [GOOGLE-CALENDAR] Updating event: ${eventId}`);
            const response = await googleCalendarService.updateEvent(
              account, 
              eventId, 
              eventData, 
              get().currentCalendarId
            );

            if (response.success && response.data) {
              set((state) => {
                const index = state.events.findIndex(e => e.id === eventId);
                if (index !== -1) {
                  state.events[index] = response.data!;
                }
              });
            } else {
              throw new Error(response.error?.message || 'Failed to update event');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-CALENDAR] Failed to update event:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update event';
            });
          }
        },

        deleteEvent: async (eventId: string) => {
          const account = get().getCurrentAccount();
          if (!account) return;

          try {
            console.log(`🗑️ [GOOGLE-CALENDAR] Deleting event: ${eventId}`);
            const response = await googleCalendarService.deleteEvent(
              account, 
              eventId, 
              get().currentCalendarId
            );

            if (response.success) {
              set((state) => {
                state.events = state.events.filter(e => e.id !== eventId);
              });
            } else {
              throw new Error(response.error?.message || 'Failed to delete event');
            }
          } catch (error) {
            console.error('❌ [GOOGLE-CALENDAR] Failed to delete event:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to delete event';
            });
          }
        },

        // Calendar management
        setCurrentCalendar: (calendarId: string) => {
          set((state) => {
            state.currentCalendarId = calendarId;
          });
          // Refetch events for the new calendar
          get().fetchEvents();
        },

        // Utility
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        getEvent: (eventId: string) => {
          return get().events.find(event => event.id === eventId);
        },
      })),
      {
        name: 'google-calendar-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          events: state.events,
          calendars: state.calendars,
          currentCalendarId: state.currentCalendarId,
          lastSyncAt: state.lastSyncAt,
        }),
        onRehydrateStorage: () => (state) => {
          console.log('🔄 [GOOGLE-CALENDAR] Store hydrated from localStorage');
          if (state) {
            state.isHydrated = true;
          }
        },
      }
    )
  )
);

// Fallback hydration
setTimeout(() => {
  const state = useGoogleCalendarStore.getState();
  if (!state.isHydrated) {
    console.log('🔄 [GOOGLE-CALENDAR] Manual hydration fallback triggered');
    useGoogleCalendarStore.setState({ isHydrated: true });
  }
}, 100); 
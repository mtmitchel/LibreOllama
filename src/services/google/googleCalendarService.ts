import { invoke } from '@tauri-apps/api/core';
import { 
  GoogleAccount, 
  GoogleCalendarEvent, 
  CalendarEventCreateRequest, 
  ApiResponse, 
  PaginatedResponse,
  GoogleApiError 
} from '../../types/google';

// Always use real Tauri invoke - no mock data
const apiInvoke = invoke;

class GoogleCalendarService {
  private async handleApiError(error: any): Promise<GoogleApiError> {
    console.error('Google Calendar API Error:', error);
    return {
      code: error.code || 500,
      message: error.message || 'An error occurred',
      status: error.status || 'INTERNAL_ERROR'
    };
  }

  async getEvents(
    account: GoogleAccount,
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250
  ): Promise<ApiResponse<PaginatedResponse<GoogleCalendarEvent>>> {
    try {
      console.log('[GoogleCalendarService] Fetching events with params:', {
        accountId: account.id,
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
      });
      
      const response = await apiInvoke('get_calendar_events', {
        accountId: account.id,
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        // Request extendedProperties explicitly
        fields: 'items(id,summary,description,start,end,extendedProperties,status,visibility,created,updated,etag),nextPageToken'
      });

      console.log('[GoogleCalendarService] Raw response sample:', {
        itemCount: (response as any).items?.length,
        firstItem: (response as any).items?.[0]
      });

      return {
        success: true,
        data: response as PaginatedResponse<GoogleCalendarEvent>
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async createEvent(
    account: GoogleAccount,
    eventData: any, // GoogleCalendarEvent format expected by backend
    calendarId: string = 'primary'
  ): Promise<ApiResponse<GoogleCalendarEvent>> {
    try {
      console.log('[GoogleCalendarService] Creating event with data:', {
        accountId: account.id,
        calendarId,
        eventData,
        extendedProperties: eventData.extendedProperties
      });

      const response = await apiInvoke('create_calendar_event', {
        accountId: account.id,
        calendarId,
        eventData,
      });

      console.log('[GoogleCalendarService] Created event response:', response);

      return {
        success: true,
        data: response as GoogleCalendarEvent
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async updateEvent(
    account: GoogleAccount,
    eventId: string,
    eventData: Partial<CalendarEventCreateRequest>,
    calendarId: string = 'primary'
  ): Promise<ApiResponse<GoogleCalendarEvent>> {
    try {
      const response = await apiInvoke('update_calendar_event', {
        accountId: account.id,
        calendarId,
        eventId,
        eventData,
      });

      return {
        success: true,
        data: response as GoogleCalendarEvent
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async deleteEvent(
    account: GoogleAccount,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<ApiResponse<void>> {
    try {
      await apiInvoke('delete_calendar_event', {
        accountId: account.id,
        calendarId,
        eventId,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }

  async getCalendars(account: GoogleAccount): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiInvoke('get_calendars', {
        accountId: account.id,
      });
      
      return {
        success: true,
        data: response as any[]
      };
    } catch (error) {
      return {
        success: false,
        error: await this.handleApiError(error)
      };
    }
  }
}

export const googleCalendarService = new GoogleCalendarService(); 
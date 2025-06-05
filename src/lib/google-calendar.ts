// Google Calendar API Service for LibreOllama

import { GoogleAuthService } from './google-auth';
import {
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleCalendarListResponse,
  GoogleCalendarEventsResponse,
  GoogleApiResponse
} from './google-types';

export class GoogleCalendarService {
  private authService: GoogleAuthService;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleCalendarListResponse>(
        `${this.baseUrl}/users/me/calendarList`
      );

      return response.items.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        timeZone: calendar.timeZone,
        colorId: calendar.colorId,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
        accessRole: calendar.accessRole,
        primary: calendar.primary,
        selected: calendar.selected
      }));
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      throw error;
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getCalendarEvents(
    calendarId: string,
    options: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    } = {}
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      params.set('singleEvents', 'true');
      params.set('orderBy', 'startTime');
      
      if (options.timeMin) params.set('timeMin', options.timeMin);
      if (options.timeMax) params.set('timeMax', options.timeMax);
      if (options.maxResults) params.set('maxResults', options.maxResults.toString());
      if (options.singleEvents !== undefined) params.set('singleEvents', options.singleEvents.toString());
      if (options.orderBy) params.set('orderBy', options.orderBy);

      const response = await this.authService.makeAuthenticatedRequest<GoogleCalendarEventsResponse>(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
      );

      return response.items.map(event => ({
        ...event,
        calendarId
      }));
    } catch (error) {
      console.error(`Failed to fetch events for calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Get events from multiple calendars for a date range
   */
  async getEventsForDateRange(
    calendarIds: string[],
    startDate: Date,
    endDate: Date,
    maxResults: number = 250
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();

      const eventPromises = calendarIds.map(calendarId =>
        this.getCalendarEvents(calendarId, {
          timeMin,
          timeMax,
          maxResults: Math.ceil(maxResults / calendarIds.length),
          singleEvents: true,
          orderBy: 'startTime'
        }).catch(error => {
          console.warn(`Failed to fetch events for calendar ${calendarId}:`, error);
          return [];
        })
      );

      const eventArrays = await Promise.all(eventPromises);
      const allEvents = eventArrays.flat();

      // Sort by start time
      return allEvents.sort((a, b) => {
        const aStart = a.start.dateTime || a.start.date || '';
        const bStart = b.start.dateTime || b.start.date || '';
        return new Date(aStart).getTime() - new Date(bStart).getTime();
      });
    } catch (error) {
      console.error('Failed to fetch events for date range:', error);
      throw error;
    }
  }

  /**
   * Get today's events across all calendars
   */
  async getTodaysEvents(calendarIds?: string[]): Promise<GoogleCalendarEvent[]> {
    try {
      const calendars = calendarIds || (await this.getCalendars()).map(cal => cal.id);
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      return this.getEventsForDateRange(calendars, startOfDay, endOfDay);
    } catch (error) {
      console.error('Failed to fetch today\'s events:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(calendarIds?: string[], days: number = 7): Promise<GoogleCalendarEvent[]> {
    try {
      const calendars = calendarIds || (await this.getCalendars()).map(cal => cal.id);
      
      const now = new Date();
      const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

      return this.getEventsForDateRange(calendars, now, endDate);
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(calendarId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleCalendarEvent>(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event)
        }
      );

      return { ...response, calendarId };
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GoogleCalendarEvent>(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(event)
        }
      );

      return { ...response, calendarId };
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE'
        }
      );
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * Get free/busy information for calendars
   */
  async getFreeBusy(
    calendarIds: string[],
    timeMin: string,
    timeMax: string
  ): Promise<any> {
    try {
      const requestBody = {
        timeMin,
        timeMax,
        items: calendarIds.map(id => ({ id }))
      };

      return await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/freebusy`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
    } catch (error) {
      console.error('Failed to get free/busy information:', error);
      throw error;
    }
  }

  /**
   * Watch for calendar changes (webhooks)
   */
  async watchCalendar(calendarId: string, webhookUrl: string): Promise<any> {
    try {
      const requestBody = {
        id: `libre-ollama-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
      };

      return await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
    } catch (error) {
      console.error('Failed to setup calendar watch:', error);
      throw error;
    }
  }

  /**
   * Convert Google Calendar event to LibreOllama format
   */
  convertToLibreOllamaEvent(event: GoogleCalendarEvent): any {
    const startDate = event.start.dateTime 
      ? new Date(event.start.dateTime)
      : new Date(event.start.date + 'T00:00:00');
      
    const endDate = event.end.dateTime
      ? new Date(event.end.dateTime)
      : new Date(event.end.date + 'T23:59:59');

    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: startDate,
      end: endDate,
      calendarId: event.calendarId,
      description: event.description,
      location: event.location,
      isAllDay: !event.start.dateTime,
      color: event.colorId ? this.getColorForEvent(event.colorId) : undefined,
      status: event.status,
      attendees: event.attendees?.length || 0,
      hasConference: !!event.conferenceData,
      source: 'google-calendar',
      googleEventId: event.id,
      htmlLink: event.htmlLink
    };
  }

  /**
   * Get color for event based on colorId
   */
  private getColorForEvent(colorId: string): string {
    const colorMap: Record<string, string> = {
      '1': '#a4bdfc', // Lavender
      '2': '#7ae7bf', // Sage
      '3': '#dbadff', // Grape
      '4': '#ff887c', // Flamingo
      '5': '#fbd75b', // Banana
      '6': '#ffb878', // Tangerine
      '7': '#46d6db', // Peacock
      '8': '#e1e1e1', // Graphite
      '9': '#5484ed', // Blueberry
      '10': '#51b749', // Basil
      '11': '#dc2127'  // Tomato
    };

    return colorMap[colorId] || '#4285f4';
  }

  /**
   * Search for events
   */
  async searchEvents(calendarId: string, query: string): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await this.authService.makeAuthenticatedRequest<GoogleCalendarEventsResponse>(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
      );

      return response.items.map(event => ({
        ...event,
        calendarId
      }));
    } catch (error) {
      console.error('Failed to search events:', error);
      throw error;
    }
  }

  /**
   * Get calendar metadata
   */
  async getCalendarMetadata(calendarId: string): Promise<any> {
    try {
      return await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}`
      );
    } catch (error) {
      console.error('Failed to get calendar metadata:', error);
      throw error;
    }
  }
}
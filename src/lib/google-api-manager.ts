// Google API Manager - Unified interface for all Google services in LibreOllama

import { GoogleAuthService, DEV_GOOGLE_CONFIG } from './google-auth';
import { GoogleCalendarService } from './google-calendar';
import { GoogleTasksService } from './google-tasks';
import { GmailService } from './google-gmail';
import {
  GoogleCredentials,
  GoogleAuthState,
  GoogleIntegrationStatus,
  GoogleSyncConfig,
  GoogleEventHandlers,
  GoogleApiQuota
} from './google-types';

export class GoogleApiManager {
  private authService: GoogleAuthService;
  private calendarService: GoogleCalendarService;
  private tasksService: GoogleTasksService;
  private gmailService: GmailService;
  
  private syncConfig: GoogleSyncConfig;
  private eventHandlers: Partial<GoogleEventHandlers> = {};
  private syncIntervals: { [key: string]: NodeJS.Timeout } = {};
  private quotaLimits: Record<string, GoogleApiQuota> = {};

  constructor(credentials?: GoogleCredentials) {
    this.authService = new GoogleAuthService(credentials || DEV_GOOGLE_CONFIG);
    this.calendarService = new GoogleCalendarService(this.authService);
    this.tasksService = new GoogleTasksService(this.authService);
    this.gmailService = new GmailService(this.authService);

    // Default sync configuration
    this.syncConfig = {
      calendar: {
        enabled: true,
        syncInterval: 30, // 30 minutes
        calendarsToSync: [],
        lookAheadDays: 30
      },
      tasks: {
        enabled: true,
        syncInterval: 15, // 15 minutes
        taskListsToSync: []
      },
      gmail: {
        enabled: true,
        syncInterval: 5, // 5 minutes
        labelsToSync: ['INBOX', 'IMPORTANT'],
        maxMessages: 100
      }
    };

    this.loadSyncConfig();
  }

  // Authentication Methods
  async authenticate(): Promise<void> {
    const authUrl = this.authService.getAuthUrl();
    
    // In a Tauri app, we'll open the auth URL in the default browser
    // and handle the callback through a custom protocol or local server
    try {
      // For now, we'll assume the user handles the OAuth flow externally
      // and provides the authorization code
      throw new Error('Please implement OAuth flow for your platform');
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async handleAuthCallback(code: string): Promise<void> {
    try {
      await this.authService.exchangeCodeForTokens(code);
      await this.startSyncServices();
      this.notifyAuthStateChange();
    } catch (error) {
      console.error('Auth callback handling failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.stopSyncServices();
      await this.authService.signOut();
      this.notifyAuthStateChange();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  getAuthState(): GoogleAuthState {
    return this.authService.getAuthState();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Service Access Methods
  getCalendarService(): GoogleCalendarService {
    return this.calendarService;
  }

  getTasksService(): GoogleTasksService {
    return this.tasksService;
  }

  getGmailService(): GmailService {
    return this.gmailService;
  }

  // Integration Status
  async getIntegrationStatus(): Promise<GoogleIntegrationStatus> {
    if (!this.isAuthenticated()) {
      return {
        calendar: { connected: false, lastSync: null, calendarsCount: 0, error: 'Not authenticated' },
        tasks: { connected: false, lastSync: null, taskListsCount: 0, error: 'Not authenticated' },
        gmail: { connected: false, lastSync: null, unreadCount: 0, error: 'Not authenticated' },
        overallStatus: 'disconnected'
      };
    }

    try {
      const [calendars, taskLists, emailStats] = await Promise.allSettled([
        this.calendarService.getCalendars(),
        this.tasksService.getTaskLists(),
        this.gmailService.getEmailStatistics()
      ]);

      const calendarStatus = {
        connected: calendars.status === 'fulfilled',
        lastSync: this.getLastSync('calendar'),
        calendarsCount: calendars.status === 'fulfilled' ? calendars.value.length : 0,
        error: calendars.status === 'rejected' ? calendars.reason.message : null
      };

      const tasksStatus = {
        connected: taskLists.status === 'fulfilled',
        lastSync: this.getLastSync('tasks'),
        taskListsCount: taskLists.status === 'fulfilled' ? taskLists.value.length : 0,
        error: taskLists.status === 'rejected' ? taskLists.reason.message : null
      };

      const gmailStatus = {
        connected: emailStats.status === 'fulfilled',
        lastSync: this.getLastSync('gmail'),
        unreadCount: emailStats.status === 'fulfilled' ? emailStats.value.unreadCount : 0,
        error: emailStats.status === 'rejected' ? emailStats.reason.message : null
      };

      const connectedServices = [calendarStatus.connected, tasksStatus.connected, gmailStatus.connected].filter(Boolean).length;
      let overallStatus: 'connected' | 'partial' | 'disconnected' | 'error';
      
      if (connectedServices === 3) {
        overallStatus = 'connected';
      } else if (connectedServices > 0) {
        overallStatus = 'partial';
      } else if (calendarStatus.error || tasksStatus.error || gmailStatus.error) {
        overallStatus = 'error';
      } else {
        overallStatus = 'disconnected';
      }

      return {
        calendar: calendarStatus,
        tasks: tasksStatus,
        gmail: gmailStatus,
        overallStatus
      };
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }

  // Sync Configuration
  getSyncConfig(): GoogleSyncConfig {
    return { ...this.syncConfig };
  }

  updateSyncConfig(updates: Partial<GoogleSyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...updates };
    this.saveSyncConfig();
    this.restartSyncServices();
  }

  // Event Handlers
  setEventHandlers(handlers: Partial<GoogleEventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Sync Services
  async startSyncServices(): Promise<void> {
    if (!this.isAuthenticated()) {
      console.warn('Cannot start sync services: not authenticated');
      return;
    }

    this.stopSyncServices();

    if (this.syncConfig.calendar.enabled) {
      this.startCalendarSync();
    }

    if (this.syncConfig.tasks.enabled) {
      this.startTasksSync();
    }

    if (this.syncConfig.gmail.enabled) {
      this.startGmailSync();
    }
  }

  stopSyncServices(): void {
    Object.values(this.syncIntervals).forEach(interval => clearInterval(interval));
    this.syncIntervals = {};
  }

  private startCalendarSync(): void {
    const syncFunction = async () => {
      try {
        await this.syncCalendarData();
        this.setLastSync('calendar');
      } catch (error) {
        console.error('Calendar sync failed:', error);
        this.eventHandlers.onError?.(error as any);
      }
    };

    // Initial sync
    syncFunction();

    // Periodic sync with longer intervals to reduce CPU load
    const intervalMinutes = Math.max(this.syncConfig.calendar.syncInterval, 15); // Minimum 15 minutes
    const interval = setInterval(syncFunction, intervalMinutes * 60 * 1000);
    this.syncIntervals.calendar = interval;
  }

  private startTasksSync(): void {
    const syncFunction = async () => {
      try {
        await this.syncTasksData();
        this.setLastSync('tasks');
      } catch (error) {
        console.error('Tasks sync failed:', error);
        this.eventHandlers.onError?.(error as any);
      }
    };

    // Initial sync
    syncFunction();

    // Periodic sync with longer intervals to reduce CPU load
    const intervalMinutes = Math.max(this.syncConfig.tasks.syncInterval, 30); // Minimum 30 minutes
    const interval = setInterval(syncFunction, intervalMinutes * 60 * 1000);
    this.syncIntervals.tasks = interval;
  }

  private startGmailSync(): void {
    const syncFunction = async () => {
      try {
        await this.syncGmailData();
        this.setLastSync('gmail');
      } catch (error) {
        console.error('Gmail sync failed:', error);
        this.eventHandlers.onError?.(error as any);
      }
    };

    // Initial sync
    syncFunction();

    // Periodic sync with longer intervals to reduce CPU load
    const intervalMinutes = Math.max(this.syncConfig.gmail.syncInterval, 60); // Minimum 60 minutes
    const interval = setInterval(syncFunction, intervalMinutes * 60 * 1000);
    this.syncIntervals.gmail = interval;
  }

  private restartSyncServices(): void {
    if (this.isAuthenticated()) {
      this.startSyncServices();
    }
  }

  // Data Sync Methods
  private async syncCalendarData(): Promise<void> {
    try {
      const calendars = await this.calendarService.getCalendars();
      const calendarsToSync = this.syncConfig.calendar.calendarsToSync.length > 0
        ? this.syncConfig.calendar.calendarsToSync
        : calendars.map(cal => cal.id);

      const events = await this.calendarService.getUpcomingEvents(
        calendarsToSync,
        this.syncConfig.calendar.lookAheadDays
      );

      // Convert and emit events
      events.forEach(event => {
        const libreOllamaEvent = this.calendarService.convertToLibreOllamaEvent(event);
        this.eventHandlers.onCalendarEvent?.(event);
      });
    } catch (error) {
      console.error('Calendar data sync failed:', error);
      throw error;
    }
  }

  private async syncTasksData(): Promise<void> {
    try {
      const allTasksData = await this.tasksService.getAllTasks({ showCompleted: false });
      
      allTasksData.forEach(({ taskList, tasks }) => {
        if (this.syncConfig.tasks.taskListsToSync.length === 0 || 
            this.syncConfig.tasks.taskListsToSync.includes(taskList.id)) {
          tasks.forEach(task => {
            const libreOllamaTask = this.tasksService.convertToLibreOllamaTask(task, taskList.title);
            this.eventHandlers.onTaskUpdate?.(task);
          });
        }
      });
    } catch (error) {
      console.error('Tasks data sync failed:', error);
      throw error;
    }
  }

  private async syncGmailData(): Promise<void> {
    try {
      const unreadMessages = await this.gmailService.getUnreadMessages(this.syncConfig.gmail.maxMessages);
      
      unreadMessages.forEach(message => {
        if (this.syncConfig.gmail.labelsToSync.some(label => message.labelIds.includes(label))) {
          this.eventHandlers.onEmailReceived?.(message);
        }
      });
    } catch (error) {
      console.error('Gmail data sync failed:', error);
      throw error;
    }
  }

  // Quick Actions
  async getQuickOverview(): Promise<{
    todaysEvents: any[];
    incompleteTasks: any[];
    unreadEmails: any[];
    upcomingDeadlines: any[];
  }> {
    if (!this.isAuthenticated()) {
      return {
        todaysEvents: [],
        incompleteTasks: [],
        unreadEmails: [],
        upcomingDeadlines: []
      };
    }

    try {
      const [todaysEvents, incompleteTasks, unreadEmails] = await Promise.allSettled([
        this.calendarService.getTodaysEvents(),
        this.tasksService.getIncompleteTasks(),
        this.gmailService.getUnreadMessages(10)
      ]);

      // Get tasks with due dates for upcoming deadlines
      const tasksWithDueDates = incompleteTasks.status === 'fulfilled' 
        ? incompleteTasks.value.filter(task => task.due)
        : [];

      return {
        todaysEvents: todaysEvents.status === 'fulfilled' ? todaysEvents.value.map(e => this.calendarService.convertToLibreOllamaEvent(e)) : [],
        incompleteTasks: incompleteTasks.status === 'fulfilled' ? incompleteTasks.value.map(t => this.tasksService.convertToLibreOllamaTask(t)) : [],
        unreadEmails: unreadEmails.status === 'fulfilled' ? unreadEmails.value.map(m => this.gmailService.convertToLibreOllamaFormat(m)) : [],
        upcomingDeadlines: tasksWithDueDates.map(t => this.tasksService.convertToLibreOllamaTask(t))
      };
    } catch (error) {
      console.error('Failed to get quick overview:', error);
      throw error;
    }
  }

  // Utility Methods
  private notifyAuthStateChange(): void {
    const authState = this.getAuthState();
    this.eventHandlers.onAuthStateChange?.(authState);
  }

  private getLastSync(service: string): string | null {
    try {
      return localStorage.getItem(`libre_ollama_google_${service}_last_sync`);
    } catch {
      return null;
    }
  }

  private setLastSync(service: string): void {
    try {
      localStorage.setItem(`libre_ollama_google_${service}_last_sync`, new Date().toISOString());
    } catch (error) {
      console.warn(`Failed to save last sync time for ${service}:`, error);
    }
  }

  private loadSyncConfig(): void {
    try {
      const stored = localStorage.getItem('libre_ollama_google_sync_config');
      if (stored) {
        this.syncConfig = { ...this.syncConfig, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load sync config:', error);
    }
  }

  private saveSyncConfig(): void {
    try {
      localStorage.setItem('libre_ollama_google_sync_config', JSON.stringify(this.syncConfig));
    } catch (error) {
      console.warn('Failed to save sync config:', error);
    }
  }

  // Rate limiting and quota management
  async checkApiQuotas(): Promise<Record<string, GoogleApiQuota>> {
    // This would need to be implemented with actual quota tracking
    // For now, return default values
    return {
      calendar: {
        service: 'calendar',
        requestsPerDay: 1000000,
        requestsPerMinute: 250,
        requestsRemaining: 950000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      tasks: {
        service: 'tasks',
        requestsPerDay: 250000,
        requestsPerMinute: 250,
        requestsRemaining: 240000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      gmail: {
        service: 'gmail',
        requestsPerDay: 1000000000,
        requestsPerMinute: 250,
        requestsRemaining: 990000000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  // Health check
  async performHealthCheck(): Promise<{
    authStatus: boolean;
    servicesReachable: { calendar: boolean; tasks: boolean; gmail: boolean };
    lastSyncTimes: { calendar: string | null; tasks: string | null; gmail: string | null };
    quotaStatus: Record<string, GoogleApiQuota>;
  }> {
    const authStatus = this.isAuthenticated();
    
    let servicesReachable = { calendar: false, tasks: false, gmail: false };
    
    if (authStatus) {
      try {
        const [calendarCheck, tasksCheck, gmailCheck] = await Promise.allSettled([
          this.calendarService.getCalendars().then(() => true).catch(() => false),
          this.tasksService.getTaskLists().then(() => true).catch(() => false),
          this.gmailService.getProfile().then(() => true).catch(() => false)
        ]);

        servicesReachable = {
          calendar: calendarCheck.status === 'fulfilled' && calendarCheck.value,
          tasks: tasksCheck.status === 'fulfilled' && tasksCheck.value,
          gmail: gmailCheck.status === 'fulfilled' && gmailCheck.value
        };
      } catch (error) {
        console.warn('Health check service reachability test failed:', error);
      }
    }

    return {
      authStatus,
      servicesReachable,
      lastSyncTimes: {
        calendar: this.getLastSync('calendar'),
        tasks: this.getLastSync('tasks'),
        gmail: this.getLastSync('gmail')
      },
      quotaStatus: await this.checkApiQuotas()
    };
  }
}

// Export singleton instance
export const googleApiManager = new GoogleApiManager();
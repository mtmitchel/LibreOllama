import { useGoogleCalendarStore } from '../stores/googleCalendarStore';
import { logger } from '../core/lib/logger';

class GoogleCalendarAutoSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isEnabled = true;
  private syncIntervalMinutes = 5; // Default 5 minutes

  constructor() {
    this.setupAutoSync();
  }

  private setupAutoSync() {
    // Subscribe to calendar store changes
    useGoogleCalendarStore.subscribe((state, prevState) => {
      // Start sync when authentication status changes
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        logger.info('[CALENDAR-SYNC] Authentication detected, starting auto-sync');
        this.startSync();
      }

      // Stop sync when signed out
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        logger.info('[CALENDAR-SYNC] Signed out, stopping auto-sync');
        this.stopSync();
      }
    });

    // Check if already authenticated on init
    const { isAuthenticated } = useGoogleCalendarStore.getState();
    if (isAuthenticated) {
      this.startSync();
    }
  }

  private async performSync() {
    if (!this.isEnabled) return;

    const calendarStore = useGoogleCalendarStore.getState();
    
    if (!calendarStore.isAuthenticated) {
      logger.warn('[CALENDAR-SYNC] Cannot sync - not authenticated');
      return;
    }

    try {
      logger.info('[CALENDAR-SYNC] Starting periodic sync...');
      const startTime = Date.now();

      // Get current month's time range
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Sync calendars and events
      await Promise.all([
        calendarStore.fetchCalendars(),
        calendarStore.fetchEvents(timeMin, timeMax)
      ]);

      const duration = Date.now() - startTime;
      logger.info(`[CALENDAR-SYNC] Sync completed in ${duration}ms`);
    } catch (error) {
      logger.error('[CALENDAR-SYNC] Sync failed:', error);
    }
  }

  startSync() {
    if (this.syncInterval) {
      logger.warn('[CALENDAR-SYNC] Sync already running');
      return;
    }

    // Perform initial sync
    this.performSync();

    // Set up interval (convert minutes to milliseconds)
    const intervalMs = this.syncIntervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMs);

    logger.info(`[CALENDAR-SYNC] Auto-sync started (every ${this.syncIntervalMinutes} minutes)`);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('[CALENDAR-SYNC] Auto-sync stopped');
    }
  }

  restartSync() {
    this.stopSync();
    this.startSync();
  }

  setSyncInterval(minutes: number) {
    this.syncIntervalMinutes = minutes;
    this.restartSync();
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSync();
    } else {
      const { isAuthenticated } = useGoogleCalendarStore.getState();
      if (isAuthenticated) {
        this.startSync();
      }
    }
  }

  // Force an immediate sync
  async syncNow() {
    logger.info('[CALENDAR-SYNC] Manual sync triggered');
    await this.performSync();
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.syncInterval !== null,
      isEnabled: this.isEnabled,
      intervalMinutes: this.syncIntervalMinutes,
      lastSync: useGoogleCalendarStore.getState().lastSyncAt
    };
  }
}

// Singleton instance
export const googleCalendarAutoSync = new GoogleCalendarAutoSync();

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    googleCalendarAutoSync.stopSync();
  });
}
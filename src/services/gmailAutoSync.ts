import { useMailStore } from '../features/mail/stores/mailStore';
import { logger } from '../core/lib/logger';

class GmailAutoSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isEnabled = true;
  private syncIntervalMinutes = 5; // Default 5 minutes

  constructor() {
    this.setupAutoSync();
  }

  private setupAutoSync() {
    // Subscribe to mail store changes
    useMailStore.subscribe((state, prevState) => {
      // Start sync when authentication status changes
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        logger.info('[GMAIL-SYNC] Authentication detected, starting auto-sync');
        this.startSync();
      }

      // Stop sync when signed out
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        logger.info('[GMAIL-SYNC] Signed out, stopping auto-sync');
        this.stopSync();
      }

      // Update sync interval if settings change
      if (state.settings.syncInterval !== prevState.settings.syncInterval) {
        this.syncIntervalMinutes = state.settings.syncInterval;
        logger.info(`[GMAIL-SYNC] Sync interval updated to ${this.syncIntervalMinutes} minutes`);
        if (state.isAuthenticated) {
          this.restartSync();
        }
      }
    });

    // Check if already authenticated on init
    const { isAuthenticated } = useMailStore.getState();
    if (isAuthenticated) {
      this.startSync();
    }
  }

  private async performSync() {
    if (!this.isEnabled) return;

    const mailStore = useMailStore.getState();
    
    if (!mailStore.isAuthenticated || !mailStore.currentAccountId) {
      logger.warn('[GMAIL-SYNC] Cannot sync - not authenticated or no account selected');
      return;
    }

    try {
      logger.info('[GMAIL-SYNC] Starting periodic sync...');
      const startTime = Date.now();

      // Sync current label/folder
      await mailStore.fetchMessages(
        mailStore.selectedLabelId,
        undefined,
        undefined,
        mailStore.currentAccountId
      );

      // Update last sync timestamp
      mailStore.setLastSyncTime(new Date());

      const duration = Date.now() - startTime;
      logger.info(`[GMAIL-SYNC] Sync completed in ${duration}ms`);
    } catch (error) {
      logger.error('[GMAIL-SYNC] Sync failed:', error);
    }
  }

  startSync() {
    if (this.syncInterval) {
      logger.warn('[GMAIL-SYNC] Sync already running');
      return;
    }

    // Perform initial sync
    this.performSync();

    // Set up interval (convert minutes to milliseconds)
    const intervalMs = this.syncIntervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMs);

    logger.info(`[GMAIL-SYNC] Auto-sync started (every ${this.syncIntervalMinutes} minutes)`);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('[GMAIL-SYNC] Auto-sync stopped');
    }
  }

  restartSync() {
    this.stopSync();
    this.startSync();
  }

  setSyncInterval(minutes: number) {
    this.syncIntervalMinutes = minutes;
    const mailStore = useMailStore.getState();
    mailStore.updateSettings({ syncInterval: minutes });
    this.restartSync();
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSync();
    } else {
      const { isAuthenticated } = useMailStore.getState();
      if (isAuthenticated) {
        this.startSync();
      }
    }
  }

  // Force an immediate sync
  async syncNow() {
    logger.info('[GMAIL-SYNC] Manual sync triggered');
    await this.performSync();
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.syncInterval !== null,
      isEnabled: this.isEnabled,
      intervalMinutes: this.syncIntervalMinutes,
      lastSync: useMailStore.getState().lastSyncTime
    };
  }
}

// Singleton instance
export const gmailAutoSync = new GmailAutoSync();

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    gmailAutoSync.stopSync();
  });
}
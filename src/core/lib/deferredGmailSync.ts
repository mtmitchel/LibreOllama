import { deferUntilCanvasReady } from './deferUntilCanvasReady';
import { logger } from './logger';

/**
 * Deferred Gmail sync initialization
 * Prevents Gmail sync from blocking first paint by deferring until after canvas is ready
 */
class DeferredGmailSync {
  private static instance: DeferredGmailSync;
  private gmailAutoSync: any = null;
  private isInitialized = false;

  static getInstance(): DeferredGmailSync {
    if (!DeferredGmailSync.instance) {
      DeferredGmailSync.instance = new DeferredGmailSync();
    }
    return DeferredGmailSync.instance;
  }

  /**
   * Initialize Gmail auto-sync after canvas is ready and during idle time
   */
  public initializeGmailSync(): void {
    if (this.isInitialized) {
      logger.debug('[DeferredGmailSync] Gmail sync already initialized');
      return;
    }

    logger.debug('[DeferredGmailSync] Deferring Gmail sync initialization until after first paint');

    // Defer until canvas is ready, then wait for idle time
    deferUntilCanvasReady(() => {
      // Use requestIdleCallback for additional deferral during idle time
      const scheduleInit = () => {
        if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(() => {
            this.performInit();
          }, { timeout: 5000 }); // Fallback timeout of 5s
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            this.performInit();
          }, 100);
        }
      };

      scheduleInit();
    }, { idleTimeout: 3000 });
  }

  private performInit(): void {
    if (this.isInitialized) return;

    try {
      logger.debug('[DeferredGmailSync] Initializing Gmail auto-sync');
      
      // Dynamic import to avoid loading Gmail sync code during initial bundle parse
      import('../../services/gmailAutoSync').then(({ gmailAutoSync }) => {
        // Initialize the Gmail auto-sync system
        gmailAutoSync.initialize();
        this.gmailAutoSync = gmailAutoSync;
        this.isInitialized = true;
        logger.debug('[DeferredGmailSync] Gmail auto-sync initialized successfully');
      }).catch((error) => {
        logger.error('[DeferredGmailSync] Failed to load Gmail auto-sync:', error);
      });
    } catch (error) {
      logger.error('[DeferredGmailSync] Failed to initialize Gmail auto-sync:', error);
    }
  }

  /**
   * Get the Gmail auto-sync instance if initialized
   */
  public getGmailSync(): any | null {
    if (!this.isInitialized) {
      logger.warn('[DeferredGmailSync] Gmail sync not yet initialized');
      return null;
    }
    return this.gmailAutoSync;
  }

  /**
   * Check if Gmail sync is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const deferredGmailSync = DeferredGmailSync.getInstance();
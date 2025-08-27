import { LLMProviderManager, type LLMProviderSettings } from '../../services/llmProviders';
import { deferUntilCanvasReady } from './deferUntilCanvasReady';
import { logger } from './logger';

/**
 * Centralized, debounced LLMProviderManager initialization
 * Prevents multiple reinitializations during startup by deferring until canvas is ready
 */
class DeferredProviderManager {
  private static instance: DeferredProviderManager;
  private isInitialized = false;
  private isInitializing = false;
  private pendingSettings: LLMProviderSettings | null = null;
  private initQueue: Array<() => void> = [];

  static getInstance(): DeferredProviderManager {
    if (!DeferredProviderManager.instance) {
      DeferredProviderManager.instance = new DeferredProviderManager();
    }
    return DeferredProviderManager.instance;
  }

  /**
   * Initialize or reinitialize the LLM provider manager
   * All calls are debounced and deferred until canvas is ready
   */
  public initializeProvider(settings: LLMProviderSettings, callback?: () => void): void {
    this.pendingSettings = settings;
    
    if (callback) {
      this.initQueue.push(callback);
    }

    if (this.isInitializing) {
      logger.debug('[DeferredProviderManager] Already initializing, queuing request');
      return;
    }

    if (this.isInitialized) {
      // If already initialized, reinitialize immediately with new settings
      this.performReinitialize();
      return;
    }

    // First-time initialization - defer until canvas is ready
    this.isInitializing = true;
    logger.debug('[DeferredProviderManager] Deferring LLM provider initialization until canvas is ready');

    deferUntilCanvasReady(() => {
      this.performInitialize();
    }, { idleTimeout: 2000 });
  }

  private performInitialize(): void {
    if (!this.pendingSettings) {
      logger.warn('[DeferredProviderManager] No pending settings to initialize');
      this.isInitializing = false;
      return;
    }

    try {
      logger.debug('[DeferredProviderManager] Initializing LLM provider manager');
      LLMProviderManager.getInstance(this.pendingSettings);
      this.isInitialized = true;
      this.isInitializing = false;

      // Process any queued callbacks
      const callbacks = [...this.initQueue];
      this.initQueue = [];
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          logger.error('[DeferredProviderManager] Callback error:', error);
        }
      });

      logger.debug('[DeferredProviderManager] LLM provider manager initialized successfully');
    } catch (error) {
      logger.error('[DeferredProviderManager] Failed to initialize LLM provider manager:', error);
      this.isInitializing = false;
    }
  }

  private performReinitialize(): void {
    if (!this.pendingSettings) return;

    try {
      logger.debug('[DeferredProviderManager] Reinitializing LLM provider manager');
      LLMProviderManager.getInstance().reinitialize(this.pendingSettings);

      // Process any queued callbacks
      const callbacks = [...this.initQueue];
      this.initQueue = [];
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          logger.error('[DeferredProviderManager] Callback error:', error);
        }
      });

      logger.debug('[DeferredProviderManager] LLM provider manager reinitialized successfully');
    } catch (error) {
      logger.error('[DeferredProviderManager] Failed to reinitialize LLM provider manager:', error);
    }
  }

  /**
   * Get the current provider manager instance if initialized
   */
  public getProviderManager(): LLMProviderManager | null {
    if (!this.isInitialized) {
      logger.warn('[DeferredProviderManager] Provider manager not yet initialized');
      return null;
    }
    return LLMProviderManager.getInstance();
  }

  /**
   * Check if the provider manager is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const deferredProviderManager = DeferredProviderManager.getInstance();
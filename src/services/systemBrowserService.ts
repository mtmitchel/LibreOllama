import { invoke } from '@tauri-apps/api/core';
import { logger } from '../core/lib/logger';

/**
 * Service for opening URLs in the system default browser (Chrome in your case)
 * This is separate from the browserModalService which opens URLs in Tauri windows
 */
class SystemBrowserService {
  /**
   * Open a URL in the system's default browser
   * Used for external links that should open outside the app
   */
  async openInSystemBrowser(url: string): Promise<void> {
    try {
      // Validate URL
      if (!this.isValidURL(url)) {
        logger.error('Invalid URL provided:', url);
        throw new Error('Invalid URL provided');
      }

      logger.debug('Opening URL in system browser:', url);
      
      // Use the Tauri command that properly respects Windows default browser
      await invoke('open_url_in_system_browser', { url });
      
      logger.debug('Successfully opened URL in system browser');
    } catch (error) {
      logger.error('Failed to open URL in system browser:', error);
      // Fallback to window.open if Tauri command fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  private isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}

export const systemBrowserService = new SystemBrowserService();
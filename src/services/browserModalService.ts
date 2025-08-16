import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { logger } from '../core/lib/logger';

export interface BrowserModalOptions {
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

class BrowserModalService {
  private openModals: Map<string, WebviewWindow> = new Map();

  async openModal(options: BrowserModalOptions): Promise<string> {
    try {
      // Validate URL
      if (!this.isValidURL(options.url)) {
        console.error('Invalid URL provided:', options.url);
        throw new Error('Invalid URL provided');
      }

      console.log('[browserModalService] Opening browser window with options:', options);

      // Open single-window browser shell with DS chrome
      const windowLabel = await invoke<string>('open_browser_shell_window', {
        url: options.url,
        title: options.title || this.getTitleFromUrl(options.url),
        width: options.width || 1200,
        height: options.height || 820,
      });

      console.log('[browserModalService] Browser window opened successfully:', windowLabel);
      logger.debug('Opened browser modal:', { windowLabel, url: options.url });

      // Track the window if available
      const window = WebviewWindow.getByLabel(windowLabel);
      if (window) {
        this.openModals.set(windowLabel, window);
        await window.onCloseRequested(() => {
          this.openModals.delete(windowLabel);
        });
      }

      return windowLabel;
    } catch (error) {
      console.error('Failed to open browser modal:', error);
      logger.error('Failed to open browser modal:', error);
      // Let caller decide fallback strategy to avoid duplicates
      throw error;
    }
  }

  async closeModal(windowLabel: string): Promise<void> {
    try {
      await invoke('close_browser_window', { windowLabel });
      this.openModals.delete(windowLabel);
    } catch (error) {
      logger.error('Failed to close browser modal:', error);
    }
  }

  async closeAllModals(): Promise<void> {
    const promises = Array.from(this.openModals.keys()).map(label => 
      this.closeModal(label)
    );
    await Promise.all(promises);
  }

  async navigateModal(windowLabel: string, url: string): Promise<void> {
    try {
      await invoke('navigate_browser_window', { windowLabel, url });
    } catch (error) {
      logger.error('Failed to navigate browser modal:', error);
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

  private getTitleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'Browser';
    }
  }

  private openInSystemBrowser(url: string): void {
    // Fallback to regular browser
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export const browserModalService = new BrowserModalService();
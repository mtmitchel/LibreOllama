import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '../../core/lib/logger';

interface NativeBrowserWindowProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  height?: number;
}

export function NativeBrowserWindow({ 
  url, 
  isOpen, 
  onClose,
  title = 'LibreOllama Browser',
  width = 1200,
  height = 800 
}: NativeBrowserWindowProps) {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open the native browser window
  const openWindow = useCallback(async () => {
    if (!url || !isOpen || windowLabel) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const label = await invoke<string>('open_browser_window', {
        options: {
          url,
          title,
          width,
          height
        }
      });
      
      setWindowLabel(label);
      logger.debug('Opened native browser window:', { label, url });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to open browser window:', errorMsg);
      setError(errorMsg);
      
      // Fallback to opening in default browser
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsLoading(false);
    }
  }, [url, isOpen, windowLabel, title, width, height]);

  // Close the native browser window
  const closeWindow = useCallback(async () => {
    if (!windowLabel) return;
    
    try {
      await invoke('close_browser_window', { windowLabel });
      logger.debug('Closed native browser window:', windowLabel);
    } catch (err) {
      logger.error('Failed to close browser window:', err);
    } finally {
      setWindowLabel(null);
      onClose();
    }
  }, [windowLabel, onClose]);

  // Navigate to a new URL in the existing window
  const navigateWindow = useCallback(async (newUrl: string) => {
    if (!windowLabel) return;
    
    try {
      await invoke('navigate_browser_window', { 
        windowLabel, 
        url: newUrl 
      });
      logger.debug('Navigated browser window to:', newUrl);
    } catch (err) {
      logger.error('Failed to navigate browser window:', err);
    }
  }, [windowLabel]);

  // Open window when isOpen becomes true
  useEffect(() => {
    if (isOpen && !windowLabel) {
      openWindow();
    } else if (!isOpen && windowLabel) {
      closeWindow();
    }
  }, [isOpen, windowLabel, openWindow, closeWindow]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (windowLabel) {
        closeWindow();
      }
    };
  }, [windowLabel, closeWindow]);

  // Handle URL changes
  useEffect(() => {
    if (windowLabel && url) {
      navigateWindow(url);
    }
  }, [url, windowLabel, navigateWindow]);

  // Since this is a native window, we don't render anything in the DOM
  // The window is managed entirely through Tauri commands
  return null;
}
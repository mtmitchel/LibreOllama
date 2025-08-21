import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, RefreshCw, ExternalLink, Minimize2, Maximize2, Copy, BookOpen } from 'lucide-react';
import { Button } from '../ui';
import { browserModalService } from '../../services/browserModalService';
import { useLinkPreviewStore } from '../../stores/linkPreviewStore';
import { cn } from '../../core/lib/utils';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';

function getExternalUrlForCopy(inputUrl: string): string {
  try {
    if (!inputUrl) return inputUrl;
    // Support both hash and pathname reader routes
    // Examples:
    //   http://localhost:1423/reader?url=<ENC>
    //   index.html#/reader?url=<ENC>
    const urlObj = new URL(inputUrl, window.location.origin);
    const full = urlObj.href;
    const isReaderPath = full.includes('/reader') || full.includes('#/reader');
    if (isReaderPath) {
      const search = full.includes('#/reader') ? full.split('#/reader')[1] : urlObj.search;
      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      const encoded = params.get('url') || '';
      if (encoded) {
        try { return decodeURIComponent(encoded); } catch { return encoded; }
      }
    }
    // Fallback: if we accidentally navigated to an internal route like /browser-shell
    if (full.includes('/browser-shell') || full.includes('#/browser-shell')) {
      const search = full.includes('#/browser-shell') ? full.split('#/browser-shell')[1] : urlObj.search;
      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      const encoded = params.get('url') || '';
      if (encoded) {
        try { return decodeURIComponent(encoded); } catch { return encoded; }
      }
    }
    return full;
  } catch {
    return inputUrl;
  }
}

interface BrowserModalControllerProps {
  windowLabel?: string;
  url: string;
  mode?: 'overlay' | 'toolbar';
}

export function BrowserModalController({ windowLabel, url, mode = 'overlay' }: BrowserModalControllerProps) {
  const { closeLinkPreview } = useLinkPreviewStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const navigate = useNavigate();

  const handleClose = async () => {
    if (windowLabel) {
      await browserModalService.closeModal(windowLabel);
    }
    closeLinkPreview();
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = async () => {
    if (windowLabel) {
      // Navigate to same URL to refresh
      await browserModalService.navigateModal(windowLabel, currentUrl);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Get current URL from the browser window
      let urlToCopy = currentUrl;
      if (windowLabel) {
        try {
          const actualUrl = await invoke<string>('get_browser_window_url', { windowLabel });
          urlToCopy = getExternalUrlForCopy(actualUrl);
          setCurrentUrl(actualUrl);
        } catch (err) {
          // Use current URL if we can't get the actual one
        }
      }
      // Normalize for reader/app shell URLs
      urlToCopy = getExternalUrlForCopy(urlToCopy);
      await navigator.clipboard.writeText(urlToCopy);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleReaderView = async () => {
    try {
      // Get current URL from the browser window
      let targetUrl = currentUrl;
      if (windowLabel) {
        try {
          targetUrl = await invoke<string>('get_browser_window_url', { windowLabel });
          setCurrentUrl(targetUrl);
        } catch (err) {
          console.error('Failed to get browser URL:', err);
        }
      }
      
      // Navigate the content webview to reader view
      // Since we're using BrowserRouter in dev, use path directly
      const readerUrl = window.location.hostname === 'localhost'
        ? `http://localhost:1423/reader?url=${encodeURIComponent(targetUrl)}`
        : `${window.location.origin}#/reader?url=${encodeURIComponent(targetUrl)}`;
      await browserModalService.navigateModal(windowLabel, readerUrl);
    } catch (error) {
      console.error('Failed to open reader view:', error);
    }
  };

  // Update current URL periodically
  useEffect(() => {
    if (!windowLabel) return;
    
    const updateUrl = async () => {
      try {
        const actualUrl = await invoke<string>('get_browser_window_url', { windowLabel });
        setCurrentUrl(actualUrl);
      } catch (error) {
        // Window might be closed
      }
    };
    
    const interval = setInterval(updateUrl, 1000);
    return () => clearInterval(interval);
  }, [windowLabel]);

  // Toolbar mode: render a full-width top bar for the controller window
  if (mode === 'toolbar') {
    return (
      <div
        className="absolute top-0 left-0 right-0 h-14 flex items-center justify-end gap-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-3 z-50"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <Button size="icon" variant="ghost" onClick={handleRefresh} className="h-8 w-8" title="Refresh">
            <RefreshCw size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopyLink}
            className={cn("h-8 w-8", copyStatus === 'copied' && "text-green-600 dark:text-green-400")}
            title={copyStatus === 'copied' ? "Copied!" : "Copy link"}
          >
            <Copy size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleReaderView} className="h-8 w-8" title="Reader view">
            <BookOpen size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleOpenExternal} className="h-8 w-8" title="Open in browser">
            <ExternalLink size={16} />
          </Button>
          <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            title="Close"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  if (!windowLabel) return null;

  // Overlay mode: render floating control bar in the main window
  return createPortal(
    <div className={cn(
      "fixed top-4 right-4 z-[10000] flex items-center gap-2 rounded-lg",
      "bg-white dark:bg-gray-900",
      "border border-gray-200 dark:border-gray-700 shadow-lg",
      "px-3 py-2",
      isMinimized && "opacity-50"
    )}>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleRefresh}
          className="h-7 w-7"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopyLink}
          className={cn(
            "h-7 w-7",
            copyStatus === 'copied' && "text-green-600 dark:text-green-400"
          )}
          title={copyStatus === 'copied' ? "Copied!" : "Copy link"}
        >
          <Copy size={14} />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleReaderView}
          className="h-7 w-7"
          title="Reader view"
        >
          <BookOpen size={14} />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleOpenExternal}
          className="h-7 w-7"
          title="Open in browser"
        >
          <ExternalLink size={14} />
        </Button>
        
        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="h-7 w-7 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="Close"
        >
          <X size={14} />
        </Button>
      </div>
    </div>,
    document.body
  );
}
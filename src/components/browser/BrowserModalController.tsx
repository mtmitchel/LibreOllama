import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, RefreshCw, ExternalLink, Minimize2, Maximize2, Copy, BookOpen } from 'lucide-react';
import { Button } from '../ui';
import { browserModalService } from '../../services/browserModalService';
import { useLinkPreviewStore } from '../../stores/linkPreviewStore';
import { cn } from '../../core/lib/utils';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';

interface BrowserModalControllerProps {
  windowLabel?: string;
  url: string;
}

export function BrowserModalController({ windowLabel, url }: BrowserModalControllerProps) {
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
          urlToCopy = actualUrl;
          setCurrentUrl(actualUrl);
        } catch (err) {
          // Use current URL if we can't get the actual one
        }
      }
      
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
        targetUrl = await invoke<string>('get_browser_window_url', { windowLabel });
        setCurrentUrl(targetUrl);
      }
      
      // Open reader view in a new window/route
      // We'll pass the URL as a query parameter
      const encodedUrl = encodeURIComponent(targetUrl);
      window.open(`#/reader?url=${encodedUrl}`, '_blank', 'width=800,height=900');
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

  if (!windowLabel) return null;

  // Render a floating control bar for the browser window
  return createPortal(
    <div className={cn(
      "fixed top-4 right-4 z-[10000] flex items-center gap-2 rounded-lg",
      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
      "border border-gray-200 dark:border-gray-700 shadow-lg",
      "px-3 py-2 transition-all duration-200",
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
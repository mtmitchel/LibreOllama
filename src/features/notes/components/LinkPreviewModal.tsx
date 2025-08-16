import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { cn } from '../../../core/lib/utils';
import { browserModalService } from '../../../services/browserModalService';

interface LinkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function LinkPreviewModal({ isOpen, onClose, url }: LinkPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigationHistoryRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

  // Reset state when URL changes
  useEffect(() => {
    if (url && url !== currentUrl) {
      setCurrentUrl(url);
      navigationHistoryRef.current = [url];
      currentIndexRef.current = 0;
      setCanGoBack(false);
      setCanGoForward(false);
      setIsLoading(true);
      setLoadError(false);
    }
  }, [url]);

  // In Tauri, open a native browser window instead of iframing
  useEffect(() => {
    if (!isOpen) return;
    if (!url) return;
    if (!isTauri) return;

    (async () => {
      try {
        await browserModalService.openModal({ url, title: 'Browser' });
        // Don't close the modal - let the LinkPreviewProvider handle it
        // This keeps the state alive for the BrowserModalController
      } catch (err) {
        // If native window fails, stay in modal and allow user to open externally
        setLoadError(true);
        // Still don't close - let user decide
      }
    })();
  }, [isOpen, url, isTauri]);

  // Handle iframe load events
  useEffect(() => {
    if (!iframeRef.current || !isOpen) return;

    const handleLoad = () => {
      setIsLoading(false);
      setLoadError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setLoadError(true);
    };

    const iframe = iframeRef.current;
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [isOpen, currentUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setLoadError(false);
      iframeRef.current.src = currentUrl;
    }
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBack = () => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const newUrl = navigationHistoryRef.current[currentIndexRef.current];
      setCurrentUrl(newUrl);
      setCanGoForward(true);
      setCanGoBack(currentIndexRef.current > 0);
    }
  };

  const handleForward = () => {
    if (currentIndexRef.current < navigationHistoryRef.current.length - 1) {
      currentIndexRef.current++;
      const newUrl = navigationHistoryRef.current[currentIndexRef.current];
      setCurrentUrl(newUrl);
      setCanGoBack(true);
      setCanGoForward(currentIndexRef.current < navigationHistoryRef.current.length - 1);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex h-[85vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleBack}
              disabled={!canGoBack}
              className="h-8 w-8"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleForward}
              disabled={!canGoForward}
              className="h-8 w-8"
              title="Go forward"
            >
              <ArrowRight size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefresh}
              className="h-8 w-8"
              title="Refresh"
            >
              <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* URL bar */}
          <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 asana-text-sm dark:bg-gray-700">
            <Globe size={14} className="text-gray-400" />
            <span className="flex-1 truncate text-gray-600 dark:text-gray-300">
              {currentUrl}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleOpenExternal}
              className="h-8 w-8"
              title="Open in browser"
            >
              <ExternalLink size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              title="Close"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-gray-100 dark:bg-gray-950">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="asana-text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-gray-900">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="asana-text-lg font-medium text-gray-700 dark:text-gray-300">
                    This site can't be embedded
                  </p>
                  <p className="mt-1 asana-text-sm text-gray-500 dark:text-gray-400">
                    {currentUrl.includes('instacart') ? 'Instacart' : 
                     currentUrl.includes('amazon') ? 'Amazon' :
                     currentUrl.includes('netflix') ? 'Netflix' :
                     currentUrl.includes('facebook') ? 'Facebook' :
                     currentUrl.includes('instagram') ? 'Instagram' :
                     currentUrl.includes('twitter') || currentUrl.includes('x.com') ? 'X/Twitter' :
                     'This website'} blocks embedding for security and privacy reasons.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleOpenExternal}
                    className="mt-4"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Open in browser instead
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isTauri && currentUrl && (
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Link preview"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
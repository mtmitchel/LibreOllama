import React, { useEffect, useRef, useState } from 'react';
import { LinkPreviewModal } from '../../features/notes/components/LinkPreviewModal';
import { browserModalService } from '../../services/browserModalService';
import { useLinkPreviewStore } from '../../stores/linkPreviewStore';
import { logger } from '../../core/lib/logger';
import { BrowserModalController } from '../browser/BrowserModalController';

export function LinkPreviewProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, url, openLinkPreview, closeLinkPreview } = useLinkPreviewStore();
  const currentWindowLabel = useRef<string | null>(null);
  const [currentBrowserUrl, setCurrentBrowserUrl] = useState<string | null>(null);
  const originalWindowOpenRef = useRef<typeof window.open | null>(null);
  const suppressOpenRef = useRef<{ url: string; until: number } | null>(null);

  useEffect(() => {
    // Monkey-patch window.open to suppress duplicate opens triggered by other handlers
    if (!originalWindowOpenRef.current) {
      originalWindowOpenRef.current = window.open.bind(window);
      const originalOpen = originalWindowOpenRef.current;
      window.open = ((url?: string | URL, target?: string, features?: string) => {
        try {
          if (typeof url === 'string' && suppressOpenRef.current) {
            const now = performance.now();
            if (now <= suppressOpenRef.current.until && url === suppressOpenRef.current.url) {
              console.debug('[LinkPreview] Suppressed duplicate window.open for', url);
              return null as unknown as Window | null;
            }
          }
        } catch {}
        return originalOpen(url as any, target, features);
      }) as any;
    }

    const handleGlobalLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      // Skip if it's an internal link or has a specific handler
      const href = anchor.getAttribute('href');
      if (!href) return;
      
      // Skip internal navigation links
      if (href.startsWith('#') || href.startsWith('/') || href.startsWith('javascript:')) {
        return;
      }
      
      // Skip if the link has a data attribute to bypass preview
      if (anchor.hasAttribute('data-no-preview')) {
        return;
      }
      
      // Skip if it's within the notes editor (which has its own handler)
      if (anchor.closest('.block-note-editor')) {
        return;
      }
      
      // Skip mailto and tel links
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      
      // Prevent default and open in native browser window when possible
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Link clicked, opening in browser:', href);
      try {
        // Suppress other window.open calls for the same URL briefly
        suppressOpenRef.current = { url: href, until: performance.now() + 1500 };
        const windowLabel = await browserModalService.openModal({
          url: href,
          title: 'Browser'
        });
        currentWindowLabel.current = windowLabel;
        setCurrentBrowserUrl(href);
        console.log('Browser window opened with label:', windowLabel);
      } catch (err) {
        console.error('Failed to open Tauri browser window, falling back to system browser:', err);
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    };

    // Add listener to capture phase to intercept before other handlers
    document.addEventListener('click', handleGlobalLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalLinkClick, true);
      // Restore original window.open
      if (originalWindowOpenRef.current) {
        window.open = originalWindowOpenRef.current;
        originalWindowOpenRef.current = null;
      }
    };
  }, [openLinkPreview]);

  // Note: Do not tie native window lifecycle to the iframe modal store.
  // The native window is controlled via the BrowserModalController.

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (currentWindowLabel.current) {
        browserModalService.closeModal(currentWindowLabel.current);
      }
    };
  }, []);

  return (
    <>
      {children}
      {/* Browser control bar for native browser windows */}
      {currentWindowLabel.current && currentBrowserUrl && (
        <BrowserModalController 
          windowLabel={currentWindowLabel.current}
          url={currentBrowserUrl}
        />
      )}
      {/* Optional: keep iframe modal for specific internal previews if ever needed */}
      <LinkPreviewModal 
        isOpen={isOpen}
        url={url}
        onClose={closeLinkPreview}
      />
    </>
  );
}
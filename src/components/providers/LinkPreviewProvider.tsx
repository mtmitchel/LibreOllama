import React, { useEffect, useRef, useState } from 'react';
import { LinkPreviewModal } from '../../features/notes/components/LinkPreviewModal';
import { browserModalService } from '../../services/browserModalService';
import { useLinkPreviewStore } from '../../stores/linkPreviewStore';
import { logger } from '../../core/lib/logger';
import { BrowserModalController } from '../browser/BrowserModalController';

export function LinkPreviewProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, url, openLinkPreview, closeLinkPreview } = useLinkPreviewStore();
  const currentWindowLabelRef = useRef<string | null>(null);
  const [currentWindowLabel, setCurrentWindowLabel] = useState<string | null>(null);
  const [currentBrowserUrl, setCurrentBrowserUrl] = useState<string | null>(null);
  const originalWindowOpenRef = useRef<typeof window.open | null>(null);
  const suppressOpenRef = useRef<{ url: string; until: number } | null>(null);

  useEffect(() => {
    const handleOpened = (e: Event) => {
      const detail = (e as CustomEvent).detail as { windowLabel: string; url: string } | undefined;
      if (detail?.windowLabel) {
        setCurrentWindowLabel(detail.windowLabel);
        setCurrentBrowserUrl(detail.url || null);
      }
    };
    const handleClosed = (e: Event) => {
      const detail = (e as CustomEvent).detail as { windowLabel: string } | undefined;
      if (detail?.windowLabel && detail.windowLabel === currentWindowLabelRef.current) {
        setCurrentWindowLabel(null);
        setCurrentBrowserUrl(null);
        currentWindowLabelRef.current = null;
      }
    };

    window.addEventListener('browser:opened', handleOpened as EventListener);
    window.addEventListener('browser:closed', handleClosed as EventListener);
    return () => {
      window.removeEventListener('browser:opened', handleOpened as EventListener);
      window.removeEventListener('browser:closed', handleClosed as EventListener);
    };
  }, []);

  useEffect(() => {
    if (currentWindowLabelRef.current && !currentWindowLabel) {
      setCurrentWindowLabel(currentWindowLabelRef.current);
    }
  }, [currentWindowLabel]);

  useEffect(() => {
    // Global CAPTURE handler: cancel native navigation for external links
    const capturePreventNativeNavigation = (e: MouseEvent) => {
      try {
        // Ignore clicks originating from our own link preview modal
        const target = e.target as HTMLElement;
        if (target && (target.closest('[data-no-preview]') || target.closest('.link-preview-modal'))) {
          return;
        }
        const path = (e.composedPath && e.composedPath()) || [];
        // Find the first anchor element in the composed path
        let anchorEl: HTMLElement | null = null;
        for (const el of path) {
          const node = el as HTMLElement;
          if (node && node.tagName === 'A') { anchorEl = node; break; }
        }
        const target = e.target as HTMLElement;
        const anchor = (anchorEl as HTMLAnchorElement) || target.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href') || '';
        const original = anchor.getAttribute('data-original-href') || '';
        const url = original || href;
        if (!url) return;
        if (url.startsWith('mailto:') || url.startsWith('tel:')) return;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          e.preventDefault();
          // Do not stop propagation here; allow shadow/global handlers to decide opening
        }
      } catch {}
    };

    document.addEventListener('click', capturePreventNativeNavigation, true);

    // Monkey-patch window.open to suppress duplicate opens triggered by other handlers
    if (!originalWindowOpenRef.current) {
      originalWindowOpenRef.current = window.open.bind(window);
      const originalOpen = originalWindowOpenRef.current;
      window.open = ((url?: string | URL, target?: string, features?: string) => {
        try {
          const now = performance.now();
          // Suppress duplicates opened by our own global handler
          if (typeof url === 'string' && suppressOpenRef.current) {
            if (now <= suppressOpenRef.current.until && url === suppressOpenRef.current.url) {
              console.debug('[LinkPreview] Suppressed duplicate window.open for', url);
              return null as unknown as Window | null;
            }
          }
          // Also suppress any window.open during a ShadowEmailRenderer-handled click window
          const skipUntil = (window as any).__skipGlobalLinkUntil as number | undefined;
          if (typeof skipUntil === 'number' && now <= skipUntil) {
            console.debug('[LinkPreview] Suppressed window.open during shadow email handling');
            return null as unknown as Window | null;
          }
        } catch {}
        return originalOpen(url as any, target, features);
      }) as any;
    }

    const handleGlobalLinkClick = async (e: MouseEvent) => {
      // Global shadow-email suppression flag (set by ShadowEmailRenderer)
      try {
        const skipUntil = (window as any).__skipGlobalLinkUntil as number | undefined;
        if (typeof skipUntil === 'number' && performance.now() <= skipUntil) {
          // Shadow email click already handled; skip global handling
          return;
        }
      } catch {}
      // Check if this event was already handled by shadow DOM
      if ((e as any)._shadowHandled) {
        console.log('Link already handled by shadow DOM, skipping');
        return;
      }
      
      const target = e.target as HTMLElement;

      // Ignore clicks from our own link preview modal controls
      if (target && (target.closest('[data-no-preview]') || target.closest('.link-preview-modal'))) {
        return;
      }
      
      // IMPORTANT: Skip ALL events from shadow email containers
      // Prefer composedPath to detect the shadow host boundary
      const path = (e.composedPath && e.composedPath()) || [];
      if (
        path.some((el) => (el as any)?.classList?.contains?.('shadow-email-container')) ||
        target.closest('.shadow-email-container') ||
        target.classList.contains('shadow-email-container')
      ) {
        return;
      }
      
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      // Skip if the link is marked as shadow-handled
      if (anchor.hasAttribute('data-shadow-handled')) {
        console.log('Link marked as shadow-handled, skipping');
        return;
      }
      
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
      
      // Notes (BlockNote) links should be handled here too so the toolbar shows
      
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
        currentWindowLabelRef.current = windowLabel;
        setCurrentWindowLabel(windowLabel);
        setCurrentBrowserUrl(href);
        console.log('Browser window opened with label:', windowLabel);
      } catch (err) {
        console.error('Failed to open Tauri browser window:', err);
        // Avoid falling back to system browser to prevent duplicates
      }
    };

    // Add listener in BUBBLE phase so Shadow DOM capture handlers can stop it first
    document.addEventListener('click', handleGlobalLinkClick, false);
    
    return () => {
      document.removeEventListener('click', handleGlobalLinkClick, false);
      document.removeEventListener('click', capturePreventNativeNavigation, true);
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
      if (currentWindowLabelRef.current) {
        browserModalService.closeModal(currentWindowLabelRef.current);
      }
    };
  }, []);

  return (
    <>
      {children}
      {/* Browser control bar for native browser windows */}
      {/* Remove floating overlay toolbar; the toolbar is embedded inside the browser window itself */}
      {/* Optional: keep iframe modal for specific internal previews if ever needed */}
      <LinkPreviewModal 
        isOpen={isOpen}
        url={url}
        onClose={closeLinkPreview}
      />
    </>
  );
}

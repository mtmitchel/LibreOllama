import React, { useEffect, useRef } from 'react';
import { logger } from '../../../core/lib/logger';
import { browserModalService } from '../../../services/browserModalService';

interface ShadowEmailRendererProps {
  html: string;
  className?: string;
  onLinkClick?: (url: string) => void;
}

/**
 * Renders email HTML content in a Shadow DOM to completely isolate styles.
 * This prevents the app's CSS from interfering with email styles and vice versa.
 */
export function ShadowEmailRenderer({ html, className = '', onLinkClick }: ShadowEmailRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create shadow root if it doesn't exist
    if (!shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'closed' });
      logger.debug('Created closed Shadow DOM for email rendering');
    }

    const shadowRoot = shadowRootRef.current;

    // Create the email content with isolated styles
    const emailContent = `
      <style>
        /* Reset styles for the shadow DOM */
        :host {
          all: initial;
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
        }

        /* Ensure images don't break layout */
        img {
          max-width: 100%;
          height: auto;
          display: inline-block;
        }

        /* Preserve table layouts for emails */
        table {
          border-collapse: separate;
          border-spacing: 0;
        }

        /* Links should look like links */
        a {
          color: #1a73e8;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        /* Common email wrapper widths */
        .email-wrapper {
          max-width: 100%;
          margin: 0 auto;
        }

        /* Center fixed-width tables */
        table[width="600"],
        table[width="640"],
        table[width="700"] {
          margin-left: auto !important;
          margin-right: auto !important;
        }

        /* Ensure background images work */
        [style*="background-image"] {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* Handle tracking pixels gracefully */
        img[width="1"][height="1"],
        img[width="0"][height="0"] {
          display: none !important;
        }

        /* Responsive images in email */
        @media only screen and (max-width: 600px) {
          table[width="600"],
          table[width="640"],
          table[width="700"] {
            width: 100% !important;
            max-width: 100% !important;
          }

          img {
            width: auto !important;
            max-width: 100% !important;
            height: auto !important;
          }
        }
      </style>
      <div class="email-wrapper">
        ${html}
      </div>
    `;

    // Update shadow DOM content
    shadowRoot.innerHTML = emailContent;

    // Normalize external anchors to prevent native navigation by the webview
    const anchors = Array.from(shadowRoot.querySelectorAll('a')) as HTMLAnchorElement[];
    anchors.forEach((a) => {
      const href = a.getAttribute('href') || '';
      // Keep mailto/tel intact; only normalize http(s)
      if (href.startsWith('http://') || href.startsWith('https://')) {
        a.setAttribute('data-original-href', href);
        // Remove href entirely to disable native webview navigation
        a.removeAttribute('href');
        a.setAttribute('role', 'link');
        a.setAttribute('tabindex', '0');
        a.style.cursor = a.style.cursor || 'pointer';
      }
    });

    // Keyboard accessibility: handle Enter on link-like elements without href
    shadowRoot.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement;
      const link = target.closest('a[role="link"][data-original-href], [role="link"][data-original-href]') as HTMLElement | null;
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        const href = link.getAttribute('data-original-href');
        if (href) {
          (window as any).__skipGlobalLinkUntil = performance.now() + 1200;
          await browserModalService.openModal({ url: href, title: 'Browser' });
        }
      } catch {}
    }, true);

    // Handle image errors within shadow DOM - just hide failed images
    const images = shadowRoot.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      img.addEventListener('error', () => {
        logger.warn(`🚫 Image failed in Shadow DOM: ${img.src}`);
        // Just hide failed images completely to preserve layout
        img.style.visibility = 'hidden';
        img.style.width = img.getAttribute('width') || 'auto';
        img.style.height = img.getAttribute('height') || 'auto';
      });
    });

    // Add a capture phase listener on the shadow root itself to intercept ALL clicks
    shadowRoot.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;
      
      const href = link.getAttribute('data-original-href') || link.getAttribute('href');
      if (!href) return;
      
      // For mailto and tel, let them work normally
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        return; // Don't prevent default
      }
      
      // For HTTP/HTTPS links, completely stop the event
      if (href.startsWith('http://') || href.startsWith('https://')) {
        // Stop EVERYTHING
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Mark as handled for any composed listeners outside
        try {
          (e as any)._shadowHandled = true;
          // Set a brief global suppression window for the document-level handler
          (window as any).__skipGlobalLinkUntil = performance.now() + 1200;
        } catch {}
        
        // Open directly with browserModalService
        try {
          logger.info('Opening email link from shadow DOM:', href);
          await browserModalService.openModal({ url: href, title: 'Browser' });
        } catch (err) {
          logger.error('Failed to open browser modal:', err);
          // Do not fallback to system browser to avoid duplicate openings
        }
      }
    }, true); // Use capture phase!

  }, [html, onLinkClick]);

  return (
    <div 
      ref={containerRef} 
      className={`shadow-email-container ${className}`}
      data-shadow-dom="true"
      style={{ width: '100%', minHeight: '200px' }}
    />
  );
}
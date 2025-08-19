import React, { useEffect, useRef } from 'react';
import { logger } from '../../../core/lib/logger';

interface ShadowEmailRendererProps {
  html: string;
  className?: string;
}

/**
 * Renders email HTML content in a Shadow DOM to completely isolate styles.
 * This prevents the app's CSS from interfering with email styles and vice versa.
 */
export function ShadowEmailRenderer({ html, className = '' }: ShadowEmailRendererProps) {
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

    // Handle clicks on links
    const links = shadowRoot.querySelectorAll('a');
    links.forEach((link: HTMLAnchorElement) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          // Dispatch custom event that LinkPreviewProvider can handle
          window.dispatchEvent(new CustomEvent('email-link-click', { 
            detail: { url: href } 
          }));
        }
      });
    });

  }, [html]);

  return (
    <div 
      ref={containerRef} 
      className={`shadow-email-container ${className}`}
      style={{ width: '100%', minHeight: '200px' }}
    />
  );
}
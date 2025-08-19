import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Letter } from 'react-letter';
import { ChevronDown, ChevronUp, Copy, Shield, Eye, EyeOff } from 'lucide-react';
import { Text, Button } from '../../../components/ui';
import { ParsedEmail } from '../types';
import GmailParsingService from '../services/gmailParsingService';
import { useMailStore } from '../stores/mailStore';
import { replaceFailedImagesWithIcons, getCachedCidUrl, cacheCidUrl, clearCidCache } from '../utils/iconFallbacks';
import { extractQuotedContent } from '../utils/secureSanitizer';
import { logger } from '../../../core/lib/logger';
import { imageProxyService } from '../services/imageProxyService';

interface EmailRendererProps {
  message: ParsedEmail;
  className?: string;
  showRawSource?: boolean;
}

interface SecurityNoticeProps {
  hasExternalImages: boolean;
  hasExternalLinks: boolean;
  onDismiss: () => void;
}

function SecurityNotice({ hasExternalImages, hasExternalLinks, onDismiss }: SecurityNoticeProps) {
  if (!hasExternalImages && !hasExternalLinks) return null;

  return (
    <div className="mb-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
        <div className="flex-1">
          <Text size="sm" weight="semibold" className="mb-1 text-[var(--text-secondary)]">
            Content notice
          </Text>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            {hasExternalImages && (
              <li>• External images have been blocked for privacy</li>
            )}
            {hasExternalLinks && (
              <li>• External links will open in a new tab</li>
            )}
          </ul>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-secondary hover:text-primary"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function EmailRenderer({ 
  message, 
  className = '', 
  showRawSource = false 
}: EmailRendererProps) {
  const { settings } = useMailStore();
  const [showQuoted, setShowQuoted] = useState(false);
  const [showImages, setShowImages] = useState(settings?.mailAlwaysShowImages ?? true);
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);
  const [processedHtml, setProcessedHtml] = useState<string>('');
  const [hasExternalImages, setHasExternalImages] = useState(false);
  const [hasExternalLinks, setHasExternalLinks] = useState(false);

  // Extract main content and quoted text
  const { main, quoted } = useMemo(() => {
    if (!message.body) return { main: message.snippet || '', quoted: null };
    
    // For raw source, show everything
    if (showRawSource) {
      return { main: message.body, quoted: null };
    }
    
    // Extract quoted content for regular view
    return extractQuotedContent(message.body);
  }, [message.body, message.snippet, showRawSource]);

  // Process CID images and proxy external images
  useEffect(() => {
    const processImages = async () => {
      if (!message.body) {
        setProcessedHtml(main);
        return;
      }

      let html = main;
      
      // First, proxy problematic external images if showing images
      if (showImages) {
        try {
          html = await imageProxyService.proxyImagesInHtml(html);
        } catch (error) {
          logger.warn('Failed to proxy images:', error);
        }
      }
      
      // Then handle CID images if we have attachments
      if (message.attachments?.length) {
        const cidRegex = /src=("|')cid:([^"']+)\1/gi;
        const matches = Array.from(html.matchAll(cidRegex));
      
      for (const match of matches) {
        const cid = match[2].replace(/[<>]/g, '');
        
        // Check cache first
        let blobUrl = getCachedCidUrl(cid);
        
        if (!blobUrl) {
          // Find attachment with this CID
          const attachment = message.attachments.find(
            a => (a.contentId || '').replace(/[<>]/g, '') === cid
          );
          
          if (attachment && message.accountId && message.messageId) {
            try {
              const data = await GmailParsingService.getGmailAttachment(
                message.accountId,
                message.messageId,
                attachment.id
              );
              const blob = new Blob([data], { type: attachment.mimeType || 'application/octet-stream' });
              blobUrl = URL.createObjectURL(blob);
              cacheCidUrl(cid, blobUrl);
            } catch (error) {
              logger.error('Failed to load CID attachment:', error);
            }
          }
        }
        
        if (blobUrl) {
          html = html.replace(match[0], `src="${blobUrl}"`);
        }
      }
      }
      
      setProcessedHtml(html);
    };

    processImages();
    
    // Cleanup
    return () => {
      clearCidCache();
    };
  }, [main, message]);

  // Detect external content
  useEffect(() => {
    const imgRegex = /<img[^>]+src=["'](?:https?:\/\/[^"']+)["'][^>]*>/gi;
    const linkRegex = /<a[^>]+href=["'](?:https?:\/\/[^"']+)["'][^>]*>/gi;
    
    setHasExternalImages(imgRegex.test(processedHtml));
    setHasExternalLinks(linkRegex.test(processedHtml));
  }, [processedHtml]);

  // Handle image URL rewriting
  const rewriteImageUrl = useCallback((url: string) => {
    if (!showImages) {
      // Block external images
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent gif
      }
    }
    return url;
  }, [showImages]);

  // Handle link rewriting for security
  const rewriteExternalLink = useCallback((url: string) => {
    // Could add link tracking or warning here
    return url;
  }, []);

  // Handle post-render for icon fallbacks
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Apply icon fallbacks to failed images if enabled
    if (settings?.mailUseSystemIconFallbacks !== false) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          replaceFailedImagesWithIcons(contentRef.current);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [processedHtml, settings?.mailUseSystemIconFallbacks]);

  if (showRawSource) {
    return (
      <div className={`${className} enhanced-message-renderer`}>
        <pre className="whitespace-pre-wrap font-mono text-xs bg-[var(--bg-secondary)] p-4 rounded">
          {message.body || message.snippet || 'No content available'}
        </pre>
      </div>
    );
  }

  return (
    <div className={`${className} enhanced-message-renderer`}>
      {/* Security Notice */}
      {showSecurityNotice && (
        <SecurityNotice
          hasExternalImages={hasExternalImages && !showImages}
          hasExternalLinks={hasExternalLinks}
          onDismiss={() => setShowSecurityNotice(false)}
        />
      )}

      {/* Image Toggle */}
      {hasExternalImages && (
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImages(!showImages)}
            className="gap-2"
          >
            {showImages ? <EyeOff size={14} /> : <Eye size={14} />}
            {showImages ? 'Hide images' : 'Show images'}
          </Button>
          <Text size="xs" variant="secondary">
            {showImages ? 'External images are displayed' : 'External images are blocked for privacy'}
          </Text>
        </div>
      )}

      {/* Main Email Content */}
      <div className="email-content-wrapper" ref={contentRef}>
        <Letter
          html={processedHtml}
          rewriteExternalResources={rewriteImageUrl}
          rewriteExternalLinks={rewriteExternalLink}
          allowedSchemas={['http', 'https', 'mailto', 'tel', 'data']}
          preserveCssPriority={true}
          className="email-content"
        />
      </div>

      {/* Quoted Text */}
      {quoted && (
        <div className="mt-4 border-l-4 border-[var(--border-default)] pl-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuoted(!showQuoted)}
            className="mb-2 text-xs text-[var(--text-secondary)]"
          >
            {showQuoted ? (
              <>
                <ChevronUp size={14} className="mr-1" />
                Hide quoted text
              </>
            ) : (
              <>
                <ChevronDown size={14} className="mr-1" />
                Show quoted text
              </>
            )}
          </Button>
          
          {showQuoted && (
            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {quoted}
            </div>
          )}
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .enhanced-message-renderer .email-content-wrapper {
          max-width: 100%;
          overflow-x: auto;
        }
        
        .enhanced-message-renderer .email-content {
          font-family: var(--font-family);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
        }
        
        /* Ensure wrapper tables are centered */
        .enhanced-message-renderer table[width="600"],
        .enhanced-message-renderer table[width="640"],
        .enhanced-message-renderer table[width="700"] {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        
        /* Footer image handling */
        .enhanced-message-renderer .email-content img[width="16"],
        .enhanced-message-renderer .email-content img[width="20"],
        .enhanced-message-renderer .email-content img[width="24"],
        .enhanced-message-renderer .email-content img[height="16"],
        .enhanced-message-renderer .email-content img[height="20"],
        .enhanced-message-renderer .email-content img[height="24"] {
          display: inline-block !important;
          vertical-align: middle !important;
        }
        
        /* Icon fallback styles */
        .enhanced-message-renderer .icon-fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 4px;
          color: var(--text-tertiary);
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
}
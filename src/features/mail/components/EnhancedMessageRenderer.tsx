import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, ExternalLink, Shield, AlertTriangle } from 'lucide-react';
import { Text, Button } from '../../../components/ui';
import { ParsedEmail, EmailAddress } from '../types';
import GmailParsingService from '../services/gmailParsingService';
import 'highlight.js/styles/github.css';
import { logger } from '../../../core/lib/logger';
import { sanitizeEmailHtml, sanitizePlainText, extractQuotedContent } from '../utils/secureSanitizer';
import { createIconFallbackElement, cacheCidUrl, getCachedCidUrl, clearCidCache } from '../utils/iconFallbacks';
import { useMailStore } from '../stores/mailStore';
import { imageProxyService } from '../services/imageProxyService';
import { ShadowEmailRenderer } from './ShadowEmailRenderer';

interface EnhancedMessageRendererProps {
  message: ParsedEmail;
  className?: string;
  enableImageLoading?: boolean;
  enableLinkPreview?: boolean;
  showRawSource?: boolean;
}

interface MessageContentProps {
  content: string;
  contentType: 'html' | 'text';
  enableImageLoading: boolean;
  enableLinkPreview: boolean;
  onLinkClick?: (url: string) => void;
  message?: ParsedEmail;
}

interface QuotedTextProps {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface SecurityWarningProps {
  warnings: string[];
  onDismiss: () => void;
}

// Security warning component for potentially unsafe content
function SecurityWarning({ warnings, onDismiss }: SecurityWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="mb-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
        <div className="flex-1">
          <Text size="sm" weight="semibold" className="mb-1 text-[var(--text-secondary)]">
            Security notice
          </Text>
          <ul className="space-y-1 asana-text-sm text-[var(--text-secondary)]">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
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

// Quoted text handler for email replies
function QuotedText({ content, isExpanded, onToggle }: QuotedTextProps) {
  const previewLength = 150;
  const preview = content.length > previewLength ? content.substring(0, previewLength) + '...' : content;

  return (
    <div className="border-border-default dark:bg-surface/50 my-4 rounded-r-lg border-l-4 bg-surface pl-4 dark:border-gray-600">
      <div className="py-3">
        {isExpanded ? (
          <div className="whitespace-pre-wrap asana-text-sm text-primary dark:text-muted">
            {content}
          </div>
        ) : (
          <div className="asana-text-sm text-secondary dark:text-muted">
            {preview}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="mt-2 text-[11px] text-secondary hover:text-primary dark:text-muted dark:hover:text-gray-200"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} className="mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" />
              Show quoted text ({Math.ceil(content.length / 100)} lines)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Enhanced message content renderer
function MessageContent({ content, contentType, enableImageLoading, enableLinkPreview, onLinkClick, message }: MessageContentProps) {
  const [processedContent, setProcessedContent] = useState('');
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Process and sanitize content
  useEffect(() => {
    const processHtml = async () => {
      if (contentType !== 'html') {
        const sanitized = sanitizePlainText(content);
        setProcessedContent(sanitized);
        setSecurityWarnings([]);
        return;
      }

      // Proxy all external images to bypass CORS
      let htmlToProcess = content;
      if (enableImageLoading) {
        try {
          logger.info('Proxying images for email content');
          htmlToProcess = await imageProxyService.proxyImagesInHtml(content);
        } catch (error) {
          logger.error('Failed to proxy images:', error);
        }
      }

      // Resolve cid: inline images to blob URLs before sanitization
      if (enableImageLoading && message) {
        const cidRegex = /<img([^>]*?)src=("|')cid:([^"']+)(\2)([^>]*?)>/gi;
        const replacements: Array<Promise<{ match: string; replacement: string }>> = [];
        htmlToProcess.replace(cidRegex, (full) => {
          const exec = cidRegex.exec(full);
          cidRegex.lastIndex = 0;
          if (!exec) return full;
          const pre = exec[1] || '';
          const cid = exec[3]?.replace(/[<>]/g, '') || '';
          const post = exec[5] || '';
          const att = message.attachments?.find(a => (a.contentId || '').replace(/[<>]/g, '') === cid);
          if (att && message.accountId && message.messageId) {
            // Check cache first
            const cached = getCachedCidUrl(cid);
            if (cached) {
              replacements.push(Promise.resolve({ match: full, replacement: `<img${pre}src="${cached}"${post}>` }));
            } else {
              const p = GmailParsingService.getGmailAttachment(message.accountId, message.messageId, att.id)
                .then((data) => {
                  const blob = new Blob([data], { type: att.mimeType || 'application/octet-stream' });
                  const url = URL.createObjectURL(blob);
                  cacheCidUrl(cid, url); // Cache for future use
                  return { match: full, replacement: `<img${pre}src="${url}"${post}>` };
                })
                .catch(() => ({ match: full, replacement: full }));
              replacements.push(p);
            }
          }
          return full;
        });

        if (replacements.length > 0) {
          const done = await Promise.all(replacements);
          done.forEach(({ match, replacement }) => {
            htmlToProcess = htmlToProcess.replace(match, replacement);
          });
        }
      }

      const result = sanitizeEmailHtml(htmlToProcess, {
        allowImages: true, // Always allow images through sanitization
        allowExternalLinks: true,
        allowStyles: true, // allow safe inline styles so marketing emails render correctly
        allowTables: true,
        maxNestingDepth: 50,
      });
      setProcessedContent(result.sanitized);
      setSecurityWarnings(result.warnings);
    };

    processHtml();
    
    // Cleanup CID cache on unmount or message change
    return () => {
      clearCidCache();
    };
  }, [content, contentType, enableImageLoading, message?.id]);

  // Link clicks are now handled globally by LinkPreviewProvider
  // No need for local link handling here

  return (
    <div>
      {showWarnings && (
        <SecurityWarning 
          warnings={securityWarnings} 
          onDismiss={() => setShowWarnings(false)} 
        />
      )}
      
      <div 
        ref={contentRef}
        className={`message-content ${contentType === 'html' ? 'html-content' : 'text-content'} text-text-primary max-w-full break-words font-sans asana-text-sm leading-relaxed`}
      >
        {contentType === 'html' ? (
          <ShadowEmailRenderer 
            html={processedContent}
            className="email-shadow-content"
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans asana-text-sm leading-relaxed">
            {processedContent}
          </pre>
        )}
      </div>
    </div>
  );
}

// Use the secure sanitizer's extractQuotedContent function instead

export function EnhancedMessageRenderer({ 
  message, 
  className = '', 
  enableImageLoading = false,
  enableLinkPreview = false,
  showRawSource = false
}: EnhancedMessageRendererProps) {
  const [showQuoted, setShowQuoted] = useState(false);
  const [showSource, setShowSource] = useState(showRawSource);
  const [contentType, setContentType] = useState<'html' | 'text'>('html');

  // Determine content to display
  const content = useMemo(() => {
    if (showSource) {
      return message.body || message.snippet || 'No content available';
    }

    // Prefer HTML content, fallback to text or snippet
    if (message.body) {
      // Try to detect if it's HTML or plain text
      const isHtml = /<[a-z][\s\S]*>/i.test(message.body);
      setContentType(isHtml ? 'html' : 'text');
      return message.body;
    }

    if (message.snippet) {
      setContentType('text');
      return message.snippet;
    }

    return 'No content available';
  }, [message.body, message.snippet, showSource]);

  // Extract quoted text
  const { main, quoted } = useMemo(() => {
    if (!showSource) {
      return extractQuotedContent(content);
    }
    return { main: content, quoted: null };
  }, [content, contentType, showSource]);

  // Link handling is now done globally by LinkPreviewProvider

  const handleCopyContent = () => {
    const textContent = contentType === 'html' 
      ? new DOMParser().parseFromString(main, 'text/html').body.textContent || ''
      : main;
    
    navigator.clipboard.writeText(textContent).then(() => {
      logger.debug('Content copied to clipboard');
    });
  };

  return (
    <div className={`enhanced-message-renderer ${className}`}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary p-2">
        <div className="flex items-center gap-2">
          <Text size="xs" variant="secondary">
            Content: {contentType.toUpperCase()} • {Math.ceil(content.length / 1000)}KB
          </Text>
          {enableImageLoading && (
            <span className="text-[11px] text-green-600 dark:text-green-400">
              🖼️ Images enabled
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyContent}
            className="text-[11px]"
          >
            <Copy size={12} className="mr-1" />
            Copy
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSource(!showSource)}
            className="text-[11px]"
          >
            <ExternalLink size={12} className="mr-1" />
            {showSource ? 'Formatted' : 'Source'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="email-viewer-container">
        <div className="email-content-wrapper">
          <MessageContent
            content={main}
            contentType={showSource ? 'text' : contentType}
            enableImageLoading={enableImageLoading}
            enableLinkPreview={enableLinkPreview}
            onLinkClick={undefined}
            message={message}
          />
        </div>
      </div>

      {/* Quoted text */}
      {quoted && !showSource && (
        <QuotedText
          content={quoted}
          isExpanded={showQuoted}
          onToggle={() => setShowQuoted(!showQuoted)}
        />
      )}

      {/* Minimal styling for container only - Shadow DOM handles email isolation */}
      <style>{`
        .email-viewer-container {
          contain: layout style paint;
          isolation: isolate;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
        }
        .email-content-wrapper {
          width: 100%;
          max-width: 100%;
          overflow-wrap: break-word;
        }
        .shadow-email-container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

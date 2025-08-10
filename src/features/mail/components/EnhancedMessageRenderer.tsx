import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, ExternalLink, Shield, AlertTriangle } from 'lucide-react';
import { Text, Button } from '../../../components/ui';
import { ParsedEmail, EmailAddress } from '../types';
import 'highlight.js/styles/github.css';
import { logger } from '../../../core/lib/logger';
import { sanitizeEmailHtml, sanitizePlainText, extractQuotedContent } from '../utils/secureSanitizer';

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
    <div className="bg-warning-bg mb-4 rounded-lg border border-warning p-4">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="flex-1">
          <Text size="sm" weight="semibold" className="mb-1 text-warning-fg">
            Security Notice
          </Text>
          <ul className="space-y-1 asana-text-sm text-warning-fg">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-warning hover:text-warning-fg"
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
function MessageContent({ content, contentType, enableImageLoading, enableLinkPreview, onLinkClick }: MessageContentProps) {
  const [processedContent, setProcessedContent] = useState('');
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [showWarnings, setShowWarnings] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Process and sanitize content
  useEffect(() => {
    if (contentType === 'html') {
      const result = sanitizeEmailHtml(content, {
        allowImages: enableImageLoading,
        allowExternalLinks: true,
        allowStyles: false, // Block styles for security
        allowTables: true,
      });
      setProcessedContent(result.sanitized);
      setSecurityWarnings(result.warnings);
    } else {
      // Sanitize plain text and convert to safe HTML
      const sanitized = sanitizePlainText(content);
      setProcessedContent(sanitized);
      setSecurityWarnings([]);
    }
  }, [content, contentType, enableImageLoading]);

  // Handle link clicks
  useEffect(() => {
    if (!contentRef.current) return;

    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href && onLinkClick) {
          onLinkClick(href);
        } else if (href) {
          // Default behavior - open in new tab with security
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    contentRef.current.addEventListener('click', handleLinkClick);
    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleLinkClick);
      }
    };
  }, [onLinkClick]);

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
          <div
            dangerouslySetInnerHTML={{ __html: processedContent }}
            className="prose prose-sm dark:prose-invert max-w-none"
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

  const handleLinkClick = (url: string) => {
    logger.debug('External link clicked:', url);
    // Could add link preview functionality here
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      <MessageContent
        content={main}
        contentType={showSource ? 'text' : contentType}
        enableImageLoading={enableImageLoading}
        enableLinkPreview={enableLinkPreview}
        onLinkClick={handleLinkClick}
      />

      {/* Quoted text */}
      {quoted && !showSource && (
        <QuotedText
          content={quoted}
          isExpanded={showQuoted}
          onToggle={() => setShowQuoted(!showQuoted)}
        />
      )}

      {/* Enhanced styling */}
      <style>{`
        .enhanced-message-renderer .html-content {
          max-width: 100%;
        }
        
        .enhanced-message-renderer .html-content * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .enhanced-message-renderer .html-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: var(--radius-md);
          margin: 8px 0;
          box-shadow: var(--shadow-md);
        }
        
        .enhanced-message-renderer .html-content table {
          max-width: 100% !important;
          border-collapse: collapse;
          margin: 12px 0;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        
        .enhanced-message-renderer .html-content th,
        .enhanced-message-renderer .html-content td {
          padding: 8px 12px;
          border: 1px solid var(--border-default);
          text-align: left;
        }
        
        .enhanced-message-renderer .html-content th {
          background: var(--bg-secondary);
          font-weight: 600;
        }
        
        .enhanced-message-renderer .html-content blockquote {
          border-left: 4px solid var(--accent-primary);
          padding: 12px 16px;
          margin: 16px 0;
          background: var(--bg-secondary);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-style: italic;
        }
        
        .enhanced-message-renderer .html-content .external-link {
          color: var(--accent-primary);
          text-decoration: underline;
          text-decoration-color: var(--accent-primary);
          text-underline-offset: 2px;
        }
        
        .enhanced-message-renderer .html-content .external-link:hover {
          color: var(--accent-primary-hover);
          text-decoration-color: var(--accent-primary-hover);
        }
        
        .enhanced-message-renderer .html-content .external-link::after {
          content: " ↗";
          font-size: 0.8em;
          opacity: 0.7;
        }
        
        .enhanced-message-renderer .html-content pre {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: var(--radius-lg);
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid var(--border-default);
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .enhanced-message-renderer .html-content code {
          background: var(--bg-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 13px;
          border: 1px solid var(--border-default);
        }
        
        .enhanced-message-renderer .html-content ul,
        .enhanced-message-renderer .html-content ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .enhanced-message-renderer .html-content li {
          margin: 6px 0;
          line-height: 1.5;
        }
        
        .enhanced-message-renderer .html-content h1,
        .enhanced-message-renderer .html-content h2,
        .enhanced-message-renderer .html-content h3,
        .enhanced-message-renderer .html-content h4,
        .enhanced-message-renderer .html-content h5,
        .enhanced-message-renderer .html-content h6 {
          margin: 20px 0 12px 0;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-primary);
        }
        
        .enhanced-message-renderer .html-content h1 { font-size: 1.5em; }
        .enhanced-message-renderer .html-content h2 { font-size: 1.3em; }
        .enhanced-message-renderer .html-content h3 { font-size: 1.2em; }
        .enhanced-message-renderer .html-content h4 { font-size: 1.1em; }
        .enhanced-message-renderer .html-content h5 { font-size: 1.05em; }
        .enhanced-message-renderer .html-content h6 { font-size: 1em; }
        
        .enhanced-message-renderer .html-content p {
          margin: 12px 0;
          line-height: 1.6;
        }
        
        .enhanced-message-renderer .blocked-image {
          background: var(--bg-secondary) !important;
          border: 1px dashed var(--border-default) !important;
          padding: 16px !important;
          text-align: center !important;
          color: var(--text-secondary) !important;
          font-size: 12px !important;
          border-radius: var(--radius-md) !important;
          margin: 8px 0 !important;
        }
      `}</style>
    </div>
  );
} 

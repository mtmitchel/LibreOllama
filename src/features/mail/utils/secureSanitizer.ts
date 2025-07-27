/**
 * Secure HTML Sanitizer
 * 
 * This module provides comprehensive XSS protection for email content rendering.
 * It uses DOMPurify for industrial-strength HTML sanitization and adds
 * additional security layers specific to email content.
 */

import DOMPurify from 'dompurify';
import { logger } from '../../../core/lib/logger';

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
  blockedElements: string[];
  riskyAttributes: string[];
}

export interface SanitizationOptions {
  allowImages: boolean;
  allowExternalLinks: boolean;
  allowStyles: boolean;
  allowTables: boolean;
  maxNestingDepth: number;
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  allowImages: false, // Block images by default for security
  allowExternalLinks: true,
  allowStyles: false, // Block inline styles to prevent style-based attacks
  allowTables: true,
  maxNestingDepth: 10,
};

// Email-specific allowed tags
const ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p',
  'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul',
  'div', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
];

// Safe attributes for email content
const ALLOWED_ATTRIBUTES = [
  'href', 'title', 'alt', 'colspan', 'rowspan', 'scope',
  'start', 'type', 'value', 'width', 'height',
];

// Dangerous URL schemes to block
const BLOCKED_URL_SCHEMES = [
  'javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'chrome:',
];

/**
 * Sanitize HTML content for safe email rendering
 */
export function sanitizeEmailHtml(
  html: string, 
  options: Partial<SanitizationOptions> = {}
): SanitizationResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  const blockedElements: string[] = [];
  const riskyAttributes: string[] = [];

  // Configure DOMPurify
  const purifyConfig: DOMPurify.Config = {
    ALLOWED_TAGS: config.allowTables ? ALLOWED_TAGS : ALLOWED_TAGS.filter(tag => !['table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'].includes(tag)),
    ALLOWED_ATTR: config.allowStyles ? [...ALLOWED_ATTRIBUTES, 'style', 'class'] : ALLOWED_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button', 'select', 'option', 'fieldset', 'legend', 'dialog', 'canvas', 'audio', 'video', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  };

  // Add hooks to track what's being removed
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName && !config.allowImages && data.tagName === 'img') {
      blockedElements.push('img');
      warnings.push('Images blocked for security');
      
      // Replace with placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'blocked-image';
      placeholder.textContent = '🖼️ Image blocked';
      placeholder.style.cssText = 'background: #f3f4f6; border: 1px dashed #d1d5db; padding: 8px; text-align: center; color: #6b7280; font-size: 12px;';
      
      if (node.parentNode) {
        node.parentNode.replaceChild(placeholder, node);
      }
    }
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // Check for dangerous URL schemes
    if (data.attrName === 'href' || data.attrName === 'src') {
      const value = data.attrValue.toLowerCase().trim();
      for (const scheme of BLOCKED_URL_SCHEMES) {
        if (value.startsWith(scheme)) {
          riskyAttributes.push(`${data.attrName} with ${scheme}`);
          warnings.push(`Blocked potentially malicious URL: ${scheme}`);
          data.keepAttr = false;
          return;
        }
      }
    }

    // Add security attributes to links
    if (node.nodeName === 'A' && data.attrName === 'href') {
      const element = node as HTMLAnchorElement;
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
      element.classList.add('external-link');
    }
  });

  // Perform sanitization
  let sanitized = DOMPurify.sanitize(html, purifyConfig);

  // Remove hooks after use
  DOMPurify.removeAllHooks();

  // Additional post-processing
  if (!config.allowImages) {
    // Ensure all images are replaced
    sanitized = sanitized.replace(/<img[^>]*>/gi, 
      '<div class="blocked-image" style="background: #f3f4f6; border: 1px dashed #d1d5db; padding: 8px; text-align: center; color: #6b7280; font-size: 12px;">🖼️ Image blocked</div>'
    );
  }

  // Check for deep nesting (potential DoS attack)
  const nestingDepth = checkNestingDepth(sanitized);
  if (nestingDepth > config.maxNestingDepth) {
    warnings.push(`Content has excessive nesting (depth: ${nestingDepth}). This could impact performance.`);
  }

  // Log sanitization summary
  if (warnings.length > 0 || blockedElements.length > 0) {
    logger.info('[SecureSanitizer] Sanitization completed', {
      warnings: warnings.length,
      blockedElements: blockedElements.length,
      riskyAttributes: riskyAttributes.length,
    });
  }

  return {
    sanitized,
    warnings,
    blockedElements,
    riskyAttributes,
  };
}

/**
 * Sanitize plain text content (convert to safe HTML)
 */
export function sanitizePlainText(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Convert URLs to clickable links
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="external-link">$1</a>'
  );

  // Preserve line breaks
  const withBreaks = withLinks.replace(/\n/g, '<br>');

  return withBreaks;
}

/**
 * Check HTML nesting depth
 */
function checkNestingDepth(html: string): number {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  let maxDepth = 0;
  
  function traverse(node: Node, depth: number): void {
    maxDepth = Math.max(maxDepth, depth);
    node.childNodes.forEach(child => traverse(child, depth + 1));
  }
  
  traverse(div, 0);
  return maxDepth;
}

/**
 * Extract and separate quoted text from email content
 */
export function extractQuotedContent(html: string): {
  main: string;
  quoted: string | null;
} {
  // Common email quote patterns
  const quotePatterns = [
    // Gmail style
    /<div class="gmail_quote"[\s\S]*<\/div>\s*$/i,
    // Outlook style
    /<div style="border:none;border-top:solid[^>]*>[\s\S]*$/i,
    // Generic blockquote
    /<blockquote[\s\S]*<\/blockquote>\s*$/i,
    // Line-based quotes ("> ")
    /(<br\s*\/?>)*(\s*&gt;\s*[^\n<]+(<br\s*\/?>)?)+\s*$/i,
  ];

  for (const pattern of quotePatterns) {
    const match = html.match(pattern);
    if (match) {
      const main = html.substring(0, match.index);
      const quoted = match[0];
      return { main, quoted };
    }
  }

  return { main: html, quoted: null };
}

/**
 * Validate email addresses to prevent header injection
 */
export function isValidEmailAddress(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional check for header injection attempts
  const hasLineBreaks = /[\r\n]/.test(email);
  const hasHeaderChars = /[:\0]/.test(email);
  
  return emailRegex.test(email) && !hasLineBreaks && !hasHeaderChars;
}
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

// Email-specific allowed tags (base)
const BASE_ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p',
  'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul',
  'div', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'center',
];

// Safe attributes for email content (base)
const BASE_ALLOWED_ATTRIBUTES = [
  'href', 'title', 'alt', 'colspan', 'rowspan', 'scope',
  'start', 'type', 'value', 'width', 'height',
  // Legacy/ESP layout attributes
  'align', 'valign', 'cellpadding', 'cellspacing', 'bgcolor', 'border', 'background',
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
  // Build allowed tags/attributes based on options
  const dynamicAllowedTags = new Set(BASE_ALLOWED_TAGS);
  if (config.allowTables) {
    // tables already included in base
  } else {
    ['table','tbody','td','tfoot','th','thead','tr'].forEach(t => dynamicAllowedTags.delete(t as any));
  }
  if (config.allowImages) {
    dynamicAllowedTags.add('img' as any);
  }

  const dynamicAllowedAttrs = new Set(BASE_ALLOWED_ATTRIBUTES);
  if (config.allowStyles) {
    ['style','class'].forEach(a => dynamicAllowedAttrs.add(a as any));
  }
  if (config.allowImages) {
    ['src','loading','decoding','referrerpolicy','crossorigin','sizes','srcset','alt'].forEach(a => dynamicAllowedAttrs.add(a as any));
    // Common lazy-load attributes we may promote to src
    ['data-src','data-original','data-lazy-src'].forEach(a => dynamicAllowedAttrs.add(a as any));
  }

  const purifyConfig: DOMPurify.Config = {
    ALLOWED_TAGS: Array.from(dynamicAllowedTags) as string[],
    ALLOWED_ATTR: Array.from(dynamicAllowedAttrs) as string[],
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
    if (data.tagName && data.tagName === 'img' && !config.allowImages) {
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

  // Normalize attributes after sanitation (runs for each allowed element)
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Dual image sizing strategy for broad client compatibility
    if (node.nodeName === 'IMG' && config.allowImages) {
      const img = node as HTMLImageElement;
      // Promote common lazy attrs to src if still present
      if (!img.getAttribute('src')) {
        const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
        if (lazy) img.setAttribute('src', lazy);
      }
      // Ensure images actually load within our viewer
      img.setAttribute('loading', 'eager');
      img.setAttribute('decoding', 'async');
      if (!img.getAttribute('crossorigin')) img.setAttribute('crossorigin', 'anonymous');
      if (!img.getAttribute('referrerpolicy')) img.setAttribute('referrerpolicy', 'no-referrer');
      // Ensure CSS width mirrors width/height attributes (if numeric), keep responsive scaling
      const style = img.getAttribute('style') || '';
      const widthAttr = img.getAttribute('width');
      const heightAttr = img.getAttribute('height');
      let newStyle = style;
      if (widthAttr && /^(\d+)$/.test(widthAttr) && !/\bwidth\s*:/i.test(style)) {
        newStyle += `; width: ${widthAttr}px;`;
      }
      if (heightAttr && /^(\d+)$/.test(heightAttr) && !/\bheight\s*:/i.test(style)) {
        newStyle += `; height: ${heightAttr}px;`;
      }
      if (!/\bmax-width\s*:/i.test(newStyle)) newStyle += '; max-width: 100%;';
      if (!heightAttr && !/\bheight\s*:/i.test(newStyle)) newStyle += '; height: auto;';
      img.setAttribute('style', newStyle.replace(/^;\s*/, ''));
    }
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // Check for dangerous URL schemes
    if (data.attrName === 'href' || data.attrName === 'src') {
      const value = data.attrValue.trim();
      const lower = value.toLowerCase();
      // Allow data:image/* ONLY for <img src>
      if (data.attrName === 'src' && node.nodeName === 'IMG' && lower.startsWith('data:')) {
        if (/^data:image\//i.test(lower)) {
          data.keepAttr = true;
          return;
        }
        riskyAttributes.push('img src with non-image data URI');
        warnings.push('Blocked non-image data URI');
        data.keepAttr = false;
        return;
      }
      for (const scheme of BLOCKED_URL_SCHEMES) {
        if (lower.startsWith(scheme)) {
          riskyAttributes.push(`${data.attrName} with ${scheme}`);
          warnings.push(`Blocked potentially malicious URL: ${scheme}`);
          data.keepAttr = false;
          return;
        }
      }
    }

    // Validate background attribute URLs (legacy HTML attr)
    if (data.attrName === 'background') {
      const value = data.attrValue.trim().toLowerCase();
      if (!(value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/'))) {
        riskyAttributes.push('background with unsupported scheme');
        data.keepAttr = false;
        return;
      }
    }

    // Filter inline styles to a safe allowlist while preserving layout fidelity
    if (data.attrName === 'style') {
      const allowlist = [
        'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
        'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
        'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
        'text-align', 'vertical-align', 'display', 'line-height', 'font-size', 'font-family', 'font-weight', 'letter-spacing', 'color', 'text-decoration', 'text-decoration-color',
        'background', 'background-color', 'background-image', 'background-repeat', 'background-position',
        'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'border-collapse', 'border-spacing',
        'table-layout', 'mso-padding-alt', 'mso-table-lspace', 'mso-table-rspace', 'mso-line-height-rule', 'position',
      ];
      const original = data.attrValue;
      const parts = original.split(';').map(p => p.trim()).filter(Boolean);
      const safeParts: string[] = [];
      for (const decl of parts) {
        const idx = decl.indexOf(':');
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim().toLowerCase();
        const val = decl.slice(idx + 1).trim();
        if (allowlist.includes(prop) || prop.startsWith('mso-')) {
          // Block position:fixed and z-index escalations
          if (prop === 'position' && /fixed/i.test(val)) continue;
          if (prop === 'z-index') continue;
          safeParts.push(`${prop}:${val}`);
        }
      }
      if (safeParts.length > 0) {
        data.attrValue = safeParts.join(';');
        data.keepAttr = true;
      } else {
        data.keepAttr = false;
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

  // Promote lazy-load image attributes to src when images are allowed (post pass for stubborn cases)
  if (config.allowImages) {
    sanitized = sanitized
      .replace(/<img([^>]*?)\sdata-src=("|')([^"']+)(\2)([^>]*)>/gi, '<img$1 src="$3"$5>')
      .replace(/<img([^>]*?)\sdata-original=("|')([^"']+)(\2)([^>]*)>/gi, '<img$1 src="$3"$5>')
      .replace(/<img([^>]*?)\sdata-lazy-src=("|')([^"']+)(\2)([^>]*)>/gi, '<img$1 src="$3"$5>')
      .replace(/<img([^>]*?)\sdata-srcset=("|')([^"']+)(\2)([^>]*)>/gi, '<img$1 srcset="$3"$5>');
    // Remove dimensions that are percentage strings applied as width/height attributes
    sanitized = sanitized.replace(/(<img[^>]*?\swidth=("|')\d+%\2[^>]*?>)/gi, (m) => m.replace(/\swidth=("|')\d+%\1/i, ''));
    sanitized = sanitized.replace(/(<img[^>]*?\sheight=("|')\d+%\2[^>]*?>)/gi, (m) => m.replace(/\sheight=("|')\d+%\1/i, ''));
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
/**
 * Accessibility utilities for WCAG compliance
 */

/**
 * Check if an element has sufficient color contrast
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param isLargeText - Whether the text is considered large (18pt+ or 14pt+ bold)
 * @returns Whether the contrast ratio meets WCAG AA standards
 */
export function hasValidColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = isLargeText ? 3 : 4.5; // WCAG AA standards
  return ratio >= threshold;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Validate that interactive elements have minimum touch target size (44px)
 */
export function hasValidTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Check if an element has proper focus indicators
 */
export function hasFocusIndicator(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element, ':focus');
  return (
    computedStyle.outline !== 'none' ||
    computedStyle.boxShadow !== 'none' ||
    computedStyle.borderColor !== computedStyle.getPropertyValue('border-color')
  );
}

/**
 * Validate form field accessibility
 */
export function validateFormField(input: HTMLInputElement): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for label association
  const label = input.labels?.[0] || document.querySelector(`label[for="${input.id}"]`);
  if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
    issues.push('Input lacks proper labeling');
  }
  
  // Check for error state accessibility
  if (input.getAttribute('aria-invalid') === 'true') {
    const errorId = input.getAttribute('aria-describedby');
    if (!errorId || !document.getElementById(errorId)) {
      issues.push('Error state not properly announced to screen readers');
    }
  }
  
  // Check for required field indication
  if (input.required && !input.getAttribute('aria-required')) {
    issues.push('Required field not properly indicated');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Check heading hierarchy for proper structure
 */
export function validateHeadingHierarchy(container: HTMLElement = document.body): {
  isValid: boolean;
  issues: string[];
} {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const issues: string[] = [];
  
  if (headings.length === 0) {
    return { isValid: true, issues: [] };
  }
  
  // Check for h1 presence
  const h1Count = headings.filter(h => h.tagName === 'H1').length;
  if (h1Count === 0) {
    issues.push('Page lacks a main heading (h1)');
  } else if (h1Count > 1) {
    issues.push('Page has multiple h1 elements');
  }
  
  // Check for proper nesting
  let previousLevel = 0;
  for (const heading of headings) {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    
    if (previousLevel > 0 && currentLevel > previousLevel + 1) {
      issues.push(`Heading level skipped: ${heading.tagName} follows h${previousLevel}`);
    }
    
    previousLevel = currentLevel;
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Check for proper ARIA landmark usage
 */
export function validateLandmarks(container: HTMLElement = document.body): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for main landmark
  const main = container.querySelector('main, [role="main"]');
  if (!main) {
    issues.push('Page lacks a main landmark');
  }
  
  // Check for navigation landmark
  const nav = container.querySelector('nav, [role="navigation"]');
  if (!nav) {
    issues.push('Page lacks a navigation landmark');
  }
  
  // Check for banner (header) landmark
  const banner = container.querySelector('header, [role="banner"]');
  if (!banner) {
    issues.push('Page lacks a banner landmark');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Check for alt text on images
 */
export function validateImages(container: HTMLElement = document.body): {
  isValid: boolean;
  issues: string[];
} {
  const images = Array.from(container.querySelectorAll('img'));
  const issues: string[] = [];
  
  for (const img of images) {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image missing alt attribute: ${img.src}`);
    } else if (img.alt === '' && !img.hasAttribute('role')) {
      // Empty alt is OK for decorative images, but should have role="presentation"
      issues.push(`Decorative image should have role="presentation": ${img.src}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Comprehensive accessibility audit
 */
export function auditAccessibility(container: HTMLElement = document.body): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const allIssues: string[] = [];
  
  // Run all validation checks
  const headingValidation = validateHeadingHierarchy(container);
  const landmarkValidation = validateLandmarks(container);
  const imageValidation = validateImages(container);
  
  allIssues.push(...headingValidation.issues);
  allIssues.push(...landmarkValidation.issues);
  allIssues.push(...imageValidation.issues);
  
  // Check form fields
  const inputs = Array.from(container.querySelectorAll('input, textarea, select'));
  for (const input of inputs) {
    if (input instanceof HTMLInputElement) {
      const fieldValidation = validateFormField(input);
      allIssues.push(...fieldValidation.issues);
    }
  }
  
  // Calculate score (percentage of checks passed)
  const totalChecks = 10; // Approximate number of different checks
  const passedChecks = totalChecks - Math.min(allIssues.length, totalChecks);
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  return {
    isValid: allIssues.length === 0,
    issues: allIssues,
    score
  };
}

/**
 * Keyboard navigation helper
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowKeys(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, items.length - 1);
        onIndexChange(nextIndex);
        items[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        onIndexChange(prevIndex);
        items[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = items.length - 1;
        onIndexChange(lastIndex);
        items[lastIndex]?.focus();
        break;
    }
  },

  /**
   * Handle tab navigation with custom logic
   */
  handleTabNavigation(
    event: KeyboardEvent,
    firstElement: HTMLElement,
    lastElement: HTMLElement
  ) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

/**
 * Screen reader announcements
 */
export const ScreenReader = {
  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}; 
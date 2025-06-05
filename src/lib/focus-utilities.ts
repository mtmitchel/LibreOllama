import { useTypewriterScroll } from './typewriter-scroll';
import { useSentenceHighlight } from './sentence-highlight';
import { useFocusMode } from '@/hooks/use-focus-mode';
import { useEffect, useRef } from 'react';

export interface FocusUtilitiesOptions {
  typewriterScrolling?: boolean;
  sentenceHighlighting?: boolean;
  autoApply?: boolean; // Automatically apply based on focus mode state
}

/**
 * Combined hook that applies both typewriter scrolling and sentence highlighting
 * based on the current focus mode settings
 */
export function useFocusUtilities(options: FocusUtilitiesOptions = {}) {
  const { focusMode } = useFocusMode();
  const elementRef = useRef<HTMLElement | null>(null);

  // Determine if features should be enabled
  const typewriterEnabled = options.autoApply 
    ? focusMode.options.typewriterScrolling
    : (options.typewriterScrolling ?? false);
    
  const highlightEnabled = options.autoApply
    ? focusMode.options.sentenceHighlighting
    : (options.sentenceHighlighting ?? false);

  // Set up typewriter scrolling
  const typewriterScroll = useTypewriterScroll({
    enabled: typewriterEnabled,
    centerOffset: 0.4,
    smoothness: 200,
    threshold: 50
  });

  // Set up sentence highlighting
  const sentenceHighlight = useSentenceHighlight({
    enabled: highlightEnabled,
    highlightColor: '#3b82f6',
    highlightOpacity: 0.1,
    updateDelay: 150,
    includeIncomplete: true,
    minLength: 10
  });

  // Sync refs - both utilities need to reference the same element
  useEffect(() => {
    if (elementRef.current) {
      typewriterScroll.ref.current = elementRef.current;
      sentenceHighlight.ref.current = elementRef.current;
    }
  }, []);

  return {
    ref: elementRef,
    typewriterScroll: {
      enabled: typewriterEnabled,
      scrollToCursor: typewriterScroll.scrollToCursor
    },
    sentenceHighlight: {
      enabled: highlightEnabled,
      highlightCurrentSentence: sentenceHighlight.highlightCurrentSentence,
      clearHighlights: sentenceHighlight.clearHighlights
    }
  };
}

/**
 * Apply ADHD-friendly focus styling to an element
 */
export function applyFocusStyles(element: HTMLElement, options: {
  reducedMotion?: boolean;
  densityMode?: 'compact' | 'comfortable' | 'spacious';
  highContrast?: boolean;
} = {}) {
  const {
    reducedMotion = false,
    densityMode = 'comfortable',
    highContrast = false
  } = options;

  // Base focus styles
  const baseStyles = {
    lineHeight: densityMode === 'compact' ? '1.4' : densityMode === 'comfortable' ? '1.6' : '1.8',
    fontSize: densityMode === 'compact' ? '14px' : densityMode === 'comfortable' ? '16px' : '18px',
    maxWidth: '65ch', // Optimal reading line length
    margin: '0 auto',
    padding: densityMode === 'compact' ? '1rem' : densityMode === 'comfortable' ? '1.5rem' : '2rem'
  };

  // Apply styles
  Object.assign(element.style, baseStyles);

  // Add CSS classes for advanced styling
  element.classList.add('focus-mode-content');
  
  if (reducedMotion) {
    element.classList.add('focus-reduced-motion');
  }
  
  if (highContrast) {
    element.classList.add('focus-high-contrast');
  }

  element.classList.add(`focus-density-${densityMode}`);
}

/**
 * Remove all focus-related classes and styles
 */
export function removeFocusStyles(element: HTMLElement) {
  // Remove CSS classes
  const focusClasses = Array.from(element.classList).filter(cls => cls.startsWith('focus-'));
  focusClasses.forEach(cls => element.classList.remove(cls));
  
  // Reset inline styles that we might have applied
  const stylesToReset = ['lineHeight', 'fontSize', 'maxWidth', 'margin', 'padding'];
  stylesToReset.forEach(style => {
    element.style.removeProperty(style);
  });
}

/**
 * Create focus-friendly CSS variables and classes
 */
export function initializeFocusCSS() {
  const style = document.createElement('style');
  style.id = 'focus-mode-styles';
  style.textContent = `
    .focus-mode-content {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      color: #1f2937;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .focus-reduced-motion * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    
    .focus-high-contrast {
      color: #000000 !important;
      background-color: #ffffff !important;
    }
    
    .focus-high-contrast * {
      border-color: #000000 !important;
    }
    
    .focus-density-compact {
      letter-spacing: 0;
    }
    
    .focus-density-comfortable {
      letter-spacing: 0.01em;
    }
    
    .focus-density-spacious {
      letter-spacing: 0.02em;
      word-spacing: 0.1em;
    }
    
    /* Focus mode specific scrollbar styling */
    .focus-mode-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .focus-mode-content::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 4px;
    }
    
    .focus-mode-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }
    
    .focus-mode-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    
    /* Breathing room for text elements in focus mode */
    .focus-mode-content p {
      margin-bottom: 1em;
    }
    
    .focus-mode-content h1,
    .focus-mode-content h2,
    .focus-mode-content h3,
    .focus-mode-content h4,
    .focus-mode-content h5,
    .focus-mode-content h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    .focus-mode-content ul,
    .focus-mode-content ol {
      margin-bottom: 1em;
      padding-left: 1.5em;
    }
    
    .focus-mode-content li {
      margin-bottom: 0.5em;
    }
    
    /* Reduced emphasis on less important UI elements */
    .focus-mode-content .secondary-text {
      opacity: 0.7;
    }
    
    .focus-mode-content .muted-text {
      opacity: 0.5;
    }
  `;
  
  // Remove existing styles if present
  const existing = document.getElementById('focus-mode-styles');
  if (existing) {
    document.head.removeChild(existing);
  }
  
  document.head.appendChild(style);
}

/**
 * Clean up focus CSS when focus mode is disabled
 */
export function cleanupFocusCSS() {
  const existing = document.getElementById('focus-mode-styles');
  if (existing) {
    document.head.removeChild(existing);
  }
}

/**
 * Utility to check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Utility to check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}
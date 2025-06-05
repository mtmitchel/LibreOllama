import { useEffect, useRef, useCallback } from 'react';

export interface TypewriterScrollOptions {
  enabled: boolean;
  centerOffset?: number; // How far from center to keep the cursor (0.5 = center, 0.3 = upper third)
  smoothness?: number; // Animation duration in ms
  threshold?: number; // Minimum distance before scrolling
}

const DEFAULT_OPTIONS: Required<TypewriterScrollOptions> = {
  enabled: true,
  centerOffset: 0.4, // Keep cursor in upper 40% of viewport
  smoothness: 200,
  threshold: 50
};

export function useTypewriterScroll(options: TypewriterScrollOptions = DEFAULT_OPTIONS) {
  const elementRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
  const lastPositionRef = useRef<number>(0);

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const scrollToCursor = useCallback(() => {
    if (!mergedOptions.enabled || !elementRef.current || isScrollingRef.current) {
      return;
    }

    const element = elementRef.current;
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate cursor position relative to the scrollable element
      const cursorTop = rect.top - elementRect.top + element.scrollTop;
      const viewportHeight = element.clientHeight;
      const targetPosition = cursorTop - (viewportHeight * mergedOptions.centerOffset);
      
      // Only scroll if we're beyond the threshold
      const currentScroll = element.scrollTop;
      const distance = Math.abs(targetPosition - currentScroll);
      
      if (distance > mergedOptions.threshold) {
        isScrollingRef.current = true;
        lastPositionRef.current = targetPosition;
        
        // Smooth scroll to position
        element.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
        
        // Reset scrolling flag after animation
        setTimeout(() => {
          isScrollingRef.current = false;
        }, mergedOptions.smoothness);
      }
    } catch (error) {
      // Silently handle any range/selection errors
      console.debug('Typewriter scroll: Selection error', error);
    }
  }, [mergedOptions]);

  const handleInput = useCallback((event: Event) => {
    // Debounce rapid input events
    setTimeout(scrollToCursor, 50);
  }, [scrollToCursor]);

  const handleSelectionChange = useCallback(() => {
    // Only respond to selection changes within our element
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = elementRef.current;
      
      if (element && (element.contains(container) || element === container)) {
        scrollToCursor();
      }
    }
  }, [scrollToCursor]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Trigger on navigation keys
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    if (navigationKeys.includes(event.key)) {
      setTimeout(scrollToCursor, 10);
    }
  }, [scrollToCursor]);

  // Set up event listeners
  useEffect(() => {
    if (!mergedOptions.enabled || !elementRef.current) {
      return;
    }

    const element = elementRef.current;
    
    // Listen for input events
    element.addEventListener('input', handleInput);
    element.addEventListener('keydown', handleKeyDown);
    
    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Listen for focus events to initial scroll
    element.addEventListener('focus', scrollToCursor);
    
    return () => {
      element.removeEventListener('input', handleInput);
      element.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
      element.removeEventListener('focus', scrollToCursor);
    };
  }, [mergedOptions.enabled, handleInput, handleKeyDown, handleSelectionChange, scrollToCursor]);

  return {
    ref: elementRef,
    scrollToCursor
  };
}

// Utility function for non-hook usage
export function createTypewriterScroll(element: HTMLElement, options: TypewriterScrollOptions = DEFAULT_OPTIONS): () => void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  let isScrolling = false;
  
  const scrollToCursor = () => {
    if (!mergedOptions.enabled || isScrolling) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      const cursorTop = rect.top - elementRect.top + element.scrollTop;
      const viewportHeight = element.clientHeight;
      const targetPosition = cursorTop - (viewportHeight * mergedOptions.centerOffset);
      
      const currentScroll = element.scrollTop;
      const distance = Math.abs(targetPosition - currentScroll);
      
      if (distance > mergedOptions.threshold) {
        isScrolling = true;
        
        element.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          isScrolling = false;
        }, mergedOptions.smoothness);
      }
    } catch (error) {
      console.debug('Typewriter scroll: Selection error', error);
    }
  };

  const handleInput = () => setTimeout(scrollToCursor, 50);
  const handleKeyDown = (event: KeyboardEvent) => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    if (navigationKeys.includes(event.key)) {
      setTimeout(scrollToCursor, 10);
    }
  };
  
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      if (element.contains(container) || element === container) {
        scrollToCursor();
      }
    }
  };

  // Set up listeners
  element.addEventListener('input', handleInput);
  element.addEventListener('keydown', handleKeyDown);
  element.addEventListener('focus', scrollToCursor);
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('input', handleInput);
    element.removeEventListener('keydown', handleKeyDown);
    element.removeEventListener('focus', scrollToCursor);
    document.removeEventListener('selectionchange', handleSelectionChange);
  };
}
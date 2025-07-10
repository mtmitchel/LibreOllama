import { useEffect, useRef, useCallback } from 'react';



/**
 * Hook for managing escape key handling
 */
export function useEscapeKey(onEscape: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onEscape, isActive]);
}

/**
 * Hook for managing keyboard navigation in lists
 */
export function useKeyboardNavigation(
  items: HTMLElement[],
  isActive: boolean = true
) {
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndexRef.current = Math.min(currentIndexRef.current + 1, items.length - 1);
        items[currentIndexRef.current]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0);
        items[currentIndexRef.current]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        currentIndexRef.current = 0;
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        currentIndexRef.current = items.length - 1;
        items[items.length - 1]?.focus();
        break;
    }
  }, [items, isActive]);

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, isActive]);

  return currentIndexRef;
}

/**
 * Hook for announcing screen reader messages
 */
export function useScreenReader() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a live region for screen reader announcements
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
      // Clear after announcement to allow re-announcement of same message
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return announce;
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  return prefersReducedMotion;
}

/**
 * Hook for generating unique IDs for accessibility attributes
 */
export function useId(prefix: string = 'id') {
  const id = useRef<string>();
  
  if (!id.current) {
    id.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return id.current;
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLive() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const LiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  return { updateLiveRegion, LiveRegion };
} 
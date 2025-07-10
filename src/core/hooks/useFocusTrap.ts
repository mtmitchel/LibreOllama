import { useEffect, useRef } from 'react';

interface FocusTrapOptions {
  isActive: boolean;
  restoreFocus?: boolean;
  initialFocus?: HTMLElement | null;
}

/**
 * Hook to manage focus trapping within a container (typically modals)
 * Ensures focus stays within the trap when active and handles proper focus restoration
 */
export function useFocusTrap({ 
  isActive, 
  restoreFocus = true, 
  initialFocus 
}: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element when trap activates
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(
        container.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];
    };

    // Focus the initial element or first focusable element
    const focusInitialElement = () => {
      const focusableElements = getFocusableElements();
      
      if (initialFocus && focusableElements.includes(initialFocus)) {
        initialFocus.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // Handle tab key navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (event.shiftKey) {
        // Shift+Tab (backwards)
        if (document.activeElement === firstElement || currentIndex === -1) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement || currentIndex === -1) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Prevent focus from escaping the container
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // If focus moves outside the container, bring it back
      if (!container.contains(target)) {
        event.preventDefault();
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    // Focus initial element
    focusInitialElement();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);

      // Restore focus to previously focused element
      if (restoreFocus && previouslyFocusedElement.current) {
        try {
          previouslyFocusedElement.current.focus();
        } catch {
          // Element might no longer exist, that's okay
        }
      }
    };
  }, [isActive, restoreFocus, initialFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previouslyFocusedElement.current) {
        try {
          previouslyFocusedElement.current.focus();
        } catch {
          // Element might no longer exist, that's okay
        }
      }
    };
  }, [restoreFocus]);

  return containerRef;
} 
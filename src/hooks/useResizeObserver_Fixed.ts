import { useState, useLayoutEffect, RefObject, useCallback } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Enhanced resize observer that ensures accurate dimension tracking
 * for viewport culling in canvas applications
 */
export const useResizeObserver = (ref: RefObject<HTMLElement>): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // Force dimension update using getBoundingClientRect
  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[useResizeObserver] Updated dimensions via getBoundingClientRect:', rect.width, rect.height);
      }
    }
  }, [ref]);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    // Initial dimension update
    updateDimensions();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect) {
        const { width, height } = entries[0].contentRect;
        
        // Use contentRect but verify with getBoundingClientRect for accuracy
        const rect = ref.current?.getBoundingClientRect();
        const actualWidth = rect?.width || width;
        const actualHeight = rect?.height || height;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[useResizeObserver] ResizeObserver fired:', {
            contentRect: { width, height },
            boundingRect: { width: actualWidth, height: actualHeight }
          });
        }
        
        setDimensions({
          width: actualWidth,
          height: actualHeight,
        });
      }
    });

    // Start observing
    resizeObserver.observe(ref.current);

    // Also listen to window resize as a fallback
    const handleWindowResize = () => {
      updateDimensions();
    };
    
    window.addEventListener('resize', handleWindowResize);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [ref, updateDimensions]);

  return dimensions;
};

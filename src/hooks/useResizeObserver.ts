import { useState, useLayoutEffect, RefObject } from 'react';

// Defines the dimensions object that the hook will return
interface Dimensions {
  width: number;
  height: number;
}

/**
 * A custom hook that uses ResizeObserver to report the dimensions of a referenced element.
 * This is more performant and reliable than listening to window resize events.
 * It uses useLayoutEffect to ensure measurements are taken before the browser paints.
 *
 * @param ref - A React ref object attached to the element to be observed.
 * @returns The dimensions of the observed element, or null if not yet measured.
 */
export const useResizeObserver = (ref: RefObject<HTMLElement>): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useLayoutEffect(() => {
    // Ensure the ref is attached to an element
    if (!ref.current) {
      return;
    }

    // Create a new ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      // We only observe one element, so we can access the first entry
      if (entries[0] && entries[0].contentRect) {
        const newWidth = Math.round(entries[0].contentRect.width);
        const newHeight = Math.round(entries[0].contentRect.height);

        setDimensions(prevDimensions => {
          // Only update if dimensions actually changed to prevent excessive updates
          if (!prevDimensions || 
              prevDimensions.width !== newWidth || 
              prevDimensions.height !== newHeight) {
            
            if (import.meta.env.DEV) {
              console.log('[useResizeObserver] New dimensions:', newWidth, newHeight);
            }
            
            return {
              width: newWidth,
              height: newHeight,
            };
          }
          return prevDimensions;
        });
      }
    });

    // Start observing the element
    resizeObserver.observe(ref.current);

    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]); // Rerun effect if the ref changes

  return dimensions;
};

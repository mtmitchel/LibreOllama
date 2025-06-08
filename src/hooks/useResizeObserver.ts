import { useState, useLayoutEffect, RefObject } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * A custom hook that uses ResizeObserver to report the dimensions of a referenced element.
 * This is more performant and reliable than listening to window resize events.
 *
 * @param ref  - A React ref object attached to the element to be observed.
 * @returns The dimensions of the observed element, or null if not yet measured.
 */
export const useResizeObserver = (ref: RefObject<HTMLElement>): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return dimensions;
};

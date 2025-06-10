/**
 * Simplified Canvas Sizing Hook
 * Addresses race conditions in canvas initialization and resizing
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface CanvasSize {
  width: number;
  height: number;
}

interface UseCanvasSizingOptions {
  minWidth?: number;
  minHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  padding?: number;
}

export const useCanvasSizing = (
  containerRef: React.RefObject<HTMLElement>,
  fabricCanvas: any | null,
  options: UseCanvasSizingOptions = {}
) => {
  const {
    minWidth = 800,
    minHeight = 600,
    defaultWidth = 1200,
    defaultHeight = 800,
    padding = 20
  } = options;

  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: defaultWidth,
    height: defaultHeight
  });

  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(minWidth, rect.width > padding ? rect.width - padding : minWidth);
    const newHeight = Math.max(minHeight, rect.height > 100 ? rect.height - 100 : minHeight);

    const newSize = { width: newWidth, height: newHeight };

    // Only update if size actually changed
    if (newSize.width !== canvasSize.width || newSize.height !== canvasSize.height) {
      setCanvasSize(newSize);

      // Update Fabric.js canvas dimensions if available
      if (fabricCanvas && fabricCanvas.setDimensions && !fabricCanvas.isDisposed) {
        try {
          fabricCanvas.setDimensions(newSize);
          fabricCanvas.renderAll();
        } catch (error) {
          console.warn('Failed to update canvas dimensions:', error);
        }
      }
    }
  }, [containerRef, fabricCanvas, canvasSize.width, canvasSize.height, minWidth, minHeight, padding]);

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(updateCanvasSize, 100);
  }, [updateCanvasSize]);

  // Initial size calculation
  useEffect(() => {
    updateCanvasSize();
  }, []);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => debouncedResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [debouncedResize]);

  // Container resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      debouncedResize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, debouncedResize]);

  return canvasSize;
};

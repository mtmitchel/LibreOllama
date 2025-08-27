/**
 * Simplified Canvas Sizing Hook
 * Addresses race conditions in canvas initialization and resizing
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

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
  
  // Web Worker for heavy canvas computations (React 19 + Tauri optimization)
  const canvasWorker = useMemo(() => {
    if (typeof Worker !== 'undefined') {
      return new Worker('/canvas-worker.js');
    }
    return null;
  }, []);

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(minWidth, rect.width);
    const newHeight = Math.max(minHeight, rect.height);

    const newSize = { width: newWidth, height: newHeight };

    // Only update if size actually changed - use functional update to avoid dependency on canvasSize
    setCanvasSize(prevSize => {
      if (newSize.width !== prevSize.width || newSize.height !== prevSize.height) {
        return newSize;
      }
      return prevSize;
    });
  }, [containerRef, minWidth, minHeight, padding]);

  // Optimized resize handler with RAF chunking (React 19 + Tauri performance fix)
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    // Use longer debounce to prevent main thread blocking
    resizeTimeoutRef.current = setTimeout(() => {
      // Chunk the resize calculation using RAF to prevent UI blocking
      requestAnimationFrame(() => {
        updateCanvasSize();
      });
    }, 150); // Increased from 100ms to 150ms
  }, [updateCanvasSize]);

  // Initial size calculation with RAF chunking to prevent blocking
  useEffect(() => {
    // Defer initial sizing to prevent blocking during app startup
    requestAnimationFrame(() => {
      updateCanvasSize();
    });
  }, [updateCanvasSize]);

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

  // Container resize observer with error handling and performance optimization
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // Check if entries exist and prevent "ResizeObserver loop limit exceeded" errors
      if (entries && entries.length > 0) {
        try {
          debouncedResize();
        } catch (error) {
          // Prevent ResizeObserver errors from breaking the app
          console.warn('ResizeObserver error caught and handled:', error);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, debouncedResize]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (canvasWorker) {
        canvasWorker.terminate();
      }
    };
  }, [canvasWorker]);

  return canvasSize;
};

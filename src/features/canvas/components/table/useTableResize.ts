import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { throttle } from './tableUtils';

export interface TableResizeHookProps {
  onUpdate: (updates: any) => void;
  element: any;
}

export interface TableResizeState {
  isResizing: boolean;
  liveSize: { width: number; height: number } | null;
}

/**
 * Hook for handling table resize operations
 */
export const useTableResize = ({ onUpdate, element }: TableResizeHookProps) => {
  // Resize state using refs to prevent re-renders
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<'se' | 'e' | 's' | 'nw' | 'n' | 'ne' | 'w' | 'sw' | 'col' | 'row' | null>(null);
  const resizeStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null);
  const resizeStartElementPosRef = useRef<{ x: number; y: number } | null>(null);
  const liveSizeRef = useRef<{ width: number, height: number } | null>(null);

  // Individual column/row resize state using refs
  const resizingColumnIndexRef = useRef<number | null>(null);
  const resizingRowIndexRef = useRef<number | null>(null);
  const columnStartWidthRef = useRef<number | null>(null);
  const rowStartHeightRef = useRef<number | null>(null);

  // Event handlers refs for cleanup
  const mouseMoveHandlerRef = useRef<((e: Konva.KonvaEventObject<MouseEvent>) => void) | null>(null);
  const mouseUpHandlerRef = useRef<(() => void) | null>(null);

  // Throttled resize handler
  const throttledResize = useCallback(
    throttle((updates: any) => {
      onUpdate(updates);
    }, 50),
    [onUpdate]
  );

  const startResize = useCallback((handle: string, initialPos: { x: number; y: number }) => {
    isResizingRef.current = true;
    resizeHandleRef.current = handle as any;
    resizeStartPosRef.current = initialPos;
    resizeStartSizeRef.current = { 
      width: element.width || 200, 
      height: element.height || 100 
    };
    resizeStartElementPosRef.current = { x: element.x, y: element.y };
  }, [element]);

  const updateResize = useCallback((currentPos: { x: number; y: number }) => {
    if (!isResizingRef.current || !resizeStartPosRef.current || !resizeStartSizeRef.current) {
      return;
    }

    const deltaX = currentPos.x - resizeStartPosRef.current.x;
    const deltaY = currentPos.y - resizeStartPosRef.current.y;
    
    const newSize = {
      width: Math.max(100, resizeStartSizeRef.current.width + deltaX),
      height: Math.max(80, resizeStartSizeRef.current.height + deltaY)
    };

    liveSizeRef.current = newSize;
    throttledResize({ width: newSize.width, height: newSize.height });
  }, [throttledResize]);

  const endResize = useCallback(() => {
    if (isResizingRef.current && liveSizeRef.current) {
      onUpdate(liveSizeRef.current);
    }
    
    isResizingRef.current = false;
    resizeHandleRef.current = null;
    resizeStartPosRef.current = null;
    resizeStartSizeRef.current = null;
    resizeStartElementPosRef.current = null;
    liveSizeRef.current = null;
    
    // Clean up event handlers
    if (mouseMoveHandlerRef.current) {
      mouseMoveHandlerRef.current = null;
    }
    if (mouseUpHandlerRef.current) {
      mouseUpHandlerRef.current = null;
    }
  }, [onUpdate]);

  return {
    isResizing: isResizingRef.current,
    liveSize: liveSizeRef.current,
    startResize,
    updateResize,
    endResize,
    refs: {
      isResizingRef,
      resizeHandleRef,
      resizingColumnIndexRef,
      resizingRowIndexRef,
      columnStartWidthRef,
      rowStartHeightRef,
      mouseMoveHandlerRef,
      mouseUpHandlerRef
    }
  };
};

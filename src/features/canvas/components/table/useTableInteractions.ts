import { useState, useRef, useCallback } from 'react';

export interface TableInteractionState {
  hoveredCell: { row: number; col: number } | null;
  boundaryHover: { type: 'row' | 'column'; index: number; position: { x: number; y: number } } | null;
  headerHover: { type: 'row' | 'column' | null; index: number; position: { x: number; y: number } };
  contextMenu: { x: number; y: number; type: 'row' | 'column'; index: number } | null;
}

/**
 * Hook for managing table interaction state (hover, context menu, etc.)
 */
export const useTableInteractions = () => {
  // State for hover interactions and controls
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [boundaryHover, setBoundaryHover] = useState<{ type: 'row' | 'column'; index: number; position: { x: number; y: number } } | null>(null);
  const [headerHover, setHeaderHover] = useState<{ type: 'row' | 'column' | null; index: number; position: { x: number; y: number } }>({ 
    type: null, 
    index: -1, 
    position: { x: 0, y: 0 } 
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'row' | 'column'; index: number } | null>(null);

  // Hover timeout refs to prevent flicker
  const cellHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boundaryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cell interaction handlers
  const handleCellClick = useCallback((_rowIndex: number, _colIndex: number, e: any) => {
    // Basic cell click handling - can be extended as needed
    e.evt?.stopPropagation();
  }, []);

  const handleCellRightClick = useCallback((_rowIndex: number, colIndex: number, e: any) => {
    e.evt?.preventDefault();
    e.evt?.stopPropagation();
    
    const stage = e.target.getStage();
    if (stage) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setContextMenu({
          x: pointerPos.x,
          y: pointerPos.y,
          type: 'column', // Default to column for now
          index: colIndex
        });
      }
    }
  }, []);

  // Hover management with debouncing
  const handleCellMouseEnter = useCallback((rowIndex: number, colIndex: number) => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
    }
    
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell({ row: rowIndex, col: colIndex });
    }, 50); // Small delay to prevent flicker
  }, []);

  const handleCellMouseLeave = useCallback(() => {
    if (cellHoverTimeoutRef.current) {
      clearTimeout(cellHoverTimeoutRef.current);
    }
    
    cellHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 100);
  }, []);

  // Boundary hover management
  const handleBoundaryMouseEnter = useCallback((type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
    }
    
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      setBoundaryHover({ type, index, position });
    }, 50);
  }, []);

  const handleBoundaryMouseLeave = useCallback(() => {
    if (boundaryHoverTimeoutRef.current) {
      clearTimeout(boundaryHoverTimeoutRef.current);
    }
    
    boundaryHoverTimeoutRef.current = setTimeout(() => {
      setBoundaryHover(null);
    }, 100);
  }, []);

  // Header hover management
  const handleHeaderMouseEnter = useCallback((type: 'row' | 'column', index: number, position: { x: number; y: number }) => {
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
    }
    
    headerHoverTimeoutRef.current = setTimeout(() => {
      setHeaderHover({ type, index, position });
    }, 50);
  }, []);

  const handleHeaderMouseLeave = useCallback(() => {
    if (headerHoverTimeoutRef.current) {
      clearTimeout(headerHoverTimeoutRef.current);
    }
    
    headerHoverTimeoutRef.current = setTimeout(() => {
      setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    }, 100);
  }, []);

  // Context menu management
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Clear all hover states
  const clearAllHoverStates = useCallback(() => {
    setHoveredCell(null);
    setBoundaryHover(null);
    setHeaderHover({ type: null, index: -1, position: { x: 0, y: 0 } });
    setContextMenu(null);
    
    // Clear any pending timeouts
    [cellHoverTimeoutRef, boundaryHoverTimeoutRef, headerHoverTimeoutRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  return {
    // State
    hoveredCell,
    boundaryHover,
    headerHover,
    contextMenu,
    
    // Handlers
    handleCellClick,
    handleCellRightClick,
    handleCellMouseEnter,
    handleCellMouseLeave,
    handleBoundaryMouseEnter,
    handleBoundaryMouseLeave,
    handleHeaderMouseEnter,
    handleHeaderMouseLeave,
    closeContextMenu,
    clearAllHoverStates,
    
    // Setters for direct control if needed
    setHoveredCell,
    setBoundaryHover,
    setHeaderHover,
    setContextMenu
  };
};

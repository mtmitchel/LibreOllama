// src/pages/Canvas.tsx - FIXED VERSION

import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useCanvasState, CanvasElement as CanvasElementType } from '../hooks/canvas/useCanvasState';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { useViewportCulling } from '../hooks/useViewportCulling';
import { useResizeObserver } from '../hooks/useResizeObserver';
import CanvasElement from '../components/canvas/CanvasElement';
import { CanvasToolbar, ShapeType } from '../components/canvas/CanvasToolbar';

// Main Canvas Component
const Canvas: React.FC = () => {
  // --- STATE AND EVENT HOOKS ---
  const canvasState = useCanvasState();
  const {
    elements,
    setElements,
    activeTool,
    setActiveTool,
    panOffset,
    setPanOffset,
    zoomLevel,
    selectedElement,
    selectedShape,
    setSelectedShape,
    showShapeDropdown,
    setShowShapeDropdown,
    dropdownPosition,
    setDropdownPosition,
  } = canvasState;

  // Toolbar positioning and dragging state
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isToolbarDragging, setIsToolbarDragging] = useState(false);
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    dropdownRef,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleMouseUp,
    handleElementMouseDown,
    handleResizeStart,
    handleUndo,
    handleRedo,
    handleDeleteElement,
    handleZoomIn,
    handleZoomOut,
    canUndo,
    canRedo,
    saveToHistory,
    getTextStyles
  } = useCanvasEvents({ canvasState });

  // --- PERFORMANCE OPTIMIZATION ---
  // Use resize observer to track canvas dimensions
  const canvasSize = useResizeObserver(canvasRef);
  
  // Add debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && canvasSize) {
      console.log('[Canvas] Canvas size updated:', canvasSize);
    }
  }, [canvasSize]);
  
  const { visibleElements, culledElements } = useViewportCulling({
    elements,
    zoomLevel,
    panOffset,
    canvasSize: canvasSize || { width: 0, height: 0 },
  });

  // Debug: Log culling stats when they change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Canvas] Rendering ${visibleElements.length} elements, culling ${culledElements.length} elements`);
    }
  }, [visibleElements.length, culledElements.length]);

  // Center the canvas on initial load
  useEffect(() => {
    if (canvasRef.current && panOffset.x === 0 && panOffset.y === 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPanOffset({
        x: rect.width / 2 - 300, // Center around the demo elements
        y: rect.height / 2 - 200
      });
    }
  }, [canvasRef.current, panOffset, setPanOffset]);

  // Position toolbar at bottom center initially
  useEffect(() => {
    const positionToolbar = () => {
      // Position relative to the entire page viewport, not canvas container
      setToolbarPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight - 100 // 100px from bottom of viewport
      });
    };

    // Position immediately on mount
    positionToolbar();

    // Also position on window resize
    const handleResize = () => {
      positionToolbar();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array - only run on mount and cleanup

  // Toolbar dragging handlers
  const handleToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === toolbarRef.current || toolbarRef.current?.contains(e.target as Node)) {
      setIsToolbarDragging(true);
      setToolbarDragStart({
        x: e.clientX - toolbarPosition.x,
        y: e.clientY - toolbarPosition.y
      });
      e.preventDefault();
      e.stopPropagation();
    }
  }, [toolbarPosition]);

  const handleToolbarMouseMove = useCallback((e: MouseEvent) => {
    if (isToolbarDragging) {
      setToolbarPosition({
        x: e.clientX - toolbarDragStart.x,
        y: e.clientY - toolbarDragStart.y
      });
    }
  }, [isToolbarDragging, toolbarDragStart]);

  const handleToolbarMouseUp = useCallback(() => {
    setIsToolbarDragging(false);
  }, []);

  // Add global event listeners for toolbar dragging
  useEffect(() => {
    if (isToolbarDragging) {
      document.addEventListener('mousemove', handleToolbarMouseMove);
      document.addEventListener('mouseup', handleToolbarMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleToolbarMouseMove);
        document.removeEventListener('mouseup', handleToolbarMouseUp);
      };
    }
  }, [isToolbarDragging, handleToolbarMouseMove, handleToolbarMouseUp]);

  // Helper function to create new elements
  const createNewElement = useCallback((type: string, shapeType?: string) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate center position in canvas coordinates (accounting for pan and zoom)
    // Use a safe default position if pan/zoom aren't properly initialized
    const safeZoom = zoomLevel || 1;
    const safePanX = panOffset?.x || 0;
    const safePanY = panOffset?.y || 0;
    
    const centerX = (canvasRect.width / 2 - safePanX) / safeZoom;
    const centerY = (canvasRect.height / 2 - safePanY) / safeZoom;

    const newElement: CanvasElementType = {
      id: `${type}-${Date.now()}`,
      type: (shapeType || type) as any,
      x: Math.max(50, centerX - 50), // Ensure minimum distance from edge
      y: Math.max(50, centerY - 25), // Ensure minimum distance from edge
      width: type === 'text' ? undefined : 100,
      height: type === 'text' ? undefined : 50,
      content: type === 'sticky-note' ? 'New note' : type === 'text' ? 'Click to edit' : undefined,
      backgroundColor: type === 'sticky-note' ? '#fef3c7' : type === 'rectangle' || shapeType === 'rectangle' ? '#3b82f6' : type === 'circle' || shapeType === 'circle' ? '#10b981' : undefined,
      color: type === 'text' ? '#000000' : undefined
    };

    setElements(prev => [...prev, newElement]);
    saveToHistory();
  }, [canvasRef, panOffset, zoomLevel, setElements, saveToHistory]);

  // --- UI & TOOL LOGIC ---
  const handleToolSelect = useCallback((tool: string, event?: React.MouseEvent) => {
    if (tool === 'shapes' && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 8
      });
      setShowShapeDropdown(!showShapeDropdown);
      return;
    }
    
    // Auto-create elements for certain tools
    if (tool === 'sticky-note') {
      createNewElement('sticky-note');
      setActiveTool('select');
      return;
    }
    
    if (tool === 'text') {
      createNewElement('text');
      setActiveTool('select');
      return;
    }
    
    setActiveTool(tool as any);
    if (tool === 'undo') handleUndo();
    if (tool === 'redo') handleRedo();
    if (tool === 'delete') handleDeleteElement();
    if (tool === 'zoom-in') handleZoomIn();
    if (tool === 'zoom-out') handleZoomOut();
  }, [setActiveTool, handleUndo, handleRedo, handleDeleteElement, handleZoomIn, handleZoomOut, showShapeDropdown, setShowShapeDropdown, setDropdownPosition, createNewElement]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    setSelectedShape(shapeId);
    createNewElement('shape', shapeId);
    setActiveTool('select');
    setShowShapeDropdown(false);
    setDropdownPosition(null);
  }, [setSelectedShape, setActiveTool, setShowShapeDropdown, setDropdownPosition, createNewElement]);

  // --- RENDERING ---
  const selectedElementData = useMemo(() => elements.find(el => el.id === selectedElement), [elements, selectedElement]);
  const resizeHandles = useMemo(() => {
      if (!selectedElementData || !selectedElementData.width || !selectedElementData.height) return [];
      const { x, y, width, height } = selectedElementData;
      return [
        { position: 'top-left', x: x - 4, y: y - 4 },
        { position: 'top-right', x: x + width - 4, y: y - 4 },
        { position: 'bottom-left', x: x - 4, y: y + height - 4 },
        { position: 'bottom-right', x: x + width - 4, y: y + height - 4 },
      ];
  }, [selectedElementData]);

  // Add visual debugging overlay in development
  const renderDebugOverlay = () => {
    if (process.env.NODE_ENV !== 'development' || !canvasSize) return null;
    
    const viewportBounds = {
      left: (-panOffset.x) / zoomLevel,
      top: (-panOffset.y) / zoomLevel,
      right: (canvasSize.width - panOffset.x) / zoomLevel,
      bottom: (canvasSize.height - panOffset.y) / zoomLevel,
    };

    return (
      <div
        className="absolute border-2 border-red-500 opacity-30 pointer-events-none"
        style={{
          left: viewportBounds.left,
          top: viewportBounds.top,
          width: viewportBounds.right - viewportBounds.left,
          height: viewportBounds.bottom - viewportBounds.top,
        }}
      />
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-bg-secondary overflow-hidden">
      {/* Draggable Toolbar */}
      <div 
        ref={toolbarRef}
        className="fixed z-20 cursor-move select-none"
        style={{
          left: '50%',
          bottom: '100px',
          transform: 'translateX(-50%)'
        }}
        onMouseDown={handleToolbarMouseDown}
      >
        <CanvasToolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          selectedShape={selectedShape}
          showShapeDropdown={showShapeDropdown}
          dropdownPosition={dropdownPosition}
          canUndo={canUndo}
          canRedo={canRedo}
          dropdownRef={dropdownRef}
          onShapeSelect={handleShapeSelect}
        />
      </div>

      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={(e) => {
             const delta = e.deltaY > 0 ? -0.1 : 0.1;
             canvasState.setZoomLevel(prev => Math.max(0.1, Math.min(prev + delta, 5)));
        }}
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute top-0 left-0"
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }}
        >
          {/* Debug overlay */}
          {renderDebugOverlay()}
          
          {/* Render visible elements */}
          {visibleElements.map(el => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={el.id === selectedElement}
              onMouseDown={(e) => handleElementMouseDown(e, el.id)}
              onTextChange={(id, content) => {
                setElements(prev => prev.map(elem => elem.id === id ? { ...elem, content } : elem));
              }}
              getTextStyles={getTextStyles}
               // Dummy props, will be implemented
              onTextFormatting={() => {}}
              onTextFormatPropertyChange={() => {}}
            />
          ))}

          {/* Render resize handles for the selected element */}
          {selectedElementData && resizeHandles.map(handle => (
            <div
              key={handle.position}
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize"
              style={{ left: handle.x, top: handle.y }}
              onMouseDown={(e) => handleResizeStart(e, handle.position, selectedElementData)}
            />
          ))}
        </div>
      </div>
      
      {/* Debug info panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>Canvas: {canvasSize?.width || 0} x {canvasSize?.height || 0}</div>
          <div>Zoom: {zoomLevel.toFixed(2)}</div>
          <div>Pan: ({panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)})</div>
          <div>Visible: {visibleElements.length} / {elements.length}</div>
        </div>
      )}
    </div>
  );
};

export default Canvas;

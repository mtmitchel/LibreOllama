// src/pages/Canvas.tsx - Complete viewport culling fix

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

  // --- VIEWPORT SIZE TRACKING ---
  // Track canvas viewport size with multiple methods for reliability
  const canvasSize = useResizeObserver(canvasRef);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Update viewport size whenever canvas size changes or window resizes
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newSize = { width: rect.width, height: rect.height };
        setViewportSize(newSize);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Canvas] Viewport size updated:', newSize);
        }
      }
    };

    // Initial update
    updateViewportSize();
    
    // Update on window resize
    window.addEventListener('resize', updateViewportSize);
    
    // Update when canvas size changes
    if (canvasSize) {
      setViewportSize(canvasSize);
    }
    
    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, [canvasSize]);

  // --- VIEWPORT CULLING ---
  const { visibleElements, culledElements } = useViewportCulling({
    elements,
    zoomLevel,
    panOffset,
    canvasSize: viewportSize,
  });

  // Debug: Log when elements are culled/shown
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Canvas] Viewport culling active:`, {
        viewportSize,
        totalElements: elements.length,
        visibleElements: visibleElements.length,
        culledElements: culledElements.length,
        culledIds: culledElements.map(e => e.id)
      });
    }
  }, [viewportSize, elements.length, visibleElements.length, culledElements.length]);

  // Center the canvas on initial load
  useEffect(() => {
    if (canvasRef.current && panOffset.x === 0 && panOffset.y === 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPanOffset({
        x: rect.width / 2 - 300, // Center around the demo elements
        y: rect.height / 2 - 200
      });
    }
  }, []);

  // Position toolbar at bottom center initially
  useEffect(() => {
    const positionToolbar = () => {
      setToolbarPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight - 100
      });
    };

    positionToolbar();
    window.addEventListener('resize', positionToolbar);
    return () => window.removeEventListener('resize', positionToolbar);
  }, []);

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

    const safeZoom = zoomLevel || 1;
    const safePanX = panOffset?.x || 0;
    const safePanY = panOffset?.y || 0;
    
    const centerX = (canvasRect.width / 2 - safePanX) / safeZoom;
    const centerY = (canvasRect.height / 2 - safePanY) / safeZoom;

    const newElement: CanvasElementType = {
      id: `${type}-${Date.now()}`,
      type: (shapeType || type) as any,
      x: Math.max(50, centerX - 50),
      y: Math.max(50, centerY - 25),
      width: type === 'text' ? undefined : 100,
      height: type === 'text' ? undefined : 50,
      content: type === 'sticky-note' ? 'New note' : type === 'text' ? 'Click to edit' : undefined,
      backgroundColor: type === 'sticky-note' ? '#fef3c7' : type === 'rectangle' || shapeType === 'rectangle' ? '#3b82f6' : type === 'circle' || shapeType === 'circle' ? '#10b981' : undefined,
      color: type === 'text' ? '#000000' : undefined
    };

    setElements(prev => [...prev, newElement]);
    saveToHistory();
  }, [canvasRef, panOffset, zoomLevel, setElements, saveToHistory]);

  // Tool selection handler
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

  // Debug overlay for development
  const renderDebugOverlay = () => {
    if (process.env.NODE_ENV !== 'development' || !viewportSize.width) return null;
    
    const viewportBounds = {
      left: (-panOffset.x) / zoomLevel,
      top: (-panOffset.y) / zoomLevel,
      right: (viewportSize.width - panOffset.x) / zoomLevel,
      bottom: (viewportSize.height - panOffset.y) / zoomLevel,
    };

    return (
      <>
        {/* Viewport bounds visualization */}
        <div
          className="absolute border-2 border-red-500 opacity-30 pointer-events-none"
          style={{
            left: viewportBounds.left,
            top: viewportBounds.top,
            width: viewportBounds.right - viewportBounds.left,
            height: viewportBounds.bottom - viewportBounds.top,
          }}
        />
        {/* Debug info panel */}
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          <div>Canvas: {viewportSize.width.toFixed(0)} x {viewportSize.height.toFixed(0)}</div>
          <div>Zoom: {zoomLevel.toFixed(2)}</div>
          <div>Pan: ({panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)})</div>
          <div className="text-green-400">Visible: {visibleElements.length}</div>
          <div className="text-red-400">Culled: {culledElements.length}</div>
          <div>Total: {elements.length}</div>
        </div>
      </>
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

      {/* Main Canvas Area - with proper clipping */}
      <div
        ref={canvasRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          canvasState.setZoomLevel(prev => Math.max(0.1, Math.min(prev + delta, 5)));
        }}
        style={{ 
          background: 'var(--bg-primary)',
          overflow: 'hidden', // Critical for viewport clipping
          position: 'relative' // Establish positioning context
        }}
      >
        {/* Canvas content container */}
        <div
          className="absolute"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            // Ensure the container is large enough to hold all elements
            // but doesn't affect viewport calculations
            width: '1px',
            height: '1px'
          }}
        >
          {/* Only render visible elements - this is the key optimization */}
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
              onTextFormatting={() => {}}
              onTextFormatPropertyChange={() => {}}
            />
          ))}

          {/* Render resize handles for the selected element */}
          {selectedElementData && visibleElements.includes(selectedElementData) && resizeHandles.map(handle => (
            <div
              key={handle.position}
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize"
              style={{ left: handle.x, top: handle.y }}
              onMouseDown={(e) => handleResizeStart(e, handle.position, selectedElementData)}
            />
          ))}
        </div>
        
        {/* Debug visualization */}
        {renderDebugOverlay()}
      </div>
    </div>
  );
};

export default Canvas;

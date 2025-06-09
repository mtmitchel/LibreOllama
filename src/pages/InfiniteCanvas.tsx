/**
 * Enhanced Infinite Canvas Component
 * Fixes pixelation, positioning issues, and implements infinite canvas functionality
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '../lib/pixi-setup';
import { useCanvasStore, CanvasElement } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import InfiniteCanvasGrid from '../components/canvas/InfiniteCanvasGrid';
import { PerformanceStats } from '../components/canvas/PerformanceStats';
import { TextFormattingToolbar } from '../components/canvas/TextFormattingToolbar';
import SimpleCanvasToolbar from '../components/canvas/SimpleCanvasToolbar';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { useCoordinateSystem } from '../lib/canvas-coordinates';

const InfiniteCanvas: React.FC = () => {  // Canvas store state
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const previewElement = useCanvasStore((state) => state.previewElement);
  const showTextFormatting = useCanvasStore((state) => state.showTextFormatting);
  const textFormattingPosition = useCanvasStore((state) => state.textFormattingPosition);
  const selectedTextElement = useCanvasStore((state) => state.selectedTextElement);

  // Canvas store actions
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const addToHistory = useCanvasStore((state) => state.addToHistory);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const setIsEditingText = useCanvasStore((state) => state.setIsEditingText);

  // Refs and local state
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  // Enhanced coordinate system
  const { getViewportCenter, containerToWorld, clampPan, clampZoom } = useCoordinateSystem(
    zoom,
    pan,
    canvasContainerRef as React.RefObject<HTMLElement>
  );

  // Enhanced viewport culling for infinite canvas
  const elementsArray = useMemo(() => Object.values(elements), [elements]);
  const { visibleElements } = useViewportCulling({
    elements: elementsArray,
    zoomLevel: zoom,
    panOffset: pan,
    canvasSize: canvasSize
  });
  // Canvas events with enhanced coordinate handling
  const {
    handleElementMouseDown,
    handleCanvasMouseDown,
    handleDeleteButtonClick
  } = useCanvasEvents({
    canvasContainerRef: canvasContainerRef as React.RefObject<HTMLDivElement>,
    textAreaRef: textAreaRef as React.RefObject<HTMLTextAreaElement>,
    getCanvasCoordinates: (clientX: number, clientY: number) => {
      if (!canvasContainerRef.current) return { x: 0, y: 0 };
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const containerX = clientX - rect.left;
      const containerY = clientY - rect.top;
      return containerToWorld({ x: containerX, y: containerY }) || { x: 0, y: 0 };
    },
    generateId: () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });  // Handle element double-click for text editing
  const handleElementDoubleClick = useCallback((elementId: string) => {
    const element = elements[elementId];
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      setIsEditingText(elementId);
    }
  }, [elements, setIsEditingText]);

  // Generate unique ID for elements
  const generateId = useCallback(() => 
    `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  // Enhanced element creation with proper positioning
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    if (!canvasContainerRef.current) return;

    const viewportCenter = getViewportCenter();
    if (!viewportCenter) return;

    // Use viewport center for positioning instead of manual calculation
    const centerX = viewportCenter.x;
    const centerY = viewportCenter.y;

    console.log('Creating element at world position:', { x: centerX, y: centerY });

    // Set element-specific dimensions and properties
    let defaultWidth = 150;
    let defaultHeight = 100;
    let additionalProps: Partial<CanvasElement> = {};

    switch (elementData.type) {
      case 'text':
        defaultWidth = 200;
        defaultHeight = 50;
        additionalProps = {
          content: 'Click to edit text',
          color: '#000000',
          fontSize: 'medium',
          textAlignment: 'left'
        };
        break;
      case 'sticky-note':
        defaultWidth = 200;
        defaultHeight = 150;
        additionalProps = {
          content: 'New sticky note',
          backgroundColor: '#FFFFE0',
          color: '#000000',
          fontSize: 'medium'
        };
        break;
      case 'rectangle':
      case 'square':
        defaultWidth = elementData.type === 'square' ? 100 : 150;
        defaultHeight = elementData.type === 'square' ? 100 : 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'circle':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'triangle':
      case 'hexagon':
      case 'star':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'line':
        defaultWidth = 100;
        defaultHeight = 0;
        additionalProps = {
          x2: centerX + 100,
          y2: centerY,
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'arrow':
        defaultWidth = 100;
        defaultHeight = 0;
        additionalProps = {
          x2: centerX + 100,
          y2: centerY,
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'drawing':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          points: [],
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'image':
        defaultWidth = 200;
        defaultHeight = 150;
        additionalProps = {
          imageUrl: '',
          imageName: 'Click to upload image'
        };
        break;
    }

    const newElement: CanvasElement = {
      id: generateId(),
      type: elementData.type!,
      x: centerX - defaultWidth / 2, // Center the element
      y: centerY - defaultHeight / 2, // Center the element
      width: defaultWidth,
      height: defaultHeight,
      ...additionalProps,
      ...elementData
    };

    // Validate element before adding
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Canvas: Failed to create valid element:', newElement);
      return;
    }

    console.log('Canvas: Adding new element:', newElement);
    addElement(newElement);
    addToHistory(useCanvasStore.getState().elements);

    // Auto-edit text elements
    if (newElement.type === 'text' || newElement.type === 'sticky-note') {
      setTimeout(() => {
        setIsEditingText(newElement.id);
      }, 50);
    }
  }, [addElement, addToHistory, generateId, getViewportCenter, setIsEditingText]);

  // Enhanced zoom and pan with clamping
  const handleZoomIn = useCallback(() => {
    const newZoom = clampZoom(zoom * 1.2);
    setZoom(newZoom);
  }, [zoom, clampZoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = clampZoom(zoom / 1.2);
    setZoom(newZoom);
  }, [zoom, clampZoom, setZoom]);

  // Handle container resize with proper device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        // Account for device pixel ratio to prevent pixelation
        const dpr = window.devicePixelRatio || 1;
        setCanvasSize({ 
          width: Math.floor(rect.width * dpr), 
          height: Math.floor(rect.height * dpr) 
        });
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Enhanced canvas mouse down handler
  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditingText) return;
    
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    
    const worldPos = containerToWorld({ x: containerX, y: containerY });
    if (!worldPos) return;

    console.log('Canvas mouse down at world position:', worldPos);
    
    // Pass to existing canvas event handler
    handleCanvasMouseDown(e);
  }, [isEditingText, containerToWorld, handleCanvasMouseDown]);

  // Wheel handler for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom with mouse position as center
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;
      
      const worldPos = containerToWorld({ x: containerX, y: containerY });
      if (!worldPos) return;

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clampZoom(zoom * zoomDelta);
      
      // Adjust pan to keep mouse position constant
      const newPan = {
        x: containerX - worldPos.x * newZoom,
        y: containerY - worldPos.y * newZoom
      };
      
      setZoom(newZoom);
      setPan(clampPan(newPan));
    } else {
      // Pan
      const newPan = {
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY
      };
      setPan(clampPan(newPan));
    }
  }, [zoom, pan, containerToWorld, clampZoom, clampPan, setZoom, setPan]);

  const handleToggleFormat = useCallback(() => {
    console.log('Toggle format');
  }, []);

  const handleSetFontSize = useCallback(() => {
    console.log('Set font size');
  }, []);

  const handleSetAlignment = useCallback(() => {
    console.log('Set alignment');
  }, []);

  const handleSetUrl = useCallback(() => {
    console.log('Set URL');
  }, []);

  const handleUpdateContent = useCallback(() => {
    console.log('Update content');
  }, []);

  return (
    <div className="canvas-container flex flex-col h-screen">      {/* Canvas Toolbar */}
      <SimpleCanvasToolbar 
        onDelete={handleDeleteButtonClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAddElement={(type: string) => createElementDirectly({ type: type as CanvasElement['type'] })}
      />
      
      {/* Main Canvas Area */}
      <div
        className="canvas-workspace flex-1 relative overflow-hidden bg-white"
        ref={canvasContainerRef}
        onMouseDown={onCanvasMouseDown}
        onWheel={handleWheel}
      >
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          options={{
            backgroundColor: 0xffffff,
            backgroundAlpha: 1,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            powerPreference: 'high-performance'
          }}
          onMount={(app: any) => {
            console.log('Infinite Canvas: PIXI Application mounted', {
              width: app.screen.width,
              height: app.screen.height,
              resolution: app.renderer.resolution,
              dpr: window.devicePixelRatio
            });
            
            app.stage.eventMode = 'static';
            app.stage.interactiveChildren = true;
            
            // Fix pixelation by properly setting canvas style
            if (app.view && app.view.style) {
              const canvas = app.view as HTMLCanvasElement;
              const rect = canvasContainerRef.current?.getBoundingClientRect();
              if (rect) {
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                canvas.style.display = 'block';
              }
            }
          }}
        >
          <Container x={pan.x} y={pan.y} scale={{ x: zoom, y: zoom }} eventMode="static">
            {/* Infinite Grid */}
            <InfiniteCanvasGrid 
              zoomLevel={zoom} 
              panOffset={pan} 
              viewportWidth={canvasSize.width}
              viewportHeight={canvasSize.height}
            />
            
            {/* Render visible elements only */}
            {visibleElements.map(element => (
              <CanvasElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={handleElementMouseDown}
                onDoubleClick={() => handleElementDoubleClick(element.id)}
              />
            ))}
            
            {/* Preview element while drawing */}
            {isDrawing && previewElement && (
              <CanvasElementRenderer
                key={`preview-${previewElement.id}`}
                element={previewElement}
                isSelected={false}
              />
            )}
          </Container>
        </Stage>

        {/* Text Editing Overlay */}
        {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) return null;
          
          const textareaX = (editingElement.x || 0) * zoom + pan.x;
          const textareaY = (editingElement.y || 0) * zoom + pan.y;
          const textareaWidth = Math.max((editingElement.width || 200) * zoom, 100);
          const textareaHeight = Math.max((editingElement.height || 50) * zoom, 30);
          
          return (
            <textarea
              ref={textAreaRef}
              defaultValue={editingElement.content || ''}
              className="absolute border-2 border-blue-500 rounded bg-white bg-opacity-95 p-2 text-sm font-inherit resize-none z-[1000]"
              style={{
                left: textareaX,
                top: textareaY,
                width: textareaWidth,
                height: textareaHeight,
                fontSize: editingElement.type === 'sticky-note' ? '14px' : '16px'
              }}
              onBlur={(e) => {
                updateElement(isEditingText, { content: e.target.value });
                addToHistory(useCanvasStore.getState().elements);
                setIsEditingText(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                }
                e.stopPropagation();
              }}
              autoFocus
            />
          );
        })()}

        {/* Text Formatting Toolbar */}
        {showTextFormatting && textFormattingPosition && selectedTextElement && (
          <TextFormattingToolbar
            elementId={selectedTextElement}
            element={elements[selectedTextElement]}
            position={textFormattingPosition}
            onToggleFormat={handleToggleFormat}
            onSetFontSize={handleSetFontSize}
            onSetAlignment={handleSetAlignment}
            onSetUrl={handleSetUrl}
            onUpdateContent={handleUpdateContent}
          />
        )}
      </div>

      {/* Performance Stats for Development */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceStats
          show={true}
          position="top-right"
        />
      )}

      {/* Debug Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs space-y-1 max-w-xs">
          <div className="font-bold">Infinite Canvas Debug</div>
          <div>Elements: {Object.keys(elements).length}</div>
          <div>Visible: {visibleElements.length}</div>
          <div>Zoom: {zoom.toFixed(2)}x</div>
          <div>Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</div>
          <div>Canvas: {canvasSize.width}x{canvasSize.height}</div>
          <div>DPR: {window.devicePixelRatio || 1}</div>
        </div>
      )}
    </div>
  );
};

export default InfiniteCanvas;

/**
 * Infinite Canvas Component
 * Enhanced version of Canvas.tsx with infinite scrolling, improved positioning, and anti-aliasing
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container, Graphics } from '../../lib/pixi-setup';
import { useCanvasStore, CanvasElement } from '../../stores/canvasStore';
import CanvasElementRenderer from './CanvasElementRenderer';
import InfiniteCanvasGrid from './InfiniteCanvasGrid';
import { useCanvasEvents } from '../../hooks/canvas/useCanvasEvents';
import { TextFormattingToolbar } from './TextFormattingToolbar';
import { CanvasToolbar } from './CanvasToolbar';
import { useCoordinateSystem, INFINITE_CANVAS_CONFIG } from '../../lib/canvas-coordinates';

const InfiniteCanvas: React.FC = () => {
  // Canvas store state
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const previewElement = useCanvasStore((state) => state.previewElement);
  const showTextFormatting = useCanvasStore((state) => state.showTextFormatting);
  const textFormattingPosition = useCanvasStore((state) => state.textFormattingPosition);
  const selectedTextElement = useCanvasStore((state) => state.selectedTextElement);
  const history = useCanvasStore((state) => state.history);
  const historyIndex = useCanvasStore((state) => state.historyIndex);

  // Store actions
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const addToHistory = useCanvasStore((state) => state.addToHistory);
  const setSelectedElementIds = useCanvasStore((state) => state.setSelectedElementIds);
  const setIsEditingText = useCanvasStore((state) => state.setIsEditingText);
  // Local state
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);

  // Enhanced coordinate system
  const { getViewportCenter, containerToWorld, clampPan, clampZoom } = useCoordinateSystem(
    zoom, 
    pan, 
    canvasContainerRef
  );

  // Memoize elements array for performance
  const elementsArray = useMemo(() => Object.values(elements), [elements]);

  // Enhanced viewport culling for infinite canvas
  const visibleElements = useMemo(() => {
    if (!canvasContainerRef.current) return elementsArray;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const margin = INFINITE_CANVAS_CONFIG.CULLING_MARGIN;
    
    // Calculate visible world bounds
    const topLeftWorld = containerToWorld({ x: -margin, y: -margin });
    const bottomRightWorld = containerToWorld({ 
      x: rect.width + margin, 
      y: rect.height + margin 
    });

    if (!topLeftWorld || !bottomRightWorld) return elementsArray;

    // Filter elements that intersect with visible bounds
    return elementsArray.filter(element => {
      const elementBounds = {
        left: element.x,
        top: element.y,
        right: element.x + (element.width || 0),
        bottom: element.y + (element.height || 0)
      };

      return !(
        elementBounds.right < topLeftWorld.x ||
        elementBounds.bottom < topLeftWorld.y ||
        elementBounds.left > bottomRightWorld.x ||
        elementBounds.top > bottomRightWorld.y
      );
    });
  }, [elementsArray, containerToWorld, canvasSize]);

  // Utility functions
  const generateId = useCallback(() => crypto.randomUUID(), []);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;
    return containerToWorld({ x: containerX, y: containerY }) || { x: 0, y: 0 };
  }, [containerToWorld]);

  // Enhanced element creation with proper positioning
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    const center = getViewportCenter();
    if (!center) return;

    console.log('Creating element at viewport center:', center);

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
          x2: center.x + 100,
          y2: center.y,
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'arrow':
        defaultWidth = 100;
        defaultHeight = 0;
        additionalProps = {
          x2: center.x + 100,
          y2: center.y,
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
      x: center.x - defaultWidth / 2, // Center the element
      y: center.y - defaultHeight / 2, // Center the element
      width: defaultWidth,
      height: defaultHeight,
      isLocked: false,
      ...additionalProps,
      ...elementData
    };

    // Validation
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Failed to create valid element:', newElement);
      return;
    }

    console.log('Created element:', newElement);

    addElement(newElement);
    addToHistory({ ...elements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    
    // Auto-start text editing for text elements
    if (newElement.type === 'text' || newElement.type === 'sticky-note') {
      setIsEditingText(newElement.id);
    }
  }, [generateId, getViewportCenter, addElement, addToHistory, setSelectedElementIds, setIsEditingText, elements]);

  // Enhanced event handling
  const { handleCanvasMouseDown, handleDeleteButtonClick } = useCanvasEvents({
    canvasContainerRef,
    textAreaRef,
    getCanvasCoordinates,
    generateId,
  });

  const handleElementMouseDown = useCallback((e: any, elementId: string) => {
    console.log('Element mouse down:', elementId);
    
    const element = elements[elementId];
    if (!element) return;

    // Handle selection logic here
    const shiftPressed = e.data?.originalEvent?.shiftKey || false;
    
    if (shiftPressed) {
      // Toggle selection
      if (selectedElementIds.includes(elementId)) {
        setSelectedElementIds(selectedElementIds.filter(id => id !== elementId));
      } else {
        setSelectedElementIds([...selectedElementIds, elementId]);
      }
    } else {
      // Single selection
      setSelectedElementIds([elementId]);
    }
  }, [elements, selectedElementIds, setSelectedElementIds]);

  const handleElementDoubleClick = useCallback((elementId: string) => {
    console.log('Element double click:', elementId);
    const element = elements[elementId];
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      setIsEditingText(elementId);
    }
  }, [elements, setIsEditingText]);

  // Enhanced zoom with clamping
  const handleZoomIn = useCallback(() => {
    const newZoom = clampZoom(zoom * 1.2);
    setZoom(newZoom);
  }, [zoom, clampZoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = clampZoom(zoom / 1.2);
    setZoom(newZoom);
  }, [zoom, clampZoom, setZoom]);

  // Enhanced pan with clamping
  const handlePan = useCallback((newPan: { x: number; y: number }) => {
    const clampedPan = clampPan(newPan);
    setPan(clampedPan);
  }, [clampPan, setPan]);

  // Toolbar handlers
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    if (toolId === 'shapes' && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.top - 10
      });
      setShowShapeDropdown(!showShapeDropdown);
      return;
    }
    
    setShowShapeDropdown(false);
    
    if (toolId === 'select') {
      useCanvasStore.getState().setActiveTool('select');
    } else if (toolId === 'delete') {
      handleDeleteButtonClick();
    } else if (toolId === 'pen') {
      useCanvasStore.getState().setActiveTool('pen');
    } else {
      // Create element for shape tools
      createElementDirectly({ type: toolId as CanvasElement['type'] });
    }
  }, [createElementDirectly, handleDeleteButtonClick, showShapeDropdown]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    createElementDirectly({ type: shapeId as CanvasElement['type'] });
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
  }, [createElementDirectly]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    useCanvasStore.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useCanvasStore.getState().redo();
  }, []);

  // Text formatting handlers
  const handleToggleFormat = useCallback((elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => {
    const element = elements[elementId];
    if (element) {
      updateElement(elementId, { [formatType]: !element[formatType] });
      addToHistory(useCanvasStore.getState().elements);
    }
  }, [elements, updateElement, addToHistory]);

  const handleSetFontSize = useCallback((elementId: string, fontSize: 'small' | 'medium' | 'large') => {
    updateElement(elementId, { fontSize });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  const handleSetAlignment = useCallback((elementId: string, alignment: 'left' | 'center' | 'right') => {
    updateElement(elementId, { textAlignment: alignment });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  const handleSetUrl = useCallback((elementId: string) => {
    const element = elements[elementId];
    if (element) {
      const currentUrl = element.url || '';
      const newUrl = prompt('Enter URL:', currentUrl);
      if (newUrl !== null) {
        updateElement(elementId, { url: newUrl || undefined });
        addToHistory(useCanvasStore.getState().elements);
      }
    }
  }, [elements, updateElement, addToHistory]);

  const handleUpdateContent = useCallback((elementId: string, content: string) => {
    updateElement(elementId, { content });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  // Setup resize observer
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Focus textarea when editing
  useEffect(() => {
    if (isEditingText && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [isEditingText]);

  // Handle dropdown outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShapeDropdown(false);
      }
    };

    if (showShapeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShapeDropdown]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="canvas-container" style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      <CanvasToolbar
        activeTool={activeTool}
        selectedShape={selectedShape}
        showShapeDropdown={showShapeDropdown}
        dropdownPosition={dropdownPosition}
        canUndo={canUndo}
        canRedo={canRedo}
        dropdownRef={dropdownRef}
        onToolSelect={handleToolSelect}
        onShapeSelect={handleShapeSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDeleteButtonClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      
      <div
        className="canvas-workspace"        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff' // Clean white background
        }}
        ref={canvasContainerRef}
        onMouseDown={handleCanvasMouseDown}
      >
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}          options={{
            backgroundColor: 0xffffff, // Clean white background
            backgroundAlpha: 1,
            antialias: true,
            autoDensity: true,
            resolution: Math.max(window.devicePixelRatio || 1, 2), // Enhanced resolution for crisp rendering
            powerPreference: 'high-performance'
          }}
          onMount={(app: any) => {
            console.log('Infinite Canvas: PIXI Application mounted');
            app.stage.eventMode = 'static';
            app.stage.interactiveChildren = true;
            
            // Enhanced canvas styling for crisp rendering
            if (app.view && app.view.style) {
              app.view.style.display = 'block';
              app.view.style.width = '100%';
              app.view.style.height = '100%';
              app.view.style.imageRendering = 'crisp-edges';
              app.view.style.imageRendering = '-webkit-optimize-contrast';
            }
            
            // Force resize to fill container
            if (canvasContainerRef.current) {
              const rect = canvasContainerRef.current.getBoundingClientRect();
              app.renderer.resize(rect.width, rect.height);
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
            
            {/* Render visible elements */}
            {visibleElements.map(element => (
              <CanvasElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={handleElementMouseDown}
                onDoubleClick={() => handleElementDoubleClick(element.id)}
              />
            ))}
            
            {/* Preview element (while drawing) */}
            {isDrawing && previewElement && (
              <CanvasElementRenderer
                key={`preview-${previewElement.id}`}
                element={previewElement}
                isSelected={false}
              />
            )}
          </Container>
        </Stage>

        {/* Text editing overlay */}
        {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) return null;
          
          const textareaX = editingElement.x * zoom + pan.x;
          const textareaY = editingElement.y * zoom + pan.y;
          const textareaWidth = Math.max((editingElement.width || 200) * zoom, 100);
          const textareaHeight = Math.max((editingElement.height || 50) * zoom, 30);

          return (
            <textarea
              ref={textAreaRef}
              className="canvas-text-editor"
              value={editingElement.content || ''}
              onChange={(e) => {
                updateElement(isEditingText, { content: e.target.value });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={() => {
                addToHistory(useCanvasStore.getState().elements);
                setIsEditingText(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                  e.preventDefault();
                  textAreaRef.current?.blur();
                }
              }}              style={{
                position: 'absolute',
                left: `${textareaX}px`,
                top: `${textareaY}px`,
                width: `${textareaWidth}px`,
                height: `${textareaHeight}px`,
                fontSize: `${(editingElement.fontSize === 'small' ? 12 : editingElement.fontSize === 'large' ? 24 : 16) * zoom}px`,
                lineHeight: 1.4,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#1a1a1a',
                backgroundColor: editingElement.type === 'sticky-note' ? 'rgba(255, 255, 224, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #3b82f6',
                borderRadius: '6px',
                outline: 'none',
                resize: 'none',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                zIndex: 1000,
                padding: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(8px)'
              }}
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
        )}        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono shadow-lg">
            <div className="font-semibold mb-1">Canvas Debug</div>
            <div>Elements: {Object.keys(elements).length}</div>
            <div>Visible: {visibleElements.length}</div>
            <div>Zoom: {zoom.toFixed(2)}x</div>
            <div>Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteCanvas;

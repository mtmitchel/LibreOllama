/**
 * Enhanced Canvas with infinite scrolling, improved positioning, and anti-aliasing
 * Replaces the original Canvas.tsx with performance optimizations and bug fixes
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container, Graphics } from '../lib/pixi-setup';
import { useCanvasStore, CanvasElement } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import InfiniteCanvasGrid from '../components/canvas/InfiniteCanvasGrid';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { TextFormattingToolbar } from '../components/canvas/TextFormattingToolbar';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { useCoordinateSystem, INFINITE_CANVAS_CONFIG } from '../lib/canvas-coordinates';

const Canvas: React.FC = () => {
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
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  // Local state
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);

  // Enhanced coordinate system
  const { 
    getCoordinateSystem,
    getViewportCenter,
    containerToWorld,
    clampPan,
    clampZoom
  } = useCoordinateSystem(zoom, pan, canvasContainerRef);
  
  // Helper functions for coordinate transformations
  const getViewportBounds = useCallback(() => {
    const coordSystem = getCoordinateSystem();
    return coordSystem?.getVisibleWorldBounds() || { x: 0, y: 0, width: canvasSize.width || 800, height: canvasSize.height || 600 };
  }, [getCoordinateSystem, canvasSize]);

  // Memoize the elements array for stability
  const elementsArray = useMemo(() => Object.values(elements), [elements]);


  const isElementClicked = useRef(false);
  
  // CanvasToolbar state
  const [selectedShape, setSelectedShape] = useState('');
  
  // Compute undo/redo availability
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Setup viewport culling
  const { visibleElements } = useViewportCulling({
    elements: elementsArray,
    canvasSize: canvasSize,
    zoomLevel: zoom,
    panOffset: pan,
  });

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;
    const worldCoords = containerToWorld({ x: containerX, y: containerY });
    return worldCoords || { x: 0, y: 0 };
  }, [containerToWorld]);

  const generateId = useCallback(() => crypto.randomUUID(), []);

  // Initialize canvas events hook
  const { handleCanvasMouseDown, handleDeleteButtonClick } = useCanvasEvents({
    canvasContainerRef,
    textAreaRef,
    getCanvasCoordinates,
    generateId,
  });
    // Element-specific mouse down handler
    const handleElementMouseDown = useCallback((e: any, elementId: string) => {
      console.log('Canvas: handleElementMouseDown called', { elementId, event: e });
      isElementClicked.current = true; // Set the flag indicating an element was clicked
  
      const { activeTool: currentActiveTool, isEditingText: currentEditingText, selectElement, setIsEditingText, addToHistory, setDragState, elements: currentElements, selectedElementIds: currentSelectedIdsFromStore, pan, zoom } = useCanvasStore.getState();
  
      console.log('Canvas: Mouse down state check', {
        activeTool: currentActiveTool,
        currentEditingText,
        selectedIds: currentSelectedIdsFromStore
      });
  
      if (currentActiveTool !== 'select') {
        console.log('Canvas: Not in select mode, ignoring mouse down');
        return;
      }
      
      if (currentEditingText && currentEditingText !== elementId) {
        setIsEditingText(null);
      }
      
      const shiftPressed = e.data?.originalEvent?.shiftKey || false;
      let newSelectedIds: string[];
  
      if (shiftPressed) {
        if (currentSelectedIdsFromStore.includes(elementId)) {
          newSelectedIds = currentSelectedIdsFromStore.filter(id => id !== elementId);
        } else {
          newSelectedIds = [...currentSelectedIdsFromStore, elementId];
        }
        useCanvasStore.getState().setSelectedElementIds(newSelectedIds);
      } else if (!currentSelectedIdsFromStore.includes(elementId)) {
        newSelectedIds = [elementId];
        useCanvasStore.getState().setSelectedElementIds(newSelectedIds);
      } else {
        newSelectedIds = [...currentSelectedIdsFromStore];
      }
      
      console.log('Canvas: Selection updated', { newSelectedIds });
      const finalSelectedIdsForDrag = useCanvasStore.getState().selectedElementIds;
  
      // Handle both PIXI events and DOM events for compatibility with mock PIXI system
      let startDragWorldCoords: { x: number; y: number };
      
      if (e.data && e.data.getLocalPosition) {
        // Real PIXI event
        const pannedZoomedContainer = e.currentTarget.parent;
        startDragWorldCoords = e.data.getLocalPosition(pannedZoomedContainer);
        console.log('Canvas: Using real PIXI coordinates', startDragWorldCoords);
      } else {
        // Mock PIXI event - calculate coordinates from DOM event
        const domEvent = e.nativeEvent || e;
        if (domEvent && domEvent.clientX !== undefined && domEvent.clientY !== undefined) {
          const rect = canvasContainerRef.current?.getBoundingClientRect();
          if (rect) {
            // Convert screen coordinates to canvas coordinates accounting for pan/zoom
            const canvasX = (domEvent.clientX - rect.left - pan.x) / zoom;
            const canvasY = (domEvent.clientY - rect.top - pan.y) / zoom;
            startDragWorldCoords = { x: canvasX, y: canvasY };
            console.log('Canvas: Using calculated DOM coordinates', {
              clientX: domEvent.clientX,
              clientY: domEvent.clientY,
              rect,
              pan,
              zoom,
              result: startDragWorldCoords
            });
          } else {
            startDragWorldCoords = { x: 0, y: 0 };
            console.warn('Canvas: No rect available, using 0,0');
          }
        } else {
          console.warn('Canvas: Unable to determine drag coordinates from event:', e);
          startDragWorldCoords = { x: 0, y: 0 };
        }
      }
  
      const initialPositions: Record<string, { x: number; y: number }> = {};
      finalSelectedIdsForDrag.forEach(id => {
        if (currentElements[id]) {
          initialPositions[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
  
      console.log('Canvas: Setting drag state', {
        startDragWorldCoords,
        initialPositions,
        finalSelectedIdsForDrag
      });
      setDragState(true, startDragWorldCoords, initialPositions);
    }, []); // Removed dependencies as we get fresh state from the store
  
    // This is the main canvas mousedown, we check our flag here.
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    // PIXI canvas clicks are now handled by PIXI itself (see useCanvasEvents.ts)
    // This handler only processes clicks on the container div, not the canvas
    handleCanvasMouseDown(e);
  };
  
  // Handle double-click to start text editing
  const handleElementDoubleClick = useCallback((elementId: string) => {
    console.log(`Canvas: handleElementDoubleClick called for element ${elementId}`);
    console.log(`Canvas: Current elements:`, Object.keys(elements));
    console.log(`Canvas: Stack trace:`, new Error().stack);
    const element = elements[elementId];
    console.log(`Canvas: Found element:`, element);
    console.log(`Canvas: Element type: ${element?.type}, is text/sticky-note: ${element && (element.type === 'text' || element.type === 'sticky-note')}`);
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      console.log(`Canvas: Setting isEditingText to ${elementId}`);
      const currentEditingText = useCanvasStore.getState().isEditingText;
      console.log(`Canvas: Current isEditingText: ${currentEditingText}`);
      console.log(`Canvas: Current activeTool:`, useCanvasStore.getState().activeTool);
      console.log(`Canvas: Current selectedElementIds:`, useCanvasStore.getState().selectedElementIds);
      useCanvasStore.getState().setIsEditingText(elementId);
      // Verify the state was set
      setTimeout(() => {
        const newEditingText = useCanvasStore.getState().isEditingText;
        console.log(`Canvas: After setIsEditingText, new value: ${newEditingText}`);
        console.log(`Canvas: TextArea ref exists:`, !!textAreaRef.current);
      }, 0);
    } else {
      console.log(`Canvas: Element not found or not text/sticky-note type`);
    }
  }, [elements]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Set initial size immediately
    const rect = container.getBoundingClientRect();
    const initialSize = { width: rect.width, height: rect.height };
    console.log('Canvas: Initial container size:', initialSize);
    setCanvasSize(initialSize);

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      console.log('Canvas: Container resized to:', { width, height });
      setCanvasSize({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    if (!canvasContainerRef.current) return;
    
    const { pan: currentPan, zoom: currentZoom, elements: currentElements, addElement, addToHistory, setSelectedElementIds, setIsEditingText } = useCanvasStore.getState();
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    
    // Calculate center position in world coordinates using proper coordinate system
    const centerContainerX = rect.width / 2;
    const centerContainerY = rect.height / 2;
    
    // Use the coordinate system for proper infinite canvas positioning
    const worldCenter = containerToWorld({ x: centerContainerX, y: centerContainerY });
    const centerX = worldCenter?.x || 0;
    const centerY = worldCenter?.y || 0;
    
    console.log('Creating element at world position:', { x: centerX, y: centerY });
    console.log('Container size:', { width: rect.width, height: rect.height });
    console.log('Pan/Zoom:', { pan: currentPan, zoom: currentZoom });
    
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
    }    const newElement: CanvasElement = {
      id: generateId(),
      type: elementData.type!,
      x: centerX - defaultWidth / 2,
      y: centerY - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      isLocked: false,
      ...additionalProps,
      ...elementData, // Override with any specific properties passed in
    };

    // Validate the new element before adding
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Canvas: Failed to create valid element:', newElement);
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`Canvas: Creating new ${newElement.type} element:`, newElement);
    }

    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    
    // Auto-start text editing for text elements
    if (newElement.type === 'text' || newElement.type === 'sticky-note') {
      setIsEditingText(newElement.id);
    }
  }, [generateId]);

  // Text formatting handlers (simplified versions for the refactored approach)
  const handleToggleFormat = useCallback((elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => {
    const { elements, updateElement, addToHistory } = useCanvasStore.getState();
    const element = elements[elementId];
    if (element) {
      updateElement(elementId, { [formatType]: !element[formatType] });
      addToHistory(useCanvasStore.getState().elements);
    }
  }, []);

  const handleSetFontSize = useCallback((elementId: string, fontSize: 'small' | 'medium' | 'large') => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { fontSize });
    addToHistory(useCanvasStore.getState().elements);
  }, []);

  const handleSetAlignment = useCallback((elementId: string, alignment: 'left' | 'center' | 'right') => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { textAlignment: alignment });
    addToHistory(useCanvasStore.getState().elements);
  }, []);

  const handleSetUrl = useCallback((elementId: string) => {
    const { elements, updateElement, addToHistory } = useCanvasStore.getState();
    const element = elements[elementId];
    if (element) {
      const currentUrl = element.url || '';
      const newUrl = prompt('Enter URL:', currentUrl);
      if (newUrl !== null) {
        updateElement(elementId, { url: newUrl || undefined });
        addToHistory(useCanvasStore.getState().elements);
      }
    }
  }, []);

  const handleUpdateContent = useCallback((elementId: string, content: string) => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { content });
    addToHistory(useCanvasStore.getState().elements);
  }, []);
  // Handlers for CanvasToolbar
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    if (toolId === 'shapes' && event) {
      // Handle shapes dropdown
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.top - 10
      });
      setShowShapeDropdown(!showShapeDropdown);
      return;
    }
    
    // Close dropdown when selecting other tools
    setShowShapeDropdown(false);
      // Handle other tools
    if (toolId === 'select') {
      useCanvasStore.getState().setActiveTool('select');
    } else if (toolId === 'delete') {
      handleDeleteButtonClick();
    } else if (toolId === 'pen') {
      // For pen tool, switch to drawing mode
      useCanvasStore.getState().setActiveTool('pen');
    } else {
      // For shape tools, create the element directly
      switch (toolId) {
        case 'text':
          createElementDirectly({ type: 'text' });
          break;
        case 'sticky-note':
          createElementDirectly({ type: 'sticky-note' });
          break;
        case 'rectangle':
          createElementDirectly({ type: 'rectangle' });
          break;
        case 'line':
          createElementDirectly({ type: 'line' });
          break;
        case 'circle':
          createElementDirectly({ type: 'circle' });
          break;
        case 'triangle':
          createElementDirectly({ type: 'triangle' });
          break;
        case 'star':
          createElementDirectly({ type: 'star' });
          break;
        case 'hexagon':
          createElementDirectly({ type: 'hexagon' });
          break;
        case 'arrow':
          createElementDirectly({ type: 'arrow' });
          break;
        case 'square':
          createElementDirectly({ type: 'square' });
          break;
        case 'image':
          createElementDirectly({ type: 'image' });
          break;
      }
    }
  }, [createElementDirectly, handleDeleteButtonClick, showShapeDropdown]);
  const handleShapeSelect = useCallback((shapeId: string) => {
    createElementDirectly({ type: shapeId as CanvasElement['type'] });
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
  }, [createElementDirectly]);

  // Additional handlers for CanvasToolbar
  const handleUndo = useCallback(() => {
    useCanvasStore.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useCanvasStore.getState().redo();
  }, []);

  const handleZoomIn = useCallback(() => {
    const { zoom: currentZoom, setZoom } = useCanvasStore.getState();
    setZoom(currentZoom * 1.1);
  }, []);

  const handleZoomOut = useCallback(() => {
    const { zoom: currentZoom, setZoom } = useCanvasStore.getState();
    setZoom(currentZoom / 1.1);
  }, []);
  // When editing text, focus the textarea
  useEffect(() => {
    if (isEditingText && textAreaRef.current) {
        textAreaRef.current.focus();
        // Select all text when starting to edit for easy replacement
        textAreaRef.current.select();
    }
  }, [isEditingText]);

  // Handle clicking outside dropdown to close it
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
  return (
    <div className="canvas-container" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Replace simple toolbar with comprehensive CanvasToolbar */}      <CanvasToolbar
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
        className="canvas-workspace"
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff' // Ensure white background
        }}
        ref={canvasContainerRef}
        onMouseDown={onCanvasMouseDown} // Use our new handler
      >
        <Stage
          width={canvasSize.width || 800} // Provide default dimensions
          height={canvasSize.height || 600}
          options={{
            backgroundColor: 0xf8f9fa,
            backgroundAlpha: 1,
            antialias: true,
            autoDensity: true,
            resolution: Math.max(window.devicePixelRatio || 1, 2), // Force higher resolution for crisp rendering
            powerPreference: 'high-performance',
          }}
          onMount={(app: any) => {
            console.log('Canvas: PIXI Application mounted', {
              width: app.screen.width,
              height: app.screen.height,
              view: app.view,
              renderer: app.renderer
            });
            // Ensure the stage is interactive (v8 syntax)
            app.stage.eventMode = 'static';
            app.stage.interactiveChildren = true;
            
            // Style the canvas element directly for crisp rendering
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
            {console.log('Canvas: Container rendered with eventMode=static')}
            {/* Infinite canvas background */}
             <Graphics
               draw={(g: any) => {
                 g.clear();
                 // Draw infinite canvas background that extends beyond viewport
                 const viewportBounds = getViewportBounds();
                 const margin = 2000; // Extra margin for smooth panning
                 g.fill(0xffffff); // White fill
                 g.rect(
                   viewportBounds.x - margin, 
                   viewportBounds.y - margin, 
                   viewportBounds.width + (margin * 2), 
                   viewportBounds.height + (margin * 2)
                 );
                 g.fill();
               }}
            />
            <InfiniteCanvasGrid 
              zoomLevel={zoom} 
              panOffset={pan} 
              viewportWidth={canvasSize.width} 
              viewportHeight={canvasSize.height} 
              containerRef={canvasContainerRef}
            />
            {(() => {
              const filteredElements = visibleElements.filter(element => element && element.id && element.type);
              
              if (import.meta.env.DEV) {
                console.log(`Canvas: Rendering ${filteredElements.length} elements out of ${Object.keys(elements).length} total (Element Loop Re-enabled)`);
                if (filteredElements.length !== Object.keys(elements).length) {
                  console.log('Canvas: Some elements filtered out by viewport culling or validation');
                }
              }
              
              return filteredElements.map(element => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onMouseDown={handleElementMouseDown}
                  onDoubleClick={(e) => {
                    console.log(`Canvas: onDoubleClick wrapper called for element ${element.id}`);
                    console.log(`Canvas: Event passed to wrapper:`, e);
                    console.log(`Canvas: Event type:`, e?.type);
                    console.log(`Canvas: Calling handleElementDoubleClick...`);
                    try {
                      handleElementDoubleClick(element.id);
                      console.log(`Canvas: handleElementDoubleClick completed`);
                    } catch (error) {
                      console.error(`Canvas: Error in handleElementDoubleClick:`, error);
                    }
                  }}
                />
              ));
            })()}
            {isDrawing && previewElement && previewElement.type && (
              <CanvasElementRenderer
                key={`preview-${previewElement.id}`}
                element={previewElement}
                isSelected={false} // Preview element is never selected in the same way as placed elements
                // No mouse handlers for preview, it's just a visual
              />
            )}
          </Container>
        </Stage> {/* --- STAGE RE-ENABLED FOR DEBUGGING --- */}
          {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) {
            console.warn(`Canvas: Editing element "${isEditingText}" not found in elements`);
            return null;
          }
          
          // Calculate textarea position and size
          const textareaX = (editingElement.x || 0) * zoom + pan.x;
          const textareaY = (editingElement.y || 0) * zoom + pan.y;
          const textareaWidth = Math.max((editingElement.width || 200) * zoom, 100);
          const textareaHeight = Math.max((editingElement.height || 50) * zoom, 30);

          // Debug log for textarea positioning
          if (import.meta.env.DEV) {
            console.log(`Canvas: Textarea positioned at (${textareaX}, ${textareaY}) with size ${textareaWidth}x${textareaHeight}`);
          }

          return (            <textarea
              ref={textAreaRef}
              className="canvas-text-editor" // Added a class for styling
              value={editingElement.content || ''}
              onChange={(e) => {
                const newContent = e.target.value;
                useCanvasStore.getState().updateElement(isEditingText, { content: newContent });
                if (import.meta.env.DEV) {
                  console.log(`Canvas: Updated element "${isEditingText}" content to:`, newContent);
                }
              }}
              onMouseDown={(e) => {
                // Prevent canvas events from interfering with text selection
                e.stopPropagation();
              }}
              onBlur={() => {
                const { elements: currentElements } = useCanvasStore.getState();
                if (import.meta.env.DEV) {
                  console.log(`Canvas: Finishing text edit for element "${isEditingText}"`);
                }
                useCanvasStore.getState().addToHistory(currentElements);
                useCanvasStore.getState().setIsEditingText(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                  e.preventDefault();
                  textAreaRef.current?.blur(); // Trigger the onBlur handler to save and exit
                }
              }}
              style={{
                position: 'absolute',
                left: `${textareaX}px`,
                top: `${textareaY}px`,
                width: `${textareaWidth}px`,
                height: `${textareaHeight}px`,
                fontSize: `${(editingElement.fontSize === 'small' ? 12 : editingElement.fontSize === 'large' ? 24 : 16) * zoom}px`,
                lineHeight: 1.2,
                fontFamily: 'var(--font-sans)',
                color: 'black',
                backgroundColor: editingElement.type === 'sticky-note' ? 'rgba(255, 255, 224, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                outline: 'none',
                resize: 'none',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                zIndex: 1000,
                padding: '5px',
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
        )}
      </div>
    </div>
  );
};

export default Canvas;

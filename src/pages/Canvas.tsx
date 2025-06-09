import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useCanvasStore, CanvasElement, CanvasState } from '../stores/canvasStore'; // Added CanvasState, removed unused CanvasTool
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementComponent from '../components/canvas/CanvasElement'; 
import CanvasGrid from '../components/canvas/CanvasGrid';
import { Trash2 } from 'lucide-react';
import * as PIXI from 'pixi.js';

const Canvas = () => {
  const elements = useCanvasStore((state: CanvasState) => state.elements, shallow);
  const selectedElementIds = useCanvasStore((state: CanvasState) => state.selectedElementIds, shallow);
  const activeTool = useCanvasStore((state: CanvasState) => state.activeTool);
  const zoom = useCanvasStore((state: CanvasState) => state.zoom);
  const pan = useCanvasStore((state: CanvasState) => state.pan, shallow);
  const isEditingText = useCanvasStore((state: CanvasState) => state.isEditingText);
  // isDragging and dragStartPos are intentionally not selected here if handled by getState() or local refs as per original comments

  const {
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    setSelectedElementIds,
    clearSelection,
    setActiveTool, 
    setZoom, 
    setPan,
    setDragState,
    setIsDrawing, 
    setPreviewState, 
    setResizeState, 
    setIsEditingText, 
    setTextFormattingState, 
    addToHistory, 
    undo,
    redo,
  } = useCanvasStore((state: CanvasState) => ({ 
    addElement: state.addElement,
    updateElement: state.updateElement,
    deleteElement: state.deleteElement,
    selectElement: state.selectElement,
    setSelectedElementIds: state.setSelectedElementIds,
    clearSelection: state.clearSelection,
    setActiveTool: state.setActiveTool,
    setZoom: state.setZoom,
    setPan: state.setPan,
    setDragState: state.setDragState,
    setIsDrawing: state.setIsDrawing,
    setPreviewState: state.setPreviewState,
    setResizeState: state.setResizeState,
    setIsEditingText: state.setIsEditingText,
    setTextFormattingState: state.setTextFormattingState,
    addToHistory: state.addToHistory,
    undo: state.undo,
    redo: state.redo,
  })); 

  const pixiContainerRef = useRef<HTMLDivElement>(null); // For PIXI app rendering
  const canvasContainerRef = useRef<HTMLDivElement>(null); // For overall workspace dimensions and DOM events
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});
  const isPanning = useRef(false);
  const [editingTextValue, setEditingTextValue] = useState(''); 
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Memoize the array of elements for useViewportCulling
  const elementsArray = useMemo(() => Object.values(elements), [elements]);

  // Effect to update canvasSize based on canvasContainerRef dimensions
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setCanvasSize(prevSize => {
              if (prevSize.width !== width || prevSize.height !== height) {
                return { width, height };
              }
              return prevSize; // Return previous state if no change
            });
          }
        }
      });
      resizeObserver.observe(container);
      // Initial size
      const initialWidth = container.clientWidth;
      const initialHeight = container.clientHeight;
      if (initialWidth > 0 && initialHeight > 0) {
        setCanvasSize(prevSize => {
          if (prevSize.width !== initialWidth || prevSize.height !== initialHeight) {
            return { width: initialWidth, height: initialHeight };
          }
          return prevSize;
        });
      }
      return () => resizeObserver.unobserve(container);
    }
  }, []); // Runs once on mount and when canvasContainerRef is available

  // PIXI.js setup effect (initialization)
  useEffect(() => {
    if (!pixiContainerRef.current) {
      // console.warn('Pixi container ref not available for Pixi app setup.'); // Keep console cleaner
      return;
    }

    // If pixiAppRef.current is already set, it implies a previous effect instance
    // did not clean up its ref properly, or this effect is running unexpectedly.
    // The cleanup of the *previous* effect run is responsible for its own instance.
    if (pixiAppRef.current) {
        console.warn('[PixiSetup] pixiAppRef.current was not null at the start of a new setup. This might indicate an issue with the previous cleanup cycle. The new app will replace it, and the old app\'s cleanup should manage its destruction.');
        // We do not destroy pixiAppRef.current here; its own cleanup should handle it.
    }
    
    const containerElement = pixiContainerRef.current; // Capture for use in this effect

    const app = new PIXI.Application({
      resizeTo: containerElement,
      backgroundColor: 0x1a1b1e,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });
    
    // Append the Pixi view first
    if (app.view instanceof HTMLCanvasElement) {
      containerElement.appendChild(app.view);
    } else {
      console.error('[PixiSetup] Pixi app.view is not an HTMLCanvasElement! Aborting setup.');
      // If view is not a canvas, app creation might be problematic, destroy it and exit.
      app.destroy(true, { children: true, texture: true });
      return; // Do not assign to pixiAppRef.current
    }
    
    // Only assign to the ref *after* successful creation and appending of the view.
    pixiAppRef.current = app;
    const appInstanceForCleanup = app; // Capture the instance for this effect's cleanup closure

    // console.log(`[PixiSetup] New Pixi App created and assigned to ref:`, appInstanceForCleanup);

    return () => {
      // console.log(`[PixiSetup] Cleanup for app:`, appInstanceForCleanup, `Current ref:`, pixiAppRef.current);
      
      // Perform cleanup on the instance created by this specific effect run.
      if (appInstanceForCleanup) {
        if (appInstanceForCleanup.ticker) {
            appInstanceForCleanup.ticker.stop();
        }
        // Check .stage as an indicator it hasn't been fully destroyed yet by this specific instance's destroy method
        if (appInstanceForCleanup.stage) { 
          appInstanceForCleanup.destroy(true, { children: true, texture: true });
          // console.log(`[PixiSetup] Destroyed app:`, appInstanceForCleanup);
        } else {
          // console.warn('[PixiSetup] Cleanup: App instance or stage not valid for destruction, possibly already destroyed by its own call.', appInstanceForCleanup);
        }
      }

      // If pixiAppRef.current is still pointing to the instance this cleanup is for,
      // then nullify it. This prevents stale refs if the component unmounts.
      if (pixiAppRef.current === appInstanceForCleanup) {
        pixiAppRef.current = null;
        // console.log(`[PixiSetup] Nullified pixiAppRef.current for app:`, appInstanceForCleanup);
      }
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmountialization // Runs once on mount for initialization

  // Effect for drawing elements and handling pan/zoom on the PIXI stage
  useEffect(() => {
    if (!pixiAppRef.current || !elements) return;

    const app = pixiAppRef.current;
    app.stage.removeChildren(); // Clear stage before redrawing

    // Apply pan and zoom to the stage
    app.stage.x = pan.x;
    app.stage.y = pan.y;
    app.stage.scale.set(zoom, zoom);

    // Draw each element
    Object.values(elements).forEach(element => {
      drawPixiElement(element, app.stage);
    });

  }, [elements, pan, zoom]); // Re-run when elements, pan, or zoom change

  // Helper function to draw individual PIXI elements
  const drawPixiElement = (element: CanvasElement, stage: PIXI.Container) => {
    const graphics = new PIXI.Graphics();

    // Common properties
    const strokeColor = element.strokeColor ? new PIXI.Color(element.strokeColor).toNumber() : 0x000000;
    const fillColor = element.color ? new PIXI.Color(element.color).toNumber() : 0xFFFFFF;
    const strokeWidth = element.strokeWidth ?? 1;

    switch (element.type) {
      case 'rectangle':
        graphics.lineStyle(strokeWidth, strokeColor);
        graphics.beginFill(fillColor);
        graphics.drawRect(0, 0, element.width ?? 100, element.height ?? 100);
        graphics.endFill();
        break;
      case 'circle': // Example for circle
        graphics.lineStyle(strokeWidth, strokeColor);
        graphics.beginFill(fillColor);
        graphics.drawCircle(0, 0, (element.width ?? 100) / 2);
        graphics.endFill();
        // Position for circle should be its center if width/height represent diameter
        graphics.x = element.x + (element.width ?? 100) / 2;
        graphics.y = element.y + (element.height ?? 100) / 2;
        stage.addChild(graphics);
        return; // Return early as x,y for circle is handled differently
      case 'line':
      case 'drawing':
        if (element.points && element.points.length > 1) {
          graphics.lineStyle(strokeWidth, strokeColor);
          graphics.moveTo(element.points[0].x - element.x, element.points[0].y - element.y); // Relative to element's x,y
          for (let i = 1; i < element.points.length; i++) {
            graphics.lineTo(element.points[i].x - element.x, element.points[i].y - element.y);
          }
        }
        break;
      case 'text':
        const textStyle = new PIXI.TextStyle({
          fontFamily: 'Arial',
          fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 24 : 16,
          fill: fillColor,
          wordWrap: true,
          wordWrapWidth: element.width ?? 150,
          align: element.textAlignment || 'left',
          fontWeight: element.isBold ? 'bold' : 'normal',
          fontStyle: element.isItalic ? 'italic' : 'normal',
        });
        const pixiText = new PIXI.Text(element.content || '', textStyle);
        pixiText.x = element.x;
        pixiText.y = element.y;
        stage.addChild(pixiText);
        return; // PIXI.Text is added directly, not the graphics object
      // Add other cases for 'sticky-note', 'triangle', etc.
      default:
        // For unknown types, maybe draw a placeholder or log an error
        // console.warn(`Unsupported element type for PIXI rendering: ${element.type}`);
        graphics.lineStyle(1, 0xFF0000);
        graphics.beginFill(0xCCCCCC);
        graphics.drawRect(0, 0, element.width ?? 20, element.height ?? 20);
        graphics.endFill();
        break;
    }

    // Set position for graphics objects (except those handled above like circle, text)
    graphics.x = element.x;
    graphics.y = element.y;

    stage.addChild(graphics);
  };

  // Use viewport culling with container measurements
  const { visibleElements } = useViewportCulling({
    elements: elementsArray, // Use the memoized array
    canvasSize: canvasSize, // Use the state variable
    zoomLevel: zoom, 
    panOffset: pan, 
  });

  // Utility function to convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!pixiContainerRef.current) return { x: 0, y: 0 };
    const rect = pixiContainerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  // Utility to generate unique IDs
  const generateId = useCallback(() => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

  // Get text styles for elements
  const getTextStyles = useCallback((element: CanvasElement) => {
    return {
      fontSize: element.fontSize === 'small' ? '12px' :
                element.fontSize === 'large' ? '24px' : '16px',
      fontWeight: element.isBold ? 'bold' : 'normal',
      fontStyle: element.isItalic ? 'italic' : 'normal',
      textAlign: element.textAlignment || 'left',
      color: element.color || '#000000',
    };
  }, []);

  // Function to handle changes in the text editing area (local state for textarea)
  const handleTextChange = useCallback((_elementId: string, newText: string) => {
    setEditingTextValue(newText);
  }, []);

  // Placeholder for text formatting property changes from a toolbar
  const handleTextFormatPropertyChange = useCallback((property: string, value: any) => {
    const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useCanvasStore.getState();
    const targetId = currentEditingId || (currentSelectedIds.length > 0 ? currentSelectedIds[0] : null);
    if (targetId) {
      updateElement(targetId, { [property]: value });
      addToHistory(useCanvasStore.getState().elements); // Add current state to history after update
    }
  }, [updateElement, addToHistory]);

  // Handle mouse down on an element (passed to CanvasElementComponent)
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation(); // Prevent canvas click from firing
    const { elements: currentElements, selectedElementIds: currentSelectedIds, activeTool: currentActiveTool } = useCanvasStore.getState();
    const element = currentElements[elementId];

    if (!element) return;

    if (currentActiveTool === 'select') {
      const isSelected = currentSelectedIds.includes(elementId);
      if (e.shiftKey) {
        selectElement(elementId, !isSelected); // Toggle selection
      } else if (!isSelected) {
        selectElement(elementId, true); // Select only this element
      }

      // Prepare for dragging selected elements
      const startDragCoords = getCanvasCoordinates(e.clientX, e.clientY);
      initialElementPositions.current = {};
      const idsToDrag = useCanvasStore.getState().selectedElementIds; // Get current selection from store
      idsToDrag.forEach(id => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      // If the clicked element wasn't part of a multi-selection but is now selected, ensure it's in initialElementPositions
      if (idsToDrag.includes(elementId) && !initialElementPositions.current[elementId]) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      setDragState(true, startDragCoords, initialElementPositions.current);
    }
    // Potentially handle other tools if they interact with existing elements on mousedown
  }, [selectElement, getCanvasCoordinates, setDragState, updateElement]);

  // Handle mouse down events on the main canvas workspace
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentStoreState = useCanvasStore.getState();

    if (e.target !== canvasContainerRef.current && !(e.target instanceof HTMLCanvasElement) ){
      // Click was on a React UI element over the canvas, not the canvas itself or its direct container
      return;
    }

    // If select tool and clicked on empty canvas, clear selection and text edit state
    if (currentStoreState.activeTool === 'select') {
      clearSelection();
      if (currentStoreState.isEditingText) {
        // Commit text if editing
        if (textAreaRef.current && currentStoreState.isEditingText) {
          updateElement(currentStoreState.isEditingText, { content: editingTextValue });
          addToHistory(useCanvasStore.getState().elements);
        }
        setIsEditingText(null);
        setTextFormattingState(false);
      }
      // Initiate panning
      isPanning.current = true;
      const startPanCoords = { x: e.clientX, y: e.clientY };
      setDragState(true, startPanCoords, null); // dragStartElementPos is null for panning
      return;
    }

    // For drawing tools
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (['rectangle', 'text', 'sticky-note', 'line', 'pen'].includes(currentStoreState.activeTool)) {
      setIsDrawing(true); 
      setPreviewState(true, { 
        id: 'preview', // Preview element should have a temporary ID
        // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
        type: currentStoreState.activeTool === 'pen' ? 'drawing' : currentStoreState.activeTool as any, // Map 'pen' tool to 'drawing' element type
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        content: currentStoreState.activeTool === 'text' ? '' : '', // Start with empty text
        points: ['pen', 'line'].includes(currentStoreState.activeTool) ? [{ x: coords.x, y: coords.y }] : [],
        color: '#000000',
        backgroundColor: currentStoreState.activeTool === 'sticky-note' ? '#FFFFE0' : 'transparent',
        fontSize: 'medium',
        isBold: false,
        isItalic: false,
        textAlignment: 'left',
        strokeColor: ['rectangle', 'line', 'pen'].includes(currentStoreState.activeTool) ? '#000000' : undefined,
        strokeWidth: ['rectangle', 'line', 'pen'].includes(currentStoreState.activeTool) ? 2 : undefined,
        isLocked: false,
      });
      setDragState(true, coords, null); // For drawing, dragStartPos is the drawing start
    }
  }, [clearSelection, setIsEditingText, setTextFormattingState, getCanvasCoordinates, setIsDrawing, setPreviewState, setDragState, updateElement, editingTextValue, addToHistory]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const { isDragging: currentIsDragging, dragStartPos: currentDragStartPos, activeTool: currentActiveTool, zoom: currentZoom, pan: currentPan, elements: currentElements, selectedElementIds: currentSelectedIds, previewElement: currentPreviewElement, isDrawing: currentIsDrawing, dragStartElementPos: currentDragStartElementPos, isResizing: currentIsResizing, resizeStartPos: currentResizeStartPos, resizeStartSize: currentResizeStartSize, resizeHandle: currentResizeHandle } = useCanvasStore.getState();

    if (!currentIsDragging) return;

    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;

    if (isPanning.current && currentActiveTool === 'select') {
      const dx = currentMouseX - currentDragStartPos.x;
      const dy = currentMouseY - currentDragStartPos.y;
      setPan({ x: currentPan.x + dx, y: currentPan.y + dy });
      setDragState(true, { x: currentMouseX, y: currentMouseY }, null); // Update dragStartPos for continuous panning
    } else if (currentIsDrawing && currentPreviewElement) {
      const coords = getCanvasCoordinates(currentMouseX, currentMouseY);
      let newWidth = Math.abs(coords.x - currentDragStartPos.x);
      let newHeight = Math.abs(coords.y - currentDragStartPos.y);
      let newX = Math.min(coords.x, currentDragStartPos.x);
      let newY = Math.min(coords.y, currentDragStartPos.y);

      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
      if (currentPreviewElement.type === 'line' || currentPreviewElement.type === 'drawing') { // Check for 'drawing' type for pen tool
        const updatedPoints = [...(currentPreviewElement.points || []), coords];
        setPreviewState(true, { ...currentPreviewElement, points: updatedPoints, x: newX, y: newY, width: newWidth, height: newHeight });
      } else {
        setPreviewState(true, { ...currentPreviewElement, x: newX, y: newY, width: newWidth, height: newHeight });
      }
    } else if (currentActiveTool === 'select' && currentDragStartElementPos && currentSelectedIds.length > 0) {
      // Dragging elements
      const dx = (currentMouseX - currentDragStartPos.x) / currentZoom;
      const dy = (currentMouseY - currentDragStartPos.y) / currentZoom;

      currentSelectedIds.forEach(id => {
        const originalPos = currentDragStartElementPos[id];
        if (originalPos && currentElements[id]) {
          updateElement(id, { x: originalPos.x + dx, y: originalPos.y + dy });
        }
      });
    }
    // TODO: Implement resizing logic if currentIsResizing is true

  }, [getCanvasCoordinates, setPan, setDragState, setPreviewState, updateElement]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((_e: MouseEvent) => {
    const { isDrawing: currentIsDrawing, previewElement: currentPreviewElement, activeTool: currentActiveTool, selectedElementIds: currentSelectedIds, elements: currentElements, dragStartElementPos: currentDragStartElementPos } = useCanvasStore.getState();
    
    if (isPanning.current) {
      isPanning.current = false;
    }

    if (currentIsDrawing && currentPreviewElement) {
      const finalElement: CanvasElement = { ...currentPreviewElement, id: generateId() };
      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'points' property
      if (((finalElement.width ?? 0) > 0 || (finalElement.height ?? 0) > 0) || (finalElement.points && finalElement.points.length > 1) ) {
          addElement(finalElement);
          addToHistory({ ...currentElements, [finalElement.id]: finalElement });
      }
    }
    // If elements were dragged, save their final positions to history
    else if (currentActiveTool === 'select' && currentSelectedIds.length > 0 && currentDragStartElementPos) {
        // Check if positions actually changed to avoid redundant history entries
        let changed = false;
        for (const id of currentSelectedIds) {
            if (currentElements[id] && currentDragStartElementPos[id]) {
                if (currentElements[id].x !== currentDragStartElementPos[id].x || currentElements[id].y !== currentDragStartElementPos[id].y) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) {
            addToHistory(currentElements); 
        }
    }

    setIsDrawing(false);
    setPreviewState(false, null);
    setDragState(false, { x: 0, y: 0 }, null);
    setResizeState(false, null, {x:0, y:0}, {width:0, height:0});

  }, [generateId, addElement, addToHistory, setIsDrawing, setPreviewState, setDragState, setResizeState]);

  // Effect for global mouse listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, pan: currentPan } = useCanvasStore.getState();
    const scaleFactor = 1.1;
    const newZoom = e.deltaY < 0 ? currentZoom * scaleFactor : currentZoom / scaleFactor;
    
    if (pixiContainerRef.current) {
      const rect = pixiContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new pan to keep mouse position fixed relative to canvas content
      const newPanX = mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom);
      const newPanY = mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [setZoom, setPan]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Handle element deletion (e.g., from a delete button on the element itself)
  const handleDeleteElement = useCallback((elementId: string) => {
    deleteElement(elementId);
    addToHistory(useCanvasStore.getState().elements); // Add current state to history after delete
  }, [deleteElement, addToHistory]);

  // Direct element creation function
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    if (!canvasContainerRef.current) return;
    // const canvasRect = canvasContainerRef.current.getBoundingClientRect(); // Not strictly needed if positioning is relative to store state
    const { pan: currentPan, zoom: currentZoom, elements: currentElements } = useCanvasStore.getState();
    
    const defaultWidth = elementData.type === 'text' || elementData.type === 'sticky-note' ? 150 : 100;
    const defaultHeight = elementData.type === 'text' || elementData.type === 'sticky-note' ? 50 : 100;

    const newElement: CanvasElement = {
      id: generateId(),
      x: elementData.x ?? (100 - currentPan.x) / currentZoom, // Use provided x or default
      y: elementData.y ?? (100 - currentPan.y) / currentZoom, // Use provided y or default
      width: elementData.width ?? defaultWidth,
      height: elementData.height ?? defaultHeight,
      color: elementData.color ?? '#000000',
      backgroundColor: elementData.backgroundColor ?? (elementData.type === 'sticky-note' ? '#FFFFE0' : 'transparent'),
      fontSize: elementData.fontSize ?? 'medium',
      isBold: elementData.isBold ?? false,
      isItalic: elementData.isItalic ?? false,
      textAlignment: elementData.textAlignment ?? 'left',
      strokeColor: elementData.strokeColor ?? (['rectangle', 'line', 'drawing'].includes(elementData.type || '') ? '#000000' : undefined),
      strokeWidth: elementData.strokeWidth ?? (['rectangle', 'line', 'drawing'].includes(elementData.type || '') ? 2 : undefined),
      points: elementData.points ?? (elementData.type === 'line' || elementData.type === 'drawing' ? [] : undefined),
      isLocked: elementData.isLocked ?? false,
      type: elementData.type || 'rectangle', // Ensure type is always set
      content: elementData.content || (elementData.type === 'text' ? 'Text' : ''),
      ...elementData, // Spread last to allow overrides, but ensure core properties above have defaults
    };

    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    if (newElement.type === 'text') {
      setIsEditingText(newElement.id);
      // If new text element, set editingTextValue from its content or default if empty
      setEditingTextValue(newElement.content || ''); 
    }
  }, [generateId, addElement, addToHistory, setSelectedElementIds, setIsEditingText, setEditingTextValue]);

  // Wrapper for delete button click (toolbar)
  const handleDeleteButtonClick = useCallback(() => {
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = useCanvasStore.getState();
    if (currentSelectedIds.length > 0) {
      currentSelectedIds.forEach(id => deleteElement(id));
      addToHistory(useCanvasStore.getState().elements); // Add final state to history
      clearSelection();
    }
  }, [deleteElement, addToHistory, clearSelection]);

  // Handle keyboard events for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Prevent actions if typing in an input/textarea, unless it's our specific text editing area
      if ((activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') && activeEl !== textAreaRef.current) {
        return;
      }
      const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useCanvasStore.getState();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedIds.length > 0 && !currentEditingId) {
          e.preventDefault();
          handleDeleteButtonClick(); // Use the existing batch delete logic
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (currentEditingId) {
          // If editing text, commit changes before deselecting / clearing text edit state
          updateElement(currentEditingId, { content: editingTextValue });
          addToHistory(useCanvasStore.getState().elements);
          setIsEditingText(null);
          setTextFormattingState(false);
        }
        clearSelection();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        if (currentEditingId) {
          e.preventDefault();
          updateElement(currentEditingId, { content: editingTextValue });
          addToHistory(useCanvasStore.getState().elements);
          setIsEditingText(null);
          setTextFormattingState(false);
          // Optionally, select the element after committing text if it's not already
          // selectElement(currentEditingId, false); 
        }
      }
      // TODO: Add more shortcuts (undo/redo: Ctrl+Z/Y, zoom, tool selection)
      // if (e.ctrlKey || e.metaKey) {
      //   if (e.key === 'z') undo();
      //   if (e.key === 'y') redo();
      // }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingTextValue, handleDeleteButtonClick, clearSelection, setIsEditingText, setTextFormattingState, updateElement, addToHistory, textAreaRef]);

  return (
    <div className="canvas-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Direct creation toolbar - single click creates elements */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded transition-colors ${activeTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Select
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'text' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Text
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'sticky-note' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-yellow-100 transition-colors active:bg-yellow-200"
        >
          Add Note
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'rectangle' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'line' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Line
        </button>
        <button
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded transition-colors ${activeTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Pen
        </button>
        <button
          onClick={handleDeleteButtonClick}
          disabled={selectedElementIds.length === 0}
          className={`p-2 rounded flex items-center gap-1 transition-colors ${
            selectedElementIds.length > 0
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Delete selected element (Delete key)"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div 
        className="canvas-workspace" 
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        ref={canvasContainerRef}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Pixi.js Stage will be mounted here via useEffect */}
        
        {/* Grid overlay */}
        <CanvasGrid zoomLevel={zoom} panOffset={pan} />
        
        {/* DOM-based elements overlay (temporary until individual elements are converted to Pixi.js) */}
        <div className="canvas-elements" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {visibleElements.map((element) => (
            <div
              key={element.id}
              style={{
                pointerEvents: 'auto',
                willChange: selectedElementIds.includes(element.id) ? 'transform' : 'auto' // GPU acceleration for selected elements
              }}
            >
                <CanvasElementComponent
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onMouseDown={handleElementMouseDown}
                  onTextChange={handleTextChange}
                  onTextFormatting={(elemId, rect) => {
                    // This prop is likely for the component to signal it wants to show formatting options.
                    // We use it to activate and position our global text formatting toolbar.
                    const store = useCanvasStore.getState();
                    if (store.isEditingText === elemId || selectedElementIds.includes(elemId)) {
                      // Position relative to the element's rect in viewport coordinates
                      // The rect provided by component would be ideal. If not, calculate based on element.
                      const position = rect ? { left: rect.left, top: rect.top - 40 } : 
                                       { left: element.x * zoom + pan.x, top: (element.y - 30) * zoom + pan.y }; // Fallback position
                      setTextFormattingState(true, position);
                    } else {
                      setTextFormattingState(false);
                    }
                  }}
                  onTextFormatPropertyChange={handleTextFormatPropertyChange}
                  onDelete={handleDeleteElement}
                  getTextStyles={getTextStyles}
                />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;

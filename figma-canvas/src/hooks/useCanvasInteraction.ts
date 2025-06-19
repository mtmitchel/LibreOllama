import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useToolStore } from '../store/toolStore';
import { useHistoryStore } from '../store/historyStore';
import { Point, CanvasElement } from '../types/canvas';
import { ToolType } from '../types/tools';
import { hitTestMultiple, findSnapTargets } from '../utils/collision';
import { snapToGrid, snapToAngle } from '../utils/geometry';
import { debounce } from '../utils/performance';

export const useCanvasInteraction = () => {
  const {
    elements,
    selectedIds,
    viewport,
    settings,
    currentTool,
    mode,
    selectElement,
    selectElements,
    deselectAll,
    updateElement,
    addElement,
    deleteElements,
    setViewport,
    panViewport,
    zoomViewport,
    setDragging,
    setResizing,
    screenToCanvas,
    canvasToScreen
  } = useCanvasStore();

  const {
    drawingState,
    selectionState,
    connectorState,
    setTool,
    startDrawing,
    updateDrawing,
    endDrawing,
    startSelecting,
    updateSelectionBox,
    startDragging,
    endSelection
  } = useToolStore();

  const { saveState } = useHistoryStore();

  const lastPointerPosition = useRef<Point>({ x: 0, y: 0 });
  const dragStartPosition = useRef<Point>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isDrawing = useRef(false);

  // Debounced history save
  const debouncedSaveHistory = useCallback(
    debounce((description: string) => {
      saveState(elements, selectedIds, viewport, description);
    }, 1000),
    [saveState, elements, selectedIds, viewport]
  );

  // Handle pointer down events
  const handlePointerDown = useCallback((e: PointerEvent, canvasPoint: Point) => {
    lastPointerPosition.current = canvasPoint;
    dragStartPosition.current = canvasPoint;

    switch (currentTool) {
      case ToolType.SELECT:
        handleSelectPointerDown(e, canvasPoint);
        break;
      case ToolType.FREEFORM:
        handleDrawingStart(canvasPoint);
        break;
      case ToolType.TEXT:
      case ToolType.RECTANGLE:
      case ToolType.CIRCLE:
      case ToolType.TRIANGLE:
      case ToolType.STICKY_NOTE:
      case ToolType.TABLE:
        handleElementCreation(currentTool, canvasPoint);
        break;
      case ToolType.PAN:
        isDragging.current = true;
        break;
      case ToolType.CONNECTOR:
        handleConnectorStart(canvasPoint);
        break;
      default:
        break;
    }
  }, [currentTool]);

  // Handle pointer move events
  const handlePointerMove = useCallback((e: PointerEvent, canvasPoint: Point) => {
    const deltaX = canvasPoint.x - lastPointerPosition.current.x;
    const deltaY = canvasPoint.y - lastPointerPosition.current.y;

    if (isDragging.current && currentTool === ToolType.PAN) {
      panViewport(deltaX * viewport.zoom, deltaY * viewport.zoom);
    } else if (isDrawing.current) {
      updateDrawing(canvasPoint);
    } else if (selectionState.isSelecting) {
      updateSelectionBox(dragStartPosition.current, canvasPoint);
    } else if (selectionState.isDragging && selectedIds.length > 0) {
      handleElementDrag(deltaX, deltaY);
    }

    lastPointerPosition.current = canvasPoint;
  }, [currentTool, viewport, selectedIds, selectionState, panViewport, updateDrawing, updateSelectionBox]);

  // Handle pointer up events
  const handlePointerUp = useCallback((e: PointerEvent, canvasPoint: Point) => {
    isDragging.current = false;
    
    if (isDrawing.current) {
      endDrawing();
      isDrawing.current = false;
      debouncedSaveHistory('Drawing');
    }

    if (selectionState.isSelecting) {
      // Complete area selection
      const selectionBounds = {
        x: Math.min(dragStartPosition.current.x, canvasPoint.x),
        y: Math.min(dragStartPosition.current.y, canvasPoint.y),
        width: Math.abs(canvasPoint.x - dragStartPosition.current.x),
        height: Math.abs(canvasPoint.y - dragStartPosition.current.y)
      };

      const elementsInBounds = Object.values(elements).filter(element => {
        return (
          element.x < selectionBounds.x + selectionBounds.width &&
          element.x + element.width > selectionBounds.x &&
          element.y < selectionBounds.y + selectionBounds.height &&
          element.y + element.height > selectionBounds.y
        );
      });

      selectElements(elementsInBounds.map(el => el.id));
      endSelection();
    }

    if (selectionState.isDragging) {
      endSelection();
      debouncedSaveHistory('Move elements');
    }
  }, [elements, selectElements, endSelection, endDrawing, debouncedSaveHistory, selectionState]);

  // Handle select tool pointer down
  const handleSelectPointerDown = useCallback((e: PointerEvent, point: Point) => {
    const hitResults = hitTestMultiple(Object.values(elements), point);
    
    if (hitResults.length > 0) {
      const clickedElement = hitResults[0].element!;
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      
      if (isMultiSelect) {
        if (selectedIds.includes(clickedElement.id)) {
          // Remove from selection
          const newSelection = selectedIds.filter(id => id !== clickedElement.id);
          selectElements(newSelection);
        } else {
          // Add to selection
          selectElement(clickedElement.id, true);
        }
      } else {
        selectElement(clickedElement.id);
      }

      // Start dragging if element is selected
      if (selectedIds.includes(clickedElement.id) || !isMultiSelect) {
        const initialBounds: Record<string, { x: number; y: number; width: number; height: number }> = {};
        selectedIds.forEach(id => {
          const element = elements[id];
          if (element) {
            initialBounds[id] = {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height
            };
          }
        });
        startDragging({ x: 0, y: 0 }, initialBounds);
      }
    } else {
      // Clicked on empty space - start area selection
      deselectAll();
      startSelecting(point);
    }
  }, [elements, selectedIds, selectElement, selectElements, deselectAll, startSelecting, startDragging]);

  // Handle drawing start
  const handleDrawingStart = useCallback((point: Point) => {
    isDrawing.current = true;
    startDrawing(point);
  }, [startDrawing]);

  // Handle element creation
  const handleElementCreation = useCallback((toolType: ToolType, point: Point) => {
    const newElement = createElementFromTool(toolType, point);
    if (newElement) {
      addElement(newElement);
      selectElement(newElement.id);
      
      // Auto-switch to select tool if configured
      const toolConfig = useToolStore.getState().getToolConfig(toolType);
      if (toolConfig.autoSwitchToSelect) {
        setTool(ToolType.SELECT);
      }
      
      debouncedSaveHistory(`Add ${toolType.toLowerCase()}`);
    }
  }, [addElement, selectElement, setTool, debouncedSaveHistory]);

  // Handle connector start
  const handleConnectorStart = useCallback((point: Point) => {
    // Find element at point to start connector
    const hitResults = hitTestMultiple(Object.values(elements), point);
    const startElement = hitResults.length > 0 ? hitResults[0].element : undefined;
    
    // Start connector state
    // Implementation would go here
  }, [elements]);

  // Handle element dragging
  const handleElementDrag = useCallback((deltaX: number, deltaY: number) => {
    selectedIds.forEach(id => {
      const element = elements[id];
      if (element && !element.locked) {
        let newX = element.x + deltaX;
        let newY = element.y + deltaY;

        // Apply grid snapping if enabled
        if (settings.snapToGrid) {
          const snapped = snapToGrid({ x: newX, y: newY }, settings.gridSize);
          newX = snapped.x;
          newY = snapped.y;
        }

        // Apply element snapping
        const newBounds = { x: newX, y: newY, width: element.width, height: element.height };
        const snapResult = findSnapTargets(
          Object.values(elements).filter(el => el.id !== id),
          element,
          newBounds
        );

        if (snapResult.x !== undefined) newX = snapResult.x;
        if (snapResult.y !== undefined) newY = snapResult.y;

        updateElement(id, { x: newX, y: newY, modifiedAt: Date.now() });
      }
    });
  }, [selectedIds, elements, settings, updateElement]);

  // Zoom handling
  const handleWheel = useCallback((e: WheelEvent, center: Point) => {
    e.preventDefault();
    
    const scaleBy = 1.1;
    const scale = e.deltaY > 0 ? 1 / scaleBy : scaleBy;
    
    zoomViewport(scale, center);
  }, [zoomViewport]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for our shortcuts
    const isOurShortcut = [
      'Delete', 'Backspace', 'Escape',
      'v', 't', 'r', 'c', 'l', 'p', 's', 'h', 'z', 'i'
    ].includes(e.key.toLowerCase()) || e.ctrlKey || e.metaKey;

    if (isOurShortcut) {
      e.preventDefault();
    }

    // Handle tool shortcuts
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const toolShortcuts: Record<string, ToolType> = {
        'v': ToolType.SELECT,
        't': ToolType.TEXT,
        'r': ToolType.RECTANGLE,
        'c': ToolType.CIRCLE,
        'l': ToolType.LINE,
        'p': ToolType.FREEFORM,
        's': ToolType.STICKY_NOTE,
        'h': ToolType.PAN,
        'z': ToolType.ZOOM,
        'i': ToolType.IMAGE
      };

      const tool = toolShortcuts[e.key.toLowerCase()];
      if (tool) {
        setTool(tool);
        return;
      }
    }

    // Handle delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedIds.length > 0) {
        deleteElements(selectedIds);
        debouncedSaveHistory('Delete elements');
      }
      return;
    }

    // Handle escape
    if (e.key === 'Escape') {
      deselectAll();
      setTool(ToolType.SELECT);
      return;
    }

    // Handle copy/paste/cut
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'c':
          // Copy functionality would be implemented here
          break;
        case 'v':
          // Paste functionality would be implemented here
          break;
        case 'x':
          // Cut functionality would be implemented here
          break;
        case 'z':
          if (e.shiftKey) {
            // Redo
            const { redo, canRedo } = useHistoryStore.getState();
            if (canRedo()) redo();
          } else {
            // Undo
            const { undo, canUndo } = useHistoryStore.getState();
            if (canUndo()) undo();
          }
          break;
        case 'a':
          // Select all
          selectElements(Object.keys(elements));
          break;
      }
    }
  }, [selectedIds, deleteElements, deselectAll, setTool, selectElements, elements, debouncedSaveHistory]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleKeyDown
  };
};

// Helper function to create elements from tools
const createElementFromTool = (toolType: ToolType, point: Point): CanvasElement | null => {
  const baseElement = {
    id: crypto.randomUUID(),
    x: point.x,
    y: point.y,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: Date.now(), // Simple z-index based on creation time
    style: {},
    createdAt: Date.now(),
    modifiedAt: Date.now()
  };

  switch (toolType) {
    case ToolType.TEXT:
      return {
        ...baseElement,
        type: 'TEXT' as any,
        width: 200,
        height: 24,
        data: {
          content: [{ type: 'paragraph', children: [{ text: 'Type here...' }] }],
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          textDecoration: 'none',
          lineHeight: 1.2,
          letterSpacing: 0,
          color: '#000000',
          backgroundColor: 'transparent',
          padding: 0,
          autoSize: true
        }
      };

    case ToolType.RECTANGLE:
      return {
        ...baseElement,
        type: 'RECTANGLE' as any,
        width: 100,
        height: 100,
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2
        },
        data: {
          shapeType: 'rectangle'
        }
      };

    case ToolType.CIRCLE:
      return {
        ...baseElement,
        type: 'CIRCLE' as any,
        width: 100,
        height: 100,
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2
        },
        data: {
          shapeType: 'circle'
        }
      };

    case ToolType.TRIANGLE:
      return {
        ...baseElement,
        type: 'TRIANGLE' as any,
        width: 100,
        height: 100,
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2
        },
        data: {
          shapeType: 'triangle'
        }
      };

    case ToolType.STICKY_NOTE:
      return {
        ...baseElement,
        type: 'STICKY_NOTE' as any,
        width: 150,
        height: 150,
        data: {
          content: [{ type: 'paragraph', children: [{ text: 'Type here...' }] }],
          color: '#ffeb3b',
          fontSize: 14,
          fontFamily: 'Inter'
        }
      };

    case ToolType.TABLE:
      return {
        ...baseElement,
        type: 'TABLE' as any,
        width: 300,
        height: 200,
        data: {
          rows: 3,
          cols: 3,
          cellData: [],
          columnWidths: [100, 100, 100],
          rowHeights: [40, 40, 40],
          borderWidth: 1,
          borderColor: '#cccccc',
          backgroundColor: '#ffffff'
        }
      };

    default:
      return null;
  }
};

export default useCanvasInteraction;

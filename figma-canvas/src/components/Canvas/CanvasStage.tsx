import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import Konva from 'konva';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '../../store/canvasStore';
import { useToolStore } from '../../store/toolStore';
import { useHistoryStore } from '../../store/historyStore';
import { ElementRenderer } from './ElementRenderer';
import { SelectionBox } from './SelectionBox';
import { GridLayer } from './GridLayer';
import { ConnectionPointLayer } from './ConnectionPointLayer';
import { GuideLayer } from './GuideLayer';
import { Point, CanvasElement, CanvasMode } from '../../types/canvas';
import { ToolType } from '../../types/tools';
import { hitTestMultiple, SpatialGrid, findSnapTargets } from '../../utils/collision';
import { snapToGrid, snapToAngle } from '../../utils/geometry';
import { debounce, scheduler, ViewportVirtualizer } from '../../utils/performance';
import { v4 as uuidv4 } from 'uuid';

interface CanvasStageProps {
  width: number;
  height: number;
  className?: string;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  width,
  height,
  className
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const spatialGridRef = useRef<SpatialGrid>(new SpatialGrid(100));
  const virtualizerRef = useRef<ViewportVirtualizer>(new ViewportVirtualizer(200));
  const lastPointerPositionRef = useRef<Point>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isDrawingRef = useRef(false);

  // Store hooks
  const {
    elements,
    selectedIds,
    viewport,
    settings,
    currentTool,
    mode,
    selectionBox,
    isDragging,
    isResizing,
    addElement,
    updateElement,
    selectElement,
    selectElements,
    deselectAll,
    setViewport,
    panViewport,
    zoomViewport,
    setSelectionBox,
    clearSelectionBox,
    setDragging,
    screenToCanvas,
    canvasToScreen,
    getElementsInBounds
  } = useCanvasStore();

  const {
    drawingState,
    textEditingState,
    connectorState,
    selectionState,
    startDrawing,
    updateDrawing,
    endDrawing,
    startSelecting,
    updateSelectionBox,
    startDragging,
    endSelection,
    setTool
  } = useToolStore();

  const { saveState } = useHistoryStore();

  // Convert elements object to array and sort by z-index
  const sortedElements = useMemo(() => {
    return Object.values(elements).sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  // Update spatial grid when elements change
  useEffect(() => {
    const grid = spatialGridRef.current;
    grid.clear();
    
    Object.values(elements).forEach(element => {
      grid.addElement(element);
    });
  }, [elements]);

  // Update virtualizer when viewport or elements change
  useEffect(() => {
    const virtualizer = virtualizerRef.current;
    virtualizer.setViewport({
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: width / viewport.zoom,
      height: height / viewport.zoom
    });
    virtualizer.setElements(sortedElements);
  }, [viewport, sortedElements, width, height]);

  // Get visible elements for rendering
  const visibleElements = useMemo(() => {
    return virtualizerRef.current.getVisibleElements();
  }, [viewport, sortedElements]);

  // Debounced history save
  const debouncedSaveHistory = useMemo(() => 
    debounce((description: string) => {
      saveState(elements, selectedIds, viewport, description);
    }, 1000),
    [saveState, elements, selectedIds, viewport]
  );

  // Stage event handlers
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const canvasPoint = screenToCanvas(pointerPosition);
    lastPointerPositionRef.current = canvasPoint;

    // Handle different tools
    switch (currentTool) {
      case ToolType.SELECT:
        handleSelectTool(e, canvasPoint);
        break;
      case ToolType.FREEFORM:
        handleDrawingStart(canvasPoint);
        break;
      case ToolType.TEXT:
        handleTextTool(canvasPoint);
        break;
      case ToolType.RECTANGLE:
      case ToolType.CIRCLE:
      case ToolType.TRIANGLE:
        handleShapeTool(canvasPoint);
        break;
      case ToolType.PAN:
        isDraggingRef.current = true;
        break;
      default:
        break;
    }
  }, [currentTool, screenToCanvas]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const canvasPoint = screenToCanvas(pointerPosition);
    const deltaX = canvasPoint.x - lastPointerPositionRef.current.x;
    const deltaY = canvasPoint.y - lastPointerPositionRef.current.y;

    // Handle different interaction states
    if (isDraggingRef.current && currentTool === ToolType.PAN) {
      panViewport(deltaX * viewport.zoom, deltaY * viewport.zoom);
    } else if (isDrawingRef.current) {
      updateDrawing(canvasPoint);
    } else if (selectionState.isSelecting) {
      updateSelectionBox(lastPointerPositionRef.current, canvasPoint);
      setSelectionBox({
        x: Math.min(lastPointerPositionRef.current.x, canvasPoint.x),
        y: Math.min(lastPointerPositionRef.current.y, canvasPoint.y),
        width: Math.abs(canvasPoint.x - lastPointerPositionRef.current.x),
        height: Math.abs(canvasPoint.y - lastPointerPositionRef.current.y),
        visible: true
      });
    } else if (selectionState.isDragging) {
      handleElementDrag(deltaX, deltaY);
    }

    lastPointerPositionRef.current = canvasPoint;
  }, [
    screenToCanvas,
    viewport,
    currentTool,
    panViewport,
    updateDrawing,
    selectionState,
    updateSelectionBox,
    setSelectionBox
  ]);

  const handleStageMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    
    if (isDrawingRef.current) {
      endDrawing();
      isDrawingRef.current = false;
    }
    
    if (selectionState.isSelecting) {
      // Select elements in selection box
      const boxBounds = {
        x: selectionBox.x,
        y: selectionBox.y,
        width: selectionBox.width,
        height: selectionBox.height
      };
      
      const elementsInBox = getElementsInBounds(boxBounds);
      selectElements(elementsInBox.map(el => el.id));
      clearSelectionBox();
      endSelection();
    }
    
    if (selectionState.isDragging) {
      endSelection();
      debouncedSaveHistory('Move elements');
    }
  }, [
    endDrawing,
    selectionState,
    selectionBox,
    getElementsInBounds,
    selectElements,
    clearSelectionBox,
    endSelection,
    debouncedSaveHistory
  ]);

  // Tool-specific handlers
  const handleSelectTool = useCallback((e: Konva.KonvaEventObject<MouseEvent>, point: Point) => {
    const clickedElement = e.target;
    
    if (clickedElement === e.target.getStage()) {
      // Clicked on empty space - start selection box
      deselectAll();
      startSelecting(point);
    } else {
      // Clicked on an element
      const elementId = clickedElement.id();
      if (elementId && elements[elementId]) {
        const addToSelection = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        selectElement(elementId, addToSelection);
        
        // Start dragging if element is selected
        if (selectedIds.includes(elementId) || addToSelection) {
          const selectedElements = selectedIds.map(id => elements[id]).filter(Boolean);
          const initialBounds: Record<string, { x: number; y: number; width: number; height: number }> = {};
          
          selectedElements.forEach(element => {
            initialBounds[element.id] = {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height
            };
          });
          
          startDragging({ x: 0, y: 0 }, initialBounds);
        }
      }
    }
  }, [elements, selectedIds, deselectAll, startSelecting, selectElement, startDragging]);

  const handleDrawingStart = useCallback((point: Point) => {
    isDrawingRef.current = true;
    startDrawing(point);
  }, [startDrawing]);

  const handleTextTool = useCallback((point: Point) => {
    // Create new text element
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: 'TEXT' as any,
      x: point.x,
      y: point.y,
      width: 200,
      height: 24,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Math.max(...Object.values(elements).map(el => el.zIndex), 0) + 1,
      style: {},
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
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    
    addElement(newElement);
    selectElement(newElement.id);
    
    // Auto-switch to select tool
    setTool(ToolType.SELECT);
    debouncedSaveHistory('Add text');
  }, [elements, addElement, selectElement, setTool, debouncedSaveHistory]);

  const handleShapeTool = useCallback((point: Point) => {
    // This would create shape elements based on the current tool
    // For now, we'll create a basic rectangle
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: currentTool === ToolType.CIRCLE ? 'CIRCLE' as any : 'RECTANGLE' as any,
      x: point.x,
      y: point.y,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Math.max(...Object.values(elements).map(el => el.zIndex), 0) + 1,
      style: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
      },
      data: {
        shapeType: currentTool === ToolType.CIRCLE ? 'circle' : 'rectangle'
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    
    addElement(newElement);
    selectElement(newElement.id);
    
    // Auto-switch to select tool
    setTool(ToolType.SELECT);
    debouncedSaveHistory(`Add ${currentTool.toLowerCase()}`);
  }, [currentTool, elements, addElement, selectElement, setTool, debouncedSaveHistory]);

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
        
        updateElement(id, { x: newX, y: newY, modifiedAt: Date.now() });
      }
    });
  }, [selectedIds, elements, settings, updateElement]);

  // Gesture handlers for pan and zoom
  const bind = useGesture({
    onWheel: ({ event, delta }) => {
      event.preventDefault();
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      
      const scaleBy = 1.1;
      const scale = delta[1] > 0 ? 1 / scaleBy : scaleBy;
      
      zoomViewport(scale, pointer);
    },
    onPinch: ({ origin, first, movement: [scale] }) => {
      if (first) return;
      
      const newScale = Math.max(0.1, Math.min(10, viewport.zoom * scale));
      setViewport({ zoom: newScale });
    }
  }, {
    eventOptions: { passive: false }
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle keyboard shortcuts
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          selectedIds.forEach(id => {
            const element = elements[id];
            if (element && !element.locked) {
              // Delete element logic would go here
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements]);

  return (
    <div className={className} {...bind()}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={(e) => {
          const touch = e.evt.touches[0];
          const mouseEvent = {
            ...e,
            evt: {
              ...touch,
              button: 0,
              buttons: 1,
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: e.evt.preventDefault.bind(e.evt)
            } as unknown as MouseEvent
          };
          handleStageMouseDown(mouseEvent as any);
        }}
        onTouchMove={(e) => {
          const touch = e.evt.touches[0];
          const mouseEvent = {
            ...e,
            evt: {
              ...touch,
              button: 0,
              buttons: 1,
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: e.evt.preventDefault.bind(e.evt)
            } as unknown as MouseEvent
          };
          handleStageMouseMove(mouseEvent as any);
        }}
        onTouchEnd={(e) => {
          const mouseEvent = {
            ...e,
            evt: {
              button: 0,
              buttons: 0,
              clientX: 0,
              clientY: 0,
              preventDefault: e.evt.preventDefault.bind(e.evt)
            } as unknown as MouseEvent
          };
          handleStageMouseUp();
        }}
        draggable={false}
      >
        {/* Grid Layer */}
        {settings.showGrid && (
          <Layer>
            <GridLayer
              gridSize={settings.gridSize}
              viewport={{
                x: -viewport.x / viewport.zoom,
                y: -viewport.y / viewport.zoom,
                width: width / viewport.zoom,
                height: height / viewport.zoom
              }}
            />
          </Layer>
        )}
        
        {/* Main Elements Layer */}
        <Layer>
          <Group>
            {visibleElements.map(element => (
              <ElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedIds.includes(element.id)}
                isHovered={false}
              />
            ))}
          </Group>
        </Layer>
        
        {/* Selection Layer */}
        <Layer>
          {selectionBox.visible && (
            <SelectionBox
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
            />
          )}
        </Layer>
        
        {/* Connection Points Layer */}
        {(currentTool === ToolType.CONNECTOR || connectorState.isConnecting) && (
          <Layer>
            <ConnectionPointLayer
              elements={visibleElements}
              selectedIds={selectedIds}
              hoveredIds={[connectorState.hoveredConnectionPoint].filter(Boolean)}
              visible={true}
            />
          </Layer>
        )}
        
        {/* Guides Layer */}
        <Layer>
          <GuideLayer />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasStage;

import React, { useRef, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import type { CanvasElement } from '../types';
import '../../../styles/konvaCanvas.css';

// Local interfaces
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef: externalStageRef,
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  // Internal stage ref to avoid React strict mode issues
  const internalStageRef = useRef<Konva.Stage | null>(null);
    // Sync internal ref with external ref
  useEffect(() => {
    if (externalStageRef && internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }  }, [externalStageRef]);  // Store subscriptions using enhanced store (single source of truth)
  const { 
    updateElement, 
    addElement, 
    elements, 
    updateMultipleElements,
    clearSelection, 
    selectElement,
    setEditingTextId,
    selectedTool,
    setSelectedTool,
    isDrawing, 
    currentPath, 
    startDrawing,    updateDrawing, 
    finishDrawing,
    // Section and enhanced operations
    handleElementDrop, 
    captureElementsAfterSectionCreation,
    sections,
    createSection,
    captureElementsInSection,
    handleSectionDragEnd,
    resizeSection,
    findSectionAtPoint
  } = useEnhancedStore();
  
  // Connector drawing state
  const [isDrawingConnector, setIsDrawingConnector] = React.useState(false);
  const [connectorStart, setConnectorStart] = React.useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = React.useState<{ x: number; y: number; elementId?: string; anchor?: string } | null>(null);

  // Section drawing state
  const [isDrawingSection, setIsDrawingSection] = React.useState(false);
  const [sectionStart, setSectionStart] = React.useState<{ x: number; y: number } | null>(null);
  const [previewSection, setPreviewSection] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Canvas click handler
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt?.detail > 1) return;

    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      clearSelection();
    }  }, [clearSelection]);
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    // Prevent event bubbling to stage
    e.cancelBubble = true;
    
    // Select the element in the store
    selectElement(element.id);
    
    if (onElementSelect) {
      onElementSelect(element);
    }
  }, [onElementSelect, selectElement]);

  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    const allElementsMap = { ...elements, ...sections };
    const element = allElementsMap[elementId];
    if (!element) return;

    // Get the absolute position directly from the Konva node.
    // This is more reliable than manual calculation, especially when leaving sections.
    let newPos = node.absolutePosition();

    // Now normalize for shape-specific positioning differences
    if (element.type === 'circle') {
      const radius = element.radius || 50;
      // Circles use center positioning in Konva, convert to top-left corner
      newPos = {
        x: newPos.x - radius,
        y: newPos.y - radius
      };
    } else if (element.type === 'star') {
      const radius = element.radius || (element.width || 100) / 2;
      // Stars use center positioning in Konva, convert to top-left corner
      newPos = {
        x: newPos.x - radius,
        y: newPos.y - radius
      };
    }
    // All other element types use Group containers with top-left corner positioning

    if (element.type === 'section') {
      // Section drag handling
      const result = handleSectionDragEnd(elementId, newPos.x, newPos.y);
      console.log('📦 [KONVA CANVAS] Section moved:', {
        sectionId: elementId,
        newPosition: newPos,
        containedElements: result?.containedElementIds?.length || 0
      });
    } else {
      // Regular element drag - pass normalized absolute position to handleElementDrop
      console.log('🎯 [KONVA CANVAS] Calling handleElementDrop with normalized position:', {
        elementId,
        elementType: element.type,
        normalizedAbsolutePosition: newPos,
        currentSectionId: 'sectionId' in element ? element.sectionId : 'N/A (section)' 
      });
      handleElementDrop(elementId, newPos); 
    }
  }, [elements, sections, handleSectionDragEnd, handleElementDrop]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    updateElement(id, updates);
  }, [updateElement]);
  const handleStartTextEdit = useCallback((elementId: string) => {
    setEditingTextId(elementId);
  }, [setEditingTextId]);
  // Drawing event handlers
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    console.log('🖱️ [MOUSE DOWN] Tool:', selectedTool, 'Position:', pos);

    if (selectedTool === 'pen' || selectedTool === 'pencil') {
      console.log('🖊️ [KONVA CANVAS] Starting drawing at:', pos);
      console.log('🖊️ [KONVA CANVAS] Selected tool:', selectedTool);
      startDrawing(pos.x, pos.y, selectedTool as 'pen' | 'pencil');
    } else if (selectedTool === 'connector-line' || selectedTool === 'connector-arrow') {
      console.log('🔗 [CONNECTOR] Connector tool detected!', selectedTool);
      console.log('🔗 [CONNECTOR] Current drawing state:', isDrawingConnector);
      console.log('🔗 [CONNECTOR] Current start point:', connectorStart);
      
      // Handle connector creation
      if (!isDrawingConnector) {
        // Start connector
        setIsDrawingConnector(true);
        setConnectorStart({ x: pos.x, y: pos.y });
        console.log('🔗 [CONNECTOR] Starting connector at:', pos);
      } else {
        // Finish connector
        setConnectorEnd({ x: pos.x, y: pos.y });
        console.log('🔗 [CONNECTOR] Finishing connector at:', pos);
        
        if (connectorStart) {
          // Create connector element with proper structure for ConnectorRenderer
          const connectorElement: CanvasElement = {
            id: `connector-${Date.now()}`,
            type: 'connector' as const,
            subType: selectedTool === 'connector-arrow' ? 'arrow' : 'line',
            x: 0, // Connectors use startPoint/endPoint for positioning
            y: 0,
            startPoint: {
              x: connectorStart.x,
              y: connectorStart.y,
              connectedElementId: connectorStart.elementId,
              anchorPoint: connectorStart.anchor as any
            },
            endPoint: {
              x: pos.x,
              y: pos.y,
              connectedElementId: undefined, // TODO: Implement element snapping
              anchorPoint: undefined
            },
            connectorStyle: {
              strokeColor: '#000000',
              strokeWidth: 2,
              strokeDashArray: undefined,
              hasStartArrow: false,
              hasEndArrow: selectedTool === 'connector-arrow',
              arrowSize: 10
            },
            // Legacy properties for backward compatibility
            points: [connectorStart.x, connectorStart.y, pos.x, pos.y],
            stroke: '#000000',
            strokeWidth: 2,
            fill: ''
          };
          
          // Add the connector using the store
          addElement(connectorElement);
          console.log('✅ [CONNECTOR] Created connector element:', connectorElement.id);
          
          // Automatically switch to select tool after connector creation
          setSelectedTool('select');
          console.log('🔧 [CONNECTOR] Automatically switched to select tool after connector creation');
        }
          // Reset connector state
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
      }    } else if (selectedTool === 'section') {
      console.log('📦 [SECTION] Section tool detected!');
      console.log('📦 [SECTION] Current drawing state:', isDrawingSection);
      
      // Handle section creation
      if (!isDrawingSection) {
        // Start section drawing
        setIsDrawingSection(true);
        setSectionStart({ x: pos.x, y: pos.y });
        setPreviewSection({ x: pos.x, y: pos.y, width: 0, height: 0 });
        console.log('📦 [SECTION] Starting section at:', pos);
      }
      // Section completion moved to mouse up handler
    } else if (selectedTool === 'text') {
      const stage = internalStageRef.current;
      if (!stage) return;

      const layer = stage.findOne('.main-layer') as Konva.Layer;
      if (!layer) {
        console.error("Could not find main layer for imperative creation.");
        return;
      }

      const newElement: CanvasElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: 'New Text',
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        width: 200,
        height: 30,
      };

      const newNode = new Konva.Text({
        id: newElement.id,
        x: newElement.x,
        y: newElement.y,
        text: newElement.text || 'Text', // Ensure text is always a string
        fontSize: newElement.fontSize || 24,
        fontFamily: newElement.fontFamily || 'Arial',
        fill: newElement.fill || '#000000',
        width: newElement.width || 200,
        height: newElement.height || 30,
        draggable: true,
      });

      layer.add(newNode);
      
      // Update the store AFTER the node is on the canvas
      addElement(newElement);
      selectElement(newElement.id);
    }
  }, [selectedTool, startDrawing, isDrawingConnector, connectorStart, addElement, createSection, findSectionAtPoint, selectElement, setSelectedTool]);

  const handleStageMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawing) {
      finishDrawing();
    } else if (isDrawingSection && sectionStart && previewSection) {
      // Finalize section creation
      if (previewSection.width > 10 && previewSection.height > 10) {
        const sectionId = createSection(
          previewSection.x,
          previewSection.y,
          previewSection.width,
          previewSection.height,
          'Untitled Section'        );
        
        // Use enhanced store method to capture elements in the new section
        captureElementsAfterSectionCreation(sectionId);
        
        // Automatically switch to select tool after section creation
        setSelectedTool('select');
        console.log('🔧 [SECTION] Automatically switched to select tool after section creation');
      }
      // Reset section drawing state
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
    }
  }, [isDrawing, finishDrawing, isDrawingSection, sectionStart, previewSection, createSection, captureElementsInSection, elements, updateMultipleElements, setSelectedTool]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (isDrawing && (selectedTool === 'pen' || selectedTool === 'pencil')) {
      console.log('🖊️ [KONVA CANVAS] Adding point to drawing:', pos);
      updateDrawing(pos.x, pos.y);
    } else if (isDrawingSection && sectionStart) {
      // Update section preview
      setPreviewSection({
        x: Math.min(sectionStart.x, pos.x),
        y: Math.min(sectionStart.y, pos.y),
        width: Math.abs(pos.x - sectionStart.x),
        height: Math.abs(pos.y - sectionStart.y)
      });
    }
  }, [isDrawing, selectedTool, updateDrawing, isDrawingSection, sectionStart]);

  // **CHANGE 3**: Handle section resize with proportional scaling of contained elements
  const handleSectionResize = useCallback((sectionId: string, newWidth: number, newHeight: number) => {
    const section = sections[sectionId];
    if (!section) return;

    const oldWidth = section.width;
    const oldHeight = section.height;
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    const result = resizeSection(sectionId, newWidth, newHeight);
    
    // Scale all contained elements proportionally based on their EXISTING relative coordinates
    if (result && result.containedElementIds.length > 0) {
      const updates: Record<string, Partial<CanvasElement>> = {};
      
      result.containedElementIds.forEach((containedId: string) => {
        const containedElement = elements[containedId];
        if (containedElement) {
          // Use the element's existing relative coordinates within the section
          // Scale both position and size proportionally
          updates[containedId] = {
            x: containedElement.x * scaleX, // Scale relative X position
            y: containedElement.y * scaleY, // Scale relative Y position
            width: (containedElement.width || 100) * scaleX,
            height: (containedElement.height || 100) * scaleY
          };
        }
      });
      
      if (Object.keys(updates).length > 0) {
        updateMultipleElements(updates);
        console.log('✅ [KONVA CANVAS] Proportionally scaled', Object.keys(updates).length, 'contained elements:', {
          sectionId,
          scale: { x: scaleX, y: scaleY },
          elementsUpdated: Object.keys(updates)
        });
      }
    }
  }, [resizeSection, sections, elements, updateMultipleElements]);
  return (
    <div
      style={{ width, height, position: 'relative' }}
    >
      <Stage
        ref={internalStageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={onWheelHandler}
        {...(onTouchMoveHandler && { onTouchMove: onTouchMoveHandler })}
        {...(onTouchEndHandler && { onTouchEnd: onTouchEndHandler })}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
      >        <CanvasLayerManager
          stageWidth={width}
          stageHeight={height}
          stageRef={internalStageRef}
          onElementUpdate={handleElementUpdate}
          onElementDragEnd={handleElementDragEnd}
          onElementClick={handleElementClick}
          onStartTextEdit={handleStartTextEdit}
          isDrawing={isDrawing}
          currentPath={currentPath}
          isDrawingConnector={isDrawingConnector}
          connectorStart={connectorStart}
          connectorEnd={connectorEnd}          isDrawingSection={isDrawingSection}
          previewSection={previewSection}
          onSectionResize={handleSectionResize}
        />
      </Stage>
    </div>
  );
};

export default KonvaCanvas;

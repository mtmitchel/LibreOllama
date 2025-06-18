import React, { useRef, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useCanvasElements, useSelection, useTextEditing, useDrawing, useCanvasUI, useSections, useEnhancedStore } from '../stores/canvasStore';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import type { CanvasElement } from '../types';
import '../../../styles/konvaCanvas.css';
import { designSystem } from '../../../styles/designSystem';

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
    }
  }, [externalStageRef]);
  // Store subscriptions using modular store hooks
  const { updateElement, addElement, elements, updateMultipleElements } = useCanvasElements();
  const { clearSelection, selectElement } = useSelection();
  const { setEditingTextId } = useTextEditing();
  const { selectedTool } = useCanvasUI();
  const { isDrawing, currentPath, startDrawing, updateDrawing, finishDrawing } = useDrawing();  // Section operations from modular section store
  const {
    sections,
    createSection,
    captureElementsInSection,
    handleSectionDragEnd,
    resizeSection
  } = useSections();
  
  // Enhanced cross-slice operations
  const { handleElementDrop } = useEnhancedStore();
  
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
  }, [onElementSelect, selectElement]);  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    const allElementsMap = { ...elements, ...sections };
    const element = allElementsMap[elementId];
    if (!element) return;

    const newPos = { x: node.x(), y: node.y() };

    if (element.type === 'section') {
      // Section drag - use proper store method that maintains relative coordinates
      const result = handleSectionDragEnd(elementId, newPos.x, newPos.y);
      
      // If section moved, update all contained elements
      if (result && result.containedElementIds.length > 0) {
        const updates: Record<string, Partial<CanvasElement>> = {};
        result.containedElementIds.forEach((containedId: string) => {
          const containedElement = elements[containedId];
          if (containedElement) {
            updates[containedId] = {
              x: containedElement.x + result.deltaX,
              y: containedElement.y + result.deltaY
            };
          }
        });
        
        if (Object.keys(updates).length > 0) {
          updateMultipleElements(updates);
          console.log('✅ [KONVA CANVAS] Updated', Object.keys(updates).length, 'contained elements after section move');
        }
      }
    } else {
      // Regular element drag - use enhanced store's handleElementDrop for proper coordinate handling
      console.log('🎯 [KONVA CANVAS] Element drag end, calling handleElementDrop:', {
        elementId,
        position: newPos,
        absolutePosition: node.absolutePosition()
      });
      
      // Use the enhanced store's handleElementDrop which properly handles coordinate transformations
      handleElementDrop(elementId, node.absolutePosition());
    }
  }, [elements, sections, updateMultipleElements, handleSectionDragEnd, handleElementDrop]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    updateElement(id, updates);
  }, [updateElement]);
  const handleStartTextEdit = useCallback((elementId: string) => {
    setEditingTextId(elementId);
  }, [setEditingTextId]);
  // Drawing event handlers
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;    if (selectedTool === 'pen' || selectedTool === 'pencil') {
      console.log('🖊️ [KONVA CANVAS] Starting drawing at:', pos);
      console.log('🖊️ [KONVA CANVAS] Selected tool:', selectedTool);
      startDrawing(pos.x, pos.y, selectedTool as 'pen' | 'pencil');
    } else if (selectedTool === 'connector-line' || selectedTool === 'connector-arrow') {
      // Handle connector creation
      if (!isDrawingConnector) {
        // Start connector
        setIsDrawingConnector(true);
        setConnectorStart({ x: pos.x, y: pos.y });
        console.log('� [CONNECTOR] Starting connector at:', pos);
      } else {
        // Finish connector
        setConnectorEnd({ x: pos.x, y: pos.y });
        console.log('🔗 [CONNECTOR] Finishing connector at:', pos);
        
        if (connectorStart) {
          // Create connector element
          const connectorElement = {
            id: `connector-${Date.now()}`,
            type: 'connector' as const,
            x: connectorStart.x,
            y: connectorStart.y,
            points: [connectorStart.x, connectorStart.y, pos.x, pos.y],
            stroke: '#000000',
            strokeWidth: 2,
            fill: '',
            connectorType: selectedTool === 'connector-arrow' ? 'arrow' : 'line'
          };
            // Add the connector using the store
          addElement(connectorElement);
          console.log('✅ [CONNECTOR] Created connector element:', connectorElement.id);
        }
          // Reset connector state
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
      }    } else if (selectedTool === 'section') {
      // Handle section creation
      if (!isDrawingSection) {
        // Start section drawing
        setIsDrawingSection(true);
        setSectionStart({ x: pos.x, y: pos.y });
        setPreviewSection({ x: pos.x, y: pos.y, width: 0, height: 0 });
        console.log('📦 [SECTION] Starting section at:', pos);
      }
      // Section completion moved to mouse up handler
    }  }, [selectedTool, startDrawing, isDrawingConnector, connectorStart, addElement, createSection]);
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
          'Untitled Section'
        );
        
        // Capture existing elements within the section bounds
        const capturedElementIds = captureElementsInSection(sectionId, elements);
        
        // Convert captured elements to section-relative coordinates and assign sectionId
        if (capturedElementIds.length > 0) {
          const elementUpdates: Record<string, Partial<CanvasElement>> = {};
          capturedElementIds.forEach(elementId => {
            const element = elements[elementId];
            if (element) {
              elementUpdates[elementId] = {
                sectionId: sectionId,
                x: element.x - previewSection.x, // Convert to section-relative coordinates
                y: element.y - previewSection.y
              };
            }
          });
          
          // Update all captured elements
          updateMultipleElements(elementUpdates);
          console.log('✅ [KONVA CANVAS] Updated', capturedElementIds.length, 'captured elements with section assignment');
        }
      }
      // Reset section drawing state
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
    }
  }, [isDrawing, finishDrawing, isDrawingSection, sectionStart, previewSection, createSection, captureElementsInSection, elements, updateMultipleElements]);

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

  // Drag and drop functionality for adding elements from sidebar
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stage = internalStageRef.current;
    if (!stage) return;

    const type = e.dataTransfer.getData('application/reactflow');
    const elementData = JSON.parse(e.dataTransfer.getData('element'));

    if (type) {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const newElement: CanvasElement = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        x: pos.x,
        y: pos.y,
        width: elementData.width || 100,
        height: elementData.height || 100,
        fill: elementData.fill || designSystem.colors.primary[500],
        stroke: elementData.stroke || designSystem.colors.primary[700],
        strokeWidth: elementData.strokeWidth || 2,
      };
      addElement(newElement);
    }
  }, [addElement]);

  // Handle section resize with proportional scaling of contained elements
  const handleSectionResize = useCallback((sectionId: string, newWidth: number, newHeight: number) => {
    const result = resizeSection(sectionId, newWidth, newHeight);
    
    // If section resized, scale all contained elements proportionally
    if (result && result.containedElementIds.length > 0) {
      const updates: Record<string, Partial<CanvasElement>> = {};
      const section = sections[sectionId];
      
      result.containedElementIds.forEach((containedId: string) => {
        const containedElement = elements[containedId];
        if (containedElement && section) {
          // Calculate relative position within section
          const relativeX = containedElement.x - section.x;
          const relativeY = containedElement.y - section.y;
          
          // Scale position and size proportionally
          updates[containedId] = {
            x: section.x + (relativeX * result.scaleX),
            y: section.y + (relativeY * result.scaleY),
            width: (containedElement.width || 100) * result.scaleX,
            height: (containedElement.height || 100) * result.scaleY
          };
        }
      });
      
      if (Object.keys(updates).length > 0) {
        updateMultipleElements(updates);
        console.log('✅ [KONVA CANVAS] Proportionally resized', Object.keys(updates).length, 'contained elements');
      }
    }
  }, [resizeSection, sections, elements, updateMultipleElements]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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

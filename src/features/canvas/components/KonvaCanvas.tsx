import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { useShallow } from 'zustand/react/shallow';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { findNearestConnectionPoint } from '../utils/snappingUtils';
import type { CanvasElement } from '../types';
import '../../../styles/konvaCanvas.css';
import '../../../styles/multiDrag.css';

// Local interfaces
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface MultiDragState {
  pointerPos: { x: number; y: number };
  elementStates: Record<string, {
    initialPos: { x: number; y: number };
    parentSection?: string | undefined;
    isInSection: boolean;
  }>;
  dragStartTime: number;
  totalElementCount: number;
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

  // Multi-drag state for enhanced multi-element dragging
  const multiDragState = useRef<MultiDragState | null>(null);
  const dragAnimationFrame = useRef<number | null>(null);

  // Sync internal ref with external ref
  useEffect(() => {
    if (externalStageRef && internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }
  }, [externalStageRef]);

  // Optimized store subscriptions using useShallow for better performance
  const {
    elements,
    sections,
    selectedElementIds,
    updateElement, 
    addElement, 
    updateMultipleElements,
    clearSelection, 
    selectElement,
    setEditingTextId,
    selectedTool,
    setSelectedTool,
    isDrawing, 
    currentPath, 
    startDrawing,    
    updateDrawing, 
    finishDrawing,
    handleElementDrop, 
    captureElementsAfterSectionCreation,
    createSection,
    captureElementsInSection,
    handleSectionDragEnd,
    resizeSection,
    findSectionAtPoint,
    setHoveredSnapPoint,
    // Add history functions for atomic undo/redo
    addHistoryEntry,
    startHistoryGroup,
    endHistoryGroup
  } = useEnhancedStore(    useShallow((state) => ({
      elements: state.elements,
      sections: state.sections,
      selectedElementIds: state.selectedElementIds,
      updateElement: state.updateElement,
      addElement: state.addElement,
      updateMultipleElements: state.updateMultipleElements,
      clearSelection: state.clearSelection,
      selectElement: state.selectElement,
      setEditingTextId: state.setEditingTextId,
      selectedTool: state.selectedTool,
      setSelectedTool: state.setSelectedTool,
      isDrawing: state.isDrawing,
      currentPath: state.currentPath,
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      finishDrawing: state.finishDrawing,
      handleElementDrop: state.handleElementDrop,
      captureElementsAfterSectionCreation: state.captureElementsAfterSectionCreation,
      createSection: state.createSection,
      captureElementsInSection: state.captureElementsInSection,
      handleSectionDragEnd: state.handleSectionDragEnd,
      resizeSection: state.resizeSection,
      findSectionAtPoint: state.findSectionAtPoint,
      setHoveredSnapPoint: state.setHoveredSnapPoint,
      // Add history functions for atomic undo/redo
      addHistoryEntry: state.addHistoryEntry,
      startHistoryGroup: state.startHistoryGroup,
      endHistoryGroup: state.endHistoryGroup,
    }))
  );

  // Memoized combined elements map for performance
  const allElements = useMemo(() => ({ ...elements, ...sections }), [elements, sections]);

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

  // Enhanced multi-element drag start handler
  const handleElementDragStart = useCallback((_e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const stage = internalStageRef.current;
    if (!stage) return;

    // Performance optimization: cancel any pending animation frames
    if (dragAnimationFrame.current) {
      cancelAnimationFrame(dragAnimationFrame.current);
    }

    console.log('🚀 [MULTI-DRAG] Starting drag for element:', elementId, 'Current selection:', selectedElementIds);

    // Enhanced selection logic with immediate state access
    const currentSelection = selectedElementIds.includes(elementId) 
      ? selectedElementIds 
      : [elementId];

    // If dragged element not in selection, update selection immediately
    if (!selectedElementIds.includes(elementId)) {
      clearSelection();
      selectElement(elementId);
    }

    // Capture initial state for all selected elements
    const elementStates: Record<string, MultiDragState['elementStates'][string]> = {};
    const pointerPos = stage.getPointerPosition() || { x: 0, y: 0 };

    currentSelection.forEach(id => {
      const element = allElements[id];
      if (element) {
        // Check if element is within a section for coordinate conversion
        const parentSection = ('sectionId' in element ? element.sectionId : null) || findSectionAtPoint({ x: element.x, y: element.y });

        elementStates[id] = {
          initialPos: { x: element.x, y: element.y },
          parentSection: parentSection || undefined,
          isInSection: !!parentSection,
        };
      }
    });

    multiDragState.current = {
      pointerPos,
      elementStates,
      dragStartTime: performance.now(),
      totalElementCount: currentSelection.length,
    };

    // Visual feedback for multi-selection drag
    if (currentSelection.length > 1) {
      // Add visual indicator class to stage for CSS styling
      stage.container().classList.add('multi-drag-active');
    }

    console.log(`✨ [MULTI-DRAG] Started: ${currentSelection.length} elements`, {
      elementIds: currentSelection,
      sectionsInvolved: Object.values(elementStates).filter(s => s.isInSection).length,
    });

  }, [selectedElementIds, allElements, clearSelection, selectElement, findSectionAtPoint, dragAnimationFrame]);

  // Enhanced multi-element drag end handler
  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, _elementId: string) => {
    const stage = internalStageRef.current;
    if (!stage || !multiDragState.current) {
      // Fallback to original single-element drag handling
      const node = e.target;
      const allElementsMap = { ...elements, ...sections };
      const element = allElementsMap[_elementId];
      if (!element) return;

      // Get the absolute position directly from the Konva node.
      let newPos = node.absolutePosition();

      // Normalize for shape-specific positioning differences
      if (element.type === 'circle') {
        const radius = element.radius || 50;
        newPos = {
          x: newPos.x - radius,
          y: newPos.y - radius
        };
      } else if (element.type === 'star') {
        const radius = element.radius || (element.width || 100) / 2;
        newPos = {
          x: newPos.x - radius,
          y: newPos.y - radius
        };
      }

      if (element.type === 'section') {
        const result = handleSectionDragEnd(_elementId, newPos.x, newPos.y);
        console.log('📦 [KONVA CANVAS] Section moved:', {
          sectionId: _elementId,
          newPosition: newPos,
          containedElements: result?.containedElementIds?.length || 0
        });
      } else {
        console.log('🎯 [KONVA CANVAS] Single element drag - calling handleElementDrop:', {
          elementId: _elementId,
          elementType: element.type,
          normalizedAbsolutePosition: newPos,
        });
        handleElementDrop(_elementId, newPos); 
      }
      return;
    }

    // Performance monitoring
    const dragDuration = performance.now() - multiDragState.current.dragStartTime;

    try {
      const { pointerPos: startPointerPos, elementStates } = multiDragState.current;
      const endPointerPos = stage.getPointerPosition() || { x: 0, y: 0 };

      const deltaX = endPointerPos.x - startPointerPos.x;
      const deltaY = endPointerPos.y - startPointerPos.y;

      // Early exit for minimal movement (avoids unnecessary updates)
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        console.log('💫 [MULTI-DRAG] Minimal movement detected, skipping update');
        return;
      }

      const updates: Record<string, Partial<CanvasElement>> = {};
      const sectionUpdates: Record<string, string[]> = {}; // track section reassignments

      // Calculate new positions with section awareness
      Object.entries(elementStates).forEach(([id, state]) => {
        const element = allElements[id];
        if (!element) return;

        const newX = state.initialPos.x + deltaX;
        const newY = state.initialPos.y + deltaY;

        // Check for section reassignment
        const newParentSection = findSectionAtPoint({ x: newX, y: newY });

        updates[id] = {
          x: newX,
          y: newY,
          // Update parent section if changed for elements that support it
          ...(newParentSection !== state.parentSection && 'sectionId' in element && { sectionId: newParentSection }),
        };

        // Track section changes for connection updates
        if (newParentSection !== state.parentSection) {
          if (newParentSection) {
            sectionUpdates[newParentSection] = sectionUpdates[newParentSection] || [];
            sectionUpdates[newParentSection].push(id);
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        // Single atomic update for optimal performance and undo/redo
        updateMultipleElements(updates);

        // Task 4: Save atomic history entry after drag completion
        addHistoryEntry(
          `Move ${Object.keys(updates).length} element${Object.keys(updates).length > 1 ? 's' : ''}`,
          [], // patches will be handled by updateMultipleElements
          [], // inverse patches will be handled by updateMultipleElements
          {
            elementIds: Object.keys(updates),
            operationType: 'move',
            affectedCount: Object.keys(updates).length
          }
        );

        console.log(`✅ [MULTI-DRAG] Completed: ${Object.keys(updates).length} elements moved`, {
          deltaX: deltaX.toFixed(2),
          deltaY: deltaY.toFixed(2),
          duration: `${dragDuration.toFixed(2)}ms`,
          sectionChanges: Object.keys(sectionUpdates).length,
        });

        // Optional: Handle section re-parenting with drop logic for each moved element
        if (Object.keys(sectionUpdates).length > 0) {
          Object.entries(sectionUpdates).forEach(([_sectionId, elementIds]) => {
            elementIds.forEach(elementId => {
              const elementUpdate = updates[elementId];
              if (elementUpdate && elementUpdate.x !== undefined && elementUpdate.y !== undefined) {
                handleElementDrop(elementId, { x: elementUpdate.x, y: elementUpdate.y });
              }
            });
          });
        }
      }

    } catch (error) {
      console.error('❌ [MULTI-DRAG] Error during drag end:', error);
      // Graceful error recovery - could trigger state validation here
    } finally {
      // Cleanup
      multiDragState.current = null;
      stage.container().classList.remove('multi-drag-active');

      // Cancel any pending animation frames
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
        dragAnimationFrame.current = null;
      }
    }
  }, [elements, sections, handleSectionDragEnd, handleElementDrop, updateMultipleElements, findSectionAtPoint, allElements, dragAnimationFrame, multiDragState]);

  // Enhanced real-time drag update for smooth visual feedback
  const handleElementDragMove = useCallback((_e: Konva.KonvaEventObject<DragEvent>, _elementId: string) => {
    if (!multiDragState.current || multiDragState.current.totalElementCount <= 1) return;

    // Throttle updates using animation frames for smooth performance
    if (dragAnimationFrame.current) return;

    dragAnimationFrame.current = requestAnimationFrame(() => {
      const stage = internalStageRef.current;
      if (!stage || !multiDragState.current) return;

      const { pointerPos: startPointerPos } = multiDragState.current;
      const currentPointerPos = stage.getPointerPosition() || { x: 0, y: 0 };

      const deltaX = currentPointerPos.x - startPointerPos.x;
      const deltaY = currentPointerPos.y - startPointerPos.y;

      // Provide visual preview updates for large selections (future enhancement)
      if (multiDragState.current.totalElementCount > 5) {
        // Could add visual preview updates here for better UX
        console.log('🔄 [MULTI-DRAG] Large selection drag in progress:', {
          elements: multiDragState.current.totalElementCount,
          delta: { x: deltaX.toFixed(1), y: deltaY.toFixed(1) }
        });
      }

      dragAnimationFrame.current = null;
    });
  }, []);

  // Cleanup effect for animation frames
  useEffect(() => {
    return () => {
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
      }
    };
  }, []);

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

      // Find the nearest connection point for the current cursor position
      const allElements = { ...elements, ...sections };
      const connectionResult = findNearestConnectionPoint(pos.x, pos.y, allElements);
      const snapPoint = connectionResult ? 
        { 
          x: connectionResult.point.x, 
          y: connectionResult.point.y, 
          elementId: connectionResult.point.elementId, 
          anchor: connectionResult.point.anchor 
        } : 
        { x: pos.x, y: pos.y };

      // Handle connector creation
      if (!isDrawingConnector) {
        // Start connector
        setIsDrawingConnector(true);
        setConnectorStart(snapPoint);
        console.log('🔗 [CONNECTOR] Starting connector at:', snapPoint);
      } else {
        // Finish connector
        setConnectorEnd(snapPoint);
        console.log('🔗 [CONNECTOR] Finishing connector at:', snapPoint);

        if (connectorStart) {
          // Create connector element with proper structure for ConnectorRenderer
          const connectorElement: CanvasElement = {
            id: `connector-${Date.now()}`,
            type: 'connector' as const,
            subType: selectedTool === 'connector-arrow' ? 'straight' : 'straight', // Default to straight for now
            x: 0, // Connectors use startPoint/endPoint for positioning
            y: 0,
            startPoint: {
              x: connectorStart.x,
              y: connectorStart.y,
              ...(connectorStart.elementId && {
                connectedElementId: connectorStart.elementId,
                anchorPoint: connectorStart.anchor as any
              })
            },
            endPoint: {
              x: snapPoint.x,
              y: snapPoint.y,
              ...(snapPoint.elementId && {
                connectedElementId: snapPoint.elementId,
                anchorPoint: snapPoint.anchor as any
              })
            },
            intermediatePoints: [], // Empty for straight connectors
            connectorStyle: {
              strokeColor: '#000000',
              strokeWidth: 2,
              strokeDashArray: [],
              startArrow: 'none',
              endArrow: selectedTool === 'connector-arrow' ? 'triangle' : 'none',
              arrowSize: 10,
              text: ''
            },
            // Legacy properties for backward compatibility
            points: [connectorStart.x, connectorStart.y, snapPoint.x, snapPoint.y],
            stroke: '#000000',
            strokeWidth: 2,
            fill: ''
          };

          // Add the connector using the store
          addElement(connectorElement);
          console.log('✅ [CONNECTOR] Created connector element with snapping:', {
            id: connectorElement.id,
            startSnap: connectorStart.elementId ? `${connectorStart.elementId}:${connectorStart.anchor}` : 'none',
            endSnap: snapPoint.elementId ? `${snapPoint.elementId}:${snapPoint.anchor}` : 'none'
          });

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
      // Task 4: Save atomic history entry after drawing completion
      addHistoryEntry(
        'Draw pen stroke',
        [], // patches handled by finishDrawing
        [], // inverse patches handled by finishDrawing
        {
          operationType: 'create',
          affectedCount: 1
        }
      );
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

        // Use enhanced store method to capture elements in the new section
        captureElementsAfterSectionCreation(sectionId);

        // Task 4: Save atomic history entry after section creation
        addHistoryEntry(
          'Create section',
          [], // patches handled by createSection
          [], // inverse patches handled by createSection
          {
            elementIds: [sectionId],
            operationType: 'create',
            affectedCount: 1
          }
        );

        // Automatically switch to select tool after section creation
        setSelectedTool('select');
        console.log('🔧 [SECTION] Automatically switched to select tool after section creation');
      }
      // Reset section drawing state
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
    }
  }, [isDrawing, finishDrawing, isDrawingSection, sectionStart, previewSection, createSection, captureElementsInSection, elements, updateMultipleElements, setSelectedTool, addHistoryEntry]);

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
    } else if (selectedTool === 'connector-line' || selectedTool === 'connector-arrow') {
      // Handle snap point detection for connector tools
      const allElements = { ...elements, ...sections };
      const connectionResult = findNearestConnectionPoint(pos.x, pos.y, allElements);

      if (connectionResult) {
        // Show snap point indicator
        setHoveredSnapPoint({
          x: connectionResult.point.x,
          y: connectionResult.point.y,
          elementId: connectionResult.point.elementId,
          anchor: connectionResult.point.anchor
        });
      } else {
        // Clear snap point indicator
        setHoveredSnapPoint(null);
      }
    } else {
      // Clear snap point indicator when not using connector tools
      setHoveredSnapPoint(null);
    }
  }, [isDrawing, selectedTool, updateDrawing, isDrawingSection, sectionStart, elements, sections, setHoveredSnapPoint]);

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
      >
        <CanvasLayerManager
          stageWidth={width}
          stageHeight={height}
          stageRef={internalStageRef}
          onElementUpdate={handleElementUpdate}
          onElementDragStart={handleElementDragStart}
          onElementDragEnd={handleElementDragEnd}
          onElementDragMove={handleElementDragMove}
          onElementClick={handleElementClick}
          onStartTextEdit={handleStartTextEdit}
          isDrawing={isDrawing}
          currentPath={currentPath}
          isDrawingConnector={isDrawingConnector}
          connectorStart={connectorStart}
          connectorEnd={connectorEnd}
          isDrawingSection={isDrawingSection}
          previewSection={previewSection}
          onSectionResize={handleSectionResize}
        />
      </Stage>
    </div>
  );
};

export default KonvaCanvas;

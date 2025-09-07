/**
 * ConnectorTool - Simple connector creation tool that works with existing types
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { ElementId, ConnectorElement } from '../../../types/enhanced.types';
import Konva from 'konva';

interface ConnectorToolProps {
  isActive: boolean;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  connectorType: 'line' | 'arrow';
}

export const ConnectorTool: React.FC<ConnectorToolProps> = ({
  isActive,
  stageRef,
  connectorType
}) => {
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const startEdgeDraft = useUnifiedCanvasStore(s => (s as any).startEdgeDraft);
  const updateEdgeDraftPointer = useUnifiedCanvasStore(s => (s as any).updateEdgeDraftPointer);
  const updateEdgeDraftSnap = useUnifiedCanvasStore(s => (s as any).updateEdgeDraftSnap);
  const commitEdgeDraftTo = useUnifiedCanvasStore(s => (s as any).commitEdgeDraftTo);
  const computeAndCommitDirtyEdges = useUnifiedCanvasStore(s => (s as any).computeAndCommitDirtyEdges);
  const selectElement = useUnifiedCanvasStore(s => s.selectElement);
  const reflowEdgesForElement = useUnifiedCanvasStore(s => (s as any).reflowEdgesForElement);
  const [startElement, setStartElement] = useState<ElementId | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<{ elementId: ElementId; point: { x: number; y: number } } | null>(null);
  
  // Removed addElement - using edge draft system instead
  const elements = useUnifiedCanvasStore(state => state.elements);

  // Get world pointer position from stage event (accounting for viewport transform)
  const getWorldPointer = useCallback((e: Konva.KonvaEventObject<any>) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    
    // Convert from screen coordinates to world coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const worldPoint = transform.point(pointer);
    
    return { x: worldPoint.x, y: worldPoint.y };
  }, [stageRef]);

  // Helper to get element dimensions safely
  const getElementDimensions = (element: any): { width: number; height: number } => {
    // Default dimensions for elements without explicit width/height
    const DEFAULT_WIDTH = 100;
    const DEFAULT_HEIGHT = 100;
    
    // For circle elements, use radius * 2
    if (element.type === 'circle' && element.radius) {
      return { width: element.radius * 2, height: element.radius * 2 };
    }
    
    // For all other elements, use width/height if available
    return {
      width: element.width ?? DEFAULT_WIDTH,
      height: element.height ?? DEFAULT_HEIGHT
    };
  };

  // Find element at position and return connection point
  const findElementAtPosition = useCallback((point: { x: number; y: number }) => {
    const SNAP_DISTANCE = 20;
    
    for (const element of elements.values()) {
      // Skip drawing elements and connectors
      if (element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter' || element.type === 'connector') {
        continue;
      }
      
      const dims = getElementDimensions(element);
      const elementBounds = {
        left: element.x,
        right: element.x + dims.width,
        top: element.y,
        bottom: element.y + dims.height
      };
      
      // Check if point is within snap distance of element edges
      const snapPoints = [
        { x: elementBounds.left, y: element.y + dims.height / 2 }, // left
        { x: elementBounds.right, y: element.y + dims.height / 2 }, // right
        { x: element.x + dims.width / 2, y: elementBounds.top }, // top
        { x: element.x + dims.width / 2, y: elementBounds.bottom }, // bottom
        { x: element.x + dims.width / 2, y: element.y + dims.height / 2 } // center
      ];
      
      for (const snapPoint of snapPoints) {
        const distance = Math.sqrt(
          Math.pow(point.x - snapPoint.x, 2) + Math.pow(point.y - snapPoint.y, 2)
        );
        
        if (distance <= SNAP_DISTANCE) {
          return {
            elementId: element.id,
            point: snapPoint
          };
        }
      }
    }
    
    return null;
  }, [elements]);

  // Handle mouse down - start connector (edge draft)
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;
    
    const worldPos = getWorldPointer(e);
    const elementAtStart = findElementAtPosition(worldPos);
    
    if (elementAtStart) {
      // Start store-first draft from element
      try {
        startEdgeDraft({ elementId: elementAtStart.elementId as any, portKind: 'CENTER' as any });
      } catch {}

      setStartPoint(elementAtStart.point);
      setStartElement(elementAtStart.elementId as ElementId);
    } else {
      // Start free-floating connector from world position
      // Create a temporary "virtual" start point
      try {
        // We need to handle free-floating connectors differently
        // For now, just track the start point
        setStartPoint(worldPos);
        setStartElement(null);
      } catch {}
    }
    
    setCurrentPoint(worldPos);
    setIsDrawing(true);
    
    e.cancelBubble = true;
  }, [isActive, getWorldPointer, findElementAtPosition]);

  // Handle mouse move - update current position and snapping
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !isDrawing) return;
    
    const worldPos = getWorldPointer(e);
    try { updateEdgeDraftPointer(worldPos); } catch {}
    setCurrentPoint(worldPos);
    
    // Check for snap target
    const elementAtEnd = findElementAtPosition(worldPos);
    if (elementAtEnd && elementAtEnd.elementId !== startElement) {
      try { updateEdgeDraftSnap({ elementId: elementAtEnd.elementId as any, portKind: 'CENTER' as any }); } catch {}

      setSnapTarget({ elementId: elementAtEnd.elementId as ElementId, point: elementAtEnd.point });
    } else {
      setSnapTarget(null);
    }
    
    e.cancelBubble = true;
  }, [isActive, isDrawing, getWorldPointer, findElementAtPosition, startElement]);

  // Handle mouse up - create connector
  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !isDrawing || !startPoint) return;
    
    let endPoint = getWorldPointer(e);
    let endElementId = null;

    // Use snap target if available
    if (snapTarget) {
      endPoint = snapTarget.point;
      endElementId = snapTarget.elementId;
    }
    
    // Don't create connectors that are too small
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    if (distance < 10) {
      setIsDrawing(false);
      setStartPoint(null);
      setStartElement(null);
      setSnapTarget(null);
      setCurrentPoint(null);
      return;
    }

    // For now, create a legacy connector element for free-floating connectors
    // TODO: Update edge system to support free-floating edges properly
    if (!startElement) {
      // Create a free-floating connector using the legacy system
      const connectorElement: ConnectorElement = {
        id: `connector-${Date.now()}` as ElementId,
        type: 'connector',
        subType: connectorType === 'arrow' ? 'arrow' : 'line',
        startElementId: undefined,
        endElementId: endElementId ?? undefined,
        startPoint,
        endPoint,
        stroke: snapTarget ? '#10b981' : '#374151',
        strokeWidth: 2,
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };
      
      // We need to re-add the addElement function temporarily
      const store = useUnifiedCanvasStore.getState();
      if (store.addElement) {
        store.addElement(connectorElement);
        console.log('[ConnectorTool] Created free-floating connector:', connectorElement.id);
      }
    } else {
      // Commit draft to target if available (store-first approach)
      try {
        const committedId = commitEdgeDraftTo(snapTarget ? { elementId: snapTarget.elementId as any, portKind: 'CENTER' as any } : undefined);
        if (committedId) {
          // Force routing for the new edge and select it
          try { computeAndCommitDirtyEdges(); } catch {}
          try { selectElement(committedId as any, false); } catch {}
          console.log('[ConnectorTool] Created edge via draft:', committedId, connectorType, {
            startElement: startElement,
            endElement: endElementId,
            connected: !!(startElement && endElementId)
          });
        }
      } catch (e) {
        console.warn('[ConnectorTool] Failed to commit edge draft:', e);
      }
    }
    
    // Reset state
    setIsDrawing(false);
    setStartPoint(null);
    setStartElement(null);
    setSnapTarget(null);
    setCurrentPoint(null);
    e.cancelBubble = true;
  }, [isActive, isDrawing, startPoint, startElement, snapTarget, getWorldPointer, connectorType, commitEdgeDraftTo, computeAndCommitDirtyEdges, selectElement]);

  // Attach/detach event handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isActive) return;
    
    stage.on('mousedown.connector', handleMouseDown);
    stage.on('mousemove.connector', handleMouseMove);
    stage.on('mouseup.connector', handleMouseUp);
    
    return () => {
      stage.off('mousedown.connector');
      stage.off('mousemove.connector');
      stage.off('mouseup.connector');
    };
  }, [stageRef, isActive, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Update cursor when tool is active
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const container = stage.container();
    if (isActive) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = 'default';
    }
    
    return () => {
      container.style.cursor = 'default';
    };
  }, [stageRef, isActive]);

  // Draw preview line while drawing
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isActive) return;
    
    const overlayLayer = stage.findOne<Konva.Layer>('.overlay-layer');
    if (!overlayLayer) return;

    // Remove existing preview line
    const existingPreview = overlayLayer.findOne('.connector-preview');
    if (existingPreview) {
      existingPreview.destroy();
    }

    // Draw preview line if actively drawing
    if (isDrawing && startPoint && currentPoint) {
      const endPoint = snapTarget ? snapTarget.point : currentPoint;
      const previewLine = new Konva.Line({
        points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
        stroke: snapTarget ? '#10b981' : '#6b7280', // Green if snapping, gray otherwise
        strokeWidth: 2,
        dash: [6, 4],
        lineCap: 'round',
        listening: false,
        name: 'connector-preview'
      });
      
      overlayLayer.add(previewLine);
      overlayLayer.batchDraw();
    }

    // Cleanup on unmount
    return () => {
      const currentPreview = overlayLayer.findOne('.connector-preview');
      if (currentPreview) {
        currentPreview.destroy();
        overlayLayer.batchDraw();
      }
    };
  }, [isActive, isDrawing, startPoint, currentPoint, snapTarget, stageRef]);

  return null;
};

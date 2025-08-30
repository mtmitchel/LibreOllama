/**
 * ConnectorTool - Simple connector creation tool that works with existing types
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { ElementId, ConnectorElement, CanvasElement } from '../../../types/enhanced.types';
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
  const [startElement, setStartElement] = useState<ElementId | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<{ elementId: ElementId; point: { x: number; y: number } } | null>(null);
  
  const addElement = useUnifiedCanvasStore(state => state.addElement);
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

  // Find element at position and return connection point
  const findElementAtPosition = useCallback((point: { x: number; y: number }) => {
    const SNAP_DISTANCE = 20;
    
    for (const element of elements.values()) {
      // Skip drawing elements and connectors
      if (element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter' || element.type === 'connector') {
        continue;
      }
      
      const elementBounds = {
        left: element.x,
        right: element.x + (element.width || 0),
        top: element.y,
        bottom: element.y + (element.height || 0)
      };
      
      // Check if point is within snap distance of element edges
      const snapPoints = [
        { x: elementBounds.left, y: element.y + (element.height || 0) / 2 }, // left
        { x: elementBounds.right, y: element.y + (element.height || 0) / 2 }, // right
        { x: element.x + (element.width || 0) / 2, y: elementBounds.top }, // top
        { x: element.x + (element.width || 0) / 2, y: elementBounds.bottom }, // bottom
        { x: element.x + (element.width || 0) / 2, y: element.y + (element.height || 0) / 2 } // center
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

  // Handle mouse down - start connector
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;
    
    const worldPos = getWorldPointer(e);
    const elementAtStart = findElementAtPosition(worldPos);
    
    if (elementAtStart) {
      setStartPoint(elementAtStart.point);
      setStartElement(elementAtStart.elementId);
    } else {
      setStartPoint(worldPos);
      setStartElement(null);
    }
    
    setCurrentPoint(worldPos);
    setIsDrawing(true);
    
    e.cancelBubble = true;
  }, [isActive, getWorldPointer, findElementAtPosition]);

  // Handle mouse move - update current position and snapping
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !isDrawing) return;
    
    const worldPos = getWorldPointer(e);
    setCurrentPoint(worldPos);
    
    // Check for snap target
    const elementAtEnd = findElementAtPosition(worldPos);
    if (elementAtEnd && elementAtEnd.elementId !== startElement) {
      setSnapTarget(elementAtEnd);
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
    
    // Create connector element with element connections
    const connectorElement: ConnectorElement = {
      id: `connector-${Date.now()}` as ElementId,
      type: 'connector',
      subType: connectorType === 'arrow' ? 'arrow' : 'line',
      startElementId: startElement,
      endElementId: endElementId,
      startPoint,
      endPoint,
      stroke: snapTarget ? '#10b981' : '#374151', // Green if connected, gray if not
      strokeWidth: 2,
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    addElement(connectorElement);
    console.log('[ConnectorTool] Created connector:', connectorElement.id, connectorType, {
      startElement: startElement,
      endElement: endElementId,
      connected: !!(startElement && endElementId)
    });
    
    // Reset state
    setIsDrawing(false);
    setStartPoint(null);
    setStartElement(null);
    setSnapTarget(null);
    setCurrentPoint(null);
    e.cancelBubble = true;
  }, [isActive, isDrawing, startPoint, startElement, snapTarget, getWorldPointer, connectorType, addElement]);

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
/**
 * ConnectorTool - Simple connector creation tool that works with existing types
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { ElementId, ConnectorElement } from '../../../types/enhanced.types';
import { PortKind } from '../../../types/canvas-elements';
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
  const [snapTarget, setSnapTarget] = useState<{ elementId: ElementId; point: { x: number; y: number }; portKind?: PortKind } | null>(null);
  
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

  const getWorldSnapDistance = useCallback(() => {
    const stage = stageRef.current; if (!stage) return 20;
    const inv = stage.getAbsoluteTransform().copy().invert();
    const a = inv.point({ x: 0, y: 0 });
    const b = inv.point({ x: 28, y: 0 }); // 28 screen px → world units (more forgiving)
    return Math.hypot(b.x - a.x, b.y - a.y);
  }, [stageRef]);

  // Find element at position and return closest port (N/S/E/W/CENTER) with world point
  const findElementAtPosition = useCallback((point: { x: number; y: number }, excludeId: ElementId | null = null) => {
    const SNAP_DISTANCE = getWorldSnapDistance();
    let best: { elementId: string; point: { x: number; y: number }; portKind: PortKind; dist: number } | null = null;

    for (const element of elements.values()) {
      if (!element || element.id === excludeId) {
        continue;
      }
      if (element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter' || element.type === 'connector' || (element as any).type === 'edge') {
        continue;
      }

      const dims = getElementDimensions(element);
      let candidates: { p: { x: number; y: number }; kind: PortKind }[];

      // Per-element coordinate system handling - simplified to 4 ports
      if (element.type === 'circle' || element.type === 'circle-text') {
        const cx = element.x;
        const cy = element.y;
        const rx = dims.width / 2;
        const ry = dims.height / 2;
        candidates = [
          { p: { x: cx - rx, y: cy }, kind: 'W' },
          { p: { x: cx + rx, y: cy }, kind: 'E' },
          { p: { x: cx, y: cy - ry }, kind: 'N' },
          { p: { x: cx, y: cy + ry }, kind: 'S' },
        ];
      } else {
        const left = element.x;
        const top = element.y;
        const right = element.x + dims.width;
        const bottom = element.y + dims.height;
        const cx = element.x + dims.width / 2;
        const cy = element.y + dims.height / 2;
        candidates = [
          { p: { x: left, y: cy }, kind: 'W' },
          { p: { x: right, y: cy }, kind: 'E' },
          { p: { x: cx, y: top }, kind: 'N' },
          { p: { x: cx, y: bottom }, kind: 'S' },
        ];
      }

      for (const c of candidates) {
        const d = Math.hypot(point.x - c.p.x, point.y - c.p.y);
        if (d <= SNAP_DISTANCE && (!best || d < best.dist)) {
          best = { elementId: element.id, point: c.p, portKind: c.kind, dist: d };
        }
      }
    }

    if (!best) return null;
    return { elementId: best.elementId as any, point: best.point, portKind: best.portKind };
  }, [elements, getWorldSnapDistance]);

  // Handle mouse down - start connector (edge draft)
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;
    
    const worldPos = getWorldPointer(e);
    const elementAtStart = findElementAtPosition(worldPos);
    try { (e as any).evt?.preventDefault?.(); } catch {}
    try { stageRef.current?.capturePointer?.((e as any).evt?.pointerId); } catch {}
    
    if (elementAtStart) {
      // Start store-first draft from element with connector type
      try {
        startEdgeDraft(
          { elementId: elementAtStart.elementId as any, portKind: (elementAtStart as any).portKind || ('CENTER' as any) },
          connectorType
        );
      } catch {}

      setStartPoint(elementAtStart.point);
      setStartElement(elementAtStart.elementId as ElementId);
    } else {
      // Allow free-drawing connectors without elements
      // Start draft from free position
      try {
        startEdgeDraft(
          { elementId: '' as any, portKind: 'CENTER' as any },
          connectorType
        );
        // Store the initial position in the draft
        updateEdgeDraftPointer(worldPos);
      } catch {}
      
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
    try { updateEdgeDraftPointer(worldPos); } catch {}
    setCurrentPoint(worldPos);
    
    // Check for snap target, excluding the start element
    const elementAtEnd = findElementAtPosition(worldPos, startElement);
    if (elementAtEnd && elementAtEnd.elementId !== startElement) {
      try { updateEdgeDraftSnap({ elementId: elementAtEnd.elementId as any, portKind: (elementAtEnd as any).portKind || ('CENTER' as any) }); } catch {}

      setSnapTarget({ elementId: elementAtEnd.elementId as ElementId, point: elementAtEnd.point, portKind: (elementAtEnd as any).portKind || 'CENTER' });
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

    // Always try to commit the draft - works for both element-connected and free-floating edges
    try {
      const committedId = commitEdgeDraftTo(snapTarget ? { elementId: snapTarget.elementId as any, portKind: (snapTarget.portKind as any) || ('CENTER' as any) } : undefined);
      if (committedId) {
        // Force routing for the new edge and select it
        try { computeAndCommitDirtyEdges(); } catch {}
        try { selectElement(committedId as any, false); } catch {}
        console.log('[ConnectorTool] Created edge:', committedId, connectorType, {
          startElement: startElement,
          endElement: endElementId,
          freeFloating: !startElement || !endElementId
        });
      }
    } catch (e) {
      console.warn('[ConnectorTool] Failed to commit edge draft:', e);
    }
    
    // Reset state
    setIsDrawing(false);
    setStartPoint(null);
    setStartElement(null);
    setSnapTarget(null);
    setCurrentPoint(null);
    try { stageRef.current?.releasePointerCapture?.((e as any).evt?.pointerId); } catch {}
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
      // Single preview line only
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

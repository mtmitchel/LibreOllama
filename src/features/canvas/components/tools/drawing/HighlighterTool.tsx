/**
 * HighlighterTool - High-performance highlighter drawing component
 * 
 * Uses Konva refs and batchDraw for smooth real-time drawing without React re-renders
 */

import React, { useCallback, useRef, useEffect } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { createElementId } from '../../../types/enhanced.types';
import { acquireNode, releaseNode } from '../../../utils/KonvaNodePool';
import { getContentPointer } from '../../../utils/pointer-to-content';

interface HighlighterToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: {
    color: string;
    width: number;
    opacity: number;
    blendMode: string;
  };
}

export const HighlighterTool: React.FC<HighlighterToolProps> = ({ 
  stageRef, 
  isActive, 
  strokeStyle 
}) => {
  // High-performance drawing refs - avoid React state updates during drawing
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<number[]>([]);
  // We no longer render a react-konva <Line>; use a Konva.Line node directly
  const previewLineRef = useRef<Konva.Line | null>(null);
  const previewLayerRef = useRef<Konva.Layer | null>(null);
  const pooledNodeRef = useRef<Konva.Line | null>(null);
  const lastPointRef = useRef<{x:number;y:number}|null>(null);

  // Store selectors - for stroke storage, preview, and highlighter settings
  const { addElementDrawing, findStickyNoteAtPoint, addElementToStickyNote, startDrawing, updateDrawing, finishDrawing } = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElementDrawing: state.addElementDrawing,
      findStickyNoteAtPoint: state.findStickyNoteAtPoint,
      addElementToStickyNote: state.addElementToStickyNote,
      startDrawing: state.startDrawing,
      updateDrawing: state.updateDrawing,
      finishDrawing: state.finishDrawing
    }))
  );

  // High-frequency input capture and interpolation
  const addPoint = useCallback((x: number, y: number) => {
    const last = lastPointRef.current;
    if (!last) {
      pointsRef.current.push(x, y);
      lastPointRef.current = { x, y };
      return;
    }
    const dx = x - last.x;
    const dy = y - last.y;
    const dist = Math.hypot(dx, dy);
    const step = 2; // px - tuneable for smoothness
    
    if (dist > step) {
      const n = Math.floor(dist / step);
      for (let i = 1; i <= n; i++) {
        const nx = last.x + (dx * (i / n));
        const ny = last.y + (dy * (i / n));
        pointsRef.current.push(nx, ny);
      }
    } else {
      pointsRef.current.push(x, y);
    }
    lastPointRef.current = { x, y };
  }, []);

  // Handle pointer down - start drawing with interpolation
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    // PERFORMANCE: Skip expensive element checks during drawing for maximum responsiveness
    const stage = stageRef.current;
    const pointer = getContentPointer(stage);
    if (!pointer) return;

    // Initialize drawing with refs (no React state updates)
    isDrawingRef.current = true;
    pointsRef.current = [];
    lastPointRef.current = null;
    
    // Acquire a pooled line node for high-performance preview
    if (!pooledNodeRef.current) {
      pooledNodeRef.current = acquireNode('line') as Konva.Line;
      previewLayerRef.current?.add(pooledNodeRef.current);
    }
    
    // Signal drawing start to disable progressive rendering
    startDrawing('highlighter', pointer);
    
    addPoint(pointer.x, pointer.y);
    
    // Set up preview line on dedicated layer
    if (pooledNodeRef.current) {
      pooledNodeRef.current.points(pointsRef.current);
      pooledNodeRef.current.stroke(strokeStyle.color);
      pooledNodeRef.current.strokeWidth(strokeStyle.width);
      pooledNodeRef.current.opacity(strokeStyle.opacity);
      pooledNodeRef.current.lineCap('round');
      pooledNodeRef.current.lineJoin('round');
      pooledNodeRef.current.tension(0.5);
      pooledNodeRef.current.listening(false);
      pooledNodeRef.current.perfectDrawEnabled(false);
      pooledNodeRef.current.globalCompositeOperation(strokeStyle.blendMode as any);
    }
    
    previewLayerRef.current?.batchDraw();
  }, [isActive, stageRef, strokeStyle, addPoint]);

  // Handle pointer move - ultra-fast updates with interpolation
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawingRef.current || !stageRef.current || !pooledNodeRef.current) return;

    const stage = stageRef.current;
    const pointer = getContentPointer(stage);
    if (!pointer) return;

    addPoint(pointer.x, pointer.y);
    
    // Update store's currentPath for MainLayer preview
    updateDrawing(pointer);
    
    pooledNodeRef.current.points(pointsRef.current);
    previewLayerRef.current?.batchDraw();
  }, [isActive, stageRef, addPoint, updateDrawing]);

  // Handle pointer up - commit final stroke to store
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawingRef.current) return;

    isDrawingRef.current = false;
    
    // Only commit to store if we have enough points for a meaningful stroke
    if (pointsRef.current.length >= 4) {
      const commitStartTime = performance.now();
      
      // Create highlighter element
      const highlighterElement = {
        id: createElementId(nanoid()),
        type: 'highlighter' as const,
        x: 0,
        y: 0,
        points: [...pointsRef.current], // Copy the points array
        style: { 
          color: strokeStyle.color,
          width: strokeStyle.width,
          opacity: strokeStyle.opacity,
          smoothness: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: strokeStyle.blendMode,
          baseOpacity: strokeStyle.opacity * 0.6,
          highlightColor: strokeStyle.color
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      // Add to store using optimized drawing path
      addElementDrawing(highlighterElement);

      // Check for sticky note integration
      const startPoint = { x: pointsRef.current[0], y: pointsRef.current[1] };
      const stickyNoteId = findStickyNoteAtPoint?.(startPoint);
      
      if (stickyNoteId) {
        addElementToStickyNote?.(highlighterElement.id, stickyNoteId);
      }
    }

    // Signal drawing end to re-enable progressive rendering
    finishDrawing();
    
    // Clear preview and reset
    if (pooledNodeRef.current) {
      pooledNodeRef.current.points([]);
    }
    pointsRef.current = [];
    lastPointRef.current = null;
    
    previewLayerRef.current?.batchDraw();
  }, [isActive, strokeStyle, addElementDrawing, findStickyNoteAtPoint, addElementToStickyNote, startDrawing, updateDrawing, finishDrawing]);

  // Store callbacks in refs to prevent stale closures
  const handlersRef = React.useRef({
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  });
  
  // Update refs when callbacks change
  React.useEffect(() => {
    handlersRef.current = {
      handlePointerDown,
      handlePointerMove,
      handlePointerUp
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  // Attach stage listeners when active - using stable wrapper functions
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    const stage = stageRef.current;
    
    // Stable wrapper functions that call the current ref values
    const onPointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => handlersRef.current.handlePointerDown(e);
    const onPointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
      const t0 = performance.now();
      handlersRef.current.handlePointerMove(e);
      const t1 = performance.now();
      try { (window as any).CANVAS_PERF?.recordPointer?.('highlighter', t1 - t0); } catch {}
    };
    const onPointerUp = () => handlersRef.current.handlePointerUp();
    
    stage.on('pointerdown', onPointerDown);
    stage.on('pointermove', onPointerMove);
    stage.on('pointerup', onPointerUp);
    
    return () => {
      stage.off('pointerdown', onPointerDown);
      stage.off('pointermove', onPointerMove);
      stage.off('pointerup', onPointerUp);
    };
  }, [isActive]); // Only re-attach when active state changes

  // Cleanup pooled node when tool becomes inactive or component unmounts
  React.useEffect(() => {
    if (!isActive && pooledNodeRef.current) {
      // Release pooled node when tool becomes inactive
      pooledNodeRef.current.remove();
      releaseNode(pooledNodeRef.current, 'line');
      pooledNodeRef.current = null;
    }
    
    return () => {
      // Cleanup on unmount
      if (pooledNodeRef.current) {
        pooledNodeRef.current.remove();
        releaseNode(pooledNodeRef.current, 'line');
        pooledNodeRef.current = null;
      }
    };
  }, [isActive]);

  // Set up the preview layer on mount – create a Konva.Line node imperatively
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    const stage = stageRef.current;
    const fast = stage.findOne<Konva.Layer>('.preview-fast-layer') as Konva.Layer | null;
    const targetLayer = (fast as any) || (stage.getLayers()[0] as any) || null;
    previewLayerRef.current = targetLayer;

    if (!pooledNodeRef.current && targetLayer) {
      pooledNodeRef.current = acquireNode('line') as Konva.Line;
      targetLayer.add(pooledNodeRef.current);
      targetLayer.draw();
    }
    return () => {
      // cleanup handled elsewhere
    };
  }, [isActive, stageRef]);

  // Render dedicated preview line for high-performance drawing
  if (!isActive) {
    return null;
  }
  // No JSX: this tool draws preview via imperative Konva API only
  return null;
};

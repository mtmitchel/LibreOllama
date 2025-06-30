/**
 * MarkerTool - Advanced marker drawing tool with variable width and pressure sensitivity
 * Provides FigJam-style marker functionality with real-time preview
 */

import React, { useRef, useCallback, useState } from 'react';
import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { StrokeManager } from '../../../systems/StrokeManager';
import { MarkerElement } from '../../../types/enhanced.types';
import { StrokePoint, MarkerConfig } from '../../../types/drawing.types';
import { nanoid } from 'nanoid';

interface MarkerToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: MarkerConfig;
}

export const MarkerTool: React.FC<MarkerToolProps> = ({
  stageRef,
  isActive,
  strokeStyle
}) => {
  const strokeManager = useRef(new StrokeManager({
    smoothingLevel: strokeStyle.smoothness,
    simplificationTolerance: 1.5
  }));
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [currentWidth, setCurrentWidth] = useState(strokeStyle.minWidth);
  
  // Store actions
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  
  // Update stroke manager when settings change
  React.useEffect(() => {
    strokeManager.current.updateSettings({
      smoothingLevel: strokeStyle.smoothness,
      simplificationTolerance: 1.5
    });
  }, [strokeStyle.smoothness]);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || e.target !== stageRef.current) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.5,
      timestamp: Date.now()
    };
    
    strokeManager.current.startRecording(point);
    setIsDrawing(true);
    setCurrentPoints([pos.x, pos.y]);
    
    // Calculate initial width
    const width = strokeManager.current.calculateVariableWidth(point, {
      widthVariation: strokeStyle.widthVariation,
      minWidth: strokeStyle.minWidth,
      maxWidth: strokeStyle.maxWidth,
      pressureSensitive: strokeStyle.pressureSensitive
    });
    setCurrentWidth(width);
    
    // Capture pointer for drawing outside stage bounds
    stage.setPointersPositions(e);
    e.target.getLayer()?.batchDraw();
  }, [isActive, stageRef, strokeStyle]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing || !isActive) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.5,
      timestamp: Date.now()
    };
    
    strokeManager.current.addPoint(point);
    
    // Get current preview points (lightly smoothed for performance)
    const previewPoints = strokeManager.current.getCurrentPoints();
    setCurrentPoints(previewPoints);
    
    // Update width for preview
    const width = strokeManager.current.calculateVariableWidth(point, {
      widthVariation: strokeStyle.widthVariation,
      minWidth: strokeStyle.minWidth,
      maxWidth: strokeStyle.maxWidth,
      pressureSensitive: strokeStyle.pressureSensitive
    });
    setCurrentWidth(width);
  }, [isDrawing, isActive, stageRef, strokeStyle]);
  
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    
    const smoothedPoints = strokeManager.current.finishRecording();
    const rawPoints = strokeManager.current.getRawPoints();
    
    if (smoothedPoints.length >= 4) { // At least 2 points
      const markerElement: MarkerElement = {
        id: nanoid(),
        type: 'marker',
        points: smoothedPoints,
        rawPoints: rawPoints, // Store for editing
        x: 0, // Markers use absolute coordinates in points
        y: 0,
        style: {
          color: strokeStyle.color,
          width: (strokeStyle.minWidth + strokeStyle.maxWidth) / 2,
          opacity: strokeStyle.opacity,
          smoothness: strokeStyle.smoothness,
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: 'source-over',
          widthVariation: strokeStyle.widthVariation,
          minWidth: strokeStyle.minWidth,
          maxWidth: strokeStyle.maxWidth,
          pressureSensitive: strokeStyle.pressureSensitive
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };
      
      addElement(markerElement);
      
      console.log('🖊️ [MarkerTool] Created marker stroke:', {
        id: markerElement.id,
        pointCount: smoothedPoints.length / 2,
        rawPointCount: rawPoints.length,
        style: markerElement.style
      });
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setCurrentWidth(strokeStyle.minWidth);
    
    // Auto-switch to select after drawing (FigJam behavior)
    setSelectedTool('select');
  }, [isDrawing, strokeStyle, addElement, setSelectedTool]);
  
  // Handle pointer cancel (when dragging outside)
  const handlePointerCancel = useCallback(() => {
    if (isDrawing) {
      strokeManager.current.cancelRecording();
      setIsDrawing(false);
      setCurrentPoints([]);
      setCurrentWidth(strokeStyle.minWidth);
    }
  }, [isDrawing, strokeStyle.minWidth]);
  
  // Effect for event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup', handlePointerUp);
    stage.on('pointercancel', handlePointerCancel);
    
    // Change cursor
    stage.container().style.cursor = 'crosshair';
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup', handlePointerUp);
      stage.off('pointercancel', handlePointerCancel);
      
      // Reset cursor
      stage.container().style.cursor = 'default';
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]);
  
  if (!isActive) return null;
  
  return (
    <Group listening={false}>
      {/* Live preview while drawing */}
      {isDrawing && currentPoints.length >= 4 && (
        <Line
          points={currentPoints}
          stroke={strokeStyle.color}
          strokeWidth={currentWidth}
          opacity={strokeStyle.opacity * 0.8} // Slightly transparent for preview
          lineCap="round"
          lineJoin="round"
          tension={strokeStyle.smoothness * 0.3} // Light smoothing for preview
          globalCompositeOperation="source-over"
          listening={false}
          perfectDrawEnabled={false} // Better performance
          shadowEnabled={false}
        />
      )}
      
      {/* Drawing indicator at cursor position */}
      {isDrawing && (
        <React.Fragment>
          {/* Could add cursor ring indicator here */}
        </React.Fragment>
      )}
    </Group>
  );
};

export default MarkerTool; 
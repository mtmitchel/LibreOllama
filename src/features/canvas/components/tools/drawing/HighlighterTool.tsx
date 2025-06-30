/**
 * HighlighterTool - Semi-transparent overlay drawing tool
 * Provides FigJam-style highlighter functionality with blend modes
 */

import React, { useRef, useCallback, useState } from 'react';
import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { StrokeManager } from '../../../systems/StrokeManager';
import { HighlighterElement } from '../../../types/enhanced.types';
import { StrokePoint, HighlighterConfig } from '../../../types/drawing.types';
import { nanoid } from 'nanoid';

interface HighlighterToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  strokeStyle: HighlighterConfig;
}

export const HighlighterTool: React.FC<HighlighterToolProps> = ({
  stageRef,
  isActive,
  strokeStyle
}) => {
  const strokeManager = useRef(new StrokeManager({
    smoothingLevel: 0.3, // Less smoothing for highlighter
    simplificationTolerance: 2.0 // More aggressive simplification
  }));
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [hoveredElements, setHoveredElements] = useState<Set<string>>(new Set());
  
  // Store actions
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const elements = useUnifiedCanvasStore(state => state.elements);
  
  // Find elements under the highlighter path (for element-locking)
  const findElementsUnderPath = useCallback((points: number[]) => {
    if (!strokeStyle.lockToElements || points.length < 4) return new Set<string>();
    
    const foundElements = new Set<string>();
    
    // Sample points along the path to find intersected elements
    for (let i = 0; i < points.length; i += 4) { // Every other point
      if (i + 1 < points.length) {
        const x = points[i];
        const y = points[i + 1];
        
        // Find elements at this point
        elements.forEach((element, id) => {
          if (element.type === 'highlighter') return; // Don't highlight other highlighters
          
          // Simple bounding box check
          const inBounds = x >= element.x && 
                          x <= element.x + (element.width || 0) &&
                          y >= element.y && 
                          y <= element.y + (element.height || 0);
          
          if (inBounds) {
            foundElements.add(id);
          }
        });
      }
    }
    
    return foundElements;
  }, [strokeStyle.lockToElements, elements]);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || e.target !== stageRef.current) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.7, // Default to higher pressure for highlighter
      timestamp: Date.now()
    };
    
    strokeManager.current.startRecording(point);
    setIsDrawing(true);
    setCurrentPoints([pos.x, pos.y]);
    
    // Change cursor to show highlighter mode
    stage.container().style.cursor = 'crosshair';
    
    console.log('🖍️ [HighlighterTool] Started highlighting at:', pos);
  }, [isActive, stageRef]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing || !isActive) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    const point: StrokePoint = {
      x: pos.x,
      y: pos.y,
      pressure: e.evt.pressure || 0.7,
      timestamp: Date.now()
    };
    
    strokeManager.current.addPoint(point);
    
    // Get current preview points
    const previewPoints = strokeManager.current.getCurrentPoints();
    setCurrentPoints(previewPoints);
    
    // Update hovered elements if element-locking is enabled
    if (strokeStyle.lockToElements) {
      const newHoveredElements = findElementsUnderPath(previewPoints);
      setHoveredElements(newHoveredElements);
    }
  }, [isDrawing, isActive, stageRef, strokeStyle.lockToElements, findElementsUnderPath]);
  
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    
    const smoothedPoints = strokeManager.current.finishRecording();
    const rawPoints = strokeManager.current.getRawPoints();
    
    if (smoothedPoints.length >= 4) { // At least 2 points
      const highlighterElement: HighlighterElement = {
        id: nanoid(),
        type: 'highlighter',
        points: smoothedPoints,
        rawPoints: rawPoints,
        x: 0, // Highlighters use absolute coordinates in points
        y: 0,
        style: {
          color: strokeStyle.color,
          width: strokeStyle.width,
          opacity: strokeStyle.opacity,
          smoothness: 0.3, // Fixed smoothness for highlighter
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: strokeStyle.blendMode,
          baseOpacity: strokeStyle.opacity,
          highlightColor: strokeStyle.color
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };
      
      // If element-locking is enabled, store which elements this highlighter affects
      if (strokeStyle.lockToElements && hoveredElements.size > 0) {
        (highlighterElement as any).lockedToElements = Array.from(hoveredElements);
      }
      
      addElement(highlighterElement);
      
      console.log('🖍️ [HighlighterTool] Created highlighter stroke:', {
        id: highlighterElement.id,
        pointCount: smoothedPoints.length / 2,
        blendMode: highlighterElement.style.blendMode,
        lockedElements: hoveredElements.size
      });
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setHoveredElements(new Set());
    
    // Auto-switch to select after drawing
    setSelectedTool('select');
    
    // Reset cursor
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  }, [isDrawing, strokeStyle, hoveredElements, addElement, setSelectedTool, stageRef]);
  
  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    if (isDrawing) {
      strokeManager.current.cancelRecording();
      setIsDrawing(false);
      setCurrentPoints([]);
      setHoveredElements(new Set());
      
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'default';
      }
    }
  }, [isDrawing, stageRef]);
  
  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup', handlePointerUp);
    stage.on('pointercancel', handlePointerCancel);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup', handlePointerUp);
      stage.off('pointercancel', handlePointerCancel);
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
          strokeWidth={strokeStyle.width}
          opacity={strokeStyle.opacity * 0.8} // Slightly more transparent for preview
          lineCap="round"
          lineJoin="round"
          tension={0.2} // Light smoothing for preview
          globalCompositeOperation={strokeStyle.blendMode}
          listening={false}
          perfectDrawEnabled={false}
          shadowEnabled={false}
        />
      )}
      
      {/* Element highlight indicators (when element-locking is enabled) */}
      {strokeStyle.lockToElements && isDrawing && hoveredElements.size > 0 && (
        <React.Fragment>
          {Array.from(hoveredElements).map(elementId => {
            const element = elements.get(elementId);
            if (!element || !element.width || !element.height) return null;
            
            return (
              <Line
                key={`highlight-${elementId}`}
                points={[
                  element.x, element.y,
                  element.x + element.width, element.y,
                  element.x + element.width, element.y + element.height,
                  element.x, element.y + element.height,
                  element.x, element.y
                ]}
                stroke={strokeStyle.color}
                strokeWidth={2}
                opacity={0.6}
                dash={[4, 4]}
                listening={false}
              />
            );
          })}
        </React.Fragment>
      )}
    </Group>
  );
};

export default HighlighterTool; 
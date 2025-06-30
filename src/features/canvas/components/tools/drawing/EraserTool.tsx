/**
 * EraserTool - Per-stroke removal tool
 * Provides FigJam-style erasing functionality
 */

import React, { useRef, useCallback, useState } from 'react';
import { Circle, Group, Line } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { EraserConfig } from '../../../types/drawing.types';
import { ElementId } from '../../../types/enhanced.types';
import { pointInCircle, getShapeCheckPoints } from '../../../utils/algorithms/pointInPolygon';

interface EraserToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  eraserConfig: EraserConfig;
}

export const EraserTool: React.FC<EraserToolProps> = ({
  stageRef,
  isActive,
  eraserConfig
}) => {
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedElements, setHighlightedElements] = useState<Set<ElementId>>(new Set());
  const erasedElementsRef = useRef<Set<ElementId>>(new Set());
  
  // Store selectors and actions
  const elements = useUnifiedCanvasStore(state => state.elements);
  const deleteElement = useUnifiedCanvasStore(state => state.deleteElement);
  const addToHistory = useUnifiedCanvasStore(state => state.addToHistory);
  
  // Find elements under the eraser
  const findElementsUnderEraser = useCallback((x: number, y: number) => {
    const elementsToErase = new Set<ElementId>();
    
    elements.forEach((element, id) => {
      // Skip if already erased in this stroke
      if (erasedElementsRef.current.has(id as ElementId)) return;
      
      if (eraserConfig.mode === 'stroke') {
        // For stroke mode, check if eraser overlaps with the element
        const checkPoints = getShapeCheckPoints(element);
        
        // Check if any part of the element is within the eraser circle
        const isInEraserRange = checkPoints.some(point => 
          pointInCircle(point, [x, y], eraserConfig.size / 2)
        );
        
        if (isInEraserRange) {
          elementsToErase.add(id as ElementId);
        }
      } else if (eraserConfig.mode === 'pixel') {
        // For pixel mode, check more precise intersection
        // This would require more complex geometry calculations
        // For now, fall back to stroke mode behavior
        const checkPoints = getShapeCheckPoints(element);
        const isInEraserRange = checkPoints.some(point => 
          pointInCircle(point, [x, y], eraserConfig.size / 2)
        );
        
        if (isInEraserRange) {
          elementsToErase.add(id as ElementId);
        }
      }
    });
    
    return elementsToErase;
  }, [elements, eraserConfig]);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || e.target !== stageRef.current) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setIsErasing(true);
    setEraserPosition(pos);
    erasedElementsRef.current.clear();
    
    // Find and erase elements immediately on mouse down
    const elementsToErase = findElementsUnderEraser(pos.x, pos.y);
    
    elementsToErase.forEach(elementId => {
      deleteElement(elementId);
      erasedElementsRef.current.add(elementId);
    });
    
    if (elementsToErase.size > 0) {
      console.log('🗑️ [EraserTool] Erased', elementsToErase.size, 'elements');
    }
    
    // Change cursor
    stage.container().style.cursor = 'none'; // Hide cursor, we'll show custom eraser
    
    console.log('🗑️ [EraserTool] Started erasing at:', pos);
  }, [isActive, stageRef, findElementsUnderEraser, deleteElement]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    setEraserPosition(pos);
    
    if (isErasing) {
      // Continue erasing while moving
      const elementsToErase = findElementsUnderEraser(pos.x, pos.y);
      
      elementsToErase.forEach(elementId => {
        if (!erasedElementsRef.current.has(elementId)) {
          deleteElement(elementId);
          erasedElementsRef.current.add(elementId);
        }
      });
    } else {
      // Just highlight elements that would be erased
      const elementsUnder = findElementsUnderEraser(pos.x, pos.y);
      setHighlightedElements(elementsUnder);
    }
  }, [isErasing, findElementsUnderEraser, deleteElement]);
  
  const handlePointerUp = useCallback(() => {
    if (!isErasing) return;
    
    setIsErasing(false);
    
    // Add to history if we erased any elements
    if (erasedElementsRef.current.size > 0) {
      addToHistory('eraseElements');
      console.log('🗑️ [EraserTool] Erasing complete, removed', erasedElementsRef.current.size, 'elements');
    }
    
    erasedElementsRef.current.clear();
    
    // Reset cursor
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'none'; // Keep custom cursor
    }
  }, [isErasing, addToHistory, stageRef]);
  
  const handlePointerLeave = useCallback(() => {
    setEraserPosition(null);
    setHighlightedElements(new Set());
    
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  }, [stageRef]);
  
  const handlePointerEnter = useCallback(() => {
    if (isActive && stageRef.current) {
      stageRef.current.container().style.cursor = 'none';
    }
  }, [isActive, stageRef]);
  
  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup pointercancel', handlePointerUp);
    stage.on('pointerleave', handlePointerLeave);
    stage.on('pointerenter', handlePointerEnter);
    
    // Set initial cursor
    stage.container().style.cursor = 'none';
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup pointercancel', handlePointerUp);
      stage.off('pointerleave', handlePointerLeave);
      stage.off('pointerenter', handlePointerEnter);
      
      // Reset cursor
      stage.container().style.cursor = 'default';
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave, handlePointerEnter]);
  
  // Clear highlights when tool becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setHighlightedElements(new Set());
      setEraserPosition(null);
    }
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <Group listening={false}>
      {/* Element highlight indicators */}
      {!isErasing && highlightedElements.size > 0 && (
        <React.Fragment>
          {Array.from(highlightedElements).map(elementId => {
            const element = elements.get(elementId);
            if (!element) return null;
            
            // Highlight the element that would be erased
            if (element.points && Array.isArray(element.points)) {
              // For stroke elements, highlight the stroke
              return (
                <Line
                  key={`highlight-${elementId}`}
                  points={element.points}
                  stroke="#FF4444"
                  strokeWidth={(element as any).strokeWidth || 2}
                  opacity={0.7}
                  listening={false}
                  dash={[4, 4]}
                />
              );
            } else if (element.width && element.height) {
              // For rectangular elements, highlight the border
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
                  stroke="#FF4444"
                  strokeWidth={2}
                  opacity={0.7}
                  listening={false}
                  dash={[4, 4]}
                />
              );
            }
            
            return null;
          })}
        </React.Fragment>
      )}
      
      {/* Custom eraser cursor */}
      {eraserPosition && (
        <Group>
          {/* Outer circle */}
          <Circle
            x={eraserPosition.x}
            y={eraserPosition.y}
            radius={eraserConfig.size / 2}
            stroke={isErasing ? "#FF4444" : "#666666"}
            strokeWidth={2}
            opacity={isErasing ? 0.8 : 0.6}
            listening={false}
            dash={isErasing ? [] : [4, 4]}
          />
          
          {/* Inner circle */}
          <Circle
            x={eraserPosition.x}
            y={eraserPosition.y}
            radius={Math.max(2, eraserConfig.size / 8)}
            fill={isErasing ? "#FF4444" : "#666666"}
            opacity={isErasing ? 0.6 : 0.4}
            listening={false}
          />
          
          {/* Crosshair for precision */}
          <Line
            points={[
              eraserPosition.x - 4, eraserPosition.y,
              eraserPosition.x + 4, eraserPosition.y
            ]}
            stroke={isErasing ? "#FF4444" : "#666666"}
            strokeWidth={1}
            opacity={0.8}
            listening={false}
          />
          <Line
            points={[
              eraserPosition.x, eraserPosition.y - 4,
              eraserPosition.x, eraserPosition.y + 4
            ]}
            stroke={isErasing ? "#FF4444" : "#666666"}
            strokeWidth={1}
            opacity={0.8}
            listening={false}
          />
        </Group>
      )}
      
      {/* Erasing effect particles (optional visual feedback) */}
      {isErasing && eraserPosition && (
        <React.Fragment>
          {/* Could add particle effects here for visual feedback */}
        </React.Fragment>
      )}
    </Group>
  );
};

export default EraserTool; 
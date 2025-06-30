/**
 * LassoTool - Free-form polygon selection tool
 * Allows users to draw a lasso around elements for selection
 */

import React, { useState, useRef, useCallback } from 'react';
import { Line, Group, Circle } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { pointInPolygon, pathToPolygon, getShapeCheckPoints, simplifyPolygon, type Polygon } from '../../../utils/algorithms/pointInPolygon';
import { ElementId } from '../../../types/enhanced.types';

interface LassoToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  onComplete?: (selectedIds: ElementId[]) => void;
  selectionMode?: 'replace' | 'add' | 'remove';
}

export const LassoTool: React.FC<LassoToolProps> = ({
  stageRef,
  isActive,
  onComplete,
  selectionMode = 'replace'
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPath, setLassoPath] = useState<number[]>([]);
  const [simplifiedPath, setSimplifiedPath] = useState<number[]>([]);
  const pathRef = useRef<number[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  
  // Store selectors and actions
  const elements = useUnifiedCanvasStore(state => state.elements);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const deselectElement = useUnifiedCanvasStore(state => state.deselectElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || e.target !== stageRef.current) return;
    
    // Don't start lasso if clicking on an element (unless it's for adding/removing)
    if (e.target !== stageRef.current && selectionMode === 'replace') return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    pathRef.current = [pos.x, pos.y];
    lastPointRef.current = pos;
    setLassoPath([pos.x, pos.y]);
    setSimplifiedPath([pos.x, pos.y]);
    setIsDrawing(true);
    
    console.log('🎯 [LassoTool] Started lasso selection at:', pos);
    
    // Change cursor
    stage.container().style.cursor = 'crosshair';
  }, [isActive, stageRef, selectionMode]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing || !lastPointRef.current) return;
    
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    
    // Add point only if moved enough distance (reduce noise)
    const lastPos = lastPointRef.current;
    const distance = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
    
    if (distance > 3) { // Minimum movement threshold
      pathRef.current.push(pos.x, pos.y);
      lastPointRef.current = pos;
      
      // Update full path for rendering
      setLassoPath([...pathRef.current]);
      
      // Create simplified version for better visual feedback
      if (pathRef.current.length >= 6) { // At least 3 points
        const polygon = pathToPolygon(pathRef.current);
        const simplified = simplifyPolygon(polygon, 5); // Moderate simplification
        const simplifiedFlat = simplified.flatMap(p => [p[0], p[1]]);
        setSimplifiedPath(simplifiedFlat);
      }
    }
  }, [isDrawing, stageRef]);
  
  const handlePointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing || pathRef.current.length < 6) { // Need at least 3 points
      // Reset if not enough points
      setIsDrawing(false);
      setLassoPath([]);
      setSimplifiedPath([]);
      pathRef.current = [];
      lastPointRef.current = null;
      
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'default';
      }
      return;
    }
    
    // Close the path by connecting to start point
    const startX = pathRef.current[0];
    const startY = pathRef.current[1];
    const closedPath = [...pathRef.current, startX, startY];
    
    // Convert to polygon for intersection testing
    const polygon = pathToPolygon(closedPath);
    
    console.log('🎯 [LassoTool] Lasso closed, testing', elements.size, 'elements');
    
    // Find elements inside the lasso
    const selectedIds: ElementId[] = [];
    const deselectedIds: ElementId[] = [];
    
    elements.forEach((element, id) => {
      const checkPoints = getShapeCheckPoints(element);
      
      // Determine intersection strategy based on element type
      let intersectionThreshold = 0.3; // 30% of points must be inside
      
      if (element.type === 'marker' || element.type === 'highlighter' || element.type === 'pen') {
        // For strokes, be more liberal - any intersection counts
        intersectionThreshold = 0.1;
      } else if (element.type === 'text' || element.type === 'sticky-note') {
        // For text elements, require majority intersection
        intersectionThreshold = 0.6;
      }
      
      // Count how many check points are inside the polygon
      const pointsInside = checkPoints.filter(point => pointInPolygon(point, polygon)).length;
      const intersectionRatio = pointsInside / checkPoints.length;
      
      if (intersectionRatio >= intersectionThreshold) {
        selectedIds.push(id as ElementId);
      }
    });
    
    console.log('🎯 [LassoTool] Found', selectedIds.length, 'elements in lasso');
    
    // Apply selection based on mode
    switch (selectionMode) {
      case 'replace':
        // Clear existing selection unless Shift is held
        if (!e.evt.shiftKey) {
          clearSelection();
        }
        selectedIds.forEach(id => selectElement(id, true));
        break;
        
      case 'add':
        selectedIds.forEach(id => selectElement(id, true));
        break;
        
      case 'remove':
        selectedIds.forEach(id => {
          if (selectedElementIds.has(id)) {
            deselectElement(id);
            deselectedIds.push(id);
          }
        });
        break;
    }
    
    // Callback with results
    onComplete?.(selectionMode === 'remove' ? deselectedIds : selectedIds);
    
    // Reset state
    setIsDrawing(false);
    setLassoPath([]);
    setSimplifiedPath([]);
    pathRef.current = [];
    lastPointRef.current = null;
    
    // Reset cursor
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
    
    console.log('🎯 [LassoTool] Selection complete:', {
      mode: selectionMode,
      selected: selectedIds.length,
      deselected: deselectedIds.length,
      totalSelected: selectedElementIds.size
    });
  }, [
    isDrawing, 
    elements, 
    selectedElementIds,
    selectElement, 
    deselectElement, 
    clearSelection, 
    onComplete, 
    selectionMode,
    stageRef
  ]);
  
  // Handle escape key to cancel
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDrawing) {
      setIsDrawing(false);
      setLassoPath([]);
      setSimplifiedPath([]);
      pathRef.current = [];
      lastPointRef.current = null;
      
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
    stage.on('pointerup pointercancel', handlePointerUp);
    
    // Add keyboard listener for escape
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup pointercancel', handlePointerUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown]);
  
  if (!isActive || !isDrawing) return null;
  
  return (
    <Group listening={false}>
      {/* Main lasso path */}
      <Line
        points={lassoPath}
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[8, 4]}
        closed={false}
        listening={false}
        opacity={0.8}
        lineCap="round"
        lineJoin="round"
        perfectDrawEnabled={false} // Better performance
      />
      
      {/* Simplified preview (shown while drawing) */}
      {simplifiedPath.length > 4 && (
        <Line
          points={simplifiedPath}
          stroke="#1E40AF"
          strokeWidth={1}
          closed={false}
          listening={false}
          opacity={0.4}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Start point indicator */}
      {lassoPath.length >= 2 && (
        <Circle
          x={lassoPath[0]}
          y={lassoPath[1]}
          radius={4}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          listening={false}
          opacity={0.9}
        />
      )}
      
      {/* End point indicator (current position) */}
      {lassoPath.length >= 4 && (
        <Circle
          x={lassoPath[lassoPath.length - 2]}
          y={lassoPath[lassoPath.length - 1]}
          radius={3}
          fill="#1E40AF"
          listening={false}
          opacity={0.7}
        />
      )}
      
      {/* Closing line preview (when close to start) */}
      {lassoPath.length >= 8 && (() => {
        const endX = lassoPath[lassoPath.length - 2];
        const endY = lassoPath[lassoPath.length - 1];
        const startX = lassoPath[0];
        const startY = lassoPath[1];
        const distance = Math.hypot(endX - startX, endY - startY);
        
        // Show closing line when within reasonable distance
        if (distance < 50) {
          return (
            <Line
              points={[endX, endY, startX, startY]}
              stroke="#10B981"
              strokeWidth={2}
              dash={[4, 4]}
              listening={false}
              opacity={0.6}
            />
          );
        }
        return null;
      })()}
    </Group>
  );
};

export default LassoTool; 
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';

import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { ElementId, isTableElement, isConnectorElement } from '../../types/enhanced.types';
import { useCursorManager } from '../../utils/performance/cursorManager';
import { createBoundBoxFunc } from '../../utils/snappingUtils';

type CustomTransformerProps = {
  selectedNodeIds: ElementId[];
  stageRef: React.RefObject<Konva.Stage | null>;
};

const rotationCursor = `url('data:image/svg+xml;charset=utf-8,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 10C17 13.866 13.866 17 10 17C6.134 17 3 13.866 3 10C3 6.134 6.134 3 10 3C12.5 3 14.7 4.3 16 6.3" stroke="black" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M14 4L16 6.3L18 4" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>') 10 10, auto`;

export const CustomTransformer: React.FC<CustomTransformerProps> = ({ selectedNodeIds, stageRef }) => {
  const transformerRef = useRef<Konva.Transformer>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [showRotationHandle, setShowRotationHandle] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ angle: number; nodeRotation: number } | null>(null);
  const { elements, updateElement, addToHistory, selectedTool } = useUnifiedCanvasStore(useShallow((state) => ({
    elements: state.elements,
    updateElement: state.updateElement,
    addToHistory: state.addToHistory,
    selectedTool: state.selectedTool
  })));
  
  const cursorManager = useCursorManager();

  // Exclude table and connector elements - they handle their own selection/transformation
  const filteredSelectedNodeIds = selectedNodeIds.filter(id => {
    const element = elements.get(id);
    return element && !isTableElement(element) && !isConnectorElement(element);
  });

  // Get the bounding box with padding
  const getTransformerBox = useCallback(() => {
    if (!transformerRef.current) return null;
    const transformer = transformerRef.current;
    if (transformer.nodes().length === 0) return null;
    return transformer.getClientRect();
  }, []);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const transformer = transformerRef.current;
    
    // Attach to filtered nodes (tables already excluded)
    const nodes = filteredSelectedNodeIds
      .map((id) => stage.findOne<Konva.Node>(`#${id}`))
      .filter((node): node is Konva.Node => !!node);

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();

    // If no nodes to transform (tables filtered out), hide transformer
    if (nodes.length === 0) {
      transformer.hide();
      return;
    } else {
      transformer.show();
    }
    
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      if (isRotating && rotationStart) {
        // Handle rotation
        const node = nodes[0];
        if (!node) return;
        
        const centerX = node.x();
        const centerY = node.y();
        
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * 180 / Math.PI;
        let rotation = rotationStart.nodeRotation + (angle - rotationStart.angle);
        
        // Snap to 15-degree increments when shift is held
        if (e.evt.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        }
        
        node.rotation(rotation);
        transformer.forceUpdate();
        stage.batchDraw();
      } else {
        // Check if hovering outside corners for rotation
        const box = getTransformerBox();
        if (!box) return;
        
        // Define corners
        const corners = [
          { x: box.x, y: box.y, angle: -45 }, // top-left
          { x: box.x + box.width, y: box.y, angle: 45 }, // top-right
          { x: box.x + box.width, y: box.y + box.height, angle: 135 }, // bottom-right
          { x: box.x, y: box.y + box.height, angle: -135 } // bottom-left
        ];
        
        let isNearRotationZone = false;
        let rotationAngle = 0;
        
        // Check each corner
        for (const corner of corners) {
          const distance = Math.sqrt(Math.pow(pos.x - corner.x, 2) + Math.pow(pos.y - corner.y, 2));
          
          // Hot zone: between 15px and 30px from corner
          if (distance >= 15 && distance <= 30) {
            isNearRotationZone = true;
            rotationAngle = corner.angle;
            break;
          }
        }
        
        if (isNearRotationZone) {
          // Show rotation cursor
          stage.container().style.cursor = rotationCursor;
          setShowRotationHandle(true);
        } else {
          // Reset cursor to tool-appropriate cursor
          cursorManager.updateForTool(selectedTool as any);
          setShowRotationHandle(false);
        }
      }
    };
    
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = stage.getPointerPosition();
      if (!pos || transformer.nodes().length === 0) return;
      
      // Check if clicking in rotation hot zone
      const box = getTransformerBox();
      if (!box) return;
      
      // Define corners
      const corners = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x + box.width, y: box.y + box.height },
        { x: box.x, y: box.y + box.height }
      ];
      
      // Check each corner for hot zone
      for (const corner of corners) {
        const distance = Math.sqrt(Math.pow(pos.x - corner.x, 2) + Math.pow(pos.y - corner.y, 2));
        
        if (distance >= 15 && distance <= 30 && showRotationHandle) {
          e.evt.preventDefault();
          e.evt.stopPropagation();
          
          const node = transformer.nodes()[0];
          const centerX = node.x();
          const centerY = node.y();
          const startAngle = Math.atan2(pos.y - centerY, pos.x - centerX) * 180 / Math.PI;
          
          setIsRotating(true);
          setRotationStart({
            angle: startAngle,
            nodeRotation: node.rotation()
          });
          
          stage.container().style.cursor = rotationCursor;
          break;
        }
      }
    };
    
    const handleMouseUp = () => {
      if (isRotating) {
        const node = nodes[0];
        if (node) {
          updateElement(node.id() as ElementId, { rotation: node.rotation() });
          addToHistory('Rotate Element');
        }
        setIsRotating(false);
        setRotationStart(null);
        cursorManager.updateForTool(selectedTool as any);
      }
    };
    
    stage.on('mousemove', handleMouseMove);
    stage.on('mousedown', handleMouseDown);
    stage.on('mouseup', handleMouseUp);

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      stage.off('mousemove', handleMouseMove);
      stage.off('mousedown', handleMouseDown);
      stage.off('mouseup', handleMouseUp);
      // Restore tool-appropriate cursor
      cursorManager.updateForTool(selectedTool as any);
    };
  }, [filteredSelectedNodeIds, stageRef, isRotating, rotationStart, showRotationHandle, getTransformerBox, updateElement, addToHistory, selectedTool, cursorManager]);

  const handleTransformEnd = (e: Konva.KonvaEventObject<any>) => {
    const node = e.target;
    const elementId = node.id() as ElementId;
    const element = elements.get(elementId);

    if (!element) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and adjust dimensions
    node.scaleX(1);
    node.scaleY(1);

    const updates: any = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    // Handle different element types
    if ('width' in element && element.width !== undefined) {
      updates.width = Math.max(20, element.width * scaleX);
    }
    if ('height' in element && element.height !== undefined) {
      updates.height = Math.max(20, element.height * scaleY);
    }
    if ('radius' in element && element.radius !== undefined) {
      const avgScale = (scaleX + scaleY) / 2;
      updates.radius = Math.max(10, element.radius * avgScale);
    }

    // Handle text scaling - scale fontSize based on average of width/height scaling
    if (element.type === 'text' && 'fontSize' in element && element.fontSize !== undefined) {
      const avgScale = (scaleX + scaleY) / 2;
      updates.fontSize = Math.max(8, Math.min(72, element.fontSize * avgScale));
    }

    // Handle table scaling - resize table and redistribute columns/rows
    if (element.type === 'table' && isTableElement(element)) {
      const newWidth = Math.max(120, element.width * scaleX); // Minimum 120px (for at least 1 column)
      const newHeight = Math.max(80, element.height * scaleY); // Minimum 80px (for at least 2 rows)
      
      updates.width = newWidth;
      updates.height = newHeight;
      
      // Update table data if it exists
      if (element.enhancedTableData) {
        const { rows, columns } = element.enhancedTableData;
        
        // Redistribute column widths proportionally
        const totalCols = columns.length;
        const newColWidth = newWidth / totalCols;
        const updatedColumns = columns.map(col => ({
          ...col,
          width: newColWidth
        }));
        
        // Redistribute row heights proportionally  
        const totalRows = rows.length;
        const newRowHeight = newHeight / totalRows;
        const updatedRows = rows.map(row => ({
          ...row,
          height: newRowHeight
        }));
        
        updates.enhancedTableData = {
          ...element.enhancedTableData,
          columns: updatedColumns,
          rows: updatedRows
        };
      }
    }

    updateElement(elementId, updates);
    addToHistory('Transform Element');
  };

  // If no transformable elements are selected, don't render transformer
  if (filteredSelectedNodeIds.length === 0) {
    return null;
  }

  return (
    <Transformer
      ref={transformerRef}
      onTransformEnd={handleTransformEnd}
      // Disable built-in rotation
      rotateEnabled={false}
      // Clean appearance
      resizeEnabled={true}
      // Only enable corner anchors
      enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
      // Smaller, subtle handles
      anchorSize={8}
      anchorStyleFunc={(anchor) => {
        const name = anchor.name();
        
        // Hide middle anchors and rotater by scaling to zero
        const anchorsToHide = [
          'top-center',
          'middle-right',
          'bottom-center',
          'middle-left',
          'rotater'
        ];
        
        if (anchorsToHide.includes(name)) {
          // This is the canonical method for hiding anchors
          anchor.scale({ x: 0, y: 0 });
        } else {
          // Style the visible corner anchors to match blue theme
          anchor.scale({ x: 1, y: 1 });
          anchor.fill('#ffffff');
          anchor.stroke('#0066ff');
          anchor.strokeWidth(2);
          anchor.cornerRadius(1);
        }
      }}
      // Blue frame to match editing states
      borderStroke="#0066ff"
      borderStrokeWidth={2}
      borderDash={[]}
      // No padding to match exact element size
      padding={0}
      // Keep handles usable on small elements
      keepRatio={false}
      // Minimum size and snapping
      boundBoxFunc={(oldBox, newBox) => {
        // Apply minimum size constraints first
        if (newBox.width < 30) newBox.width = 30;
        if (newBox.height < 30) newBox.height = 30;
        
        // Apply snapping for the first selected element
        const firstElementId = filteredSelectedNodeIds[0];
        const firstElement = elements.get(firstElementId);
        if (firstElement) {
          const allElements = Array.from(elements.values()).filter(el => el.id !== firstElementId);
          const snapBoundBoxFunc = createBoundBoxFunc(firstElement, allElements, true);
          return snapBoundBoxFunc(oldBox, newBox);
        }
        
        return newBox;
      }}
    />
  );
}; 
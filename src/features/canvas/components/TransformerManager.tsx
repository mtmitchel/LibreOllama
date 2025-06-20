// src/features/canvas/components/TransformerManager.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { CoordinateService } from '../utils/coordinateService';

interface TransformerManagerProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

/**
 * TransformerManager - Centralized transformer lifecycle management
 * 
 * This component implements centralized control over Konva transformers to prevent
 * conflicts and ensure proper transformer lifecycle management.
 * 
 * Benefits:
 * - ✅ Fixes Bug 2.4 (unable to resize sections)
 * - ✅ Prevents transformer conflicts
 * - ✅ Enables multi-element transformations
 * - ✅ Consistent transformer behavior across all elements
 */
export const TransformerManager: React.FC<TransformerManagerProps> = ({ stageRef }) => {
  const transformerRef = useRef<Konva.Transformer>(null);
  
  const { 
    selectedElementIds,
    updateElement,
    updateMultipleElements,
    elements,
    sections
  } = useEnhancedStore();

  // Get all elements in a combined map
  const allElements = { ...elements, ...sections };

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    
    if (!transformer || !stage) return;

    // Clear existing nodes
    transformer.nodes([]);

    if (selectedElementIds.length === 0) {
      // No selection - hide transformer
      transformer.visible(false);
      return;
    }

    // Find selected nodes on the stage
    const selectedNodes: Konva.Node[] = [];
    
    selectedElementIds.forEach(elementId => {
      // Look for the element node directly
      const node = stage.findOne(`#${elementId}`);
      if (node) {
        selectedNodes.push(node);
      } else {
        // If not found directly, look for section groups
        const sectionGroupNode = stage.findOne(`#section-group-${elementId}`);
        if (sectionGroupNode) {
          selectedNodes.push(sectionGroupNode);
        }
      }
    });

    if (selectedNodes.length > 0) {
      transformer.nodes(selectedNodes);
      transformer.visible(true);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.visible(false);
    }
  }, [selectedElementIds, stageRef]);

  // Handle transform end to update element state
  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    const updates: Record<string, Partial<any>> = {};

    nodes.forEach(node => {
      const elementId = node.id();
      
      // Handle section groups differently
      if (elementId.startsWith('section-group-')) {
        const actualElementId = elementId.replace('section-group-', '');
        updates[actualElementId] = {
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation()
        };
        
        // For sections, also update width/height if scaled
        const element = allElements[actualElementId];
        if (element && (node.scaleX() !== 1 || node.scaleY() !== 1)) {
          updates[actualElementId] = {
            ...updates[actualElementId],
            width: (element.width || 300) * node.scaleX(),
            height: (element.height || 200) * node.scaleY()
          };
          
          // Reset scale after applying to dimensions
          node.scaleX(1);
          node.scaleY(1);
        }
      } else {
        // Regular elements
        updates[elementId] = {
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation()
        };

        // For regular elements, also update width/height if scaled
        const element = allElements[elementId];
        if (element && (node.scaleX() !== 1 || node.scaleY() !== 1)) {
          updates[elementId] = {
            ...updates[elementId],
            width: (element.width || 100) * node.scaleX(),
            height: (element.height || 100) * node.scaleY()
          };
          
          // Reset scale after applying to dimensions
          node.scaleX(1);
          node.scaleY(1);
        }
      }
    });

    // Apply all updates atomically
    if (Object.keys(updates).length > 0) {
      updateMultipleElements(updates);
    }
  }, [allElements, updateMultipleElements]);

  return (
    <Transformer
      ref={transformerRef}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // Prevent elements from being scaled too small
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      // Enable rotation and scaling
      enabledAnchors={[
        'top-left', 'top-center', 'top-right',
        'middle-right', 'middle-left',
        'bottom-left', 'bottom-center', 'bottom-right'
      ]}
      rotateEnabled={true}
      // Style the transformer
      borderEnabled={true}
      borderStroke="#0066CC"
      borderStrokeWidth={1}
      borderDash={[3, 3]}
      anchorFill="#0066CC"
      anchorStroke="#004499"
      anchorSize={8}
      anchorCornerRadius={2}
    />
  );
};

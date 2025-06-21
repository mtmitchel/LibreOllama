// src/features/canvas/components/TransformerManager.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { CanvasElement, ElementId } from '../types/enhanced.types';

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
    updateMultipleElements,
    elements,
    sections,
    addHistoryEntry
  } = useEnhancedStore();

  // Get all elements in a combined map
  const allElements = new Map([...elements.entries(), ...sections.entries()]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    
    if (!transformer || !stage) return;

    // Clear existing nodes
    transformer.nodes([]);

    if (selectedElementIds.size === 0) {
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
  }, [selectedElementIds, stageRef, elements, sections]);

  // Handle transform end to update element state
  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    if (nodes.length === 0) return;
    
    const updates: Record<string, Partial<CanvasElement>> = {};

    nodes.forEach(node => {
      const elementId = node.id().replace('section-group-', '') as ElementId;
      const element = allElements.get(elementId);
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      const commonUpdate = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      switch (element.type) {
        case 'rectangle':
        case 'image':
        case 'text':
        case 'sticky-note':
        case 'triangle':
        case 'section':
          updates[elementId] = {
            ...commonUpdate,
            width: Math.max(20, ((element as any).width || 100) * scaleX),
            height: Math.max(20, ((element as any).height || 100) * scaleY),
          };
          break;
        case 'circle': {
          const avgScale = (scaleX + scaleY) / 2;
          updates[elementId] = {
            ...commonUpdate,
            radius: Math.max(10, ((element as any).radius || 50) * avgScale),
          };
          break;
        }
        case 'star': {
          const avgStarScale = (scaleX + scaleY) / 2;
          updates[elementId] = {
            ...commonUpdate,
            outerRadius: Math.max(10, ((element as any).outerRadius || 50) * avgStarScale),
            innerRadius: Math.max(5, ((element as any).innerRadius || 20) * avgStarScale),
          };
          break;
        }
        default:
          updates[elementId] = commonUpdate;
          break;
      }

      node.scaleX(1);
      node.scaleY(1);
    });

    if (Object.keys(updates).length > 0) {
      updateMultipleElements(updates);
      addHistoryEntry('Transform Elements', [], [], {
        elementIds: Object.keys(updates) as ElementId[],
        operationType: 'update',
        affectedCount: Object.keys(updates).length,
      });
    }
  }, [allElements, updateMultipleElements, addHistoryEntry]);

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

// src/features/canvas/components/TransformerManager.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use unified store selectors
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addToHistory = useUnifiedCanvasStore(state => state.addToHistory);
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const sections = useUnifiedCanvasStore(state => state.sections);
  
  // Helper function to update multiple elements (replaces updateMultipleElements)
  const updateMultipleElements = useCallback((updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => {
    updates.forEach(({ id, updates: elementUpdates }) => {
      updateElement(id, elementUpdates);
    });
  }, [updateElement]);

  // Get all elements in a combined map - ensure elements is a Map
  const elementsMap = elements instanceof Map ? elements : new Map();
  const sectionsMap = sections instanceof Map ? sections : new Map();
  const allElements = new Map([...elementsMap.entries(), ...sectionsMap.entries()]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    
    if (!transformer || !stage) {
      console.warn('TransformerManager: Missing transformer or stage ref');
      return;
    }

    const findNodes = () => {
      try {
        // Clear any pending retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        // Clear existing nodes safely
        transformer.nodes([]);

        if (selectedElementIds.size === 0) {
          // No selection - hide transformer
          transformer.visible(false);
          return;
        }

        // Find selected nodes on the stage with error handling
        const selectedNodes: Konva.Node[] = [];
        const missingNodes: string[] = [];
        
        selectedElementIds.forEach(elementId => {
          try {
            // Validate elementId before using
            if (!elementId || typeof elementId !== 'string') {
              console.warn('TransformerManager: Invalid elementId:', elementId);
              return;
            }

            // Look for the element node directly
            const node = stage.findOne(`#${elementId}`);
            if (node && node.isVisible() && node.isListening()) {
              selectedNodes.push(node);
              return;
            }
            
            // If not found directly, look for section groups
            const sectionGroupNode = stage.findOne(`#section-group-${elementId}`);
            if (sectionGroupNode && sectionGroupNode.isVisible() && sectionGroupNode.isListening()) {
              selectedNodes.push(sectionGroupNode);
              return;
            }

            // Node not found - track for potential retry
            missingNodes.push(elementId);
          } catch (nodeError) {
            console.error(`TransformerManager: Error finding node ${elementId}:`, nodeError);
          }
        });

        if (selectedNodes.length > 0) {
          try {
            transformer.nodes(selectedNodes);
            transformer.visible(true);
            // Ensure transformer is above the element every time (fix for reselection issue)
            transformer.moveToTop();
            // Safe layer batch draw with error handling
            const layer = transformer.getLayer();
            if (layer) {
              layer.batchDraw();
            }
          } catch (transformError) {
            console.error('TransformerManager: Error setting transformer nodes:', transformError);
            transformer.visible(false);
          }
        } else if (missingNodes.length > 0) {
          // If we have selections but no nodes found, retry after a short delay
          // This handles newly created elements that haven't rendered yet
          retryTimeoutRef.current = setTimeout(() => {
            const retryNodes: Konva.Node[] = [];
            missingNodes.forEach(elementId => {
              const node = stage.findOne(`#${elementId}`) || stage.findOne(`#section-group-${elementId}`);
              if (node && node.isVisible() && node.isListening()) {
                retryNodes.push(node);
              }
            });
            
            if (retryNodes.length > 0) {
              transformer.nodes(retryNodes);
              transformer.visible(true);
              // Ensure transformer is above the element every time (fix for reselection issue)
              transformer.moveToTop();
              const layer = transformer.getLayer();
              if (layer) {
                layer.batchDraw();
              }
            } else {
              transformer.visible(false);
            }
            retryTimeoutRef.current = null;
          }, 50); // Small delay to allow rendering
        } else {
          transformer.visible(false);
        }
      } catch (error) {
        console.error('TransformerManager: Critical error in selection update:', error);
        // Ensure transformer is hidden on error
        if (transformer) {
          transformer.visible(false);
        }
      }
    };

    findNodes();

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [selectedElementIds, stageRef, elements, sections]);

  // Handle transform end to update element state
  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      console.warn('TransformerManager: No transformer available in handleTransformEnd');
      return;
    }

    try {
      const nodes = transformer.nodes();
      if (nodes.length === 0) {
        console.warn('TransformerManager: No nodes attached to transformer');
        return;
      }
      
      const updates: Record<string, Partial<CanvasElement>> = {};

      nodes.forEach(node => {
        try {
          // Validate node and extract elementId safely
          const nodeId = node.id();
          if (!nodeId) {
            console.warn('TransformerManager: Node missing ID');
            return;
          }

          const elementId = nodeId.replace('section-group-', '') as ElementId;
          const element = allElements.get(elementId);
          
          if (!element) {
            console.warn(`TransformerManager: Element not found for ID ${elementId}`);
            return;
          }

          // Get transform values with validation
          const scaleX = Math.max(0.1, Math.min(10, node.scaleX() || 1));
          const scaleY = Math.max(0.1, Math.min(10, node.scaleY() || 1));
          const x = isFinite(node.x()) ? node.x() : element.x || 0;
          const y = isFinite(node.y()) ? node.y() : element.y || 0;
          const rotation = isFinite(node.rotation()) ? node.rotation() : element.rotation || 0;
          
          const commonUpdate = { x, y, rotation };

          switch (element.type) {
            case 'text': {
              const currentWidth = (element as any).width || 100;
              const currentHeight = (element as any).height || 100;
              const newWidth = Math.max(20, Math.min(5000, currentWidth * scaleX));
              const newHeight = Math.max(20, Math.min(5000, currentHeight * scaleY));
              
              // For text elements, also scale the font size proportionally
              const currentFontSize = (element as any).fontSize || 16;
              const avgScale = (scaleX + scaleY) / 2;
              const newFontSize = Math.max(8, Math.min(120, currentFontSize * avgScale));
              
              updates[elementId] = {
                ...commonUpdate,
                width: newWidth,
                height: newHeight,
                fontSize: newFontSize,
              };
              break;
            }
            case 'sticky-note': {
              const currentWidth = (element as any).width || 100;
              const currentHeight = (element as any).height || 100;
              const newWidth = Math.max(20, Math.min(5000, currentWidth * scaleX));
              const newHeight = Math.max(20, Math.min(5000, currentHeight * scaleY));
              
              // For sticky notes, also scale the font size proportionally
              const currentFontSize = (element as any).fontSize || 14;
              const avgScale = (scaleX + scaleY) / 2;
              const newFontSize = Math.max(8, Math.min(72, currentFontSize * avgScale));
              
              updates[elementId] = {
                ...commonUpdate,
                width: newWidth,
                height: newHeight,
                fontSize: newFontSize,
              };
              break;
            }
            case 'rectangle':
            case 'image':
            case 'triangle':
            case 'section':
              const currentWidth = (element as any).width || 100;
              const currentHeight = (element as any).height || 100;
              updates[elementId] = {
                ...commonUpdate,
                width: Math.max(20, Math.min(5000, currentWidth * scaleX)),
                height: Math.max(20, Math.min(5000, currentHeight * scaleY)),
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

          // Reset scale to prevent accumulation
          try {
            node.scaleX(1);
            node.scaleY(1);
          } catch (scaleError) {
            console.warn(`TransformerManager: Error resetting scale for ${elementId}:`, scaleError);
          }
        } catch (nodeError) {
          console.error(`TransformerManager: Error processing node transform:`, nodeError);
        }
      });

      // Apply updates if any were collected
      if (Object.keys(updates).length > 0) {
        try {
          // Convert updates object to array format
          const updatesArray = Object.entries(updates).map(([id, updates]) => ({ 
            id: id as ElementId, 
            updates 
          }));
          updateMultipleElements(updatesArray);
          addToHistory('Transform Elements');
        } catch (updateError) {
          console.error('TransformerManager: Error updating elements:', updateError);
        }
      }
    } catch (error) {
      console.error('TransformerManager: Critical error in handleTransformEnd:', error);
    }
  }, [allElements, updateMultipleElements, addToHistory]);

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
      // Enable scaling only - no rotation for cleaner design
      enabledAnchors={[
        'top-left', 'top-center', 'top-right',
        'middle-right', 'middle-left',
        'bottom-left', 'bottom-center', 'bottom-right'
      ]}
      rotateEnabled={false}
      rotateAnchorOffset={0}
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

import Konva from 'konva';
import { ElementId, CanvasElement } from '../types/enhanced.types';

export interface DragDropConfig {
  onDragStart?: (elementId: ElementId, element: CanvasElement) => void;
  onDragMove?: (elementId: ElementId, position: { x: number; y: number }) => void;
  onDragEnd?: (elementId: ElementId, position: { x: number; y: number }) => void;
  onGroupDragStart?: (groupId: string, elementIds: ElementId[]) => void;
  onGroupDragEnd?: (groupId: string, positions: Map<ElementId, { x: number; y: number }>) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
}

interface DragState {
  isDragging: boolean;
  draggedId: ElementId | null;
  draggedNode: Konva.Node | null;
  groupDragIds: Set<ElementId>;
  originalPositions: Map<ElementId, { x: number; y: number }>;
  dragOffset: { x: number; y: number };
}

/**
 * Drag and drop management module for canvas elements
 * Handles single and group dragging with optional snapping
 */
export class DragDropManager {
  private config: DragDropConfig;
  private nodeMap: Map<string, Konva.Node>;
  private dragLayer: Konva.Layer | null = null;
  private stage: Konva.Stage | null = null;
  
  // Drag state
  private dragState: DragState = {
    isDragging: false,
    draggedId: null,
    draggedNode: null,
    groupDragIds: new Set(),
    originalPositions: new Map(),
    dragOffset: { x: 0, y: 0 }
  };

  // Visual feedback
  private dragPreview: Konva.Group | null = null;
  private dropIndicator: Konva.Rect | null = null;

  constructor(nodeMap: Map<string, Konva.Node>, config: DragDropConfig = {}) {
    this.nodeMap = nodeMap;
    this.config = {
      snapToGrid: false,
      gridSize: 10,
      ...config
    };
  }

  /**
   * Initialize with stage and drag layer
   */
  init(stage: Konva.Stage, dragLayer: Konva.Layer) {
    this.stage = stage;
    this.dragLayer = dragLayer;
  }

  /**
   * Start dragging an element
   */
  startDrag(elementId: ElementId, element: CanvasElement, event?: Konva.KonvaEventObject<DragEvent>) {
    if (this.dragState.isDragging) return;

    const node = this.nodeMap.get(elementId);
    if (!node) return;

    this.dragState.isDragging = true;
    this.dragState.draggedId = elementId;
    this.dragState.draggedNode = node;

    // Store original position
    this.dragState.originalPositions.set(elementId, {
      x: node.x(),
      y: node.y()
    });

    // Check for group drag
    if (element.groupId) {
      this.startGroupDrag(element.groupId, elementId);
    } else {
      // Create drag preview for single element
      this.createDragPreview(node);
    }

    // Notify handler
    this.config.onDragStart?.(elementId, element);

    // Move node to drag layer for better performance
    if (this.dragLayer && node.getLayer() !== this.dragLayer) {
      const oldLayer = node.getLayer();
      node.moveTo(this.dragLayer);
      this.dragLayer.moveToTop();
      this.dragLayer.visible(true);
      oldLayer?.batchDraw();
      this.dragLayer.batchDraw();
    }
  }

  /**
   * Start group drag
   */
  private startGroupDrag(groupId: string, initiatorId: ElementId) {
    const groupElements: ElementId[] = [];
    
    // Find all elements in the same group
    this.nodeMap.forEach((node, id) => {
      const nodeGroupId = node.getAttr('groupId');
      if (nodeGroupId === groupId) {
        groupElements.push(id as ElementId);
        this.dragState.groupDragIds.add(id as ElementId);
        
        // Store original positions
        this.dragState.originalPositions.set(id as ElementId, {
          x: node.x(),
          y: node.y()
        });
      }
    });

    // Create group preview
    this.createGroupDragPreview(groupElements);

    // Notify handler
    this.config.onGroupDragStart?.(groupId, groupElements);
  }

  /**
   * Handle drag move
   */
  handleDragMove(elementId: ElementId, position: { x: number; y: number }) {
    if (!this.dragState.isDragging || this.dragState.draggedId !== elementId) return;

    let finalPosition = { ...position };

    // Apply grid snapping if enabled
    if (this.config.snapToGrid) {
      finalPosition = this.snapToGrid(finalPosition);
    }

    // Apply drag bounds if provided
    if (this.config.dragBoundFunc) {
      finalPosition = this.config.dragBoundFunc(finalPosition);
    }

    // Update position for single drag
    if (this.dragState.groupDragIds.size === 0) {
      const node = this.dragState.draggedNode;
      if (node) {
        node.position(finalPosition);
        this.updateDragPreview(finalPosition);
      }
    } else {
      // Update positions for group drag
      const offset = {
        x: finalPosition.x - (this.dragState.originalPositions.get(elementId)?.x || 0),
        y: finalPosition.y - (this.dragState.originalPositions.get(elementId)?.y || 0)
      };

      this.dragState.groupDragIds.forEach(id => {
        const node = this.nodeMap.get(id);
        const originalPos = this.dragState.originalPositions.get(id);
        if (node && originalPos) {
          node.position({
            x: originalPos.x + offset.x,
            y: originalPos.y + offset.y
          });
        }
      });

      this.updateGroupDragPreview(offset);
    }

    // Show drop indicator if near drop zone
    this.updateDropIndicator(finalPosition);

    // Notify handler
    this.config.onDragMove?.(elementId, finalPosition);

    // Batch draw drag layer
    this.dragLayer?.batchDraw();
  }

  /**
   * End drag operation
   */
  endDrag(elementId: ElementId, position: { x: number; y: number }) {
    if (!this.dragState.isDragging || this.dragState.draggedId !== elementId) return;

    let finalPosition = { ...position };

    // Apply final snapping
    if (this.config.snapToGrid) {
      finalPosition = this.snapToGrid(finalPosition);
    }

    // Move node back to original layer
    const node = this.dragState.draggedNode;
    if (node && this.dragLayer) {
      const mainLayer = this.stage?.findOne('.main-layer') as Konva.Layer;
      if (mainLayer) {
        node.moveTo(mainLayer);
        mainLayer.batchDraw();
      }
      this.dragLayer.visible(false);
    }

    // Handle group drag end
    if (this.dragState.groupDragIds.size > 0) {
      const finalPositions = new Map<ElementId, { x: number; y: number }>();
      
      this.dragState.groupDragIds.forEach(id => {
        const node = this.nodeMap.get(id);
        if (node) {
          finalPositions.set(id, {
            x: node.x(),
            y: node.y()
          });
        }
      });

      const groupId = node?.getAttr('groupId');
      if (groupId) {
        this.config.onGroupDragEnd?.(groupId, finalPositions);
      }
    } else {
      // Notify single drag end
      this.config.onDragEnd?.(elementId, finalPosition);
    }

    // Clean up
    this.clearDragState();
  }

  /**
   * Cancel drag operation
   */
  cancelDrag() {
    if (!this.dragState.isDragging) return;

    // Restore original positions
    this.dragState.originalPositions.forEach((pos, id) => {
      const node = this.nodeMap.get(id);
      if (node) {
        node.position(pos);
      }
    });

    // Move nodes back to original layer
    if (this.dragLayer) {
      const mainLayer = this.stage?.findOne('.main-layer') as Konva.Layer;
      if (mainLayer) {
        this.dragState.groupDragIds.forEach(id => {
          const node = this.nodeMap.get(id);
          if (node) {
            node.moveTo(mainLayer);
          }
        });
        
        if (this.dragState.draggedNode) {
          this.dragState.draggedNode.moveTo(mainLayer);
        }
        
        mainLayer.batchDraw();
      }
      this.dragLayer.visible(false);
    }

    // Clean up
    this.clearDragState();
  }

  /**
   * Create drag preview for single element
   */
  private createDragPreview(node: Konva.Node) {
    if (!this.dragLayer) return;

    // Create semi-transparent clone
    this.dragPreview = new Konva.Group({
      opacity: 0.5,
      listening: false
    });

    // Clone the node for preview
    const clone = node.clone();
    clone.listening(false);
    this.dragPreview.add(clone);
    
    this.dragLayer.add(this.dragPreview);
  }

  /**
   * Create drag preview for group
   */
  private createGroupDragPreview(elementIds: ElementId[]) {
    if (!this.dragLayer) return;

    this.dragPreview = new Konva.Group({
      opacity: 0.5,
      listening: false
    });

    // Clone all nodes in group
    elementIds.forEach(id => {
      const node = this.nodeMap.get(id);
      if (node && this.dragPreview) {
        const clone = node.clone();
        clone.listening(false);
        this.dragPreview.add(clone);
      }
    });

    this.dragLayer.add(this.dragPreview);
  }

  /**
   * Update drag preview position
   */
  private updateDragPreview(position: { x: number; y: number }) {
    if (this.dragPreview) {
      this.dragPreview.position(position);
    }
  }

  /**
   * Update group drag preview position
   */
  private updateGroupDragPreview(offset: { x: number; y: number }) {
    if (this.dragPreview) {
      this.dragPreview.position(offset);
    }
  }

  /**
   * Update drop indicator
   */
  private updateDropIndicator(position: { x: number; y: number }) {
    // This would show visual feedback for valid drop zones
    // Implementation depends on specific drop zone requirements
  }

  /**
   * Snap position to grid
   */
  private snapToGrid(position: { x: number; y: number }): { x: number; y: number } {
    const gridSize = this.config.gridSize || 10;
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }

  /**
   * Clear drag state
   */
  private clearDragState() {
    // Remove preview
    if (this.dragPreview) {
      this.dragPreview.destroy();
      this.dragPreview = null;
    }

    // Remove drop indicator
    if (this.dropIndicator) {
      this.dropIndicator.destroy();
      this.dropIndicator = null;
    }

    // Reset state
    this.dragState = {
      isDragging: false,
      draggedId: null,
      draggedNode: null,
      groupDragIds: new Set(),
      originalPositions: new Map(),
      dragOffset: { x: 0, y: 0 }
    };

    // Hide drag layer
    if (this.dragLayer) {
      this.dragLayer.visible(false);
      this.dragLayer.batchDraw();
    }
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  /**
   * Get currently dragged element ID
   */
  getDraggedId(): ElementId | null {
    return this.dragState.draggedId;
  }

  /**
   * Clean up
   */
  destroy() {
    this.clearDragState();
    this.stage = null;
    this.dragLayer = null;
  }
}
import Konva from 'konva';
import { ElementId, CanvasElement } from '../types/enhanced.types';
import { RendererLayers } from './core';

export interface SelectionConfig {
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  rotateEnabled?: boolean;
  anchorSize?: number;
  borderDash?: number[];
  keepRatio?: boolean;
}

/**
 * Selection management module for canvas elements
 * Handles transformer, selection highlights, and resize/rotate operations
 */
export class SelectionManager {
  private transformer: Konva.Transformer | null = null;
  private selectionRect: Konva.Rect | null = null;
  private selectedIds = new Set<ElementId>();
  private nodeMap: Map<string, Konva.Node>;
  private layers: RendererLayers | null = null;
  private config: SelectionConfig = {
    strokeColor: '#7C3AED',
    strokeWidth: 2,
    cornerRadius: 0,
    rotateEnabled: true,
    anchorSize: 8,
    borderDash: [3, 3],
    keepRatio: false
  };

  // Pre-transform tracking for resize operations
  private preTransformRects = new Map<string, {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }>();
  private lastActiveAnchorName = '';

  constructor(nodeMap: Map<string, Konva.Node>) {
    this.nodeMap = nodeMap;
  }

  /**
   * Initialize transformer on overlay layer
   */
  init(layers: RendererLayers, config?: SelectionConfig) {
    this.layers = layers;
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Create transformer on overlay layer
    this.transformer = new Konva.Transformer({
      ignoreStroke: false,
      padding: 4,
      rotateEnabled: this.config.rotateEnabled,
      borderStroke: this.config.strokeColor,
      borderStrokeWidth: this.config.strokeWidth,
      borderDash: this.config.borderDash,
      anchorStroke: this.config.strokeColor,
      anchorFill: 'white',
      anchorSize: this.config.anchorSize,
      anchorCornerRadius: 2,
      keepRatio: this.config.keepRatio,
      centeredScaling: false,
      enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-left', 
                       'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      boundBoxFunc: (oldBox, newBox) => {
        // Minimum size constraints
        const minSize = 10;
        if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) {
          return oldBox;
        }
        return newBox;
      }
    });

    layers.overlay.add(this.transformer);

    // Track active anchor for resize direction
    this.transformer.on('transformstart', (e) => {
      const anchor = this.transformer?.getActiveAnchor();
      this.lastActiveAnchorName = anchor || '';
      
      // Store pre-transform bounds for each selected node
      const nodes = this.transformer?.nodes() || [];
      nodes.forEach(node => {
        const rect = node.getClientRect();
        this.preTransformRects.set(node.id(), {
          left: rect.x,
          right: rect.x + rect.width,
          top: rect.y,
          bottom: rect.y + rect.height
        });
      });
    });

    this.transformer.on('transformend', () => {
      this.preTransformRects.clear();
      this.lastActiveAnchorName = '';
    });
  }

  /**
   * Update selection with new element IDs
   */
  syncSelection(selectedIds: Set<ElementId>) {
    if (!this.transformer || !this.layers) return;

    this.selectedIds = new Set(selectedIds);

    if (selectedIds.size === 0) {
      // Clear selection
      this.transformer.nodes([]);
      this.clearSelectionHighlight();
      this.layers.overlay.batchDraw();
      return;
    }

    // Get nodes for selected IDs
    const nodes: Konva.Node[] = [];
    selectedIds.forEach(id => {
      const node = this.nodeMap.get(id);
      if (node) {
        nodes.push(node);
      }
    });

    if (nodes.length === 0) {
      this.transformer.nodes([]);
      this.clearSelectionHighlight();
      this.layers.overlay.batchDraw();
      return;
    }

    // Configure transformer based on selection
    const hasText = nodes.some(n => n.getAttr('elementType') === 'text');
    const hasCircle = nodes.some(n => n.getAttr('elementType') === 'circle');
    
    // Text elements maintain aspect ratio when resizing
    this.transformer.keepRatio(hasText);
    
    // Circles use centered scaling
    this.transformer.centeredScaling(hasCircle);

    // Attach nodes to transformer
    this.transformer.nodes(nodes);
    
    // Draw selection highlight for multiple selections
    if (nodes.length > 1) {
      this.drawSelectionHighlight(nodes);
    } else {
      this.clearSelectionHighlight();
    }

    this.layers.overlay.batchDraw();
  }

  /**
   * Draw selection highlight rectangle for multiple selections
   */
  private drawSelectionHighlight(nodes: Konva.Node[]) {
    if (!this.layers) return;

    this.clearSelectionHighlight();

    // Calculate bounding box of all selected nodes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      const rect = node.getClientRect();
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    });

    // Create selection rectangle
    this.selectionRect = new Konva.Rect({
      x: minX - 2,
      y: minY - 2,
      width: maxX - minX + 4,
      height: maxY - minY + 4,
      stroke: this.config.strokeColor,
      strokeWidth: 1,
      dash: [5, 5],
      listening: false,
      opacity: 0.5
    });

    this.layers.overlay.add(this.selectionRect);
    this.selectionRect.moveToBottom();
  }

  /**
   * Clear selection highlight
   */
  private clearSelectionHighlight() {
    if (this.selectionRect) {
      this.selectionRect.destroy();
      this.selectionRect = null;
    }
  }

  /**
   * Check if an element is selected
   */
  isSelected(id: ElementId): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Get currently selected IDs
   */
  getSelectedIds(): Set<ElementId> {
    return new Set(this.selectedIds);
  }

  /**
   * Get transformer for external use
   */
  getTransformer(): Konva.Transformer | null {
    return this.transformer;
  }

  /**
   * Detach transformer (useful during drag operations)
   */
  detachTransformer() {
    if (this.transformer) {
      this.transformer.nodes([]);
      this.clearSelectionHighlight();
      if (this.layers) {
        this.layers.overlay.batchDraw();
      }
    }
  }

  /**
   * Reattach transformer to selected nodes
   */
  reattachTransformer() {
    this.syncSelection(this.selectedIds);
  }

  /**
   * Get last active anchor name (for resize direction)
   */
  getLastActiveAnchor(): string {
    return this.lastActiveAnchorName;
  }

  /**
   * Get pre-transform bounds for a node
   */
  getPreTransformBounds(id: string) {
    return this.preTransformRects.get(id);
  }

  /**
   * Update transformer configuration
   */
  updateConfig(config: Partial<SelectionConfig>) {
    this.config = { ...this.config, ...config };
    
    if (this.transformer) {
      if (config.strokeColor !== undefined) {
        this.transformer.borderStroke(config.strokeColor);
        this.transformer.anchorStroke(config.strokeColor);
      }
      if (config.strokeWidth !== undefined) {
        this.transformer.borderStrokeWidth(config.strokeWidth);
      }
      if (config.borderDash !== undefined) {
        this.transformer.borderDash(config.borderDash);
      }
      if (config.rotateEnabled !== undefined) {
        this.transformer.rotateEnabled(config.rotateEnabled);
      }
      if (config.anchorSize !== undefined) {
        this.transformer.anchorSize(config.anchorSize);
      }
      if (config.keepRatio !== undefined) {
        this.transformer.keepRatio(config.keepRatio);
      }
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.clearSelectionHighlight();
    
    if (this.transformer) {
      this.transformer.destroy();
      this.transformer = null;
    }

    this.selectedIds.clear();
    this.preTransformRects.clear();
    this.layers = null;
  }
}
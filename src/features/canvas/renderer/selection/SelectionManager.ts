/**
 * Selection Manager
 * Handles transformer setup, selection syncing, and scale normalization
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId } from '../../types/enhanced.types';

/**
 * Store adapter interface for selection manager integration
 */
export interface SelectionManagerStoreAdapter {
  updateElement(id: ElementId, updates: any, options?: { skipHistory?: boolean }): void;
  getSelectedElementIds(): Set<ElementId>;
  saveSnapshot(): void;
}

/**
 * Selection manager configuration
 */
export interface SelectionManagerConfig {
  overlayLayer: Konva.Layer;
  nodeMap: Map<string, Konva.Node>;
  storeAdapter: SelectionManagerStoreAdapter;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Transformer anchor configuration
 */
export interface TransformerAnchorConfig {
  enabledAnchors: string[];
  keepRatio: boolean;
  rotateEnabled: boolean;
  centeredScaling?: boolean;
  boundBoxFunc?: (oldBox: any, newBox: any) => any;
}

/**
 * Element type transformer policies
 */
export type ElementTransformerPolicy = {
  [elementType: string]: TransformerAnchorConfig;
};

/**
 * Transform state tracking
 */
interface TransformState {
  preTransformRects: Map<string, { x: number; y: number; width: number; height: number }>;
  lastActiveAnchorName: string;
}

/**
 * Selection Manager
 * Manages transformer setup, selection syncing, and normalization
 */
export class SelectionManager {
  private config: SelectionManagerConfig;
  private transformer: Konva.Transformer | null = null;
  private transformState: TransformState;
  private shiftPressed = false;

  // Default transformer policies for different element types
  private defaultPolicies: ElementTransformerPolicy = {
    'text': {
      enabledAnchors: [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ],
      keepRatio: true,
      rotateEnabled: true,
      boundBoxFunc: (oldBox: any, newBox: any) => {
        const minWidth = 20;
        const minHeight = 10;
        const w = Math.max(minWidth, Math.abs(newBox.width));
        const h = Math.max(minHeight, Math.abs(newBox.height));
        return { ...newBox, width: w, height: h };
      }
    },
    'sticky-note': {
      enabledAnchors: [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ],
      keepRatio: true,
      rotateEnabled: true
    },
    'table': {
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: true,
      rotateEnabled: true
    },
    'image': {
      enabledAnchors: [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ],
      keepRatio: true,
      rotateEnabled: true
    },
    'circle': {
      enabledAnchors: ['bottom-right'],
      keepRatio: true,
      rotateEnabled: false,
      centeredScaling: true
    },
    'triangle': {
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: true,
      rotateEnabled: true
    },
    'default': {
      enabledAnchors: [
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'top-center', 'bottom-center', 'middle-left', 'middle-right'
      ],
      keepRatio: false,
      rotateEnabled: true
    }
  };

  constructor(config: SelectionManagerConfig) {
    this.config = config;
    this.transformState = {
      preTransformRects: new Map(),
      lastActiveAnchorName: ''
    };

    this.initializeTransformer();
    this.setupKeyboardHandlers();

    if (this.config.debug?.log) {
      console.info('[SelectionManager] Selection manager initialized');
    }
  }

  /**
   * Initialize transformer with default configuration
   */
  private initializeTransformer(): void {
    if (!this.config.overlayLayer) return;

    this.transformer = new Konva.Transformer({
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: false,
      rotateEnabled: true,
      anchorSize: 8,
      anchorCornerRadius: 2,
      borderStroke: '#007AFF',
      borderStrokeWidth: 1,
      anchorFill: '#007AFF',
      anchorStroke: '#ffffff',
      anchorStrokeWidth: 1,
      listening: true,
      name: 'transformer'
    });

    // Enhanced visuals if supported
    try {
      (this.transformer as any).shouldOverdraw?.(true);
    } catch {}

    // Minimum box constraints
    const MIN_W = 60;
    const MIN_H = 40;
    this.transformer.boundBoxFunc((oldBox, newBox) => {
      const w = Math.max(newBox.width, MIN_W);
      const h = Math.max(newBox.height, MIN_H);
      return { ...newBox, width: w, height: h };
    });

    // Add to overlay layer
    this.config.overlayLayer.add(this.transformer);
    try {
      this.transformer.moveToTop();
    } catch {}

    // Setup transform event handlers
    this.setupTransformHandlers();

    if (this.config.debug?.log) {
      console.info('[SelectionManager] Transformer initialized');
    }
  }

  /**
   * Setup transformer event handlers
   */
  private setupTransformHandlers(): void {
    if (!this.transformer) return;

    // Transform start - capture initial state
    this.transformer.on('transformstart.selectionmanager', () => {
      try {
        const activeAnchor = this.transformer?.getActiveAnchor?.();
        this.transformState.lastActiveAnchorName = this.getAnchorName(activeAnchor) || '';

        // Clear and capture pre-transform rectangles
        this.transformState.preTransformRects.clear();
        const nodes = this.transformer?.nodes() || [];
        
        nodes.forEach((node) => {
          const rect = (node as any).getClientRect?.({ 
            skipTransform: false, 
            skipStroke: true, 
            skipShadow: true 
          }) || { 
            x: node.x(), 
            y: node.y(), 
            width: (node as any).width?.() || 0, 
            height: (node as any).height?.() || 0 
          };
          this.transformState.preTransformRects.set(node.id(), rect);
        });

        if (this.config.debug?.log) {
          console.info('[SelectionManager] Transform started with anchor:', this.transformState.lastActiveAnchorName);
        }
      } catch (error) {
        if (this.config.debug?.log) {
          console.warn('[SelectionManager] Transform start error:', error);
        }
      }
    });

    // Transform end - normalize scales to sizes
    this.transformer.on('transformend.selectionmanager', () => {
      try {
        const nodes = this.transformer?.nodes() || [];
        
        nodes.forEach((node) => {
          this.normalizeNodeTransform(node);
        });

        // Force transformer update after normalization
        const currentNodes = this.transformer?.nodes?.() || [];
        if (currentNodes.length > 0 && this.transformer) {
          this.transformer.nodes([]);
          this.transformer.nodes(currentNodes);
          this.transformer.forceUpdate();
        }

        // Trigger draw updates
        if (this.config.scheduleDraw) {
          this.config.scheduleDraw('main');
          this.config.scheduleDraw('overlay');
        }

        // Clear transform state
        this.transformState.preTransformRects.clear();
        this.transformState.lastActiveAnchorName = '';

        if (this.config.debug?.log) {
          console.info('[SelectionManager] Transform completed and normalized');
        }
      } catch (error) {
        if (this.config.debug?.log) {
          console.error('[SelectionManager] Transform end error:', error);
        }
      }
    });
  }

  /**
   * Setup keyboard event handlers for shift constraining
   */
  private setupKeyboardHandlers(): void {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        this.shiftPressed = true;
        this.updateShiftConstraints();
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        this.shiftPressed = false;
        this.updateShiftConstraints();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Store handlers for cleanup
    (this as any)._keyHandlers = { onKeyDown, onKeyUp };
  }

  /**
   * Update transformer constraints based on shift key state
   */
  private updateShiftConstraints(): void {
    if (!this.transformer) return;

    try {
      const nodes = this.transformer.nodes();
      if (nodes.length === 1) {
        const node = nodes[0];
        const elementName = node.name?.() || '';
        
        if (elementName === 'circle') {
          this.transformer.keepRatio(true);
          if (this.config.scheduleDraw) {
            this.config.scheduleDraw('overlay');
          }
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Shift constraint update error:', error);
      }
    }
  }

  /**
   * Sync selection with transformer
   */
  syncSelection(selectedIds: Set<ElementId>): void {
    if (!this.transformer) return;

    if (this.config.debug?.log) {
      console.info('[SelectionManager] Syncing selection for IDs:', Array.from(selectedIds));
    }

    const nodes: Konva.Node[] = [];
    const connectorIds: string[] = [];

    // Resolve nodes and separate connectors
    selectedIds.forEach((id) => {
      const node = this.config.nodeMap.get(String(id));
      if (node) {
        const elementName = node.name?.() || '';
        
        // Connectors don't use transformer
        if (elementName === 'connector' || elementName === 'line' || elementName === 'arrow') {
          connectorIds.push(String(id));
          return;
        }
        
        nodes.push(node);
      }
    });

    // Attach transformer to standard elements
    if (nodes.length > 0 && this.transformer) {
      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Attaching transformer to ${nodes.length} nodes`);
      }

      // Temporarily hide transformer during setup
      this.transformer.borderEnabled(false);
      this.transformer.enabledAnchors([]);
      this.transformer.anchorSize(0);
      this.transformer.nodes(nodes);
      this.transformer.visible(false);

      // Apply element-specific policies
      this.applyTransformerPolicies(nodes);

      // Re-enable visuals after configuration
      requestAnimationFrame(() => {
        if (!this.transformer) return;
        
        this.transformer.visible(true);
        this.transformer.borderEnabled(true);
        this.transformer.anchorSize(8);

        // Configure padding based on stroke width
        this.configureTransformerPadding(nodes);

        // Keep transformer on top
        try {
          this.transformer.moveToTop();
        } catch {}
      });
    } else {
      // No standard elements selected - hide transformer
      if (this.config.debug?.log) {
        console.info('[SelectionManager] No standard elements selected - hiding transformer');
      }
      
      this.transformer.nodes([]);
      this.transformer.visible(false);
    }

    // Trigger overlay redraw
    if (this.config.scheduleDraw) {
      this.config.scheduleDraw('overlay');
    }
  }

  /**
   * Apply element-type specific transformer policies
   */
  private applyTransformerPolicies(nodes: Konva.Node[]): void {
    if (!this.transformer || nodes.length === 0) return;

    const single = nodes.length === 1 ? nodes[0] : null;
    if (!single) {
      // Multi-select - use default policy
      this.applyPolicy(this.defaultPolicies.default);
      return;
    }

    const elementName = single.name?.() || '';
    const policy = this.defaultPolicies[elementName] || this.defaultPolicies.default;

    this.applyPolicy(policy);

    // Element-specific setup
    if (elementName === 'text') {
      // Remove any legacy text scale handlers
      try {
        (single as Konva.Group).off('.textscale');
      } catch {}
    }

    if (this.config.debug?.log) {
      console.info(`[SelectionManager] Applied ${elementName} policy:`, {
        anchors: policy.enabledAnchors.length,
        keepRatio: policy.keepRatio,
        rotateEnabled: policy.rotateEnabled
      });
    }
  }

  /**
   * Apply transformer policy configuration
   */
  private applyPolicy(policy: TransformerAnchorConfig): void {
    if (!this.transformer) return;

    this.transformer.enabledAnchors(policy.enabledAnchors);
    this.transformer.keepRatio(policy.keepRatio);
    this.transformer.rotateEnabled(policy.rotateEnabled);

    if (policy.centeredScaling !== undefined) {
      try {
        (this.transformer as any).centeredScaling?.(policy.centeredScaling);
      } catch {}
    }

    if (policy.boundBoxFunc) {
      this.transformer.boundBoxFunc(policy.boundBoxFunc);
    }
  }

  /**
   * Configure transformer padding based on element stroke width
   */
  private configureTransformerPadding(nodes: Konva.Node[]): void {
    if (!this.transformer || nodes.length === 0) return;

    try {
      const firstNode = nodes[0] as Konva.Group;
      const shape = firstNode.findOne('Rect') || firstNode.findOne('Circle') || firstNode.findOne('Ellipse');
      const strokeWidth = shape && typeof (shape as any).strokeWidth === 'function' 
        ? (shape as any).strokeWidth() 
        : 0;
      
      (this.transformer as any).padding?.(strokeWidth || 0);
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Padding configuration error:', error);
      }
    }
  }

  /**
   * Refresh transformer for specific element
   */
  refreshTransformer(elementId?: ElementId): void {
    if (!this.transformer) return;

    // Check if element is selected
    if (elementId) {
      const selectedIds = this.config.storeAdapter.getSelectedElementIds();
      if (!selectedIds.has(elementId)) {
        return; // Element not selected
      }
    }

    try {
      this.transformer.forceUpdate();
      
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('overlay');
      }

      // Re-sync selection after update
      const currentNodes = this.transformer.nodes();
      if (currentNodes.length > 0) {
        const selectedIds = this.config.storeAdapter.getSelectedElementIds();
        setTimeout(() => this.syncSelection(selectedIds), 0);
      }

      if (this.config.debug?.log && elementId) {
        console.info(`[SelectionManager] Refreshed transformer for element: ${elementId}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Transformer refresh error:', error);
      }
    }
  }

  /**
   * Normalize node transform (scale → size conversion)
   */
  private normalizeNodeTransform(node: Konva.Node): void {
    try {
      const id = node.id?.();
      if (!id) return;

      const elementName = node.name?.() || '';
      const scaleX = node.scaleX() || 1;
      const scaleY = node.scaleY() || 1;

      // Skip if no scaling applied
      if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) {
        return;
      }

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalizing ${elementName} transform:`, {
          id, scaleX, scaleY
        });
      }

      // Element-specific normalization
      switch (elementName) {
        case 'rectangle':
        case 'sticky-note':
          this.normalizeRectangularElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        case 'circle':
        case 'circle-text':
          this.normalizeCircularElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        case 'text':
          this.normalizeTextElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        case 'image':
          this.normalizeImageElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        case 'table':
          this.normalizeTableElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        case 'triangle':
          this.normalizeTriangleElement(node as Konva.Group, scaleX, scaleY);
          break;
          
        default:
          this.normalizeGenericElement(node, scaleX, scaleY);
      }

      // Reset scale after normalization
      node.scale({ x: 1, y: 1 });

    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[SelectionManager] Normalize transform error:', error);
      }
    }
  }

  /**
   * Normalize rectangular elements (rectangle, sticky-note)
   */
  private normalizeRectangularElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const frame = group.findOne('Rect.frame') || group.findOne('Rect');
      if (!frame) return;

      const currentW = (frame as any).width();
      const currentH = (frame as any).height();
      const newW = Math.max(1, Math.round(currentW * scaleX));
      const newH = Math.max(1, Math.round(currentH * scaleY));

      // Update frame dimensions
      (frame as any).width(newW);
      (frame as any).height(newH);
      (frame as any).position({ x: 0, y: 0 });

      // Update hit area
      this.updateHitArea(group, newW, newH);

      // Update text positioning for sticky notes
      const textNode = group.findOne('Text');
      if (textNode && group.name() === 'sticky-note') {
        const pad = 12; // Default padding
        (textNode as any).position({ x: pad, y: pad });
        (textNode as any).width(Math.max(1, newW - pad * 2));
        (textNode as any).height(Math.max(1, newH - pad * 2));
      }

      // Commit to store
      this.config.storeAdapter.updateElement(group.id() as ElementId, {
        width: newW,
        height: newH
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized rectangular element to ${newW}x${newH}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Rectangular normalization error:', error);
      }
    }
  }

  /**
   * Normalize circular elements (circle, circle-text)
   */
  private normalizeCircularElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const ellipse = group.findOne('Ellipse') || group.findOne('Circle');
      if (!ellipse) return;

      // Use average scale for uniform scaling
      const avgScale = (scaleX + scaleY) / 2;
      
      if (ellipse.getClassName() === 'Ellipse') {
        const currentRadiusX = (ellipse as any).radiusX();
        const currentRadiusY = (ellipse as any).radiusY();
        const newRadiusX = Math.max(1, currentRadiusX * avgScale);
        const newRadiusY = Math.max(1, currentRadiusY * avgScale);

        (ellipse as any).radiusX(newRadiusX);
        (ellipse as any).radiusY(newRadiusY);
        (ellipse as any).position({ x: 0, y: 0 });

        // Update hit area
        this.updateHitArea(group, newRadiusX * 2, newRadiusY * 2);

        // Commit to store
        this.config.storeAdapter.updateElement(group.id() as ElementId, {
          radiusX: newRadiusX,
          radiusY: newRadiusY,
          width: newRadiusX * 2,
          height: newRadiusY * 2
        });
      } else {
        const currentRadius = (ellipse as any).radius();
        const newRadius = Math.max(1, currentRadius * avgScale);

        (ellipse as any).radius(newRadius);
        (ellipse as any).position({ x: 0, y: 0 });

        // Update hit area
        this.updateHitArea(group, newRadius * 2, newRadius * 2);

        // Commit to store
        this.config.storeAdapter.updateElement(group.id() as ElementId, {
          radius: newRadius,
          radiusX: newRadius,
          radiusY: newRadius,
          width: newRadius * 2,
          height: newRadius * 2
        });
      }

      if (this.config.debug?.log) {
        console.info('[SelectionManager] Normalized circular element');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Circular normalization error:', error);
      }
    }
  }

  /**
   * Normalize text elements
   */
  private normalizeTextElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const textNode = group.findOne('Text');
      if (!textNode) return;

      const currentW = (textNode as any).width();
      const currentFontSize = (textNode as any).fontSize();
      const newW = Math.max(20, Math.round(currentW * scaleX));
      const newFontSize = Math.max(8, Math.round(currentFontSize * scaleY));

      // Update text properties
      (textNode as any).width(newW);
      (textNode as any).fontSize(newFontSize);

      // Measure new height
      const measuredH = Math.ceil((textNode as any).height());
      
      // Update hit area
      this.updateHitArea(group, newW, measuredH);

      // Commit to store
      this.config.storeAdapter.updateElement(group.id() as ElementId, {
        width: newW,
        height: measuredH,
        fontSize: newFontSize
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized text element: ${newW}x${measuredH}, fontSize: ${newFontSize}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Text normalization error:', error);
      }
    }
  }

  /**
   * Normalize image elements
   */
  private normalizeImageElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const imageNode = group.findOne('Image') || group.findOne('Rect');
      if (!imageNode) return;

      const currentW = (imageNode as any).width();
      const currentH = (imageNode as any).height();
      const newW = Math.max(1, Math.round(currentW * scaleX));
      const newH = Math.max(1, Math.round(currentH * scaleY));

      // Update image dimensions
      (imageNode as any).width(newW);
      (imageNode as any).height(newH);
      (imageNode as any).position({ x: 0, y: 0 });

      // Update hit area
      this.updateHitArea(group, newW, newH);

      // Commit to store
      this.config.storeAdapter.updateElement(group.id() as ElementId, {
        width: newW,
        height: newH
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized image element to ${newW}x${newH}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Image normalization error:', error);
      }
    }
  }

  /**
   * Normalize table elements
   */
  private normalizeTableElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const frame = group.findOne('Rect.frame');
      if (!frame) return;

      const currentW = (frame as any).width();
      const currentH = (frame as any).height();
      const newW = Math.max(1, Math.round(currentW * scaleX));
      const newH = Math.max(1, Math.round(currentH * scaleY));

      // Update frame
      (frame as any).width(newW);
      (frame as any).height(newH);
      (frame as any).position({ x: 0, y: 0 });

      // Update hit area
      this.updateHitArea(group, newW, newH);

      // Commit to store
      this.config.storeAdapter.updateElement(group.id() as ElementId, {
        width: newW,
        height: newH
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized table element to ${newW}x${newH}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Table normalization error:', error);
      }
    }
  }

  /**
   * Normalize triangle elements
   */
  private normalizeTriangleElement(group: Konva.Group, scaleX: number, scaleY: number): void {
    try {
      const triangle = group.findOne('Line');
      if (!triangle) return;

      const currentPoints = (triangle as any).points();
      if (currentPoints.length < 6) return;

      // Scale triangle points
      const newPoints = currentPoints.map((point: number, index: number) => {
        return index % 2 === 0 ? point * scaleX : point * scaleY;
      });

      (triangle as any).points(newPoints);

      // Calculate new dimensions
      const newW = Math.round(Math.max(...newPoints.filter((_: any, i: number) => i % 2 === 0)));
      const newH = Math.round(Math.max(...newPoints.filter((_: any, i: number) => i % 2 === 1)));

      // Update hit area
      this.updateHitArea(group, newW, newH);

      // Commit to store
      this.config.storeAdapter.updateElement(group.id() as ElementId, {
        width: newW,
        height: newH
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized triangle element to ${newW}x${newH}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Triangle normalization error:', error);
      }
    }
  }

  /**
   * Normalize generic elements
   */
  private normalizeGenericElement(node: Konva.Node, scaleX: number, scaleY: number): void {
    try {
      const currentW = (node as any).width?.() || 100;
      const currentH = (node as any).height?.() || 100;
      const newW = Math.max(1, Math.round(currentW * scaleX));
      const newH = Math.max(1, Math.round(currentH * scaleY));

      if (typeof (node as any).width === 'function') {
        (node as any).width(newW);
      }
      if (typeof (node as any).height === 'function') {
        (node as any).height(newH);
      }

      // Commit to store
      this.config.storeAdapter.updateElement(node.id() as ElementId, {
        width: newW,
        height: newH
      });

      if (this.config.debug?.log) {
        console.info(`[SelectionManager] Normalized generic element to ${newW}x${newH}`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Generic normalization error:', error);
      }
    }
  }

  // Helper methods

  /**
   * Update hit area dimensions
   */
  private updateHitArea(group: Konva.Group, width: number, height: number): void {
    try {
      const hitArea = group.findOne('.hit-area');
      if (hitArea) {
        (hitArea as any).width(width);
        (hitArea as any).height(height);
        (hitArea as any).position({ x: 0, y: 0 });
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[SelectionManager] Hit area update error:', error);
      }
    }
  }

  /**
   * Get anchor name from transformer anchor
   */
  private getAnchorName(anchor: any): string | null {
    try {
      if (!anchor) return null;
      return typeof anchor.name === 'function' ? anchor.name() : anchor.getName?.() || '';
    } catch {
      return null;
    }
  }

  /**
   * Get current transformer
   */
  getTransformer(): Konva.Transformer | null {
    return this.transformer;
  }

  /**
   * Check if transformer is visible
   */
  isTransformerVisible(): boolean {
    return this.transformer?.visible() === true;
  }

  /**
   * Update transformer policies
   */
  updateTransformerPolicies(policies: Partial<ElementTransformerPolicy>): void {
    this.defaultPolicies = { ...this.defaultPolicies, ...policies };
    
    if (this.config.debug?.log) {
      console.info('[SelectionManager] Updated transformer policies');
    }
  }

  /**
   * Update selection manager configuration
   */
  updateConfig(newConfig: Partial<SelectionManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy selection manager and cleanup resources
   */
  destroy(): void {
    try {
      // Remove transformer event listeners
      if (this.transformer) {
        this.transformer.off('transformstart.selectionmanager');
        this.transformer.off('transformend.selectionmanager');
        this.transformer.destroy();
        this.transformer = null;
      }

      // Remove keyboard event listeners
      const handlers = (this as any)._keyHandlers;
      if (handlers) {
        window.removeEventListener('keydown', handlers.onKeyDown);
        window.removeEventListener('keyup', handlers.onKeyUp);
        delete (this as any)._keyHandlers;
      }

      // Clear state
      this.transformState.preTransformRects.clear();
      this.transformState.lastActiveAnchorName = '';

      if (this.config.debug?.log) {
        console.info('[SelectionManager] Selection manager destroyed');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[SelectionManager] Destroy error:', error);
      }
    }
  }
}
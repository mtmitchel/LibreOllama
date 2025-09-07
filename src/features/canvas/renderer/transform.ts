/**
 * Transformer Controller Module
 * Manages Konva transformer behavior, constraints, and normalization
 */

import type Konva from 'konva';
import type { ElementId, CanvasElement, TransformEvent } from './types';

export interface TransformerConfig {
  enabledAnchors?: string[];
  keepRatio?: boolean;
  centeredScaling?: boolean;
  rotateEnabled?: boolean;
  borderStroke?: string;
  borderStrokeWidth?: number;
  anchorSize?: number;
  anchorStroke?: string;
  anchorFill?: string;
  padding?: number;
}

export class TransformerController {
  private transformer: Konva.Transformer | null = null;
  private selectedNodes: Set<Konva.Node> = new Set();
  private transformStartCallback?: (event: TransformEvent) => void;
  private transformEndCallback?: (event: TransformEvent) => void;
  private lastActiveAnchor: string = '';
  private preTransformAttrs = new Map<string, any>();

  constructor(private config: TransformerConfig = {}) {
    this.config = {
      borderStroke: '#007AFF',
      borderStrokeWidth: 2,
      anchorSize: 8,
      anchorStroke: '#007AFF',
      anchorFill: 'white',
      padding: 5,
      ...config
    };
  }

  /**
   * Initialize transformer with a Konva layer
   */
  init(layer: Konva.Layer): Konva.Transformer {
    this.transformer = new Konva.Transformer({
      borderStroke: this.config.borderStroke,
      borderStrokeWidth: this.config.borderStrokeWidth,
      anchorSize: this.config.anchorSize,
      anchorStroke: this.config.anchorStroke,
      anchorFill: this.config.anchorFill,
      padding: this.config.padding,
      rotateEnabled: this.config.rotateEnabled ?? true,
      ignoreStroke: true,
      shouldOverdrawWholeArea: true
    });

    layer.add(this.transformer);
    this.setupEventHandlers();

    return this.transformer;
  }

  /**
   * Set callbacks for transform events
   */
  setCallbacks(callbacks: {
    onTransformStart?: (event: TransformEvent) => void;
    onTransformEnd?: (event: TransformEvent) => void;
  }): void {
    this.transformStartCallback = callbacks.onTransformStart;
    this.transformEndCallback = callbacks.onTransformEnd;
  }

  /**
   * Attach transformer to nodes
   */
  attach(nodes: Konva.Node | Konva.Node[]): void {
    if (!this.transformer) return;

    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
    this.selectedNodes = new Set(nodeArray);
    
    // Apply constraints based on node types
    nodeArray.forEach(node => this.applyNodeConstraints(node));
    
    this.transformer.nodes(nodeArray);
    this.transformer.getLayer()?.batchDraw();
  }

  /**
   * Detach transformer from all nodes
   */
  detach(): void {
    if (!this.transformer) return;

    this.selectedNodes.clear();
    this.transformer.nodes([]);
    this.transformer.getLayer()?.batchDraw();
  }

  /**
   * Update transformer for specific element type
   */
  updateForElement(element: CanvasElement): void {
    if (!this.transformer) return;

    switch (element.type) {
      case 'circle':
        this.configureForCircle();
        break;
      case 'rectangle':
      case 'sticky-note':
        this.configureForRectangle();
        break;
      case 'text':
        this.configureForText();
        break;
      case 'image':
        this.configureForImage();
        break;
      case 'table':
        this.configureForTable();
        break;
      default:
        this.configureDefault();
    }
  }

  /**
   * Configure transformer for circle elements
   */
  private configureForCircle(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(true);
    this.transformer.enabledAnchors(['bottom-right']);
    this.transformer.centeredScaling(true);
    this.transformer.rotateEnabled(false);
  }

  /**
   * Configure transformer for rectangle elements
   */
  private configureForRectangle(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(false);
    this.transformer.enabledAnchors([
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
      'middle-left', 'middle-right', 'top-center', 'bottom-center'
    ]);
    this.transformer.centeredScaling(false);
    this.transformer.rotateEnabled(true);
  }

  /**
   * Configure transformer for text elements
   */
  private configureForText(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(false);
    this.transformer.enabledAnchors(['middle-left', 'middle-right']);
    this.transformer.centeredScaling(false);
    this.transformer.rotateEnabled(false);
    this.transformer.boundBoxFunc((oldBox, newBox) => {
      // Minimum width constraint
      if (newBox.width < 50) {
        return oldBox;
      }
      return newBox;
    });
  }

  /**
   * Configure transformer for image elements
   */
  private configureForImage(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(true);
    this.transformer.enabledAnchors([
      'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ]);
    this.transformer.centeredScaling(false);
    this.transformer.rotateEnabled(true);
  }

  /**
   * Configure transformer for table elements
   */
  private configureForTable(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(false);
    this.transformer.enabledAnchors([]);  // No resizing for tables
    this.transformer.rotateEnabled(false);
  }

  /**
   * Configure default transformer settings
   */
  private configureDefault(): void {
    if (!this.transformer) return;

    this.transformer.keepRatio(false);
    this.transformer.enabledAnchors([
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
      'middle-left', 'middle-right', 'top-center', 'bottom-center'
    ]);
    this.transformer.centeredScaling(false);
    this.transformer.rotateEnabled(true);
  }

  /**
   * Apply node-specific constraints
   */
  private applyNodeConstraints(node: Konva.Node): void {
    if (!this.transformer) return;

    const elementId = node.id();
    
    // Store pre-transform attributes
    this.preTransformAttrs.set(elementId, {
      x: node.x(),
      y: node.y(),
      width: node.width(),
      height: node.height(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation()
    });

    // Apply type-specific constraints
    const type = node.getAttr('elementType');
    if (type) {
      this.updateForElement({ type, id: elementId as ElementId } as CanvasElement);
    }
  }

  /**
   * Setup event handlers for transformer
   */
  private setupEventHandlers(): void {
    if (!this.transformer) return;

    // Track active anchor
    this.transformer.on('transformstart', (e) => {
      this.lastActiveAnchor = e.evt ? this.getActiveAnchor(e.evt) : '';
      
      // Trigger callback
      if (this.transformStartCallback) {
        const node = e.target;
        const elementId = node.id() as ElementId;
        const oldAttrs = this.preTransformAttrs.get(node.id()) || {};
        
        this.transformStartCallback({
          elementId,
          oldAttrs,
          newAttrs: oldAttrs  // Same at start
        });
      }
    });

    // Handle transform end
    this.transformer.on('transformend', (e) => {
      const node = e.target;
      const elementId = node.id() as ElementId;
      
      // Normalize transform (convert scale to size)
      this.normalizeTransform(node);
      
      // Trigger callback
      if (this.transformEndCallback) {
        const oldAttrs = this.preTransformAttrs.get(node.id()) || {};
        const newAttrs = {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          rotation: node.rotation(),
          scaleX: 1,
          scaleY: 1
        };
        
        this.transformEndCallback({
          elementId,
          oldAttrs,
          newAttrs
        });
      }
      
      this.lastActiveAnchor = '';
    });

    // Handle transform for circles
    this.transformer.on('transform', (e) => {
      const node = e.target;
      const type = node.getAttr('elementType');
      
      if (type === 'circle') {
        this.handleCircleTransform(node);
      }
    });
  }

  /**
   * Handle circle-specific transform
   */
  private handleCircleTransform(node: Konva.Node): void {
    // For circles, maintain center position during scaling
    const group = node as Konva.Group;
    const ellipse = group.findOne('Ellipse');
    
    if (ellipse && this.lastActiveAnchor === 'bottom-right') {
      // Calculate new radius from scale
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();
      const currentRadiusX = ellipse.radiusX();
      const currentRadiusY = ellipse.radiusY();
      
      const newRadius = Math.max(
        currentRadiusX * scaleX,
        currentRadiusY * scaleY
      );
      
      // Apply uniform radius (maintain circle shape)
      ellipse.radiusX(newRadius);
      ellipse.radiusY(newRadius);
      
      // Reset scale
      group.scaleX(1);
      group.scaleY(1);
    }
  }

  /**
   * Normalize transform by converting scale to size
   */
  private normalizeTransform(node: Konva.Node): void {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    if (scaleX !== 1 || scaleY !== 1) {
      // Apply scale to size
      const width = node.width() * scaleX;
      const height = node.height() * scaleY;
      
      node.width(width);
      node.height(height);
      node.scaleX(1);
      node.scaleY(1);
      
      // Update children if it's a group
      if (node instanceof Konva.Group) {
        node.children.forEach(child => {
          if (child.className === 'Ellipse') {
            const ellipse = child as Konva.Ellipse;
            ellipse.radiusX(ellipse.radiusX() * scaleX);
            ellipse.radiusY(ellipse.radiusY() * scaleY);
          } else if (child.className === 'Rect' || child.className === 'Text') {
            child.width(child.width() * scaleX);
            child.height(child.height() * scaleY);
          }
        });
      }
    }
  }

  /**
   * Get active anchor from event
   */
  private getActiveAnchor(evt: any): string {
    if (!this.transformer) return '';
    
    const anchorNode = this.transformer.getActiveAnchor();
    if (!anchorNode) return '';
    
    return anchorNode.name() || '';
  }

  /**
   * Show/hide transformer
   */
  setVisible(visible: boolean): void {
    if (!this.transformer) return;
    
    this.transformer.visible(visible);
    this.transformer.getLayer()?.batchDraw();
  }

  /**
   * Force redraw transformer
   */
  forceUpdate(): void {
    if (!this.transformer) return;
    
    this.transformer.forceUpdate();
    this.transformer.getLayer()?.batchDraw();
  }

  /**
   * Dispose of transformer
   */
  dispose(): void {
    if (this.transformer) {
      this.transformer.destroy();
      this.transformer = null;
    }
    this.selectedNodes.clear();
    this.preTransformAttrs.clear();
  }
}
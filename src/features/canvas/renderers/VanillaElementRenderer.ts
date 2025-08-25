/**
 * VanillaElementRenderer - Base class for all vanilla Konva element renderers
 * 
 * This abstract base class defines the interface and common functionality
 * for rendering canvas elements using vanilla Konva instead of React-Konva.
 */

import Konva from 'konva';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import { ElementCallbacks, RendererContext } from './ElementRendererFactory';

export abstract class VanillaElementRenderer<T extends CanvasElement> {
  protected konvaNode: Konva.Node | null = null;
  protected konvaGroup: Konva.Group | null = null;
  protected isDestroyed = false;

  constructor(
    protected element: T,
    protected context: RendererContext
  ) {}

  /**
   * Create and return the main Konva node for this element
   * This method must be implemented by subclasses
   */
  abstract createKonvaNode(): Konva.Node;

  /**
   * Update the Konva node properties based on element changes
   * This method should be implemented by subclasses
   */
  abstract updateKonvaNode(element: T): void;

  /**
   * Render the element and add it to the layer
   */
  render(): Konva.Node | null {
    if (this.isDestroyed) {
      console.warn('Cannot render destroyed element renderer');
      return null;
    }

    try {
      // Create the main Konva node
      this.konvaNode = this.createKonvaNode();
      
      if (!this.konvaNode) {
        console.error('Failed to create Konva node for element:', this.element.id);
        return null;
      }

      // Set common properties
      this.setupCommonProperties();
      
      // Bind events
      this.bindEvents();
      
      // Add to layer
      this.context.layer.add(this.konvaNode);
      
      return this.konvaNode;
    } catch (error) {
      console.error('Error rendering element:', this.element.id, error);
      return null;
    }
  }

  /**
   * Update the element with new data
   */
  update(element: T): void {
    if (this.isDestroyed || !this.konvaNode) {
      return;
    }

    try {
      this.element = element;
      this.updateKonvaNode(element);
      this.setupCommonProperties();
      
      // Trigger layer redraw
      this.context.layer.batchDraw();
    } catch (error) {
      console.error('Error updating element:', this.element.id, error);
    }
  }

  /**
   * Remove the element from the canvas and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      // Remove event listeners
      this.unbindEvents();
      
      // Remove from layer
      if (this.konvaNode) {
        this.konvaNode.remove();
        this.konvaNode.destroy();
        this.konvaNode = null;
      }

      if (this.konvaGroup) {
        this.konvaGroup.remove();
        this.konvaGroup.destroy();
        this.konvaGroup = null;
      }

      this.isDestroyed = true;
    } catch (error) {
      console.error('Error destroying element:', this.element.id, error);
    }
  }

  /**
   * Get the main Konva node
   */
  getKonvaNode(): Konva.Node | null {
    return this.konvaNode;
  }

  /**
   * Get the element data
   */
  getElement(): T {
    return this.element;
  }

  /**
   * Check if the renderer is destroyed
   */
  getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Setup common properties that apply to all elements
   */
  protected setupCommonProperties(): void {
    if (!this.konvaNode) return;

    // Position
    this.konvaNode.x(this.element.x || 0);
    this.konvaNode.y(this.element.y || 0);

    // Transformation
    if (this.element.rotation !== undefined) {
      this.konvaNode.rotation(this.element.rotation);
    }

    if (this.element.scaleX !== undefined) {
      this.konvaNode.scaleX(this.element.scaleX);
    }

    if (this.element.scaleY !== undefined) {
      this.konvaNode.scaleY(this.element.scaleY);
    }

    // Visibility and interaction
    this.konvaNode.visible(this.element.visible !== false);
    this.konvaNode.listening(this.element.listening !== false);

    // Dragging
    this.konvaNode.draggable(this.element.draggable === true);

    // Opacity
    if (this.element.opacity !== undefined) {
      this.konvaNode.opacity(this.element.opacity);
    }

    // Element identification
    this.konvaNode.id(this.element.id);
    this.konvaNode.name(this.element.type);

    // Store element reference on Konva node for easy access
    (this.konvaNode as any).elementData = this.element;
  }

  /**
   * Bind event handlers to the Konva node
   */
  protected bindEvents(): void {
    if (!this.konvaNode) return;

    // Click events
    this.konvaNode.on('click', this.handleClick.bind(this));
    this.konvaNode.on('tap', this.handleClick.bind(this));

    // Drag events
    this.konvaNode.on('dragend', this.handleDragEnd.bind(this));

    // Mouse events for hover effects
    this.konvaNode.on('mouseenter', this.handleMouseEnter.bind(this));
    this.konvaNode.on('mouseleave', this.handleMouseLeave.bind(this));

    // Double click for text editing
    this.konvaNode.on('dblclick', this.handleDoubleClick.bind(this));
  }

  /**
   * Remove event handlers from the Konva node
   */
  protected unbindEvents(): void {
    if (!this.konvaNode) return;

    this.konvaNode.off('click');
    this.konvaNode.off('tap');
    this.konvaNode.off('dragend');
    this.konvaNode.off('mouseenter');
    this.konvaNode.off('mouseleave');
    this.konvaNode.off('dblclick');
  }

  /**
   * Handle click events
   */
  protected handleClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    e.cancelBubble = true;
    this.context.callbacks.onElementClick(e, this.element);
  }

  /**
   * Handle drag end events
   */
  protected handleDragEnd(e: Konva.KonvaEventObject<DragEvent>): void {
    this.context.callbacks.onElementDragEnd(e, this.element.id);
  }

  /**
   * Handle mouse enter events (for hover effects)
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    // Default hover effect - can be overridden by subclasses
    if (this.konvaNode) {
      this.context.stage.container().style.cursor = 'pointer';
    }
  }

  /**
   * Handle mouse leave events
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    // Reset cursor
    this.context.stage.container().style.cursor = 'default';
  }

  /**
   * Handle double click events (typically for text editing)
   */
  protected handleDoubleClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    e.cancelBubble = true;
    this.context.callbacks.onStartTextEdit(this.element.id);
  }

  /**
   * Helper method to create a group container for complex elements
   */
  protected createGroup(): Konva.Group {
    if (!this.konvaGroup) {
      this.konvaGroup = new Konva.Group({
        id: `${this.element.id}-group`,
        name: `${this.element.type}-group`
      });
    }
    return this.konvaGroup;
  }

  /**
   * Helper method to apply stroke properties
   */
  protected applyStrokeProperties(node: Konva.Shape, element: any): void {
    if (element.stroke) {
      node.stroke(element.stroke);
    }
    if (element.strokeWidth !== undefined) {
      node.strokeWidth(element.strokeWidth);
    }
    if (element.strokeDashArray) {
      node.dash(element.strokeDashArray);
    }
  }

  /**
   * Helper method to apply fill properties
   */
  protected applyFillProperties(node: Konva.Shape, element: any): void {
    if (element.fill) {
      node.fill(element.fill);
    }
  }
}

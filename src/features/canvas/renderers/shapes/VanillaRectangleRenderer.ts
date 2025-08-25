/**
 * VanillaRectangleRenderer - Vanilla Konva renderer for rectangle elements
 * 
 * Replaces the React-Konva RectangleShape component with direct Konva.Rect usage
 */

import Konva from 'konva';
import { RectangleElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaRectangleRenderer extends VanillaElementRenderer<RectangleElement> {
  private rectangle: Konva.Rect | null = null;

  createKonvaNode(): Konva.Node {
    this.rectangle = new Konva.Rect({
      x: 0, // Position will be set by setupCommonProperties
      y: 0,
      width: this.element.width || 100,
      height: this.element.height || 100,
    });

    this.updateKonvaNode(this.element);
    return this.rectangle;
  }

  updateKonvaNode(element: RectangleElement): void {
    if (!this.rectangle) return;

    // Update rectangle-specific properties
    this.rectangle.width(element.width || 100);
    this.rectangle.height(element.height || 100);

    // Apply visual properties
    this.applyFillProperties(this.rectangle, element);
    this.applyStrokeProperties(this.rectangle, element);

    // Corner radius
    if (element.cornerRadius !== undefined) {
      this.rectangle.cornerRadius(element.cornerRadius);
    }

    // Shadow properties
    if (element.shadowColor) {
      this.rectangle.shadowColor(element.shadowColor);
      this.rectangle.shadowBlur(element.shadowBlur || 10);
      this.rectangle.shadowOffset({
        x: element.shadowOffsetX || 4,
        y: element.shadowOffsetY || 4
      });
      this.rectangle.shadowOpacity(element.shadowOpacity || 0.3);
    } else {
      // Clear shadow if not specified
      this.rectangle.shadowColor('');
    }

    // Performance optimizations
    this.rectangle.perfectDrawEnabled(false);
    this.rectangle.shadowForStrokeEnabled(false);
  }

  /**
   * Override mouse enter for rectangle-specific hover effects
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseEnter(e);
    
    // Add subtle hover effect for rectangles
    if (this.rectangle && !this.element.selected) {
      this.rectangle.opacity((this.element.opacity || 1) * 0.8);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Override mouse leave to reset hover effects
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseLeave(e);
    
    // Reset hover effect
    if (this.rectangle) {
      this.rectangle.opacity(this.element.opacity || 1);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Get the Konva rectangle node
   */
  getRectangle(): Konva.Rect | null {
    return this.rectangle;
  }

  /**
   * Update rectangle dimensions
   */
  updateDimensions(width: number, height: number): void {
    if (this.rectangle) {
      this.rectangle.width(width);
      this.rectangle.height(height);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { width, height });
    }
  }

  /**
   * Update rectangle corner radius
   */
  updateCornerRadius(cornerRadius: number): void {
    if (this.rectangle) {
      this.rectangle.cornerRadius(cornerRadius);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { cornerRadius });
    }
  }
}

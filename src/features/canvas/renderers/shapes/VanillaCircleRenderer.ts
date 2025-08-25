/**
 * VanillaCircleRenderer - Vanilla Konva renderer for circle elements
 * 
 * Replaces the React-Konva CircleShape component with direct Konva.Circle usage
 */

import Konva from 'konva';
import { CircleElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaCircleRenderer extends VanillaElementRenderer<CircleElement> {
  private circle: Konva.Circle | null = null;

  createKonvaNode(): Konva.Node {
    this.circle = new Konva.Circle({
      x: 0, // Position will be set by setupCommonProperties
      y: 0,
      radius: this.element.radius || 50,
    });

    this.updateKonvaNode(this.element);
    return this.circle;
  }

  updateKonvaNode(element: CircleElement): void {
    if (!this.circle) return;

    // Update circle-specific properties
    this.circle.radius(element.radius || 50);

    // Apply visual properties
    this.applyFillProperties(this.circle, element);
    this.applyStrokeProperties(this.circle, element);

    // Shadow properties
    if (element.shadowColor) {
      this.circle.shadowColor(element.shadowColor);
      this.circle.shadowBlur(element.shadowBlur || 10);
      this.circle.shadowOffset({
        x: element.shadowOffsetX || 4,
        y: element.shadowOffsetY || 4
      });
      this.circle.shadowOpacity(element.shadowOpacity || 0.3);
    } else {
      // Clear shadow if not specified
      this.circle.shadowColor('');
    }

    // Performance optimizations
    this.circle.perfectDrawEnabled(false);
    this.circle.shadowForStrokeEnabled(false);
  }

  /**
   * Override mouse enter for circle-specific hover effects
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseEnter(e);
    
    // Add subtle scale effect for circles
    if (this.circle && !this.element.selected) {
      this.circle.scaleX(1.05);
      this.circle.scaleY(1.05);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Override mouse leave to reset hover effects
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseLeave(e);
    
    // Reset scale effect
    if (this.circle) {
      this.circle.scaleX(this.element.scaleX || 1);
      this.circle.scaleY(this.element.scaleY || 1);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Get the Konva circle node
   */
  getCircle(): Konva.Circle | null {
    return this.circle;
  }

  /**
   * Update circle radius
   */
  updateRadius(radius: number): void {
    if (this.circle) {
      this.circle.radius(radius);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { radius });
    }
  }
}

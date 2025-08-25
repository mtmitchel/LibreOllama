/**
 * VanillaTriangleRenderer - Vanilla Konva renderer for triangle elements
 * 
 * Replaces the React-Konva TriangleShape component with direct Konva.Line usage
 */

import Konva from 'konva';
import { TriangleElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaTriangleRenderer extends VanillaElementRenderer<TriangleElement> {
  private triangle: Konva.Line | null = null;

  createKonvaNode(): Konva.Node {
    // Create triangle using Line with closed path
    this.triangle = new Konva.Line({
      x: 0, // Position will be set by setupCommonProperties
      y: 0,
      closed: true,
      listening: true,
    });

    this.updateKonvaNode(this.element);
    return this.triangle;
  }

  updateKonvaNode(element: TriangleElement): void {
    if (!this.triangle) return;

    // Calculate triangle points based on width and height
    const width = element.width || 100;
    const height = element.height || 100;
    
    // Define triangle points (equilateral triangle pointing up)
    const points = [
      width / 2, 0,           // Top point
      0, height,              // Bottom left
      width, height,          // Bottom right
    ];

    this.triangle.points(points);

    // Apply visual properties
    this.applyFillProperties(this.triangle, element);
    this.applyStrokeProperties(this.triangle, element);

    // Line join for smoother corners
    this.triangle.lineJoin('round');
    this.triangle.lineCap('round');

    // Shadow properties
    if (element.shadowColor) {
      this.triangle.shadowColor(element.shadowColor);
      this.triangle.shadowBlur(element.shadowBlur || 10);
      this.triangle.shadowOffset({
        x: element.shadowOffsetX || 4,
        y: element.shadowOffsetY || 4
      });
      this.triangle.shadowOpacity(element.shadowOpacity || 0.3);
    } else {
      // Clear shadow if not specified
      this.triangle.shadowColor('');
    }

    // Performance optimizations
    this.triangle.perfectDrawEnabled(false);
    this.triangle.shadowForStrokeEnabled(false);
  }

  /**
   * Override mouse enter for triangle-specific hover effects
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseEnter(e);
    
    // Add subtle glow effect for triangles
    if (this.triangle && !this.element.selected) {
      this.triangle.strokeWidth((this.element.strokeWidth || 2) * 1.5);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Override mouse leave to reset hover effects
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseLeave(e);
    
    // Reset stroke width
    if (this.triangle) {
      this.triangle.strokeWidth(this.element.strokeWidth || 2);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Get the Konva triangle node
   */
  getTriangle(): Konva.Line | null {
    return this.triangle;
  }

  /**
   * Update triangle dimensions
   */
  updateDimensions(width: number, height: number): void {
    if (this.triangle) {
      // Recalculate points
      const points = [
        width / 2, 0,           // Top point
        0, height,              // Bottom left
        width, height,          // Bottom right
      ];
      
      this.triangle.points(points);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { width, height });
    }
  }
}

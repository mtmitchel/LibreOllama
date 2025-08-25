/**
 * VanillaPenRenderer - Vanilla Konva renderer for pen/drawing elements
 * 
 * Replaces the React-Konva PenShape component with direct Konva.Line usage
 */

import Konva from 'konva';
import { PenElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaPenRenderer extends VanillaElementRenderer<PenElement> {
  private line: Konva.Line | null = null;

  createKonvaNode(): Konva.Node {
    this.line = new Konva.Line({
      x: 0, // Position will be set by setupCommonProperties
      y: 0,
      points: this.element.points || [],
      listening: true,
    });

    this.updateKonvaNode(this.element);
    return this.line;
  }

  updateKonvaNode(element: PenElement): void {
    if (!this.line) return;

    // Update line points
    this.line.points(element.points || []);

    // Line styling
    this.line.stroke(element.stroke || '#000000');
    this.line.strokeWidth(element.strokeWidth || 2);
    
    // Line properties for smooth drawing
    this.line.lineCap('round');
    this.line.lineJoin('round');
    this.line.tension(element.tension || 0.5);

    // Global composite operation for different drawing modes
    if (element.globalCompositeOperation) {
      this.line.globalCompositeOperation(element.globalCompositeOperation);
    }

    // Opacity
    if (element.opacity !== undefined) {
      this.line.opacity(element.opacity);
    }

    // Dash pattern for different pen styles
    if (element.dash) {
      this.line.dash(element.dash);
    }

    // Shadow for artistic effects
    if (element.shadowColor) {
      this.line.shadowColor(element.shadowColor);
      this.line.shadowBlur(element.shadowBlur || 5);
      this.line.shadowOffset({
        x: element.shadowOffsetX || 1,
        y: element.shadowOffsetY || 1
      });
      this.line.shadowOpacity(element.shadowOpacity || 0.3);
    } else {
      this.line.shadowColor('');
    }

    // Performance optimizations for drawing
    this.line.perfectDrawEnabled(false);
    this.line.shadowForStrokeEnabled(false);
  }

  /**
   * Override mouse enter for pen-specific hover effects
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseEnter(e);
    
    // Highlight the stroke on hover
    if (this.line && !this.element.selected) {
      this.line.strokeWidth((this.element.strokeWidth || 2) * 1.2);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Override mouse leave to reset hover effects
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseLeave(e);
    
    // Reset stroke width
    if (this.line) {
      this.line.strokeWidth(this.element.strokeWidth || 2);
      this.context.layer.batchDraw();
    }
  }

  /**
   * Get the Konva line node
   */
  getLine(): Konva.Line | null {
    return this.line;
  }

  /**
   * Add points to the existing drawing
   */
  addPoints(newPoints: number[]): void {
    if (this.line) {
      const currentPoints = this.line.points();
      const updatedPoints = [...currentPoints, ...newPoints];
      this.line.points(updatedPoints);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { 
        points: updatedPoints 
      });
    }
  }

  /**
   * Update stroke properties
   */
  updateStroke(stroke: string, strokeWidth?: number): void {
    if (this.line) {
      this.line.stroke(stroke);
      if (strokeWidth !== undefined) {
        this.line.strokeWidth(strokeWidth);
      }
      this.context.layer.batchDraw();

      // Update element data
      const updates: any = { stroke };
      if (strokeWidth !== undefined) {
        updates.strokeWidth = strokeWidth;
      }
      this.context.callbacks.onElementUpdate(this.element.id, updates);
    }
  }

  /**
   * Get the bounding box of the drawn path
   */
  getPathBounds(): { x: number; y: number; width: number; height: number } {
    if (this.line) {
      const clientRect = this.line.getClientRect();
      return {
        x: clientRect.x,
        y: clientRect.y,
        width: clientRect.width,
        height: clientRect.height
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * Simplify the path by reducing points (useful for performance)
   */
  simplifyPath(tolerance = 2): void {
    if (this.line && this.element.points) {
      const points = this.element.points;
      const simplifiedPoints = this.douglasPeuckerSimplification(points, tolerance);
      
      this.line.points(simplifiedPoints);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { 
        points: simplifiedPoints 
      });
    }
  }

  /**
   * Douglas-Peucker line simplification algorithm
   */
  private douglasPeuckerSimplification(points: number[], tolerance: number): number[] {
    if (points.length <= 4) return points; // Need at least 2 points (4 coordinates)

    const simplified: number[] = [];
    
    // Add first point
    simplified.push(points[0], points[1]);
    
    // Simplify middle points
    this.simplifyRecursive(points, 0, points.length - 2, tolerance, simplified);
    
    // Add last point
    simplified.push(points[points.length - 2], points[points.length - 1]);
    
    return simplified;
  }

  private simplifyRecursive(
    points: number[], 
    start: number, 
    end: number, 
    tolerance: number, 
    simplified: number[]
  ): void {
    if (end - start <= 2) return;

    let maxDistance = 0;
    let maxIndex = start;

    for (let i = start + 2; i < end; i += 2) {
      const distance = this.perpendicularDistance(
        points[i], points[i + 1],
        points[start], points[start + 1],
        points[end], points[end + 1]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      this.simplifyRecursive(points, start, maxIndex, tolerance, simplified);
      simplified.push(points[maxIndex], points[maxIndex + 1]);
      this.simplifyRecursive(points, maxIndex, end, tolerance, simplified);
    }
  }

  private perpendicularDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const norm = Math.sqrt(dx * dx + dy * dy);
    
    if (norm === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    return Math.abs((py - y1) * dx - (px - x1) * dy) / norm;
  }
}

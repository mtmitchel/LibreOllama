/**
 * VanillaTextRenderer - Vanilla Konva renderer for text elements
 * 
 * Replaces the React-Konva TextShape component with direct Konva.Text usage
 */

import Konva from 'konva';
import { TextElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaTextRenderer extends VanillaElementRenderer<TextElement> {
  private text: Konva.Text | null = null;

  createKonvaNode(): Konva.Node {
    this.text = new Konva.Text({
      x: 0, // Position will be set by setupCommonProperties
      y: 0,
      text: this.element.text || 'Text',
      listening: true,
    });

    this.updateKonvaNode(this.element);
    return this.text;
  }

  updateKonvaNode(element: TextElement): void {
    if (!this.text) return;

    // Update text content
    this.text.text(element.text || 'Text');

    // Font properties
    this.text.fontSize(element.fontSize || 16);
    this.text.fontFamily(element.fontFamily || 'Arial');
    this.text.fontStyle(element.fontStyle || 'normal');
    this.text.fontVariant(element.fontVariant || 'normal');

    // Text styling
    this.text.fill(element.fill || '#000000');
    this.text.align(element.align || 'left');
    this.text.verticalAlign(element.verticalAlign || 'top');

    // Text decoration
    if (element.textDecoration) {
      this.text.textDecoration(element.textDecoration);
    }

    // Line height and letter spacing
    if (element.lineHeight !== undefined) {
      this.text.lineHeight(element.lineHeight);
    }
    if (element.letterSpacing !== undefined) {
      this.text.letterSpacing(element.letterSpacing);
    }

    // Text wrapping
    if (element.width) {
      this.text.width(element.width);
      this.text.wrap('word');
    } else {
      this.text.width(undefined);
      this.text.wrap('none');
    }

    // Stroke properties for text outline
    if (element.stroke) {
      this.text.stroke(element.stroke);
      this.text.strokeWidth(element.strokeWidth || 1);
    }

    // Shadow properties
    if (element.shadowColor) {
      this.text.shadowColor(element.shadowColor);
      this.text.shadowBlur(element.shadowBlur || 2);
      this.text.shadowOffset({
        x: element.shadowOffsetX || 1,
        y: element.shadowOffsetY || 1
      });
      this.text.shadowOpacity(element.shadowOpacity || 0.5);
    } else {
      this.text.shadowColor('');
    }

    // Performance optimizations
    this.text.perfectDrawEnabled(false);
  }

  /**
   * Override double click to enable text editing
   */
  protected handleDoubleClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleDoubleClick(e);
    
    // Text elements support inline editing
    this.context.callbacks.onStartTextEdit(this.element.id);
  }

  /**
   * Override mouse enter for text-specific hover effects
   */
  protected handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseEnter(e);
    
    // Change cursor to text cursor for text elements
    this.context.stage.container().style.cursor = 'text';
    
    // Add subtle underline effect
    if (this.text && !this.element.selected) {
      this.text.textDecoration('underline');
      this.context.layer.batchDraw();
    }
  }

  /**
   * Override mouse leave to reset hover effects
   */
  protected handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>): void {
    super.handleMouseLeave(e);
    
    // Reset text decoration
    if (this.text) {
      this.text.textDecoration(this.element.textDecoration || '');
      this.context.layer.batchDraw();
    }
  }

  /**
   * Get the Konva text node
   */
  getText(): Konva.Text | null {
    return this.text;
  }

  /**
   * Update text content
   */
  updateText(text: string): void {
    if (this.text) {
      this.text.text(text);
      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, { text });
    }
  }

  /**
   * Update text styling
   */
  updateTextStyle(style: Partial<{
    fontSize: number;
    fontFamily: string;
    fontStyle: string;
    fill: string;
    align: string;
  }>): void {
    if (this.text) {
      if (style.fontSize !== undefined) {
        this.text.fontSize(style.fontSize);
      }
      if (style.fontFamily !== undefined) {
        this.text.fontFamily(style.fontFamily);
      }
      if (style.fontStyle !== undefined) {
        this.text.fontStyle(style.fontStyle);
      }
      if (style.fill !== undefined) {
        this.text.fill(style.fill);
      }
      if (style.align !== undefined) {
        this.text.align(style.align);
      }

      this.context.layer.batchDraw();

      // Update element data
      this.context.callbacks.onElementUpdate(this.element.id, style);
    }
  }

  /**
   * Get text dimensions
   */
  getTextDimensions(): { width: number; height: number } {
    if (this.text) {
      return {
        width: this.text.width(),
        height: this.text.height()
      };
    }
    return { width: 0, height: 0 };
  }
}

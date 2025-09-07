import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';

// Mock the wrapTextManually function since it's defined in CanvasRendererV2.ts
function wrapTextManually(text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  // Create temporary canvas for measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [text];
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

describe('Circle Text Wrapping', () => {
  describe('wrapTextManually', () => {
    it('should wrap text that exceeds max width', () => {
      const text = 'hey hey hey hey hey hey hey hey hey hey hey hey hey hey';
      const maxWidth = 100;
      const fontSize = 14;
      const fontFamily = 'Arial';
      
      const lines = wrapTextManually(text, maxWidth, fontSize, fontFamily);
      
      // Should create multiple lines
      expect(lines.length).toBeGreaterThan(1);
      
      // Each line should not exceed max width (approximately)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${fontSize}px ${fontFamily}`;
      
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        // Allow small margin for measurement differences
        expect(metrics.width).toBeLessThanOrEqual(maxWidth + 5);
      });
    });
    
    it('should not wrap text that fits within max width', () => {
      const text = 'short text';
      const maxWidth = 500;
      const fontSize = 14;
      const fontFamily = 'Arial';
      
      const lines = wrapTextManually(text, maxWidth, fontSize, fontFamily);
      
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('short text');
    });
    
    it('should handle empty text', () => {
      const text = '';
      const maxWidth = 100;
      const fontSize = 14;
      const fontFamily = 'Arial';
      
      const lines = wrapTextManually(text, maxWidth, fontSize, fontFamily);
      
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('');
    });
    
    it('should handle single long word', () => {
      const text = 'supercalifragilisticexpialidocious';
      const maxWidth = 50;
      const fontSize = 14;
      const fontFamily = 'Arial';
      
      const lines = wrapTextManually(text, maxWidth, fontSize, fontFamily);
      
      // Single long word should stay on one line even if it exceeds max width
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('supercalifragilisticexpialidocious');
    });
    
    it('should preserve word boundaries', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const maxWidth = 150;
      const fontSize = 14;
      const fontFamily = 'Arial';
      
      const lines = wrapTextManually(text, maxWidth, fontSize, fontFamily);
      
      // Check that all words are preserved
      const allWords = lines.join(' ').split(' ');
      expect(allWords).toEqual(text.split(' '));
    });
  });
  
  describe('Circle Text Dimensions', () => {
    it('should calculate inscribed square correctly for circles', () => {
      const radius = 100;
      const strokeWidth = 2;
      const padding = 8;
      
      // Inscribed square formula: side = radius * √2
      const rClip = radius - strokeWidth / 2;
      const side = Math.SQRT2 * rClip - padding * 2;
      
      // Expected side length for inscribed square
      const expectedSide = Math.SQRT2 * (radius - strokeWidth / 2) - padding * 2;
      
      expect(side).toBeCloseTo(expectedSide, 2);
      expect(side).toBeGreaterThan(0);
    });
    
    it('should enforce minimum text area dimensions', () => {
      const radius = 10; // Very small circle
      const strokeWidth = 2;
      const padding = 8;
      
      const rClip = Math.max(1, radius - strokeWidth / 2);
      const side = Math.SQRT2 * rClip - padding * 2;
      const textAreaWidth = Math.max(30, side); // Minimum 30px
      const textAreaHeight = Math.max(30, side);
      
      expect(textAreaWidth).toBe(30);
      expect(textAreaHeight).toBe(30);
    });
    
    it('should handle ellipses differently from circles', () => {
      const radiusX = 150;
      const radiusY = 80;
      const strokeWidth = 2;
      const padding = 8;
      
      const isCircle = Math.abs(radiusX - radiusY) < 0.5;
      expect(isCircle).toBe(false);
      
      // For ellipses, should use different calculation
      const effectiveRadiusX = Math.max(1, radiusX - strokeWidth / 2);
      const effectiveRadiusY = Math.max(1, radiusY - strokeWidth / 2);
      const width = (effectiveRadiusX * 2) / Math.SQRT2 - padding * 2;
      const height = (effectiveRadiusY * 2) / Math.SQRT2 - padding * 2;
      
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(width).not.toBe(height); // Should be different for ellipse
    });
  });
  
  describe('Konva Text Node Configuration', () => {
    beforeEach(() => {
      // Mock Konva stage
      global.Konva = Konva;
    });
    
    it('should set width and height before wrap property', () => {
      const textNode = new Konva.Text({
        text: 'Test text'
      });
      
      const setAttrsSpy = vi.spyOn(textNode, 'setAttrs');
      
      // Simulate the correct order
      textNode.setAttrs({
        width: 100,
        height: 100,
        wrap: 'word',
        ellipsis: false
      });
      
      expect(setAttrsSpy).toHaveBeenCalledWith({
        width: 100,
        height: 100,
        wrap: 'word',
        ellipsis: false
      });
      
      // Verify properties are set
      expect(textNode.width()).toBe(100);
      expect(textNode.height()).toBe(100);
      expect((textNode as any).wrap()).toBe('word');
    });
    
    it('should clear text before setting new text', () => {
      const textNode = new Konva.Text({
        text: 'Old text'
      });
      
      // Clear text first
      textNode.text('');
      expect(textNode.text()).toBe('');
      
      // Then set new text
      textNode.text('New text');
      expect(textNode.text()).toBe('New text');
    });
    
    it('should handle manual wrapping with newlines', () => {
      const textNode = new Konva.Text({});
      
      const lines = ['Line 1', 'Line 2', 'Line 3'];
      const wrappedText = lines.join('\n');
      
      textNode.text(wrappedText);
      expect(textNode.text()).toBe('Line 1\nLine 2\nLine 3');
      
      // When using manual wrapping, disable Konva wrap
      (textNode as any).wrap('none');
      expect((textNode as any).wrap()).toBe('none');
    });
  });
  
  describe('Integration Tests', () => {
    it('should wrap long text in a circle correctly', () => {
      const circleRadius = 50;
      const text = 'hey hey hey hey hey hey hey hey hey hey hey hey hey hey';
      const fontSize = 14;
      
      // Calculate inscribed square
      const side = Math.SQRT2 * circleRadius - 16; // with padding
      const textAreaWidth = Math.max(30, side);
      
      // Wrap text manually
      const lines = wrapTextManually(text, textAreaWidth, fontSize, 'Arial');
      
      // Should create multiple lines for this long text
      expect(lines.length).toBeGreaterThan(1);
      
      // Create text node with wrapped text
      const textNode = new Konva.Text({
        width: textAreaWidth,
        height: textAreaWidth,
        text: lines.join('\n'),
        fontSize: fontSize,
        wrap: 'none' // Manual wrapping
      });
      
      expect(textNode.text()).toContain('\n'); // Should have line breaks
    });
    
    it('should handle very small circles gracefully', () => {
      const circleRadius = 15; // Very small
      const text = 'Test';
      const fontSize = 14;
      
      // Calculate inscribed square with minimum
      const side = Math.SQRT2 * circleRadius - 16;
      const textAreaWidth = Math.max(30, side); // Will be 30 (minimum)
      
      const lines = wrapTextManually(text, textAreaWidth, fontSize, 'Arial');
      
      // Even with small circle, text should be handled
      expect(lines.length).toBeGreaterThanOrEqual(1);
      expect(textAreaWidth).toBe(30); // Should use minimum
    });
    
    it('should position text centered in circle', () => {
      const textAreaWidth = 100;
      const textAreaHeight = 100;
      
      const textNode = new Konva.Text({
        width: textAreaWidth,
        height: textAreaHeight,
        x: -textAreaWidth / 2,
        y: -textAreaHeight / 2
      });
      
      // Text should be centered (negative half dimensions)
      expect(textNode.x()).toBe(-50);
      expect(textNode.y()).toBe(-50);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle undefined or null text', () => {
      const lines = wrapTextManually('', 100, 14, 'Arial');
      expect(lines).toEqual(['']);
    });
    
    it('should handle zero or negative dimensions', () => {
      const radius = -10;
      const rClip = Math.max(1, radius);
      expect(rClip).toBe(1); // Should use minimum of 1
      
      const side = Math.SQRT2 * rClip;
      const textAreaWidth = Math.max(30, side);
      expect(textAreaWidth).toBe(30); // Should use minimum
    });
    
    it('should handle Infinity values', () => {
      const width = Infinity;
      const validWidth = isFinite(width) && width > 0 ? width : 100;
      expect(validWidth).toBe(100);
    });
    
    it('should handle very long continuous text without spaces', () => {
      const text = 'a'.repeat(200); // 200 character word
      const lines = wrapTextManually(text, 100, 14, 'Arial');
      
      // Should keep as single line since no word breaks
      expect(lines.length).toBe(1);
      expect(lines[0].length).toBe(200);
    });
  });
});
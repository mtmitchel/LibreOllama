/**
 * Unit tests for text layout module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  measureText,
  getCircleTextLayout,
  getRectangleTextLayout,
  fitFontSize,
  calculateAutoGrowRadius,
  type TextMetrics
} from '../text-layout';
import { CircleElement, RectangleElement, ElementId } from '../types';

// Mock canvas context
const mockCanvasContext = {
  font: '',
  measureText: vi.fn((text: string) => ({
    width: text.length * 7, // Approximate width
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 3
  }))
};

// Mock document.createElement
global.document = {
  createElement: vi.fn((tag: string) => {
    if (tag === 'canvas') {
      return {
        getContext: vi.fn(() => mockCanvasContext)
      };
    }
    if (tag === 'span') {
      return {
        textContent: '',
        style: {},
        getBoundingClientRect: vi.fn(() => ({ height: 20 }))
      };
    }
    return {};
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any;

describe('Text Layout Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('measureText', () => {
    it('should measure single line text', () => {
      const metrics = measureText('Hello World', 14, 'Arial');
      
      expect(metrics.lines).toHaveLength(1);
      expect(metrics.lines[0].text).toBe('Hello World');
      expect(metrics.lines[0].width).toBe(77); // 11 * 7
      expect(metrics.totalHeight).toBe(14 * 1.2);
      expect(metrics.maxWidth).toBe(77);
    });

    it('should handle multi-line text', () => {
      const metrics = measureText('Line 1\nLine 2\nLine 3', 14, 'Arial');
      
      expect(metrics.lines).toHaveLength(3);
      expect(metrics.totalHeight).toBe(14 * 1.2 * 3);
    });

    it('should return empty metrics for empty text', () => {
      const metrics = measureText('', 14, 'Arial');
      
      expect(metrics.lines).toHaveLength(1);
      expect(metrics.lines[0].text).toBe('');
      expect(metrics.totalHeight).toBe(14 * 1.2);
    });
  });

  describe('getCircleTextLayout', () => {
    it('should calculate layout for circle text', () => {
      const circle: CircleElement = {
        id: ElementId('circle1'),
        type: 'circle',
        x: 100,
        y: 100,
        radius: 50,
        fontSize: 14,
        padding: 8
      };

      const layout = getCircleTextLayout(circle);
      
      expect(layout.fontSize).toBe(14);
      expect(layout.lineHeight).toBe(1.2);
      expect(layout.align).toBe('center');
      expect(layout.verticalAlign).toBe('middle');
      expect(layout.padding).toBe(8);
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
    });

    it('should use default values when not specified', () => {
      const circle: CircleElement = {
        id: ElementId('circle2'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 40
      };

      const layout = getCircleTextLayout(circle);
      
      expect(layout.fontSize).toBe(14); // default
      expect(layout.padding).toBe(8); // default
    });
  });

  describe('getRectangleTextLayout', () => {
    it('should calculate layout for rectangle text', () => {
      const rect: RectangleElement & { text?: string; fontSize?: number } = {
        id: ElementId('rect1'),
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        fontSize: 16
      };

      const layout = getRectangleTextLayout(rect);
      
      expect(layout.width).toBe(176); // 200 - 24 (padding)
      expect(layout.height).toBe(76); // 100 - 24 (padding)
      expect(layout.fontSize).toBe(16);
      expect(layout.align).toBe('left');
      expect(layout.verticalAlign).toBe('top');
    });
  });

  describe('fitFontSize', () => {
    it('should find optimal font size for text in box', () => {
      const fontSize = fitFontSize(
        'Short text',
        100,
        50,
        8,
        32,
        'Arial'
      );
      
      expect(fontSize).toBeGreaterThanOrEqual(8);
      expect(fontSize).toBeLessThanOrEqual(32);
    });

    it('should return minimum size for long text', () => {
      const fontSize = fitFontSize(
        'This is a very long text that definitely will not fit',
        50,
        20,
        8,
        32,
        'Arial'
      );
      
      expect(fontSize).toBe(8);
    });

    it('should return maximum size for very short text', () => {
      const fontSize = fitFontSize(
        'Hi',
        200,
        100,
        8,
        32,
        'Arial'
      );
      
      expect(fontSize).toBe(32);
    });
  });

  describe('calculateAutoGrowRadius', () => {
    it('should calculate required radius for text', () => {
      const radius = calculateAutoGrowRadius(
        'Hello World',
        14,
        'Arial',
        30,
        8
      );
      
      expect(radius).toBeGreaterThanOrEqual(30); // Not smaller than current
    });

    it('should grow radius for longer text', () => {
      const smallRadius = calculateAutoGrowRadius(
        'Short',
        14,
        'Arial',
        30,
        8
      );
      
      const largeRadius = calculateAutoGrowRadius(
        'This is much longer text',
        14,
        'Arial',
        30,
        8
      );
      
      expect(largeRadius).toBeGreaterThan(smallRadius);
    });

    it('should account for multi-line text', () => {
      const radius = calculateAutoGrowRadius(
        'Line 1\nLine 2\nLine 3',
        14,
        'Arial',
        30,
        8
      );
      
      expect(radius).toBeGreaterThan(30);
    });

    it('should respect minimum radius', () => {
      const radius = calculateAutoGrowRadius(
        '',
        14,
        'Arial',
        50,
        8
      );
      
      expect(radius).toBe(50); // Should not shrink
    });
  });
});

describe('Text Layout Module - Integration', () => {
  it('should work with circle elements end-to-end', () => {
    const circle: CircleElement = {
      id: ElementId('circle1'),
      type: 'circle',
      x: 100,
      y: 100,
      radius: 50,
      text: 'Hello World',
      fontSize: 14,
      fontFamily: 'Arial',
      padding: 8
    };

    // Get layout
    const layout = getCircleTextLayout(circle);
    expect(layout).toBeDefined();

    // Measure text
    const metrics = measureText(
      circle.text!,
      layout.fontSize,
      circle.fontFamily
    );
    expect(metrics.lines).toHaveLength(1);

    // Calculate auto-grow
    const newRadius = calculateAutoGrowRadius(
      circle.text!,
      circle.fontSize,
      circle.fontFamily,
      circle.radius,
      circle.padding
    );
    expect(newRadius).toBeGreaterThanOrEqual(circle.radius);
  });

  it('should handle empty text gracefully', () => {
    const circle: CircleElement = {
      id: ElementId('circle2'),
      type: 'circle',
      x: 0,
      y: 0,
      radius: 40
    };

    const layout = getCircleTextLayout(circle);
    expect(layout).toBeDefined();

    const metrics = measureText('', layout.fontSize, 'Arial');
    expect(metrics.lines).toHaveLength(1);
    expect(metrics.totalHeight).toBeGreaterThan(0);
  });
});
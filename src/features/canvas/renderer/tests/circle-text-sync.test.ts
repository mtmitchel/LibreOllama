/**
 * Tests for Circle Text Synchronization
 * Verifies baseline offset and per-axis scaling fixes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircleTextSync } from '../circle-text-sync';
import { CircleElement, ElementId } from '../types';
import type Konva from 'konva';

// Mock Konva group with transform
const createMockGroup = (scaleX: number = 1, scaleY: number = 1) => {
  const absTransform = {
    point: vi.fn((p: { x: number; y: number }) => ({
      x: p.x * scaleX,
      y: p.y * scaleY
    }))
  };

  return {
    getAbsoluteTransform: () => absTransform
  } as unknown as Konva.Group;
};

describe('CircleTextSync', () => {
  let sync: CircleTextSync;

  beforeEach(() => {
    sync = new CircleTextSync({
      enableBaselineOffset: true,
      defaultPadding: 8
    });
  });

  describe('Per-axis scaling', () => {
    it('should calculate content dimensions correctly at uniform scale', () => {
      const element: CircleElement = {
        id: ElementId('circle1'),
        type: 'circle',
        x: 100,
        y: 100,
        radius: 50,
        padding: 8,
        strokeWidth: 2
      };

      const group = createMockGroup(1, 1);
      const result = sync.calculate(element, group);

      // At 1:1 scale, calculations should be straightforward
      expect(result.sx).toBe(1);
      expect(result.sy).toBe(1);
      
      // Inscribed square calculation
      const effectiveRadius = 50 - 1; // radius - strokeWidth/2
      const expectedSide = Math.sqrt(2) * effectiveRadius;
      expect(result.sidePx).toBeCloseTo(expectedSide, 1);

      // Content box should be square minus padding
      const expectedContent = expectedSide - 16; // 2 * padding * scale
      expect(result.contentWPx).toBeCloseTo(expectedContent, 1);
      expect(result.contentHPx).toBeCloseTo(expectedContent, 1);

      // World dimensions should match pixel dimensions at scale 1
      expect(result.contentWWorld).toBeCloseTo(result.contentWPx, 1);
      expect(result.contentHWorld).toBeCloseTo(result.contentHPx, 1);
    });

    it('should handle non-uniform scaling correctly', () => {
      const element: CircleElement = {
        id: ElementId('circle2'),
        type: 'circle',
        x: 100,
        y: 100,
        radius: 50,
        padding: 8
      };

      const group = createMockGroup(1.5, 1.25);
      const result = sync.calculate(element, group);

      expect(result.sx).toBe(1.5);
      expect(result.sy).toBe(1.25);
      
      // sLim should be the minimum scale
      const sLim = Math.min(1.5, 1.25);
      expect(sLim).toBe(1.25);

      // Per-axis mapping: world to screen uses per-axis scale
      expect(result.contentWWorld * result.sx).toBeCloseTo(result.contentWPx, 0.1);
      expect(result.contentHWorld * result.sy).toBeCloseTo(result.contentHPx, 0.1);
    });

    it('should verify sync accuracy', () => {
      const element: CircleElement = {
        id: ElementId('circle3'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 100,
        padding: 10
      };

      const group = createMockGroup(2, 2);
      const result = sync.calculate(element, group);

      // Verify that Konva width in pixels matches DOM width
      const isValid = sync.verify(result, 0.5);
      expect(isValid).toBe(true);

      // The difference should be less than 0.5px
      const konvaWidthPx = result.contentWWorld * result.sx;
      const diff = Math.abs(konvaWidthPx - result.contentWPx);
      expect(diff).toBeLessThan(0.5);
    });
  });

  describe('Baseline offset', () => {
    it('should calculate baseline offset when enabled', () => {
      const element: CircleElement = {
        id: ElementId('circle4'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 50,
        fontSize: 14,
        fontFamily: 'Arial'
      };

      const group = createMockGroup(1, 1);
      const result = sync.calculate(element, group);

      // Baseline offset should be calculated (mocked in tests, but non-zero in real browser)
      expect(result.baselineOffsetPx).toBeDefined();
    });

    it('should not apply baseline offset when disabled', () => {
      const syncNoBaseline = new CircleTextSync({
        enableBaselineOffset: false
      });

      const element: CircleElement = {
        id: ElementId('circle5'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 50
      };

      const group = createMockGroup(1, 1);
      const result = syncNoBaseline.calculate(element, group);

      expect(result.baselineOffsetPx).toBe(0);
    });

    it('should apply baseline offset to Konva text position', () => {
      const textNode = {
        width: vi.fn(),
        height: vi.fn(),
        position: vi.fn(),
        align: vi.fn(),
        verticalAlign: vi.fn(),
        wrap: vi.fn(),
        ellipsis: vi.fn()
      } as unknown as Konva.Text;

      const syncResult = {
        contentWWorld: 100,
        contentHWorld: 100,
        baselineOffsetPx: 4,
        sy: 1,
        sidePx: 141,
        sx: 1,
        contentWPx: 125,
        contentHPx: 125
      };

      sync.applyToKonvaText(textNode, syncResult);

      // Verify baseline offset is applied (lifted up)
      expect(textNode.position).toHaveBeenCalledWith({
        x: -50, // -contentWWorld/2
        y: -50 - 4 // -contentHWorld/2 - baselineWorld
      });
    });
  });

  describe('Debug mode', () => {
    it('should create debug overlay when enabled', () => {
      const container = document.createElement('div');
      const syncResult = {
        contentWPx: 100,
        contentHPx: 100,
        contentWWorld: 100,
        contentHWorld: 100,
        baselineOffsetPx: 2,
        sidePx: 141,
        sx: 1,
        sy: 1
      };

      const overlay = sync.createDebugOverlay(container, syncResult);
      
      expect(overlay).toBeDefined();
      expect(overlay.className).toBe('circle-text-debug-overlay');
      expect(container.contains(overlay)).toBe(true);
      
      // Check debug info is displayed
      expect(overlay.textContent).toContain('Content W (px): 100');
      expect(overlay.textContent).toContain('Baseline: 2px');
    });

    it('should log debug info when debug mode is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      sync.setDebugMode(true);
      
      const element: CircleElement = {
        id: ElementId('circle6'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 50
      };

      const group = createMockGroup(1, 1);
      sync.calculate(element, group);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CircleTextSync:'),
        expect.objectContaining({
          rWorld: 50,
          sx: 1,
          sy: 1
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Safety buffer', () => {
    it('should calculate safety buffer correctly', () => {
      const buffer1 = sync.getSafetyBuffer(10);
      expect(buffer1).toBe(4); // max(4, ceil(10 * 0.4)) = max(4, 4) = 4

      const buffer2 = sync.getSafetyBuffer(20);
      expect(buffer2).toBe(8); // max(4, ceil(20 * 0.4)) = max(4, 8) = 8

      const buffer3 = sync.getSafetyBuffer(5);
      expect(buffer3).toBe(4); // max(4, ceil(5 * 0.4)) = max(4, 2) = 4
    });
  });
});

describe('CircleTextSync - Integration', () => {
  it('should maintain consistency between DOM and Konva dimensions', () => {
    const sync = new CircleTextSync({
      enableBaselineOffset: true,
      defaultPadding: 8
    });

    // Test at various scales
    const scales = [
      { sx: 1, sy: 1 },
      { sx: 1.25, sy: 1.25 },
      { sx: 1.5, sy: 1.5 },
      { sx: 2, sy: 1.5 },
      { sx: 0.75, sy: 0.75 }
    ];

    scales.forEach(({ sx, sy }) => {
      const element: CircleElement = {
        id: ElementId('test'),
        type: 'circle',
        x: 0,
        y: 0,
        radius: 100,
        padding: 10
      };

      const group = createMockGroup(sx, sy);
      const result = sync.calculate(element, group);

      // Key invariant: Konva width in pixels should match DOM width
      const konvaWidthPx = result.contentWWorld * result.sx;
      const diff = Math.abs(konvaWidthPx - result.contentWPx);
      
      expect(diff).toBeLessThan(0.5);
      expect(sync.verify(result)).toBe(true);
    });
  });
});
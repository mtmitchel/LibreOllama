import { describe, it, expect } from 'vitest';
import {
  getEllipticalTextBounds,
  getCircleTextBounds,
  getBaselineOffsetPx,
  getCirclePadPx,
  wrapTextManually,
  snapToPixel,
  ceilToPixel,
  requiredRadiusForText
} from '../renderer/geometry';

// Test the extracted geometry utilities
describe('Extracted Geometry Utilities', () => {
  describe('getEllipticalTextBounds', () => {
    it('calculates elliptical text bounds correctly', () => {
      const bounds = getEllipticalTextBounds(100, 75, 8, 2);
      
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      expect(bounds.x).toBeLessThan(0); // Centered
      expect(bounds.y).toBeLessThan(0); // Centered
    });

    it('handles invalid inputs gracefully', () => {
      const bounds = getEllipticalTextBounds(NaN, Infinity, -5, -10);
      
      expect(bounds.width).toBeGreaterThan(0); // Should be positive
      expect(bounds.height).toBeGreaterThan(0); // Should be positive  
      expect(Number.isFinite(bounds.x)).toBe(true);
      expect(Number.isFinite(bounds.y)).toBe(true);
    });
  });

  describe('getCircleTextBounds', () => {
    it('calculates circle text bounds correctly', () => {
      const bounds = getCircleTextBounds(50, 8, 2);
      
      expect(bounds.width).toBe(bounds.height); // Square
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.x).toBeLessThan(0); // Centered
      expect(bounds.y).toBeLessThan(0); // Centered
      expect(bounds.padding).toBe(8);
    });

    it('handles invalid radius gracefully', () => {
      const bounds = getCircleTextBounds(NaN, 8);
      
      expect(bounds.width).toBeGreaterThan(0); // Fallback should be positive
      expect(bounds.height).toBeGreaterThan(0); // Fallback should be positive
      expect(bounds.width).toBe(bounds.height); // Should still be square
    });
  });

  describe('getBaselineOffsetPx', () => {
    it('calculates baseline offset and caches result', () => {
      const offset1 = getBaselineOffsetPx('Arial', 14, 1.2);
      const offset2 = getBaselineOffsetPx('Arial', 14, 1.2); // Should use cache
      
      expect(offset1).toBe(offset2);
      expect(offset1).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCirclePadPx', () => {
    it('returns default padding', () => {
      expect(getCirclePadPx()).toBe(16);
    });

    it('uses element paddingPx if provided', () => {
      expect(getCirclePadPx({ paddingPx: 24 })).toBe(24);
    });

    it('enforces minimum of 0', () => {
      expect(getCirclePadPx({ paddingPx: -5 })).toBe(0);
    });
  });

  describe('wrapTextManually', () => {
    it('wraps text correctly', () => {
      const lines = wrapTextManually('Hello world test', 50, 12, 'Arial');
      
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.join(' ')).toContain('Hello');
    });

    it('handles empty text', () => {
      const lines = wrapTextManually('', 100, 12, 'Arial');
      
      expect(lines).toEqual(['']);
    });
  });

  describe('Device pixel ratio utilities', () => {
    it('snaps to pixel correctly', () => {
      const snapped = snapToPixel(10.7, 2);
      // Math.round(10.7 * 2) / 2 = Math.round(21.4) / 2 = 21 / 2 = 10.5
      expect(snapped).toBe(10.5); 
      expect(typeof snapped).toBe('number');
    });

    it('ceils to pixel correctly', () => {
      const ceiled = ceilToPixel(10.1, 2);
      // Math.ceil(10.1 * 2) / 2 = Math.ceil(20.2) / 2 = 21 / 2 = 10.5
      expect(ceiled).toBe(10.5);
      expect(typeof ceiled).toBe('number');
    });
  });

  describe('requiredRadiusForText', () => {
    it('calculates required radius for text', () => {
      const radius = requiredRadiusForText({
        text: 'Hello World',
        family: 'Arial',
        lineHeight: 1.2,
        fontSize: 14,
        padding: 8,
        strokeWidth: 2
      });

      expect(radius).toBeGreaterThan(0);
      expect(Number.isFinite(radius)).toBe(true);
    });
  });
});
/**
 * Unit tests for geometry module
 */

import { describe, it, expect } from 'vitest';
import {
  inscribedSquare,
  inscribedRectangle,
  getCircleTextBounds,
  getEllipticalTextBounds,
  calculateHitArea,
  topLeftToCenter,
  centerToTopLeft,
  isPointInCircle,
  isPointInEllipse,
  distance,
  angle,
  normalize,
  clamp,
  lerp,
  degreesToRadians,
  radiansToDegrees
} from '../geometry';

describe('Geometry Module', () => {
  describe('inscribedSquare', () => {
    it('should calculate inscribed square for a circle', () => {
      const result = inscribedSquare(100, 0, 0);
      // For radius 100, inscribed square side = 200 / sqrt(2) ≈ 141.42
      expect(result.size).toBeCloseTo(141.42, 1);
      expect(result.x).toBeCloseTo(-70.71, 1);
      expect(result.y).toBeCloseTo(-70.71, 1);
    });

    it('should account for padding', () => {
      const result = inscribedSquare(100, 10, 0);
      expect(result.size).toBeCloseTo(121.42, 1); // 141.42 - 20
    });

    it('should account for stroke width', () => {
      const result = inscribedSquare(100, 0, 4);
      // Effective radius = 100 - 2 = 98
      expect(result.size).toBeCloseTo(138.59, 1);
    });

    it('should return zero size for negative dimensions', () => {
      const result = inscribedSquare(10, 20, 0);
      expect(result.size).toBe(0);
    });
  });

  describe('inscribedRectangle', () => {
    it('should calculate inscribed rectangle for an ellipse', () => {
      const result = inscribedRectangle(100, 50, 0, 0);
      expect(result.width).toBeCloseTo(141.42, 1);
      expect(result.height).toBeCloseTo(70.71, 1);
      expect(result.x).toBeCloseTo(-70.71, 1);
      expect(result.y).toBeCloseTo(-35.35, 1);
    });

    it('should account for padding and stroke', () => {
      const result = inscribedRectangle(100, 50, 10, 4);
      expect(result.width).toBeCloseTo(118.59, 1);
      expect(result.height).toBeCloseTo(49.29, 1);
    });
  });

  describe('getCircleTextBounds', () => {
    it('should return text bounds for a circle', () => {
      const bounds = getCircleTextBounds(100, 8);
      expect(bounds.width).toBeCloseTo(125.42, 1);
      expect(bounds.height).toBeCloseTo(125.42, 1);
      expect(bounds.padding).toBe(8);
    });
  });

  describe('getEllipticalTextBounds', () => {
    it('should return text bounds for an ellipse', () => {
      const bounds = getEllipticalTextBounds(100, 75, 8, 2);
      expect(bounds.width).toBeCloseTo(122.59, 1);
      expect(bounds.height).toBeCloseTo(89.94, 1);
    });
  });

  describe('calculateHitArea', () => {
    it('should ensure minimum hit area size', () => {
      const area = calculateHitArea(20, 20, 40);
      expect(area.width).toBe(40);
      expect(area.height).toBe(40);
    });

    it('should use element size when larger than minimum', () => {
      const area = calculateHitArea(100, 80, 40);
      expect(area.width).toBe(100);
      expect(area.height).toBe(80);
    });
  });

  describe('coordinate conversions', () => {
    it('should convert top-left to center', () => {
      const center = topLeftToCenter(10, 20, 100, 50);
      expect(center.x).toBe(60);
      expect(center.y).toBe(45);
    });

    it('should convert center to top-left', () => {
      const topLeft = centerToTopLeft(60, 45, 100, 50);
      expect(topLeft.x).toBe(10);
      expect(topLeft.y).toBe(20);
    });
  });

  describe('point in shape tests', () => {
    it('should detect point inside circle', () => {
      expect(isPointInCircle(50, 50, 50, 50, 10)).toBe(true);
      expect(isPointInCircle(55, 50, 50, 50, 10)).toBe(true);
      expect(isPointInCircle(65, 50, 50, 50, 10)).toBe(false);
    });

    it('should detect point inside ellipse', () => {
      expect(isPointInEllipse(50, 50, 50, 50, 20, 10)).toBe(true);
      expect(isPointInEllipse(65, 50, 50, 50, 20, 10)).toBe(true);
      expect(isPointInEllipse(75, 50, 50, 50, 20, 10)).toBe(false);
    });
  });

  describe('math utilities', () => {
    it('should calculate distance between points', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
      expect(distance(10, 10, 10, 10)).toBe(0);
    });

    it('should calculate angle between points', () => {
      expect(angle(0, 0, 1, 0)).toBe(0);
      expect(angle(0, 0, 0, 1)).toBeCloseTo(Math.PI / 2, 5);
      expect(angle(0, 0, -1, 0)).toBeCloseTo(Math.PI, 5);
    });

    it('should normalize vectors', () => {
      const v1 = normalize(3, 4);
      expect(v1.x).toBeCloseTo(0.6, 5);
      expect(v1.y).toBeCloseTo(0.8, 5);

      const v2 = normalize(0, 0);
      expect(v2.x).toBe(0);
      expect(v2.y).toBe(0);
    });

    it('should clamp values', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should lerp between values', () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 1)).toBe(100);
      expect(lerp(10, 20, 0.25)).toBe(12.5);
    });

    it('should convert between degrees and radians', () => {
      expect(degreesToRadians(0)).toBe(0);
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
      
      expect(radiansToDegrees(0)).toBe(0);
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
    });
  });
});

describe('Geometry Module - Edge Cases', () => {
  it('should handle zero radius', () => {
    const square = inscribedSquare(0, 0, 0);
    expect(square.size).toBe(0);
    expect(square.x).toBe(0);
    expect(square.y).toBe(0);
  });

  it('should handle negative radius gracefully', () => {
    const square = inscribedSquare(-50, 0, 0);
    expect(square.size).toBe(0);
  });

  it('should handle very large values', () => {
    const square = inscribedSquare(10000, 0, 0);
    expect(square.size).toBeCloseTo(14142.13, 1);
  });

  it('should handle floating point precision', () => {
    const result = inscribedSquare(33.333, 0, 0);
    expect(result.size).toBeCloseTo(47.14, 1);
  });
});
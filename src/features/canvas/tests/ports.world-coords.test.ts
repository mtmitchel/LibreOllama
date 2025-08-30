// src/features/canvas/tests/ports.world-coords.test.ts
import { describe, it, expect } from 'vitest';
import { getDefaultPortsFor, toWorldPort } from '../utils/ports';
import { NodeElement, ElementId } from '../types/canvas-elements';

describe('Ports API - World Coordinates', () => {
  const createTestElement = (overrides?: Partial<NodeElement>): NodeElement => ({
    id: 'test-element' as ElementId,
    type: 'shape',
    x: 100,
    y: 100, 
    width: 200,
    height: 100,
    rotation: 0,
    ...overrides,
  });

  describe('getDefaultPortsFor', () => {
    it('should generate standard ports (N, S, E, W, corners, CENTER)', () => {
      const element = createTestElement();
      const ports = getDefaultPortsFor(element);
      
      expect(ports).toHaveLength(9);
      
      const portKinds = ports.map(p => p.kind);
      expect(portKinds).toContain('N');
      expect(portKinds).toContain('S');
      expect(portKinds).toContain('E');
      expect(portKinds).toContain('W');
      expect(portKinds).toContain('NE');
      expect(portKinds).toContain('NW');
      expect(portKinds).toContain('SE');
      expect(portKinds).toContain('SW');
      expect(portKinds).toContain('CENTER');
    });

    it('should use normalized coordinates in [-0.5, 0.5] range', () => {
      const element = createTestElement();
      const ports = getDefaultPortsFor(element);
      
      for (const port of ports) {
        expect(port.nx).toBeGreaterThanOrEqual(-0.5);
        expect(port.nx).toBeLessThanOrEqual(0.5);
        expect(port.ny).toBeGreaterThanOrEqual(-0.5);
        expect(port.ny).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('toWorldPort - No Rotation', () => {
    it('should convert normalized coords to world space correctly', () => {
      const element = createTestElement({
        x: 100, y: 100,  // Element position
        width: 200, height: 100  // Element size
      });
      
      const ports = getDefaultPortsFor(element);
      const northPort = ports.find(p => p.kind === 'N')!;
      const worldPos = toWorldPort(element, northPort);
      
      // North port should be at (x + width/2, y) in world coords
      // Element center is at (100 + 200/2, 100 + 100/2) = (200, 150)
      // North port offset: (0, -0.5) * (200, 100) = (0, -50) 
      // Final world pos: (200, 150) + (0, -50) = (200, 100)
      expect(worldPos.x).toBeCloseTo(200);
      expect(worldPos.y).toBeCloseTo(100);
    });

    it('should handle all cardinal directions correctly', () => {
      const element = createTestElement({
        x: 0, y: 0, width: 100, height: 100
      });
      
      const ports = getDefaultPortsFor(element);
      
      // Element center at (50, 50)
      const north = toWorldPort(element, ports.find(p => p.kind === 'N')!);
      const south = toWorldPort(element, ports.find(p => p.kind === 'S')!);  
      const east = toWorldPort(element, ports.find(p => p.kind === 'E')!);
      const west = toWorldPort(element, ports.find(p => p.kind === 'W')!);
      const center = toWorldPort(element, ports.find(p => p.kind === 'CENTER')!);
      
      expect(north).toEqual({ x: 50, y: 0 });   // Top middle
      expect(south).toEqual({ x: 50, y: 100 }); // Bottom middle  
      expect(east).toEqual({ x: 100, y: 50 });  // Right middle
      expect(west).toEqual({ x: 0, y: 50 });    // Left middle
      expect(center).toEqual({ x: 50, y: 50 }); // Center
    });

    it('should handle corner ports correctly', () => {
      const element = createTestElement({
        x: 0, y: 0, width: 100, height: 100
      });
      
      const ports = getDefaultPortsFor(element);
      
      const ne = toWorldPort(element, ports.find(p => p.kind === 'NE')!);
      const nw = toWorldPort(element, ports.find(p => p.kind === 'NW')!);
      const se = toWorldPort(element, ports.find(p => p.kind === 'SE')!);
      const sw = toWorldPort(element, ports.find(p => p.kind === 'SW')!);
      
      expect(ne).toEqual({ x: 100, y: 0 });   // Top-right
      expect(nw).toEqual({ x: 0, y: 0 });     // Top-left
      expect(se).toEqual({ x: 100, y: 100 }); // Bottom-right  
      expect(sw).toEqual({ x: 0, y: 100 });   // Bottom-left
    });
  });

  describe('toWorldPort - With Rotation', () => {
    it('should respect 90-degree rotation', () => {
      const element = createTestElement({
        x: 0, y: 0, width: 100, height: 100,
        rotation: 90  // 90 degrees clockwise
      });
      
      const ports = getDefaultPortsFor(element);
      const north = toWorldPort(element, ports.find(p => p.kind === 'N')!);
      
      // After 90° rotation, original north should point east
      // Original north: (0, -50) relative to center
      // After rotation: (50, 0) relative to center
      // World pos: (50, 50) + (50, 0) = (100, 50)
      expect(north.x).toBeCloseTo(100);
      expect(north.y).toBeCloseTo(50);
    });

    it('should respect 45-degree rotation', () => {
      const element = createTestElement({
        x: 0, y: 0, width: 100, height: 100,
        rotation: 45
      });
      
      const ports = getDefaultPortsFor(element);
      const north = toWorldPort(element, ports.find(p => p.kind === 'N')!);
      
      // 45° rotation of (0, -50):
      // x = 0 * cos(45°) - (-50) * sin(45°) = 50 * sin(45°) ≈ 35.36
      // y = 0 * sin(45°) + (-50) * cos(45°) = -50 * cos(45°) ≈ -35.36
      // World: (50, 50) + (35.36, -35.36) ≈ (85.36, 14.64)
      expect(north.x).toBeCloseTo(85.36, 1);
      expect(north.y).toBeCloseTo(14.64, 1);
    });

    it('should handle 180-degree rotation', () => {
      const element = createTestElement({
        x: 0, y: 0, width: 100, height: 100, 
        rotation: 180
      });
      
      const ports = getDefaultPortsFor(element);
      const north = toWorldPort(element, ports.find(p => p.kind === 'N')!);
      
      // 180° rotation flips north to south
      // Original: (0, -50), after rotation: (0, 50)
      // World: (50, 50) + (0, 50) = (50, 100)
      expect(north.x).toBeCloseTo(50);
      expect(north.y).toBeCloseTo(100);
    });
  });

  describe('toWorldPort - Different Element Sizes', () => {
    it('should scale port positions with element dimensions', () => {
      const smallElement = createTestElement({
        x: 0, y: 0, width: 50, height: 30
      });
      
      const largeElement = createTestElement({
        x: 0, y: 0, width: 200, height: 120  
      });
      
      const ports = getDefaultPortsFor(smallElement);
      const eastPort = ports.find(p => p.kind === 'E')!;
      
      const smallEast = toWorldPort(smallElement, eastPort);
      const largeEast = toWorldPort(largeElement, eastPort);
      
      // East port should be at right edge for both
      expect(smallEast.x).toBe(50);   // small width
      expect(largeEast.x).toBe(200);  // large width
      
      // Y should be at vertical center for both
      expect(smallEast.y).toBe(15);   // small height / 2
      expect(largeEast.y).toBe(60);   // large height / 2
    });
  });
});
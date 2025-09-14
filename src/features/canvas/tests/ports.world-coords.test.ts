// src/features/canvas/tests/ports.world-coords.test.ts
import { describe, it, expect } from 'vitest';
import { generateElementPorts, getPortWorldCoordinates, PortKind } from '../utils/ports';
import { RectangleElement, ElementId, CanvasElement, CircleElement } from '../types/enhanced.types';

describe('Port World Coordinates', () => {
  const createTestElement = (overrides?: Partial<RectangleElement>): RectangleElement => ({
    id: 'test-rectangle-id' as ElementId, // Replaced createId() with a static string ID
    type: 'rectangle',
    x: 0, y: 0, width: 100, height: 100,
    fill: 'red', stroke: 'black', strokeWidth: 1, rotation: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // ... other properties
    ...overrides,
  });

  describe('getDefaultPortsFor', () => {
    it('should generate standard ports (N, S, E, W, corners, CENTER)', () => {
      const element = createTestElement();
      const ports = generateElementPorts(element);
      
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
      const ports = generateElementPorts(element);
      
      for (const port of ports) {
        expect(port.nx).toBeGreaterThanOrEqual(-0.5);
        expect(port.nx).toBeLessThanOrEqual(0.5);
        expect(port.ny).toBeGreaterThanOrEqual(-0.5);
        expect(port.ny).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('toWorldPort - No Rotation', () => {
    it('should return correct world coordinates for a rectangular element', () => {
      const element = createTestElement();
      const ports = generateElementPorts(element);
      
      expect(ports).toHaveLength(5);
      const portKinds = ports.map((p: { kind: PortKind }) => p.kind);
      expect(portKinds).toEqual(['CENTER', 'N', 'S', 'E', 'W']);

      // Test CENTER port
      const centerPort = ports.find((p: { kind: PortKind }) => p.kind === 'CENTER')!;
      expect(getPortWorldCoordinates(element, centerPort.kind)).toEqual({ x: 50, y: 50 });

      // Test NORTH port
      const northPort = ports.find((p: { kind: PortKind }) => p.kind === 'N')!;
      expect(getPortWorldCoordinates(element, northPort.kind)).toEqual({ x: 50, y: 0 });

      // Test SOUTH port
      const southPort = ports.find((p: { kind: PortKind }) => p.kind === 'S')!;
      expect(getPortWorldCoordinates(element, southPort.kind)).toEqual({ x: 50, y: 100 });

      // Test EAST port
      const eastPort = ports.find((p: { kind: PortKind }) => p.kind === 'E')!;
      expect(getPortWorldCoordinates(element, eastPort.kind)).toEqual({ x: 100, y: 50 });

      // Test WEST port
      const westPort = ports.find((p: { kind: PortKind }) => p.kind === 'W')!;
      expect(getPortWorldCoordinates(element, westPort.kind)).toEqual({ x: 0, y: 50 });
    });

    it('should return correct world coordinates for a circular element', () => {
      const element: CircleElement = {
        id: 'test-circle-id' as ElementId, // Replaced createId() with a static string ID
        type: 'circle',
        x: 0, y: 0, radius: 50,
        width: 100, // Added width for CircleElement
        height: 100, // Added height for CircleElement
        fill: 'blue', stroke: 'black', strokeWidth: 1, rotation: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // ... other properties
      };
      const ports = generateElementPorts(element);

      expect(ports).toHaveLength(5);
      const portKinds = ports.map((p: { kind: PortKind }) => p.kind);
      expect(portKinds).toEqual(['CENTER', 'N', 'S', 'E', 'W']);

      // Test CENTER port
      const centerPort = ports.find((p: { kind: PortKind }) => p.kind === 'CENTER')!;
      expect(getPortWorldCoordinates(element, centerPort.kind)).toEqual({ x: 50, y: 50 });

      // Test NORTH port
      const northPort = ports.find((p: { kind: PortKind }) => p.kind === 'N')!;
      expect(getPortWorldCoordinates(element, northPort.kind)).toEqual({ x: 50, y: 0 });

      // Test SOUTH port
      const southPort = ports.find((p: { kind: PortKind }) => p.kind === 'S')!;
      expect(getPortWorldCoordinates(element, southPort.kind)).toEqual({ x: 50, y: 100 });

      // Test EAST port
      const eastPort = ports.find((p: { kind: PortKind }) => p.kind === 'E')!;
      expect(getPortWorldCoordinates(element, eastPort.kind)).toEqual({ x: 100, y: 50 });

      // Test WEST port
      const westPort = ports.find((p: { kind: PortKind }) => p.kind === 'W')!;
      expect(getPortWorldCoordinates(element, westPort.kind)).toEqual({ x: 0, y: 50 });
    });
  });

  describe('generateElementPorts for Rotated Element', () => {
    it('should return ports in correct world coordinates after 90 degree rotation', () => {
      const element = createTestElement({ rotation: 90 });
      const ports = generateElementPorts(element);
      
      const north = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'N')!.kind);
      const south = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'S')!.kind);  
      const east = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'E')!.kind);
      const west = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'W')!.kind);
      const center = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'CENTER')!.kind);
      
      // With 90 deg rotation, original North (0, -50) becomes East (50, 0) relative to center
      expect(north).toEqual({ x: 100, y: 50 });   // Top middle rotated to right middle
      expect(south).toEqual({ x: 0, y: 50 });     // Bottom middle rotated to left middle
      expect(east).toEqual({ x: 50, y: 100 });    // Right middle rotated to bottom middle
      expect(west).toEqual({ x: 50, y: 0 });     // Left middle rotated to top middle
      expect(center).toEqual({ x: 50, y: 50 }); // Center remains center
    });

    it('should return ports in correct world coordinates after 45 degree rotation', () => {
      const element = createTestElement({ rotation: 45 });
      const ports = generateElementPorts(element);

      const north = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'N')!.kind);
      
      // Expected coordinates for north port after 45 degree rotation around (50,50)
      // Original relative: (0, -50). Rotated: (0*cos(45) - (-50)*sin(45), 0*sin(45) + (-50)*cos(45))
      // = (50 * sqrt(2)/2, -50 * sqrt(2)/2) = (35.35, -35.35)
      // World: (50 + 35.35, 50 - 35.35) = (85.35, 14.65)
      expect(north!.x).toBeCloseTo(85.355);
      expect(north!.y).toBeCloseTo(14.645);
    });

    it('should return ports in correct world coordinates after 180 degree rotation', () => {
      const element = createTestElement({ rotation: 180 });
      const ports = generateElementPorts(element);

      const north = getPortWorldCoordinates(element, ports.find((p: { kind: PortKind }) => p.kind === 'N')!.kind);
      
      // 180 deg rotation, original North (0, -50) becomes South (0, 50) relative to center
      expect(north).toEqual({ x: 50, y: 100 }); // Top middle rotated to bottom middle
    });
  });

  describe('Port Coordinates and Element Size', () => {
    it('should return correct world coordinates regardless of element size', () => {
      const smallElement: RectangleElement = {
        id: 'test-small-rectangle-id' as ElementId, // Replaced createId() with a static string ID
        type: 'rectangle',
        x: 0, y: 0, width: 20, height: 20, 
        fill: 'red', stroke: 'black', strokeWidth: 1, rotation: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const largeElement: RectangleElement = {
        id: 'test-large-rectangle-id' as ElementId, // Replaced createId() with a static string ID
        type: 'rectangle',
        x: 0, y: 0, width: 200, height: 200,
        fill: 'green', stroke: 'black', strokeWidth: 1, rotation: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const portsSmall = generateElementPorts(smallElement);
      const eastPortSmall = portsSmall.find((p: { kind: PortKind }) => p.kind === 'E')!;
      const smallEast = getPortWorldCoordinates(smallElement, eastPortSmall.kind);

      const portsLarge = generateElementPorts(largeElement);
      const eastPortLarge = portsLarge.find((p: { kind: PortKind }) => p.kind === 'E')!;
      const largeEast = getPortWorldCoordinates(largeElement, eastPortLarge.kind);

      expect(smallEast).toEqual({ x: 20, y: 10 });
      expect(largeEast).toEqual({ x: 200, y: 100 });
    });
  });
});
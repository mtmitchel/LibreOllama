// src/features/canvas/utils/ports.ts
import { NodeElement, ElementPort, PortId, PortKind } from '../types/canvas-elements';

/**
 * Generate default ports for a node element based on its geometry
 * Returns standard attachment points: N, S, E, W, corners, CENTER
 */
export function getDefaultPortsFor(el: NodeElement): ElementPort[] {
  const ports: ElementPort[] = [];
  
  // Standard cardinal directions (mid-edges)
  ports.push(createPort('N', 0, -0.5));     // top middle
  ports.push(createPort('S', 0, 0.5));      // bottom middle
  ports.push(createPort('E', 0.5, 0));      // right middle
  ports.push(createPort('W', -0.5, 0));     // left middle
  
  // Corner ports
  ports.push(createPort('NE', 0.5, -0.5));  // top-right
  ports.push(createPort('NW', -0.5, -0.5)); // top-left
  ports.push(createPort('SE', 0.5, 0.5));   // bottom-right
  ports.push(createPort('SW', -0.5, 0.5));  // bottom-left
  
  // Center port
  ports.push(createPort('CENTER', 0, 0));
  
  return ports;
}

/**
 * Convert normalized port coordinates to world space
 * Handles element position, dimensions, and rotation
 */
export function toWorldPort(el: NodeElement, port: ElementPort): { x: number; y: number } {
  // Start with normalized coordinates in [-0.5, 0.5] range
  // Convert to element-local coordinates
  const localX = port.nx * el.width;
  const localY = port.ny * el.height;
  
  // Apply rotation if present
  const rotation = el.rotation || 0;
  let worldX = localX;
  let worldY = localY;
  
  if (rotation !== 0) {
    // Convert degrees to radians
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Rotate around element center
    worldX = localX * cos - localY * sin;
    worldY = localX * sin + localY * cos;
  }
  
  // Translate to world position (element center)
  worldX += el.x + el.width / 2;
  worldY += el.y + el.height / 2;
  
  return { x: worldX, y: worldY };
}

/**
 * Helper to create a port with generated ID
 */
function createPort(kind: PortKind, nx: number, ny: number): ElementPort {
  return {
    id: `port-${kind}-${Math.random().toString(36).substr(2, 9)}` as PortId,
    kind,
    nx,
    ny,
  };
}

/**
 * Find the closest port on an element to a world point
 * Returns the port and distance, or null if element has no ports
 */
export function findClosestPortTo(
  el: NodeElement, 
  worldPoint: { x: number; y: number }
): { port: ElementPort; distance: number } | null {
  const ports = el.ports || getDefaultPortsFor(el);
  
  if (ports.length === 0) return null;
  
  let closestPort = ports[0];
  let closestDistance = Infinity;
  
  for (const port of ports) {
    const portWorld = toWorldPort(el, port);
    const dx = portWorld.x - worldPoint.x;
    const dy = portWorld.y - worldPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPort = port;
    }
  }
  
  return { port: closestPort, distance: closestDistance };
}

/**
 * Get all world positions of ports for an element
 * Useful for rendering port indicators
 */
export function getAllPortWorldPositions(el: NodeElement): Array<{ port: ElementPort; world: { x: number; y: number } }> {
  const ports = el.ports || getDefaultPortsFor(el);
  return ports.map(port => ({
    port,
    world: toWorldPort(el, port)
  }));
}
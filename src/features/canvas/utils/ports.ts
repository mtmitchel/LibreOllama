// src/features/canvas/utils/ports.ts
import { NodeElement, ElementPort, PortId, PortKind } from '../types/canvas-elements';

/**
 * Generate default ports for a node element based on its geometry
 * Returns standard attachment points: N, S, E, W only (simplified)
 */
export function getDefaultPortsFor(el: NodeElement): ElementPort[] {
  const ports: ElementPort[] = [];
  
  // For circles, we want ports on the circle perimeter
  if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
    // Cardinal directions on the circle perimeter
    ports.push(createPort('N', 0, -1));       // top
    ports.push(createPort('S', 0, 1));        // bottom
    ports.push(createPort('E', 1, 0));        // right
    ports.push(createPort('W', -1, 0));       // left
  } else {
    // For rectangles: use half-width/height normalized coordinates
    ports.push(createPort('N', 0, -0.5));     // top middle
    ports.push(createPort('S', 0, 0.5));      // bottom middle
    ports.push(createPort('E', 0.5, 0));      // right middle
    ports.push(createPort('W', -0.5, 0));     // left middle
  }
  
  return ports;
}

/**
 * Convert normalized port coordinates to world space
 * Simplified version that directly calculates port positions
 */
export function toWorldPort(el: NodeElement, port: ElementPort): { x: number; y: number } {
  // Simple direct calculation for circles
  if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
    // Get radius - try different properties
    const radius = (el as any).radius || 
                   (el as any).radiusX || 
                   (el.width ? el.width / 2 : 50);
    
    // Circle center is at el.x, el.y
    const cx = el.x;
    const cy = el.y;
    
    // Calculate port position based on normalized coordinates
    // For circles, we use radius directly
    const worldX = cx + port.nx * radius;
    const worldY = cy + port.ny * radius;
    
    return { x: worldX, y: worldY };
  }
  
  // For rectangles/sticky notes: el.x, el.y is top-left
  const width = el.width || 100;
  const height = el.height || 100;
  
  // Center of rectangle
  const cx = el.x + width / 2;
  const cy = el.y + height / 2;
  
  // Calculate port position - ports are at ±0.5 normalized, so multiply by width/height
  const worldX = cx + port.nx * width;
  const worldY = cy + port.ny * height;
  
  return { x: worldX, y: worldY };
}

/** Return the unit normal vector for a cardinal/corner port kind */
export function getPortNormal(kind: PortKind): { x: number; y: number } {
  switch (kind) {
    case 'N': return { x: 0, y: -1 };
    case 'S': return { x: 0, y: 1 };
    case 'E': return { x: 1, y: 0 };
    case 'W': return { x: -1, y: 0 };
    case 'NE': return { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
    case 'NW': return { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
    case 'SE': return { x: Math.SQRT1_2, y: Math.SQRT1_2 };
    case 'SW': return { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
    default: return { x: 0, y: 0 };
  }
}

/** Get or synthesize a port by its kind from an element */
export function getPortByKind(el: NodeElement, kind: PortKind): ElementPort | null {
  const ports = (el.ports && Array.isArray(el.ports)) ? el.ports : getDefaultPortsFor(el);
  const p = ports.find(p => p.kind === kind) || null;
  return p;
}

/** Convenience: world coordinates for a port kind */
export function toWorldPortByKind(el: NodeElement, kind: PortKind): { x: number; y: number } {
  const p = getPortByKind(el, kind);
  if (!p) {
    // Fallback to element center
    // For circles, el.x and el.y already represent the center
    if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
      return { x: el.x, y: el.y };
    } else {
      return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
    }
  }
  return toWorldPort(el, p);
}

/** Directional chooser using dot product with port normals and optional hysteresis */
export function chooseDirectionalPort(
  el: NodeElement,
  towardWorld: { x: number; y: number },
  opts?: { lastKind?: PortKind; hysteresisDot?: number }
): { kind: PortKind; world: { x: number; y: number }; normal: { x: number; y: number } } {
  // Get element center based on element type
  let cx: number, cy: number;
  if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
    cx = el.x;
    cy = el.y;
  } else {
    cx = el.x + el.width / 2;
    cy = el.y + el.height / 2;
  }
  const dx = towardWorld.x - cx;
  const dy = towardWorld.y - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const candidates: PortKind[] = ['N', 'S', 'E', 'W'];
  let best: PortKind = 'E';
  let bestScore = -Infinity;
  for (const k of candidates) {
    const n = getPortNormal(k);
    const score = n.x * ux + n.y * uy; // cosine of angle
    if (score > bestScore) { bestScore = score; best = k; }
  }

  if (opts?.lastKind) {
    const lastN = getPortNormal(opts.lastKind);
    const lastScore = lastN.x * ux + lastN.y * uy;
    const delta = bestScore - lastScore;
    const hysteresisDot = typeof opts.hysteresisDot === 'number' ? opts.hysteresisDot : 0.05;
    if (delta < hysteresisDot) {
      best = opts.lastKind;
    }
  }

  const world = toWorldPortByKind(el, best);
  return { kind: best, world, normal: getPortNormal(best) };
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
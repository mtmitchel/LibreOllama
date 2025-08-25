// Alignment snapping utilities for canvas elements
// These helpers operate on simple element-like objects from the store
// and are resilient to partial element shapes. They favor generality
// over exhaustive geometry support.

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number; // center x
  cy: number; // center y
  width: number;
  height: number;
}

export interface AlignmentSnapResult {
  // Target positions for vertical/horizontal snap lines
  snapX: number | null;
  snapY: number | null;
  // How to align the dragged box to reach the target
  alignX: 'left' | 'center' | 'right' | null;
  alignY: 'top' | 'center' | 'bottom' | null;
  // Translation deltas required to apply the snap
  dx: number;
  dy: number;
}

// Compute an element's bounding box using common fields.
// Supports rectangles, circles and any element with width/height.
export function getElementBounds(element: any): Bounds | null {
  if (!element) return null;

  // Circle via radius
  if (typeof element.radius === 'number') {
    const left = element.x - element.radius;
    const right = element.x + element.radius;
    const top = element.y - element.radius;
    const bottom = element.y + element.radius;
    const width = right - left;
    const height = bottom - top;
    return { left, right, top, bottom, cx: element.x, cy: element.y, width, height };
  }

  // Generic width/height
  const w = typeof element.width === 'number' ? element.width : 0;
  const h = typeof element.height === 'number' ? element.height : 0;
  const left = element.x ?? 0;
  const top = element.y ?? 0;
  const right = left + w;
  const bottom = top + h;
  const cx = left + w / 2;
  const cy = top + h / 2;
  return { left, right, top, bottom, cx, cy, width: w, height: h };
}

// Return candidate snap positions for an element: edges and centers
export function computeSnapPoints(element: any): { xs: number[]; ys: number[]; bounds: Bounds } | null {
  const b = getElementBounds(element);
  if (!b) return null;
  return {
    xs: [b.left, b.cx, b.right],
    ys: [b.top, b.cy, b.bottom],
    bounds: b,
  };
}

// Given the dragged bounds and a list of candidate snap points from other elements,
// compute the best alignment within a threshold.
export function findAlignmentSnap(
  dragged: Bounds,
  candidates: Array<{ xs: number[]; ys: number[] }>,
  threshold = 8
): AlignmentSnapResult {
  let bestDx = 0;
  let bestDy = 0;
  let snapX: number | null = null;
  let snapY: number | null = null;
  let alignX: AlignmentSnapResult['alignX'] = null;
  let alignY: AlignmentSnapResult['alignY'] = null;

  // Test vertical alignments (x positions)
  const selfXs: Array<[number, AlignmentSnapResult['alignX']]> = [
    [dragged.left, 'left'],
    [dragged.cx, 'center'],
    [dragged.right, 'right'],
  ];
  let bestVerticalDist = Infinity;
  for (const [selfX, selfAlign] of selfXs) {
    for (const c of candidates) {
      for (const cx of c.xs) {
        const dist = Math.abs(selfX - cx);
        if (dist < bestVerticalDist && dist <= threshold) {
          bestVerticalDist = dist;
          snapX = cx;
          alignX = selfAlign;
          bestDx = cx - selfX;
        }
      }
    }
  }

  // Test horizontal alignments (y positions)
  const selfYs: Array<[number, AlignmentSnapResult['alignY']]> = [
    [dragged.top, 'top'],
    [dragged.cy, 'center'],
    [dragged.bottom, 'bottom'],
  ];
  let bestHorizontalDist = Infinity;
  for (const [selfY, selfAlign] of selfYs) {
    for (const c of candidates) {
      for (const cy of c.ys) {
        const dist = Math.abs(selfY - cy);
        if (dist < bestHorizontalDist && dist <= threshold) {
          bestHorizontalDist = dist;
          snapY = cy;
          alignY = selfAlign;
          bestDy = cy - selfY;
        }
      }
    }
  }

  return { snapX, snapY, alignX, alignY, dx: bestDx, dy: bestDy };
}

// Optional utility for consumers that want guide lines data
export function calculateSnapLines(draggedElement: any, elements: any[], threshold = 8): Array<{ points: number[]; stroke: string }>{
  const dragged = getElementBounds(draggedElement);
  if (!dragged) return [];
  const candidates = elements
    .map(computeSnapPoints)
    .filter(Boolean) as Array<{ xs: number[]; ys: number[]; bounds: Bounds }>;

  const res = findAlignmentSnap(dragged, candidates, threshold);
  const lines: Array<{ points: number[]; stroke: string }> = [];
  if (res.snapX != null) {
    lines.push({ points: [res.snapX, dragged.top - 2000, res.snapX, dragged.bottom + 2000], stroke: '#3b82f6' });
  }
  if (res.snapY != null) {
    lines.push({ points: [dragged.left - 2000, res.snapY, dragged.right + 2000, res.snapY], stroke: '#3b82f6' });
  }
  return lines;
}

// Legacy API retained for compatibility
export function findNearestSnapPoint(position: { x: number; y: number }, elements: any[], threshold = 8): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const el of elements) {
    const pts = computeSnapPoints(el);
    if (!pts) continue;
    for (const x of pts.xs) {
      const d = Math.abs(position.x - x);
      if (d < bestDist && d <= threshold) {
        bestDist = d;
        best = { x, y: position.y };
      }
    }
    for (const y of pts.ys) {
      const d = Math.abs(position.y - y);
      if (d < bestDist && d <= threshold) {
        bestDist = d;
        best = { x: position.x, y };
      }
    }
  }
  return best;
}

// Note: legacy signature kept for backward compatibility in old imports
export function getSnapPointList(element: any): any[] {
  const pts = computeSnapPoints(element);
  if (!pts) return [];
  // Flatten to a simple array of points [x1, y1, x2, y2, ...] is not known here,
  // legacy callers often only use the positions separately; we return center/edges as tuples
  return [pts.bounds.left, pts.bounds.top, pts.bounds.cx, pts.bounds.cy, pts.bounds.right, pts.bounds.bottom];
}


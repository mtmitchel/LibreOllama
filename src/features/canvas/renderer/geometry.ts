/**
 * Geometry Module
 * Pure math functions for canvas geometry calculations
 */

/**
 * Calculate the inscribed square within a circle
 * @param radius - Circle radius
 * @param padding - Inner padding
 * @param strokeWidth - Stroke width
 * @returns Square dimensions and position
 */
export function inscribedSquare(
  radius: number, 
  padding: number = 0, 
  strokeWidth: number = 0
): { width: number; height: number; x: number; y: number } {
  const effectiveRadius = radius - strokeWidth / 2 - padding;
  const side = Math.sqrt(2) * effectiveRadius;
  
  return {
    width: side,
    height: side,
    x: -side / 2,
    y: -side / 2
  };
}

/**
 * Calculate the inscribed rectangle within an ellipse
 * @param radiusX - Ellipse X radius
 * @param radiusY - Ellipse Y radius
 * @param aspectRatio - Desired aspect ratio (width/height)
 * @param padding - Inner padding
 * @returns Rectangle dimensions and position
 */
export function inscribedRectangle(
  radiusX: number,
  radiusY: number,
  aspectRatio: number = 1,
  padding: number = 0
): { width: number; height: number; x: number; y: number } {
  const rx = radiusX - padding;
  const ry = radiusY - padding;
  
  // Calculate inscribed rectangle dimensions
  const k = aspectRatio;
  const denominator = Math.sqrt(k * k / (rx * rx) + 1 / (ry * ry));
  const width = 2 * k / denominator;
  const height = 2 / denominator;
  
  return {
    width,
    height,
    x: -width / 2,
    y: -height / 2
  };
}

/**
 * Calculate hit area for an element
 * @param width - Element width
 * @param height - Element height
 * @param minSize - Minimum hit area size
 * @returns Hit area dimensions
 */
export function calculateHitArea(
  width: number,
  height: number,
  minSize: number = 40
): { width: number; height: number } {
  return {
    width: Math.max(width, minSize),
    height: Math.max(height, minSize)
  };
}

/**
 * Calculate text bounds for a circle
 * @param radius - Circle radius
 * @param padding - Text padding
 * @returns Text bounds
 */
export function getCircleTextBounds(
  radius: number,
  padding: number = 8
): { width: number; height: number; x: number; y: number; padding: number } {
  const inscribed = inscribedSquare(radius, padding);
  return {
    ...inscribed,
    padding
  };
}

/**
 * Check if a point is inside a circle
 * @param px - Point X
 * @param py - Point Y
 * @param cx - Circle center X
 * @param cy - Circle center Y
 * @param radius - Circle radius
 * @returns True if point is inside circle
 */
export function isPointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Calculate distance between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Angle in radians
 */
export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Rotate a point around origin
 * @param x - Point X
 * @param y - Point Y
 * @param angle - Rotation angle in radians
 * @returns Rotated point
 */
export function rotate(x: number, y: number, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
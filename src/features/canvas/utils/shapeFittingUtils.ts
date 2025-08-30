// This file has been removed - shapes use their original resizing logic

import { measureText } from './textUtils';
import { getAvailableFontFamily } from './fontLoader';

export const SHAPE_FITTING_DEFAULTS = {
  // Common
  DEBOUNCE_THRESHOLD: 5,
  IMMEDIATE_THRESHOLD: 5,
  UPDATE_TIMEOUT: 100,
  TEXT_LENGTH_TRIGGER: 5,

  // Circle
  MIN_RADIUS: 50,
  MAX_RADIUS: 300,
  CIRCLE_TEXT_EFFICIENCY: Math.PI / 4, // ~0.785 for inscribed square

  // Triangle
  MIN_WIDTH: 60,
  MIN_HEIGHT: 60,
  MAX_WIDTH: 400,
  MAX_HEIGHT: 350,
  TRIANGLE_TEXT_EFFICIENCY: 0.36, // Empirically derived for equilateral
};

/**
 * Calculates the optimal radius for a circle to fit the given text.
 */
export const getRequiredCircleRadius = (
  text: string,
  fontSize: number,
  fontFamily: string,
  currentRadius: number,
): number => {
  if (!text) {
    return SHAPE_FITTING_DEFAULTS.MIN_RADIUS;
  }

  // Allow text to wrap within a virtual box slightly larger than the circle diameter
  // to get a more stable measurement. `2.5` was from original code, seems to work.
  const measurementWidth = currentRadius * 2.5;

  const measured = measureText(
    text,
    fontSize,
    fontFamily || getAvailableFontFamily(),
  );

  const textArea = measured.width * measured.height;
  const requiredCircleArea = textArea / SHAPE_FITTING_DEFAULTS.CIRCLE_TEXT_EFFICIENCY;
  const requiredRadius = Math.sqrt(requiredCircleArea / Math.PI);

  return Math.max(
    SHAPE_FITTING_DEFAULTS.MIN_RADIUS,
    Math.min(requiredRadius, SHAPE_FITTING_DEFAULTS.MAX_RADIUS)
  );
};

// Helper for triangle geometry calculation
const calculateTriangleTextWidth = (baseWidth: number, triangleHeight: number, textPosition: number) => {
    const heightFromTop = textPosition * triangleHeight;
    const widthRatio = (triangleHeight - heightFromTop) / triangleHeight;
    return baseWidth * widthRatio;
};


/**
 * Calculates the optimal size for an equilateral triangle to fit the given text.
 * Returns a { width, height } object.
 */
export const getRequiredTriangleSize = (
  text: string,
  fontSize: number,
  fontFamily: string,
  currentWidth: number,
): { width: number, height: number } => {
  if (!text) {
    return { width: SHAPE_FITTING_DEFAULTS.MIN_WIDTH, height: SHAPE_FITTING_DEFAULTS.MIN_HEIGHT };
  }
  
  // To measure text, we need an estimate of the available width.
  // We calculate the average width of the text area inside the triangle.
  const triangleHeight = (Math.sqrt(3) / 2) * currentWidth;
  const textStartHeight = 0.6; // 60% from top
  const textEndHeight = 0.9;   // 90% from top
  const avgWidth = (calculateTriangleTextWidth(currentWidth, triangleHeight, textStartHeight) + 
                    calculateTriangleTextWidth(currentWidth, triangleHeight, textEndHeight)) / 2;
  const measurementWidth = avgWidth * 0.9; // 90% of average for padding


  const measured = measureText(
    text,
    fontSize,
    fontFamily || getAvailableFontFamily(),
  );

  const requiredTextArea = measured.width * measured.height;
  const requiredTriangleArea = requiredTextArea / SHAPE_FITTING_DEFAULTS.TRIANGLE_TEXT_EFFICIENCY;

  // For an equilateral triangle, Area = (sqrt(3)/4) * width^2
  const newWidth = Math.sqrt(requiredTriangleArea * 4 / Math.sqrt(3));
  const newHeight = (Math.sqrt(3) / 2) * newWidth;

  const targetWidth = Math.max(
    SHAPE_FITTING_DEFAULTS.MIN_WIDTH,
    Math.min(newWidth, SHAPE_FITTING_DEFAULTS.MAX_WIDTH)
  );
  const targetHeight = (Math.sqrt(3) / 2) * targetWidth;

  return { width: Math.round(targetWidth), height: Math.round(targetHeight) };
};

/** Binary-search the minimal circle radius that accommodates the text. */
export const findOptimalCircleRadius = (
  text: string,
  fontSize: number,
  fontFamily: string,
  min = SHAPE_FITTING_DEFAULTS.MIN_RADIUS,
  max = SHAPE_FITTING_DEFAULTS.MAX_RADIUS
): number => {
  let lo = min;
  let hi = max;
  while (hi - lo > 2) {
    const mid = (lo + hi) / 2;
    const required = getRequiredCircleRadius(text, fontSize, fontFamily, mid);
    if (required > mid) {
      lo = mid; // mid too small
    } else {
      hi = mid; // mid big enough
    }
  }
  return hi;
};

/** Binary-search the minimal triangle width that accommodates the text. */
export const findOptimalTriangleWidth = (
  text: string,
  fontSize: number,
  fontFamily: string,
  min = SHAPE_FITTING_DEFAULTS.MIN_WIDTH,
  max = SHAPE_FITTING_DEFAULTS.MAX_WIDTH
): { width: number; height: number } => {
  let lo = min;
  let hi = max;
  let best = { width: max, height: (Math.sqrt(3) / 2) * max };

  while (hi - lo > 2) {
    const mid = (lo + hi) / 2;
    const size = getRequiredTriangleSize(text, fontSize, fontFamily, mid);
    if (size.width > mid) {
      lo = mid; // mid too small
    } else {
      hi = mid;
      best = size;
    }
  }
  return best;
};
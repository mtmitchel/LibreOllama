/**
 * Text layout module for consistent text positioning between Konva and DOM
 * Ensures parity between canvas text rendering and DOM editor overlays
 */

import type Konva from 'konva';
import { getCircleTextBounds, getEllipticalTextBounds } from './geometry';
import type { CircleElement, TextElement, RectangleElement } from './types';

/**
 * Text measurement result
 */
export interface TextMetrics {
  lines: Array<{ text: string; width: number; height: number }>;
  totalHeight: number;
  maxWidth: number;
  fontSize: number;
  lineHeight: number;
}

/**
 * Text layout configuration
 */
export interface TextLayoutConfig {
  width: number;
  height: number;
  x: number;
  y: number;
  fontSize: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  padding?: number;
}

// Cache for baseline offsets per font signature
const baselineCache = new Map<string, number>();

/**
 * Measure text using canvas 2D context
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family
 * @param maxWidth - Maximum width for wrapping
 * @returns Text metrics
 */
export function measureText(
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth?: number
): TextMetrics {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      lines: [],
      totalHeight: 0,
      maxWidth: 0,
      fontSize,
      lineHeight: 1.2
    };
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  const lineHeight = 1.2;
  
  // Split text into lines
  let lines: string[];
  if (maxWidth) {
    lines = wrapText(ctx, text, maxWidth);
  } else {
    lines = text.split('\n');
  }
  
  // Measure each line
  const measurements = lines.map(line => ({
    text: line,
    width: ctx.measureText(line).width,
    height: fontSize
  }));
  
  return {
    lines: measurements,
    totalHeight: measurements.length * fontSize * lineHeight,
    maxWidth: Math.max(...measurements.map(m => m.width)),
    fontSize,
    lineHeight
  };
}

/**
 * Wrap text to fit within a maximum width
 * @param ctx - Canvas 2D context with font set
 * @param text - Text to wrap
 * @param maxWidth - Maximum width
 * @returns Array of wrapped lines
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

/**
 * Calculate text layout for a circle element
 * @param element - Circle element
 * @returns Text layout configuration
 */
export function getCircleTextLayout(element: CircleElement): TextLayoutConfig {
  const bounds = getCircleTextBounds(element.radius, element.padding || 8);
  
  return {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    fontSize: element.fontSize || 14,
    lineHeight: 1.2,
    align: 'left',  // Changed from 'center' to match contract
    padding: bounds.padding
  };
}

/**
 * Calculate text layout for a rectangle element
 * @param element - Rectangle element
 * @returns Text layout configuration
 */
export function getRectangleTextLayout(element: RectangleElement & { text?: string; fontSize?: number }): TextLayoutConfig {
  const padding = 12;
  
  return {
    width: element.width - padding * 2,
    height: element.height - padding * 2,
    x: -element.width / 2 + padding,
    y: -element.height / 2 + padding,
    fontSize: element.fontSize || 14,
    lineHeight: 1.2,
    align: 'left',
    verticalAlign: 'top',
    padding
  };
}

/**
 * Apply text layout to a Konva Text node
 * @param textNode - Konva Text node
 * @param layout - Text layout configuration
 * @param text - Text content
 */
export function applyTextLayout(
  textNode: Konva.Text,
  layout: TextLayoutConfig,
  text: string
): void {
  textNode.text(text);
  textNode.fontSize(layout.fontSize);
  textNode.lineHeight(layout.lineHeight || 1.2);
  textNode.width(layout.width);
  textNode.height(layout.height);
  textNode.x(layout.x);
  textNode.y(layout.y);
  textNode.align(layout.align || 'left');
  textNode.wrap('word');
  textNode.ellipsis(true);
}

/**
 * Get baseline offset for DOM/Canvas parity
 * Konva paints text lower than DOM, so we lift Konva by this offset
 * @param fontFamily - Font family
 * @param fontSize - Font size in pixels
 * @param lineHeight - Line height multiplier
 * @returns Baseline offset in pixels (positive = lift Konva up)
 */
export function getBaselineOffset(
  fontFamily: string,
  fontSize: number,
  lineHeight: number = 1.3
): number {
  const key = `${fontFamily}__${Math.round(fontSize)}__${lineHeight}`;
  const cached = baselineCache.get(key);
  if (cached !== undefined) return cached;
  
  try {
    // Create test span to measure DOM baseline
    const span = document.createElement('span');
    span.textContent = 'Hgjpq';
    span.style.cssText = `position:absolute;visibility:hidden;font:${fontSize}px ${fontFamily};line-height:${lineHeight}`;
    document.body.appendChild(span);
    
    const domHeight = span.getBoundingClientRect().height;
    document.body.removeChild(span);
    
    // Create test canvas to measure canvas baseline
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      baselineCache.set(key, 0);
      return 0;
    }
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText('Hgjpq');
    
    // Calculate canvas height from metrics
    const canvasHeight = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || fontSize * lineHeight;
    
    // Calculate offset to lift Konva (positive = up)
    const offset = Math.round((domHeight - canvasHeight) / 2);
    
    baselineCache.set(key, offset);
    return offset;
  } catch {
    baselineCache.set(key, 0);
    return 0;
  }
}

/**
 * Fit font size to a bounding box
 * @param text - Text to fit
 * @param boxWidth - Box width
 * @param boxHeight - Box height
 * @param minFontSize - Minimum font size
 * @param maxFontSize - Maximum font size
 * @param fontFamily - Font family
 * @returns Optimal font size
 */
export function fitFontSize(
  text: string,
  boxWidth: number,
  boxHeight: number,
  minFontSize: number = 8,
  maxFontSize: number = 72,
  fontFamily: string = 'Inter, system-ui, sans-serif'
): number {
  let low = minFontSize;
  let high = maxFontSize;
  let optimalSize = minFontSize;
  
  // Binary search for optimal font size
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const metrics = measureText(text, mid, fontFamily, boxWidth);
    
    if (metrics.totalHeight <= boxHeight && metrics.maxWidth <= boxWidth) {
      optimalSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return optimalSize;
}

/**
 * Calculate text bounds for auto-grow
 * @param text - Text content
 * @param fontSize - Font size
 * @param fontFamily - Font family
 * @param currentRadius - Current circle radius
 * @param padding - Padding
 * @returns Required radius for text
 */
export function calculateAutoGrowRadius(
  text: string,
  fontSize: number,
  fontFamily: string,
  currentRadius: number,
  padding: number = 8
): number {
  const metrics = measureText(text, fontSize, fontFamily);
  
  // Calculate radius needed for text height
  const heightRadius = (metrics.totalHeight / 2) + padding;
  
  // Calculate radius needed for text width
  const widthRadius = (metrics.maxWidth / 2) + padding;
  
  // Return the larger of the two, but not smaller than current
  return Math.max(heightRadius, widthRadius, currentRadius);
}

/**
 * Synchronize text between DOM editor and Konva node
 * @param domElement - DOM element (textarea or contenteditable)
 * @param konvaText - Konva Text node
 * @param layout - Text layout configuration
 */
export function syncTextWithDOM(
  domElement: HTMLElement,
  konvaText: Konva.Text,
  layout: TextLayoutConfig
): void {
  // Get text from DOM element
  const text = domElement instanceof HTMLTextAreaElement 
    ? domElement.value 
    : domElement.textContent || '';
  
  // Apply to Konva with same layout
  applyTextLayout(konvaText, layout, text);
  
  // Apply baseline offset if needed
  const baselineOffset = getBaselineOffset(
    konvaText.fontFamily(),
    konvaText.fontSize(),
    konvaText.lineHeight()
  );
  
  if (baselineOffset !== 0) {
    konvaText.y(layout.y + baselineOffset);
  }
}

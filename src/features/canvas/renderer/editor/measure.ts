/**
 * Text measurement and auto-grow module
 * Implements ghost measurement with fixed-point convergence
 * and device pixel snapping for accurate sizing
 */

import { measureText } from '../text-layout';
import type { CircleElement, ElementId } from '../types';

export interface MeasurementConfig {
  maxIterations?: number;
  convergenceThreshold?: number;
  guardBand?: number;
  enableDPRSnapping?: boolean;
}

export interface MeasurementResult {
  requiredRadius: number;
  fontSize: number;
  iterations: number;
  converged: boolean;
  metrics: {
    width: number;
    height: number;
    lines: number;
  };
}

export class TextMeasurement {
  private config: MeasurementConfig;
  private ghostContainer: HTMLDivElement | null = null;
  private measurementCache = new Map<string, MeasurementResult>();

  constructor(config: MeasurementConfig = {}) {
    this.config = {
      maxIterations: 5,
      convergenceThreshold: 0.5,
      guardBand: 4,
      enableDPRSnapping: true,
      ...config
    };
  }

  /**
   * Measure text and calculate required radius for auto-grow
   * Uses fixed-point iteration with convergence detection
   */
  measureForAutoGrow(
    text: string,
    currentRadius: number,
    fontSize: number,
    fontFamily: string,
    padding: number = 8
  ): MeasurementResult {
    // Cache key
    const cacheKey = `${text}__${fontSize}__${fontFamily}__${padding}`;
    const cached = this.measurementCache.get(cacheKey);
    if (cached && Math.abs(cached.requiredRadius - currentRadius) < 1) {
      return cached;
    }

    // Initialize
    let radius = currentRadius;
    let prevRadius = radius;
    let iterations = 0;
    let converged = false;

    // Fixed-point iteration
    while (iterations < this.config.maxIterations!) {
      iterations++;

      // Measure text with current radius constraints
      const boxSize = this.getInscribedSquareSize(radius, padding);
      const metrics = this.measureWithGhost(text, fontSize, fontFamily, boxSize);

      // Calculate required radius
      const requiredForWidth = (metrics.width / Math.sqrt(2)) + padding + this.getGuardBand(fontSize);
      const requiredForHeight = (metrics.height / Math.sqrt(2)) + padding + this.getGuardBand(fontSize);
      const newRadius = Math.max(requiredForWidth, requiredForHeight, 30);

      // Apply DPR snapping if enabled
      const snappedRadius = this.config.enableDPRSnapping 
        ? this.snapToDevicePixels(newRadius)
        : newRadius;

      // Check convergence
      if (Math.abs(snappedRadius - prevRadius) < this.config.convergenceThreshold!) {
        converged = true;
        radius = snappedRadius;
        break;
      }

      prevRadius = radius;
      radius = snappedRadius;
    }

    // Final measurement
    const boxSize = this.getInscribedSquareSize(radius, padding);
    const finalMetrics = this.measureWithGhost(text, fontSize, fontFamily, boxSize);

    const result: MeasurementResult = {
      requiredRadius: radius,
      fontSize,
      iterations,
      converged,
      metrics: {
        width: finalMetrics.width,
        height: finalMetrics.height,
        lines: finalMetrics.lines
      }
    };

    // Cache result
    this.measurementCache.set(cacheKey, result);

    return result;
  }

  /**
   * Measure text using a ghost element for accurate DOM measurement
   */
  private measureWithGhost(
    text: string,
    fontSize: number,
    fontFamily: string,
    maxWidth: number
  ): { width: number; height: number; lines: number } {
    // Ensure ghost container exists
    if (!this.ghostContainer) {
      this.ghostContainer = document.createElement('div');
      this.ghostContainer.style.position = 'absolute';
      this.ghostContainer.style.visibility = 'hidden';
      this.ghostContainer.style.pointerEvents = 'none';
      this.ghostContainer.style.left = '-9999px';
      this.ghostContainer.style.top = '-9999px';
      document.body.appendChild(this.ghostContainer);
    }

    // Create ghost element
    const ghost = document.createElement('div');
    ghost.style.fontFamily = fontFamily;
    ghost.style.fontSize = `${fontSize}px`;
    ghost.style.lineHeight = '1.2';
    ghost.style.whiteSpace = 'pre-wrap';
    ghost.style.wordBreak = 'break-word';
    ghost.style.width = `${maxWidth}px`;
    ghost.style.padding = '0';
    ghost.style.margin = '0';
    ghost.style.border = 'none';
    ghost.textContent = text;

    // Measure
    this.ghostContainer.appendChild(ghost);
    const rect = ghost.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Count lines (approximate)
    const lines = Math.ceil(height / (fontSize * 1.2));
    
    // Clean up
    this.ghostContainer.removeChild(ghost);

    return { width, height, lines };
  }

  /**
   * Calculate inscribed square size for a given radius
   */
  private getInscribedSquareSize(radius: number, padding: number): number {
    // Inscribed square in circle: side = diameter / sqrt(2)
    return Math.max(0, (radius * 2) / Math.sqrt(2) - padding * 2);
  }

  /**
   * Calculate guard band based on font size
   * Formula: fontSize * 0.4 + 4px
   */
  private getGuardBand(fontSize: number): number {
    return fontSize * 0.4 + (this.config.guardBand || 4);
  }

  /**
   * Snap radius to device pixels for crisp rendering
   */
  private snapToDevicePixels(radius: number): number {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(radius * dpr) / dpr;
  }

  /**
   * Convert screen coordinates to world coordinates
   * Accounts for stage transform and scaling
   */
  screenToWorld(screenPos: { x: number; y: number }, stageTransform: any): { x: number; y: number } {
    const inverted = stageTransform.copy().invert();
    return inverted.point(screenPos);
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: { x: number; y: number }, stageTransform: any): { x: number; y: number } {
    return stageTransform.point(worldPos);
  }

  /**
   * Clear measurement cache
   */
  clearCache(): void {
    this.measurementCache.clear();
  }

  /**
   * Dispose of ghost container and clear cache
   */
  dispose(): void {
    if (this.ghostContainer) {
      this.ghostContainer.remove();
      this.ghostContainer = null;
    }
    this.clearCache();
  }
}

/**
 * Create a measurement instance with default config
 */
export function createTextMeasurement(config?: MeasurementConfig): TextMeasurement {
  return new TextMeasurement(config);
}
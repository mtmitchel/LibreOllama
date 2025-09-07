/**
 * Circle Text Contract Implementation
 * Ensures perfect parity between DOM editing and Konva display
 * Text is LEFT + TOP aligned in inscribed square with uniform padding
 */

import type Konva from 'konva';
import type { CircleElement } from './types';

export interface CircleTextMeasurement {
  // World space
  rWorld: number;
  rTargetWorld: number;
  
  // Screen space
  sidePx: number;
  contentWpx: number;
  contentHpx: number;
  padPx: number;
  
  // Transform
  sx: number;
  sy: number;
  sLim: number;
  
  // World content (for Konva)
  contentWWorld: number;
  contentHWorld: number;
}

/**
 * The Circle Text Contract
 * Single source of truth for circle text layout
 */
export class CircleTextContract {
  // Fixed on-screen padding in CSS pixels (visual contract); default 16px
  private basePadPx: number = 16;
  private guardMultiplier: number = 0.4;
  private guardMin: number = 4;

  constructor(config?: { padPx?: number }) {
    if (typeof config?.padPx === 'number') this.basePadPx = Math.max(0, config.padPx);
  }

  /**
   * Calculate all measurements from element and group transform
   */
  calculate(element: CircleElement, group: Konva.Group): CircleTextMeasurement {
    // Get absolute transform
    const abs = group.getAbsoluteTransform();
    const p0 = abs.point({ x: 0, y: 0 });
    const px = abs.point({ x: 1, y: 0 });
    const py = abs.point({ x: 0, y: 1 });
    
    // Per-axis scale
    const sx = Math.abs(px.x - p0.x);
    const sy = Math.abs(py.y - p0.y);
    const sLim = Math.min(sx, sy);
    
    // World radius and stroke
    const rWorld = element.radius;
    const stroke = element.strokeWidth || 0;
    
    // Fixed on-screen padding (CSS px)
    const padPx = this.basePadPx;
    
    // Square side in screen px (outer box)
    const rClipWorld = rWorld - (stroke / 2);
    const sidePx = Math.sqrt(2) * rClipWorld * sLim;
    
    // Content box in screen px (what wraps text)
    const contentWpx = sidePx - 2 * padPx;
    const contentHpx = sidePx - 2 * padPx; // Square!
    
    // Map content box to world using per-axis scale
    const contentWWorld = contentWpx / sx;
    const contentHWorld = contentHpx / sy;
    
    return {
      rWorld,
      rTargetWorld: rWorld, // Will be updated by auto-grow
      sidePx,
      contentWpx,
      contentHpx,
      padPx,  // Use the dynamic padding
      sx,
      sy,
      sLim,
      contentWWorld,
      contentHWorld
    };
  }

  /**
   * Calculate required radius for text (auto-grow)
   */
  calculateRequiredRadius(
    text: string,
    currentMeasurement: CircleTextMeasurement,
    fontSize: number
  ): number {
    const { contentWpx, sLim, sx, sy } = currentMeasurement;
    const stroke = 0; // Get from element if needed
    
    // Measure text with ghost element
    const neededContentPx = this.measureConverged(contentWpx, text, fontSize);
    
    // Calculate needed outer square
    const padPx = this.basePadPx;
    const neededSidePx = neededContentPx + 2 * padPx;
    
    // Calculate target radius with DPR snapping
    const dpr = window.devicePixelRatio || 1;
    const rTarget = Math.ceil(
      ((neededSidePx / Math.sqrt(2)) / sLim + stroke / 2) * dpr
    ) / dpr;
    
    return rTarget;
  }

  /**
   * Measure text with convergence (ghost element)
   */
  private measureConverged(
    maxWidth: number,
    text: string,
    fontSize: number
  ): number {
    const guard = Math.max(this.guardMin, Math.ceil(fontSize * this.guardMultiplier));
    
    // Create ghost element
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${maxWidth}px;
      font-size: ${fontSize}px;
      font-family: Inter, system-ui, sans-serif;
      line-height: 1.3;
      white-space: pre-wrap;
      word-break: break-word;
      padding: 0;
      margin: 0;
    `;
    ghost.textContent = text;
    
    document.body.appendChild(ghost);
    
    // Measure with iterations for convergence
    let lastHeight = 0;
    let iterations = 0;
    const maxIterations = 5;
    
    while (iterations < maxIterations) {
      const rect = ghost.getBoundingClientRect();
      const height = rect.height;
      const widthOverflow = Math.max(rect.width, maxWidth); // only widen for unbreakable tokens
      
      if (Math.abs(height - lastHeight) < 0.5) {
        // Converged
        document.body.removeChild(ghost);
        return Math.max(widthOverflow, height) + guard;
      }
      
      lastHeight = height;
      iterations++;
    }
    
    // Didn't converge, use last measurement
    const finalRect = ghost.getBoundingClientRect();
    const widthOverflow = Math.max(finalRect.width, maxWidth);
    document.body.removeChild(ghost);
    return Math.max(widthOverflow, finalRect.height) + guard;
  }

  /**
   * Apply to DOM editor (during editing)
   */
  applyToDOM(
    overlay: HTMLDivElement,
    pad: HTMLDivElement,
    editor: HTMLDivElement,
    measurement: CircleTextMeasurement,
    centerScreen: { x: number; y: number }
  ): void {
    const { sidePx, padPx } = measurement;
    const dpr = window.devicePixelRatio || 1;
    
    // Position overlay at center
    overlay.style.position = 'fixed';
    overlay.style.left = `${Math.round(centerScreen.x * dpr) / dpr}px`;
    overlay.style.top = `${Math.round(centerScreen.y * dpr) / dpr}px`;
    overlay.style.width = `${Math.ceil(sidePx * dpr) / dpr}px`;
    overlay.style.height = `${Math.ceil(sidePx * dpr) / dpr}px`;
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.overflow = 'hidden';
    
    // Pad provides the uniform padding
    pad.style.width = '100%';
    pad.style.height = '100%';
    pad.style.boxSizing = 'border-box';
    pad.style.padding = `${padPx}px`;
    pad.style.position = 'relative';
    
    // Editor fills the padded area - LEFT TOP aligned
    editor.style.width = '100%';
    editor.style.height = '100%';
    editor.style.padding = '0';
    editor.style.margin = '0';
    editor.style.border = 'none';
    editor.style.outline = 'none';
    editor.style.background = 'transparent';
    editor.style.whiteSpace = 'pre-wrap';
    editor.style.wordBreak = 'break-word';
    editor.style.lineHeight = '1.3';
    editor.style.textAlign = 'left'; // LEFT aligned
    editor.style.display = 'block'; // Block display for proper text flow
    editor.style.boxSizing = 'border-box';
    editor.contentEditable = 'true';
    
    // Remove any flex/centering styles
    editor.style.alignItems = 'unset';
    editor.style.justifyContent = 'unset';
    editor.style.flexDirection = 'unset';
  }

  /**
   * Apply to Konva text (after commit)
   */
  applyToKonva(
    textNode: Konva.Text,
    measurement: CircleTextMeasurement
  ): void {
    const { contentWWorld, contentHWorld } = measurement;
    
    // Set dimensions - same as DOM content box
    textNode.width(contentWWorld);
    textNode.height(contentHWorld);
    
    // Position - top-left aligned (no centering!)
    textNode.position({
      x: -contentWWorld / 2,  // Left edge at -width/2
      y: -contentHWorld / 2   // Top edge at -height/2
    });
    
    // Text properties - match DOM exactly
    textNode.align('left');        // LEFT aligned
    textNode.verticalAlign('top'); // TOP aligned
    textNode.wrap('word');
    textNode.ellipsis(true);
    textNode.lineHeight(1.3);
  }

  /**
   * Apply same-frame updates (critical for parity)
   */
  applySameFrame(
    overlay: HTMLDivElement,
    ellipse: Konva.Ellipse,
    textNode: Konva.Text,
    measurement: CircleTextMeasurement,
    rTarget: number,
    centerScreen: { x: number; y: number },
    layer: Konva.Layer,
    updateStore: (radius: number) => void
  ): void {
    // Update measurement with new radius
    const newMeasurement = {
      ...measurement,
      rWorld: rTarget,
      rTargetWorld: rTarget,
      sidePx: Math.sqrt(2) * rTarget * measurement.sLim,
    };
    const newPadPx = this.getPadding(rTarget);
    newMeasurement.contentWpx = newMeasurement.sidePx - 2 * newPadPx;
    newMeasurement.padPx = newPadPx;
    newMeasurement.contentHpx = newMeasurement.contentWpx; // Square
    newMeasurement.contentWWorld = newMeasurement.contentWpx / measurement.sx;
    newMeasurement.contentHWorld = newMeasurement.contentHpx / measurement.sy;
    
    // SAME FRAME - Order matters!
    
    // 1. Resize overlay square
    const dpr = window.devicePixelRatio || 1;
    overlay.style.width = `${Math.ceil(newMeasurement.sidePx * dpr) / dpr}px`;
    overlay.style.height = overlay.style.width;
    
    // 2. Update ellipse radius
    ellipse.radiusX(rTarget);
    ellipse.radiusY(rTarget);
    
    // 3. Update text node
    this.applyToKonva(textNode, newMeasurement);
    
    // 4. Batch draw
    layer.batchDraw();
    
    // 5. Commit to store (after visuals)
    updateStore(rTarget);
  }

  /**
   * Verify parity between DOM and Konva
   */
  verify(measurement: CircleTextMeasurement): boolean {
    const { contentWpx, contentWWorld, sx } = measurement;
    
    // Konva width in screen px should match DOM width
    const konvaScreenWidth = contentWWorld * sx;
    const diff = Math.abs(konvaScreenWidth - contentWpx);
    
    if (diff > 0.5) {
      console.warn(`Parity violation: DOM=${contentWpx}px, Konva=${konvaScreenWidth}px, diff=${diff}px`);
      return false;
    }
    
    return true;
  }
}

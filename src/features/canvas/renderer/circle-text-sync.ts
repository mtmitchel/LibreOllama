/**
 * Circle Text Synchronization Module
 * Ensures perfect parity between DOM editor and Konva text rendering
 * Handles per-axis scaling and baseline offset correctly
 */

import type Konva from 'konva';
import { getBaselineOffset } from './text-layout';
import type { CircleElement } from './types';

export interface CircleTextSyncConfig {
  enableBaselineOffset?: boolean;
  enableDebug?: boolean;
  defaultPadding?: number;
  defaultIndent?: number;
}

export interface SyncResult {
  contentWPx: number;
  contentHPx: number;
  contentWWorld: number;
  contentHWorld: number;
  baselineOffsetPx: number;
  sidePx: number;
  sx: number;
  sy: number;
}

/**
 * Synchronize circle text between DOM and Konva
 * Ensures both use exactly the same dimensions and positioning
 */
export class CircleTextSync {
  public config: CircleTextSyncConfig;
  private debugMode: boolean = false;

  constructor(config: CircleTextSyncConfig = {}) {
    this.config = {
      enableBaselineOffset: true,
      enableDebug: false,
      defaultPadding: 8,
      defaultIndent: 0,
      ...config
    };
    this.debugMode = this.config.enableDebug || false;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Calculate sync parameters for circle text
   */
  calculate(
    element: CircleElement,
    group: Konva.Group
  ): SyncResult {
    // Get world-space values
    const rWorld = element.radius;
    const padWorld = element.padding ?? this.config.defaultPadding ?? 0; // Use nullish coalescing and a final fallback to 0
    const indentWorld = this.config.defaultIndent || 0;
    const strokeWidth = element.strokeWidth || 2;

    // Get absolute transform and scale
    const absTransform = group.getAbsoluteTransform();
    
    // Calculate per-axis scale correctly
    const p0 = absTransform.point({ x: 0, y: 0 });
    const px = absTransform.point({ x: 1, y: 0 });
    const py = absTransform.point({ x: 0, y: 1 });
    
    const sx = Math.abs(px.x - p0.x);
    const sy = Math.abs(py.y - p0.y);
    
    // Use minimum scale for outer square (ensures it fits in circle)
    const sLim = Math.min(sx, sy);

    // Calculate outer square in screen pixels
    // Inscribed square: side = diameter / sqrt(2)
    const effectiveRadius = rWorld - strokeWidth / 2;
    const sidePx = Math.sqrt(2) * effectiveRadius * sLim;

    // Convert padding to screen pixels
    const padPx = padWorld * sLim;
    const indentPx = indentWorld * sLim;

    // Calculate content box in screen pixels
    // For circles, content box should be SQUARE (not rectangular)
    // Both width and height should be the same
    const contentSizePx = sidePx - 2 * padPx - 2 * indentPx;
    const contentWPx = contentSizePx;
    const contentHPx = contentSizePx;

    // Map content box back to world coordinates for Konva
    // Use per-axis scale for accurate mapping
    // Since content is square in screen space, we need to maintain that in world space
    // accounting for non-uniform scaling
    const contentWWorld = contentWPx / sx;
    const contentHWorld = contentHPx / sy;

    // Calculate baseline offset if enabled
    let baselineOffsetPx = 0;
    if (this.config.enableBaselineOffset) {
      const fontSize = element.fontSize || 14;
      const fontFamily = element.fontFamily || 'Inter, system-ui, sans-serif';
      const lineHeight = 1.3; // Default line height
      
      baselineOffsetPx = getBaselineOffset(fontFamily, fontSize, lineHeight);
    }

    // Debug logging
    if (this.debugMode) {
      console.log('CircleTextSync:', {
        rWorld,
        sx,
        sy,
        sLim,
        sidePx,
        contentWPx,
        contentHPx,
        contentWWorld,
        contentHWorld,
        baselineOffsetPx,
        konvaWidthPx: contentWWorld * sx,
        domWidthPx: contentWPx,
        diff: Math.abs(contentWWorld * sx - contentWPx)
      });
    }

    return {
      contentWPx,
      contentHPx,
      contentWWorld,
      contentHWorld,
      baselineOffsetPx,
      sidePx,
      sx,
      sy
    };
  }

  /**
   * Apply sync to Konva text node
   */
  applyToKonvaText(
    textNode: Konva.Text,
    syncResult: SyncResult
  ): void {
    const {
      contentWWorld,
      contentHWorld,
      baselineOffsetPx,
      sy
    } = syncResult;

    // Set dimensions - for circles these should create a square in screen space
    textNode.width(contentWWorld);
    textNode.height(contentHWorld);

    // Position with baseline offset (lift Konva up)
    // Note: baseline offset is in screen pixels, divide by scale for world
    const baselineWorld = baselineOffsetPx / sy;
    
    textNode.position({
      x: -contentWWorld / 2,
      y: -contentHWorld / 2 - baselineWorld // Lift up by baseline offset
    });

    // Set text properties to match DOM
    textNode.align('center');
    textNode.verticalAlign('middle');
    textNode.wrap('word');
    textNode.ellipsis(true);
    
    // Debug: Add visible bounds in debug mode
    if (this.debugMode) {
      textNode.fillEnabled(true);
      textNode.strokeEnabled(true);
    }
  }

  /**
   * Apply sync to DOM editor
   */
  applyToDOMEditor(
    wrapper: HTMLDivElement,
    editor: HTMLElement,
    syncResult: SyncResult
  ): void {
    const { sidePx, contentWPx, contentHPx } = syncResult;

    // Set wrapper to match inscribed square
    wrapper.style.width = `${sidePx}px`;
    wrapper.style.height = `${sidePx}px`;

    // Editor gets content dimensions - which should be square for circles
    // contentWPx and contentHPx should be equal (both are contentSizePx)
    if (editor instanceof HTMLTextAreaElement) {
      editor.style.width = `${contentWPx}px`;
      editor.style.height = `${contentHPx}px`;
    } else {
      // For contenteditable div - ensure it stays square
      editor.style.width = `${contentWPx}px`;
      editor.style.height = `${contentHPx}px`;
      editor.style.minWidth = `${contentWPx}px`;
      editor.style.minHeight = `${contentHPx}px`;
      editor.style.maxWidth = `${contentWPx}px`;
      editor.style.maxHeight = `${contentHPx}px`;
    }

    // Debug outline
    if (this.debugMode) {
      wrapper.style.outline = '1px solid red';
      editor.style.outline = '1px solid blue';
      console.log('DOM Editor dimensions:', {
        wrapper: `${sidePx}x${sidePx}`,
        editor: `${contentWPx}x${contentHPx}`,
        isSquare: contentWPx === contentHPx
      });
    }
  }

  /**
   * Verify sync accuracy
   */
  verify(syncResult: SyncResult, tolerance: number = 0.5): boolean {
    const { contentWWorld, contentWPx, sx } = syncResult;
    
    // Konva width in screen pixels should match DOM width
    const konvaWidthPx = contentWWorld * sx;
    const diff = Math.abs(konvaWidthPx - contentWPx);
    
    if (diff > tolerance) {
      console.warn(`CircleTextSync: Width mismatch! Konva: ${konvaWidthPx}px, DOM: ${contentWPx}px, Diff: ${diff}px`);
      return false;
    }

    return true;
  }

  /**
   * Create debug overlay for visualization
   */
  createDebugOverlay(container: HTMLElement, syncResult: SyncResult): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'circle-text-debug-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-radius: 4px;
    `;

    overlay.innerHTML = `
      <div>Circle Text Sync Debug</div>
      <hr style="margin: 5px 0; border-color: #555;">
      <div>Content W (px): ${syncResult.contentWPx.toFixed(2)}</div>
      <div>Content H (px): ${syncResult.contentHPx.toFixed(2)}</div>
      <div>Scale X: ${syncResult.sx.toFixed(3)}</div>
      <div>Scale Y: ${syncResult.sy.toFixed(3)}</div>
      <div>Baseline: ${syncResult.baselineOffsetPx}px</div>
      <div>Konva W (px): ${(syncResult.contentWWorld * syncResult.sx).toFixed(2)}</div>
      <div>Diff: ${Math.abs(syncResult.contentWWorld * syncResult.sx - syncResult.contentWPx).toFixed(3)}px</div>
    `;

    container.appendChild(overlay);
    return overlay;
  }

  /**
   * Calculate safety buffer for ghost measurement
   */
  getSafetyBuffer(fontSize: number): number {
    return Math.max(4, Math.ceil(fontSize * 0.4));
  }
}

/**
 * Create a circle text sync instance
 */
export function createCircleTextSync(config?: CircleTextSyncConfig): CircleTextSync {
  return new CircleTextSync(config);
}
/**
 * RAF-based Konva layer batch-draw scheduler
 * 
 * Coalesces multiple draw() calls into a single requestAnimationFrame per frame
 * and uses layer.batchDraw() to minimize layout/paint overhead.
 * 
 * Exposes simple APIs:
 * - scheduleLayerDraw(layer): queue a layer to be redrawn this frame
 * - withRafBatch(callback): run a callback and ensure a batched draw at end of frame
 */

import Konva from 'konva';

interface RafStats {
  totalCreated: number;
  activeCount: number;
  frameBudgetExceeded: number;
}

const queuedLayers = new Set<Konva.Layer>();
let rafId: number | null = null;

// Expose basic stats for performance monitor (optional)
const globalAny = (typeof window !== 'undefined' ? (window as any) : {}) as any;
if (!globalAny.__RAF_MANAGER_STATS__) {
  globalAny.__RAF_MANAGER_STATS__ = { totalCreated: 0, activeCount: 0, frameBudgetExceeded: 0 } as RafStats;
}

function flushQueuedLayers() {
  if (queuedLayers.size === 0) return;
  const start = performance.now();
  queuedLayers.forEach((layer) => {
    try {
      // Use Konva's batchDraw to coalesce multiple draws per layer
      layer.batchDraw();
    } catch (_) {
      // ignore
    }
  });
  queuedLayers.clear();
  const elapsed = performance.now() - start;
  globalAny.__RAF_MANAGER_STATS__.activeCount = 0;
  if (elapsed > 16.67) {
    globalAny.__RAF_MANAGER_STATS__.frameBudgetExceeded++;
  }
}

function ensureRaf() {
  if (rafId != null) return;
  globalAny.__RAF_MANAGER_STATS__.totalCreated++;
  globalAny.__RAF_MANAGER_STATS__.activeCount++;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    flushQueuedLayers();
  });
}

export function scheduleLayerDraw(layer: Konva.Layer | null | undefined) {
  if (!layer) return;
  queuedLayers.add(layer);
  ensureRaf();
}

export function withRafBatch<T>(fn: () => T): T {
  const result = fn();
  ensureRaf();
  return result;
}

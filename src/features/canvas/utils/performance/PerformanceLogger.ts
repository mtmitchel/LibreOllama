// src/features/canvas/utils/performance/PerformanceLogger.ts

export type PointerTool = 'pen' | 'marker' | 'highlighter' | 'eraser' | 'other';

type PointerStats = {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
};

export type PerfSnapshot = {
  initStart?: number;
  initEnd?: number;
  initDurationMs?: number;
  frameCount: number;
  avgFrameMs?: number;
  fps?: number;
  lastFrameAt?: number;
  pointer: Record<string, PointerStats>;
  batchDraw: Record<string, number>;
  lastUpdatedAt: number;
};

class PerformanceLogger {
  private initStartTs?: number;
  private initEndTs?: number;
  private frameHandle: number | null = null;
  private lastFrameTs?: number;
  private frameAccum = 0;
  private frameCountWindow = 0;
  private avgFrameMs?: number;
  private fps?: number;
  private pointerStats: Record<string, PointerStats> = {};
  private batchDrawCounts: Record<string, number> = {};

  initStart() {
    this.initStartTs = performance.now();
  }
  initEnd() {
    this.initEndTs = performance.now();
  }

  startFrameLoop() {
    if (this.frameHandle) return;
    const loop = () => {
      const now = performance.now();
      if (this.lastFrameTs != null) {
        const dt = now - this.lastFrameTs;
        this.frameAccum += dt;
        this.frameCountWindow += 1;
        // Update every ~30 frames for stability
        if (this.frameCountWindow >= 30) {
          this.avgFrameMs = this.frameAccum / this.frameCountWindow;
          this.fps = this.avgFrameMs > 0 ? 1000 / this.avgFrameMs : undefined;
          this.frameAccum = 0;
          this.frameCountWindow = 0;
        }
      }
      this.lastFrameTs = now;
      this.frameHandle = requestAnimationFrame(loop);
    };
    this.frameHandle = requestAnimationFrame(loop);
  }

  stopFrameLoop() {
    if (this.frameHandle) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  recordPointer(tool: PointerTool, durationMs: number) {
    const key = tool || 'other';
    const s = this.pointerStats[key] || { count: 0, totalMs: 0, minMs: Number.POSITIVE_INFINITY, maxMs: 0 };
    s.count += 1;
    s.totalMs += durationMs;
    s.minMs = Math.min(s.minMs, durationMs);
    s.maxMs = Math.max(s.maxMs, durationMs);
    this.pointerStats[key] = s;
  }

  incBatchDraw(layerName: string) {
    const key = layerName || 'unknown-layer';
    this.batchDrawCounts[key] = (this.batchDrawCounts[key] || 0) + 1;
  }

  recordPointerPublic(tool: PointerTool, durationMs: number) { this.recordPointer(tool, durationMs); }
  incBatchDrawPublic(layerName: string) { this.incBatchDraw(layerName); }

  snapshot(): PerfSnapshot {
    const frameCount = this.frameCountWindow; // short window
    const initDurationMs = this.initStartTs != null && this.initEndTs != null ? this.initEndTs - this.initStartTs : undefined;
    return {
      initStart: this.initStartTs,
      initEnd: this.initEndTs,
      initDurationMs,
      frameCount,
      avgFrameMs: this.avgFrameMs,
      fps: this.fps,
      lastFrameAt: this.lastFrameTs,
      pointer: this.pointerStats,
      batchDraw: this.batchDrawCounts,
      lastUpdatedAt: Date.now(),
    };
  }

  reset() {
    this.initStartTs = undefined;
    this.initEndTs = undefined;
    this.lastFrameTs = undefined;
    this.frameAccum = 0;
    this.frameCountWindow = 0;
    this.avgFrameMs = undefined;
    this.fps = undefined;
    this.pointerStats = {};
    this.batchDrawCounts = {};
  }
}

export const performanceLogger = new PerformanceLogger();

// Expose on window for diagnostics
try {
  (window as any).CANVAS_PERF = {
    snapshot: () => performanceLogger.snapshot(),
    reset: () => performanceLogger.reset(),
    startFrame: () => performanceLogger.startFrameLoop(),
    stopFrame: () => performanceLogger.stopFrameLoop(),
    recordPointer: (tool: PointerTool, ms: number) => performanceLogger.recordPointerPublic(tool, ms),
    incBatchDraw: (layer: string) => performanceLogger.incBatchDrawPublic(layer),
  };
} catch {}

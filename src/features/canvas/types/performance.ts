// Canvas Performance Types (moved from features/canvas/types.ts)

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  elementCount: number;
  visibleElementCount: number;
}

// ElementGroup interface for viewport culling and performance optimization
export interface ElementGroup {
  id: string;
  elements: any[]; // Temporarily use any to resolve import issues
  bounds: { left: number; top: number; right: number; bottom: number }; // Inline ViewportBounds
  level: number;
  isVisible: boolean;
}
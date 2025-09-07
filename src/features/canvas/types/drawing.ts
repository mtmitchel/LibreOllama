export type DrawingStats = {
  strokesTotal: number;
  pointsTotal: number;
  // Progressive render diagnostics
  progressiveRenderEnabled: boolean;
  progressiveRenderFrameTime: number; // ms
  progressiveRenderPressure: 'low' | 'medium' | 'high' | number | string;
};


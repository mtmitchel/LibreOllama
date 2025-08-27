// Canvas Tool Types (moved from features/canvas/types.ts)

export interface CanvasTool {
  id: string;
  name: string;
  icon: React.ComponentType | string;
  description?: string;
  category?: string;
}
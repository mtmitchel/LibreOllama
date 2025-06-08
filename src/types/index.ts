export interface PanZoom {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Re-export CanvasElement types if they are defined elsewhere and used broadly
// For now, assuming CanvasElement specific types are handled in their own files or are simple enough not to need a central definition yet.

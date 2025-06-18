// Canvas Layer Types
import type { CanvasElement } from '../types';
import Konva from 'konva';

// Re-export common types for layer components
export type { CanvasElement } from '../types';

// Layer-specific interfaces
export interface LayerProps {
  elements: Record<string, CanvasElement>;
  sections: Record<string, any>;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

export interface BackgroundLayerProps extends LayerProps {
  gridEnabled?: boolean;
  gridSize?: number;
  gridColor?: string;
  backgroundColor?: string;
}

export interface MainLayerProps extends LayerProps {
  selectedElementIds: string[];
  onElementSelect: (elementId: string, event: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementUpdate: (elementId: string, updates: Partial<CanvasElement>) => void;
  onElementDoubleClick?: (elementId: string, event: Konva.KonvaEventObject<MouseEvent>) => void;
}

export interface ConnectorLayerProps extends LayerProps {
  connectors: Record<string, CanvasElement>;
  selectedElementIds: string[];
}

export interface UILayerProps extends LayerProps {
  selectedElementIds: string[];
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}

// Shape rendering interfaces
export interface ShapeComponentProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDoubleClick?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
}

// Performance optimization types
export interface RenderMetrics {
  totalElements: number;
  visibleElements: number;
  renderTime: number;
  frameRate: number;
}

export interface ViewportCullingConfig {
  enabled: boolean;
  margin: number;
  batchSize: number;
}
import type { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import Konva from 'konva';

// Re-export common types for layer components
export type { CanvasElement } from '../types/enhanced.types';

// Layer-specific interfaces
export interface LayerProps {
  elements: Map<ElementId | SectionId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementUpdate: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

export interface BackgroundLayerProps extends LayerProps {
  gridEnabled?: boolean;
  gridSize?: number;
  gridColor?: string;
  backgroundColor?: string;
}

export interface MainLayerProps extends LayerProps {
  visibleElements: CanvasElement[];
  enableProgressiveRendering?: boolean;
  viewport?: { x: number; y: number; scale: number; width: number; height: number };
}

export interface OverlayLayerProps extends LayerProps {
  sections: Map<SectionId, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
  hoveredSnapPoint?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  draggedElement?: CanvasElement | null;
  showSnapLines?: boolean;
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
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
// Archived (2025-09-01): Legacy layer types for react-konva path.

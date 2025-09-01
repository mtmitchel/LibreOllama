// src/features/canvas/layers/OverlayLayer.tsx
import React from 'react';
// react-konva removed from runtime per blueprint
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import { SelectionBox } from '../components/ui/SelectionBox';
import { SnapPointIndicator } from '../components/ui/SnapPointIndicator';
import { SnapLines } from '../components/ui/SnapLines';
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';
import { TransformerManager } from '../utils/TransformerManager';
import { SectionPreview } from '../components/ui/SectionPreview';

interface OverlayLayerProps {
  selectedElementIds: Set<ElementId>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  sections: Map<SectionId, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
  hoveredSnapPoint?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  draggedElement?: CanvasElement | null;
  showSnapLines?: boolean;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
}

/**
 * OverlayLayer - Selection, snapping visuals, previews, and Transformer in one layer
 */
// NO-OP OverlayLayer per blueprint: react-konva removed from runtime.
export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  elements,
  isDrawingSection = false,
  previewSection,
  stageRef,
  selectionBox,
  hoveredSnapPoint,
  draggedElement,
  showSnapLines = false,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  const transformerListeningRef = React.useRef<boolean | null>(null);

  // Only listen when we need to intercept events (e.g., marquee selection or drawing previews)
  const shouldListenToEvents = Boolean(isDrawingSection || (selectionBox && selectionBox.visible));

  // No-op: legacy react-konva overlay is disabled in runtime. The NonReactCanvasStage
  // manages overlay concerns (transformer, snap guides) imperatively.
  return null;
};

export default OverlayLayer;
// Archived (2025-09-01): Legacy react-konva overlay layer.

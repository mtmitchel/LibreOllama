// src/features/canvas/layers/UILayer.tsx
// Architectural Refactor Required: This component is currently >350 lines and needs to be broken down into smaller, focused components for improved maintainability, readability, and testability. This refactor is a significant undertaking and will be planned for Phase 3 - Hardening, Polish & Final Validation.
// TODO: Refactor to use enhanced types properly - currently using temporary type assertions
import React from 'react';
import { Layer, Group } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { SelectionBox } from '../components/ui/SelectionBox';
import { SnapPointIndicator } from '../components/ui/SnapPointIndicator';
import { SectionPreview } from '../components/ui/SectionPreview';

interface UILayerProps {
  selectedElementIds: Set<ElementId>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  sections: Map<SectionId, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
  hoveredSnapPoint?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  // Add history function for atomic undo/redo
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
}

/**
 * UILayer - Renders selection handles and UI overlays
 * - Selection rectangles and handles
 * - Transform controls and resize handles
 * - Tool-specific UI elements
 * - Section drawing previews
 * 
 * Refactoring Plan (Phase 3):
 * - Create a dedicated `SelectionLayer` component to encapsulate `SelectionBox` and `SnapPointIndicator`.
 * - Create a `DrawingPreviewLayer` component for `SectionPreview` and any other drawing-related previews.
 * - Potentially extract event handling logic into a custom hook (e.g., `useUILayerEvents`).
 * - Ensure all sub-components receive only necessary props, maintaining clear responsibilities.
 */
export const UILayer: React.FC<UILayerProps> = ({
  selectedElementIds,
  elements,
  sections,
  isDrawingSection = false,
  previewSection,
  stageRef,
  selectionBox,
  hoveredSnapPoint,
  onMouseDown = () => {},
  onMouseMove = () => {},
  onMouseUp = () => {},
  onElementUpdate,
  addHistoryEntry,
}) => {
  const layerRef = React.useRef<Konva.Group>(null);

  // Only listen when we actually need to intercept events
  const shouldListenToEvents = isDrawingSection || (selectionBox && selectionBox.visible);
  
  return (
    <Layer
      listening={shouldListenToEvents}
      name="ui-layer"
      onMouseDown={shouldListenToEvents ? onMouseDown : undefined}
      onMouseMove={shouldListenToEvents ? onMouseMove : undefined}
      onMouseUp={shouldListenToEvents ? onMouseUp : undefined}
    >
      <Group ref={layerRef}>
        <SectionPreview isDrawingSection={isDrawingSection} previewSection={previewSection} />
        <SelectionBox selectionBox={selectionBox} />
        <SnapPointIndicator hoveredSnapPoint={hoveredSnapPoint} />
      </Group>
    </Layer>
  );
};

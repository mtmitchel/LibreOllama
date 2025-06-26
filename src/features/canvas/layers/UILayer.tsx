// src/features/canvas/layers/UILayer.tsx
// TODO: [LO-Refactor] This component is >350 lines and needs to be broken down
// TODO: Refactor to use enhanced types properly - currently using temporary type assertions
import React from 'react';
import { Layer, Group } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { TransformerController } from '../components/ui/TransformerController';
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
 * TODO: [LO-Refactor] Break this component down into smaller components:
 * - TransformerController
 * - SelectionBox
 * - SnapPointIndicator
 * - SectionPreview
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
  const useCentralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
  const layerRef = React.useRef<Konva.Group>(null);

  return (
    <Layer
      listening={true}
      name="ui-layer"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <Group ref={layerRef}>
        {!useCentralizedTransformer && (
          <TransformerController
            selectedElementIds={selectedElementIds}
            elements={elements}
            sections={sections}
            stageRef={stageRef}
            onElementUpdate={onElementUpdate}
            addHistoryEntry={addHistoryEntry}
          />
        )}

        <SectionPreview isDrawingSection={isDrawingSection} previewSection={previewSection} />
        <SelectionBox selectionBox={selectionBox} />
        <SnapPointIndicator hoveredSnapPoint={hoveredSnapPoint} />
      </Group>
    </Layer>
  );
};

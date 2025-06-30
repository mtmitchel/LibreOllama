// src/features/canvas/utils/TransformerManager.tsx
import React from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { CustomTransformer } from '../components/ui/CustomTransformer';

interface TransformerManagerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * TransformerManager - Centralized transformer lifecycle management
 * 
 * This component implements centralized control over Konva transformers to prevent
 * conflicts and ensure proper transformer lifecycle management.
 * 
 * Benefits:
 * - ✅ Fixes Bug 2.4 (unable to resize sections)
 * - ✅ Prevents transformer conflicts
 * - ✅ Enables multi-element transformations
 * - ✅ Consistent transformer behavior across all elements
 */
export const TransformerManager: React.FC<TransformerManagerProps> = ({ stageRef }) => {
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);

  const selectedIdsArray = Array.from(selectedElementIds);

  return <CustomTransformer selectedNodeIds={selectedIdsArray} stageRef={stageRef} />;
};

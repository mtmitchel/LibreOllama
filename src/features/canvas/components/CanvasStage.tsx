import React, { useRef, useMemo, useCallback } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import UnifiedEventHandler from '../utils/UnifiedEventHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { ToolLayer } from '../layers/ToolLayer';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import DebugOverlay from '../components/DebugOverlay';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import CanvasStabilityCheck from '../utils/CanvasStabilityCheck';

/**
 * CanvasStage - The primary component for the Konva canvas.
 *
 * This component is responsible for:
 * - Creating the main Konva Stage.
 * - Fetching all necessary state from the unified Zustand store.
 * - Delegating event handling to UnifiedEventHandler.
 * - Delegating element and layer rendering to CanvasLayerManager.
 * - It is self-contained and does not accept props.
 */
const CanvasStage: React.FC = () => {
  const stageRef = useRef<Konva.Stage | null>(null);

  // SELECTIVE: Only essential subscriptions to prevent infinite loops
  const viewport = useUnifiedCanvasStore(canvasSelectors.viewport);
  const selectedElementIds = useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
  const currentTool = useUnifiedCanvasStore(canvasSelectors.selectedTool); // RESTORED: Essential for toolbar
  
  // Fixed: Use selectors to prevent infinite loops  
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const sections = useUnifiedCanvasStore(canvasSelectors.sections);
  
  // Fixed: Use actual store actions
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const handleElementDrop = useUnifiedCanvasStore(state => state.handleElementDrop);

  const { width, height } = viewport;
  const panZoomState = { scale: viewport.scale, position: { x: viewport.x, y: viewport.y } };

  // Fixed: Actually use the elements from store
  const allElements = useMemo(() => {
    console.log('🎯 [CanvasStage] Creating allElements map with', elements.size, 'elements');
    return elements;
  }, [elements]);

  // SIMPLIFIED: Static stage configuration to prevent loops
  const stageConfig = useMemo(() => {
    console.log('🎯 [CanvasStage] Creating stageConfig (SIMPLIFIED)');
    return {
      width: viewport?.width || 1920,
      height: viewport?.height || 1080,
      scaleX: viewport?.scale || 1,
      scaleY: viewport?.scale || 1,
      x: viewport?.x || 0,
      y: viewport?.y || 0,
      draggable: false, // Disabled for stability
      listening: true,
      perfectDrawEnabled: false,
      pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
    };
  }, [viewport?.width, viewport?.height]); // Only depend on stable viewport dimensions

  // Fixed: Enable basic event callbacks
  const onElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => {
    console.log('🎯 [CanvasStage] Element drag end:', elementId);
    const node = e.target;
    updateElement(elementId, { x: node.x(), y: node.y() });
  }, [updateElement]);

  const onElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    console.log('🎯 [CanvasStage] Element click:', element.id);
    selectElement(element.id as ElementId, e.evt.ctrlKey || e.evt.metaKey);
  }, [selectElement]);

  return (
    <CanvasErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 [CanvasStage] Critical error in canvas rendering:', {
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Stage
        ref={stageRef}
        {...stageConfig}
        style={{ backgroundColor: 'var(--canvas-bg)' }}
        onWheel={(e) => {}} // Temporarily disabled until handleCanvasWheel is implemented
      >
        <UnifiedEventHandler stageRef={stageRef} />
        
        <CanvasLayerManager 
            stageRef={stageRef}
            elements={allElements}
            selectedElementIds={selectedElementIds}
            onElementUpdate={updateElement}
            onElementDragEnd={onElementDragEnd}
            onElementClick={onElementClick}
            onStartTextEdit={setTextEditingElement}
          />
          
        {/* Tool Layer - handles all drawing and selection tools */}
        <ToolLayer stageRef={stageRef} />
      </Stage>
      <DebugOverlay />
      <CanvasStabilityCheck />
    </CanvasErrorBoundary>
  );
};

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;

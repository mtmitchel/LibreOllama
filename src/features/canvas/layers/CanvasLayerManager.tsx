// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Layer } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';

import { UILayer } from './UILayer';
// import { ElementRenderer } from '../renderers/ElementRenderer';
import { TransformerManager } from '../utils/TransformerManager';

import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

// import { Layer as LayerData } from '../stores/slices/layerStore'; // Legacy import
import { useShallow } from 'zustand/react/shallow';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  SectionElement
} from '../types/enhanced.types';
// import { canvasSelectors } from '../stores/selectors'; 
import { useSimpleViewportCulling } from '../hooks/useSimpleViewportCulling';
import { canvasLog } from '../utils/canvasLogger';

interface CanvasLayerManagerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  onElementUpdate: (id: ElementOrSectionId, updates: Partial<CanvasElement>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

/**
 * CanvasLayerManager is responsible for:
 * - Separating elements into connectors and non-connectors.
 * - Passing elements to appropriate layers.
 * - Managing layer order (background -> main elements -> connectors -> selection).
 * - NOT responsible for event handling (that's handled by UnifiedEventHandler)
 */
export const CanvasLayerManager: React.FC<CanvasLayerManagerProps> = React.memo(({
  stageRef,
  elements,
  selectedElementIds,
  onElementUpdate,
  onElementDragEnd,
  onElementClick,
  onStartTextEdit
}) => {
  // OPTIMIZED: Consolidated store subscriptions using useShallow - MUST be called before any returns
  const { selectedTool, viewport } = useUnifiedCanvasStore(useShallow((state) => ({
    selectedTool: state.selectedTool,
    viewport: state.viewport
  })));

  // Deferred - sections (commented out - not implemented in store yet)
  // const sections = useUnifiedCanvasStore(canvasSelectors.sections);
  // const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  // const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  // const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);

  // DISABLED: Drawing state that might cause loops
  const storeIsDrawing = false;
  const currentPath: number[] = [];

  // Drawing functions - using stubs until proper implementation
  // const startDrawing = () => {};
  // const updateDrawing = () => {};
  // const finishDrawing = () => {};
  
  // Feature flags
  // const useGroupedSections = enhancedFeatureFlagManager.getFlag('grouped-section-rendering');
  // const useCentralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
  

  
  // Other hooks and state that are still managed internally
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const handleResize = useCallback(() => {
    const stage = stageRef.current;
    if (stage) {
      setStageSize({ width: stage.width(), height: stage.height() });
    }
  }, [stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      // Set initial size
      handleResize();
      
      stage.on('resize', handleResize);
      return () => {
        stage.off('resize', handleResize);
      };
    }
  }, [stageRef, handleResize]);
  
  // Convert Map to array for processing
  const elementsArray = useMemo(() => Array.from(elements.values()), [elements]);

  // Use viewport culling for performance
  const cullingResult = useSimpleViewportCulling({
    elements: elementsArray,
    zoomLevel: viewport.scale || 1,
    panOffset: { x: viewport.x || 0, y: viewport.y || 0 },
    canvasSize: stageSize.width > 0 ? stageSize : null,
    buffer: 300 // Generous buffer for smooth scrolling
  });
  
  const visibleElements = cullingResult.visibleElements;
  // const cullingStats = cullingResult.cullingStats;

  // OPTIMIZED: Element categorization using culled visible elements  
  const {
    mainElements,
    sectionElements,
    elementsBySection,
  } = useMemo(() => {
    const main: (CanvasElement & { id: ElementId })[] = [];
    const sections: SectionElement[] = [];
    const bySection = new Map<SectionId, CanvasElement[]>();

    // Use viewport-culled elements for massive performance boost
    for (const element of visibleElements) {
      if (element.type === 'section') {
        sections.push(element as SectionElement);
      } else {
        // All elements including connectors go to main - they're handled by ElementRenderer
        main.push(element as CanvasElement & { id: ElementId });
      }
    }
    
    // Log performance gain when significant culling occurs
    if (elementsArray.length > 50 && visibleElements.length < elementsArray.length * 0.8) {
      canvasLog.debug('🚀 [Viewport Culling] Performance boost:', {
        total: elementsArray.length,
        visible: visibleElements.length,
        culled: `${Math.round((1 - visibleElements.length/elementsArray.length) * 100)}%`
      });
    }
    
    return { mainElements: main, sectionElements: sections, elementsBySection: bySection };
  }, [visibleElements, elementsArray.length]);

  // Hide layers panel toggle - not implemented yet
  // const showLayersPanel = false;
  // const toggleLayersPanel = () => {
  //   canvasLog.debug('Layers panel toggle not implemented yet');
  // };

  // SIMPLIFIED: Prevent memoization issues that cause infinite loops
  const sortedMainElements = mainElements;
  const sectionElementsMap = new Map(sectionElements.map(s => [s.id, s]));
  // const sortedSectionElements = sectionElements;
  const sortedElementsBySection = elementsBySection;

  // SIMPLIFIED: Remove complex memoization
  const selectedElementIdsOnly = new Set(Array.from(selectedElementIds).filter(id => {
    // Only include ElementIds, not SectionIds
    return !sectionElements.some(section => String(section.id) === String(id));
  }) as ElementId[]);

  // Simplified event handlers (temporarily disabled)
  // const handleMouseDown = useCallback(() => {}, []);
  // const handleMouseMove = useCallback(() => {}, []);
  // const handleMouseUp = useCallback(() => {}, []);

  // Define missing variables with default values
  const layers = [
    { id: 'background', name: 'Background', visible: true },
    { id: 'main', name: 'Main', visible: true },
    { id: 'connector', name: 'Connector', visible: true },
    { id: 'ui', name: 'UI', visible: true },
  ];

  // Temporary stubs for missing state - these should be properly implemented
  // const isDrawingConnector = false;
  // const connectorStart = null;
  // const connectorEnd = null;
  const isDrawingSection = false;
  const previewSection = null;
  const hoveredSnapPoint = null;
  const addHistoryEntry = () => {}; // Stub
  // const onElementDragStart = undefined;
  // const onElementDragMove = undefined;

  // Simple DrawingContainment component stub
  const DrawingContainment: React.FC<{ isDrawing: boolean; currentTool: string; stageRef: React.RefObject<Konva.Stage | null> }> = () => null;

  // Early return check AFTER all hooks have been called
  if (!stageRef) {
    canvasLog.error('[CanvasLayerManager] stageRef is null, cannot render.');
    return null;
  }

  const renderLayerContent = () => {
    const contentLayerComponents: React.ReactNode[] = [];
    const otherLayers: React.ReactNode[] = [];

    const layerComponents: Record<string, React.ReactNode> = {
      background: (
        <BackgroundLayer
          key="background"
          width={stageSize.width}
          height={stageSize.height}
        />
      ),
      main: (
        <React.Fragment key="main">
          <MainLayer
              elements={new Map(sortedMainElements.map(el => [el.id, el]))}
              selectedElementIds={new Set(Array.from(selectedElementIds).filter(id => sortedMainElements.some(el => el.id === id)) as ElementId[])}
              selectedTool={selectedTool}
              isDrawing={storeIsDrawing}
              currentPath={currentPath}
              elementsBySection={sortedElementsBySection}
              stageRef={stageRef}
              onElementUpdate={onElementUpdate}
              onElementDragEnd={onElementDragEnd}
              onElementClick={onElementClick}
              onStartTextEdit={onStartTextEdit}
            />
        </React.Fragment>
      ),
      connector: null, // Connectors now rendered through MainLayer/ElementRenderer
      ui: (
        <UILayer
          key="ui"
          stageRef={stageRef}
          selectedElementIds={selectedElementIdsOnly}
          elements={elements}
          sections={sectionElementsMap}
          isDrawingSection={isDrawingSection ?? false}
          previewSection={previewSection ?? null}
          selectionBox={selectionBox}
          hoveredSnapPoint={hoveredSnapPoint as { x: number; y: number; elementId?: ElementId; anchor?: string } | null}
          onElementUpdate={onElementUpdate}
          addHistoryEntry={addHistoryEntry}
        />
      ),
    };

    layers.forEach(layerData => {
      if (!layerData.visible) return;

      const component = layerComponents[layerData.id];
      if (!component) return;

      if (['background', 'main', 'connector'].includes(layerData.id)) {
        contentLayerComponents.push(component);
      } else {
        otherLayers.push(component);
      }
    });

    const finalLayers = [
      <Layer key="content-layer">
        {contentLayerComponents}
        <DrawingContainment
          isDrawing={storeIsDrawing}
          currentTool={selectedTool}
          stageRef={stageRef}
        />
      </Layer>,
      ...otherLayers,
      // Add TransformerManager as a separate layer
      <Layer key="transformer-layer">
        <TransformerManager stageRef={stageRef} />
      </Layer>
    ];

    return <>{finalLayers}</>;
  };

  return renderLayerContent();
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.elements === nextProps.elements &&
    prevProps.selectedElementIds === nextProps.selectedElementIds &&
    prevProps.stageRef === nextProps.stageRef
  );
});

CanvasLayerManager.displayName = 'CanvasLayerManager';

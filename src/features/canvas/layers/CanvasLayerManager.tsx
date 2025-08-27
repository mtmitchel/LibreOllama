// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Layer, Rect, Text } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';

import { UILayer } from './UILayer';
// import { ElementRenderer } from '../renderers/ElementRenderer';
import { TransformerManager } from '../utils/TransformerManager';

import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { verifyStoreInitialization } from '../stores/storeInitialization';

import { useShallow } from 'zustand/react/shallow';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  SectionElement
} from '../types/enhanced.types';
// import { canvasSelectors } from '../stores/selectors'; 
import { canvasLog } from '../utils/canvasLogger';
import { useSimpleViewportCulling } from '../hooks/useSimpleViewportCulling';
import { markInit, measureInit, initMarkers } from '../utils/performance/initInstrumentation';

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
  // Mark layer manager mount start
  useEffect(() => {
    markInit(initMarkers.LAYER_MANAGER_MOUNT_START);
    return () => {
      markInit(initMarkers.LAYER_MANAGER_MOUNT_END);
      measureInit('layer-manager-mount', initMarkers.LAYER_MANAGER_MOUNT_START, initMarkers.LAYER_MANAGER_MOUNT_END);
    };
  }, []);
  // OPTIMIZED: Consolidated store subscriptions using useShallow - MUST be called before any returns
  const store = useUnifiedCanvasStore();
  const { selectedTool, viewport } = useUnifiedCanvasStore(useShallow((state) => ({
    selectedTool: state.selectedTool,
    viewport: state.viewport
  })));

  // Comprehensive store initialization check
  const initReport = verifyStoreInitialization(store);
  if (!initReport.isReady) {
    console.error('[CanvasLayerManager] Store not fully initialized:', initReport);
    return (
      <Layer>
        <Rect x={0} y={0} width={150} height={80} fill="red" stroke="white" strokeWidth={2} />
        <Text x={10} y={20} text="Store Initialization" fontSize={12} fill="white" fontStyle="bold" />
        <Text x={10} y={35} text="Error Detected" fontSize={12} fill="white" fontStyle="bold" />
        <Text x={10} y={55} text={`${initReport.initializationErrors.length} errors`} fontSize={10} fill="white" />
      </Layer>
    );
  }

  // Drawing state (currently disabled to prevent loops)
  const storeIsDrawing = false;
  const currentPath: number[] = [];
  

  
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
  
  // Comprehensive defensive checks for store initialization
  if (!elements || !(elements instanceof Map)) {
    console.warn('[CanvasLayerManager] Elements Map not properly initialized');
    return (
      <Layer>
        <Rect x={0} y={0} width={120} height={50} fill="red" />
        <Text x={10} y={15} text="Canvas loading..." fontSize={14} fill="white" />
      </Layer>
    );
  }

  // Defensive check for selectedElementIds Set
  if (!selectedElementIds || !(selectedElementIds instanceof Set)) {
    console.warn('[CanvasLayerManager] SelectedElementIds Set not properly initialized');
    return (
      <Layer>
        <Rect x={0} y={0} width={120} height={50} fill="orange" />
        <Text x={10} y={15} text="Store loading..." fontSize={14} fill="white" />
      </Layer>
    );
  }

  // Defensive check for viewport object
  if (!viewport || typeof viewport !== 'object') {
    console.warn('[CanvasLayerManager] Viewport not properly initialized');
    return (
      <Layer>
        <Rect x={0} y={0} width={120} height={50} fill="yellow" />
        <Text x={10} y={15} text="Viewport loading..." fontSize={14} fill="black" />
      </Layer>
    );
  }

  // Defensive check for stage ref
  if (!stageRef.current) {
    console.warn('[CanvasLayerManager] Stage ref not initialized');
    return null;
  }

  // Convert Map to array for processing
  const elementsArray = useMemo(() => {
    try {
      return Array.from(elements.values());
    } catch (e) {
      console.error('[CanvasLayerManager] Failed to convert elements Map to array:', e);
      return [];
    }
  }, [elements]);

  // Removed: camera object - viewport handling is now integrated into advanced optimizations

  // STANDARDIZED: Use simple viewport culling for consistent performance
  const cullingResult = useSimpleViewportCulling({
    elements: elementsArray,
    camera: {
      zoomLevel: viewport.scale || 1,
      panOffset: { x: viewport.x || 0, y: viewport.y || 0 },
      canvasSize: { width: stageSize.width || 1000, height: stageSize.height || 1000 }
    },
    buffer: 200 // Standard buffer
  });

  const visibleElements = cullingResult.visibleElements;
  const { cullingStats } = cullingResult;

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
    
    // Log simple culling performance gains
    if (cullingStats.totalElements > 50 && cullingStats.culledElements > 0) {
      canvasLog.debug('🚀 [Simple Culling] Performance boost:', {
        total: cullingStats.totalElements,
        visible: cullingStats.visibleElements,
        culled: cullingStats.culledElements,
        optimized: `${Math.round((cullingStats.culledElements/cullingStats.totalElements) * 100)}%`
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

  // Define layer configuration
  const layers = [
    { id: 'background', name: 'Background', visible: true },
    { id: 'main', name: 'Main', visible: true },
    { id: 'ui', name: 'UI', visible: true },
  ];

  // UI state for sections
  const isDrawingSection = false;
  const previewSection = null;
  const hoveredSnapPoint = null;
  const addHistoryEntry = () => {}; // TODO: Implement history integration

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
              visibleElements={visibleElements}
              enableProgressiveRendering={true}
              viewport={{
                x: viewport.x || 0,
                y: viewport.y || 0,
                scale: viewport.scale || 1,
                width: stageSize.width || 1000,
                height: stageSize.height || 1000
              }}
            />
        </React.Fragment>
      ),
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

      if (layerData.id === 'main') {
        contentLayerComponents.push(component);
      } else {
        otherLayers.push(component);
      }
    });

    // Separate background layer to render first
    const backgroundLayer = layerComponents.background && layers.find(l => l.id === 'background')?.visible ? 
      [layerComponents.background] : [];
    
    // Other layers (excluding background which is handled separately)
    const otherLayersFiltered = otherLayers.filter(layer => 
      React.isValidElement(layer) && layer.key !== 'background'
    );

    const finalLayers = [
      ...backgroundLayer, // BackgroundLayer (non-listening Layer) renders first as Stage sibling
      <Layer key="content-layer">
        {contentLayerComponents}
        <DrawingContainment
          isDrawing={storeIsDrawing}
          currentTool={selectedTool}
          stageRef={stageRef}
        />
      </Layer>,
      ...otherLayersFiltered,
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
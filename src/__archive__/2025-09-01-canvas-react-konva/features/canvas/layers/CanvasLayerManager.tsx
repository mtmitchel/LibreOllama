// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Layer, Rect, Text } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
// import { MainLayer } from './MainLayer';
import { MainLayerSimple as MainLayer } from './MainLayerSimple';

import { OverlayLayer } from './OverlayLayer';
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
// import { useSimpleViewportCulling } from '../hooks/useSimpleViewportCulling';
// Use advanced spatial indexing with QuadTree
import { useSpatialIndex } from '../hooks/useSpatialIndex';
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
 * - NOT responsible for event handling (that's handled by CanvasEventManager)
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
  // Mark layer manager mount start and end immediately
  useEffect(() => {
    markInit(initMarkers.LAYER_MANAGER_MOUNT_START);
    
    // FIXED: Measure mount time immediately, not on unmount
    requestAnimationFrame(() => {
      markInit(initMarkers.LAYER_MANAGER_MOUNT_END);
      measureInit('layer-manager-mount', initMarkers.LAYER_MANAGER_MOUNT_START, initMarkers.LAYER_MANAGER_MOUNT_END);
    });
  }, []);
  // OPTIMIZED: Consolidated store subscriptions using useShallow - MUST be called before any returns
  const store = useUnifiedCanvasStore();
  const { selectedTool, viewport } = useUnifiedCanvasStore(useShallow((state) => ({
    selectedTool: state.selectedTool,
    viewport: state.viewport
  })));

  // OPTIMIZED: Memoized store initialization check to prevent performance overhead
  const initReport = useMemo(() => verifyStoreInitialization(store), []);
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

  // Drawing state - connect to actual store
  const storeIsDrawing = useUnifiedCanvasStore(state => state.isDrawing);
  const currentPath = useUnifiedCanvasStore(state => state.currentPath);
  

  
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
  }, [elements, (elements as any)?.size]);

  // Removed: camera object - viewport handling is now integrated into advanced optimizations

  // SIMPLIFIED: Spatial indexing disabled for performance - just use all elements
  const visibleElements = elementsArray;
  const cullingStats = { 
    totalElements: elementsArray.length, 
    visibleElements: elementsArray.length, 
    culledElements: 0 
  };

  // OPTIMIZED: Element categorization using culled visible elements  
  const {
    mainElements,
    imageElements,
    sectionElements,
    elementsBySection,
  } = useMemo(() => {
    const main: (CanvasElement & { id: ElementId })[] = [];
    const images: (CanvasElement & { id: ElementId })[] = [];
    const sections: SectionElement[] = [];
    const bySection = new Map<SectionId, CanvasElement[]>();

    // Use viewport-culled elements for massive performance boost
    for (const element of visibleElements) {
      if (element.type === 'section') {
        sections.push(element as SectionElement);
      } else {
        // ALL elements including images go to main layer to avoid multiple MainLayer instances
        main.push(element as CanvasElement & { id: ElementId });
      }
    }
    
    // Log simple culling performance gains
    if (cullingStats.totalElements > 50 && (cullingStats as any).culledElements > 0) {
      canvasLog.debug('🚀 [Simple Culling] Performance boost:', {
        total: cullingStats.totalElements,
        visible: cullingStats.visibleElements,
        culled: cullingStats.culledElements,
        optimized: `${Math.round((cullingStats.culledElements/cullingStats.totalElements) * 100)}%`
      });
    }
    
    return { mainElements: main, imageElements: images, sectionElements: sections, elementsBySection: bySection };
  }, [visibleElements, elementsArray.length]);

  // Hide layers panel toggle - not implemented yet
  // const showLayersPanel = false; // ToolLayer and UILayer have been consolidated; see OverlayLayer
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
    // Define layer configuration
    const layerConfig = [
      { id: 'background', name: 'Background', visible: true },
      { id: 'main', name: 'Main', visible: true },
      { id: 'ui', name: 'UI', visible: true },
    ];

    const backgroundLayer = layerConfig.find(l => l.id === 'background')?.visible ? (
      <BackgroundLayer
        key="background"
        width={stageSize.width}
        height={stageSize.height}
      />
    ) : null;

    const mainLayerContent = layerConfig.find(l => l.id === 'main')?.visible ? (
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
        enableProgressiveRendering={false}
        viewport={{
          x: viewport.x || 0,
          y: viewport.y || 0,
          scale: viewport.scale || 1,
          width: stageSize.width || 1000,
          height: stageSize.height || 1000
        }}
      />
    ) : null;

    const uiLayer = layerConfig.find(l => l.id === 'ui')?.visible ? (
      <OverlayLayer
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
    ) : null;

    // BackgroundLayer already returns a Layer component, so we render it directly
    // MainLayer returns content (not a Layer), so we wrap it in a Layer
    // UILayer already returns a Layer component
    
    return (
      <>
        {/* Background Layer - always rendered first, never conditionally removed */}
        {backgroundLayer}
        
        {/* Main Content Layer - wraps MainLayer content in a Layer */}
        {mainLayerContent && (
          <Layer key="content-layer">
            {mainLayerContent}
            <DrawingContainment
              isDrawing={storeIsDrawing}
              currentTool={selectedTool}
              stageRef={stageRef}
            />
          </Layer>
        )}
        
        {/* REMOVED: Image layer was creating multiple MainLayer instances causing severe performance issues */}
        {/* Images should be rendered in the main MainLayer along with other elements */}
        
        {/* UI Overlay Layer - already returns a Layer */}
        {uiLayer}
        
        {/* Transformer is now part of OverlayLayer to keep anchors interactive */}
      </>
    );
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
// Archived (2025-09-01): Legacy react-konva layer manager.

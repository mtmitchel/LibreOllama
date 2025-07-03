// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo, useState, useEffect } from 'react';
import Konva from 'konva';
import { Layer } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
// import { ElementRenderer } from '../renderers/ElementRenderer';
import { TransformerManager } from '../utils/TransformerManager';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';
import { Line } from 'react-konva';
// import { Layer as LayerData } from '../stores/slices/layerStore'; // Legacy import
interface LayerData {
  id: string;
  name: string;
  visible: boolean;
}
import { CanvasElement, ElementId, SectionElement as SectionElementType, SectionId, isSectionElement, ConnectorElement } from '../types/enhanced.types';
import { useViewportCulling } from '../hooks/useViewportCulling';

interface CanvasLayerManagerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  selectedElementIds: Set<ElementId | SectionId>;
  onElementUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

export const CanvasLayerManager: React.FC<CanvasLayerManagerProps> = ({
  stageRef,
  elements,
  selectedElementIds,
  onElementUpdate,
  onElementDragEnd,
  onElementClick,
  onStartTextEdit,
}) => {
  if (!stageRef) {
    console.error('[CanvasLayerManager] stageRef is null, cannot render.');
    return null;
  }

  // SELECTIVE: Essential subscriptions only
  const selectedTool = useUnifiedCanvasStore(canvasSelectors.selectedTool);
  const viewport = useUnifiedCanvasStore(canvasSelectors.viewport); // RESTORED: Needed for proper canvas sizing
  const panZoomState = { scale: viewport.scale, position: { x: viewport.x, y: viewport.y } };
  
  // TEMPORARILY DISABLED: These were causing re-render loops
  // const sections = useUnifiedCanvasStore(canvasSelectors.sections);
  // const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  // const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  // const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  
  // Stub implementations to prevent crashes
  const sections = new Map();
  const updateSection = () => {};
  const selectElement = () => {};
  const clearSelection = () => {};

  // DISABLED: Drawing state that might cause loops
  const storeIsDrawing = false;
  const currentPath: number[] = [];

  // Drawing functions - using stubs until proper implementation
  const startDrawing = () => {};
  const updateDrawing = () => {};
  const finishDrawing = () => {};
  
  // Feature flags
  const useGroupedSections = enhancedFeatureFlagManager.getFlag('grouped-section-rendering');
  const useCentralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
  

  
  // Other hooks and state that are still managed internally
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      setStageSize({ width: stage.width(), height: stage.height() });
      const handleResize = () => {
        setStageSize({ width: stage.width(), height: stage.height() });
      };
      stage.on('resize', handleResize);
      return () => {
        stage.off('resize', handleResize);
      };
    }
  }, [stageRef]);
  
  // Convert elements map to array for processing
  const elementsArray = useMemo(() => {
    return Array.from(elements.values());
  }, [elements]);

  // ENABLED: Advanced viewport culling with quadtree (massive performance boost)
  const cullingResult = useViewportCulling({
    elements: elementsArray,
    zoomLevel: viewport.scale || 1,
    panOffset: { x: viewport.x || 0, y: viewport.y || 0 },
    canvasSize: stageSize.width > 0 ? stageSize : null,
    config: {
      enableQuadtree: true,
      enableLOD: true,
      enableHierarchicalCulling: true
    }
  });
  
  const visibleElements = cullingResult.visibleElements;
  const cullingStats = cullingResult.cullingStats;

  // OPTIMIZED: Element categorization using culled visible elements  
  const {
    mainElements,
    connectorElements,
    sectionElements,
    elementsBySection,
  } = useMemo(() => {
    const main: CanvasElement[] = [];
    const connectors: ConnectorElement[] = [];
    const sections: SectionElementType[] = [];
    const bySection = new Map<SectionId, CanvasElement[]>();

    // Use viewport-culled elements for massive performance boost
    for (const element of visibleElements) {
      if (element.type === 'connector') {
        connectors.push(element as ConnectorElement);
      } else if (element.type === 'section') {
        sections.push(element as SectionElementType);
      } else {
        main.push(element);
      }
    }
    
    // Log performance gain when significant culling occurs
    if (elementsArray.length > 50 && visibleElements.length < elementsArray.length * 0.8) {
      console.log('🚀 [Viewport Culling] Performance boost:', {
        total: elementsArray.length,
        visible: visibleElements.length,
        culled: `${Math.round((1 - visibleElements.length/elementsArray.length) * 100)}%`
      });
    }
    
    return { mainElements: main, connectorElements: connectors, sectionElements: sections, elementsBySection: bySection };
  }, [visibleElements, elementsArray.length]);

  // SIMPLIFIED: Prevent memoization issues that cause infinite loops
  const sortedMainElements = mainElements;
  const connectorElementsMap = new Map(connectorElements.map(c => [c.id, c]));
  const sectionElementsMap = new Map(sectionElements.map(s => [s.id, s]));
  const sortedSectionElements = sectionElements;
  const sortedElementsBySection = elementsBySection;

  // SIMPLIFIED: Remove complex memoization
  const selectedElementIdsOnly = selectedElementIds;

  // Simplified event handlers (temporarily disabled)
  const handleMouseDown = () => {};
  const handleMouseMove = () => {};
  const handleMouseUp = () => {};

  // Define missing variables with default values
  const layers = [
    { id: 'background', name: 'Background', visible: true },
    { id: 'main', name: 'Main', visible: true },
    { id: 'connector', name: 'Connector', visible: true },
    { id: 'ui', name: 'UI', visible: true },
  ];

  // Temporary stubs for missing state - these should be properly implemented
  const isDrawingConnector = false;
  const connectorStart = null;
  const connectorEnd = null;
  const isDrawingSection = false;
  const previewSection = null;
  const hoveredSnapPoint = null;
  const addHistoryEntry = () => {}; // Stub
  const onElementDragStart = undefined;
  const onElementDragMove = undefined;

  // Simple DrawingContainment component stub
  const DrawingContainment: React.FC<{ isDrawing: boolean; currentTool: string; stageRef: React.RefObject<Konva.Stage | null> }> = () => null;

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
              selectedElementIds={selectedElementIds}
              selectedTool={selectedTool}
              isDrawing={storeIsDrawing}
              currentPath={currentPath}
              elementsBySection={sortedElementsBySection}
              stageRef={stageRef}
            />
        </React.Fragment>
      ),
      connector: (
        <ConnectorLayer
          key="connector"
          elements={connectorElementsMap}
          selectedElementIds={selectedElementIdsOnly}
          onElementClick={onElementClick}
          onElementUpdate={onElementUpdate}
          isDrawingConnector={isDrawingConnector ?? false}
          connectorStart={connectorStart ?? null}
          connectorEnd={connectorEnd ?? null}
          selectedTool={selectedTool}
        />
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
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

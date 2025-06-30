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
  
  // DEBUG: Log the actual value
  console.log('🔧 [CanvasLayerManager] useCentralizedTransformer:', useCentralizedTransformer);
  
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
  
  // FIXED: Create a proper dependency for element changes
  const elementsArray = useMemo(() => {
    console.log('🔧 [CanvasLayerManager] Converting elements map to array:', elements.size);
    const array = Array.from(elements.values());
    // Log the actual elements for debugging
    array.forEach(el => {
      if (el.type === 'text') {
        console.log('🔧 [CanvasLayerManager] Text element:', { 
          id: el.id, 
          text: (el as any).text, 
          x: el.x, 
          y: el.y 
        });
      }
    });
    return array;
  }, [elements]); // Depend on the Map itself

  // Stub for disabled viewport culling
  const visibleElements = elementsArray;
  const cullingStats = { totalElements: 0, visibleElements: 0 };

  // FIXED: Element categorization with proper dependencies
  const {
    mainElements,
    connectorElements,
    sectionElements,
    elementsBySection,
  } = useMemo(() => {
    console.log('🔧 [CanvasLayerManager] Categorizing elements, count:', elementsArray.length);
    
    const main: CanvasElement[] = [];
    const connectors: ConnectorElement[] = [];
    const sections: SectionElementType[] = [];
    const bySection = new Map<SectionId, CanvasElement[]>();

    // Simple categorization without complex logic
    for (const element of elementsArray) {
      if (element.type === 'connector') {
        connectors.push(element as ConnectorElement);
      } else if (element.type === 'section') {
        sections.push(element as SectionElementType);
      } else {
        main.push(element);
      }
    }
    
    console.log('🔧 [CanvasLayerManager] Categorized:', {
      main: main.length,
      connectors: connectors.length,
      sections: sections.length
    });
    
    return { mainElements: main, connectorElements: connectors, sectionElements: sections, elementsBySection: bySection };
  }, [elementsArray]); // Depend on the actual array content

  // SIMPLIFIED: Prevent memoization issues that cause infinite loops
  const sortedMainElements = mainElements;
  const connectorElementsMap = new Map(connectorElements.map(c => [c.id, c]));
  const sectionElementsMap = new Map(sectionElements.map(s => [s.id, s]));
  const sortedSectionElements = sectionElements;
  const sortedElementsBySection = elementsBySection;

  // SIMPLIFIED: Remove complex memoization
  const selectedElementIdsOnly = selectedElementIds;

  // DISABLED: All mouse handlers to prevent infinite loops
  // These were using store functions that cause re-renders
  
  const handleMouseDown = () => {
    console.log('🎯 [CanvasLayerManager] Mouse down (DISABLED)');
  };

  const handleMouseMove = () => {
    // Disabled to prevent infinite loops
  };

  const handleMouseUp = () => {
    // Disabled to prevent infinite loops
  };

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
      // FORCE DISABLE: Centralized transformer completely disabled for cleaner design
      // ...(useCentralizedTransformer ? [
      //   <Layer key="centralized-transformer">
      //     <TransformerManager stageRef={stageRef} />
      //   </Layer>
      // ] : [])
    ];

    return <>{finalLayers}</>;
  };

  return renderLayerContent();
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

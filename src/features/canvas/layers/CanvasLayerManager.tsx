// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo } from 'react';
import Konva from 'konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { CanvasElement } from '../stores/types';
import { useViewportCulling } from '../hooks/useViewportCulling';

interface CanvasLayerManagerProps {
  stageWidth: number;
  stageHeight: number;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDragStart?: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementDragMove?: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: string) => void;
  onSectionResize?: (sectionId: string, newWidth: number, newHeight: number) => void;
  isDrawing?: boolean;
  currentPath?: number[];
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}

export const CanvasLayerManager: React.FC<CanvasLayerManagerProps> = ({
  stageWidth,
  stageHeight,
  stageRef,
  onElementUpdate,
  onElementDragStart,
  onElementDragEnd,
  onElementDragMove,
  onElementClick,
  onStartTextEdit,
  onSectionResize,
  isDrawing = false,
  currentPath = [],
  isDrawingConnector = false,
  connectorStart,
  connectorEnd,
  isDrawingSection = false,
  previewSection
}) => {
  const { 
    elements: elementsMap, 
    sections: sectionsMap,
    selectedElementIds, 
    clearSelection, 
    selectMultipleElements,
    selectedTool,
    hoveredSnapPoint,
    zoom,
    pan,
    // Add history function for atomic undo/redo
    addHistoryEntry
  } = useEnhancedStore();
  const [selectionBox, setSelectionBox] = React.useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  const allElementsArray = useMemo(() => {
    const regularElements = Object.values(elementsMap);
    const sectionElements = Object.values(sectionsMap);
    return [...regularElements, ...sectionElements];
  }, [elementsMap, sectionsMap]);

  const { visibleElements, cullingStats } = useViewportCulling({
    elements: allElementsArray,
    zoomLevel: zoom,
    panOffset: pan,
    canvasSize: { width: stageWidth, height: stageHeight }
  });

  React.useEffect(() => {
    if (import.meta.env.DEV && cullingStats.totalElements > 100) {
      console.log('[Canvas Performance - Viewport Culling]', {
        total: cullingStats.totalElements,
        visible: cullingStats.visibleElements,
        culled: cullingStats.totalElements - cullingStats.visibleElements,
        cullPercentage: Math.round((1 - cullingStats.visibleElements / cullingStats.totalElements) * 100) + '%'
      });
    }
  }, [cullingStats]);

  const { mainElements, connectorElements, sectionElements, elementsBySection } = useMemo(() => {
    const main: CanvasElement[] = [];
    const connectors: CanvasElement[] = [];
    const sections: CanvasElement[] = [];
    const elementsBySection: Record<string, CanvasElement[]> = {};

    // First, collect all section elements and initialize their element arrays
    visibleElements.forEach((el: any) => {
      if (el.type === 'section') {
        sections.push(el);        elementsBySection[el.id] = [];
      }
    });    // Separate elements into different categories for proper layering
    visibleElements.forEach((el: any) => {
      if (el.type === 'section') {
        // Sections are already added above
        return;
      } else if (el.type === 'connector') {
        connectors.push(el);      } else if (el.sectionId && elementsBySection[el.sectionId]) {
        // Elements that belong to sections - group by section
        elementsBySection[el.sectionId]!.push(el);
      } else {
        // Free elements - render in main layer
        main.push(el);
      }
    });

    return {
      mainElements: main, 
      connectorElements: connectors,
      sectionElements: sections,
      elementsBySection: elementsBySection
    };
  }, [visibleElements]);

  // Task 3: Implement Z-Index Sorting for proper layering
  const sortedMainElements = useMemo(() => {
    return [...mainElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [mainElements]);

  const sortedConnectorElements = useMemo(() => {
    return [...connectorElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [connectorElements]);

  const sortedSectionElements = useMemo(() => {
    return [...sectionElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [sectionElements]);

  // Sort elements within each section by zIndex
  const sortedElementsBySection = useMemo(() => {
    const sorted: Record<string, CanvasElement[]> = {};
    Object.entries(elementsBySection).forEach(([sectionId, elements]) => {
      sorted[sectionId] = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
    return sorted;
  }, [elementsBySection]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage() || selectedTool !== 'select') {
      return;
    }
    e.evt.preventDefault();
    clearSelection();
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox.visible) {
      return;
    }
    e.evt.preventDefault();
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setSelectionBox(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox.visible) {
      return;
    }
    e.evt.preventDefault();
    setSelectionBox(prev => ({ ...prev, visible: false }));

    const box = new Konva.Rect(selectionBox);
    const selected = sortedMainElements.filter(el => {
      if (!el.x || !el.y || !el.width || !el.height) return false;
      const elBox = new Konva.Rect({
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
      return Konva.Util.haveIntersection(box.getClientRect(), elBox.getClientRect());
    });    selectMultipleElements(selected.map(el => el.id));
  };
  // Use robust array-based rendering to eliminate whitespace issues
  const layers = [
    <BackgroundLayer
      key="background"
      width={stageWidth}
      height={stageHeight}
      elements={[]}
    />,
    <MainLayer
      key="sections-with-children"
      elements={sortedSectionElements}
      selectedElementIds={selectedElementIds}
      selectedTool={selectedTool}
      onElementClick={onElementClick}
      onElementDragEnd={onElementDragEnd}
      onElementUpdate={onElementUpdate}
      onStartTextEdit={onStartTextEdit}
      stageRef={stageRef}
      isDrawing={isDrawing}
      currentPath={currentPath}
      elementsBySection={sortedElementsBySection}
      {...(onElementDragStart && { onElementDragStart })}
      {...(onElementDragMove && { onElementDragMove })}
      {...(onSectionResize && { onSectionResize })}
    />,
    <MainLayer
      key="main"
      name="main-layer"
      elements={sortedMainElements}
      selectedElementIds={selectedElementIds}
      selectedTool={selectedTool}
      onElementClick={onElementClick}
      onElementDragEnd={onElementDragEnd}
      onElementUpdate={onElementUpdate}
      onStartTextEdit={onStartTextEdit}
      stageRef={stageRef}
      isDrawing={isDrawing}
      currentPath={currentPath}
      {...(onElementDragStart && { onElementDragStart })}
      {...(onElementDragMove && { onElementDragMove })}
      {...(onSectionResize && { onSectionResize })}
    />,
    <ConnectorLayer
      key="connector"
      elements={sortedConnectorElements}
      selectedElementIds={selectedElementIds}
      onElementClick={onElementClick}
      isDrawingConnector={isDrawingConnector}
      connectorStart={connectorStart ?? null}
      connectorEnd={connectorEnd ?? null}
      selectedTool={selectedTool}
    />,
    <UILayer
      key="ui"
      stageRef={stageRef}
      selectedElementIds={selectedElementIds}
      elements={elementsMap}
      sections={sortedSectionElements}
      isDrawingSection={isDrawingSection}
      previewSection={previewSection ?? null}
      selectionBox={selectionBox}
      hoveredSnapPoint={hoveredSnapPoint}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onElementUpdate={onElementUpdate}
      addHistoryEntry={addHistoryEntry}
    />
  ];

  return <>{layers}</>;
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

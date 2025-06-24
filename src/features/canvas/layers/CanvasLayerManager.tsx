// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo } from 'react';
import Konva from 'konva';
import { Layer } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
import { GroupedSectionRenderer } from '../components/GroupedSectionRenderer';
import { TransformerManager } from '../components/TransformerManager';
import { DrawingContainment } from '../components/drawing/DrawingContainment';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { useCanvasStore } from '../stores/canvasStore.enhanced';
import { CanvasElement, ElementId, SectionElement, SectionId, isSectionElement, ConnectorElement } from '../types/enhanced.types';
import { useViewportCulling } from '../hooks/useViewportCulling';

interface CanvasLayerManagerProps {
  stageWidth?: number;
  stageHeight?: number;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementUpdate: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  onElementDragStart?: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementDragMove?: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  _onTransformEnd?: (id: SectionId, props: { x: number; y: number; width: number; height: number }) => void;
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  isDrawing?: boolean;
  currentPath?: number[];
  isDrawingSection?: boolean;
  hoveredSnapPoint?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  elements: Map<ElementId | SectionId, CanvasElement>;
  selectedElementIds: Set<ElementId | SectionId>;
}

export const CanvasLayerManager: React.FC<CanvasLayerManagerProps> = ({
  stageRef,
  onElementUpdate,
  onElementDragStart,
  onElementDragEnd,
  onElementDragMove,
  onElementClick,
  onStartTextEdit,
  _onTransformEnd,
  isDrawingConnector,
  connectorStart,
  connectorEnd,
  previewSection,
  elements,
  selectedElementIds,
}) => {
  const useGroupedSections = useFeatureFlag('grouped-section-rendering');
  const useCentralizedTransformer = useFeatureFlag('centralized-transformer');
  
  // Split selectors to prevent infinite loop
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const selectMultipleElements = useCanvasStore((state) => state.selectMultipleElements);
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const hoveredSnapPoint = useCanvasStore((state) => state.hoveredSnapPoint);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const updateSection = useCanvasStore((state) => state.updateSection);
  const addHistoryEntry = useCanvasStore((state) => state.addHistoryEntry);
  const addElement = useCanvasStore((state) => state.addElement);
  const addElementToSection = useCanvasStore((state) => state.addElementToSection);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const storeIsDrawing = useCanvasStore((state) => state.isDrawing);
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const updateDrawing = useCanvasStore((state) => state.updateDrawing);
  const finishDrawing = useCanvasStore((state) => state.finishDrawing);
  const currentPath = useCanvasStore((state) => state.currentPath);
  const sections = useCanvasStore((state) => state.sections);
  const captureElementsAfterSectionCreation = useCanvasStore((state) => state.captureElementsAfterSectionCreation);

  const stage = stageRef.current;
  const stageSize = stage ? { width: stage.width(), height: stage.height() } : { width: 0, height: 0 };
  
  const [selectionBox, setSelectionBox] = React.useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  const handleCanvasElementCreation = (pos: { x: number; y: number }) => {
    const now = Date.now();
    const generateId = (): ElementId => `element_${now}_${Math.random().toString(36).substr(2, 9)}` as ElementId;
    
    const targetSection = Array.from(elements.values()).find((el): el is SectionElement =>
      isSectionElement(el) &&
      pos.x >= el.x &&
      pos.x <= el.x + el.width &&
      pos.y >= el.y &&
      pos.y <= el.y + el.height
    );
    
    const targetSectionId = targetSection?.id ?? null;
    const elementX = targetSection ? pos.x - targetSection.x : pos.x;
    const elementY = targetSection ? pos.y - targetSection.y : pos.y;
    
    let newElement: CanvasElement | null = null;
    
    switch (selectedTool) {
      case 'rectangle':
        newElement = {
          id: generateId(),
          type: 'rectangle',
          x: elementX,
          y: elementY,
          width: 100,
          height: 80,
          fill: '#C7D2FE',
          stroke: '#6366F1',
          strokeWidth: 2,
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
        
      case 'circle':
        newElement = {
          id: generateId(),
          type: 'circle',
          x: elementX,
          y: elementY,
          radius: 50,
          fill: '#FED7D7',
          stroke: '#E53E3E',
          strokeWidth: 2,
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
        
      case 'text':
        newElement = {
          id: generateId(),
          type: 'text',
          x: elementX,
          y: elementY,
          text: 'Double-click to edit',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fill: '#1F2937',
          width: 200,
          height: 24,
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
        
      case 'sticky-note':
        newElement = {
          id: generateId(),
          type: 'sticky-note',
          x: elementX,
          y: elementY,
          width: 150,
          height: 150,
          backgroundColor: '#FEF3C7',
          text: 'Type your note here...',
          fontSize: 12,
          textColor: '#92400E',
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
        
      case 'triangle':
        newElement = {
          id: generateId(),
          type: 'triangle',
          x: elementX,
          y: elementY,
          points: [0, -50, -50, 50, 50, 50],
          fill: '#D4F6CC',
          stroke: '#38A169',
          strokeWidth: 2,
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
        
      case 'star':
        newElement = {
          id: generateId(),
          type: 'star',
          x: elementX,
          y: elementY,
          numPoints: 5,
          innerRadius: 30,
          outerRadius: 60,
          fill: '#E1BEE7',
          stroke: '#9C27B0',
          strokeWidth: 2,
          sectionId: targetSectionId,
          createdAt: now,
          updatedAt: now,
        };
        break;
    }
    
    if (newElement) {
      addElement(newElement);
      
      // Add element to section if it was created inside one
      if (newElement.sectionId && addElementToSection) {
        addElementToSection(newElement.id as ElementId, newElement.sectionId);
      }
      
      selectElement(newElement.id as ElementId);
      setSelectedTool('select');
    }
  };

  const allElementsArray: CanvasElement[] = useMemo(() => {
    // Combine elements and sections for rendering
    const elementsArray = Array.from(elements.values());
    const sectionsArray = Array.from(sections.values());
    return [...elementsArray, ...sectionsArray];
  }, [elements, sections]);

  const { visibleElements, cullingStats } = useViewportCulling({
    elements: allElementsArray,
    zoomLevel: zoom,
    panOffset: pan,
    canvasSize: stageSize
  });

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && cullingStats.totalElements > 100) {
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
    const connectors: ConnectorElement[] = [];
    const sectionsArr: SectionElement[] = [];
    const bySection = new Map<SectionId, CanvasElement[]>();

    visibleElements.forEach((el) => {
      if (isSectionElement(el)) {
        sectionsArr.push(el);
        bySection.set(el.id, []);
      }
    });

    visibleElements.forEach((el) => {
      if (isSectionElement(el)) {
        return;
      } else if (el.type === 'connector') {
        connectors.push(el as ConnectorElement);
      } else if (el.sectionId && bySection.has(el.sectionId)) {
        bySection.get(el.sectionId)!.push(el);
      } else {
        main.push(el);
      }
    });

    return {
      mainElements: main, 
      connectorElements: connectors,
      sectionElements: sectionsArr,
      elementsBySection: bySection
    };
  }, [visibleElements]);

  const sortedMainElements = useMemo(() => {
    return [...mainElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [mainElements]);

  const sortedConnectorElements = useMemo(() => {
    return [...connectorElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [connectorElements]);

  const connectorElementsMap = useMemo(() => {
    const map = new Map<ElementId, CanvasElement>();
    sortedConnectorElements.forEach(element => {
      map.set(element.id as ElementId, element);
    });
    return map;
  }, [sortedConnectorElements]);

  const sortedSectionElements = useMemo(() => {
    return [...sectionElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [sectionElements]);

  const sectionElementsMap = useMemo(() => {
    const map = new Map<SectionId, any>();
    sortedSectionElements.forEach(element => {
      map.set(element.id as SectionId, element);
    });
    return map;
  }, [sortedSectionElements]);

  // Filter selectedElementIds to only include ElementIds for layers that need them
  const selectedElementIdsOnly = useMemo(() => {
    const elementIds = new Set<ElementId>();
    selectedElementIds.forEach(id => {
      // Check if this ID belongs to an element (not a section)
      if (elements?.has(id) && !id.toString().startsWith('section')) {
        elementIds.add(id as ElementId);
      }
    });
    return elementIds;
  }, [selectedElementIds, elements]);

  const sortedElementsBySection = useMemo(() => {
    const sorted = new Map<SectionId, CanvasElement[]>();
    elementsBySection.forEach((elements, sectionId) => {
      sorted.set(sectionId, [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)));
    });
    return sorted;
  }, [elementsBySection]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) {
      return;
    }
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    if (['rectangle', 'circle', 'triangle', 'star', 'text', 'sticky-note'].includes(selectedTool)) {
      handleCanvasElementCreation(pos);
      return;
    }
    
    if (selectedTool === 'pen' || selectedTool === 'pencil') {
      e.evt.preventDefault();
      startDrawing(pos.x, pos.y, selectedTool as 'pen' | 'pencil');
      return;
    }
    
    if (selectedTool === 'select') {
      e.evt.preventDefault();
      clearSelection();
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    if ((selectedTool === 'pen' || selectedTool === 'pencil') && storeIsDrawing) {
      updateDrawing(pos.x, pos.y);
      return;
    }
    
    if (!selectionBox.visible) {
      return;
    }
    e.evt.preventDefault();
    setSelectionBox(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if ((selectedTool === 'pen' || selectedTool === 'pencil') && storeIsDrawing) {
      finishDrawing();
      return;
    }
    
    if (!selectionBox.visible) {
      return;
    }
    e.evt.preventDefault();
    setSelectionBox(prev => ({ ...prev, visible: false }));

    const box = new Konva.Rect(selectionBox).getClientRect();
    
    const getElementBoundingBox = (element: CanvasElement) => {
      if ('width' in element && 'height' in element && element.width !== undefined && element.height !== undefined) {
        return { x: element.x, y: element.y, width: element.width, height: element.height };
      }
      if (element.type === 'circle' && 'radius' in element) {
        const radius = element.radius || 0;
        return { x: element.x - radius, y: element.y - radius, width: radius * 2, height: radius * 2 };
      }
      // Default for elements without width/height (like connectors, pen)
      return { x: element.x, y: element.y, width: 50, height: 50 }; // Provide default dimensions
    };

    const selected = allElementsArray.filter(el => {
      if (isSectionElement(el)) return false; // Don't select sections with the selection box
      const elBox = getElementBoundingBox(el);
      return Konva.Util.haveIntersection(box, elBox);
    });

    const selectedIds = selected.map(el => el.id as ElementId);
    selectMultipleElements(selectedIds);
  };

  const layers = [
    <Layer key="content-layer">
      <BackgroundLayer
        width={stageSize.width}
        height={stageSize.height}
        // REMOVED onBackgroundClick - CanvasEventHandler handles all events
        // onBackgroundClick={() => {
        //   // Clear selection when clicking on background
        //   clearSelection();
        // }}
      />
      
      {useGroupedSections ? (
        sortedSectionElements.map(section => {
          const isSelected = selectedElementIds.has(section.id) || (section.childElementIds ?? []).some(id => selectedElementIds.has(id));
          return (
            <GroupedSectionRenderer
              key={section.id}
              section={section}
              elements={sortedElementsBySection.get(section.id) || []}
              isSelected={isSelected}
              onElementClick={onElementClick}
              onElementDragEnd={onElementDragEnd}
              onElementUpdate={onElementUpdate}
              onSectionUpdate={updateSection}
              onStartTextEdit={onStartTextEdit}
              onSectionResize={(id, w, h) => updateSection(id, { width: w, height: h })}
            />
          );
        })
      ) : (
        <MainLayer
          elements={sortedSectionElements}
          selectedElementIds={selectedElementIds}
          selectedTool={selectedTool}
          onElementClick={onElementClick}
          onElementDragEnd={onElementDragEnd}
          onElementUpdate={onElementUpdate}
          onStartTextEdit={onStartTextEdit}
          stageRef={stageRef}
          isDrawing={storeIsDrawing}
          currentPath={currentPath}
          elementsBySection={sortedElementsBySection}
          {...(onElementDragStart && { onElementDragStart })}
          {...(onElementDragMove && { onElementDragMove })}
          onSectionResize={(id, w, h) => updateSection(id, { width: w, height: h })}
        />
      )}
      
      <MainLayer
        name="main-layer"
        elements={sortedMainElements}
        selectedElementIds={selectedElementIds}
        selectedTool={selectedTool}
        onElementClick={onElementClick}
        onElementDragEnd={onElementDragEnd}
        onElementUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
        stageRef={stageRef}
        isDrawing={storeIsDrawing}
        currentPath={currentPath}
        {...(onElementDragStart && { onElementDragStart })}
        {...(onElementDragMove && { onElementDragMove })}
        onSectionResize={(id, w, h) => updateSection(id, { width: w, height: h })}
      />
      
      <ConnectorLayer
        elements={connectorElementsMap}
        selectedElementIds={selectedElementIdsOnly}
        onElementClick={onElementClick}
        isDrawingConnector={isDrawingConnector ?? false}
        connectorStart={connectorStart ?? null}
        connectorEnd={connectorEnd ?? null}
        selectedTool={selectedTool}
      />
      
      <DrawingContainment
        isDrawing={storeIsDrawing}
        currentTool={selectedTool}
        stageRef={stageRef}
      />
    </Layer>,
    
    <UILayer
      key="ui"
      stageRef={stageRef}
      selectedElementIds={selectedElementIdsOnly}
      elements={elements}
      sections={sectionElementsMap}
      isDrawingSection={isDrawingConnector ?? false} // Should be isDrawingSection
      previewSection={previewSection ?? null}
      selectionBox={selectionBox}
      hoveredSnapPoint={hoveredSnapPoint as { x: number; y: number; elementId?: ElementId; anchor?: string } | null}
      // REMOVED conflicting mouse handlers - CanvasEventHandler handles all events
      // onMouseDown={handleMouseDown}
      // onMouseMove={handleMouseMove}
      // onMouseUp={handleMouseUp}
      onElementUpdate={onElementUpdate}
      addHistoryEntry={addHistoryEntry}
    />,
    
    ...(useCentralizedTransformer ? [
      <Layer key="centralized-transformer">
        <TransformerManager stageRef={stageRef} />
      </Layer>
    ] : [])
  ];

  return <>{layers}</>;
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

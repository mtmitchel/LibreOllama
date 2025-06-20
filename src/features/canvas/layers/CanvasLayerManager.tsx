// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo } from 'react';
import Konva from 'konva';
import { Layer } from 'react-konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
// New imports for Phase 1 implementation
import { GroupedSectionRenderer } from '../components/GroupedSectionRenderer2';
import { TransformerManager } from '../components/TransformerManager';
// Coordinate system fix components
import { DrawingContainment } from '../components/drawing/DrawingContainment';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
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
  // Enable feature flags for new architecture
  const useGroupedSections = useFeatureFlag('grouped-section-rendering');
  const useCentralizedTransformer = useFeatureFlag('centralized-transformer');
  
  console.log(`[CanvasLayerManager] Feature flags:`, { useGroupedSections, useCentralizedTransformer });
  
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
    updateSection,
    // Add history function for atomic undo/redo
    addHistoryEntry,
    // Element management functions
    addElement,
    addElementToSection,
    selectElement,
    setSelectedTool,
    // Drawing state management
    isDrawing: storeIsDrawing,
    startDrawing,
    updateDrawing,
    finishDrawing
  } = useEnhancedStore();
  
  console.log(`[CanvasLayerManager] Selected tool:`, selectedTool);
  console.log(`[CanvasLayerManager] Is drawing:`, storeIsDrawing);
  console.log(`[CanvasLayerManager] Available drawing functions:`, { 
    hasStartDrawing: !!startDrawing, 
    hasUpdateDrawing: !!updateDrawing, 
    hasFinishDrawing: !!finishDrawing 
  });
  const [selectionBox, setSelectionBox] = React.useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  // Handle canvas click to create elements
  const handleCanvasElementCreation = (pos: { x: number; y: number }) => {
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find if click is within a section
    const targetSection = Object.values(sectionsMap).find(section => {
      return pos.x >= section.x &&
             pos.x <= section.x + section.width &&
             pos.y >= section.y &&
             pos.y <= section.y + section.height;
    });
    
    const targetSectionId = targetSection?.id || null;
    const elementX = targetSection ? pos.x - targetSection.x : pos.x;
    const elementY = targetSection ? pos.y - targetSection.y : pos.y;
    
    let newElement: any = null;
    
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
          sectionId: targetSectionId
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
          sectionId: targetSectionId
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
          sectionId: targetSectionId
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
          fontFamily: 'Inter, sans-serif',
          textColor: '#92400E',
          sectionId: targetSectionId
        };
        break;
        
      case 'section':
        newElement = {
          id: generateId(),
          type: 'section',
          x: elementX,
          y: elementY,
          width: 300,
          height: 200,
          backgroundColor: '#F8FAFC',
          borderColor: '#E2E8F0',
          borderWidth: 2,
          title: 'New Section',
          titleFontSize: 16,
          titleColor: '#334155'
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
          closed: true,
          sectionId: targetSectionId
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
          radius: 60,
          fill: '#E1BEE7',
          stroke: '#9C27B0',
          strokeWidth: 2,
          sectionId: targetSectionId
        };
        break;
    }
    
    if (newElement) {
      console.log('🎯 [CanvasLayerManager] Creating element via canvas click:', newElement);
      addElement(newElement);
      
      // Add to section if needed
      if (newElement.sectionId && addElementToSection) {
        addElementToSection(newElement.id, newElement.sectionId);
      }
      
      selectElement(newElement.id);
      
      // Switch back to select tool after creation
      setSelectedTool('select');
    }
  };

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
        console.log(`[CanvasLayerManager] Element ${el.id} with sectionId ${el.sectionId} added to section group`);
      } else {
        // Free elements - render in main layer
        main.push(el);
        console.log(`[CanvasLayerManager] Element ${el.id} (type: ${el.type}) added to main layer (no sectionId: ${!el.sectionId})`);
      }
    });

    console.log(`[CanvasLayerManager] Element separation:`, {
      mainElements: main.length,
      sections: sections.length,
      elementsBySection: Object.entries(elementsBySection).map(([sectionId, els]) => 
        `${sectionId}: ${els.length} elements`
      )
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
    if (e.target !== e.target.getStage()) {
      return;
    }
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    console.log('🖱️ [CanvasLayerManager] Mouse down - Tool:', selectedTool, 'Position:', pos);
    
    // Handle element creation for shape tools
    if (['rectangle', 'circle', 'triangle', 'star', 'text', 'sticky-note', 'section'].includes(selectedTool)) {
      console.log('🎯 [CanvasLayerManager] Creating shape:', selectedTool);
      handleCanvasElementCreation(pos);
      return;
    }
    
    // Handle pen tool - start drawing
    if (selectedTool === 'pen' || selectedTool === 'pencil') {
      console.log('🖊️ [CanvasLayerManager] Starting pen drawing at:', pos);
      e.evt.preventDefault();
      startDrawing(pos.x, pos.y, selectedTool as 'pen' | 'pencil');
      return;
    }
    
    // Handle connector tools
    if (selectedTool === 'connector-line' || selectedTool === 'connector-arrow') {
      console.log('🔗 [CanvasLayerManager] Starting connector drawing');
      // TODO: Implement connector drawing logic
      return;
    }
    
    // Handle selection mode
    if (selectedTool === 'select') {
      e.evt.preventDefault();
      clearSelection();
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    // Handle pen drawing
    if ((selectedTool === 'pen' || selectedTool === 'pencil') && storeIsDrawing) {
      console.log('🖊️ [CanvasLayerManager] Updating pen drawing at:', pos);
      updateDrawing(pos.x, pos.y);
      return;
    }
    
    // Handle selection box
    if (!selectionBox.visible) {
      return;
    }
    e.evt.preventDefault();
    setSelectionBox(prev => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle pen drawing completion
    if ((selectedTool === 'pen' || selectedTool === 'pencil') && storeIsDrawing) {
      console.log('🖊️ [CanvasLayerManager] Finishing pen drawing');
      finishDrawing();
      return;
    }
    
    // Handle selection box
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
    });
    selectMultipleElements(selected.map(el => el.id));
  };
  // REFACTORED: Consolidated layer structure (3 layers max for optimal Konva performance)
  const layers = [
    // LAYER 1: Content Layer (background + all content elements)
    <Layer key="content-layer">
      {/* Background */}
      <BackgroundLayer
        width={stageWidth}
        height={stageHeight}
        elements={[]}
      />
      
      {/* Sections with children elements */}
      {useGroupedSections ? (
        // NEW: Enhanced grouped section rendering
        sortedSectionElements.map(section => (
          <GroupedSectionRenderer
            key={section.id}
            section={section as any} // TODO: Fix type casting
            children={sortedElementsBySection[section.id] || []}
            isSelected={selectedElementIds.includes(section.id)}
            onElementClick={onElementClick}
            onElementDragEnd={onElementDragEnd}
            onElementUpdate={onElementUpdate}
            onSectionUpdate={updateSection}
            onStartTextEdit={onStartTextEdit}
            onSectionResize={onSectionResize || (() => {})}
          />
        ))
      ) : (
        // LEGACY: Original section rendering
        <MainLayer
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
        />
      )}
      
      {/* Main layer elements (free elements not in sections) */}
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
        isDrawing={isDrawing}
        currentPath={currentPath}
        {...(onElementDragStart && { onElementDragStart })}
        {...(onElementDragMove && { onElementDragMove })}
      />
      
      {/* Connectors (rendered in same layer for efficiency) */}
      <ConnectorLayer
        elements={sortedConnectorElements}
        selectedElementIds={selectedElementIds}
        onElementClick={onElementClick}
        isDrawingConnector={isDrawingConnector}
        connectorStart={connectorStart ?? null}
        connectorEnd={connectorEnd ?? null}
        selectedTool={selectedTool}
      />
      
      {/* Drawing Containment for pen tool */}
      <DrawingContainment
        isDrawing={isDrawing}
        currentTool={selectedTool}
        stageRef={stageRef}
      />
    </Layer>,
    
    // LAYER 2: UI Layer (selection boxes, snap points, tools)
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
    />,
    
    // LAYER 3: Transformer Layer (only when centralized transformer is enabled)
    ...(useCentralizedTransformer ? [
      <Layer key="centralized-transformer">
        <TransformerManager stageRef={stageRef} />
      </Layer>
    ] : [])
  ];

  console.log(`[CanvasLayerManager] Layer count: ${layers.length} (target: 3-5, flags: grouped=${useGroupedSections}, transformer=${useCentralizedTransformer})`);

  return <>{layers}</>;
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

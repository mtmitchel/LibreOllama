// src/features/canvas/layers/CanvasLayerManager.tsx
import React, { useMemo } from 'react';
import Konva from 'konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
import { useCanvasStore as useEnhancedStore } from '../stores/canvasStore.enhanced';
import { CanvasElement } from '../stores/types';

interface CanvasLayerManagerProps {
  stageWidth: number;
  stageHeight: number;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
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
  onElementDragEnd,
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
    selectedTool 
  } = useEnhancedStore();
  const [selectionBox, setSelectionBox] = React.useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  const allElementsArray = useMemo(() => {
    const regularElements = Object.values(elementsMap);
    const sectionElements = Object.values(sectionsMap);
    return [...regularElements, ...sectionElements];
  }, [elementsMap, sectionsMap]);  const { mainElements, connectorElements, sectionElements, elementsBySection } = useMemo(() => {
    const main: CanvasElement[] = [];
    const connectors: CanvasElement[] = [];
    const sections: CanvasElement[] = [];
    const elementsBySection: Record<string, CanvasElement[]> = {};
    
    // First, collect all section elements and initialize their element arrays
    allElementsArray.forEach((el: any) => {
      if (el.type === 'section') {
        sections.push(el);
        elementsBySection[el.id] = [];
      }
    });
    
    // Separate elements into different categories for proper layering
    allElementsArray.forEach((el: any) => {
      if (el.type === 'section') {
        // Sections are already added above
        return;
      } else if (el.type === 'connector') {
        connectors.push(el);
      } else if (el.sectionId && elementsBySection[el.sectionId]) {
        // Elements that belong to sections - group by section
        elementsBySection[el.sectionId].push(el);
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
  }, [allElementsArray]);

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
    const selected = mainElements.filter(el => {
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
  };  return (
    <>
      <BackgroundLayer
        key="background"
        width={stageWidth}
        height={stageHeight}
        elements={[]}
      />
      {/* Render sections with their contained elements */}
      <MainLayer
        key="sections-with-children"
        elements={sectionElements}
        selectedElementIds={selectedElementIds}
        selectedTool={selectedTool}
        onElementClick={onElementClick}
        onElementDragEnd={onElementDragEnd}
        onElementUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
        onSectionResize={onSectionResize}
        stageRef={stageRef}
        isDrawing={isDrawing}
        currentPath={currentPath}
        elementsBySection={elementsBySection}
      />
      {/* Render free elements */}
      <MainLayer
        key="main"
        name="main-layer"
        elements={mainElements}
        selectedElementIds={selectedElementIds}
        selectedTool={selectedTool}
        onElementClick={onElementClick}
        onElementDragEnd={onElementDragEnd}
        onElementUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
        onSectionResize={onSectionResize}
        stageRef={stageRef}
        isDrawing={isDrawing}
        currentPath={currentPath}
      />
      <ConnectorLayer
        key="connector"
        elements={connectorElements}
        selectedElementIds={selectedElementIds}
        onElementClick={onElementClick}
        isDrawingConnector={isDrawingConnector}
        connectorStart={connectorStart ?? null}
        connectorEnd={connectorEnd ?? null}
        selectedTool={selectedTool}
      />      <UILayer
        key="ui"
        stageRef={stageRef}
        selectedElementIds={selectedElementIds}
        elements={elementsMap}
        sections={sectionElements}
        isDrawingSection={isDrawingSection}
        previewSection={previewSection ?? null}
        selectionBox={selectionBox}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onElementUpdate={onElementUpdate}
      />
    </>
  );
};

CanvasLayerManager.displayName = 'CanvasLayerManager';

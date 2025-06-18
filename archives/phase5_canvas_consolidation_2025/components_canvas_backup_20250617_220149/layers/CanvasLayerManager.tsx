// src/components/canvas/layers/CanvasLayerManager.tsx
import React, { forwardRef, useCallback, useEffect, useMemo } from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { BackgroundLayer } from './BackgroundLayer';
import { MainLayer } from './MainLayer';
import { ConnectorLayer } from './ConnectorLayer';
import { UILayer } from './UILayer';
import { useKonvaCanvasStore } from '../../../features/canvas/stores';
import type { CanvasElement } from '../../../features/canvas/types';

interface CanvasLayerManagerProps {
  stageWidth: number;
  stageHeight: number;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementSelect?: (element: CanvasElement) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onStartTextEdit: (elementId: string) => void;
  isDrawing?: boolean;
  currentPath?: number[];
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}

export const CanvasLayerManager = forwardRef<Konva.Layer, CanvasLayerManagerProps>(({
  stageWidth,
  stageHeight,
  stageRef,
  onElementSelect,
  onElementUpdate,
  onElementDragEnd,
  onElementClick,
  onStartTextEdit,
  isDrawing = false,
  currentPath = [],
  isDrawingConnector = false,
  connectorStart,
  connectorEnd,
  isDrawingSection = false,  previewSection
}, layerRef) => {  // Store subscriptions using new combined store - Fixed: Use specific selectors
  const elements = useKonvaCanvasStore(state => state.elements);
  const selectedElementIds = useKonvaCanvasStore(state => state.selectedElementIds);
  const selectedTool = useKonvaCanvasStore(state => state.selectedTool);

  // Get all elements as array
  const allElements = useMemo(() => {
    return Object.values(elements);
  }, [elements]);
  // Get sections from elements (sections are stored as elements with type 'section')
  const sections = useMemo(() => {
    return allElements.filter((el: CanvasElement) => el.type === 'section').reduce((acc: Record<string, CanvasElement>, section: CanvasElement) => {
      acc[section.id] = section;
      return acc;
    }, {});
  }, [allElements]);

  // Get visible elements (simplified without viewport culling for now)
  const visibleElements = useMemo(() => {
    return allElements;
  }, [allElements]);

  // Separate elements by layer for performance optimization
  const { backgroundElements, mainElements, connectorElements } = useMemo(() => {
    return {
      backgroundElements: [], // Static background elements (grid, watermarks)
      mainElements: visibleElements.filter((el: CanvasElement) => el.type !== 'connector'),
      connectorElements: visibleElements.filter((el: CanvasElement) => el.type === 'connector'),
    };
  }, [visibleElements]);

  // Performance optimization callback
  const handleLayerDraw = useCallback(() => {
    // Batch draw optimization - called after layer updates
    if (layerRef && 'current' in layerRef && layerRef.current) {
      layerRef.current.batchDraw();
    }
  }, [layerRef]);

  return (
    <Layer ref={layerRef} listening={true}>
      {/* Background Layer - static elements, no interaction */}
      <BackgroundLayer
        width={stageWidth}
        height={stageHeight}
        elements={backgroundElements}
      />
      
      {/* Main Layer - primary interactive shapes and sections */}
      <MainLayer
        elements={mainElements}
        selectedElementIds={selectedElementIds}
        selectedTool={selectedTool}
        onElementClick={onElementClick}
        onElementDragEnd={onElementDragEnd}
        onElementUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
        isDrawing={isDrawing}
        currentPath={currentPath}
        onLayerDraw={handleLayerDraw}
      />
        {/* Connector Layer - lines and arrows between elements */}
      <ConnectorLayer
        elements={connectorElements}
        selectedElementIds={selectedElementIds}
        onElementClick={onElementClick}
        isDrawingConnector={isDrawingConnector}
        connectorStart={connectorStart || null}
        connectorEnd={connectorEnd || null}
        selectedTool={selectedTool}
      />
      
      {/* UI Layer - selection handles, transform controls, previews */}
      <UILayer
        selectedElementIds={selectedElementIds}
        elements={elements}
        sections={sections}
        isDrawingSection={isDrawingSection}
        previewSection={previewSection || null}
        stageRef={stageRef}
      />
    </Layer>
  );
});

CanvasLayerManager.displayName = 'CanvasLayerManager';

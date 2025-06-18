import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useKonvaCanvasStore } from '../stores';
import type { CanvasElement, RichTextSegment } from '../types';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { debug } from '../utils/debug';
import '../../../styles/konvaCanvas.css';

// Local interfaces
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef: externalStageRef,
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  // Internal stage ref to avoid React strict mode issues
  const internalStageRef = useRef<Konva.Stage | null>(null);
  
  // Sync internal ref with external ref
  useEffect(() => {
    if (externalStageRef && internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }
  }, [externalStageRef]);

  // Use specific selectors to prevent unnecessary re-renders
  const elements = useKonvaCanvasStore(state => state.elements);
  const sections = useKonvaCanvasStore(state => state.sections);
  const selectedElementId = useKonvaCanvasStore(state => state.selectedElementId);
  const selectedTool = useKonvaCanvasStore(state => state.selectedTool);
  const editingTextId = useKonvaCanvasStore(state => state.editingTextId);
  
  // Get stable action functions using selectors
  const clearSelection = useKonvaCanvasStore(state => state.clearSelection);
  
  // Performance logging - only on mount to avoid infinite loops
  useEffect(() => {
    debug.canvas.performance('KonvaCanvas mounted');
  }, []);

  // Canvas click handler
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt?.detail > 1) return;

    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      clearSelection();
    }
  }, [clearSelection]);

  return (
    <div className="konva-canvas-container">
      <Stage
        ref={internalStageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onWheel={onWheelHandler}
        {...(onTouchMoveHandler && { onTouchMove: onTouchMoveHandler })}
        {...(onTouchEndHandler && { onTouchEnd: onTouchEndHandler })}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
      >
        <CanvasLayerManager
          elements={elements}
          sections={sections}
          selectedElementId={selectedElementId}
          editingTextId={editingTextId}
          onElementSelect={onElementSelect}
        />
      </Stage>
    </div>
  );
};

export default KonvaCanvas;

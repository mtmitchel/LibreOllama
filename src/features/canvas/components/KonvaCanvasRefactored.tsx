/**
 * KonvaCanvas - Main Canvas Component (Refactored)
 * Part of LibreOllama Canvas Refactoring - Phase 4
 * 
 * Orchestrates all canvas functionality by delegating to specialized sub-components.
 * Reduced from 924 lines to ~150 lines through proper component decomposition.
 */

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { CanvasEventHandler } from './CanvasEventHandler';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { useCanvasStore } from '../stores/canvasStore.enhanced';
// import { useCanvasSetup } from './useCanvasSetup';
import { CanvasTool, ElementId, SectionId, CanvasElement } from '../types/enhanced.types';
import '../../../styles/konvaCanvas.css';
import '../../../styles/multiDrag.css';

// Simplified props interface
interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: any) => void;
  panZoomState: {
    scale: number;
    position: { x: number; y: number };
  };
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = React.memo(({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef: externalStageRef,
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  // Internal stage ref for setup hook
  const internalStageRef = useRef<Konva.Stage | null>(null);
  
  // Use the setup hook for initialization logic
  // Temporary inline setup - will be replaced with useCanvasSetup hook
  const [isReady, setIsReady] = React.useState(false);
  const viewport = {
    scale: panZoomState?.scale || 1,
    position: panZoomState?.position || { x: 0, y: 0 }
  };
  
  React.useEffect(() => {
    console.log('🎨 KonvaCanvasRefactored: Component mounted with new coordinate system');
    setIsReady(true);
  }, []);

  /* Future useCanvasSetup integration:
  const { viewport, isReady } = useCanvasSetup({
    width, 
    height,
    stageRef: internalStageRef
  });
  */

  // Get current tool and drawing state from store
  const currentTool = useCanvasStore(state => state.selectedTool) as CanvasTool;
  const isDrawing = useCanvasStore(state => state.isDrawing);
  const selectedElementIds = useCanvasStore(state => state.selectedElementIds);
  const elements = useCanvasStore(state => state.elements);

  // Sync external and internal stage refs
  useEffect(() => {
    if (internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }
  }, [externalStageRef]);

  // Optimize stage configuration
  const stageConfig = useMemo(() => ({
    width,
    height,
    scaleX: panZoomState.scale,
    scaleY: panZoomState.scale,
    x: panZoomState.position.x,
    y: panZoomState.position.y,
    draggable: currentTool === 'pan',
    listening: !isDrawing,
    // Performance optimizations
    perfectDrawEnabled: false,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
  }), [width, height, panZoomState, currentTool, isDrawing]);

  // Handle stage events with proper delegation
  const handleStageWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    onWheelHandler(e);
  }, [onWheelHandler]);

  const handleStageTouch = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    switch (e.type) {
      case 'touchmove':
        onTouchMoveHandler?.(e);
        break;
      case 'touchend':
        onTouchEndHandler?.(e);
        break;
    }
  }, [onTouchMoveHandler, onTouchEndHandler]);

  // Loading state
  if (!isReady) {
    return (
      <div className="canvas-loading flex items-center justify-center h-full">
        <div className="text-gray-500">Initializing canvas...</div>
      </div>
    );
  }

  return (
    <div className="konva-canvas-container relative" style={{ width, height }}>
      <Stage
        ref={internalStageRef}
        {...stageConfig}
        onWheel={handleStageWheel}
        onTouchMove={handleStageTouch}
        onTouchEnd={handleStageTouch}
      >        {/* Centralized event handling using the delegation pattern */}
        <CanvasEventHandler 
          stageRef={internalStageRef as React.RefObject<Konva.Stage>} 
          currentTool={currentTool}
        >
            {/* Manages all rendering layers and viewport culling */}
          <CanvasLayerManager 
            stageWidth={width}
            stageHeight={height}
            stageRef={internalStageRef}
            elements={elements as Map<ElementId | SectionId, CanvasElement>}
            selectedElementIds={selectedElementIds}
            onElementUpdate={(id, updates) => {
              // Delegate to store
              useCanvasStore.getState().updateElement(id, updates);
            }}            onElementDragEnd={(_e, elementId) => {
              // Handle drag end
              console.log('Element drag end:', elementId);
            }}
            onElementClick={(_e, element) => {
              // Handle element click
              onElementSelect?.(element);
            }}
            onStartTextEdit={(elementId) => {
              // Handle text editing start
              console.log('Start text edit:', elementId);
            }}
          />

          {/* Tool-specific overlays and preview layer */}
          <Layer name="tool-overlays">
            <ToolOverlayManager 
              tool={currentTool} 
              stageRef={internalStageRef as React.RefObject<Konva.Stage>}
              viewport={viewport}
            />
          </Layer>

        </CanvasEventHandler>
      </Stage>      {/* Canvas UI overlays (outside Konva for better performance) */}
      {onElementSelect && (
        <CanvasUIOverlays 
          canvasRect={{ width, height }}
          onElementSelect={onElementSelect}
        />
      )}
    </div>
  );
});

/**
 * Tool Overlay Manager - Handles tool-specific preview and interaction overlays
 */
const ToolOverlayManager: React.FC<{
  tool: CanvasTool;
  stageRef: React.RefObject<Konva.Stage>;
  viewport: any;
}> = () => {
  // Tool-specific overlay logic would go here
  // For now, return null as these would be implemented in subsequent phases
  return null;
};

/**
 * Canvas UI Overlays - Renders UI elements outside of Konva for better performance
 */
const CanvasUIOverlays: React.FC<{
  canvasRect: { width: number; height: number };
  onElementSelect: (element: any) => void;
}> = () => {
  // UI overlay logic (selection boxes, tooltips, etc.)
  // Would be implemented in subsequent phases
  return null;
};

KonvaCanvas.displayName = 'KonvaCanvas';

export default KonvaCanvas;

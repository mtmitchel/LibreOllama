/**
 * KonvaCanvas - Main Canvas Component (Refactored)
 * Part of LibreOllama Canvas Refactoring - Phase 4
 * 
 * Orchestrates all canvas functionality by delegating to specialized sub-components.
 * Reduced from 924 lines to ~150 lines through proper component decomposition.
 */

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text } from 'react-konva';
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
    stageRef: internalStageRef,
    width,
    height,
    panZoomState
  });
  */

  // Store selectors with primitive values to prevent render loops
  const elements = useCanvasStore(state => state.elements);
  const selectedElementIds = useCanvasStore(state => state.selectedElementIds);
  const currentTool = useCanvasStore(state => state.selectedTool);
  const isDrawing = useCanvasStore(state => state.isDrawing);
  
  // Store actions
  const selectElement = useCanvasStore(state => state.selectElement);
  const updateElement = useCanvasStore(state => state.updateElement);
  const updateSection = useCanvasStore(state => state.updateSection);
  const addElement = useCanvasStore(state => state.addElement);
  const createSection = useCanvasStore(state => state.createSection);
  const setEditingTextId = useCanvasStore(state => state.setEditingTextId);

  // Tool-specific state for preview overlays
  const [isDrawingConnector, setIsDrawingConnector] = React.useState(false);
  const [connectorStart, setConnectorStart] = React.useState<{ x: number; y: number; elementId?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = React.useState<{ x: number; y: number; elementId?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = React.useState(false);
  const [previewSection, setPreviewSection] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Event handlers for custom canvas tool events
  useEffect(() => {
    const handleConnectorStart = (e: CustomEvent) => {
      const { position, elementId } = e.detail;
      setIsDrawingConnector(true);
      setConnectorStart({ x: position.x, y: position.y, elementId });
      setConnectorEnd({ x: position.x, y: position.y });
    };

    const handleConnectorPreview = (e: CustomEvent) => {
      const { position } = e.detail;
      if (isDrawingConnector) {
        setConnectorEnd({ x: position.x, y: position.y });
      }
    };

    const handleConnectorEnd = (e: CustomEvent) => {
      const { position, elementId } = e.detail;
      if (isDrawingConnector && connectorStart) {
        // Create connector element
        const newConnector = {
          id: `connector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'connector' as const,
          subType: 'straight' as const,
          x: connectorStart.x,
          y: connectorStart.y,
          startPoint: connectorStart,
          endPoint: {
            x: position.x,
            y: position.y,
            elementId: elementId || undefined,
            anchor: 'center'
          },
          intermediatePoints: [],
          stroke: '#1E293B',
          strokeWidth: 2,
          connectorStyle: {
            strokeColor: '#1E293B',
            strokeWidth: 2,
            startArrow: 'none' as const,
            endArrow: currentTool === 'connector' ? 'solid' as const : 'none' as const,
            arrowSize: 10,
            text: ''
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Add to store using store methods directly
        addElement(newConnector as any);
        
        // Reset drawing state
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
      }
    };

    const handleSectionDraw = (e: CustomEvent) => {
      const { start, current } = e.detail;
      setIsDrawingSection(true);
      const width = current.x - start.x;
      const height = current.y - start.y;
      setPreviewSection({
        x: width < 0 ? current.x : start.x,
        y: height < 0 ? current.y : start.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    };

    const handleSectionEnd = () => {
      if (isDrawingSection && previewSection && previewSection.width > 20 && previewSection.height > 20) {
        // Create section using store
        const newSection = {
          id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'section' as const,
          x: previewSection.x,
          y: previewSection.y,
          width: previewSection.width,
          height: previewSection.height,
          title: `Section ${Date.now()}`,
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
          borderWidth: 1,
          borderRadius: 8,
          opacity: 0.8,
          children: new Set(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Add to store using store methods directly
        createSection(newSection.id as any, newSection as any);
        
        // Reset drawing state
        setIsDrawingSection(false);
        setPreviewSection(null);
      }
    };

    // Add event listeners
    window.addEventListener('canvas:tool:connector:start', handleConnectorStart as EventListener);
    window.addEventListener('canvas:tool:connector:preview', handleConnectorPreview as EventListener);
    window.addEventListener('canvas:tool:connector:end', handleConnectorEnd as EventListener);
    window.addEventListener('canvas:tool:section:draw', handleSectionDraw as EventListener);
    window.addEventListener('canvas:tool:section:end', handleSectionEnd as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('canvas:tool:connector:start', handleConnectorStart as EventListener);
      window.removeEventListener('canvas:tool:connector:preview', handleConnectorPreview as EventListener);
      window.removeEventListener('canvas:tool:connector:end', handleConnectorEnd as EventListener);
      window.removeEventListener('canvas:tool:section:draw', handleSectionDraw as EventListener);
      window.removeEventListener('canvas:tool:section:end', handleSectionEnd as EventListener);
    };
  }, [isDrawingConnector, connectorStart, isDrawingSection, previewSection, currentTool]);

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
      ><CanvasEventHandler 
          stageRef={internalStageRef as React.RefObject<Konva.Stage>} 
          currentTool={currentTool}
        ><CanvasLayerManager 
            stageWidth={width}
            stageHeight={height}
            stageRef={internalStageRef}
            elements={elements as Map<ElementId | SectionId, CanvasElement>}
            selectedElementIds={selectedElementIds}
            onElementUpdate={(id, updates) => {
              // Delegate to store using store methods directly
              const element = elements.get(id);
              if (element && element.type === 'section') {
                updateSection(id as SectionId, updates as any);
              } else {
                updateElement(id as ElementId, updates as any);
              }
            }}
            onElementDragEnd={(e, elementId) => {
              // Handle drag end properly for both elements and sections
              const node = e.target;
              const updates = {
                x: node.x(),
                y: node.y()
              };
              
              // Check if it's a section or element and call appropriate update method
              const element = elements.get(elementId);
              if (element && element.type === 'section') {
                updateSection(elementId as SectionId, updates);
              } else {
                updateElement(elementId as ElementId, updates);
              }
            }}
            onElementClick={(e, element) => {
              // Handle element selection properly
              e.cancelBubble = true;
              if (element.type !== 'section') {
                selectElement(element.id as ElementId, e.evt?.shiftKey || false);
              }
              onElementSelect?.(element);
            }}
            onStartTextEdit={(elementId) => {
              // Handle text editing start properly
              setEditingTextId(elementId as ElementId);
            }}
            // Add missing props for drawing and connectors
            isDrawingConnector={isDrawingConnector}
            connectorStart={connectorStart}
            connectorEnd={connectorEnd}
            isDrawingSection={isDrawingSection}
            previewSection={previewSection}
          /></CanvasEventHandler></Stage>
      
      {/* Canvas UI overlays (outside Konva for better performance) */}
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
  viewport: { scale: number; position: { x: number; y: number } };
  isDrawingConnector: boolean;
  connectorStart: { x: number; y: number; elementId?: string } | null;
  connectorEnd: { x: number; y: number; elementId?: string } | null;
  isDrawingSection: boolean;
  previewSection: { x: number; y: number; width: number; height: number } | null;
}> = ({ tool, isDrawingConnector, connectorStart, connectorEnd, isDrawingSection, previewSection }) => {
  // Drawing tool overlays
  if (tool === 'pen' && isDrawingConnector) {
    return (
      <React.Fragment>
        {/* Current drawing path */}
        <Line
          points={[0, 0, 100, 100]} // Simplified for now
          stroke="#3B82F6"
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={'source-over'}
        />
      </React.Fragment>
    );
  }

  // Connector tool overlays
  if ((tool === 'connector' || tool === 'line') && isDrawingConnector && connectorStart && connectorEnd) {
    return (
      <React.Fragment>
        {/* Preview connector line */}
        <Line
          points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
          stroke="#3B82F6"
          strokeWidth={2}
          opacity={0.7}
          dash={[5, 5]}
          listening={false}
        />
        
        {/* Snap indicators */}
        {connectorStart.elementId && (
          <Circle
            x={connectorStart.x}
            y={connectorStart.y}
            radius={4}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            opacity={0.8}
            listening={false}
          />
        )}
        
        {connectorEnd.elementId && (
          <Circle
            x={connectorEnd.x}
            y={connectorEnd.y}
            radius={4}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            opacity={0.8}
            listening={false}
          />
        )}
      </React.Fragment>
    );
  }

  // Section tool overlays
  if (tool === 'section' && isDrawingSection && previewSection) {
    return (
      <React.Fragment>
        {/* Preview section rectangle */}
        <Rect
          x={previewSection.x}
          y={previewSection.y}
          width={previewSection.width}
          height={previewSection.height}
          fill="#3B82F6"
          fillOpacity={0.1}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
        
        {/* Section size indicator */}
        <Text
          x={previewSection.x + previewSection.width / 2}
          y={previewSection.y - 20}
          text={`${Math.round(previewSection.width)} × ${Math.round(previewSection.height)}`}
          fontSize={12}
          fill="#1E293B"
          align="center"
          listening={false}
        />
      </React.Fragment>
    );
  }

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
  
  // Store action hooks - declared at component level to avoid invalid hook calls
  const updateSection = useCanvasStore(state => state.updateSection);
  const updateElement = useCanvasStore(state => state.updateElement);
  const selectElement = useCanvasStore(state => state.selectElement);
  const addElement = useCanvasStore(state => state.addElement);
  const createSection = useCanvasStore(state => state.createSection);
  const setEditingTextId = useCanvasStore(state => state.setEditingTextId);

  // Add missing drawing states that exist in legacy canvas
  const [isDrawingConnector, setIsDrawingConnector] = React.useState(false);
  const [connectorStart, setConnectorStart] = React.useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [connectorEnd, setConnectorEnd] = React.useState<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>(null);
  const [isDrawingSection, setIsDrawingSection] = React.useState(false);
  const [previewSection, setPreviewSection] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Listen for custom events from CanvasEventHandler to update drawing states
  useEffect(() => {
    const handleConnectorStart = (e: CustomEvent) => {
      const { position, elementId } = e.detail;
      setIsDrawingConnector(true);
      setConnectorStart({
        x: position.x,
        y: position.y,
        elementId: elementId || undefined,
        anchor: 'center' // Default anchor for now
      });
      setConnectorEnd({ x: position.x, y: position.y });
    };

    const handleConnectorPreview = (e: CustomEvent) => {
      const { position } = e.detail;
      if (isDrawingConnector) {
        setConnectorEnd({ x: position.x, y: position.y });
      }
    };

    const handleConnectorEnd = (e: CustomEvent) => {
      const { position, elementId } = e.detail;
      if (isDrawingConnector && connectorStart) {
        // Create connector element
        const newConnector = {
          id: `connector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'connector' as const,
          subType: 'straight' as const,
          x: connectorStart.x,
          y: connectorStart.y,
          startPoint: connectorStart,
          endPoint: {
            x: position.x,
            y: position.y,
            elementId: elementId || undefined,
            anchor: 'center'
          },
          intermediatePoints: [],
          stroke: '#1E293B',
          strokeWidth: 2,
          connectorStyle: {
            strokeColor: '#1E293B',
            strokeWidth: 2,
            startArrow: 'none' as const,
            endArrow: currentTool === 'connector' ? 'solid' as const : 'none' as const,
            arrowSize: 10,
            text: ''
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Add to store using store methods directly
        addElement(newConnector as any);
        
        // Reset drawing state
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
      }
    };

    const handleSectionDraw = (e: CustomEvent) => {
      const { start, current } = e.detail;
      setIsDrawingSection(true);
      const width = current.x - start.x;
      const height = current.y - start.y;
      setPreviewSection({
        x: width < 0 ? current.x : start.x,
        y: height < 0 ? current.y : start.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    };

    const handleSectionEnd = () => {
      if (isDrawingSection && previewSection && previewSection.width > 20 && previewSection.height > 20) {
        // Create section using store
        const newSection = {
          id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'section' as const,
          x: previewSection.x,
          y: previewSection.y,
          width: previewSection.width,
          height: previewSection.height,
          title: `Section ${Date.now()}`,
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
          borderWidth: 1,
          borderRadius: 8,
          opacity: 0.8,
          children: new Set(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Add to store using store methods directly
        createSection(newSection.id as any, newSection as any);
        
        // Reset drawing state
        setIsDrawingSection(false);
        setPreviewSection(null);
      }
    };

    // Add event listeners
    window.addEventListener('canvas:tool:connector:start', handleConnectorStart as EventListener);
    window.addEventListener('canvas:tool:connector:preview', handleConnectorPreview as EventListener);
    window.addEventListener('canvas:tool:connector:end', handleConnectorEnd as EventListener);
    window.addEventListener('canvas:tool:section:draw', handleSectionDraw as EventListener);
    window.addEventListener('canvas:tool:section:end', handleSectionEnd as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('canvas:tool:connector:start', handleConnectorStart as EventListener);
      window.removeEventListener('canvas:tool:connector:preview', handleConnectorPreview as EventListener);
      window.removeEventListener('canvas:tool:connector:end', handleConnectorEnd as EventListener);
      window.removeEventListener('canvas:tool:section:draw', handleSectionDraw as EventListener);
      window.removeEventListener('canvas:tool:section:end', handleSectionEnd as EventListener);
    };
  }, [isDrawingConnector, connectorStart, isDrawingSection, previewSection, currentTool]);

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
      ><CanvasEventHandler 
          stageRef={internalStageRef as React.RefObject<Konva.Stage>} 
          currentTool={currentTool}
        ><CanvasLayerManager 
            stageWidth={width}
            stageHeight={height}
            stageRef={internalStageRef}
            elements={elements as Map<ElementId | SectionId, CanvasElement>}
            selectedElementIds={selectedElementIds}
            onElementUpdate={(id, updates) => {
              // Delegate to store using store methods directly
              const element = elements.get(id);
              if (element && element.type === 'section') {
                updateSection(id as SectionId, updates as any);
              } else {
                updateElement(id as ElementId, updates as any);
              }
            }}
            onElementDragEnd={(e, elementId) => {
              // Handle drag end properly for both elements and sections
              const node = e.target;
              const updates = {
                x: node.x(),
                y: node.y()
              };
              
              // Check if it's a section or element and call appropriate update method
              const element = elements.get(elementId);
              if (element && element.type === 'section') {
                updateSection(elementId as SectionId, updates);
              } else {
                updateElement(elementId as ElementId, updates);
              }
            }}
            onElementClick={(e, element) => {
              // Handle element selection properly
              e.cancelBubble = true;
              if (element.type !== 'section') {
                selectElement(element.id as ElementId, e.evt?.shiftKey || false);
              }
              onElementSelect?.(element);
            }}
            onStartTextEdit={(elementId) => {
              // Handle text editing start properly
              setEditingTextId(elementId as ElementId);
            }}
            // Add missing props for drawing and connectors
            isDrawingConnector={isDrawingConnector}
            connectorStart={connectorStart}
            connectorEnd={connectorEnd}
            isDrawingSection={isDrawingSection}
            previewSection={previewSection}
          />

          {/* Tool-specific overlays and preview layer */}
          <Layer name="tool-overlays">
            <ToolOverlayManager 
              tool={currentTool} 
              stageRef={internalStageRef as React.RefObject<Konva.Stage>}
              viewport={viewport}
              isDrawingConnector={isDrawingConnector}
              connectorStart={connectorStart}
              connectorEnd={connectorEnd}
              isDrawingSection={isDrawingSection}
              previewSection={previewSection}
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
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}> = ({ 
  tool, 
  isDrawingConnector = false, 
  connectorStart, 
  connectorEnd, 
  isDrawingSection = false, 
  previewSection 
}) => {
  // Split selectors to prevent infinite loop
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const currentPath = useCanvasStore((state) => state.currentPath);

  // Render drawing path for pen tool
  if (tool === 'pen' && isDrawing && currentPath.length >= 4) {
    return (
      <React.Fragment>
        {/* Drawing path preview */}
        <Line
          points={currentPath}
          stroke='#1E293B'
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={'source-over'}
        />
      </React.Fragment>
    );
  }

  // Connector tool overlays
  if ((tool === 'connector' || tool === 'line') && isDrawingConnector && connectorStart && connectorEnd) {
    return (
      <React.Fragment>
        {/* Preview connector line */}
        <Line
          points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
          stroke="#3B82F6"
          strokeWidth={2}
          opacity={0.7}
          dash={[5, 5]}
          listening={false}
        />
        
        {/* Snap indicators */}
        {connectorStart.elementId && (
          <Circle
            x={connectorStart.x}
            y={connectorStart.y}
            radius={4}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            opacity={0.8}
            listening={false}
          />
        )}
        {connectorEnd.elementId && (
          <Circle
            x={connectorEnd.x}
            y={connectorEnd.y}
            radius={4}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            opacity={0.8}
            listening={false}
          />
        )}
      </React.Fragment>
    );
  }

  // Section tool overlays
  if (tool === 'section' && isDrawingSection && previewSection) {
    return (
      <React.Fragment>
        {/* Preview section rectangle */}
        <Rect
          x={previewSection.x}
          y={previewSection.y}
          width={previewSection.width}
          height={previewSection.height}
          fill="#3B82F6"
          fillOpacity={0.1}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
        
        {/* Section size indicator */}
        <Text
          x={previewSection.x + previewSection.width / 2}
          y={previewSection.y - 20}
          text={`${Math.round(previewSection.width)} × ${Math.round(previewSection.height)}`}
          fontSize={12}
          fill="#1E293B"
          align="center"
          listening={false}
        />
      </React.Fragment>
    );
  }

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

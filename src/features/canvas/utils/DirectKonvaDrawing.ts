/**
 * EMERGENCY: Direct Konva Drawing System
 * Bypasses React entirely for high-performance drawing
 */

import Konva from 'konva';
import { nanoid } from 'nanoid';
import { createElementId } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { batchDrawingOperation, batchLayerRedraw } from './performance/EmergencyRafBatcher';

type DrawingTool = 'pen' | 'highlighter' | 'eraser';
function toTool(v: string): DrawingTool { return v === 'pen' || v === 'highlighter' || v === 'eraser' ? v : 'pen'; }

// Global drawing state - bypasses React completely
let directDrawingState = {
  isDrawing: false,
  currentTool: 'select',
  currentLine: null as Konva.Line | null,
  points: [] as number[],
  stage: null as Konva.Stage | null,
  fastLayer: null as Konva.Layer | null,
};

// EMERGENCY: Single drawing system flag
(window as any).CANVAS_DRAWING_MODE = 'DIRECT_KONVA';

// Initialize direct drawing system
export const initializeDirectKonvaDrawing = (stage: Konva.Stage) => {
  // Prevent re-initialization
  if (directDrawingState.stage === stage) {
    return;
  }
  
  console.log('🚀 Initializing Direct Konva Drawing System');
  
  directDrawingState.stage = stage;
  
  // Create or find fast layer for drawing - FIXED: Use regular Layer instead of deprecated FastLayer
  let fastLayer = stage.findOne('.direct-drawing-layer') as Konva.Layer;
  if (!fastLayer) {
    fastLayer = new Konva.Layer({
      listening: false, // This is what FastLayer did
      visible: true,
      opacity: 1
    });
    fastLayer.name('direct-drawing-layer');
    stage.add(fastLayer);
  }
  
  directDrawingState.fastLayer = fastLayer;

  // use top-level toTool
  
  // Remove any existing drawing event listeners
  stage.off('pointerdown.direct-drawing');
  stage.off('pointermove.direct-drawing');
  stage.off('pointerup.direct-drawing');
  
  // Add direct event listeners
  stage.on('pointerdown.direct-drawing', handleDirectPointerDown);
  stage.on('pointermove.direct-drawing', handleDirectPointerMove);
  stage.on('pointerup.direct-drawing', handleDirectPointerUp);
  
  // CRITICAL: Cache tool selection to avoid store access in pointer handlers
  const store = useUnifiedCanvasStore.getState();
  directDrawingState.currentTool = store.selectedTool;
  
  // Subscribe to tool changes to keep cache updated
  useUnifiedCanvasStore.subscribe(
    (state) => state.selectedTool,
    (newTool) => {
      directDrawingState.currentTool = newTool;
    }
  );
  
  console.log('✅ Direct Konva Drawing System initialized');
};

// EMERGENCY: Direct pointer down handler - ZERO store access for max performance
const handleDirectPointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
  // CRITICAL: No store access, no performance tracking - pure drawing only
  if (directDrawingState.isDrawing) return;
  
  const stage = directDrawingState.stage;
  if (!stage) return;
  
  const pointer = stage.getPointerPosition();
  if (!pointer) return;
  
  // Use cached tool from global state instead of store
  const selectedTool: DrawingTool = toTool(directDrawingState.currentTool as any);
  
  // Only handle drawing tools - use cached check
  if (!(selectedTool === 'pen' || selectedTool === 'highlighter')) {
    return;
  }
  
  // Initialize direct drawing state immediately
  directDrawingState.isDrawing = true;
  directDrawingState.points = [pointer.x, pointer.y];
  
  // Create line directly with minimal configuration
  const line = new Konva.Line({
    points: directDrawingState.points,
    stroke: getToolColor(selectedTool),
    strokeWidth: getToolWidth(selectedTool),
    opacity: getToolOpacity(selectedTool),
    lineCap: 'round',
    lineJoin: 'round',
    listening: false, // Critical for performance
    perfectDrawEnabled: false, // Critical for performance
  });
  
  directDrawingState.currentLine = line;
  directDrawingState.fastLayer?.add(line);
  
  // CRITICAL: Force immediate layer render so drawing appears
  directDrawingState.fastLayer?.draw();
  
  // All store operations moved to next tick - NEVER block pointer handler
  requestAnimationFrame(() => {
    try {
      const store = useUnifiedCanvasStore.getState();
      store.startDrawing?.(selectedTool, pointer);
    } catch (error) {
      // Silent failure - don't block drawing
    }
  });
};

// EMERGENCY: Direct pointer move handler with RAF batching
let pendingMoveUpdates: {x: number, y: number}[] = [];
let moveRAF: number | undefined;

const handleDirectPointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
  if (!directDrawingState.isDrawing || !directDrawingState.currentLine) return;
  
  const stage = directDrawingState.stage;
  if (!stage) return;
  
  const pointer = stage.getPointerPosition();
  if (!pointer) return;
  
  // Batch updates in RAF
  pendingMoveUpdates.push(pointer);
  
  if (!moveRAF) {
    moveRAF = requestAnimationFrame(() => {
      // Process ALL pending updates at once
      const updates = pendingMoveUpdates;
      pendingMoveUpdates = [];
      
      if (directDrawingState.currentLine && updates.length > 0) {
        // Add all new points with interpolation
        for (const update of updates) {
          const lastPoint = directDrawingState.points.length >= 2 ? 
            { x: directDrawingState.points[directDrawingState.points.length - 2], 
              y: directDrawingState.points[directDrawingState.points.length - 1] } : null;
              
          if (lastPoint) {
            const dx = update.x - lastPoint.x;
            const dy = update.y - lastPoint.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 2) { // Interpolation threshold
              const steps = Math.floor(dist / 2);
              for (let i = 1; i <= steps; i++) {
                const nx = lastPoint.x + (dx * (i / steps));
                const ny = lastPoint.y + (dy * (i / steps));
                directDrawingState.points.push(nx, ny);
              }
            } else {
              directDrawingState.points.push(update.x, update.y);
            }
          } else {
            directDrawingState.points.push(update.x, update.y);
          }
        }
        
        // EMERGENCY: Batch all drawing updates via RAF
        batchDrawingOperation(
          'pointer-move',
          () => {
            if (directDrawingState.currentLine) {
              directDrawingState.currentLine.points(directDrawingState.points);
            }
          },
          'high'
        );
        
        // CRITICAL: Force immediate draw so lines appear while drawing
        if (directDrawingState.fastLayer) {
          directDrawingState.fastLayer.draw();
        }
      }
      
      moveRAF = undefined;
    });
  }
};

// EMERGENCY: Direct pointer up handler - ZERO performance tracking
const handleDirectPointerUp = () => {
  if (!directDrawingState.isDrawing) return;
  
  directDrawingState.isDrawing = false;
  
  // Commit to store only if meaningful stroke - ASYNC to avoid blocking
  if (directDrawingState.points.length >= 4) {
    const points = [...directDrawingState.points];
    const tool: DrawingTool = toTool(directDrawingState.currentTool as any);
    if (tool === 'eraser') {
      // Skip commit for eraser until erasing pipeline is implemented
      directDrawingState.currentLine = null;
      directDrawingState.points = [];
      return;
    }
    
    // Move store operations to next tick
    setTimeout(() => {
      try {
        const store = useUnifiedCanvasStore.getState();
        
        const elementData = {
          id: createElementId(nanoid()),
          type: tool as 'pen' | 'highlighter',
          x: 0,
          y: 0,
          points: points,
          style: {
            color: getToolColor(tool),
            width: getToolWidth(tool),
            opacity: getToolOpacity(tool),
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false,
        };
        
        // Add to store using optimized path
        store.addElementDrawing?.(elementData as any);
        
        // Re-enable progressive rendering
        store.finishDrawing?.();
      } catch (error) {
        // Silent failure
      }
    }, 0);
  }
  
  // Clear direct drawing state immediately
  directDrawingState.currentLine = null;
  directDrawingState.points = [];
};

// Tool configuration helpers
const getToolColor = (tool: DrawingTool): string => {
  switch (tool) {
    case 'pen': return '#000000';
    case 'highlighter': return '#f7e36d';
    case 'eraser': return '#ffffff';
  }
};

const getToolWidth = (tool: DrawingTool): number => {
  switch (tool) {
    case 'pen': return 2;
    case 'highlighter': return 12;
    case 'eraser': return 12;
  }
};

const getToolOpacity = (tool: DrawingTool): number => {
  switch (tool) {
    case 'pen': return 1;
    case 'highlighter': return 0.5;
    case 'eraser': return 1;
  }
};

// Cleanup function
export const cleanupDirectKonvaDrawing = (stage: Konva.Stage) => {
  console.log('🧹 Cleaning up Direct Konva Drawing System');
  
  stage.off('pointerdown.direct-drawing');
  stage.off('pointermove.direct-drawing');
  stage.off('pointerup.direct-drawing');
  
  // Cancel any pending RAF
  if (moveRAF) {
    cancelAnimationFrame(moveRAF);
    moveRAF = undefined;
  }
  
  pendingMoveUpdates = [];
  
  directDrawingState = {
    isDrawing: false,
    currentTool: 'select',
    currentLine: null,
    points: [],
    stage: null,
    fastLayer: null,
  };
};

// Check if direct drawing is active
export const isDirectDrawingActive = (): boolean => {
  return directDrawingState.isDrawing;
};

// Emergency stop direct drawing
export const emergencyStopDirectDrawing = () => {
  console.warn('🛑 Emergency stop: Direct Konva Drawing');
  
  if (directDrawingState.currentLine) {
    directDrawingState.currentLine.remove();
  }
  
  directDrawingState.isDrawing = false;
  directDrawingState.currentLine = null;
  directDrawingState.points = [];
  
  if (moveRAF) {
    cancelAnimationFrame(moveRAF);
    moveRAF = undefined;
  }
  
  pendingMoveUpdates = [];
  
  const store = useUnifiedCanvasStore.getState();
  store.finishDrawing?.();
};

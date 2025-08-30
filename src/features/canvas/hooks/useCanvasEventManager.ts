/**
 * Canvas Event Manager Hook
 * 
 * Centralized event management hook that integrates with the unified CanvasEventManager.
 * This eliminates duplicate event listeners and provides centralized event management.
 */

import { useEffect, useCallback } from 'react';
import Konva from 'konva';
import { canvasEventManager, ToolEventHandler } from '../utils/CanvasEventManager';

export interface UseCanvasEventManagerOptions {
  isActive: boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
  toolName: string;
  handlers: ToolEventHandler;
  priority?: number; // Higher priority tools get events first
}

/**
 * Hook that registers a tool with the unified event manager
 * Centralizes event handling for performance optimization
 */
export const useCanvasEventManager = ({
  isActive,
  stageRef,
  toolName,
  handlers,
  priority = 0
}: UseCanvasEventManagerOptions) => {
  
  // Initialize event manager with stage when available
  useEffect(() => {
    if (stageRef.current) {
      canvasEventManager.initialize(stageRef.current);
    }
  }, [stageRef]);

  // Register/unregister tool based on active state
  useEffect(() => {
    if (isActive) {
      // Register tool with priority
      const toolHandler: ToolEventHandler = {
        ...handlers,
        priority
      };
      
      canvasEventManager.registerTool(toolName, toolHandler);
      
      return () => {
        canvasEventManager.unregisterTool(toolName);
      };
    }
  }, [isActive, toolName, handlers, priority]);

  // Update active tool when this tool becomes active
  useEffect(() => {
    if (isActive) {
      canvasEventManager.setActiveTool(toolName);
    }
  }, [isActive, toolName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      canvasEventManager.unregisterTool(toolName);
    };
  }, [toolName]);

  // Return utility functions
  return {
    isHandlersAttached: isActive && canvasEventManager.isToolRegistered(toolName),
    eventManager: canvasEventManager,
    
    // Helper functions for tools
    setAsActiveTool: useCallback(() => {
      canvasEventManager.setActiveTool(toolName);
    }, [toolName]),
    
    isActiveTool: useCallback(() => {
      return canvasEventManager.getActiveTool() === toolName;
    }, [toolName])
  };
};

/**
 * Hook for managing canvas cursor (unchanged from original)
 */
export const useToolCursor = (
  stageRef: React.RefObject<Konva.Stage | null>,
  isActive: boolean,
  cursorStyle: string = 'crosshair'
) => {
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const container = stage.container();

    if (isActive) {
      container.style.cursor = cursorStyle;
    } else {
      container.style.cursor = 'default';
    }

    return () => {
      container.style.cursor = 'default';
    };
  }, [stageRef, isActive, cursorStyle]);
};

/**
 * Hook for tools that need to handle core canvas operations
 * (selection, dragging, etc.) - integrates with the event manager
 */
export interface UseCanvasOperationsOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
  onElementSelect?: (elementId: string, event: Konva.KonvaEventObject<any>) => void;
  onElementDrag?: (elementId: string, event: Konva.KonvaEventObject<DragEvent>) => void;
  onBackgroundClick?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
}

export const useCanvasOperations = ({
  stageRef,
  isActive,
  onElementSelect,
  onElementDrag,
  onBackgroundClick
}: UseCanvasOperationsOptions) => {
  
  const handlers: ToolEventHandler = {
    priority: -1, // Lower priority for general canvas operations
    
    canHandle: (e) => {
      // Can handle if it's a background click or element interaction
      const target = e.target;
      return true; // Always allow canvas operations to try handling
    },
    
    onClick: (e) => {
      const target = e.target;
      
      // Check if it's a background click
      if (target === stageRef.current || target.name() === 'background-rect') {
        onBackgroundClick?.(e);
        return true;
      }
      
      // Check if it's an element click
      const elementId = target.id?.() || target.attrs?.id;
      if (elementId && onElementSelect) {
        onElementSelect(elementId, e);
        return true;
      }
      
      return false;
    },
    
    onPointerDown: (e) => {
      // Similar logic for pointer events
      const target = e.target;
      const elementId = target.id?.() || target.attrs?.id;
      
      if (elementId && onElementDrag) {
        // This could start a drag operation
        return false; // Let other handlers process this
      }
      
      return false;
    }
  };

  const { isHandlersAttached } = useCanvasEventManager({
    isActive,
    stageRef,
    toolName: 'canvas-operations',
    handlers,
    priority: -1 // Low priority
  });

  return {
    isHandlersAttached
  };
};
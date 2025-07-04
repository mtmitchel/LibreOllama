// src/features/canvas/hooks/useToolEventHandler.ts
/**
 * Shared event handler hook for canvas tools
 * Provides consistent event handling and guaranteed cleanup
 */

import { useEffect, useCallback } from 'react';
import Konva from 'konva';

export interface ToolEventHandlers {
  onPointerDown?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerMove?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerUp?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerLeave?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerEnter?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerCancel?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  useNamespacedEvents?: boolean; // Enable namespaced events like 'pointermove.toolName'
}

export interface UseToolEventHandlerOptions {
  isActive: boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
  toolName: string;
  handlers: ToolEventHandlers;
}

/**
 * Hook that manages event listeners for canvas tools
 * Automatically handles cleanup and prevents memory leaks
 */
export const useToolEventHandler = ({
  isActive,
  stageRef,
  toolName,
  handlers
}: UseToolEventHandlerOptions) => {
  // Use handlers directly - tools should memoize their own handlers if needed
  const currentHandlers = handlers;

  useEffect(() => {
    if (!isActive || !stageRef.current) {
      return;
    }

    const stage = stageRef.current;
    const useNamespaced = currentHandlers.useNamespacedEvents;
    const eventSuffix = useNamespaced ? `.${toolName}` : '';

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 [${toolName}] Attaching event handlers${useNamespaced ? ' (namespaced)' : ''}`);
    }

    // Attach event listeners
    if (currentHandlers.onPointerDown) {
      stage.on(`pointerdown${eventSuffix}`, currentHandlers.onPointerDown);
    }
    if (currentHandlers.onPointerMove) {
      stage.on(`pointermove${eventSuffix}`, currentHandlers.onPointerMove);
    }
    if (currentHandlers.onPointerUp) {
      stage.on(`pointerup${eventSuffix}`, currentHandlers.onPointerUp);
    }
    if (currentHandlers.onPointerLeave) {
      stage.on(`pointerleave${eventSuffix}`, currentHandlers.onPointerLeave);
    }
    if (currentHandlers.onPointerEnter) {
      stage.on(`pointerenter${eventSuffix}`, currentHandlers.onPointerEnter);
    }
    if (currentHandlers.onPointerCancel) {
      stage.on(`pointercancel${eventSuffix}`, currentHandlers.onPointerCancel);
    }
    if (currentHandlers.onClick) {
      stage.on(`click${eventSuffix}`, currentHandlers.onClick);
    }
    if (currentHandlers.onMouseDown) {
      stage.on(`mousedown${eventSuffix}`, currentHandlers.onMouseDown);
    }
    if (currentHandlers.onMouseMove) {
      stage.on(`mousemove${eventSuffix}`, currentHandlers.onMouseMove);
    }
    if (currentHandlers.onMouseUp) {
      stage.on(`mouseup${eventSuffix}`, currentHandlers.onMouseUp);
    }

    // Cleanup function - guaranteed to run
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 [${toolName}] Cleaning up event handlers${useNamespaced ? ' (namespaced)' : ''}`);
      }

      // Remove all event listeners for this tool
      if (currentHandlers.onPointerDown) {
        stage.off(`pointerdown${eventSuffix}`, currentHandlers.onPointerDown);
      }
      if (currentHandlers.onPointerMove) {
        stage.off(`pointermove${eventSuffix}`, currentHandlers.onPointerMove);
      }
      if (currentHandlers.onPointerUp) {
        stage.off(`pointerup${eventSuffix}`, currentHandlers.onPointerUp);
      }
      if (currentHandlers.onPointerLeave) {
        stage.off(`pointerleave${eventSuffix}`, currentHandlers.onPointerLeave);
      }
      if (currentHandlers.onPointerEnter) {
        stage.off(`pointerenter${eventSuffix}`, currentHandlers.onPointerEnter);
      }
      if (currentHandlers.onPointerCancel) {
        stage.off(`pointercancel${eventSuffix}`, currentHandlers.onPointerCancel);
      }
      if (currentHandlers.onClick) {
        stage.off(`click${eventSuffix}`, currentHandlers.onClick);
      }
      if (currentHandlers.onMouseDown) {
        stage.off(`mousedown${eventSuffix}`, currentHandlers.onMouseDown);
      }
      if (currentHandlers.onMouseMove) {
        stage.off(`mousemove${eventSuffix}`, currentHandlers.onMouseMove);
      }
      if (currentHandlers.onMouseUp) {
        stage.off(`mouseup${eventSuffix}`, currentHandlers.onMouseUp);
      }
    };
  }, [isActive, stageRef, toolName, handlers]);

  // Return utility functions if needed
  return {
    isHandlersAttached: isActive && !!stageRef.current
  };
};

/**
 * Helper hook for tools that need cursor management
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

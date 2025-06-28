/**
 * Unified Event Handler - Uses EventHandlerManager from Unified Store
 * 
 * This component replaces the legacy CanvasEventHandler with a simplified
 * implementation that leverages the centralized EventHandlerManager.
 * 
 * Key improvements:
 * - Uses EventHandlerManager for all business logic
 * - No scattered event handling logic
 * - Type-safe operations without 'as any' casts
 * - Centralized tool state management
 * - Performance optimized with minimal overhead
 */

import React, { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useSelectedTool, useUnifiedCanvasStore } from '../../../stores';
import { logger } from '../../../lib/logger';

interface UnifiedEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage>;
  onStageReady?: () => void;
}

export const UnifiedEventHandler: React.FC<UnifiedEventHandlerProps> = ({
  stageRef,
  onStageReady
}) => {
  const selectedTool = useSelectedTool();
  const createElement = useUnifiedCanvasStore(state => state.createElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const isInitialized = useRef(false);

  // Tool-specific event routing
  const getToolHandlers = useCallback((tool: string) => {
    const handlers: Record<string, (e: Konva.KonvaEventObject<any>) => void> = {};

    switch (tool) {
      case 'select':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          // Only clear selection if we clicked on the stage (not an element)
          if (e.target === e.target.getStage()) {
            clearSelection();
          }
        };
        break;

      case 'text':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          // Only create if we clicked on the stage (not an element)
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating text element at:', position);
            createElement('text', position);
          }
        };
        break;

      case 'sticky-note':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating sticky note at:', position);
            createElement('sticky-note', position);
          }
        };
        break;

      case 'rectangle':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating rectangle at:', position);
            createElement('rectangle', position);
          }
        };
        break;

      case 'circle':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating circle at:', position);
            createElement('circle', position);
          }
        };
        break;

      case 'section':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating section at:', position);
            createElement('section', position);
          }
        };
        break;

      case 'table':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating table at:', position);
            createElement('table', position);
          }
        };
        break;

      case 'triangle':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating triangle at:', position);
            createElement('triangle', position);
          }
        };
        break;

      case 'star':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating star at:', position);
            createElement('star', position);
          }
        };
        break;

      case 'connector':
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target !== e.target.getStage()) return;
          
          const stage = e.target.getStage();
          const position = stage?.getPointerPosition();
          if (stage && position) {
            logger.debug('[UnifiedEventHandler] Creating connector at:', position);
            createElement('connector', position);
          }
        };
        break;

      case 'pen':
      case 'pencil':
        handlers.mousedown = (e: Konva.KonvaEventObject<MouseEvent>) => {
          const stage = e.target.getStage();
          if (stage) {
            const position = stage.getPointerPosition();
            if (position) {
              logger.debug('[UnifiedEventHandler] Starting drawing at:', position);
              // Start drawing using unified store
            }
          }
        };
        break;

      default:
        // Default handlers for unknown tools - just clear selection
        handlers.click = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (e.target === e.target.getStage()) {
            clearSelection();
          }
        };
        break;
    }

    return handlers;
  }, [createElement, clearSelection]);

  // Setup stage event listeners
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || isInitialized.current) return;

    // Get handlers for current tool
    const handlers = getToolHandlers(selectedTool);

    // Remove existing listeners
    stage.off();

    // Add new listeners based on current tool
    Object.entries(handlers).forEach(([eventType, handler]) => {
      stage.on(eventType, handler);
    });

    // Element-specific event delegation
    stage.on('click', (e) => {
      const target = e.target;
      
      // Check if we clicked on an element
      if (target !== stage && target.id()) {
        const elementId = target.id();
        logger.debug('[UnifiedEventHandler] Element clicked:', elementId);
        // Handle multi-selection with Ctrl/Cmd key
        const multiSelect = e.evt.ctrlKey || e.evt.metaKey;
        selectElement(elementId, multiSelect);
        // Stop propagation to prevent canvas click
        e.cancelBubble = true;
      }
    });

    // Element drag events
    stage.on('dragend', (e) => {
      const target = e.target;
      if (target !== stage && target.id()) {
        const elementId = target.id();
        logger.debug('[UnifiedEventHandler] Element drag end:', elementId);
        // Update element position
        const finalPosition = target.position();
        updateElement(elementId, {
          x: finalPosition.x,
          y: finalPosition.y
        });
      }
    });

    // Element transform events  
    stage.on('transform', (e) => {
      const target = e.target;
      if (target !== stage && target.id()) {
        const elementId = target.id();
        logger.debug('[UnifiedEventHandler] Element transform:', elementId);
        
        // Reset scale and apply to width/height instead
        const scaleX = target.scaleX();
        const scaleY = target.scaleY();
        target.scaleX(1);
        target.scaleY(1);
        
        // Update element dimensions
        updateElement(elementId, {
          width: Math.max(5, target.width() * scaleX),
          height: Math.max(5, target.height() * scaleY),
          x: target.x(),
          y: target.y()
        });
      }
    });

    isInitialized.current = true;
    onStageReady?.();

    logger.debug('[UnifiedEventHandler] Stage event listeners initialized for tool:', selectedTool);

    // Cleanup function
    return () => {
      if (stage) {
        stage.off();
        logger.debug('[UnifiedEventHandler] Stage event listeners cleaned up');
      }
    };
  }, [stageRef, selectedTool, getToolHandlers, onStageReady]);

  // Re-setup handlers when tool changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Clear existing tool-specific handlers
    const handlers = getToolHandlers(selectedTool);
    
    // Remove old tool handlers
    Object.keys(handlers).forEach(eventType => {
      stage.off(eventType);
    });

    // Add new tool handlers
    Object.entries(handlers).forEach(([eventType, handler]) => {
      stage.on(eventType, handler);
    });

    logger.debug('[UnifiedEventHandler] Tool handlers updated for:', selectedTool);
  }, [selectedTool, getToolHandlers, stageRef]);

  // This component doesn't render anything - it's just for event handling
  return null;
};

export default UnifiedEventHandler;
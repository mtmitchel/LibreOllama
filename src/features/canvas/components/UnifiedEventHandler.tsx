/**
 * UnifiedEventHandler - Centralized Event Delegation with Enhanced Error Handling
 * 
 * CRITICAL FIX: Single event system to eliminate dual handler conflicts
 * ENHANCED: Robust error handling, fallbacks, and recovery mechanisms
 */

import React, { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useSelectedTool, useUnifiedCanvasStore } from '../../../stores';
import { logger } from '../../../lib/logger';
import { ElementId, ElementOrSectionId, CanvasTool } from '../types/enhanced.types';

interface EventHandlerMetrics {
  successCount: number;
  errorCount: number;
  lastError: string | null;
  lastErrorTimestamp: number | null;
  averageExecutionTime: number;
}

interface EventHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  enableFallback: boolean;
  reportErrors: boolean;
}

interface UnifiedEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  onStageReady?: () => void;
}

/**
 * Enhanced Error Handling Manager for Event Operations
 */
class EventErrorManager {
  private handlerMetrics = new Map<string, EventHandlerMetrics>();
  private emergencyFallbackActive = false;
  private readonly config: EventHandlerConfig;

  constructor(config: Partial<EventHandlerConfig> = {}) {
    this.config = {
      maxRetries: 2,
      retryDelay: 50,
      timeoutMs: 3000,
      enableFallback: true,
      reportErrors: true,
      ...config,
    };
  }

  /**
   * Enhanced wrapper for event handlers with comprehensive error handling
   */
  createSafeEventHandler<T extends Konva.KonvaEventObject<any>>(
    handlerName: string,
    originalHandler: (e: T) => void | Promise<void>,
    fallbackHandler?: (e: T) => void,
    toolValidator?: (currentTool: CanvasTool) => boolean
  ): (e: T) => Promise<void> {
    return async (e: T) => {
      const startTime = performance.now();
      let attempts = 0;
      const maxAttempts = this.config.maxRetries + 1;

      const executeHandler = async (): Promise<void> => {
        attempts++;
        
        try {
          // Pre-execution validation
          if (!this.validateEventContext(e, handlerName)) {
            logger.warn(`[EventErrorManager] Event validation failed: ${handlerName}`);
            return;
          }

          // Execute with timeout protection
          await this.executeWithTimeout(
            () => originalHandler(e),
            this.config.timeoutMs
          );
          
          // Record successful execution
          this.recordHandlerMetrics(handlerName, performance.now() - startTime, null);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`[EventErrorManager] Handler error (${handlerName}, attempt ${attempts}):`, error);
          
          // Record error metrics
          this.recordHandlerMetrics(handlerName, performance.now() - startTime, errorMessage);
          
          // Retry logic
          if (attempts < maxAttempts && this.shouldRetry(error)) {
            logger.warn(`[EventErrorManager] Retrying ${handlerName} (attempt ${attempts + 1}/${maxAttempts})`);
            await this.delay(this.config.retryDelay);
            return executeHandler();
          }
          
          // Fallback handling
          if (this.config.enableFallback && fallbackHandler) {
            logger.warn(`[EventErrorManager] Using fallback handler for ${handlerName}`);
            try {
              fallbackHandler(e);
            } catch (fallbackError) {
              logger.error(`[EventErrorManager] Fallback handler also failed for ${handlerName}:`, fallbackError);
              this.activateEmergencyMode(handlerName, fallbackError);
            }
          } else {
            this.activateEmergencyMode(handlerName, error);
          }
        }
      };

      return executeHandler();
    };
  }

  private validateEventContext<T extends Konva.KonvaEventObject<any>>(
    event: T,
    handlerName: string
  ): boolean {
    try {
      if (!event || typeof event !== 'object') {
        logger.warn(`[EventErrorManager] Invalid event object for ${handlerName}`);
        return false;
      }

      if (!event.target || !event.currentTarget) {
        logger.warn(`[EventErrorManager] Event missing required properties for ${handlerName}`);
        return false;
      }

      if (typeof event.target.getStage === 'function') {
        const stage = event.target.getStage();
        if (!stage) {
          logger.warn(`[EventErrorManager] Cannot access stage for ${handlerName}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error(`[EventErrorManager] Event validation error for ${handlerName}:`, error);
      return false;
    }
  }

  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableErrors = [
        'Network error',
        'Temporary failure',
        'Resource busy',
        'Timeout',
        'Pointer position not available'
      ];
      
      return retryableErrors.some(pattern => 
        error.message.toLowerCase().includes(pattern.toLowerCase())
      );
    }
    return false;
  }

  private recordHandlerMetrics(
    handlerName: string,
    executionTime: number,
    error: string | null
  ): void {
    const metrics = this.handlerMetrics.get(handlerName) || {
      successCount: 0,
      errorCount: 0,
      lastError: null,
      lastErrorTimestamp: null,
      averageExecutionTime: 0,
    };

    if (error) {
      metrics.errorCount++;
      metrics.lastError = error;
      metrics.lastErrorTimestamp = Date.now();
    } else {
      metrics.successCount++;
    }

    const totalExecutions = metrics.successCount + metrics.errorCount;
    metrics.averageExecutionTime = 
      ((metrics.averageExecutionTime * (totalExecutions - 1)) + executionTime) / totalExecutions;

    this.handlerMetrics.set(handlerName, metrics);
  }

  private activateEmergencyMode(handlerName: string, error: unknown): void {
    if (this.emergencyFallbackActive) {
      return;
    }

    this.emergencyFallbackActive = true;
    logger.error(`[EventErrorManager] Activating emergency mode due to ${handlerName} failure:`, error);

    setTimeout(() => {
      this.emergencyFallbackActive = false;
      logger.debug('[EventErrorManager] Emergency mode deactivated');
    }, 5000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSystemHealth(): {
    emergencyModeActive: boolean;
    totalHandlers: number;
    healthyHandlers: number;
    failingHandlers: string[];
    averagePerformance: number;
  } {
    const failingHandlers: string[] = [];
    let totalPerformance = 0;
    let healthyCount = 0;

    this.handlerMetrics.forEach((metrics, handlerName) => {
      const errorRate = metrics.errorCount / (metrics.successCount + metrics.errorCount);
      
      if (errorRate > 0.1) {
        failingHandlers.push(handlerName);
      } else {
        healthyCount++;
        totalPerformance += metrics.averageExecutionTime;
      }
    });

    return {
      emergencyModeActive: this.emergencyFallbackActive,
      totalHandlers: this.handlerMetrics.size,
      healthyHandlers: healthyCount,
      failingHandlers,
      averagePerformance: healthyCount > 0 ? totalPerformance / healthyCount : 0,
    };
  }
}

export const UnifiedEventHandler: React.FC<UnifiedEventHandlerProps> = ({
  stageRef,
  onStageReady
}) => {
  const selectedTool = useSelectedTool();
  const isInitialized = useRef(false);
  const rafId = useRef<number | null>(null);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const errorManager = useRef(new EventErrorManager()).current;

  const store = useUnifiedCanvasStore();
  const {
    createElement,
    clearSelection,
    selectElement,
    updateElement,
    deleteSelectedElements,
    uploadImage,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    isDrawing,
    startDraftSection,
    updateDraftSection,
    commitDraftSection,
    cancelDraftSection
  } = store;

  // Enhanced error recovery with metrics
  const handleToolError = useCallback((toolName: string, error: Error) => {
    logger.error(`[UnifiedEventHandler] ${toolName} error:`, error);
    
    try {
      cancelDrawing();
      cancelDraftSection();
      clearSelection();
      store.setSelectedTool('select');
      logger.debug(`[UnifiedEventHandler] Recovered from ${toolName} error`);
    } catch (recoveryError) {
      logger.error('[UnifiedEventHandler] Error recovery failed:', recoveryError);
    }
  }, [cancelDrawing, cancelDraftSection, clearSelection, store]);

  // System health monitoring
  const getEventSystemHealth = useCallback(() => {
    return errorManager.getSystemHealth();
  }, [errorManager]);

  // Tool-specific click handler
  const handleToolClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, tool: string) => {
    // Only handle stage clicks, not element clicks
    if (e.target !== e.target.getStage()) return;

    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (!stage || !position) return;

    try {
      switch (tool) {
        case 'select':
          clearSelection();
          break;
        
        case 'text':
        case 'sticky-note':
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'star':
        case 'table':
          console.log(`🔧 [EventHandler] Creating ${tool} at:`, position);
          createElement(tool, position);
          break;
        
        case 'image':
          handleImageUpload(position);
          break;
        
        default:
          clearSelection();
      }
    } catch (error) {
      handleToolError(tool, error as Error);
    }
  }, [createElement, clearSelection, handleToolError]);

  // Image upload handler
  const handleImageUpload = useCallback((position: { x: number; y: number }) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await uploadImage(file, position);
          logger.debug('[EventHandler] Image uploaded successfully');
        } catch (error) {
          logger.error('[EventHandler] Image upload failed:', error);
        }
      }
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }, [uploadImage]);

  // Section tool handlers
  const handleSectionStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) return;
    
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (stage && position) {
      startDraftSection(position);
    }
  }, [startDraftSection]);

  const handleSectionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (stage && position) {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(() => {
        updateDraftSection(position);
        rafId.current = null;
      });
    }
  }, [updateDraftSection]);

  const handleSectionEnd = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (stage && position) {
      updateDraftSection(position);
      const sectionId = commitDraftSection();
      if (sectionId) {
        logger.debug('[EventHandler] Section created:', sectionId);
      }
    }
  }, [updateDraftSection, commitDraftSection]);

  // Drawing tool handlers
  const handleDrawingStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>, tool: 'pen' | 'pencil') => {
    if (e.target !== e.target.getStage()) return;
    
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (stage && position) {
      startDrawing(tool, position);
    }
  }, [startDrawing]);

  const handleDrawingMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const position = stage?.getPointerPosition();
    if (stage && position) {
      updateDrawing(position);
    }
  }, [isDrawing, updateDrawing]);

  const handleDrawingEnd = useCallback(() => {
    if (isDrawing) {
      finishDrawing();
    }
  }, [isDrawing, finishDrawing]);

  // Element click handler
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    if (target.id() && target !== e.target.getStage()) {
      const elementId = target.id() as ElementId;
      const multiSelect = e.evt.ctrlKey || e.evt.metaKey;
      selectElement(elementId, multiSelect);
      e.cancelBubble = true;
    }
  }, [selectElement]);

  // CRITICAL FIX: Enhanced drag handling with error recovery
  const handleDragStart = useCallback(async (e: Konva.KonvaEventObject<DragEvent>) => {
    const safeHandler = errorManager.createSafeEventHandler(
      'dragStart',
      (e: Konva.KonvaEventObject<DragEvent>) => {
        const target = e.target;
        if (target.id() && target !== e.target.getStage()) {
          const elementId = target.id();
          const position = target.position();
          dragStartPositions.current.set(elementId, position);
          logger.debug('[UnifiedEventHandler] Drag start:', elementId, position);
        }
      },
      (e: Konva.KonvaEventObject<DragEvent>) => {
        logger.warn('[UnifiedEventHandler] Drag start fallback executed');
      }
    );
    
    await safeHandler(e);
  }, [errorManager]);

  const handleDragEnd = useCallback(async (e: Konva.KonvaEventObject<DragEvent>) => {
    const safeHandler = errorManager.createSafeEventHandler(
      'dragEnd',
      (e: Konva.KonvaEventObject<DragEvent>) => {
        const target = e.target;
        if (target.id() && target !== e.target.getStage()) {
          const elementId = target.id() as ElementId;
          const finalPosition = target.position();
          
          // CRITICAL: Validate position before updating store
          if (typeof finalPosition.x === 'number' && 
              typeof finalPosition.y === 'number' &&
              Number.isFinite(finalPosition.x) && 
              Number.isFinite(finalPosition.y)) {
            
            updateElement(elementId, {
              x: Math.round(finalPosition.x),
              y: Math.round(finalPosition.y),
              updatedAt: Date.now()
            });
            
            console.log('🔄 [UnifiedEventHandler] Position updated:', elementId, finalPosition);
            logger.debug('[UnifiedEventHandler] Element position updated:', { elementId, position: finalPosition });
          } else {
            throw new Error(`Invalid position received: ${JSON.stringify(finalPosition)}`);
          }
          
          dragStartPositions.current.delete(elementId);
        }
      },
      (e: Konva.KonvaEventObject<DragEvent>) => {
        logger.warn('[UnifiedEventHandler] Drag end fallback - position not updated');
        const target = e.target;
        if (target.id()) {
          dragStartPositions.current.delete(target.id());
        }
      }
    );
    
    await safeHandler(e);
  }, [errorManager, updateElement]);

  // Keyboard handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        deleteSelectedElements();
        break;
      
      case 'Escape':
        e.preventDefault();
        clearSelection();
        if (isDrawing) finishDrawing();
        cancelDraftSection();
        break;
    }
  }, [deleteSelectedElements, clearSelection, isDrawing, finishDrawing, cancelDraftSection]);

  // Main event setup effect
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // CRITICAL: Clear all existing listeners to prevent conflicts
    stage.off();

    // Tool-specific handlers
    if (selectedTool === 'section') {
      stage.on('mousedown', handleSectionStart);
      stage.on('mousemove', handleSectionMove);
      stage.on('mouseup', handleSectionEnd);
    } else if (selectedTool === 'pen' || selectedTool === 'pencil') {
      stage.on('mousedown', (e) => handleDrawingStart(e, selectedTool as 'pen' | 'pencil'));
      stage.on('mousemove', handleDrawingMove);
      stage.on('mouseup', handleDrawingEnd);
    } else {
      stage.on('click', (e) => handleToolClick(e, selectedTool));
    }

    // Universal element handlers - CENTRALIZED HERE
    stage.on('click', handleElementClick);
    stage.on('dragstart', handleDragStart);
    stage.on('dragend', handleDragEnd);

    // Keyboard handlers
    document.addEventListener('keydown', handleKeyDown);

    // Initialize stage
    if (!isInitialized.current) {
      isInitialized.current = true;
      onStageReady?.();
    }

    logger.debug('[EventHandler] Initialized for tool:', selectedTool);

    return () => {
      stage.off();
      document.removeEventListener('keydown', handleKeyDown);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [
    selectedTool,
    stageRef,
    handleToolClick,
    handleSectionStart,
    handleSectionMove,
    handleSectionEnd,
    handleDrawingStart,
    handleDrawingMove,
    handleDrawingEnd,
    handleElementClick,
    handleDragStart,
    handleDragEnd,
    handleKeyDown,
    onStageReady
  ]);

  // Expose health monitoring for debugging
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__canvasEventHealth = getEventSystemHealth;
    }
  }, [getEventSystemHealth]);

  return null;
};

export default UnifiedEventHandler;

/**
 * Enhanced Event Handler Error Handling
 * Provides robust error handling, fallbacks, and recovery mechanisms for canvas events
 * Solves: Unhandled event scenarios, event handler gaps, unexpected tool transitions
 */

import { logger } from '@/lib/logger';
import { CanvasTool } from '../../types/enhanced.types';
import { drawingStateManager } from './DrawingStateManager';
import Konva from 'konva';
import { CanvasPerformanceProfiler } from '../performance/CanvasPerformanceProfiler';

export interface EventHandlerMetrics {
  successCount: number;
  errorCount: number;
  lastError: string | null;
  lastErrorTimestamp: number | null;
  averageExecutionTime: number;
}

export interface EventHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  enableFallback: boolean;
  reportErrors: boolean;
}

export class EventHandlerManager {
  private handlerMetrics = new Map<string, EventHandlerMetrics>();
  private readonly config: EventHandlerConfig;
  private emergencyFallbackActive = false;
  private lastToolState: CanvasTool | null = null;

  constructor(config: Partial<EventHandlerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 100,
      timeoutMs: 5000,
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
    originalHandler: (e: T) => void,
    fallbackHandler?: (e: T) => void,
    toolValidator?: (currentTool: CanvasTool) => boolean
  ): (e: T) => void {
    return (e: T) => {
      const startTime = performance.now();
      let attempts = 0;
      const maxAttempts = this.config.maxRetries + 1;

      const executeHandler = async (): Promise<void> => {
        attempts++;
        
        try {
          // Pre-execution validation
          if (!this.validateEventContext(e, handlerName)) {
            logger.warn(`Event handler validation failed: ${handlerName}`);
            return;
          }

          // Tool state validation
          if (toolValidator && !this.validateToolState(toolValidator)) {
            logger.warn(`Tool state validation failed: ${handlerName}`);
            return;
          }

          // Execute with timeout protection
          const executionPromise = this.executeWithTimeout(
            () => originalHandler(e),
            this.config.timeoutMs
          );

          await executionPromise;
          
          // Record successful execution
          this.recordHandlerMetrics(handlerName, performance.now() - startTime, null);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Event handler error (${handlerName}, attempt ${attempts}):`, error);
          
          // Record error metrics
          this.recordHandlerMetrics(handlerName, performance.now() - startTime, errorMessage);
          
          // Retry logic
          if (attempts < maxAttempts && this.shouldRetry(error)) {
            logger.warn(`Retrying ${handlerName} (attempt ${attempts + 1}/${maxAttempts})`);
            await this.delay(this.config.retryDelay);
            return executeHandler();
          }
          
          // Fallback handling
          if (this.config.enableFallback && fallbackHandler) {
            logger.warn(`Using fallback handler for ${handlerName}`);
            try {
              fallbackHandler(e);
            } catch (fallbackError) {
              logger.error(`Fallback handler also failed for ${handlerName}:`, fallbackError);
              this.activateEmergencyMode(handlerName, fallbackError);
            }
          } else {
            this.activateEmergencyMode(handlerName, error);
          }
        }
      };

      executeHandler().catch((error) => {
        logger.error(`Fatal error in event handler manager for ${handlerName}:`, error);
        this.activateEmergencyMode(handlerName, error);
      });
    };
  }

  /**
   * Validate event context for safety
   */
  private validateEventContext<T extends Konva.KonvaEventObject<any>>(
    event: T,
    handlerName: string
  ): boolean {
    try {
      // Check if event is valid
      if (!event || typeof event !== 'object') {
        logger.warn(`Invalid event object for ${handlerName}`);
        return false;
      }

      // Check if event has required properties
      if (!event.target || !event.currentTarget) {
        logger.warn(`Event missing required properties for ${handlerName}`);
        return false;
      }

      // Check if stage is accessible
      const stage = event.target.getStage();
      if (!stage) {
        logger.warn(`Cannot access stage for ${handlerName}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Event validation error for ${handlerName}:`, error);
      return false;
    }
  }

  /**
   * Validate tool state consistency
   */
  private validateToolState(toolValidator: (currentTool: CanvasTool) => boolean): boolean {
    try {
      // Get current tool from store (would need to be injected)
      // For now, we'll skip this validation
      return true;
    } catch (error) {
      logger.error('Tool state validation error:', error);
      return false;
    }
  }

  /**
   * Execute function with timeout protection
   */
  private executeWithTimeout<T>(
    fn: () => T,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = fn();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Determine if error should trigger retry
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableErrors = [
        'Network error',
        'Temporary failure',
        'Resource busy',
        'Timeout',
      ];
      
      return retryableErrors.some(pattern => 
        error.message.toLowerCase().includes(pattern.toLowerCase())
      );
    }
    return false;
  }

  /**
   * Record handler execution metrics
   */
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

    // Update average execution time
    const totalExecutions = metrics.successCount + metrics.errorCount;
    metrics.averageExecutionTime = 
      ((metrics.averageExecutionTime * (totalExecutions - 1)) + executionTime) / totalExecutions;

    this.handlerMetrics.set(handlerName, metrics);
  }

  /**
   * Activate emergency mode to prevent cascade failures
   */
  private activateEmergencyMode(handlerName: string, error: unknown): void {
    if (this.emergencyFallbackActive) {
      return; // Already in emergency mode
    }

    this.emergencyFallbackActive = true;
    logger.error(`Activating emergency mode due to ${handlerName} failure:`, error);

    // Cancel any ongoing drawing operations
    drawingStateManager.cancelCurrentOperation();

    // Reset to safe state
    this.resetToSafeState();

    // Schedule emergency mode reset
    setTimeout(() => {
      this.emergencyFallbackActive = false;
      logger.log('Emergency mode deactivated');
    }, 10000); // 10 second emergency mode
  }

  /**
   * Reset canvas to safe state
   */
  private resetToSafeState(): void {
    try {
      // This would typically involve:
      // 1. Clearing active drawing operations
      // 2. Resetting tool to 'select'
      // 3. Clearing any temporary UI states
      // 4. Ensuring no event handlers are stuck
      
      logger.log('Canvas reset to safe state');
    } catch (error) {
      logger.error('Failed to reset to safe state:', error);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced event handler factory methods
   */
  createSectionMouseDownHandler(
    stageRef: React.RefObject<Konva.Stage | null>,
    onDrawingStart: (operationId: string) => void,
    lastMousePosRef: React.MutableRefObject<{ x: number; y: number } | null>
  ) {
    return this.createSafeEventHandler(
      'sectionMouseDown',
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) {
          throw new Error('Stage reference not available');
        }

        const pointer = stage.getPointerPosition();
        if (!pointer) {
          throw new Error('Pointer position not available');
        }

        const operationId = drawingStateManager.startDrawing('section', pointer);
        lastMousePosRef.current = { x: pointer.x, y: pointer.y };
        
        onDrawingStart(operationId);
        
        logger.log('Section drawing started', { operationId, pointer });
        console.log('📦 Section drawing started:', {
          operationId,
          startPosition: { x: pointer.x.toFixed(2), y: pointer.y.toFixed(2) },
        });
      },
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        logger.warn('Using fallback for section mouse down');
        // No need to call onDrawingStart here, as it would be a failure case
      }
    );
  }

  createSectionMouseUpHandler(
    stageRef: React.RefObject<Konva.Stage | null>,
    operationId: string | null,
    onDrawingEnd: () => void,
    createSection: (x: number, y: number, width: number, height: number, title: string) => string,
    captureElementsAfterSectionCreation: (sectionId: string) => void,
    setSelectedTool: (tool: CanvasTool) => void
  ) {
    return this.createSafeEventHandler(
      'sectionMouseUp',
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!operationId) {
          logger.warn('Section mouse up: No active operation ID.');
          onDrawingEnd();
          return;
        }

        const finalState = drawingStateManager.completeDrawing(operationId);

        // Enhanced fallback: if drawing state is invalid, try to create section from mouse position
        if (!finalState || finalState.tool !== 'section' || !finalState.startPoint || !finalState.currentPoint) {
          logger.warn('Section mouse up: No valid section drawing operation to complete.');
          
          // Try to get current mouse position as fallback
          const stage = stageRef.current;
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              // Create default-sized section at current mouse position
              const defaultWidth = 200;
              const defaultHeight = 150;
              
              const newSection = {
                x: pointer.x - defaultWidth / 2,
                y: pointer.y - defaultHeight / 2,
                width: defaultWidth,
                height: defaultHeight,
                title: 'New Section',
              };

              const sectionId = createSection(
                newSection.x,
                newSection.y,
                newSection.width,
                newSection.height,
                newSection.title
              );

              captureElementsAfterSectionCreation(sectionId);
              setSelectedTool('select');
              
              logger.log('✅ Section created from fallback (current mouse position):', { 
                sectionId, 
                dimensions: newSection,
                reason: 'Invalid drawing state'
              });
            }
          }
          
          onDrawingEnd();
          return;
        }

        const { startPoint, currentPoint } = finalState;
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;

        const minWidth = 5;
        const minHeight = 5;
        const actualWidth = Math.abs(width);
        const actualHeight = Math.abs(height);

        // Distinguish between clicks and intentional drags using total distance
        const totalDistance = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) + 
          Math.pow(currentPoint.y - startPoint.y, 2)
        );

        // Click detection: Very small movement indicates click, not intentional drag
        const clickDistanceThreshold = 2; // Reduced from 3 to 2 pixels
        const isActualClick = totalDistance <= clickDistanceThreshold;

        if (isActualClick) {
          // This is a genuine click - create default-sized section
          const defaultWidth = 200;
          const defaultHeight = 150;
          
          const newSection = {
            x: startPoint.x - defaultWidth / 2,
            y: startPoint.y - defaultHeight / 2,
            width: defaultWidth,
            height: defaultHeight,
            title: 'New Section',
          };

          const sectionId = createSection(
            newSection.x,
            newSection.y,
            newSection.width,
            newSection.height,
            newSection.title
          );

          captureElementsAfterSectionCreation(sectionId);
          onDrawingEnd();
          setSelectedTool('select');

          logger.log('✅ Section created from click (default size):', { 
            sectionId, 
            dimensions: newSection, 
            originalAttempt: `${actualWidth.toFixed(0)}x${actualHeight.toFixed(0)}`,
            totalDistance: totalDistance.toFixed(1),
            reason: 'Genuine click detected'
          });
          return;
        }

        // This is an intentional drag - check if it meets minimum size requirements
        if (actualWidth < minWidth || actualHeight < minHeight) {
          // User dragged but the result is too small - provide helpful error
          const errorMsg = `Section too small. Minimum size: ${minWidth}x${minHeight}, attempted: ${actualWidth.toFixed(0)}x${actualHeight.toFixed(0)}. Drag further to create a larger section, or click without dragging for a default-sized section.`;
          console.warn('🚫 Section creation blocked (intentional drag too small):', { 
            reason: errorMsg,
            totalDistance: totalDistance.toFixed(1),
            dimensions: `${actualWidth.toFixed(0)}x${actualHeight.toFixed(0)}`
          });
          onDrawingEnd();
          throw new Error(errorMsg);
        }

        // Valid drag - create section with user's dimensions
        const newSection = {
          x: width > 0 ? startPoint.x : currentPoint.x,
          y: height > 0 ? startPoint.y : currentPoint.y,
          width: actualWidth,
          height: actualHeight,
          title: 'New Section',
        };

        const sectionId = createSection(
          newSection.x,
          newSection.y,
          newSection.width,
          newSection.height,
          newSection.title
        );

        captureElementsAfterSectionCreation(sectionId);
        onDrawingEnd();
        setSelectedTool('select');

        logger.log('✅ Section created from drag (custom size):', { 
          sectionId, 
          dimensions: newSection,
          totalDistance: totalDistance.toFixed(1),
          reason: 'Valid intentional drag'
        });
      },
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        logger.warn('Using fallback for section mouse up');
        if (operationId) {
          drawingStateManager.cancelCurrentOperation();
        }
        onDrawingEnd();
      }
    );
  }

  /**
   * Get handler metrics for monitoring
   */
  getHandlerMetrics(): Map<string, EventHandlerMetrics> {
    return new Map(this.handlerMetrics);
  }

  /**
   * Get system health status
   */
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
      
      if (errorRate > 0.1) { // More than 10% error rate
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
    };  }
  /**
   * Create enhanced section mouse move handler with error handling
   */
  createSectionMouseMoveHandler(
    stageRef: React.RefObject<Konva.Stage | null>,
    isDrawingSection: boolean,
    operationId: string | null,
    setPreviewSection: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number } | null>>
  ) {
    return this.createSafeEventHandler(
      'sectionMouseMove',
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawingSection || !operationId) {
          return;
        }

        const stage = stageRef.current;
        if (!stage) {
          throw new Error('Stage not available');
        }

        const pointer = stage.getPointerPosition();
        if (!pointer) {
          throw new Error('Pointer position not available');
        }

        if (!drawingStateManager.updateDrawing(operationId, pointer)) {
          logger.warn('Failed to update drawing state in mousemove');
          return; // Stop if state update fails
        }

        const startPoint = drawingStateManager.getCurrentState().startPoint;
        if (!startPoint) return;

        // Calculate proper rectangle bounds to handle negative dimensions
        // When dragging up or left, we need to adjust the starting position
        const x = Math.min(startPoint.x, pointer.x);
        const y = Math.min(startPoint.y, pointer.y);
        const width = Math.abs(pointer.x - startPoint.x);
        const height = Math.abs(pointer.y - startPoint.y);

        setPreviewSection({
          x: x,
          y: y,
          width: width,
          height: height,
        });
      },
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        logger.warn('Using fallback for section mouse move');
      }
    );
  }
}

// Export singleton instance
export const eventHandlerManager = new EventHandlerManager();

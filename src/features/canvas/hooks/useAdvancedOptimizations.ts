/**
 * Advanced Canvas Optimizations Integration Hook
 * 
 * Combines all optimization systems into a cohesive performance solution:
 * - Progressive rendering for large element counts
 * - Memory pressure detection with adaptive settings
 * - Circuit breaker protection for expensive operations
 * - WeakMap-based memory management
 * - State validation and corruption prevention
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import { useProgressiveRender } from './useProgressiveRender';
import { 
  useMemoryPressure, 
  PressureLevel, 
  AdaptiveSettings 
} from '../utils/memoryPressureDetector';
import { 
  useCircuitBreaker, 
  canvasCircuitBreakers,
  CircuitState
} from '../utils/circuitBreaker';
import { 
  memoryManager, 
  ElementWrapper 
} from '../utils/memoryManager';
import { 
  stateValidator, 
  ValidationLevel, 
  ValidationResult 
} from '../utils/stateValidator';

interface OptimizationConfig {
  enableProgressiveRender: boolean;
  enableMemoryPressure: boolean;
  enableCircuitBreakers: boolean;
  enableMemoryManager: boolean;
  enableStateValidation: boolean;
  validationLevel: ValidationLevel;
  maxElements: number;
  targetFPS: number;
}

interface OptimizationStats {
  memoryPressure: PressureLevel;
  renderingProgress: number;
  isRendering: boolean;
  circuitBreakerStats: {
    batchUpdate: {
      failures: number;
      state: CircuitState;
      successes: number;
      lastFailure: number | null;
      lastSuccess: number | null;
      totalCalls: number;
      averageExecutionTime: number;
    };
    render: {
      failures: number;
      state: CircuitState;
      successes: number;
      lastFailure: number | null;
      lastSuccess: number | null;
      totalCalls: number;
      averageExecutionTime: number;
    };
  };
  validationResult: ValidationResult | null;
  adaptiveSettings: AdaptiveSettings;
  performance: {
    frameRate: number;
    memoryUsage: number;
    responseTime: number;
  };
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enableProgressiveRender: true,
  enableMemoryPressure: true,
  enableCircuitBreakers: true,
  enableMemoryManager: true,
  enableStateValidation: true,
  validationLevel: ValidationLevel.STANDARD,
  maxElements: 5000,
  targetFPS: 60,
};

export function useAdvancedOptimizations(
  elements: CanvasElement[],
  viewport: { x: number; y: number; scale: number; width: number; height: number },
  canvasState: {
    elements: Map<string, CanvasElement>;
    selectedElementIds: Set<ElementId>;
    viewport: { x: number; y: number; scale: number; width?: number; height?: number };
    selectedTool: string;
  },
  config: Partial<OptimizationConfig> = {}
) {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const lastValidationRef = useRef<ValidationResult | null>(null);
  const elementWrappersRef = useRef<Map<ElementId, ElementWrapper<CanvasElement>>>(new Map());

  // Memory pressure monitoring with adaptive settings
  const { 
    pressure, 
    settings: adaptiveSettings, 
    stats: memoryStats 
  } = useMemoryPressure();

  // Progressive rendering for large element counts
  const progressiveRender = useProgressiveRender(
    elements, 
    viewport, 
    {
      chunkSize: adaptiveSettings.batchSize,
      frameTime: 1000 / finalConfig.targetFPS, // Convert FPS to ms per frame
      priorityThreshold: Math.min(adaptiveSettings.maxElements, finalConfig.maxElements)
    }
  );

  // Circuit breaker for critical operations
  const batchUpdateBreaker = useCircuitBreaker('batchUpdate');
  const renderBreaker = useCircuitBreaker('render');

  // Memory management with WeakMap references
  useEffect(() => {
    if (!finalConfig.enableMemoryManager) return;

    // Create wrappers for new elements
    elements.forEach(element => {
      const elementId = element.id as ElementId;
      if (!elementWrappersRef.current.has(elementId)) {
        const wrapper = memoryManager.createElementWrapper(element);
        elementWrappersRef.current.set(elementId, wrapper);
      }
    });

    // Clean up wrappers for removed elements
    const currentElementIds = new Set(elements.map(e => e.id as ElementId));
    for (const [elementId, wrapper] of elementWrappersRef.current) {
      if (!currentElementIds.has(elementId)) {
        wrapper.cleanup();
        elementWrappersRef.current.delete(elementId);
      }
    }
  }, [elements, finalConfig.enableMemoryManager]);

  // State validation
  useEffect(() => {
    if (!finalConfig.enableStateValidation || !canvasState) return;

    const validateState = () => {
      stateValidator.setLevel(finalConfig.validationLevel);
      // Create a compatible CanvasState object for validation, filtering out sections
      const elementsOnly = Array.from(canvasState.elements.entries()).filter(([key, value]) => value.type !== 'section');
      const validationState = {
        elements: new Map(elementsOnly.map(([key, value]) => [value.id as ElementId, value])),
        selectedElementIds: canvasState.selectedElementIds,
        groups: new Map(), // Empty for now
        elementToGroupMap: new Map(), // Empty for now  
        elementOrder: elementsOnly.map(([key, value]) => value.id as ElementId)
      };
      const result = stateValidator.validate(validationState);
      
      if (!result.isValid) {
        console.warn('🔍 Canvas state validation failed:', {
          errors: result.errors.length,
          warnings: result.warnings.length,
          fixed: result.fixed.length,
          stats: result.stats
        });
      }
      
      lastValidationRef.current = result;
    };

    // Validate immediately and on interval
    validateState();
    const interval = setInterval(validateState, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [canvasState, finalConfig.enableStateValidation, finalConfig.validationLevel]);

  // Adaptive performance adjustments based on memory pressure
  useEffect(() => {
    if (!finalConfig.enableMemoryPressure) return;

    console.log(`🧠 Memory pressure: ${PressureLevel[pressure]}`, {
      maxElements: adaptiveSettings.maxElements,
      animations: adaptiveSettings.enableAnimations,
      quality: adaptiveSettings.renderQuality,
      batchSize: adaptiveSettings.batchSize
    });

    // Apply adaptive settings to progressive render
    if (pressure >= PressureLevel.HIGH) {
      // Reduce render quality under high memory pressure
      progressiveRender.renderChunk(
        progressiveRender.visibleElements.slice(0, adaptiveSettings.maxElements)
      );
    }
  }, [pressure, adaptiveSettings, finalConfig.enableMemoryPressure]);

  // Optimized element operations with circuit breaker protection
  const safeElementOperation = useCallback(async <T>(
    operation: () => Promise<T> | T,
    operationType: 'create' | 'update' | 'delete' | 'batch' | 'render'
  ): Promise<T | null> => {
    if (!finalConfig.enableCircuitBreakers) {
      return Promise.resolve(operation());
    }

    try {
      const breaker = operationType === 'batch' ? batchUpdateBreaker :
                     operationType === 'render' ? renderBreaker :
                     canvasCircuitBreakers.createElement;

      return await breaker.execute(operation, operationType);
    } catch (error) {
      console.error(`⚡ Circuit breaker triggered for ${operationType}:`, error);
      return null;
    }
  }, [finalConfig.enableCircuitBreakers, batchUpdateBreaker, renderBreaker]);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      elementWrappersRef.current.forEach(wrapper => wrapper.cleanup());
      elementWrappersRef.current.clear();
    };
  }, []);

  // Optimization statistics
  const optimizationStats = useMemo<OptimizationStats>(() => ({
    memoryPressure: pressure,
    renderingProgress: progressiveRender.progress,
    isRendering: progressiveRender.isRendering,
    circuitBreakerStats: {
      batchUpdate: batchUpdateBreaker.stats || { failures: 0, state: CircuitState.CLOSED, successes: 0, lastFailure: null, lastSuccess: null, totalCalls: 0, averageExecutionTime: 0 },
      render: renderBreaker.stats || { failures: 0, state: CircuitState.CLOSED, successes: 0, lastFailure: null, lastSuccess: null, totalCalls: 0, averageExecutionTime: 0 },
    },
    validationResult: lastValidationRef.current,
    adaptiveSettings,
    performance: {
      frameRate: memoryStats.frameRate,
      memoryUsage: memoryStats.memoryUsage,
      responseTime: memoryStats.responseTime,
    },
  }), [
    pressure, 
    progressiveRender, 
    batchUpdateBreaker.stats, 
    renderBreaker.stats,
    adaptiveSettings, 
    memoryStats
  ]);

  // Performance monitoring hook
  const performanceMonitor = useCallback(() => {
    const stats = optimizationStats;
    
    if (stats.performance.frameRate < 30) {
      console.warn('⚠️ Low frame rate detected:', stats.performance.frameRate);
    }
    
    if (stats.performance.memoryUsage > 0.8) {
      console.warn('⚠️ High memory usage detected:', stats.performance.memoryUsage);
    }
    
    if (stats.validationResult && !stats.validationResult.isValid) {
      console.warn('⚠️ State validation issues detected:', stats.validationResult.errors.length);
    }

    return stats;
  }, [optimizationStats]);

  return {
    // Optimized element rendering
    visibleElements: finalConfig.enableProgressiveRender 
      ? progressiveRender.visibleElements 
      : elements,
    
    // Safe operations with circuit breaker protection
    safeElementOperation,
    
    // Performance stats and monitoring
    stats: optimizationStats,
    monitor: performanceMonitor,
    
    // Manual controls
    forceRender: progressiveRender.renderChunk,
    resetCircuitBreakers: () => {
      batchUpdateBreaker.reset();
      renderBreaker.reset();
    },
    validateState: () => {
      if (canvasState) {
        const elementsOnly = Array.from(canvasState.elements.entries()).filter(([key, value]) => value.type !== 'section');
        const validationState = {
          elements: new Map(elementsOnly.map(([key, value]) => [value.id as ElementId, value])),
          selectedElementIds: canvasState.selectedElementIds,
          groups: new Map(),
          elementToGroupMap: new Map(),
          elementOrder: elementsOnly.map(([key, value]) => value.id as ElementId)
        };
        return stateValidator.validate(validationState);
      }
      return null;
    },
    
    // Adaptive settings from memory pressure
    adaptiveSettings,
    
    // Memory management utilities
    getElementWrapper: (elementId: ElementId) => elementWrappersRef.current.get(elementId),
    
    // Configuration
    config: finalConfig,
  };
}

/**
 * Performance monitoring component
 */
export const createPerformanceMonitor = (stats: OptimizationStats) => {
  if (process.env.NODE_ENV === 'production') return null;

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000,
      maxWidth: '300px'
    }
  }, [
    React.createElement('div', { key: 'title' }, React.createElement('strong', {}, 'Canvas Performance')),
    React.createElement('div', { key: 'memory' }, `Memory: ${PressureLevel[stats.memoryPressure]}`),
    React.createElement('div', { key: 'fps' }, `FPS: ${stats.performance.frameRate.toFixed(1)}`),
    React.createElement('div', { key: 'usage' }, `Memory Usage: ${(stats.performance.memoryUsage * 100).toFixed(1)}%`),
    React.createElement('div', { key: 'progress' }, `Render Progress: ${(stats.renderingProgress * 100).toFixed(0)}%`),
    React.createElement('div', { key: 'maxel' }, `Max Elements: ${stats.adaptiveSettings.maxElements}`),
    React.createElement('div', { key: 'batch' }, `Batch Size: ${stats.adaptiveSettings.batchSize}`),
    React.createElement('div', { key: 'quality' }, `Quality: ${stats.adaptiveSettings.renderQuality}`),
    stats.validationResult && React.createElement('div', { 
      key: 'validation',
      style: { color: stats.validationResult.isValid ? 'green' : 'red' }
    }, `Validation: ${stats.validationResult.isValid ? 'OK' : 'FAIL'}${!stats.validationResult.isValid ? ` (${stats.validationResult.errors.length} errors)` : ''}`)
  ].filter(Boolean));
};

/**
 * Hook for simple performance monitoring
 */
export function usePerformanceMonitor(elements: CanvasElement[]) {
  const [stats, setStats] = React.useState({
    elementCount: 0,
    renderTime: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const startTime = performance.now();
      
      // Simulate render time measurement
      const renderTime = performance.now() - startTime;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit
        : 0;

      setStats({
        elementCount: elements.length,
        renderTime,
        memoryUsage,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [elements]);

  return stats;
}
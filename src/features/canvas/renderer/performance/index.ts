/**
 * Performance Optimization Systems
 * Comprehensive performance integration for the modular canvas architecture
 */

export { 
  PerformanceIntegrationManager,
  type PerformanceConfig,
  type PerformanceMetrics,
  type CachedNode
} from './PerformanceIntegrationManager';

export { 
  useShapeCaching 
} from '../../hooks/useShapeCaching';

export { 
  useAdvancedOptimizations 
} from '../../hooks/useAdvancedOptimizations';

export { 
  screenReaderUtils,
  type ScreenReaderDescription,
  type AriaAttributes
} from '../../accessibility/ScreenReaderUtils';

/**
 * Performance Integration Quick Start Guide
 * 
 * 1. Initialize the performance integration manager:
 * 
 * ```typescript
 * const performanceManager = new PerformanceIntegrationManager({
 *   enableShapeCaching: true,
 *   enableProgressiveRender: true,
 *   enableMemoryPressure: true,
 *   enableCircuitBreakers: true,
 *   enablePerformanceMonitoring: true
 * });
 * 
 * performanceManager.initialize({
 *   drawBatcher,
 *   rendererCore,
 *   eventRouter,
 *   selectionManager
 * });
 * ```
 * 
 * 2. The system will automatically:
 *    - Cache complex shapes to improve rendering performance
 *    - Use progressive rendering for large element counts
 *    - Detect memory pressure and adapt settings
 *    - Provide circuit breaker protection for critical operations
 *    - Monitor performance metrics in real-time
 * 
 * 3. Access performance metrics:
 * 
 * ```typescript
 * const metrics = performanceManager.getMetrics();
 * console.log('FPS:', metrics.frameRate);
 * console.log('Memory Usage:', metrics.memoryUsage);
 * console.log('Cached Elements:', metrics.cachedElements);
 * ```
 * 
 * 4. Manual controls:
 * 
 * ```typescript
 * // Force clear all cached nodes
 * performanceManager.clearCache();
 * 
 * // Reset circuit breakers after failures
 * performanceManager.resetCircuitBreakers();
 * 
 * // Validate canvas state
 * const validation = performanceManager.validateState();
 * ```
 */
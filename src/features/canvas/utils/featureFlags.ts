/**
 * Canvas Feature Flags
 * Controls the rollout of refactored canvas components
 */

export interface CanvasFeatureFlags {
  useRefactoredCanvas: boolean;
  useEnhancedEventHandler: boolean;
  useOptimizedCoordinateService: boolean;
  useEnhancedCacheManager: boolean;
  enablePerformanceMonitoring: boolean;
}

// Default feature flag configuration
const DEFAULT_FLAGS: CanvasFeatureFlags = {
  useRefactoredCanvas: true, // Re-enabled - we'll fix the refactored canvas properly
  useEnhancedEventHandler: true, // Safe to enable immediately
  useOptimizedCoordinateService: true, // Safe to enable immediately
  useEnhancedCacheManager: true, // Safe to enable immediately
  enablePerformanceMonitoring: true, // Helpful for validation
};

// Environment-based overrides
const getEnvironmentFlags = (): Partial<CanvasFeatureFlags> => {
  if (typeof window !== 'undefined') {
    // Check for URL parameters for testing
    const urlParams = new URLSearchParams(window.location.search);
    const flags = {
      // Use refactored canvas by default, unless explicitly disabled
      useRefactoredCanvas: urlParams.get('refactored-canvas') !== 'false',
      useEnhancedEventHandler: urlParams.get('enhanced-events') !== 'false',
      useOptimizedCoordinateService: urlParams.get('optimized-coords') !== 'false',
      useEnhancedCacheManager: urlParams.get('enhanced-cache') !== 'false',
      enablePerformanceMonitoring: urlParams.get('performance-monitoring') !== 'false',
    };
    
    console.log('🚀 Canvas Feature Flags:', {
      urlParams: Object.fromEntries(urlParams.entries()),
      resolvedFlags: flags,
      useRefactored: flags.useRefactoredCanvas
    });
    
    return flags;
  }
  return {};
};

// Combined feature flags
export const canvasFeatureFlags: CanvasFeatureFlags = {
  ...DEFAULT_FLAGS,
  ...getEnvironmentFlags(),
};

// Hook for components to check feature flags
export const useCanvasFeatureFlag = (flag: keyof CanvasFeatureFlags): boolean => {
  return canvasFeatureFlags[flag];
};

// Development utilities
export const enableRefactoredCanvas = () => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('refactored-canvas', 'true');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  }
};

export const disableRefactoredCanvas = () => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('refactored-canvas');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  }
};

// Performance monitoring flag check
export const isPerformanceMonitoringEnabled = (): boolean => {
  return canvasFeatureFlags.enablePerformanceMonitoring;
};

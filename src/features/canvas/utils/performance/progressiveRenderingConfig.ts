/**
 * Optimized Progressive Rendering Configuration
 * Based on handoff recommendations and performance testing
 */

export interface ProgressiveRenderThresholds {
  // Main threshold for enabling progressive rendering
  enableThreshold: number;
  
  // Priority thresholds for different performance tiers
  priorityThreshold: number;
  
  // Chunk sizes based on performance conditions
  chunkSizes: {
    default: number;
    highPerformance: number;
    lowPerformance: number;
  };
  
  // Frame time budgets
  frameTimeBudgets: {
    default: number;
    drawing: number;
    interaction: number;
  };
  
  // Device-specific adjustments
  deviceMultipliers: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Optimized thresholds based on handoff document recommendations
 * and real-world performance testing
 */
export const OPTIMIZED_PROGRESSIVE_RENDER_CONFIG: ProgressiveRenderThresholds = {
  // Progressive rendering kicks in at 300 elements instead of 500
  // This provides better experience for users with mid-range devices
  enableThreshold: 300,
  
  // Priority rendering for viewport elements starts at 150
  // This ensures visible elements render first
  priorityThreshold: 150,
  
  // Adaptive chunk sizes based on performance conditions
  chunkSizes: {
    default: 40,        // Reduced from 50 for smoother animation
    highPerformance: 75, // For powerful devices
    lowPerformance: 20   // For slower devices or high memory pressure
  },
  
  // Frame time budgets optimized for different scenarios  
  // PERFORMANCE: Relaxed budgets to prevent RAF violations
  frameTimeBudgets: {
    default: 12,      // More conservative for smoother experience
    drawing: 6,       // Minimal budget during drawing to prevent interference  
    interaction: 8    // Conservative budget during interactions
  },
  
  // Device-specific performance multipliers
  deviceMultipliers: {
    mobile: 0.6,    // 60% of base thresholds
    tablet: 0.8,    // 80% of base thresholds
    desktop: 1.0    // 100% of base thresholds
  }
};

/**
 * Performance-aware configuration selector
 */
export class ProgressiveRenderingTuner {
  private static instance: ProgressiveRenderingTuner;
  private currentConfig: ProgressiveRenderThresholds;
  private performanceMetrics: {
    averageFrameTime: number;
    memoryPressure: 'low' | 'medium' | 'high';
    deviceType: 'mobile' | 'tablet' | 'desktop';
    isDrawing: boolean;
    elementCount: number;
  };

  private constructor() {
    this.currentConfig = OPTIMIZED_PROGRESSIVE_RENDER_CONFIG;
    this.performanceMetrics = {
      averageFrameTime: 16,
      memoryPressure: 'low',
      deviceType: this.detectDeviceType(),
      isDrawing: false,
      elementCount: 0
    };
    
    this.adaptConfigToDevice();
  }

  public static getInstance(): ProgressiveRenderingTuner {
    if (!ProgressiveRenderingTuner.instance) {
      ProgressiveRenderingTuner.instance = new ProgressiveRenderingTuner();
    }
    return ProgressiveRenderingTuner.instance;
  }

  /**
   * Get optimized configuration for current conditions
   */
  public getOptimizedConfig(context: {
    elementCount: number;
    isDrawing: boolean;
    isInteracting: boolean;
    memoryPressure?: 'low' | 'medium' | 'high';
  }) {
    this.updateMetrics(context);
    
    const config = { ...this.currentConfig };
    const deviceMultiplier = config.deviceMultipliers[this.performanceMetrics.deviceType];
    
    // Adjust thresholds based on device performance
    const adjustedEnableThreshold = Math.floor(config.enableThreshold * deviceMultiplier);
    const adjustedPriorityThreshold = Math.floor(config.priorityThreshold * deviceMultiplier);
    
    // Select appropriate chunk size
    let chunkSize = config.chunkSizes.default;
    if (this.performanceMetrics.averageFrameTime < 12) {
      chunkSize = config.chunkSizes.highPerformance;
    } else if (this.performanceMetrics.averageFrameTime > 20 || this.performanceMetrics.memoryPressure === 'high') {
      chunkSize = config.chunkSizes.lowPerformance;
    }
    
    // Adjust chunk size for device
    chunkSize = Math.floor(chunkSize * deviceMultiplier);
    
    // Select appropriate frame time budget
    let frameTime = config.frameTimeBudgets.default;
    if (context.isDrawing) {
      frameTime = config.frameTimeBudgets.drawing;
    } else if (context.isInteracting) {
      frameTime = config.frameTimeBudgets.interaction;
    }
    
    return {
      enableThreshold: adjustedEnableThreshold,
      priorityThreshold: adjustedPriorityThreshold,
      chunkSize: Math.max(chunkSize, 10), // Minimum chunk size
      frameTime: Math.max(frameTime, 6),  // Minimum frame time
      
      // Additional computed values
      shouldEnable: context.elementCount > adjustedEnableThreshold,
      recommendedBatchSize: Math.min(chunkSize * 2, 100), // For batch operations
      
      // Debug info
      debugInfo: {
        deviceType: this.performanceMetrics.deviceType,
        deviceMultiplier,
        averageFrameTime: this.performanceMetrics.averageFrameTime,
        memoryPressure: this.performanceMetrics.memoryPressure,
        originalChunkSize: config.chunkSizes.default,
        adjustedChunkSize: chunkSize
      }
    };
  }

  /**
   * Update performance metrics for adaptive tuning
   */
  public updatePerformanceMetrics(metrics: {
    frameTime?: number;
    memoryPressure?: 'low' | 'medium' | 'high';
  }) {
    if (metrics.frameTime !== undefined) {
      // Use exponential moving average to smooth frame time
      this.performanceMetrics.averageFrameTime = 
        (this.performanceMetrics.averageFrameTime * 0.8) + (metrics.frameTime * 0.2);
    }
    
    if (metrics.memoryPressure !== undefined) {
      this.performanceMetrics.memoryPressure = metrics.memoryPressure;
    }
    
    // Log significant performance changes
    if (metrics.frameTime && metrics.frameTime > 25) {
      console.warn('🐌 [ProgressiveRender] Poor performance detected:', {
        frameTime: metrics.frameTime,
        averageFrameTime: this.performanceMetrics.averageFrameTime,
        recommendation: 'Consider reducing chunk size or element count'
      });
    }
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(elementCount: number): string[] {
    const recommendations: string[] = [];
    const config = this.getOptimizedConfig({ elementCount, isDrawing: false, isInteracting: false });
    
    if (elementCount > config.enableThreshold * 2) {
      recommendations.push(`Consider using viewport culling - rendering ${elementCount} elements`);
    }
    
    if (this.performanceMetrics.averageFrameTime > 20) {
      recommendations.push('Frame time high - reduce element complexity or count');
    }
    
    if (this.performanceMetrics.memoryPressure === 'high') {
      recommendations.push('High memory pressure - enable element virtualization');
    }
    
    if (this.performanceMetrics.deviceType === 'mobile' && elementCount > 200) {
      recommendations.push('Mobile device - consider reducing element density');
    }
    
    return recommendations;
  }

  private updateMetrics(context: {
    elementCount: number;
    isDrawing: boolean;
    isInteracting: boolean;
    memoryPressure?: 'low' | 'medium' | 'high';
  }) {
    this.performanceMetrics.elementCount = context.elementCount;
    this.performanceMetrics.isDrawing = context.isDrawing;
    
    if (context.memoryPressure) {
      this.performanceMetrics.memoryPressure = context.memoryPressure;
    }
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?=.*tablet)|kindle|silk/i.test(userAgent);
    
    if (isMobile && !isTablet) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }

  private adaptConfigToDevice() {
    const multiplier = this.currentConfig.deviceMultipliers[this.performanceMetrics.deviceType];
    
    // Log device-specific optimization
    console.info('📱 [ProgressiveRender] Device optimization:', {
      deviceType: this.performanceMetrics.deviceType,
      multiplier,
      optimizedThresholds: {
        enableThreshold: Math.floor(this.currentConfig.enableThreshold * multiplier),
        priorityThreshold: Math.floor(this.currentConfig.priorityThreshold * multiplier)
      }
    });
  }
}

/**
 * Hook for easy access to optimized progressive rendering config
 */
export function useOptimizedProgressiveConfig(context: {
  elementCount: number;
  isDrawing: boolean;
  isInteracting: boolean;
  memoryPressure?: 'low' | 'medium' | 'high';
}) {
  const tuner = ProgressiveRenderingTuner.getInstance();
  return tuner.getOptimizedConfig(context);
}

/**
 * Global performance metrics reporter for integration with existing monitoring
 */
export function reportProgressiveRenderMetrics(frameTime: number, memoryPressure?: 'low' | 'medium' | 'high') {
  const tuner = ProgressiveRenderingTuner.getInstance();
  tuner.updatePerformanceMetrics({ frameTime, memoryPressure });
  
  // Integration with existing diagnostics
  if ((window as any).DRAWING_DIAGNOSTICS) {
    (window as any).DEBUG_PROGRESSIVE_RENDER_FRAME_TIME = frameTime;
    (window as any).DEBUG_PROGRESSIVE_RENDER_PRESSURE = memoryPressure;
  }
}
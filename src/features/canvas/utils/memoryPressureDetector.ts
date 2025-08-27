/**
 * Memory Pressure Detection with Adaptive Degradation
 * 
 * Monitors system memory usage and automatically reduces canvas
 * performance features to prevent crashes and maintain responsiveness
 */

import React from 'react';

interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceInfo {
  memoryInfo: MemoryInfo;
  frameRate: number;
  responseTime: number;
}

export enum PressureLevel {
  LOW = 0,
  MODERATE = 1,
  HIGH = 2,
  CRITICAL = 3
}

export interface AdaptiveSettings {
  maxElements: number;
  enableAnimations: boolean;
  enableShadows: boolean;
  enableFilters: boolean;
  renderQuality: 'high' | 'medium' | 'low';
  batchSize: number;
  frameSkipping: boolean;
}

const PRESSURE_THRESHOLDS = {
  [PressureLevel.LOW]: 0.5,      // 50% memory usage
  [PressureLevel.MODERATE]: 0.7, // 70% memory usage
  [PressureLevel.HIGH]: 0.85,    // 85% memory usage
  [PressureLevel.CRITICAL]: 0.95 // 95% memory usage
};

const ADAPTIVE_CONFIGS: Record<PressureLevel, AdaptiveSettings> = {
  [PressureLevel.LOW]: {
    maxElements: 10000,
    enableAnimations: true,
    enableShadows: true,
    enableFilters: true,
    renderQuality: 'high',
    batchSize: 50,
    frameSkipping: false,
  },
  [PressureLevel.MODERATE]: {
    maxElements: 5000,
    enableAnimations: true,
    enableShadows: false,
    enableFilters: true,
    renderQuality: 'medium',
    batchSize: 100,
    frameSkipping: false,
  },
  [PressureLevel.HIGH]: {
    maxElements: 2000,
    enableAnimations: false,
    enableShadows: false,
    enableFilters: false,
    renderQuality: 'low',
    batchSize: 200,
    frameSkipping: true,
  },
  [PressureLevel.CRITICAL]: {
    maxElements: 500,
    enableAnimations: false,
    enableShadows: false,
    enableFilters: false,
    renderQuality: 'low',
    batchSize: 500,
    frameSkipping: true,
  },
};

export class MemoryPressureDetector {
  private static instance: MemoryPressureDetector;
  private currentPressure: PressureLevel = PressureLevel.LOW;
  private observers: ((level: PressureLevel, settings: AdaptiveSettings) => void)[] = [];
  private monitoringInterval: number | null = null;
  private frameRateHistory: number[] = [];
  private responseTimeHistory: number[] = [];
  private lastFrameTime = performance.now();
  private readonly MONITOR_INTERVAL = 2000; // Check every 2 seconds
  private readonly HISTORY_SIZE = 10;

  private constructor() {
    this.startMonitoring();
    
    // Listen for performance observer if available
    this.setupPerformanceObserver();
    
    // Handle visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  public static getInstance(): MemoryPressureDetector {
    if (!MemoryPressureDetector.instance) {
      MemoryPressureDetector.instance = new MemoryPressureDetector();
    }
    return MemoryPressureDetector.instance;
  }

  /**
   * Subscribe to pressure level changes
   */
  public subscribe(callback: (level: PressureLevel, settings: AdaptiveSettings) => void): () => void {
    this.observers.push(callback);
    
    // Immediately notify with current state
    callback(this.currentPressure, this.getCurrentSettings());
    
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Get current memory pressure level
   */
  public getCurrentPressure(): PressureLevel {
    return this.currentPressure;
  }

  /**
   * Get current adaptive settings
   */
  public getCurrentSettings(): AdaptiveSettings {
    return { ...ADAPTIVE_CONFIGS[this.currentPressure] };
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = window.setInterval(() => {
      this.checkMemoryPressure();
    }, this.MONITOR_INTERVAL);

    // Also check on requestAnimationFrame for performance metrics
    this.trackFrameRate();
  }

  /**
   * Check current memory pressure and update if changed
   */
  private checkMemoryPressure(): void {
    const performanceInfo = this.gatherPerformanceInfo();
    const newPressureLevel = this.calculatePressureLevel(performanceInfo);

    if (newPressureLevel !== this.currentPressure) {
      const oldLevel = this.currentPressure;
      this.currentPressure = newPressureLevel;
      
      console.log(`🧠 Memory pressure changed: ${PressureLevel[oldLevel]} → ${PressureLevel[newPressureLevel]}`);
      
      // Notify observers
      const settings = this.getCurrentSettings();
      this.observers.forEach(callback => {
        try {
          callback(newPressureLevel, settings);
        } catch (error) {
          console.error('Error in memory pressure observer:', error);
        }
      });
    }
  }

  /**
   * Gather performance information
   */
  private gatherPerformanceInfo(): PerformanceInfo {
    const memoryInfo: MemoryInfo = {};
    
    // Try to get memory info from performance.memory
    if ((performance as any).memory) {
      const perfMemory = (performance as any).memory as MemoryInfo;
      memoryInfo.usedJSHeapSize = perfMemory.usedJSHeapSize;
      memoryInfo.totalJSHeapSize = perfMemory.totalJSHeapSize;
      memoryInfo.jsHeapSizeLimit = perfMemory.jsHeapSizeLimit;
    }

    // Calculate average frame rate
    const frameRate = this.frameRateHistory.length > 0 
      ? this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length 
      : 60;

    // Calculate average response time
    const responseTime = this.responseTimeHistory.length > 0
      ? this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
      : 0;

    return {
      memoryInfo,
      frameRate,
      responseTime,
    };
  }

  /**
   * Calculate pressure level based on performance info
   */
  private calculatePressureLevel(info: PerformanceInfo): PressureLevel {
    let pressureScore = 0;

    // Memory usage score
    if (info.memoryInfo.usedJSHeapSize && info.memoryInfo.jsHeapSizeLimit) {
      const memoryUsage = info.memoryInfo.usedJSHeapSize / info.memoryInfo.jsHeapSizeLimit;
      if (memoryUsage > PRESSURE_THRESHOLDS[PressureLevel.CRITICAL]) pressureScore += 3;
      else if (memoryUsage > PRESSURE_THRESHOLDS[PressureLevel.HIGH]) pressureScore += 2;
      else if (memoryUsage > PRESSURE_THRESHOLDS[PressureLevel.MODERATE]) pressureScore += 1;
    }

    // Frame rate score
    if (info.frameRate < 30) pressureScore += 2;
    else if (info.frameRate < 45) pressureScore += 1;

    // Response time score
    if (info.responseTime > 100) pressureScore += 2;
    else if (info.responseTime > 50) pressureScore += 1;

    // Convert score to pressure level
    if (pressureScore >= 5) return PressureLevel.CRITICAL;
    if (pressureScore >= 3) return PressureLevel.HIGH;
    if (pressureScore >= 1) return PressureLevel.MODERATE;
    return PressureLevel.LOW;
  }

  /**
   * Track frame rate for performance monitoring
   */
  private trackFrameRate(): void {
    if (typeof window === 'undefined') return;

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameDuration = currentTime - this.lastFrameTime;
      const frameRate = 1000 / frameDuration;
      
      this.frameRateHistory.push(frameRate);
      if (this.frameRateHistory.length > this.HISTORY_SIZE) {
        this.frameRateHistory.shift();
      }
      
      this.lastFrameTime = currentTime;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Setup performance observer for response time tracking
   */
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.responseTimeHistory.push(entry.duration);
            if (this.responseTimeHistory.length > this.HISTORY_SIZE) {
              this.responseTimeHistory.shift();
            }
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance observer not available:', error);
    }
  }

  /**
   * Handle visibility changes (tab switching)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden - reduce monitoring frequency
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = window.setInterval(() => {
          this.checkMemoryPressure();
        }, this.MONITOR_INTERVAL * 4); // Check 4x less frequently
      }
    } else {
      // Page is visible - resume normal monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = window.setInterval(() => {
          this.checkMemoryPressure();
        }, this.MONITOR_INTERVAL);
      }
    }
  }

  /**
   * Force a specific pressure level (for testing)
   */
  public forcePressureLevel(level: PressureLevel): void {
    if (level !== this.currentPressure) {
      this.currentPressure = level;
      const settings = this.getCurrentSettings();
      this.observers.forEach(callback => callback(level, settings));
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    pressure: PressureLevel;
    memoryUsage: number;
    frameRate: number;
    responseTime: number;
  } {
    const info = this.gatherPerformanceInfo();
    const memoryUsage = info.memoryInfo.usedJSHeapSize && info.memoryInfo.jsHeapSizeLimit
      ? info.memoryInfo.usedJSHeapSize / info.memoryInfo.jsHeapSizeLimit
      : 0;

    return {
      pressure: this.currentPressure,
      memoryUsage,
      frameRate: info.frameRate,
      responseTime: info.responseTime,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.observers = [];
  }
}

// Export singleton instance
export const memoryPressureDetector = MemoryPressureDetector.getInstance();

// React hook for memory pressure detection
export function useMemoryPressure() {
  const [pressure, setPressure] = React.useState(PressureLevel.LOW);
  const [settings, setSettings] = React.useState(ADAPTIVE_CONFIGS[PressureLevel.LOW]);

  React.useEffect(() => {
    const unsubscribe = memoryPressureDetector.subscribe((level, adaptiveSettings) => {
      setPressure(level);
      setSettings(adaptiveSettings);
    });

    return unsubscribe;
  }, []);

  return {
    pressure,
    settings,
    stats: memoryPressureDetector.getMemoryStats(),
    forcePressure: memoryPressureDetector.forcePressureLevel.bind(memoryPressureDetector),
  };
}
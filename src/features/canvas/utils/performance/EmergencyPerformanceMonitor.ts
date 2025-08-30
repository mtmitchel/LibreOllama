/**
 * EMERGENCY: Comprehensive Performance Monitoring System
 * Monitors all canvas operations and triggers automatic optimizations
 */

import { emergencyStopRAF, getRAFStatus } from './EmergencyRafBatcher';
import { emergencyStopCanvas } from '../../hooks/usePerformanceCircuitBreaker';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';

interface PerformanceMetrics {
  canvasInitTime: number[];
  toolSwitchTime: number[];
  pointerHandlerTime: number[];
  rafViolations: number;
  memoryUsage: number[];
  frameDrops: number;
  emergencyStops: number;
  lastCleanup: number;
}

interface PerformanceThresholds {
  canvasInitMax: number;
  toolSwitchMax: number;
  pointerHandlerMax: number;
  maxRAFViolations: number;
  maxMemoryMB: number;
  maxFrameDrops: number;
}

// Global performance tracking
const performanceMetrics: PerformanceMetrics = {
  canvasInitTime: [],
  toolSwitchTime: [],
  pointerHandlerTime: [],
  rafViolations: 0,
  memoryUsage: [],
  frameDrops: 0,
  emergencyStops: 0,
  lastCleanup: Date.now(),
};

// Emergency thresholds - ALIGNED with circuit breaker
const emergencyThresholds: PerformanceThresholds = {
  canvasInitMax: 500, // 500ms max canvas init time - matches circuit breaker
  toolSwitchMax: 200,  // 200ms max tool switch time
  pointerHandlerMax: 16, // 16ms max pointer handler time (one frame)
  maxRAFViolations: 50, // Max RAF violations before emergency
  maxMemoryMB: 1024,     // 1GB max memory usage
  maxFrameDrops: 100,    // Max frame drops in a session - prevents false alarms
};

export class EmergencyPerformanceMonitor {
  private static instance: EmergencyPerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private emergencyMode = false;

  public static getInstance(): EmergencyPerformanceMonitor {
    if (!EmergencyPerformanceMonitor.instance) {
      EmergencyPerformanceMonitor.instance = new EmergencyPerformanceMonitor();
    }
    return EmergencyPerformanceMonitor.instance;
  }

  // Start comprehensive monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    console.log('🔍 Starting Emergency Performance Monitoring');
    this.isMonitoring = true;
    
    // Monitor canvas initialization
    this.monitorCanvasInit();
    
    // Monitor tool switching
    this.monitorToolSwitching();
    
    // Monitor pointer handlers
    this.monitorPointerHandlers();
    
    // Monitor RAF violations
    this.monitorRAFViolations();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor frame drops
    this.monitorFrameDrops();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // Monitor canvas initialization times
  private monitorCanvasInit(): void {
    let initStartTime = 0;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLCanvasElement) {
            initStartTime = performance.now();
            
            // Check when canvas is ready
            requestAnimationFrame(() => {
              const initTime = performance.now() - initStartTime;
              this.recordCanvasInitTime(initTime);
            });
          }
        });
      });
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }

  // Monitor tool switching performance
  private monitorToolSwitching(): void {
    let lastToolChangeTime = 0;
    let currentTool = '';
    
    // FIXED: Monitor actual tool changes via store subscription instead of hijacking console.log
    let unsubscribe: (() => void) | undefined;
    
    try {
      // Subscribe to tool changes in the store
      const store = useUnifiedCanvasStore.getState();
      unsubscribe = useUnifiedCanvasStore.subscribe(
        (state) => state.selectedTool,
        (newTool, previousTool) => {
          const now = performance.now();
          
          if (lastToolChangeTime > 0 && previousTool && previousTool !== newTool) {
            const switchTime = now - lastToolChangeTime;
            // Only record reasonable switch times (< 1 second)
            if (switchTime < 1000) {
              this.recordToolSwitchTime(switchTime);
            }
          }
          
          lastToolChangeTime = now;
          currentTool = newTool;
        }
      );
    } catch (error) {
      console.warn('Tool switching monitoring not available:', error);
    }
    
    // Store cleanup function
    if (unsubscribe) {
      this.observers.push({ disconnect: unsubscribe } as any);
    }
  }

  // Monitor pointer handler performance
  private monitorPointerHandlers(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('pointer') && entry.duration > 0) {
            this.recordPointerHandlerTime(entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Pointer handler monitoring not available:', error);
    }
  }

  // Monitor RAF violations
  private monitorRAFViolations(): void {
    setInterval(() => {
      const rafStatus = getRAFStatus();
      
      if (rafStatus.violationCount > performanceMetrics.rafViolations) {
        const newViolations = rafStatus.violationCount - performanceMetrics.rafViolations;
        performanceMetrics.rafViolations = rafStatus.violationCount;
        
        console.warn(`🚨 ${newViolations} new RAF violations detected`);
        
        if (performanceMetrics.rafViolations > emergencyThresholds.maxRAFViolations) {
          this.triggerEmergencyResponse('RAF_VIOLATIONS');
        }
      }
    }, 1000);
  }

  // Monitor memory usage
  private monitorMemoryUsage(): void {
    if (!(performance as any).memory) return;
    
    setInterval(() => {
      const memoryInfo = (performance as any).memory;
      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      
      performanceMetrics.memoryUsage.push(usedMB);
      
      // Keep only recent measurements
      if (performanceMetrics.memoryUsage.length > 60) { // 1 minute of data
        performanceMetrics.memoryUsage.shift();
      }
      
      if (usedMB > emergencyThresholds.maxMemoryMB) {
        console.warn(`🧠 High memory usage: ${usedMB.toFixed(1)}MB`);
        this.triggerEmergencyResponse('HIGH_MEMORY');
      }
    }, 1000);
  }

  // Monitor frame drops
  private monitorFrameDrops(): void {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    const checkFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      
      if (frameTime > 20) { // More than 20ms indicates dropped frames
        performanceMetrics.frameDrops++;
        
        if (performanceMetrics.frameDrops > emergencyThresholds.maxFrameDrops) {
          this.triggerEmergencyResponse('FRAME_DROPS');
        }
      }
      
      lastFrameTime = now;
      frameCount++;
      
      if (!this.emergencyMode) {
        requestAnimationFrame(checkFrame);
      }
    };
    
    requestAnimationFrame(checkFrame);
  }

  // Record metrics
  private recordCanvasInitTime(time: number): void {
    performanceMetrics.canvasInitTime.push(time);
    
    // Only log if it's unusually slow to reduce noise
    if (time > 100) {
      console.log(`📊 Canvas init: ${time.toFixed(2)}ms`);
    }
    
    if (time > emergencyThresholds.canvasInitMax) {
      console.error(`🚨 Canvas init too slow: ${time.toFixed(2)}ms (threshold: ${emergencyThresholds.canvasInitMax}ms)`);
      this.triggerEmergencyResponse('SLOW_CANVAS_INIT');
    }
    
    // Keep only recent measurements
    if (performanceMetrics.canvasInitTime.length > 10) {
      performanceMetrics.canvasInitTime.shift();
    }
  }

  private recordToolSwitchTime(time: number): void {
    performanceMetrics.toolSwitchTime.push(time);
    
    if (time > emergencyThresholds.toolSwitchMax) {
      console.warn(`🚨 Tool switch too slow: ${time.toFixed(2)}ms`);
    }
    
    // Keep only recent measurements
    if (performanceMetrics.toolSwitchTime.length > 20) {
      performanceMetrics.toolSwitchTime.shift();
    }
  }

  private recordPointerHandlerTime(time: number): void {
    performanceMetrics.pointerHandlerTime.push(time);
    
    if (time > emergencyThresholds.pointerHandlerMax) {
      console.warn(`🚨 Pointer handler too slow: ${time.toFixed(2)}ms`);
    }
    
    // Keep only recent measurements
    if (performanceMetrics.pointerHandlerTime.length > 100) {
      performanceMetrics.pointerHandlerTime.shift();
    }
  }

  // Trigger emergency response
  private triggerEmergencyResponse(reason: string): void {
    if (this.emergencyMode) return;
    
    console.error(`🛑 EMERGENCY RESPONSE TRIGGERED: ${reason}`);
    this.emergencyMode = true;
    performanceMetrics.emergencyStops++;
    
    // Emergency actions based on reason
    switch (reason) {
      case 'RAF_VIOLATIONS':
        emergencyStopRAF('Too many RAF violations');
        break;
        
      case 'HIGH_MEMORY':
        this.performMemoryCleanup();
        break;
        
      case 'SLOW_CANVAS_INIT':
        emergencyStopCanvas('Canvas initialization too slow');
        break;
        
      case 'FRAME_DROPS':
        this.optimizeForFrameRate();
        break;
    }
    
    // Disable progressive rendering
    const store = useUnifiedCanvasStore.getState();
    if (store.ui?.setProgressiveRenderingEnabled) {
      store.ui.setProgressiveRenderingEnabled(false);
    }
    
    // Set global emergency flag
    (window as any).CANVAS_EMERGENCY_MODE = true;
    
    // Auto-recovery after 10 seconds
    setTimeout(() => {
      this.recoverFromEmergency();
    }, 10000);
  }

  // Emergency memory cleanup
  private performMemoryCleanup(): void {
    console.log('🧹 Performing emergency memory cleanup');
    
    // Clear performance metrics
    performanceMetrics.canvasInitTime = [];
    performanceMetrics.toolSwitchTime = [];
    performanceMetrics.pointerHandlerTime = [];
    performanceMetrics.memoryUsage = [];
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }

  // Optimize for frame rate
  private optimizeForFrameRate(): void {
    console.log('🎯 Optimizing for frame rate');
    
    // Reduce animation quality
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
    });
    
    // Disable non-essential features
    (window as any).CANVAS_HIGH_PERFORMANCE_MODE = true;
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      if (now - performanceMetrics.lastCleanup > 60000) { // Every minute
        this.performPeriodicCleanup();
        performanceMetrics.lastCleanup = now;
      }
    }, 60000);
  }

  // Periodic cleanup
  private performPeriodicCleanup(): void {
    // Clean old metrics
    if (performanceMetrics.canvasInitTime.length > 5) {
      performanceMetrics.canvasInitTime = performanceMetrics.canvasInitTime.slice(-5);
    }
    
    if (performanceMetrics.toolSwitchTime.length > 10) {
      performanceMetrics.toolSwitchTime = performanceMetrics.toolSwitchTime.slice(-10);
    }
    
    if (performanceMetrics.pointerHandlerTime.length > 50) {
      performanceMetrics.pointerHandlerTime = performanceMetrics.pointerHandlerTime.slice(-50);
    }
    
    // Reset frame drops counter if performance is good
    const avgRAFTime = this.getAverageRAFTime();
    if (avgRAFTime < 16) {
      performanceMetrics.frameDrops = Math.max(0, performanceMetrics.frameDrops - 5);
    }
  }

  // Recover from emergency mode
  private recoverFromEmergency(): void {
    if (!this.emergencyMode) return;
    
    console.log('🔧 Recovering from emergency mode');
    this.emergencyMode = false;
    (window as any).CANVAS_EMERGENCY_MODE = false;
    
    // Re-enable features gradually
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      if (store.ui?.setProgressiveRenderingEnabled) {
        store.ui.setProgressiveRenderingEnabled(true);
      }
    }, 5000);
  }

  // Get performance statistics
  public getPerformanceStats() {
    return {
      metrics: performanceMetrics,
      thresholds: emergencyThresholds,
      isEmergencyMode: this.emergencyMode,
      isMonitoring: this.isMonitoring,
      averages: {
        canvasInit: this.getAverageCanvasInitTime(),
        toolSwitch: this.getAverageToolSwitchTime(),
        pointerHandler: this.getAveragePointerHandlerTime(),
        memory: this.getAverageMemoryUsage(),
        rafTime: this.getAverageRAFTime(),
      }
    };
  }

  // Calculate averages
  private getAverageCanvasInitTime(): number {
    if (performanceMetrics.canvasInitTime.length === 0) return 0;
    return performanceMetrics.canvasInitTime.reduce((a, b) => a + b, 0) / performanceMetrics.canvasInitTime.length;
  }

  private getAverageToolSwitchTime(): number {
    if (performanceMetrics.toolSwitchTime.length === 0) return 0;
    return performanceMetrics.toolSwitchTime.reduce((a, b) => a + b, 0) / performanceMetrics.toolSwitchTime.length;
  }

  private getAveragePointerHandlerTime(): number {
    if (performanceMetrics.pointerHandlerTime.length === 0) return 0;
    return performanceMetrics.pointerHandlerTime.reduce((a, b) => a + b, 0) / performanceMetrics.pointerHandlerTime.length;
  }

  private getAverageMemoryUsage(): number {
    if (performanceMetrics.memoryUsage.length === 0) return 0;
    return performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / performanceMetrics.memoryUsage.length;
  }

  private getAverageRAFTime(): number {
    const rafStatus = getRAFStatus();
    return rafStatus.frameBudget;
  }

  // Stop monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global instance
export const emergencyPerformanceMonitor = EmergencyPerformanceMonitor.getInstance();

// Convenience functions
export const startEmergencyMonitoring = (): void => {
  emergencyPerformanceMonitor.startMonitoring();
};

export const getEmergencyStats = () => {
  return emergencyPerformanceMonitor.getPerformanceStats();
};

export const stopEmergencyMonitoring = (): void => {
  emergencyPerformanceMonitor.stopMonitoring();
};
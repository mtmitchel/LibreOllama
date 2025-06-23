// src/utils/canvas/RenderOptimizer.ts
/**
 * Advanced Render Performance Optimizer for LibreOllama Canvas
 * Implements adaptive frame rate, render scheduling, and batch operations
 * Part of Phase 4 Performance Optimizations
 */

import { PerformanceMonitor, recordMetric } from '../performance';
import type { CanvasElement } from '../../stores/types';

export interface RenderTask {
  id: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  operation: () => Promise<void> | void;
  elementIds?: string[];
  estimatedDuration: number; // ms
  deadline?: number; // timestamp
  layer?: 'background' | 'main' | 'connector' | 'ui';
}

export interface RenderBatch {
  id: string;
  tasks: RenderTask[];
  totalEstimatedDuration: number;
  priority: RenderTask['priority'];
  createdAt: number;
}

export interface DeviceCapabilities {
  maxFPS: number;
  targetFPS: number;
  memoryMB: number;
  isLowEnd: boolean;
  concurrentOperations: number;
  supports: {
    offscreenCanvas: boolean;
    webGL: boolean;
    webGL2: boolean;
    transferableObjects: boolean;
  };
}

export interface RenderMetrics {
  averageFrameTime: number;
  droppedFrames: number;
  batchesProcessed: number;
  tasksQueued: number;
  adaptiveAdjustments: number;
  renderSchedulingOverhead: number;
}

export interface RenderConfig {
  targetFPS: number;
  adaptiveFPS: boolean;
  maxConcurrentTasks: number;
  frameTimeBudgetMs: number;
  batchingEnabled: boolean;
  priorityScheduling: boolean;
  adaptiveQuality: boolean;
  lowEndOptimizations: boolean;
}

class RenderOptimizerImpl {
  private taskQueue: RenderTask[] = [];
  private batchQueue: RenderBatch[] = [];
  private isProcessing = false;
  private frameId: number | null = null;
  private frameStartTime = 0;
  private frameEndTime = 0;
  private frameCount = 0;
  private lastFrameTime = 0;
  private droppedFrames = 0;
  
  private deviceCapabilities: DeviceCapabilities;
  private config: RenderConfig;
  private metrics: RenderMetrics;
  private frameTimeHistory: number[] = [];
  private maxFrameHistory = 60; // Track last 60 frames
  
  private renderLayers = new Map<string, Set<RenderTask>>();
  private microtaskQueue: Array<() => void> = [];

  constructor(config: Partial<RenderConfig> = {}) {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    
    this.config = {
      targetFPS: this.deviceCapabilities.targetFPS,
      adaptiveFPS: true,
      maxConcurrentTasks: this.deviceCapabilities.concurrentOperations,
      frameTimeBudgetMs: 1000 / this.deviceCapabilities.targetFPS * 0.8, // 80% of frame time
      batchingEnabled: true,
      priorityScheduling: true,
      adaptiveQuality: !this.deviceCapabilities.isLowEnd,
      lowEndOptimizations: this.deviceCapabilities.isLowEnd,
      ...config
    };

    this.metrics = {
      averageFrameTime: 0,
      droppedFrames: 0,
      batchesProcessed: 0,
      tasksQueued: 0,
      adaptiveAdjustments: 0,
      renderSchedulingOverhead: 0
    };

    this.initializeRenderLayers();
    this.startRenderLoop();
  }

  /**
   * Detect device capabilities for adaptive optimization
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gl2 = canvas.getContext('webgl2');
    
    // Estimate device performance based on various factors
    const memoryInfo = (performance as any).memory;
    const memoryMB = memoryInfo ? memoryInfo.jsHeapSizeLimit / 1024 / 1024 : 100;
    
    // Detect if device is likely low-end
    const isLowEnd = memoryMB < 200 || 
                     navigator.hardwareConcurrency <= 2 ||
                     !gl ||
                     /Android.*Chrome\/[0-5]/.test(navigator.userAgent);

    return {
      maxFPS: isLowEnd ? 30 : 60,
      targetFPS: isLowEnd ? 24 : 60,
      memoryMB,
      isLowEnd,
      concurrentOperations: Math.max(1, (navigator.hardwareConcurrency || 2) - 1),
      supports: {
        offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
        webGL: !!gl,
        webGL2: !!gl2,
        transferableObjects: typeof ArrayBuffer !== 'undefined' && 'transfer' in ArrayBuffer.prototype
      }
    };
  }

  /**
   * Initialize render layer organization
   */
  private initializeRenderLayers(): void {
    const layers = ['background', 'main', 'connector', 'ui'];
    layers.forEach(layer => {
      this.renderLayers.set(layer, new Set());
    });
  }

  /**
   * Schedule a render task with priority and batching
   */
  scheduleRenderTask(task: RenderTask): void {
    const endTiming = PerformanceMonitor.startTiming('scheduleRenderTask');
    
    try {
      // Add layer information for organization
      if (task.layer) {
        const layerTasks = this.renderLayers.get(task.layer);
        if (layerTasks) {
          layerTasks.add(task);
        }
      }

      if (this.config.batchingEnabled && this.shouldBatchTask(task)) {
        this.addToBatch(task);
      } else {
        this.taskQueue.push(task);
        this.sortTasksByPriority();
      }

      this.metrics.tasksQueued++;
      
      recordMetric('renderTaskScheduled', 1, 'render', {
        priority: task.priority,
        layer: task.layer || 'unknown',
        estimatedDuration: task.estimatedDuration
      });
    } finally {
      endTiming();
    }
  }

  /**
   * Schedule a batch of related render operations
   */
  scheduleBatchRender(tasks: RenderTask[], options: { 
    priority?: RenderTask['priority'],
    deadline?: number 
  } = {}): void {
    const batch: RenderBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tasks,
      totalEstimatedDuration: tasks.reduce((sum, task) => sum + task.estimatedDuration, 0),
      priority: options.priority || 'normal',
      createdAt: performance.now()
    };

    // Apply deadline to all tasks if specified
    if (options.deadline !== undefined) {
      const deadline = options.deadline;
      tasks.forEach(task => {
        task.deadline = deadline;
      });
    }

    this.batchQueue.push(batch);
    this.sortBatchesByPriority();

    recordMetric('renderBatchScheduled', tasks.length, 'render', {
      priority: batch.priority,
      estimatedDuration: batch.totalEstimatedDuration
    });
  }

  /**
   * Main render loop with adaptive frame rate
   */
  private startRenderLoop(): void {
    const renderFrame = (timestamp: number) => {
      this.frameStartTime = timestamp;
      
      // Calculate frame time and adjust if needed
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        this.updateFrameTimeHistory(frameTime);
        
        if (this.config.adaptiveFPS) {
          this.adaptFrameRate(frameTime);
        }
      }

      // Process render tasks within frame budget
      this.processRenderTasks();
      
      // Process microtasks for small operations
      this.processMicrotasks();

      this.frameEndTime = performance.now();
      this.lastFrameTime = timestamp;
      this.frameCount++;

      // Schedule next frame
      this.frameId = requestAnimationFrame(renderFrame);
      
      // Record frame metrics
      const actualFrameTime = this.frameEndTime - this.frameStartTime;
      this.updateMetrics(actualFrameTime);
    };

    this.frameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Process render tasks within frame time budget
   */
  private processRenderTasks(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const startTime = performance.now();
    let timeSpent = 0;

    try {
      // Process batches first (higher efficiency)
      while (this.batchQueue.length > 0 && timeSpent < this.config.frameTimeBudgetMs * 0.6) {
        const batch = this.batchQueue.shift();
        if (batch) {
          timeSpent += this.processBatch(batch);
        }
      }

      // Process individual tasks
      while (this.taskQueue.length > 0 && timeSpent < this.config.frameTimeBudgetMs) {
        const task = this.taskQueue.shift();
        if (task) {
          timeSpent += this.processTask(task);
        }
      }
    } catch (error) {
      console.error('Error processing render tasks:', error);
    } finally {
      this.isProcessing = false;
      this.metrics.renderSchedulingOverhead = performance.now() - startTime;
    }
  }

  /**
   * Process a single render task
   */
  private processTask(task: RenderTask): number {
    const startTime = performance.now();
    
    try {
      // Check if task has expired deadline
      if (task.deadline && performance.now() > task.deadline) {
        recordMetric('renderTaskExpired', 1, 'render', { priority: task.priority });
        return 0;
      }

      // Execute the task
      const result = task.operation();
      
      // Handle async operations
      if (result && typeof result.then === 'function') {
        result.catch(error => {
          console.error('Async render task failed:', error);
        });
      }

      // Clean up layer tracking
      if (task.layer) {
        const layerTasks = this.renderLayers.get(task.layer);
        if (layerTasks) {
          layerTasks.delete(task);
        }
      }

      const duration = performance.now() - startTime;
      recordMetric('renderTaskCompleted', duration, 'render', {
        priority: task.priority,
        layer: task.layer || 'unknown'
      });

      return duration;
    } catch (error) {
      console.error('Render task failed:', error);
      recordMetric('renderTaskFailed', 1, 'render', { priority: task.priority });
      return performance.now() - startTime;
    }
  }

  /**
   * Process a batch of render tasks
   */
  private processBatch(batch: RenderBatch): number {
    const startTime = performance.now();
    
    try {
      // Execute all tasks in the batch
      batch.tasks.forEach(task => {
        try {
          const result = task.operation();
          if (result && typeof result.then === 'function') {
            result.catch(error => {
              console.error('Batch task failed:', error);
            });
          }
        } catch (error) {
          console.error('Batch task failed:', error);
        }
      });

      this.metrics.batchesProcessed++;
      
      const duration = performance.now() - startTime;
      recordMetric('renderBatchCompleted', duration, 'render', {
        priority: batch.priority,
        taskCount: batch.tasks.length
      });

      return duration;
    } catch (error) {
      console.error('Batch processing failed:', error);
      return performance.now() - startTime;
    }
  }

  /**
   * Process microtasks for small operations
   */
  private processMicrotasks(): void {
    const maxMicrotasks = 10;
    let processed = 0;

    while (this.microtaskQueue.length > 0 && processed < maxMicrotasks) {
      const task = this.microtaskQueue.shift();
      if (task) {
        try {
          task();
          processed++;
        } catch (error) {
          console.error('Microtask failed:', error);
        }
      }
    }
  }

  /**
   * Determine if a task should be batched
   */
  private shouldBatchTask(task: RenderTask): boolean {
    // Don't batch critical tasks
    if (task.priority === 'critical') return false;
    
    // Don't batch tasks with deadlines
    if (task.deadline) return false;
    
    // Batch tasks from the same layer
    return !!task.layer;
  }

  /**
   * Add task to appropriate batch
   */
  private addToBatch(task: RenderTask): void {
    // Find existing batch for the same layer and priority
    let targetBatch = this.batchQueue.find(batch => 
      batch.priority === task.priority &&
      batch.tasks.some(t => t.layer === task.layer)
    );

    if (!targetBatch) {
      // Create new batch
      targetBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tasks: [],
        totalEstimatedDuration: 0,
        priority: task.priority,
        createdAt: performance.now()
      };
      this.batchQueue.push(targetBatch);
    }

    targetBatch.tasks.push(task);
    targetBatch.totalEstimatedDuration += task.estimatedDuration;
  }

  /**
   * Sort tasks by priority
   */
  private sortTasksByPriority(): void {
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Sort batches by priority
   */
  private sortBatchesByPriority(): void {
    this.batchQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Update frame time history for adaptive adjustments
   */
  private updateFrameTimeHistory(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxFrameHistory) {
      this.frameTimeHistory.shift();
    }
  }

  /**
   * Adapt frame rate based on performance
   */
  private adaptFrameRate(frameTime: number): void {
    const targetFrameTime = 1000 / this.config.targetFPS;
    
    // If consistently dropping frames, reduce target FPS
    if (frameTime > targetFrameTime * 1.5) {
      this.droppedFrames++;
      
      if (this.droppedFrames > 10) {
        this.config.targetFPS = Math.max(20, this.config.targetFPS - 5);
        this.config.frameTimeBudgetMs = 1000 / this.config.targetFPS * 0.8;
        this.droppedFrames = 0;
        this.metrics.adaptiveAdjustments++;
        
        recordMetric('adaptiveFPSReduced', this.config.targetFPS, 'render');
      }
    } else if (frameTime < targetFrameTime * 0.8) {
      // If consistently performing well, try to increase FPS
      if (this.droppedFrames === 0 && this.config.targetFPS < this.deviceCapabilities.maxFPS) {
        this.config.targetFPS = Math.min(this.deviceCapabilities.maxFPS, this.config.targetFPS + 5);
        this.config.frameTimeBudgetMs = 1000 / this.config.targetFPS * 0.8;
        this.metrics.adaptiveAdjustments++;
        
        recordMetric('adaptiveFPSIncreased', this.config.targetFPS, 'render');
      }
    }
  }

  /**
   * Update render metrics
   */
  private updateMetrics(frameTime: number): void {
    // Update average frame time
    this.metrics.averageFrameTime = 
      (this.metrics.averageFrameTime * (this.frameCount - 1) + frameTime) / this.frameCount;
    
    // Record frame metrics periodically
    if (this.frameCount % 60 === 0) {
      recordMetric('averageFrameTime', this.metrics.averageFrameTime, 'render');
      recordMetric('droppedFrames', this.droppedFrames, 'render');
    }
  }

  /**
   * Schedule a microtask for small operations
   */
  scheduleMicrotask(operation: () => void): void {
    this.microtaskQueue.push(operation);
  }

  /**
   * Estimate task duration based on element complexity
   */
  estimateTaskDuration(elements: CanvasElement[]): number {
    let duration = 0;
    
    elements.forEach(element => {
      switch (element.type) {
        case 'text':
        case 'rich-text':
          duration += 2 + (element.segments?.length || 0) * 0.5;
          break;
        case 'table':
          duration += 5 + ((element.rows || 1) * (element.cols || 1)) * 0.2;
          break;
        case 'image':
          duration += 8;
          break;
        case 'connector':
          duration += 3 + (element.pathPoints?.length || 0) * 0.1;
          break;
        case 'pen':
          duration += 1 + (element.points?.length || 0) * 0.05;
          break;
        default:
          duration += 1;
      }
    });

    return Math.max(1, duration);
  }

  /**
   * Get render metrics
   */
  getMetrics(): RenderMetrics {
    return { ...this.metrics };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Update render configuration
   */
  updateConfig(newConfig: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.targetFPS) {
      this.config.frameTimeBudgetMs = 1000 / newConfig.targetFPS * 0.8;
    }
  }

  /**
   * Clear all queued tasks
   */
  clearTasks(): void {
    this.taskQueue = [];
    this.batchQueue = [];
    this.microtaskQueue = [];
    
    // Clear layer tracking
    this.renderLayers.forEach(layerTasks => layerTasks.clear());
  }

  /**
   * Stop the render loop
   */
  destroy(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.clearTasks();
  }
}

// Export singleton instance
export const RenderOptimizer = new RenderOptimizerImpl();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    RenderOptimizer.destroy();
  });
}
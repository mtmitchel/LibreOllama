// src/utils/canvas/EventOptimizer.ts
/**
 * Advanced Event Handling Optimizer for LibreOllama Canvas
 * Implements event delegation, throttling, and gesture recognition
 * Part of Phase 4 Performance Optimizations
 */

import { PerformanceMonitor, recordMetric } from '../performance';

export interface EventTask {
  id: string;
  type: string;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  handler: (event: Event) => void;
  options?: AddEventListenerOptions;
  throttleMs?: number;
  debounceMs?: number;
}

export interface GestureConfig {
  enablePan: boolean;
  enableZoom: boolean;
  enableRotate: boolean;
  enableTap: boolean;
  enableDoubleTap: boolean;
  enableLongPress: boolean;
  panThreshold: number;
  zoomThreshold: number;
  rotateThreshold: number;
  tapTimeout: number;
  doubleTapTimeout: number;
  longPressTimeout: number;
}

export interface EventMetrics {
  eventsProcessed: number;
  eventProcessingTime: number;
  throttledEvents: number;
  debouncedEvents: number;
  gesturesRecognized: number;
  eventDelegationHits: number;
  conflictResolutions: number;
}

export interface TouchGesture {
  type: 'pan' | 'zoom' | 'rotate' | 'tap' | 'doubletap' | 'longpress';
  startEvent: TouchEvent | MouseEvent;
  currentEvent: TouchEvent | MouseEvent;
  deltaX: number;
  deltaY: number;
  scale: number;
  rotation: number;
  velocity: { x: number; y: number };
  duration: number;
  isActive: boolean;
}

class EventOptimizerImpl {
  private eventQueue: Map<string, EventTask[]> = new Map();
  private throttleTimers = new Map<string, number>();
  private debounceTimers = new Map<string, number>();
  private lastEventTimes = new Map<string, number>();
  
  private gestureState = new Map<number, TouchGesture>();
  private gestureConfig: GestureConfig;
  private metrics: EventMetrics;
  
  private delegatedEvents = new Map<string, Set<EventTask>>();
  private rootElement: HTMLElement | null = null;
  
  // Touch/pointer tracking
  private activeTouches = new Map<number, Touch>();
  private gestureStartTime = 0;
  private lastTapTime = 0;
  private tapCount = 0;

  constructor(rootElement?: HTMLElement, config: Partial<GestureConfig> = {}) {
    this.rootElement = rootElement || document.body;
    
    this.gestureConfig = {
      enablePan: true,
      enableZoom: true,
      enableRotate: true,
      enableTap: true,
      enableDoubleTap: true,
      enableLongPress: true,
      panThreshold: 10,
      zoomThreshold: 0.1,
      rotateThreshold: 5,
      tapTimeout: 300,
      doubleTapTimeout: 500,
      longPressTimeout: 1000,
      ...config
    };

    this.metrics = {
      eventsProcessed: 0,
      eventProcessingTime: 0,
      throttledEvents: 0,
      debouncedEvents: 0,
      gesturesRecognized: 0,
      eventDelegationHits: 0,
      conflictResolutions: 0
    };

    this.initializeEventDelegation();
    this.initializeGestureHandling();
  }

  /**
   * Initialize event delegation system
   */
  private initializeEventDelegation(): void {
    if (!this.rootElement) return;

    const delegatedEventTypes = [
      'click', 'mousedown', 'mouseup', 'mousemove',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'wheel', 'keydown', 'keyup'
    ];

    delegatedEventTypes.forEach(eventType => {
      this.delegatedEvents.set(eventType, new Set());
      
      this.rootElement!.addEventListener(eventType, (event) => {
        this.handleDelegatedEvent(eventType, event);
      }, { passive: false, capture: true });
    });
  }

  /**
   * Initialize gesture recognition
   */
  private initializeGestureHandling(): void {
    if (!this.rootElement) return;

    // Prevent default touch behaviors for better gesture control
    this.rootElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.rootElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.rootElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.rootElement.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Mouse events for desktop gesture simulation
    this.rootElement.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false });
    this.rootElement.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: false });
    this.rootElement.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: false });
  }

  /**
   * Register an optimized event handler
   */
  registerEventHandler(task: EventTask): () => void {
    const eventType = task.type;
    
    // Add to delegation system
    if (this.delegatedEvents.has(eventType)) {
      this.delegatedEvents.get(eventType)!.add(task);
    } else {
      // Initialize new event type
      this.delegatedEvents.set(eventType, new Set([task]));
    }

    // Add to processing queue
    if (!this.eventQueue.has(eventType)) {
      this.eventQueue.set(eventType, []);
    }
    this.eventQueue.get(eventType)!.push(task);

    recordMetric('eventHandlerRegistered', 1, 'interaction', { 
      eventType, 
      priority: task.priority 
    });

    // Return unregister function
    return () => {
      this.unregisterEventHandler(task);
    };
  }

  /**
   * Unregister an event handler
   */
  private unregisterEventHandler(task: EventTask): void {
    const eventType = task.type;
    
    // Remove from delegation
    this.delegatedEvents.get(eventType)?.delete(task);
    
    // Remove from queue
    const queue = this.eventQueue.get(eventType);
    if (queue) {
      const index = queue.indexOf(task);
      if (index > -1) {
        queue.splice(index, 1);
      }
    }

    recordMetric('eventHandlerUnregistered', 1, 'interaction', { eventType });
  }

  /**
   * Handle delegated events with optimization
   */
  private handleDelegatedEvent(eventType: string, event: Event): void {
    const endTiming = PerformanceMonitor.startTiming('handleDelegatedEvent');
    
    try {
      const tasks = this.delegatedEvents.get(eventType);
      if (!tasks || tasks.size === 0) return;

      this.metrics.eventDelegationHits++;

      // Process tasks by priority
      const taskArray = Array.from(tasks).sort((a, b) => {
        const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      for (const task of taskArray) {
        this.processEventTask(task, event);
      }

      this.metrics.eventsProcessed++;
    } finally {
      endTiming();
      this.metrics.eventProcessingTime += performance.now() - this.metrics.eventProcessingTime;
    }
  }

  /**
   * Process individual event task with throttling/debouncing
   */
  private processEventTask(task: EventTask, event: Event): void {
    const taskId = task.id;
    const now = performance.now();

    // Handle throttling
    if (task.throttleMs) {
      const lastTime = this.lastEventTimes.get(taskId) || 0;
      if (now - lastTime < task.throttleMs) {
        this.metrics.throttledEvents++;
        return;
      }
      this.lastEventTimes.set(taskId, now);
    }

    // Handle debouncing
    if (task.debounceMs) {
      const existingTimer = this.debounceTimers.get(taskId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.metrics.debouncedEvents++;
      }

      const timer = window.setTimeout(() => {
        this.executeEventHandler(task, event);
        this.debounceTimers.delete(taskId);
      }, task.debounceMs);

      this.debounceTimers.set(taskId, timer);
      return;
    }

    // Execute immediately
    this.executeEventHandler(task, event);
  }

  /**
   * Execute event handler with error handling
   */
  private executeEventHandler(task: EventTask, event: Event): void {
    try {
      task.handler(event);
    } catch (error) {
      console.error(`Event handler error for ${task.type}:`, error);
      recordMetric('eventHandlerError', 1, 'interaction', { 
        eventType: task.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Touch event handlers for gesture recognition
   */
  private handleTouchStart(event: TouchEvent): void {
    this.gestureStartTime = performance.now();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch) {
        this.activeTouches.set(touch.identifier, touch);
      }
      
      // Initialize gesture tracking
      if (this.activeTouches.size === 1) {
        this.initializeGesture('pan', event);
      } else if (this.activeTouches.size === 2) {
        this.initializeGesture('zoom', event);
      }
    }

    // Handle tap detection
    if (this.gestureConfig.enableTap && this.activeTouches.size === 1) {
      this.handleTapStart(event);
    }

    recordMetric('touchStart', this.activeTouches.size, 'interaction');
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.activeTouches.size === 0) return;

    // Prevent default to avoid scrolling during gestures
    event.preventDefault();

    this.updateActiveGestures(event);
    
    recordMetric('touchMove', 1, 'interaction');
  }

  private handleTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch) {
        this.activeTouches.delete(touch.identifier);
      }
    }

    // Finalize gestures
    this.finalizeGestures(event);

    // Handle tap completion
    if (this.activeTouches.size === 0) {
      this.handleTapEnd(event);
    }

    recordMetric('touchEnd', this.activeTouches.size, 'interaction');
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.activeTouches.clear();
    this.gestureState.clear();
    recordMetric('touchCancel', 1, 'interaction');
  }

  /**
   * Mouse event handlers for desktop gesture simulation
   */
  private handleMouseDown(event: MouseEvent): void {
    // Simulate touch with mouse
    this.gestureStartTime = performance.now();
    this.initializeGesture('pan', event);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (event.buttons === 0) return; // No button pressed
    this.updateActiveGestures(event);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.finalizeGestures(event);
  }

  /**
   * Initialize gesture tracking
   */
  private initializeGesture(type: TouchGesture['type'], event: TouchEvent | MouseEvent): void {
    const gesture: TouchGesture = {
      type,
      startEvent: event,
      currentEvent: event,
      deltaX: 0,
      deltaY: 0,
      scale: 1,
      rotation: 0,
      velocity: { x: 0, y: 0 },
      duration: 0,
      isActive: true
    };

    this.gestureState.set(0, gesture); // Use 0 as default ID for mouse/single touch
  }

  /**
   * Update active gestures
   */
  private updateActiveGestures(event: TouchEvent | MouseEvent): void {
    const gesture = this.gestureState.get(0);
    if (!gesture) return;

    const currentPos = this.getEventPosition(event);
    const startPos = this.getEventPosition(gesture.startEvent);

    gesture.currentEvent = event;
    gesture.deltaX = currentPos.x - startPos.x;
    gesture.deltaY = currentPos.y - startPos.y;
    gesture.duration = performance.now() - this.gestureStartTime;

    // Calculate velocity
    const timeDelta = gesture.duration || 1;
    gesture.velocity.x = gesture.deltaX / timeDelta * 1000; // pixels per second
    gesture.velocity.y = gesture.deltaY / timeDelta * 1000;

    // Handle multi-touch for zoom/rotate
    if (event instanceof TouchEvent && event.touches.length === 2) {
      this.updateMultiTouchGesture(gesture, event);
    }

    // Emit gesture events
    this.emitGestureEvent(gesture);
  }

  /**
   * Update multi-touch gesture (zoom/rotate)
   */
  private updateMultiTouchGesture(gesture: TouchGesture, event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    if (!touch1 || !touch2) return;
    
    const currentDistance = this.getDistance(touch1, touch2);
    const currentAngle = this.getAngle(touch1, touch2);

    // Calculate initial distance and angle if not set
    if (gesture.type === 'pan') {
      gesture.type = 'zoom'; // Upgrade to zoom gesture
      gesture.scale = 1;
      gesture.rotation = 0;
    }

    // Update scale (zoom)
    if (this.gestureConfig.enableZoom) {
      const startEvent = gesture.startEvent as TouchEvent;
      if (startEvent.touches && startEvent.touches.length === 2) {
        const startTouch1 = startEvent.touches[0];
        const startTouch2 = startEvent.touches[1];
        if (startTouch1 && startTouch2) {
          const startDistance = this.getDistance(startTouch1, startTouch2);
          gesture.scale = currentDistance / startDistance;
        }
      }
    }

    // Update rotation
    if (this.gestureConfig.enableRotate) {
      const startEvent = gesture.startEvent as TouchEvent;
      if (startEvent.touches && startEvent.touches.length === 2) {
        const startTouch1 = startEvent.touches[0];
        const startTouch2 = startEvent.touches[1];
        if (startTouch1 && startTouch2) {
          const startAngle = this.getAngle(startTouch1, startTouch2);
          gesture.rotation = currentAngle - startAngle;
        }
      }
    }
  }

  /**
   * Finalize and emit completed gestures
   */
  private finalizeGestures(event: TouchEvent | MouseEvent): void {
    this.gestureState.forEach((gesture, id) => {
      gesture.isActive = false;
      this.emitGestureEvent(gesture);
      this.gestureState.delete(id);
    });
  }

  /**
   * Handle tap gesture detection
   */
  private handleTapStart(event: TouchEvent | MouseEvent): void {
    const now = performance.now();
    
    // Check for double tap
    if (this.gestureConfig.enableDoubleTap && 
        now - this.lastTapTime < this.gestureConfig.doubleTapTimeout) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }

    // Set long press timer
    if (this.gestureConfig.enableLongPress) {
      setTimeout(() => {
        if (this.activeTouches.size > 0) {
          this.emitCustomEvent('longpress', event);
          this.metrics.gesturesRecognized++;
        }
      }, this.gestureConfig.longPressTimeout);
    }
  }

  private handleTapEnd(event: TouchEvent | MouseEvent): void {
    const duration = performance.now() - this.gestureStartTime;
    
    if (duration < this.gestureConfig.tapTimeout) {
      if (this.tapCount === 1) {
        setTimeout(() => {
          if (this.tapCount === 1) {
            this.emitCustomEvent('tap', event);
            this.metrics.gesturesRecognized++;
          }
          this.tapCount = 0;
        }, this.gestureConfig.doubleTapTimeout);
      } else if (this.tapCount === 2) {
        this.emitCustomEvent('doubletap', event);
        this.metrics.gesturesRecognized++;
        this.tapCount = 0;
      }
    }

    this.lastTapTime = performance.now();
  }

  /**
   * Emit gesture events
   */
  private emitGestureEvent(gesture: TouchGesture): void {
    // Check thresholds
    if (gesture.type === 'pan' && 
        Math.abs(gesture.deltaX) < this.gestureConfig.panThreshold &&
        Math.abs(gesture.deltaY) < this.gestureConfig.panThreshold) {
      return;
    }

    if (gesture.type === 'zoom' && 
        Math.abs(gesture.scale - 1) < this.gestureConfig.zoomThreshold) {
      return;
    }

    if (gesture.type === 'rotate' && 
        Math.abs(gesture.rotation) < this.gestureConfig.rotateThreshold) {
      return;
    }

    this.emitCustomEvent(gesture.type, gesture.currentEvent, gesture);
    this.metrics.gesturesRecognized++;
  }

  /**
   * Emit custom gesture event
   */
  private emitCustomEvent(type: string, originalEvent: Event, gestureData?: Partial<TouchGesture>): void {
    const customEvent = new CustomEvent(`gesture${type}`, {
      detail: {
        originalEvent,
        ...gestureData,
        timestamp: performance.now()
      },
      bubbles: true,
      cancelable: true
    });

    if (originalEvent.target) {
      originalEvent.target.dispatchEvent(customEvent);
    }

    recordMetric('gestureEmitted', 1, 'interaction', { gestureType: type });
  }

  /**
   * Utility functions
   */
  private getEventPosition(event: TouchEvent | MouseEvent): { x: number; y: number } {
    if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      if (touch) {
        return { x: touch.clientX, y: touch.clientY };
      }
    } else if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }
    return { x: 0, y: 0 };
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getAngle(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  /**
   * Resolve event conflicts (prevent event bubbling issues)
   */
  resolveEventConflicts(event: Event): boolean {
    // Basic conflict resolution - prevent default for gestures
    if (event.type.startsWith('touch') && this.activeTouches.size > 1) {
      event.preventDefault();
      this.metrics.conflictResolutions++;
      return true;
    }

    return false;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * Update gesture configuration
   */
  updateGestureConfig(config: Partial<GestureConfig>): void {
    this.gestureConfig = { ...this.gestureConfig, ...config };
  }

  /**
   * Clear all event handlers and timers
   */
  destroy(): void {
    // Clear timers
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    
    // Clear maps
    this.eventQueue.clear();
    this.delegatedEvents.clear();
    this.throttleTimers.clear();
    this.debounceTimers.clear();
    this.lastEventTimes.clear();
    this.gestureState.clear();
    this.activeTouches.clear();
  }
}

// Export singleton instance
export const EventOptimizer = new EventOptimizerImpl();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    EventOptimizer.destroy();
  });
}
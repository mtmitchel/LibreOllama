/**
 * Enhanced event handling for PixiJS v8 with React integration
 * Provides unified event management with proper pointer event support
 */

import { FederatedEvent, FederatedPointerEvent } from 'pixi.js';
import { CoordinateSystem, Point } from './canvas-coordinates';

export interface CanvasEventData {
  worldPosition: Point;
  screenPosition: Point;
  originalEvent: PointerEvent | MouseEvent | TouchEvent;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  button: number;
  buttons: number;
  pressure: number;
  isPrimary: boolean;
  pointerType: string;
}

export interface CanvasEventHandlers {
  onElementPointerDown?: (elementId: string, event: CanvasEventData) => void;
  onElementPointerMove?: (elementId: string, event: CanvasEventData) => void;
  onElementPointerUp?: (elementId: string, event: CanvasEventData) => void;
  onElementPointerTap?: (elementId: string, event: CanvasEventData) => void;
  onCanvasPointerDown?: (event: CanvasEventData) => void;
  onCanvasPointerMove?: (event: CanvasEventData) => void;
  onCanvasPointerUp?: (event: CanvasEventData) => void;
  onCanvasPointerTap?: (event: CanvasEventData) => void;
  onWheel?: (event: WheelEvent, worldPosition: Point) => void;
}

/**
 * Event manager that provides unified event handling across devices
 */
export class CanvasEventManager {
  private coordinateSystem: CoordinateSystem | null = null;
  private handlers: CanvasEventHandlers = {};
  private globalListeners: Map<string, (e: Event) => void> = new Map();
  private isDestroyed = false;

  constructor(
    private containerRef: React.RefObject<HTMLElement>,
    handlers: CanvasEventHandlers = {}
  ) {
    this.handlers = handlers;
    this.setupGlobalListeners();
  }

  updateCoordinateSystem(coordinateSystem: CoordinateSystem): void {
    this.coordinateSystem = coordinateSystem;
  }

  updateHandlers(handlers: Partial<CanvasEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Convert PixiJS federated event to our unified event data
   */
  private convertPixiEvent(pixiEvent: FederatedEvent): CanvasEventData | null {
    if (!this.coordinateSystem) return null;

    const pointerEvent = pixiEvent as FederatedPointerEvent;
    const originalEvent = pointerEvent.nativeEvent;
    
    // Get world position from PixiJS global coordinates
    const worldPosition = this.coordinateSystem.pixiToWorld({
      x: pointerEvent.global.x,
      y: pointerEvent.global.y
    });

    // Calculate screen position
    const screenPosition = this.coordinateSystem.worldToScreen(worldPosition);

    return {
      worldPosition,
      screenPosition,
      originalEvent,
      shiftKey: originalEvent.shiftKey || false,
      ctrlKey: originalEvent.ctrlKey || false,
      altKey: originalEvent.altKey || false,
      metaKey: originalEvent.metaKey || false,
      button: pointerEvent.button,
      buttons: pointerEvent.buttons,
      pressure: pointerEvent.pressure || 0,
      isPrimary: pointerEvent.isPrimary,
      pointerType: pointerEvent.pointerType
    };
  }

  /**
   * Convert DOM event to our unified event data
   */
  private convertDomEvent(domEvent: PointerEvent | MouseEvent | TouchEvent): CanvasEventData | null {
    if (!this.coordinateSystem) return null;

    const screenPosition = { x: domEvent.clientX, y: domEvent.clientY };
    const worldPosition = this.coordinateSystem.screenToWorld(screenPosition);

    return {
      worldPosition,
      screenPosition,
      originalEvent: domEvent,
      shiftKey: domEvent.shiftKey || false,
      ctrlKey: domEvent.ctrlKey || false,
      altKey: domEvent.altKey || false,
      metaKey: domEvent.metaKey || false,
      button: 'button' in domEvent ? domEvent.button : 0,
      buttons: 'buttons' in domEvent ? domEvent.buttons : 0,
      pressure: 'pressure' in domEvent ? domEvent.pressure || 0 : 0,
      isPrimary: 'isPrimary' in domEvent ? domEvent.isPrimary : true,
      pointerType: 'pointerType' in domEvent ? domEvent.pointerType : 'mouse'
    };
  }

  /**
   * Create element event handlers for PixiJS objects
   */
  createElementHandlers(elementId: string) {
    return {
      pointerdown: (pixiEvent: FederatedEvent) => {
        pixiEvent.stopPropagation();
        const eventData = this.convertPixiEvent(pixiEvent);
        if (eventData && this.handlers.onElementPointerDown) {
          this.handlers.onElementPointerDown(elementId, eventData);
        }
      },

      pointermove: (pixiEvent: FederatedEvent) => {
        const eventData = this.convertPixiEvent(pixiEvent);
        if (eventData && this.handlers.onElementPointerMove) {
          this.handlers.onElementPointerMove(elementId, eventData);
        }
      },

      pointerup: (pixiEvent: FederatedEvent) => {
        const eventData = this.convertPixiEvent(pixiEvent);
        if (eventData && this.handlers.onElementPointerUp) {
          this.handlers.onElementPointerUp(elementId, eventData);
        }
      },

      pointertap: (pixiEvent: FederatedEvent) => {
        const eventData = this.convertPixiEvent(pixiEvent);
        if (eventData && this.handlers.onElementPointerTap) {
          this.handlers.onElementPointerTap(elementId, eventData);
        }
      }
    };
  }

  /**
   * Setup global event listeners for canvas interactions
   */
  private setupGlobalListeners(): void {
    // Global pointer move for continuous tracking
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (this.isDestroyed) return;
      
      const eventData = this.convertDomEvent(e);
      if (eventData && this.handlers.onCanvasPointerMove) {
        this.handlers.onCanvasPointerMove(eventData);
      }
    };

    // Global pointer up for finishing interactions
    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (this.isDestroyed) return;
      
      const eventData = this.convertDomEvent(e);
      if (eventData && this.handlers.onCanvasPointerUp) {
        this.handlers.onCanvasPointerUp(eventData);
      }
    };

    // Wheel events for zooming
    const handleWheel = (e: WheelEvent) => {
      if (this.isDestroyed) return;
      
      if (!this.containerRef.current?.contains(e.target as Node)) return;
      
      e.preventDefault();
      
      if (this.coordinateSystem && this.handlers.onWheel) {
        const worldPosition = this.coordinateSystem.screenToWorld({
          x: e.clientX,
          y: e.clientY
        });
        this.handlers.onWheel(e, worldPosition);
      }
    };

    // Canvas pointer down
    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (this.isDestroyed) return;
      
      if (!this.containerRef.current?.contains(e.target as Node)) return;
      
      const eventData = this.convertDomEvent(e);
      if (eventData && this.handlers.onCanvasPointerDown) {
        this.handlers.onCanvasPointerDown(eventData);
      }
    };

    // Add listeners
    document.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    document.addEventListener('pointerup', handleGlobalPointerUp, { passive: true });
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    if (this.containerRef.current) {
      this.containerRef.current.addEventListener('pointerdown', handleCanvasPointerDown);
    }

    // Store for cleanup
    this.globalListeners.set('pointermove', handleGlobalPointerMove);
    this.globalListeners.set('pointerup', handleGlobalPointerUp);
    this.globalListeners.set('wheel', handleWheel);
    this.globalListeners.set('pointerdown', handleCanvasPointerDown);
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.isDestroyed = true;
    
    // Remove global listeners
    this.globalListeners.forEach((listener, eventType) => {
      if (eventType === 'pointerdown' && this.containerRef.current) {
        this.containerRef.current.removeEventListener(eventType, listener);
      } else {
        document.removeEventListener(eventType, listener);
      }
    });
    
    this.globalListeners.clear();
    this.handlers = {};
    this.coordinateSystem = null;
  }
}

/**
 * Hook for managing canvas events with enhanced PixiJS v8 integration
 */
export const useCanvasEventManager = (
  containerRef: React.RefObject<HTMLElement>,
  coordinateSystem: CoordinateSystem | null,
  handlers: CanvasEventHandlers
) => {
  const eventManagerRef = React.useRef<CanvasEventManager | null>(null);

  React.useEffect(() => {
    eventManagerRef.current = new CanvasEventManager(containerRef, handlers);
    
    return () => {
      eventManagerRef.current?.destroy();
      eventManagerRef.current = null;
    };
  }, [containerRef]);

  React.useEffect(() => {
    if (eventManagerRef.current && coordinateSystem) {
      eventManagerRef.current.updateCoordinateSystem(coordinateSystem);
    }
  }, [coordinateSystem]);

  React.useEffect(() => {
    if (eventManagerRef.current) {
      eventManagerRef.current.updateHandlers(handlers);
    }
  }, [handlers]);

  return {
    createElementHandlers: (elementId: string) => 
      eventManagerRef.current?.createElementHandlers(elementId) || {},
    eventManager: eventManagerRef.current
  };
};

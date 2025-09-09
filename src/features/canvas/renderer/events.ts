import Konva from 'konva';
import { CanvasElement, ElementId } from '../types/enhanced.types';

export interface EventHandlers {
  onElementClick?: (id: ElementId, element: CanvasElement, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementDblClick?: (id: ElementId, element: CanvasElement, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onBackgroundClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (id: ElementId, element: CanvasElement) => void;
  onDragMove?: (id: ElementId, position: { x: number; y: number }) => void;
  onDragEnd?: (id: ElementId, position: { x: number; y: number }) => void;
  onTransformStart?: (ids: ElementId[]) => void;
  onTransformEnd?: (id: ElementId, updates: any) => void;
  onWheel?: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;
  onPointerMove?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onPointerUp?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
}

/**
 * Event handling module for canvas interactions
 * All events are handled at the stage level per blueprint
 */
export class EventManager {
  private stage: Konva.Stage | null = null;
  private handlers: EventHandlers = {};
  private nodeMap: Map<string, Konva.Node>;
  private shiftPressed = false;
  private lastClickTime = 0;
  private lastClickTarget: any = null;
  private isMiddleMouseDown = false;
  private panStartPos = { x: 0, y: 0 };
  
  constructor(nodeMap: Map<string, Konva.Node>) {
    this.nodeMap = nodeMap;
    
    // Bind keyboard event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
  }

  /**
   * Initialize event handlers on stage
   */
  init(stage: Konva.Stage, handlers: EventHandlers) {
    this.stage = stage;
    this.handlers = handlers;

    // Mouse/pointer events
    stage.on('mousedown.eventmanager', this.handleMouseDown.bind(this));
    stage.on('mousemove.eventmanager', this.handleMouseMove.bind(this));
    stage.on('mouseup.eventmanager', this.handleMouseUp.bind(this));
    stage.on('click.eventmanager', this.handleClick.bind(this));
    stage.on('dblclick.eventmanager', this.handleDblClick.bind(this));
    stage.on('wheel.eventmanager', this.handleWheel.bind(this));

    // Drag events
    stage.on('dragstart.eventmanager', this.handleDragStart.bind(this));
    stage.on('dragmove.eventmanager', this.handleDragMove.bind(this));
    stage.on('dragend.eventmanager', this.handleDragEnd.bind(this));

    // Transform events
    stage.on('transformstart.eventmanager', this.handleTransformStart.bind(this));
    stage.on('transformend.eventmanager', this.handleTransformEnd.bind(this));

    // Keyboard events (window level)
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  /**
   * Get element ID from event target
   */
  private getElementIdFromTarget(target: any): ElementId | null {
    let node = target;
    while (node && node !== this.stage) {
      const id = node.id();
      if (id && this.nodeMap.has(id)) {
        return id as ElementId;
      }
      node = node.getParent();
    }
    return null;
  }

  /**
   * Check if target is background
   */
  private isBackgroundClick(target: any): boolean {
    if (target === this.stage) return true;
    
    const targetName = target.name ? target.name() : '';
    const targetId = target.id ? target.id() : '';
    
    // Check for background layer or background elements
    if (targetName === 'background-layer' || 
        targetName === 'main-layer' ||
        targetName === 'preview-layer' ||
        targetId === 'background' ||
        targetId === 'grid' ||
        targetName.includes('background')) {
      return true;
    }
    
    // If clicking on layer directly
    if (target instanceof Konva.Layer) {
      return true;
    }
    
    return false;
  }

  private handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    // Middle mouse for panning
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      this.isMiddleMouseDown = true;
      this.panStartPos = { x: e.evt.clientX, y: e.evt.clientY };
      if (this.stage) {
        this.stage.container().style.cursor = 'grabbing';
      }
    }
  }

  private handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    // Handle middle mouse panning
    if (this.isMiddleMouseDown && this.stage) {
      const dx = e.evt.clientX - this.panStartPos.x;
      const dy = e.evt.clientY - this.panStartPos.y;
      
      const oldPos = this.stage.position();
      this.stage.position({
        x: oldPos.x + dx,
        y: oldPos.y + dy
      });
      this.stage.batchDraw();
      
      this.panStartPos = { x: e.evt.clientX, y: e.evt.clientY };
    }

    this.handlers.onPointerMove?.(e as any);
  }

  private handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.evt.button === 1) {
      this.isMiddleMouseDown = false;
      if (this.stage) {
        this.stage.container().style.cursor = 'default';
      }
    }

    this.handlers.onPointerUp?.(e as any);
  }

  private handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const target = e.target;
    
    // Check for double click simulation
    const now = Date.now();
    const timeDiff = now - this.lastClickTime;
    const isSameTarget = target === this.lastClickTarget;
    
    if (timeDiff < 300 && isSameTarget) {
      // Trigger double click
      this.handleDblClick(e);
      return;
    }
    
    this.lastClickTime = now;
    this.lastClickTarget = target;

    if (this.isBackgroundClick(target)) {
      this.handlers.onBackgroundClick?.(e);
    } else {
      const elementId = this.getElementIdFromTarget(target);
      if (elementId) {
        // Get element data from store or node attributes
        const element = this.getElementData(elementId);
        if (element) {
          this.handlers.onElementClick?.(elementId, element, e);
        }
      }
    }
  }

  private handleDblClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const elementId = this.getElementIdFromTarget(e.target);
    if (elementId) {
      const element = this.getElementData(elementId);
      if (element) {
        this.handlers.onElementDblClick?.(elementId, element, e);
      }
    }
  }

  private handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    this.handlers.onWheel?.(e);
  }

  private handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    const elementId = this.getElementIdFromTarget(e.target);
    if (elementId) {
      const element = this.getElementData(elementId);
      if (element) {
        this.handlers.onDragStart?.(elementId, element);
      }
    }
  }

  private handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const elementId = this.getElementIdFromTarget(e.target);
    if (elementId) {
      const node = e.target;
      this.handlers.onDragMove?.(elementId, {
        x: node.x(),
        y: node.y()
      });
    }
  }

  private handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const elementId = this.getElementIdFromTarget(e.target);
    if (elementId) {
      const node = e.target;
      this.handlers.onDragEnd?.(elementId, {
        x: node.x(),
        y: node.y()
      });
    }
  }

  private handleTransformStart(e: Konva.KonvaEventObject<Event>) {
    const transformer = e.target as Konva.Transformer;
    const nodes = transformer.nodes();
    const ids = nodes.map(n => n.id()).filter(Boolean) as ElementId[];
    this.handlers.onTransformStart?.(ids);
  }

  private handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const elementId = node.id() as ElementId;
    if (elementId) {
      // Extract transform updates
      const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        width: node.width ? node.width() * node.scaleX() : undefined,
        height: node.height ? node.height() * node.scaleY() : undefined
      };
      this.handlers.onTransformEnd?.(elementId, updates);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      this.shiftPressed = true;
    }
    this.handlers.onKeyDown?.(e);
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      this.shiftPressed = false;
    }
    this.handlers.onKeyUp?.(e);
  }

  private handleWindowBlur() {
    // Reset modifier keys when window loses focus
    this.shiftPressed = false;
  }

  /**
   * Get element data (placeholder - should connect to store)
   */
  private getElementData(id: ElementId): CanvasElement | null {
    const node = this.nodeMap.get(id);
    if (!node) return null;
    
    // Extract basic element data from node attributes
    // In real implementation, this should query the store
    return {
      id,
      type: node.getAttr('elementType') || 'rectangle',
      x: node.x(),
      y: node.y(),
      width: node.width?.() || 100,
      height: node.height?.() || 100,
      rotation: node.rotation() || 0,
      fill: node.getAttr('fill'),
      stroke: node.getAttr('stroke'),
      strokeWidth: node.getAttr('strokeWidth'),
      opacity: node.opacity(),
      visible: node.visible(),
      locked: false,
      groupId: node.getAttr('groupId')
    } as CanvasElement;
  }

  /**
   * Check if shift key is pressed
   */
  isShiftPressed(): boolean {
    return this.shiftPressed;
  }

  /**
   * Clean up event handlers
   */
  destroy() {
    if (this.stage) {
      // Remove stage event handlers
      this.stage.off('.eventmanager');
      this.stage = null;
    }

    // Remove window event handlers
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.handlers = {};
  }
}
/**
 * Event Router
 * Centralizes stage event bindings and delegates to feature controllers
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId } from '../../types/enhanced.types';

/**
 * Store adapter interface for event router integration
 */
export interface EventRouterStoreAdapter {
  getSelectedElementIds(): Set<ElementId>;
  setSelectedElementIds(ids: Set<ElementId>): void;
  addToSelection(id: ElementId): void;
  removeFromSelection(id: ElementId): void;
  clearSelection(): void;
  getElement(id: ElementId): any;
  getGroupMembers(groupId: string): ElementId[];
  saveSnapshot(): void;
}

/**
 * Event router configuration
 */
export interface EventRouterConfig {
  stage: Konva.Stage;
  nodeMap: Map<string, Konva.Node>;
  storeAdapter: EventRouterStoreAdapter;
  onTextEditorOpen?: (elementId: ElementId, node: Konva.Node) => void;
  onTableCellEdit?: (tableId: ElementId, row: number, col: number) => void;
  onSelectionChange?: (selectedIds: Set<ElementId>) => void;
  onDragStart?: (elementId: ElementId) => void;
  onDragEnd?: (elementId: ElementId, position: { x: number; y: number }) => void;
  onGroupDragMove?: (groupId: string, offset: { dx: number; dy: number }) => void;
  onConnectorHover?: (connectorId: ElementId | null) => void;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Event handler priorities for proper delegation
 */
export enum EventPriority {
  HIGH = 1,
  NORMAL = 2,
  LOW = 3
}

/**
 * Event context information
 */
export interface EventContext {
  originalEvent: Event;
  target: Konva.Node;
  elementNode?: Konva.Node;
  elementId?: ElementId;
  isMultiSelect: boolean;
  stagePosition?: { x: number; y: number };
}

/**
 * Event Router
 * Manages all stage-level event handling and delegates to appropriate controllers
 */
export class EventRouter {
  private config: EventRouterConfig;
  private shiftPressed = false;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private lastHoveredConnectorId: ElementId | null = null;
  private groupDragData = new Map<string, { base: Map<string, { x: number; y: number }>; members: ElementId[] }>();

  constructor(config: EventRouterConfig) {
    this.config = config;
    this.setupEventHandlers();

    if (this.config.debug?.log) {
      console.info('[EventRouter] Event router initialized');
    }
  }

  /**
   * Setup all stage-level event handlers
   */
  private setupEventHandlers(): void {
    this.setupKeyboardHandlers();
    this.setupStageHandlers();
  }

  /**
   * Setup global keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    // Shift key handling for constrain behavior
    this.keyDownHandler = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        this.shiftPressed = true;
        if (this.config.debug?.log) {
          console.info('[EventRouter] Shift key pressed - constraining enabled');
        }
      }
    };

    this.keyUpHandler = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        this.shiftPressed = false;
        if (this.config.debug?.log) {
          console.info('[EventRouter] Shift key released - constraining disabled');
        }
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  /**
   * Setup stage event handlers
   */
  private setupStageHandlers(): void {
    // Mouse down for selection/deselection
    this.config.stage.on('mousedown.eventrouter', (e: any) => {
      this.handleMouseDown(e);
    });

    // Drag events
    this.config.stage.on('dragstart.eventrouter', (e: any) => {
      this.handleDragStart(e);
    });

    this.config.stage.on('dragmove.eventrouter', (e: any) => {
      this.handleDragMove(e);
    });

    this.config.stage.on('dragend.eventrouter', (e: any) => {
      this.handleDragEnd(e);
    });

    // Double-click for editing
    this.config.stage.on('dblclick.eventrouter', (e: any) => {
      this.handleDoubleClick(e);
    });

    // Mouse move for hover effects
    this.config.stage.on('mousemove.eventrouter', (e: any) => {
      this.handleMouseMove(e);
    });

    // Wheel for zoom/pan coordination
    this.config.stage.on('wheel.eventrouter', (e: any) => {
      this.handleWheel(e);
    });
  }

  /**
   * Handle mouse down events for selection
   */
  private handleMouseDown(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      if (this.config.debug?.log) {
        console.info('[EventRouter] Mouse down:', {
          target: e.target?.name?.(),
          elementId: context.elementId,
          isMultiSelect: context.isMultiSelect
        });
      }

      // Ignore transformer interactions
      if (this.isTransformerTarget(e.target)) {
        return;
      }

      if (context.elementNode && context.elementId) {
        // Element clicked - handle selection
        this.handleElementSelection(context);
        
        // Cancel bubbling to prevent background deselection
        e.cancelBubble = true;
      } else {
        // Background clicked - clear selection
        this.handleBackgroundClick(context);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Mouse down error:', error);
      }
    }
  }

  /**
   * Handle element selection logic
   */
  private handleElementSelection(context: EventContext): void {
    if (!context.elementId) return;

    const selectedIds = this.config.storeAdapter.getSelectedElementIds();
    
    if (context.isMultiSelect) {
      // Multi-select mode
      if (selectedIds.has(context.elementId)) {
        this.config.storeAdapter.removeFromSelection(context.elementId);
      } else {
        this.config.storeAdapter.addToSelection(context.elementId);
      }
    } else {
      // Single select mode
      if (selectedIds.size === 1 && selectedIds.has(context.elementId)) {
        // Already selected, keep selection
        return;
      } else {
        // Select this element only
        this.config.storeAdapter.setSelectedElementIds(new Set([context.elementId]));
      }
    }

    // Notify selection change
    if (this.config.onSelectionChange) {
      this.config.onSelectionChange(this.config.storeAdapter.getSelectedElementIds());
    }
  }

  /**
   * Handle background click for deselection
   */
  private handleBackgroundClick(context: EventContext): void {
    if (this.config.debug?.log) {
      console.info('[EventRouter] Background clicked - clearing selection');
    }
    
    this.config.storeAdapter.clearSelection();
    
    if (this.config.onSelectionChange) {
      this.config.onSelectionChange(new Set());
    }
  }

  /**
   * Handle drag start events
   */
  private handleDragStart(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      if (context.elementNode && context.elementId) {
        if (this.config.debug?.log) {
          console.info(`[EventRouter] Drag start on element: ${context.elementId}`);
        }

        // Initialize group drag if element has group members
        this.initializeGroupDrag(context.elementId);

        // Notify drag start
        if (this.config.onDragStart) {
          this.config.onDragStart(context.elementId);
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Drag start error:', error);
      }
    }
  }

  /**
   * Handle drag move events
   */
  private handleDragMove(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      if (context.elementNode && context.elementId) {
        // Handle group drag coordination
        this.handleGroupDragMove(context.elementId, context.elementNode);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Drag move error:', error);
      }
    }
  }

  /**
   * Handle drag end events
   */
  private handleDragEnd(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      if (context.elementNode && context.elementId) {
        if (this.config.debug?.log) {
          console.info(`[EventRouter] Drag end on element: ${context.elementId}`);
        }

        const position = {
          x: context.elementNode.x(),
          y: context.elementNode.y()
        };

        // Commit group positions if applicable
        this.commitGroupDrag(context.elementId);

        // Notify drag end
        if (this.config.onDragEnd) {
          this.config.onDragEnd(context.elementId, position);
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Drag end error:', error);
      }
    }
  }

  /**
   * Handle double-click events for editing
   */
  private handleDoubleClick(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      if (this.config.debug?.log) {
        console.info('[EventRouter] Double-click detected:', {
          target: e.target?.name?.(),
          elementId: context.elementId
        });
      }

      if (context.elementNode && context.elementId) {
        const elementName = context.elementNode.name();
        
        // Handle text editing for text-like elements
        if (this.isTextLikeElement(elementName)) {
          const clickCount = (e.evt as any)?.detail;
          const isDoubleClick = typeof clickCount === 'number' && clickCount >= 2;
          
          if (isDoubleClick && this.config.onTextEditorOpen) {
            this.config.onTextEditorOpen(context.elementId, context.elementNode);
            return;
          }
        }
        
        // Handle table cell editing
        if (elementName === 'table' && this.config.onTableCellEdit) {
          const { row, col } = this.getTableCellFromClick(context);
          if (row >= 0 && col >= 0) {
            this.config.onTableCellEdit(context.elementId, row, col);
          }
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Double-click error:', error);
      }
    }
  }

  /**
   * Handle mouse move events for hover effects
   */
  private handleMouseMove(e: any): void {
    try {
      const context = this.createEventContext(e);
      
      // Handle connector hover effects
      if (context.elementNode && context.elementId) {
        const elementName = context.elementNode.name();
        
        if (elementName === 'connector' || elementName === 'line' || elementName === 'arrow') {
          if (this.lastHoveredConnectorId !== context.elementId) {
            this.lastHoveredConnectorId = context.elementId;
            if (this.config.onConnectorHover) {
              this.config.onConnectorHover(context.elementId);
            }
          }
        } else {
          // Not hovering over a connector
          if (this.lastHoveredConnectorId !== null) {
            this.lastHoveredConnectorId = null;
            if (this.config.onConnectorHover) {
              this.config.onConnectorHover(null);
            }
          }
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Mouse move error:', error);
      }
    }
  }

  /**
   * Handle wheel events for zoom/pan coordination
   */
  private handleWheel(e: any): void {
    try {
      // Trigger draw scheduling to keep overlays aligned during zoom/pan
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('overlay');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Wheel error:', error);
      }
    }
  }

  // Helper methods

  /**
   * Create event context from Konva event
   */
  private createEventContext(e: any): EventContext {
    const elementNode = this.getElementNodeFromEvent(e.target);
    const elementId = elementNode?.id?.() as ElementId | undefined;
    const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const stagePosition = this.config.stage.getPointerPosition();

    return {
      originalEvent: e.evt,
      target: e.target,
      elementNode,
      elementId,
      isMultiSelect,
      stagePosition: stagePosition || { x: 0, y: 0 }
    };
  }

  /**
   * Get element node from event target (resolves through transformer)
   */
  private getElementNodeFromEvent(target: Konva.Node): Konva.Node | null {
    try {
      // Direct element hit
      if (target && target.id && target.id()) {
        return target;
      }

      // Check parent for grouped elements
      let current = target;
      while (current) {
        if (current.id && current.id()) {
          return current;
        }
        current = current.parent;
        
        // Prevent infinite loops
        if (current === this.config.stage) break;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if target is a transformer element
   */
  private isTransformerTarget(target: Konva.Node): boolean {
    const className = target?.getClassName?.();
    const parentClassName = target?.getParent?.()?.getClassName?.();
    return className === 'Transformer' || parentClassName === 'Transformer';
  }

  /**
   * Check if element is text-editable
   */
  private isTextLikeElement(elementName: string): boolean {
    return ['sticky-note', 'text', 'rectangle', 'circle', 'triangle', 'circle-text'].includes(elementName);
  }

  /**
   * Get table cell coordinates from click position
   */
  private getTableCellFromClick(context: EventContext): { row: number; col: number } {
    try {
      if (!context.elementNode || !context.stagePosition) {
        return { row: -1, col: -1 };
      }

      const tableGroup = context.elementNode as Konva.Group;
      const element = this.config.storeAdapter.getElement(context.elementId!);
      
      if (!element) return { row: -1, col: -1 };

      const local = tableGroup.getAbsoluteTransform().copy().invert().point(context.stagePosition);
      const cellW = element.cellWidth || 100;
      const cellH = element.cellHeight || 40;
      const cols = element.cols || 1;
      const rows = element.rows || 1;

      const col = Math.min(cols - 1, Math.max(0, Math.floor(local.x / cellW)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor(local.y / cellH)));

      return { row, col };
    } catch (error) {
      return { row: -1, col: -1 };
    }
  }

  /**
   * Initialize group drag coordination
   */
  private initializeGroupDrag(elementId: ElementId): void {
    try {
      const element = this.config.storeAdapter.getElement(elementId);
      const groupId = element?.groupId;
      
      if (groupId) {
        const members = this.config.storeAdapter.getGroupMembers(groupId);
        const basePositions = new Map<string, { x: number; y: number }>();
        
        members.forEach(memberId => {
          const node = this.config.nodeMap.get(String(memberId));
          if (node) {
            basePositions.set(String(memberId), { x: node.x(), y: node.y() });
          }
        });
        
        this.groupDragData.set(groupId, {
          base: basePositions,
          members
        });
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Group drag initialization error:', error);
      }
    }
  }

  /**
   * Handle group drag move coordination
   */
  private handleGroupDragMove(elementId: ElementId, draggedNode: Konva.Node): void {
    try {
      const element = this.config.storeAdapter.getElement(elementId);
      const groupId = element?.groupId;
      
      if (groupId && this.groupDragData.has(groupId)) {
        const groupData = this.groupDragData.get(groupId)!;
        const basePos = groupData.base.get(String(elementId));
        
        if (basePos) {
          const dx = draggedNode.x() - basePos.x;
          const dy = draggedNode.y() - basePos.y;
          
          // Move other group members
          groupData.members.forEach(memberId => {
            if (memberId !== elementId) {
              const memberNode = this.config.nodeMap.get(String(memberId));
              const memberBase = groupData.base.get(String(memberId));
              
              if (memberNode && memberBase) {
                memberNode.position({ x: memberBase.x + dx, y: memberBase.y + dy });
              }
            }
          });
          
          // Notify group drag
          if (this.config.onGroupDragMove) {
            this.config.onGroupDragMove(groupId, { dx, dy });
          }
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Group drag move error:', error);
      }
    }
  }

  /**
   * Commit group drag positions
   */
  private commitGroupDrag(elementId: ElementId): void {
    try {
      const element = this.config.storeAdapter.getElement(elementId);
      const groupId = element?.groupId;
      
      if (groupId && this.groupDragData.has(groupId)) {
        const groupData = this.groupDragData.get(groupId)!;
        
        // The drag positions are already committed by individual drag end handlers
        // Just clean up the group data
        this.groupDragData.delete(groupId);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Group drag commit error:', error);
      }
    }
  }

  /**
   * Get current shift key state
   */
  isShiftPressed(): boolean {
    return this.shiftPressed;
  }

  /**
   * Update event router configuration
   */
  updateConfig(newConfig: Partial<EventRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy event router and cleanup resources
   */
  destroy(): void {
    try {
      // Remove stage event listeners
      this.config.stage.off('mousedown.eventrouter');
      this.config.stage.off('dragstart.eventrouter');
      this.config.stage.off('dragmove.eventrouter');
      this.config.stage.off('dragend.eventrouter');
      this.config.stage.off('dblclick.eventrouter');
      this.config.stage.off('mousemove.eventrouter');
      this.config.stage.off('wheel.eventrouter');

      // Remove global event listeners
      if (this.keyDownHandler) {
        window.removeEventListener('keydown', this.keyDownHandler);
        this.keyDownHandler = null;
      }
      
      if (this.keyUpHandler) {
        window.removeEventListener('keyup', this.keyUpHandler);
        this.keyUpHandler = null;
      }

      // Clear state
      this.groupDragData.clear();
      this.lastHoveredConnectorId = null;

      if (this.config.debug?.log) {
        console.info('[EventRouter] Event router destroyed');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[EventRouter] Destroy error:', error);
      }
    }
  }
}
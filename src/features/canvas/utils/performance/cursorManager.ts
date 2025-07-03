/**
 * Comprehensive Cursor Management System for Canvas
 * Handles cursor changes based on tools, hover states, and interactions
 */

import Konva from 'konva';

export type CanvasTool = 
  | 'select'
  | 'pan' 
  | 'pen'
  | 'marker'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'text'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-triangle'
  | 'draw-star'
  | 'connector'
  | 'connector-line'
  | 'connector-arrow'
  | 'sticky-note'
  | 'image'
  | 'table'
  | 'section';

export type CursorType =
  | 'default'
  | 'pointer'
  | 'grab'
  | 'grabbing'
  | 'crosshair'
  | 'text'
  | 'move'
  | 'nwse-resize'
  | 'nesw-resize'
  | 'ns-resize'
  | 'ew-resize'
  | 'not-allowed'
  | 'help'
  | 'wait'
  | 'progress';

export interface CursorState {
  currentCursor: CursorType;
  tool: CanvasTool;
  isDragging: boolean;
  isHovering: boolean;
  hoverTarget?: string | undefined;
}

/**
 * Comprehensive cursor management system
 */
export class CursorManager {
  private stage: Konva.Stage | null = null;
  private state: CursorState = {
    currentCursor: 'default',
    tool: 'select',
    isDragging: false,
    isHovering: false
  };

  // Tool-based cursor mappings
  private readonly toolCursors: Record<CanvasTool, CursorType> = {
    'select': 'default',
    'pan': 'grab',
    'pen': 'crosshair',
    'marker': 'crosshair',
    'highlighter': 'crosshair',
    'eraser': 'crosshair',
    'lasso': 'crosshair',
    'text': 'crosshair',
    'draw-rectangle': 'crosshair',
    'draw-circle': 'crosshair',
    'draw-triangle': 'crosshair',
    'draw-star': 'crosshair',
    'connector': 'crosshair',
    'connector-line': 'crosshair',
    'connector-arrow': 'crosshair',
    'sticky-note': 'crosshair',
    'image': 'crosshair',
    'table': 'crosshair',
    'section': 'crosshair'
  };

  // Resize handle cursor mappings
  private readonly resizeHandleCursors: Record<string, CursorType> = {
    'top-left': 'nwse-resize',
    'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize',
    'bottom-right': 'nwse-resize',
    'top-center': 'ns-resize',
    'bottom-center': 'ns-resize',
    'middle-left': 'ew-resize',
    'middle-right': 'ew-resize'
  };

  /**
   * Initialize cursor manager with a Konva stage
   */
  setStage(stage: Konva.Stage): void {
    this.stage = stage;
    this.updateCursor();
  }

  /**
   * Set the cursor directly
   */
  setCursor(cursor: CursorType): void {
    if (!this.stage) return;
    
    this.state.currentCursor = cursor;
    this.stage.container().style.cursor = cursor;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`CursorManager: Set cursor to ${cursor}`);
    }
  }

  /**
   * Update cursor based on current tool
   */
  updateForTool(tool: CanvasTool): void {
    this.state.tool = tool;
    
    // If dragging, maintain grabbing cursor for pan tool
    if (this.state.isDragging && tool === 'pan') {
      this.setCursor('grabbing');
      return;
    }
    
    // Use tool-specific cursor
    const cursor = this.toolCursors[tool] || 'default';
    this.setCursor(cursor);
  }

  /**
   * Update cursor for hover interactions
   */
  updateForHover(target: Konva.Node | null): void {
    if (!target) {
      this.state.isHovering = false;
      this.state.hoverTarget = undefined;
      this.updateCursor();
      return;
    }

    this.state.isHovering = true;
    this.state.hoverTarget = target.name() || target.id();

    // Check for resize handles first
    const nodeName = target.name();
    if (nodeName?.includes('anchor') || nodeName?.includes('handle')) {
      this.handleResizeHover(nodeName);
      return;
    }

    // Check for section edges
    if (this.isNearSectionEdge(target)) {
      this.setCursor('move');
      return;
    }

    // Check for interactive elements
    if (this.isInteractiveElement(target)) {
      this.setCursor('pointer');
      return;
    }

    // Default hover behavior based on tool
    this.updateCursor();
  }

  /**
   * Handle resize handle hover
   */
  private handleResizeHover(nodeName: string): void {
    // Extract resize direction from node name
    for (const [direction, cursor] of Object.entries(this.resizeHandleCursors)) {
      if (nodeName.includes(direction)) {
        this.setCursor(cursor);
        return;
      }
    }
    
    // Fallback for unrecognized resize handles
    this.setCursor('nwse-resize');
  }

  /**
   * Check if near section edge for resize cursor
   */
  private isNearSectionEdge(target: Konva.Node): boolean {
    // This would need to be implemented based on your section detection logic
    // For now, return false as placeholder
    return target.getClassName() === 'Group' && target.name()?.includes('section');
  }

  /**
   * Check if element is interactive (clickable, draggable, etc.)
   */
  private isInteractiveElement(target: Konva.Node): boolean {
    return target.draggable() || target.listening();
  }

  /**
   * Update cursor for drag operations
   */
  updateForDrag(isDragging: boolean): void {
    this.state.isDragging = isDragging;
    
    if (isDragging) {
      if (this.state.tool === 'pan') {
        this.setCursor('grabbing');
      } else {
        this.setCursor('move');
      }
    } else {
      // Return to tool-based cursor
      this.updateForTool(this.state.tool);
    }
  }

  /**
   * Set cursor for loading states
   */
  setLoadingCursor(message?: string): void {
    this.setCursor('wait');
    
    if (message && this.stage) {
      // Could add tooltip or status display here
      console.log(`Canvas loading: ${message}`);
    }
  }

  /**
   * Set cursor for error states
   */
  setErrorCursor(): void {
    this.setCursor('not-allowed');
  }

  /**
   * Update cursor based on current state
   */
  private updateCursor(): void {
    if (this.state.isDragging) {
      this.updateForDrag(true);
      return;
    }

    if (this.state.isHovering) {
      // Hover state is handled by updateForHover
      return;
    }

    // Default to tool cursor
    this.updateForTool(this.state.tool);
  }

  /**
   * Reset to default cursor
   */
  reset(): void {
    this.state = {
      currentCursor: 'default',
      tool: 'select',
      isDragging: false,
      isHovering: false
    };
    this.setCursor('default');
  }

  /**
   * Get current cursor state (useful for debugging)
   */
  getState(): CursorState {
    return { ...this.state };
  }

  /**
   * Handle keyboard modifiers affecting cursor
   */
  updateForKeyboard(modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  }): void {
    // Example: Ctrl + hover could show copy cursor
    if (modifiers.ctrl && this.state.isHovering) {
      // Could implement copy cursor logic here
      return;
    }

    // Alt key could show different cursor for alternative actions
    if (modifiers.alt) {
      // Could implement alternative action cursors here
      return;
    }

    // Update normal cursor
    this.updateCursor();
  }

  /**
   * Dispose of the cursor manager
   */
  dispose(): void {
    this.stage = null;
    this.reset();
  }
}

// Singleton instance for global use
export const cursorManager = new CursorManager();

/**
 * Hook for React components to use cursor manager
 */
export function useCursorManager(stage?: Konva.Stage) {
  if (stage && cursorManager) {
    cursorManager.setStage(stage);
  }

  return {
    setCursor: (cursor: CursorType) => cursorManager.setCursor(cursor),
    updateForTool: (tool: CanvasTool) => cursorManager.updateForTool(tool),
    updateForHover: (target: Konva.Node | null) => cursorManager.updateForHover(target),
    updateForDrag: (isDragging: boolean) => cursorManager.updateForDrag(isDragging),
    setLoadingCursor: (message?: string) => cursorManager.setLoadingCursor(message),
    setErrorCursor: () => cursorManager.setErrorCursor(),
    reset: () => cursorManager.reset(),
    getState: () => cursorManager.getState(),
    setStage: (stage: Konva.Stage) => cursorManager.setStage(stage)
  };
}

export default CursorManager;

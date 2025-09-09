import Konva from 'konva';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface ViewportConfig {
  minScale?: number;
  maxScale?: number;
  scaleFactor?: number;
  enablePanning?: boolean;
  enableZooming?: boolean;
  enableTouchGestures?: boolean;
  onViewportChange?: (viewport: ViewportState) => void;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Viewport management module for canvas pan and zoom
 * Handles mouse wheel zoom, middle-click pan, and touch gestures
 */
export class ViewportManager {
  private stage: Konva.Stage | null = null;
  private config: ViewportConfig;
  private viewport: ViewportState = {
    x: 0,
    y: 0,
    scale: 1
  };

  // Pan state
  private isPanning = false;
  private panStartPos = { x: 0, y: 0 };
  private panStartViewport = { x: 0, y: 0 };

  // Touch gesture state
  private lastCenter: { x: number; y: number } | null = null;
  private lastDist = 0;
  private touchStartViewport: ViewportState | null = null;

  // Animation state
  private animationFrame: number | null = null;

  constructor(config: ViewportConfig = {}) {
    this.config = {
      minScale: 0.1,
      maxScale: 5,
      scaleFactor: 1.1,
      enablePanning: true,
      enableZooming: true,
      enableTouchGestures: true,
      ...config
    };
  }

  /**
   * Initialize with stage
   */
  init(stage: Konva.Stage) {
    this.stage = stage;
    
    // Set initial viewport
    this.applyViewport();

    // Bind event handlers
    this.bindEventHandlers();
  }

  /**
   * Bind event handlers for viewport controls
   */
  private bindEventHandlers() {
    if (!this.stage) return;

    const container = this.stage.container();

    // Mouse wheel zoom
    if (this.config.enableZooming) {
      container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    // Middle mouse pan
    if (this.config.enablePanning) {
      container.addEventListener('mousedown', this.handleMouseDown.bind(this));
      container.addEventListener('mousemove', this.handleMouseMove.bind(this));
      container.addEventListener('mouseup', this.handleMouseUp.bind(this));
      container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    // Touch gestures
    if (this.config.enableTouchGestures) {
      container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }

  /**
   * Handle mouse wheel zoom
   */
  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    if (!this.stage) return;

    const oldScale = this.viewport.scale;
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    // Calculate new scale
    const direction = e.deltaY > 0 ? -1 : 1;
    const scaleBy = this.config.scaleFactor || 1.1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Zoom toward pointer position
    this.zoomToPoint(pointer, newScale);
  }

  /**
   * Handle mouse down for pan
   */
  private handleMouseDown(e: MouseEvent) {
    // Middle mouse button
    if (e.button === 1) {
      e.preventDefault();
      this.startPan({ x: e.clientX, y: e.clientY });
    }
  }

  /**
   * Handle mouse move for pan
   */
  private handleMouseMove(e: MouseEvent) {
    if (this.isPanning) {
      e.preventDefault();
      this.updatePan({ x: e.clientX, y: e.clientY });
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(e: MouseEvent) {
    if (e.button === 1) {
      this.endPan();
    }
  }

  /**
   * Handle mouse leave
   */
  private handleMouseLeave() {
    this.endPan();
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 1) {
      // Single touch - pan
      const touch = e.touches[0];
      this.startPan({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      this.startPinchZoom(e.touches);
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 1 && this.isPanning) {
      // Continue pan
      const touch = e.touches[0];
      this.updatePan({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // Continue pinch zoom
      this.updatePinchZoom(e.touches);
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.endPan();
      this.endPinchZoom();
    }
  }

  /**
   * Start panning
   */
  private startPan(position: { x: number; y: number }) {
    this.isPanning = true;
    this.panStartPos = position;
    this.panStartViewport = { ...this.viewport };
    
    if (this.stage) {
      this.stage.container().style.cursor = 'grabbing';
    }
  }

  /**
   * Update pan position
   */
  private updatePan(position: { x: number; y: number }) {
    if (!this.isPanning) return;

    const dx = position.x - this.panStartPos.x;
    const dy = position.y - this.panStartPos.y;

    this.setViewport({
      x: this.panStartViewport.x + dx,
      y: this.panStartViewport.y + dy,
      scale: this.viewport.scale
    });
  }

  /**
   * End panning
   */
  private endPan() {
    this.isPanning = false;
    
    if (this.stage) {
      this.stage.container().style.cursor = 'default';
    }
  }

  /**
   * Start pinch zoom
   */
  private startPinchZoom(touches: TouchList) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    // Calculate center and distance
    this.lastCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };

    this.lastDist = this.getDistance(
      { x: touch1.clientX, y: touch1.clientY },
      { x: touch2.clientX, y: touch2.clientY }
    );

    this.touchStartViewport = { ...this.viewport };
    this.isPanning = false; // Stop panning if it was active
  }

  /**
   * Update pinch zoom
   */
  private updatePinchZoom(touches: TouchList) {
    if (!this.lastCenter || !this.touchStartViewport || !this.stage) return;

    const touch1 = touches[0];
    const touch2 = touches[1];

    // Calculate new center and distance
    const newCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };

    const newDist = this.getDistance(
      { x: touch1.clientX, y: touch1.clientY },
      { x: touch2.clientX, y: touch2.clientY }
    );

    // Calculate scale change
    const scale = newDist / this.lastDist;
    const newScale = this.touchStartViewport.scale * scale;

    // Calculate pan
    const dx = newCenter.x - this.lastCenter.x;
    const dy = newCenter.y - this.lastCenter.y;

    // Apply transform
    this.setViewport({
      x: this.viewport.x + dx,
      y: this.viewport.y + dy,
      scale: newScale
    });

    // Update last values for next move
    this.lastCenter = newCenter;
  }

  /**
   * End pinch zoom
   */
  private endPinchZoom() {
    this.lastCenter = null;
    this.lastDist = 0;
    this.touchStartViewport = null;
  }

  /**
   * Zoom to a specific point
   */
  zoomToPoint(point: { x: number; y: number }, newScale: number) {
    if (!this.stage) return;

    const oldScale = this.viewport.scale;
    
    // Clamp scale
    newScale = Math.max(this.config.minScale || 0.1, Math.min(this.config.maxScale || 5, newScale));
    
    // Calculate new position to keep point under cursor
    const mousePointTo = {
      x: (point.x - this.viewport.x) / oldScale,
      y: (point.y - this.viewport.y) / oldScale
    };

    const newPos = {
      x: point.x - mousePointTo.x * newScale,
      y: point.y - mousePointTo.y * newScale
    };

    this.setViewport({
      x: newPos.x,
      y: newPos.y,
      scale: newScale
    });
  }

  /**
   * Set viewport state
   */
  setViewport(viewport: ViewportState) {
    // Clamp scale
    viewport.scale = Math.max(
      this.config.minScale || 0.1,
      Math.min(this.config.maxScale || 5, viewport.scale)
    );

    this.viewport = viewport;
    this.applyViewport();
    
    // Notify change
    this.config.onViewportChange?.(viewport);
  }

  /**
   * Get current viewport state
   */
  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  /**
   * Apply viewport to stage
   */
  private applyViewport() {
    if (!this.stage) return;

    this.stage.scale({ x: this.viewport.scale, y: this.viewport.scale });
    this.stage.position({ x: this.viewport.x, y: this.viewport.y });
    this.stage.batchDraw();
  }

  /**
   * Reset viewport to default
   */
  resetViewport() {
    this.setViewport({ x: 0, y: 0, scale: 1 });
  }

  /**
   * Fit content to viewport
   */
  fitToContent(bounds: ViewportBounds, padding = 20) {
    if (!this.stage) return;

    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    if (contentWidth <= 0 || contentHeight <= 0) return;

    // Calculate scale to fit content
    const scaleX = (stageWidth - padding * 2) / contentWidth;
    const scaleY = (stageHeight - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    // Calculate position to center content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const x = stageWidth / 2 - centerX * scale;
    const y = stageHeight / 2 - centerY * scale;

    this.setViewport({ x, y, scale });
  }

  /**
   * Animate to viewport
   */
  animateToViewport(target: ViewportState, duration = 300) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const start = { ...this.viewport };
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate viewport
      this.setViewport({
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        scale: start.scale + (target.scale - start.scale) * eased
      });

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: (screenPos.x - this.viewport.x) / this.viewport.scale,
      y: (screenPos.y - this.viewport.y) / this.viewport.scale
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: worldPos.x * this.viewport.scale + this.viewport.x,
      y: worldPos.y * this.viewport.scale + this.viewport.y
    };
  }

  /**
   * Get distance between two points
   */
  private getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.stage) {
      const container = this.stage.container();
      
      // Remove event listeners
      container.removeEventListener('wheel', this.handleWheel.bind(this));
      container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      container.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      container.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
      container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      container.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      container.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    this.stage = null;
  }
}
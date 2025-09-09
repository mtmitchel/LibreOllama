/**
 * Connector Overlay Manager
 * Handles draggable endpoint handles for selected connectors
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import Konva from 'konva';
import type { ElementId } from '../../types/enhanced.types';

/**
 * Store adapter interface for connector overlay integration
 */
export interface ConnectorStoreAdapter {
  saveSnapshot(): void;
  beginEndpointDrag(connectorId: ElementId, endpoint: 'start' | 'end'): void;
  updateEndpointDrag(position: { x: number; y: number }): void;
  commitEndpointDrag(): void;
  getSelectedElementIds(): Set<ElementId>;
  getElement(id: ElementId): any;
  getDraft(): any;
}

/**
 * Connector overlay configuration
 */
export interface ConnectorOverlayConfig {
  overlayLayer: Konva.Layer;
  nodeMap: Map<string, Konva.Node>;
  storeAdapter: ConnectorStoreAdapter;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Connector handle styles configuration
 */
export interface ConnectorHandleStyles {
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  shadow: {
    color: string;
    blur: number;
    offset: { x: number; y: number };
    opacity: number;
  };
  hover: {
    scale: number;
  };
  highlight: {
    stroke: string;
    strokeWidthOffset: number;
  };
}

/**
 * Connector Overlay Manager
 * Manages draggable endpoint handles for selected connectors
 */
export class ConnectorOverlayManager {
  private config: ConnectorOverlayConfig;
  private overlayGroup: Konva.Group | null = null;
  private styles: ConnectorHandleStyles;

  constructor(config: ConnectorOverlayConfig) {
    this.config = config;

    // Initialize overlay group
    this.overlayGroup = new Konva.Group({
      name: 'connector-overlay-group',
      listening: false,  // Critical: must not block events to main layer
      visible: false     // Hidden when no connectors selected
    });
    this.config.overlayLayer.add(this.overlayGroup);

    // Default handle styles
    this.styles = {
      radius: 8,
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2,
      opacity: 0.95,
      shadow: {
        color: 'black',
        blur: 4,
        offset: { x: 1, y: 1 },
        opacity: 0.25
      },
      hover: {
        scale: 1.2
      },
      highlight: {
        stroke: 'rgba(59,130,246,0.35)', // Blue glow semi-transparent
        strokeWidthOffset: 6
      }
    };

    if (this.config.debug?.log) {
      console.info('[ConnectorOverlayManager] Initialized connector overlay system');
    }
  }

  /**
   * Clear all connector overlay UI (highlight + handles)
   */
  clearConnectorOverlay(): void {
    if (!this.overlayGroup) return;

    if (this.config.debug?.log) {
      console.info('[ConnectorOverlayManager] Clearing connector overlay');
    }

    // Keep the overlay group as singleton, just hide it and clear children
    this.overlayGroup.visible(false); // Hide when no connectors selected
    this.overlayGroup.destroyChildren(); // Clear all children

    // Clean up any orphaned nodes outside the group
    const existingHighlights = this.config.overlayLayer.find('.edge-highlight');
    existingHighlights.forEach(node => {
      if (node.parent !== this.overlayGroup) {
        node.destroy();
      }
    });

    const existingHandles = this.config.overlayLayer.find('.edge-handle');
    existingHandles.forEach(node => {
      if (node.parent !== this.overlayGroup) {
        node.destroy();
      }
    });

    // Force immediate redraw to ensure cleanup is visible
    this.config.overlayLayer.batchDraw();
  }

  /**
   * Render connector handles for selected connectors
   * @param connectorIds - Array of connector element IDs to render handles for
   */
  renderConnectorHandles(connectorIds: ElementId[]): void {
    if (!this.overlayGroup) return;

    if (this.config.debug?.log) {
      console.info(`[ConnectorOverlayManager] Rendering handles for ${connectorIds.length} connectors`);
    }

    // Clear children but keep the singleton group
    this.overlayGroup.destroyChildren();
    // Show overlay group when connectors are selected
    this.overlayGroup.visible(connectorIds.length > 0);

    // Read draft from store once
    let draft: any = null;
    try {
      draft = this.config.storeAdapter.getDraft();
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[ConnectorOverlayManager] Failed to get draft from store:', error);
      }
    }

    connectorIds.forEach((id) => {
      const connectorNode = this.config.nodeMap.get(String(id)) as Konva.Line | Konva.Arrow | undefined;
      if (!connectorNode) return;

      // Get connector points from store (draft-first if available)
      const points = this.getConnectorPoints(String(id), draft);
      if (!points || points.length < 4) return;

      const startPoint = { x: points[0], y: points[1] };
      const endPoint = { x: points[2], y: points[3] };
      const strokeWidth = connectorNode.strokeWidth();

      // Create selection highlight (blue glow behind the connector)
      this.createHighlight(points, strokeWidth);

      // Create draggable handles for endpoints
      const sourceHandle = this.createConnectorHandle(startPoint, String(id), 'start');
      this.overlayGroup?.add(sourceHandle);

      const targetHandle = this.createConnectorHandle(endPoint, String(id), 'end');
      this.overlayGroup?.add(targetHandle);
    });

    // Trigger overlay redraw
    if (this.config.scheduleDraw) {
      this.config.scheduleDraw('overlay');
    }
  }

  /**
   * Check if overlay has active connectors
   */
  hasActiveConnectors(): boolean {
    return this.overlayGroup?.visible() === true && this.overlayGroup.hasChildren();
  }

  /**
   * Update handle styles
   */
  updateStyles(styles: Partial<ConnectorHandleStyles>): void {
    this.styles = { ...this.styles, ...styles };
  }

  /**
   * Destroy overlay manager and cleanup resources
   */
  destroy(): void {
    this.clearConnectorOverlay();
    if (this.overlayGroup) {
      this.overlayGroup.destroy();
      this.overlayGroup = null;
    }
  }

  // Private helper methods

  /**
   * Get connector points from store with draft support
   */
  private getConnectorPoints(connectorId: string, draft: any): number[] | null {
    let points: number[] | null = null;

    // First try to get from store
    try {
      const element = this.config.storeAdapter.getElement(connectorId as ElementId);
      if (element && (element.type === 'connector' || element.type === 'edge')) {
        if (Array.isArray(element.points) && element.points.length >= 4) {
          points = [...element.points];
        } else if (element.startPoint && element.endPoint) {
          points = [element.startPoint.x, element.startPoint.y, element.endPoint.x, element.endPoint.y];
        }
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[ConnectorOverlayManager] Failed to get connector points from store:', error);
      }
    }

    // If a draft exists for this connector, prefer draft points
    if ((!points || points.length < 4) && draft) {
      if (draft.edgeId === connectorId || (draft.from && draft.toWorld)) {
        try {
          const element = this.config.storeAdapter.getElement(draft.from?.elementId);
          if (element && draft.toWorld) {
            points = [draft.toWorld.x, draft.toWorld.y, draft.toWorld.x + 1, draft.toWorld.y + 1];
          }
        } catch (error) {
          if (this.config.debug?.log) {
            console.warn('[ConnectorOverlayManager] Failed to get draft points:', error);
          }
        }
      }
    }

    return points;
  }

  /**
   * Create selection highlight for connector
   */
  private createHighlight(points: number[], strokeWidth: number): void {
    if (!this.overlayGroup) return;

    const highlight = new Konva.Line({
      points,
      stroke: this.styles.highlight.stroke,
      strokeWidth: strokeWidth + this.styles.highlight.strokeWidthOffset,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false, // Critical: must not steal events
      strokeScaleEnabled: false, // Consistent width under zoom
      name: 'edge-highlight'
    });

    this.overlayGroup.add(highlight);
  }

  /**
   * Create draggable connector handle with proper event handling
   */
  private createConnectorHandle(
    position: { x: number; y: number }, 
    connectorId: string, 
    endpoint: 'start' | 'end'
  ): Konva.Circle {
    const handle = new Konva.Circle({
      x: position.x,
      y: position.y,
      radius: this.styles.radius,
      fill: this.styles.fill,
      stroke: this.styles.stroke,
      strokeWidth: this.styles.strokeWidth,
      opacity: this.styles.opacity,
      shadowColor: this.styles.shadow.color,
      shadowBlur: this.styles.shadow.blur,
      shadowOffset: this.styles.shadow.offset,
      shadowOpacity: this.styles.shadow.opacity,
      listening: true,
      draggable: true,
      name: 'edge-handle'
    });

    // Set up event handlers
    this.setupHandleEvents(handle, connectorId, endpoint);

    return handle;
  }

  /**
   * Set up event handlers for connector handle
   */
  private setupHandleEvents(handle: Konva.Circle, connectorId: string, endpoint: 'start' | 'end'): void {
    // Mouse enter - scale up and change cursor
    handle.on('mouseenter', (e) => {
      const scale = this.styles.hover.scale;
      e.target.scale({ x: scale, y: scale });
      
      const stage = e.target.getStage();
      if (stage?.container()) {
        stage.container().style.cursor = 'grab';
      }
      
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('overlay');
      }
    });

    // Mouse leave - scale back and reset cursor
    handle.on('mouseleave', (e) => {
      e.target.scale({ x: 1, y: 1 });
      
      const stage = e.target.getStage();
      if (stage?.container()) {
        stage.container().style.cursor = '';
      }
      
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('overlay');
      }
    });

    // Drag start - take snapshot and begin endpoint drag
    handle.on('dragstart', (e) => {
      e.cancelBubble = true;

      if (this.config.debug?.log) {
        console.info(`[ConnectorOverlayManager] Starting drag for ${endpoint} endpoint of connector ${connectorId}`);
      }

      try {
        // Take a history snapshot
        this.config.storeAdapter.saveSnapshot();
        
        // Begin endpoint drag in store
        this.config.storeAdapter.beginEndpointDrag(connectorId as ElementId, endpoint);
      } catch (error) {
        console.error('[ConnectorOverlayManager] Failed to start endpoint drag:', error);
      }
    });

    // Drag move - update position and preview
    handle.on('dragmove', (e) => {
      e.cancelBubble = true;

      try {
        // Get current drag position in overlay layer coordinates
        const dragPos = e.target.getAbsolutePosition();
        const localPos = this.config.overlayLayer.getAbsoluteTransform().copy().invert().point(dragPos);

        // Update store with new position (preview)
        this.config.storeAdapter.updateEndpointDrag(localPos);

        // Preview-only visual updates
        this.updateConnectorPreview(connectorId, endpoint, localPos);

        // Move the handle itself to the new position (within overlay layer)
        e.target.position(localPos);

        if (this.config.scheduleDraw) {
          this.config.scheduleDraw('main');
          this.config.scheduleDraw('overlay');
        }
      } catch (error) {
        console.error('[ConnectorOverlayManager] Failed to update drag position:', error);
      }
    });

    // Drag end - commit changes and re-sync selection
    handle.on('dragend', (e) => {
      e.cancelBubble = true;

      if (this.config.debug?.log) {
        console.info(`[ConnectorOverlayManager] Ending drag for ${endpoint} endpoint of connector ${connectorId}`);
      }

      try {
        // Commit to store first
        this.config.storeAdapter.commitEndpointDrag();

        // Re-sync selection overlay at the new position
        const selectedIds = this.config.storeAdapter.getSelectedElementIds();
        this.renderConnectorHandles(Array.from(selectedIds));
      } catch (error) {
        console.error('[ConnectorOverlayManager] Failed to end endpoint drag:', error);
      }
    });
  }

  /**
   * Update connector visual preview during drag
   */
  private updateConnectorPreview(connectorId: string, endpoint: 'start' | 'end', localPos: { x: number; y: number }): void {
    const connectorNode = this.config.nodeMap.get(connectorId) as Konva.Line | Konva.Arrow | undefined;
    if (!connectorNode) return;

    const currentPoints = connectorNode.points();
    if (currentPoints.length >= 4) {
      let previewPoints: number[];
      if (endpoint === 'start') {
        previewPoints = [localPos.x, localPos.y, currentPoints[2], currentPoints[3]];
      } else {
        previewPoints = [currentPoints[0], currentPoints[1], localPos.x, localPos.y];
      }
      connectorNode.points([...previewPoints]);
    }
  }
}
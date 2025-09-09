/**
 * Renderer Core - Central Orchestration System
 * Handles initialization, lifecycle management, node registry, and system coordination
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';

/**
 * Layer configuration for the renderer
 */
export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

/**
 * Update element callback signature
 */
export type UpdateElementCallback = (id: string, updates: any, options?: { skipHistory?: boolean }) => void;

/**
 * Renderer core configuration
 */
export interface RendererCoreConfig {
  stage: Konva.Stage;
  layers?: RendererLayers;
  onUpdateElement?: UpdateElementCallback;
  enablePerformanceTracking?: boolean;
  spatialIndexing?: boolean;
  debug?: {
    log?: boolean;
    logPerformance?: boolean;
  };
}

/**
 * Node registry entry metadata
 */
interface NodeRegistryEntry {
  node: Konva.Node;
  elementId: ElementId;
  elementType: string;
  createdAt: number;
  lastUpdated: number;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  nodesCreated: number;
  nodesDestroyed: number;
  syncOperations: number;
  lastSyncDuration: number;
  totalMemoryUsage: number;
}

/**
 * System lifecycle states
 */
export enum RendererLifecycleState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
}

/**
 * Renderer Core Class
 * Central orchestration system for the modular canvas renderer
 */
export class RendererCore {
  private config: RendererCoreConfig;
  private stage?: Konva.Stage;
  private layers?: RendererLayers;
  private nodeRegistry: Map<string, NodeRegistryEntry>;
  private updateElementCallback?: UpdateElementCallback;
  private lifecycleState: RendererLifecycleState;
  private spatialIndex?: any; // QuadTree or similar spatial index
  private performanceMetrics: PerformanceMetrics;
  private cleanupTasks: (() => void)[];

  constructor(config: RendererCoreConfig) {
    this.config = config;
    this.nodeRegistry = new Map();
    this.lifecycleState = RendererLifecycleState.UNINITIALIZED;
    this.cleanupTasks = [];
    this.performanceMetrics = {
      nodesCreated: 0,
      nodesDestroyed: 0,
      syncOperations: 0,
      lastSyncDuration: 0,
      totalMemoryUsage: 0,
    };

    if (this.config.debug?.log) {
      console.info('[RendererCore] Renderer core created');
    }
  }

  /**
   * Initialize the renderer core system
   */
  async init(): Promise<void> {
    if (this.lifecycleState !== RendererLifecycleState.UNINITIALIZED) {
      throw new Error(`Cannot initialize renderer in state: ${this.lifecycleState}`);
    }

    this.lifecycleState = RendererLifecycleState.INITIALIZING;

    try {
      // Set up stage reference
      this.stage = this.config.stage;
      if (!this.stage) {
        throw new Error('Stage is required for renderer initialization');
      }

      // Initialize layers
      await this.initializeLayers();

      // Set up update callback
      this.updateElementCallback = this.config.onUpdateElement;

      // Initialize spatial indexing if enabled
      if (this.config.spatialIndexing) {
        await this.initializeSpatialIndex();
      }

      // Set up performance tracking
      if (this.config.enablePerformanceTracking) {
        this.initializePerformanceTracking();
      }

      this.lifecycleState = RendererLifecycleState.READY;

      if (this.config.debug?.log) {
        console.info('[RendererCore] Renderer core initialized successfully');
      }
    } catch (error) {
      this.lifecycleState = RendererLifecycleState.UNINITIALIZED;
      console.error('[RendererCore] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize layer system
   */
  private async initializeLayers(): Promise<void> {
    if (this.config.layers) {
      // Use provided layers
      this.layers = this.config.layers;
    } else if (this.stage) {
      // Auto-discover layers from stage
      const background = this.stage.findOne<Konva.Layer>('.background-layer');
      const main = this.stage.findOne<Konva.Layer>('.main-layer');
      const preview = this.stage.findOne<Konva.Layer>('.preview-layer') || 
                     this.stage.findOne<Konva.Layer>('.preview-fast-layer');
      const overlay = this.stage.findOne<Konva.Layer>('.overlay-layer');

      if (!background || !main || !overlay) {
        console.warn('[RendererCore] Missing required layers; creating fallbacks');
      }

      this.layers = {
        background: background || this.createLayer('background-layer', false),
        main: main || this.createLayer('main-layer', true),
        preview: (preview as Konva.Layer) || this.createLayer('preview-fast-layer', false),
        overlay: overlay || this.createLayer('overlay-layer', true),
      };

      // Add created layers to stage
      if (!background) this.stage.add(this.layers.background);
      if (!main) this.stage.add(this.layers.main);
      if (!preview) this.stage.add(this.layers.preview);
      if (!overlay) this.stage.add(this.layers.overlay);
    }

    // Ensure proper layer ordering
    this.ensureLayerOrdering();

    if (this.config.debug?.log) {
      console.info('[RendererCore] Layers initialized:', {
        background: !!this.layers?.background,
        main: !!this.layers?.main,
        preview: !!this.layers?.preview,
        overlay: !!this.layers?.overlay,
      });
    }
  }

  /**
   * Create a layer with standard configuration
   */
  private createLayer(name: string, listening: boolean): Konva.Layer {
    return new Konva.Layer({
      name,
      listening,
      hitGraphEnabled: listening, // Enable hit detection only for interactive layers
    });
  }

  /**
   * Ensure layers are in correct z-order
   */
  private ensureLayerOrdering(): void {
    if (!this.stage || !this.layers) return;

    // Proper layer ordering: background -> main -> preview -> overlay
    this.layers.background.moveToBottom();
    this.layers.main.moveUp();
    this.layers.preview.moveUp();
    this.layers.overlay.moveToTop();
  }

  /**
   * Initialize spatial indexing system
   */
  private async initializeSpatialIndex(): Promise<void> {
    // Would integrate with QuadTree or similar spatial indexing
    // For now, just placeholder for future implementation
    this.spatialIndex = {
      insert: (bounds: any, node: Konva.Node) => { /* TODO */ },
      remove: (node: Konva.Node) => { /* TODO */ },
      query: (bounds: any) => { /* TODO */ },
      clear: () => { /* TODO */ },
    };

    if (this.config.debug?.log) {
      console.info('[RendererCore] Spatial indexing initialized');
    }
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    // Set up performance observers and metrics collection
    const startTime = performance.now();
    
    this.cleanupTasks.push(() => {
      if (this.config.debug?.logPerformance) {
        const totalTime = performance.now() - startTime;
        console.info('[RendererCore] Performance metrics:', {
          ...this.performanceMetrics,
          totalRenderTime: totalTime,
          averageSyncTime: this.performanceMetrics.syncOperations > 0 ? 
            this.performanceMetrics.lastSyncDuration / this.performanceMetrics.syncOperations : 0,
        });
      }
    });
  }

  /**
   * Register a node in the node registry
   */
  registerNode(elementId: ElementId, node: Konva.Node, elementType: string): void {
    this.ensureReady();
    
    const nodeId = String(elementId);
    const now = Date.now();
    
    // Remove existing node if present
    if (this.nodeRegistry.has(nodeId)) {
      this.unregisterNode(elementId);
    }

    // Register new node
    const entry: NodeRegistryEntry = {
      node,
      elementId,
      elementType,
      createdAt: now,
      lastUpdated: now,
    };

    this.nodeRegistry.set(nodeId, entry);
    this.performanceMetrics.nodesCreated++;

    // Add to spatial index if enabled
    if (this.spatialIndex && node.getClientRect) {
      try {
        const bounds = node.getClientRect();
        this.spatialIndex.insert(bounds, node);
      } catch (error) {
        if (this.config.debug?.log) {
          console.warn('[RendererCore] Failed to add node to spatial index:', error);
        }
      }
    }

    if (this.config.debug?.log) {
      console.debug(`[RendererCore] Registered node ${nodeId} (${elementType})`);
    }
  }

  /**
   * Unregister a node from the registry
   */
  unregisterNode(elementId: ElementId): boolean {
    const nodeId = String(elementId);
    const entry = this.nodeRegistry.get(nodeId);
    
    if (!entry) {
      return false;
    }

    // Remove from spatial index
    if (this.spatialIndex) {
      try {
        this.spatialIndex.remove(entry.node);
      } catch (error) {
        if (this.config.debug?.log) {
          console.warn('[RendererCore] Failed to remove node from spatial index:', error);
        }
      }
    }

    // Destroy the node
    try {
      entry.node.destroy();
      this.performanceMetrics.nodesDestroyed++;
    } catch (error) {
      console.warn(`[RendererCore] Failed to destroy node ${nodeId}:`, error);
    }

    // Remove from registry
    this.nodeRegistry.delete(nodeId);

    if (this.config.debug?.log) {
      console.debug(`[RendererCore] Unregistered node ${nodeId}`);
    }

    return true;
  }

  /**
   * Get a node from the registry
   */
  getNode(elementId: ElementId): Konva.Node | undefined {
    const entry = this.nodeRegistry.get(String(elementId));
    return entry?.node;
  }

  /**
   * Get node registry entry with metadata
   */
  getNodeEntry(elementId: ElementId): NodeRegistryEntry | undefined {
    return this.nodeRegistry.get(String(elementId));
  }

  /**
   * Update node registry entry metadata
   */
  updateNodeMetadata(elementId: ElementId, updates: Partial<Pick<NodeRegistryEntry, 'elementType' | 'lastUpdated'>>): void {
    const entry = this.nodeRegistry.get(String(elementId));
    if (entry) {
      Object.assign(entry, updates);
      if (!updates.lastUpdated) {
        entry.lastUpdated = Date.now();
      }
    }
  }

  /**
   * Get all nodes by type
   */
  getNodesByType(elementType: string): Konva.Node[] {
    const nodes: Konva.Node[] = [];
    this.nodeRegistry.forEach((entry) => {
      if (entry.elementType === elementType) {
        nodes.push(entry.node);
      }
    });
    return nodes;
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalNodes: number;
    nodesByType: Record<string, number>;
    memoryUsage: number;
    oldestNode: number | null;
    newestNode: number | null;
  } {
    const nodesByType: Record<string, number> = {};
    let oldestNode: number | null = null;
    let newestNode: number | null = null;

    this.nodeRegistry.forEach((entry) => {
      nodesByType[entry.elementType] = (nodesByType[entry.elementType] || 0) + 1;
      
      if (oldestNode === null || entry.createdAt < oldestNode) {
        oldestNode = entry.createdAt;
      }
      
      if (newestNode === null || entry.createdAt > newestNode) {
        newestNode = entry.createdAt;
      }
    });

    return {
      totalNodes: this.nodeRegistry.size,
      nodesByType,
      memoryUsage: this.performanceMetrics.totalMemoryUsage,
      oldestNode,
      newestNode,
    };
  }

  /**
   * Synchronize elements with the renderer
   */
  syncElements(elements: Map<ElementId, CanvasElement> | CanvasElement[]): void {
    this.ensureReady();
    
    const startTime = performance.now();
    this.performanceMetrics.syncOperations++;

    try {
      if (Array.isArray(elements)) {
        elements.forEach((element) => {
          this.syncSingleElement(element);
        });
      } else {
        elements.forEach((element) => {
          this.syncSingleElement(element);
        });
      }

      this.performanceMetrics.lastSyncDuration = performance.now() - startTime;

      if (this.config.debug?.logPerformance) {
        console.debug(`[RendererCore] Sync completed in ${this.performanceMetrics.lastSyncDuration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('[RendererCore] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Synchronize a single element (to be implemented by subclasses or delegated)
   */
  private syncSingleElement(element: CanvasElement): void {
    // This would delegate to the appropriate element factory/renderer
    // For now, just placeholder to maintain the interface
    if (this.config.debug?.log) {
      console.debug(`[RendererCore] Syncing element ${element.id} (${element.type})`);
    }
  }

  /**
   * Clear all nodes from registry
   */
  clearAllNodes(): void {
    if (this.config.debug?.log) {
      console.info(`[RendererCore] Clearing ${this.nodeRegistry.size} nodes`);
    }

    this.nodeRegistry.forEach((entry, nodeId) => {
      try {
        entry.node.destroy();
        this.performanceMetrics.nodesDestroyed++;
      } catch (error) {
        console.warn(`[RendererCore] Failed to destroy node ${nodeId}:`, error);
      }
    });

    this.nodeRegistry.clear();

    // Clear spatial index
    if (this.spatialIndex) {
      this.spatialIndex.clear();
    }
  }

  /**
   * Get layer references
   */
  getLayers(): RendererLayers | undefined {
    return this.layers;
  }

  /**
   * Get stage reference
   */
  getStage(): Konva.Stage | undefined {
    return this.stage;
  }

  /**
   * Get current lifecycle state
   */
  getLifecycleState(): RendererLifecycleState {
    return this.lifecycleState;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RendererCoreConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.onUpdateElement) {
      this.updateElementCallback = newConfig.onUpdateElement;
    }

    if (this.config.debug?.log) {
      console.info('[RendererCore] Configuration updated');
    }
  }

  /**
   * Check if renderer is ready
   */
  isReady(): boolean {
    return this.lifecycleState === RendererLifecycleState.READY;
  }

  /**
   * Ensure renderer is in ready state
   */
  private ensureReady(): void {
    if (!this.isReady()) {
      throw new Error(`Renderer not ready. Current state: ${this.lifecycleState}`);
    }
  }

  /**
   * Destroy the renderer core
   */
  async destroy(): Promise<void> {
    if (this.lifecycleState === RendererLifecycleState.DESTROYED) {
      return; // Already destroyed
    }

    this.lifecycleState = RendererLifecycleState.DESTROYING;

    try {
      // Run cleanup tasks
      this.cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.warn('[RendererCore] Cleanup task failed:', error);
        }
      });
      this.cleanupTasks.length = 0;

      // Clear all nodes
      this.clearAllNodes();

      // Clear spatial index
      if (this.spatialIndex) {
        this.spatialIndex.clear();
        this.spatialIndex = undefined;
      }

      // Clear references
      this.stage = undefined;
      this.layers = undefined;
      this.updateElementCallback = undefined;

      this.lifecycleState = RendererLifecycleState.DESTROYED;

      if (this.config.debug?.log) {
        console.info('[RendererCore] Renderer core destroyed');
      }
    } catch (error) {
      console.error('[RendererCore] Destruction failed:', error);
      throw error;
    }
  }
}

/**
 * Utility function to create a renderer core with common configuration
 */
export function createRendererCore(
  stage: Konva.Stage,
  options?: {
    layers?: RendererLayers;
    onUpdateElement?: UpdateElementCallback;
    enablePerformanceTracking?: boolean;
    spatialIndexing?: boolean;
    debug?: boolean;
  }
): RendererCore {
  const config: RendererCoreConfig = {
    stage,
    layers: options?.layers,
    onUpdateElement: options?.onUpdateElement,
    enablePerformanceTracking: options?.enablePerformanceTracking || false,
    spatialIndexing: options?.spatialIndexing || false,
    debug: { 
      log: options?.debug || false,
      logPerformance: options?.debug || false,
    },
  };

  return new RendererCore(config);
}
/**
 * Canvas Renderer V2 - Orchestrator
 * Main renderer that coordinates all modules
 */

import Konva from 'konva';
import type { StoreApi } from 'zustand';

// Import all modules
import { LayerManager } from './layers';
import { NodeFactory } from './nodes';
import { TransformerController } from './transform';
import { EditorOverlay } from './editor/overlay';
import { TextMeasurement } from './editor/measure';
import { TweenManager, animateValue } from './tween';
import { StoreAdapter, type Store } from './store-adapter';
import { calculateAutoGrowRadius } from './text-layout';
import { CircleTextContract } from './circle-text-contract';
import type { 
  ElementId, 
  CanvasElement, 
  RendererConfig,
  RendererLayers,
  CircleElement 
} from './types';

export * from './types';
export * from './geometry';
export * from './text-layout';

/**
 * Main Canvas Renderer Orchestrator
 */
export class CanvasRenderer {
  // Core modules
  private layers: LayerManager;
  private nodes: NodeFactory;
  private transformer: TransformerController;
  private editor: EditorOverlay;
  private measurement: TextMeasurement;
  private tweens: TweenManager;
  private store: StoreAdapter;
  private circleContract: CircleTextContract;

  // State
  private stage: Konva.Stage | null = null;
  private config: RendererConfig;
  private rafId: number = 0;
  private isDisposed: boolean = false;

  // Event callbacks
  private onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  private onSelectionChange?: (ids: ElementId[]) => void;

  constructor(config: RendererConfig = {}) {
    this.config = {
      autoFitDuringTyping: false,
      editorClipEnabled: true,
      enableAccessibility: false,
      enablePerformanceMonitoring: false,
      maxFps: 60,
      minHitAreaSize: 40,
      ...config
    };

    // Initialize modules
    this.layers = new LayerManager({
      enableGrid: true,
      gridSize: 20
    });

    this.nodes = new NodeFactory({
      enablePooling: true,
      maxPoolSize: 50,
      minHitAreaSize: this.config.minHitAreaSize
    });

    this.transformer = new TransformerController();

    this.editor = new EditorOverlay({
      autoFitDuringTyping: this.config.autoFitDuringTyping,
      editorClipEnabled: this.config.editorClipEnabled
    });

    this.measurement = new TextMeasurement({
      maxIterations: 5,
      convergenceThreshold: 0.5
    });

    this.tweens = new TweenManager();
    this.store = new StoreAdapter();
    
    this.circleContract = new CircleTextContract({ padPx: 8 });
  }

  /**
   * Mount renderer to a Konva stage
   */
  mount(stage: Konva.Stage, store?: StoreApi<Store>): void {
    if (this.isDisposed) {
      throw new Error('Cannot mount disposed renderer');
    }

    this.stage = stage;

    // Initialize layers
    const layers = this.layers.init(stage);

    // Initialize transformer
    this.transformer.init(layers.overlay);
    this.transformer.setCallbacks({
      onTransformEnd: (event) => this.handleTransformEnd(event)
    });

    // Set up editor container
    const container = this.ensureOverlayRoot();
    if (container) {
      this.editor.setContainer(container);
      this.editor.setCallbacks({
        onInput: (id, text) => this.handleTextInput(id, text),
        onBlur: (id) => this.handleEditorBlur(id)
      });
    }

    // Connect store if provided
    if (store) {
      this.store.connect(store);
      this.setupStoreSubscriptions();
    }

    // Set up stage event handlers
    this.setupEventHandlers();
  }

  /**
   * Sync elements from store to renderer
   */
  sync(elements: CanvasElement[]): void {
    if (!this.stage) return;

    const mainLayer = this.layers.get('main');
    if (!mainLayer) return;

    // Create a map of existing nodes
    const existingNodes = new Map<ElementId, Konva.Node>();
    mainLayer.children.forEach(node => {
      if (node.id()) {
        existingNodes.set(node.id() as ElementId, node);
      }
    });

    // Update or create nodes
    elements.forEach(element => {
      const existingNode = existingNodes.get(element.id);
      
      if (existingNode) {
        // Update existing node
        this.nodes.update(existingNode, element);
        
        // Apply circle text sync if it's a circle
        if (element.type === 'circle' && existingNode instanceof Konva.Group) {
          this.syncCircleText(element as CircleElement, existingNode);
        }
        
        existingNodes.delete(element.id);
      } else {
        // Create new node
        const newNode = this.nodes.create(element);
        mainLayer.add(newNode);
        
        // Apply circle text sync if it's a circle
        if (element.type === 'circle' && newNode instanceof Konva.Group) {
          this.syncCircleText(element as CircleElement, newNode);
        }
      }
    });

    // Remove nodes that no longer exist
    existingNodes.forEach(node => {
      this.nodes.release(node);
      node.destroy();
    });

    // Batch draw
    this.layers.batchDraw(['main']);
  }

  /**
   * Open text editor for an element
   */
  openEditor(elementId: ElementId): void {
    const element = this.store.get(elementId);
    if (!element) return;

    const node = this.nodes.get(elementId);
    if (!node) return;

    // Close any existing editor
    this.closeEditor();

    // Mount editor overlay
    const mount = this.editor.mount(element, node as Konva.Group);
    if (!mount) return;

    // Hide Konva text while editing
    if (element.type === 'circle') {
      const text = (node as Konva.Group).findOne('Text');
      if (text) text.visible(false);
    }

    // Start auto-grow for circles if enabled
    if (element.type === 'circle' && this.config.autoFitDuringTyping) {
      this.startAutoGrow(elementId);
    }
  }

  /**
   * Close current editor
   */
  closeEditor(): void {
    const state = this.editor.getState();
    if (state.isActive && state.elementId) {
      // Show Konva text again
      const node = this.nodes.get(state.elementId);
      if (node) {
        const text = (node as Konva.Group).findOne('Text');
        if (text) text.visible(true);
      }
    }

    this.editor.unmount();
  }

  /**
   * Update selection
   */
  syncSelection(elementIds: ElementId[]): void {
    if (elementIds.length === 0) {
      this.transformer.detach();
    } else {
      const nodes = elementIds
        .map(id => this.nodes.get(id))
        .filter((node): node is Konva.Node => node !== undefined);
      
      if (nodes.length > 0) {
        // Update transformer for element type
        if (nodes.length === 1) {
          const element = this.store.get(elementIds[0]);
          if (element) {
            this.transformer.updateForElement(element);
          }
        }
        
        this.transformer.attach(nodes);
      }
    }
  }

  /**
   * Perform animation frame tick
   */
  tick(): void {
    // Process any pending updates
    this.processPendingUpdates();
  }

  /**
   * Handle text input from editor
   */
  private handleTextInput(elementId: ElementId, text: string): void {
    const element = this.store.get(elementId);
    if (!element) return;

    // Update store
    this.store.update(elementId, { text } as any);

    // Auto-grow for circles
    if (element.type === 'circle' && this.config.autoFitDuringTyping) {
      this.updateCircleRadius(elementId, text);
    }

    // Trigger callback
    this.onElementUpdate?.(elementId, { text } as any);
  }

  /**
   * Handle editor blur
   */
  private handleEditorBlur(elementId: ElementId): void {
    // Final update
    const state = this.editor.getState();
    if (state.text) {
      this.store.update(elementId, { text: state.text } as any);
      this.onElementUpdate?.(elementId, { text: state.text } as any);
    }

    this.closeEditor();
  }

  /**
   * Handle transform end
   */
  private handleTransformEnd(event: any): void {
    const { elementId, newAttrs } = event;
    
    // Update store with new attributes
    this.store.update(elementId, newAttrs);
    
    // Trigger callback
    this.onElementUpdate?.(elementId, newAttrs);
  }

  /**
   * Start auto-grow for circle
   */
  private startAutoGrow(elementId: ElementId): void {
    const element = this.store.get(elementId) as CircleElement;
    if (!element || element.type !== 'circle') return;

    // Subscribe to text changes
    const unsubscribe = this.store.subscribeToElement(elementId, (el) => {
      if (el && el.type === 'circle' && el.text) {
        this.updateCircleRadius(elementId, el.text);
      }
    });

    // Store unsubscribe for cleanup
    // (In real implementation, manage this properly)
  }

  /**
   * Update circle radius for auto-grow
   */
  private updateCircleRadius(elementId: ElementId, text: string): void {
    const element = this.store.get(elementId) as CircleElement;
    if (!element || element.type !== 'circle') return;

    const node = this.nodes.get(elementId) as Konva.Group;
    if (!node) return;

    // Measure required radius
    const result = this.measurement.measureForAutoGrow(
      text,
      element.radius,
      element.fontSize || 14,
      element.fontFamily || 'Inter, system-ui, sans-serif',
      element.padding || 8
    );

    if (result.requiredRadius === element.radius) return;

    // Get text node
    const textNode = node.findOne('Text') as Konva.Text;
    const ellipse = node.findOne('Ellipse') as Konva.Ellipse;
    
    if (ellipse) {
      // Calculate sync during animation
      this.tweens.tweenRadius(
        ellipse,
        element.radius,
        result.requiredRadius,
        {
          duration: 150,
          onUpdate: (radius) => {
            // Update element with new radius for sync calculation
            const updatedElement = { ...element, radius } as CircleElement;
            
            // Calculate sync parameters
            const syncResult = this.circleContract.calculate(updatedElement, node);
            
            // Apply to Konva text (with baseline offset)
            if (textNode && !textNode.visible()) {
              // Text is hidden during editing, but update its properties
              this.circleContract.applyToKonva(textNode, syncResult);
            }
            
            // Update editor overlay with same dimensions
            this.editor.update(updatedElement, node);
            
            // Verify sync in debug mode
            if ((window as any).__CANVAS_TEXT_DEBUG__) {
              this.circleContract.verify(syncResult);
            }
          },
          onComplete: () => {
            // Commit to store
            this.store.update(elementId, { radius: result.requiredRadius });
            this.onElementUpdate?.(elementId, { radius: result.requiredRadius });
          }
        }
      );
    }
  }

  /**
   * Sync circle text using contract
   */
  private syncCircleText(element: CircleElement, node: Konva.Group): void {
    const textNode = node.findOne('Text') as Konva.Text;
    if (!textNode) return;

    // Calculate measurements using contract
    const measurement = this.circleContract.calculate(element, node);
    
    // Apply to Konva text (left+top aligned)
    this.circleContract.applyToKonva(textNode, measurement);
    
    // Debug verification
    if ((window as any).__CANVAS_TEXT_DEBUG__) {
      this.circleContract.verify(measurement);
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.stage) return;

    // Double-click to edit
    this.layers.listenTo('dblclick', (e) => {
      const target = e.target;
      if (target && target.id()) {
        this.openEditor(target.id() as ElementId);
      }
    });

    // Click to select
    this.layers.listenTo('click', (e) => {
      const target = e.target;
      if (target && target.id()) {
        const elementId = target.id() as ElementId;
        this.store.setSelectedIds([elementId]);
        this.onSelectionChange?.([elementId]);
      }
    });

    // Drag events
    this.layers.listenTo('dragstart', () => {
      this.store.setDragging(true);
    });

    this.layers.listenTo('dragend', (e) => {
      this.store.setDragging(false);
      const target = e.target;
      if (target && target.id()) {
        const elementId = target.id() as ElementId;
        this.store.update(elementId, {
          x: target.x(),
          y: target.y()
        });
        this.onElementUpdate?.(elementId, {
          x: target.x(),
          y: target.y()
        });
      }
    });
  }

  /**
   * Set up store subscriptions
   */
  private setupStoreSubscriptions(): void {
    // Subscribe to selection changes
    this.store.subscribeToSelection((ids) => {
      this.syncSelection(ids);
    });
  }

  /**
   * Process pending updates
   */
  private processPendingUpdates(): void {
    // Batch draw dirty layers
    this.layers.batchDraw();
  }

  /**
   * Ensure overlay root exists
   */
  private ensureOverlayRoot(): HTMLDivElement | null {
    const stageContainer = this.stage?.container();
    if (!stageContainer) return null;

    let overlayRoot = stageContainer.querySelector('.canvas-overlay-root') as HTMLDivElement;
    if (!overlayRoot) {
      overlayRoot = document.createElement('div');
      overlayRoot.className = 'canvas-overlay-root';
      overlayRoot.style.position = 'absolute';
      overlayRoot.style.top = '0';
      overlayRoot.style.left = '0';
      overlayRoot.style.width = '100%';
      overlayRoot.style.height = '100%';
      overlayRoot.style.pointerEvents = 'none';
      overlayRoot.style.zIndex = '1000';
      stageContainer.appendChild(overlayRoot);
    }

    return overlayRoot;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
    onSelectionChange?: (ids: ElementId[]) => void;
  }): void {
    this.onElementUpdate = callbacks.onElementUpdate;
    this.onSelectionChange = callbacks.onSelectionChange;
  }

  /**
   * Get renderer layers
   */
  getLayers(): RendererLayers | null {
    return this.layers.getAll();
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    (window as any).__CANVAS_TEXT_DEBUG__ = enabled;
    // Note: circleContract doesn't have setDebugMode, debug is via window.__CANVAS_TEXT_DEBUG__
    
    // Remove debug overlay if disabling
    if (!enabled && (window as any).__CANVAS_DEBUG_OVERLAY__) {
      (window as any).__CANVAS_DEBUG_OVERLAY__.remove();
      delete (window as any).__CANVAS_DEBUG_OVERLAY__;
    }
  }

  /**
   * Toggle baseline offset for testing
   */
  toggleBaselineOffset(enabled?: boolean): void {
    // Note: baseline offset is handled internally by the contract
    const newState = enabled !== undefined ? enabled : false;
    
    console.log(`Baseline offset: ${newState ? 'enabled' : 'disabled'}`);
    
    // Re-sync all circles to see the effect
    const elements = this.store.getAll();
    elements.forEach(element => {
      if (element.type === 'circle') {
        const node = this.nodes.get(element.id);
        if (node) {
          this.syncCircleText(element as CircleElement, node as Konva.Group);
        }
      }
    });
    
    this.layers.batchDraw(['main']);
  }

  /**
   * Get debug info for verification
   */
  getDebugInfo(): any {
    const circles = this.store.getAll().filter(el => el.type === 'circle');
    const debugInfo: any[] = [];
    
    circles.forEach(element => {
      const node = this.nodes.get(element.id);
      if (node) {
        const syncResult = this.circleContract.calculate(element as CircleElement, node as Konva.Group);
        debugInfo.push({
          id: element.id,
          radius: (element as CircleElement).radius,
          ...syncResult,
          konvaWidthPx: syncResult.contentWWorld * syncResult.sx,
          diff: Math.abs(syncResult.contentWWorld * syncResult.sx - syncResult.contentWpx)
        });
      }
    });
    
    return debugInfo;
  }

  /**
   * Dispose of renderer
   */
  dispose(): void {
    if (this.isDisposed) return;

    cancelAnimationFrame(this.rafId);
    
    this.editor.dispose();
    this.measurement.dispose();
    this.tweens.dispose();
    this.transformer.dispose();
    this.nodes.dispose();
    this.layers.dispose();
    this.store.disconnect();

    this.stage = null;
    this.isDisposed = true;
  }
}

/**
 * Create a new renderer instance
 */
export function createRenderer(config?: RendererConfig): CanvasRenderer {
  return new CanvasRenderer(config);
}
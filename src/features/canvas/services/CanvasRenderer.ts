/**
 * CanvasRenderer - Modular canvas rendering orchestrator
 * 
 * This is the new lean renderer that replaces the 6000+ line CanvasRendererV2.ts
 * It orchestrates specialized modules for different concerns:
 * - Core: Stage/layer lifecycle
 * - Events: Centralized event handling  
 * - Selection: Transformer and selection management
 * - Elements: Node creation/updating via factory
 * - TextEditor: Text/sticky editing (to be implemented)
 * - DragDrop: Drag operations (to be implemented)
 * - Viewport: Pan/zoom (to be implemented)
 */

import Konva from 'konva';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import { CoreRenderer, RendererLayers } from '../renderer/core';
import { EventManager, EventHandlers } from '../renderer/events';
import { SelectionManager } from '../renderer/selection';
import * as ElementFactoryFunctions from '../renderer/elements/factory';
import { TextEditor, TextEditorConfig } from '../renderer/text-editor';
import { DragDropManager, DragDropConfig } from '../renderer/drag-drop';
import { ViewportManager, ViewportConfig, ViewportState } from '../renderer/viewport';
import { QuadTree } from '../utils/spatial/QuadTree';

export interface CanvasRendererConfig {
  container: HTMLDivElement;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onSelectionChange?: (selectedIds: Set<ElementId>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  textEditor?: Partial<TextEditorConfig>;
  dragDrop?: Partial<DragDropConfig>;
  viewport?: Partial<ViewportConfig>;
}

export class CanvasRenderer {
  // Core modules
  private core: CoreRenderer;
  private events: EventManager;
  private selection: SelectionManager;
  // Element factory functions
  private textEditor: TextEditor;
  private dragDrop: DragDropManager;
  private viewport: ViewportManager;
  
  // State tracking
  private nodeMap = new Map<string, Konva.Node>();
  private elementMap = new Map<ElementId, CanvasElement>();
  private spatial: QuadTree;
  
  // Configuration
  private config: CanvasRendererConfig;
  
  // References for quick access
  private stage: Konva.Stage | null = null;
  private layers: RendererLayers | null = null;

  constructor(config: CanvasRendererConfig) {
    this.config = config;
    
    // Initialize modules
    this.core = new CoreRenderer();
    this.events = new EventManager(this.nodeMap);
    this.selection = new SelectionManager(this.nodeMap);
    // Element factory uses exported functions, not a class
    
    // Initialize text editor
    this.textEditor = new TextEditor({
      onTextCommit: (id, text) => {
        this.config.onElementUpdate?.(id, { text } as any);
      },
      onTextCancel: (id) => {
        // Text editing cancelled - no changes
      },
      ...config.textEditor
    });
    
    // Initialize drag drop
    this.dragDrop = new DragDropManager(this.nodeMap, {
      onDragEnd: (id, position) => {
        this.config.onElementUpdate?.(id, { x: position.x, y: position.y });
      },
      ...config.dragDrop
    });
    
    // Initialize viewport
    this.viewport = new ViewportManager({
      onViewportChange: config.onViewportChange,
      ...config.viewport
    });
    
    this.spatial = new QuadTree({ x: 0, y: 0, width: 10000, height: 10000 }, 10);
  }

  /**
   * Initialize the renderer
   */
  init() {
    // Initialize core (stage and layers)
    const { stage, layers } = this.core.init({
      container: this.config.container,
      onContextMenu: this.config.onContextMenu
    });
    
    this.stage = stage;
    this.layers = layers;

    // Initialize selection manager
    this.selection.init(layers);
    
    // Initialize text editor
    this.textEditor.init(stage);
    
    // Initialize drag drop with drag layer
    const dragLayer = this.core.getDragLayer();
    if (dragLayer) {
      this.dragDrop.init(stage, dragLayer);
    }
    
    // Initialize viewport
    this.viewport.init(stage);

    // Initialize event handlers
    const eventHandlers: EventHandlers = {
      onElementClick: this.handleElementClick.bind(this),
      onElementDblClick: this.handleElementDblClick.bind(this),
      onBackgroundClick: this.handleBackgroundClick.bind(this),
      onDragStart: this.handleDragStart.bind(this),
      onDragMove: this.handleDragMove.bind(this),
      onDragEnd: this.handleDragEnd.bind(this),
      onTransformEnd: this.handleTransformEnd.bind(this),
      onWheel: this.handleWheel.bind(this),
      onKeyDown: this.handleKeyDown.bind(this)
    };
    
    this.events.init(stage, eventHandlers);
  }

  /**
   * Sync elements from state
   */
  syncElements(elements: Map<ElementId, CanvasElement> | CanvasElement[]) {
    // Convert to Map if array
    const elementMap = Array.isArray(elements) 
      ? new Map(elements.map(el => [el.id, el]))
      : elements;

    // Calculate diffs
    const toAdd: CanvasElement[] = [];
    const toUpdate: CanvasElement[] = [];
    const toRemove: ElementId[] = [];

    // Find elements to add or update
    elementMap.forEach((element, id) => {
      if (this.nodeMap.has(id)) {
        toUpdate.push(element);
      } else {
        toAdd.push(element);
      }
    });

    // Find elements to remove
    this.nodeMap.forEach((_, id) => {
      if (!elementMap.has(id as ElementId)) {
        toRemove.push(id as ElementId);
      }
    });

    // Process removals
    toRemove.forEach(id => this.removeElement(id));

    // Process additions
    toAdd.forEach(element => this.createElement(element));

    // Process updates
    toUpdate.forEach(element => this.updateElement(element));

    // Update element map
    this.elementMap = new Map(elementMap);

    // Update spatial index
    this.updateSpatialIndex();

    // Batch draw
    this.core.scheduleDraw('main');
  }

  /**
   * Create a new element
   */
  private createElement(element: CanvasElement) {
    if (!this.layers) return;

    // Create node using factory functions
    let node: Konva.Node | undefined;
    
    const factoryOptions = {
      updateElementCallback: (id: string, updates: any) => {
        this.config.onElementUpdate?.(id as ElementId, updates);
      },
      scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => {
        this.core.scheduleDraw(layer);
      }
    };

    try {
      switch (element.type) {
        case 'rectangle':
          node = ElementFactoryFunctions.createRectangle(element, factoryOptions);
          break;
        case 'circle':
          node = ElementFactoryFunctions.createCircle(element, factoryOptions);
          break;
        case 'text':
          node = ElementFactoryFunctions.createText(element, factoryOptions);
          break;
        case 'sticky-note':
          node = ElementFactoryFunctions.createStickyNote(element, factoryOptions);
          break;
        case 'image':
          node = ElementFactoryFunctions.createImage(element, factoryOptions);
          break;
        case 'table':
          node = ElementFactoryFunctions.createTable(element, factoryOptions);
          break;
        case 'pen':
        case 'marker':
        case 'highlighter':
          node = ElementFactoryFunctions.createLine(element, factoryOptions);
          break;
        default:
          console.warn(`Unknown element type: ${element.type}`);
          return;
      }
    } catch (error) {
      console.error(`Failed to create element ${element.id}:`, error);
      return;
    }

    if (!node) return;

    // Add to appropriate layer
    const layer = this.getLayerForElement(element);
    layer.add(node);

    // Track in maps
    this.nodeMap.set(element.id, node);
    
    // Store element type for event handling
    node.setAttr('elementType', element.type);
    node.setAttr('elementId', element.id);
  }

  /**
   * Update an existing element
   */
  private updateElement(element: CanvasElement) {
    const node = this.nodeMap.get(element.id);
    if (!node) return;

    const factoryOptions = {
      updateElementCallback: (id: string, updates: any) => {
        this.config.onElementUpdate?.(id as ElementId, updates);
      },
      scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => {
        this.core.scheduleDraw(layer);
      }
    };

    try {
      switch (element.type) {
        case 'rectangle':
          ElementFactoryFunctions.updateRectangle(node as Konva.Group, element, factoryOptions);
          break;
        case 'circle':
          ElementFactoryFunctions.updateCircle(node as Konva.Group, element, factoryOptions);
          break;
        case 'text':
          ElementFactoryFunctions.updateText(node as Konva.Group, element, factoryOptions);
          break;
        case 'sticky-note':
          ElementFactoryFunctions.updateStickyNote(node as Konva.Group, element, factoryOptions);
          break;
        case 'image':
          ElementFactoryFunctions.updateImage(node as Konva.Group, element, factoryOptions);
          break;
        case 'table':
          ElementFactoryFunctions.updateTable(node as Konva.Group, element, factoryOptions);
          break;
        case 'pen':
        case 'marker':
        case 'highlighter':
          ElementFactoryFunctions.updateLine(node as Konva.Line, element, factoryOptions);
          break;
        default:
          console.warn(`Unknown element type for update: ${element.type}`);
      }
    } catch (error) {
      console.error(`Failed to update element ${element.id}:`, error);
    }
  }

  /**
   * Remove an element
   */
  private removeElement(id: ElementId) {
    const node = this.nodeMap.get(id);
    if (!node) return;

    node.destroy();
    this.nodeMap.delete(id);
  }

  /**
   * Get appropriate layer for element type
   */
  private getLayerForElement(element: CanvasElement): Konva.Layer {
    if (!this.layers) throw new Error('Layers not initialized');

    // Images go to fast layer (GPU accelerated)
    if (element.type === 'image') {
      return this.layers.preview;
    }

    // Everything else goes to main layer
    return this.layers.main;
  }

  /**
   * Update spatial index with current elements
   */
  private updateSpatialIndex() {
    // Recreate spatial index with current elements
    this.spatial = new QuadTree({ x: 0, y: 0, width: 10000, height: 10000 }, 10);
    
    this.elementMap.forEach(element => {
      this.spatial.insert(element);
    });
  }

  /**
   * Sync selection from state
   */
  syncSelection(selectedIds: Set<ElementId>) {
    this.selection.syncSelection(selectedIds);
    this.core.scheduleDraw('overlay');
  }

  /**
   * Update viewport (pan/zoom)
   */
  updateViewport(viewport: ViewportState) {
    this.viewport.setViewport(viewport);
  }
  
  /**
   * Get current viewport
   */
  getViewport(): ViewportState {
    return this.viewport.getViewport();
  }
  
  /**
   * Fit content to viewport
   */
  fitToContent(bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
    this.viewport.fitToContent(bounds);
  }
  
  /**
   * Reset viewport
   */
  resetViewport() {
    this.viewport.resetViewport();
  }

  // Event Handlers

  private handleElementClick(id: ElementId, element: CanvasElement) {
    const isShift = this.events.isShiftPressed();
    const currentSelection = this.selection.getSelectedIds();
    
    let newSelection: Set<ElementId>;
    if (isShift) {
      // Toggle selection with shift
      newSelection = new Set(currentSelection);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
    } else {
      // Single selection
      newSelection = new Set([id]);
    }

    this.config.onSelectionChange?.(newSelection);
  }

  private handleElementDblClick(id: ElementId, element: CanvasElement, e: Konva.KonvaEventObject<MouseEvent>) {
    // Double click to edit text/sticky
    if (element.type === 'text' || element.type === 'sticky-note' || element.type === 'circle-text') {
      const node = this.nodeMap.get(id);
      if (node) {
        const initialText = (element as any).text || '';
        const style = {
          fontSize: (element as any).fontSize || 16,
          fontFamily: (element as any).fontFamily || 'Arial',
          color: (element as any).fill || '#000000',
          textAlign: (element as any).align || 'left',
          padding: 8
        };
        
        this.textEditor.openEditor(id, element, node, initialText, style);
      }
    }
  }

  private handleBackgroundClick() {
    // Clear selection
    this.config.onSelectionChange?.(new Set());
  }

  private handleDragStart(id: ElementId, element: CanvasElement) {
    // Use drag drop manager
    this.dragDrop.startDrag(id, element);
    // Detach transformer during drag
    this.selection.detachTransformer();
  }

  private handleDragMove(id: ElementId, position: { x: number; y: number }) {
    // Delegate to drag drop manager
    this.dragDrop.handleDragMove(id, position);
  }

  private handleDragEnd(id: ElementId, position: { x: number; y: number }) {
    // End drag operation
    this.dragDrop.endDrag(id, position);
    // Reattach transformer
    this.selection.reattachTransformer();
  }

  private handleTransformEnd(id: ElementId, updates: any) {
    // Commit transform updates
    this.config.onElementUpdate?.(id, updates);
  }

  private handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    // Delegate to viewport manager (it handles the event internally)
    // This handler is called by event manager but viewport manager
    // also listens to wheel events directly
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Delete selected elements
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = this.selection.getSelectedIds();
      if (selected.size > 0) {
        // Notify parent to delete elements
        selected.forEach(id => {
          this.config.onElementUpdate?.(id, { deleted: true } as any);
        });
      }
    }
  }

  /**
   * Get elements at point (for hit testing)
   */
  getElementsAtPoint(x: number, y: number): ElementId[] {
    const bounds = { x: x - 1, y: y - 1, width: 2, height: 2 };
    return this.spatial.query(bounds).map(element => element.id);
  }

  /**
   * Get elements in rectangle (for marquee selection)
   */
  getElementsInRect(rect: { x: number; y: number; width: number; height: number }): ElementId[] {
    return this.spatial.query(rect).map(element => element.id);
  }

  /**
   * Export stage as data URL
   */
  async exportAsImage(): Promise<string> {
    if (!this.stage) throw new Error('Stage not initialized');
    return this.stage.toDataURL();
  }

  /**
   * Clean up and destroy
   */
  destroy() {
    this.events.destroy();
    this.selection.destroy();
    this.textEditor.destroy();
    this.dragDrop.destroy();
    this.viewport.destroy();
    this.core.destroy();
    
    this.nodeMap.clear();
    this.elementMap.clear();
    this.spatial = new QuadTree({ x: 0, y: 0, width: 10000, height: 10000 }, 10);
    
    this.stage = null;
    this.layers = null;
  }
}
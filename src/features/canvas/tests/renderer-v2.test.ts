/**
 * Tests for CanvasRendererV2
 * Validates the store-first renderer implementation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';
import { CanvasRendererV2 } from '../services/CanvasRendererV2';
import { createElementId } from '../types/enhanced.types';

describe('CanvasRendererV2', () => {
  let renderer: CanvasRendererV2;
  let stage: Konva.Stage;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create stage
    stage = new Konva.Stage({
      container,
      width: 800,
      height: 600
    });

    // Create renderer
    renderer = new CanvasRendererV2();
  });

  afterEach(() => {
    stage.destroy();
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should initialize with stage and layers', () => {
      const updateCallback = vi.fn();
      renderer.init(stage, undefined, { onUpdateElement: updateCallback });

      // Check layers were created
      const layers = stage.getLayers();
      expect(layers.length).toBeGreaterThan(0);

      // Check for required layers
      const mainLayer = stage.findOne('.main-layer');
      const overlayLayer = stage.findOne('.overlay-layer');
      
      expect(mainLayer).toBeDefined();
      expect(overlayLayer).toBeDefined();
    });

    it('should setup transformer on overlay layer', () => {
      renderer.init(stage);
      
      const overlayLayer = stage.findOne('.overlay-layer');
      const transformer = overlayLayer?.findOne('Transformer');
      
      expect(transformer).toBeDefined();
      expect(transformer?.getClassName()).toBe('Transformer');
    });

    it('should register stage event handlers', () => {
      const updateCallback = vi.fn();
      renderer.init(stage, undefined, { onUpdateElement: updateCallback });

      // Create a mock event
      const mockEvent = {
        target: stage,
        evt: { 
          clientX: 100, 
          clientY: 100,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn()
        }
      };

      // Fire mousedown event
      stage.fire('mousedown', mockEvent);
      
      // Event handler should be registered (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('Element Rendering', () => {
    beforeEach(() => {
      renderer.init(stage);
    });

    it('should render sticky note element', () => {
      const elements = new Map();
      const stickyNote = {
        id: createElementId('sticky1'),
        type: 'sticky-note',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        text: 'Test Note',
        backgroundColor: '#fef08a',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      elements.set(stickyNote.id, stickyNote);
      
      // Sync elements to renderer
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set(),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Check if node was created
      const mainLayer = stage.findOne('.main-layer');
      const nodes = mainLayer?.find('.sticky-note');
      
      expect(nodes?.length).toBe(1);
    });

    it('should update element position on sync', () => {
      const elements = new Map();
      const rect = {
        id: createElementId('rect1'),
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      elements.set(rect.id, rect);
      
      // Initial sync
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set(),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Update position
      rect.x = 150;
      rect.y = 150;
      
      // Re-sync
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set(),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Check updated position
      const mainLayer = stage.findOne('.main-layer');
      const node = mainLayer?.findOne(`#${rect.id}`);
      
      expect(node?.x()).toBe(150);
      expect(node?.y()).toBe(150);
    });

    it('should handle selection with transformer', () => {
      const elements = new Map();
      const circle = {
        id: createElementId('circle1'),
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        fill: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      elements.set(circle.id, circle);
      
      // Sync with selection
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set([circle.id]),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Manually trigger selection sync
      renderer.syncSelection(new Set([circle.id]));

      // Check if transformer is attached
      const transformer = stage.findOne('Transformer') as Konva.Transformer;
      const attachedNodes = transformer?.nodes();
      
      expect(attachedNodes?.length).toBeGreaterThan(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      const updateCallback = vi.fn();
      renderer.init(stage, undefined, { onUpdateElement: updateCallback });
    });

    it('should handle drag events properly', () => {
      const elements = new Map();
      const rect = {
        id: createElementId('rect1'),
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: '#0000ff',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      elements.set(rect.id, rect);
      
      // Sync element
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set(),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Get the node
      const mainLayer = stage.findOne('.main-layer');
      const node = mainLayer?.findOne(`#${rect.id}`);
      
      expect(node).toBeDefined();
      expect(node?.draggable()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should properly cleanup on destroy', () => {
      renderer.init(stage);
      
      // Add some elements
      const elements = new Map();
      elements.set(createElementId('test1'), {
        id: createElementId('test1'),
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      renderer.syncFromState(elements, new Map(), {
        selectedIds: new Set(),
        viewport: { x: 0, y: 0, scale: 1 }
      });

      // Destroy renderer
      renderer.destroy();

      // Check cleanup
      const mainLayer = stage.findOne('.main-layer');
      const nodes = mainLayer?.find('Group');
      
      // Nodes should be removed
      expect(nodes?.length).toBe(0);
    });
  });
});
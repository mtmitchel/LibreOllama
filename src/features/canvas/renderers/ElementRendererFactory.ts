/**
 * ElementRendererFactory - Core factory for creating vanilla Konva element renderers
 * 
 * This factory system replaces React-Konva components with direct Konva node creation
 * and management, providing better performance and control.
 */

import Konva from 'konva';
import { 
  CanvasElement, 
  ElementId, 
  ElementType,
  RectangleElement,
  CircleElement,
  TriangleElement,
  TextElement,
  ImageElement,
  PenElement,
  StickyNoteElement,
  ConnectorElement,
  SectionElement,
  TableElement
} from '../types/enhanced.types';

import { VanillaElementRenderer } from './VanillaElementRenderer';
import { VanillaRectangleRenderer } from './shapes/VanillaRectangleRenderer';
import { VanillaCircleRenderer } from './shapes/VanillaCircleRenderer';
import { VanillaTriangleRenderer } from './shapes/VanillaTriangleRenderer';
import { VanillaTextRenderer } from './shapes/VanillaTextRenderer';
import { VanillaPenRenderer } from './shapes/VanillaPenRenderer';

export interface ElementCallbacks {
  onElementUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

export interface RendererContext {
  layer: Konva.Layer;
  stage: Konva.Stage;
  callbacks: ElementCallbacks;
}

/**
 * Factory class responsible for creating appropriate vanilla Konva renderers
 * for different element types
 */
export class ElementRendererFactory {
  private static rendererRegistry: Map<string, any> = new Map();
  
  static {
    // Register all element renderers
    ElementRendererFactory.registerRenderer('rectangle', VanillaRectangleRenderer);
    ElementRendererFactory.registerRenderer('circle', VanillaCircleRenderer);
    ElementRendererFactory.registerRenderer('triangle', VanillaTriangleRenderer);
    ElementRendererFactory.registerRenderer('text', VanillaTextRenderer);
    ElementRendererFactory.registerRenderer('pen', VanillaPenRenderer);
    // TODO: Add remaining renderers as they're implemented
    // ElementRendererFactory.registerRenderer('image', VanillaImageRenderer);
    // ElementRendererFactory.registerRenderer('sticky-note', VanillaStickyNoteRenderer);
    // ElementRendererFactory.registerRenderer('connector', VanillaConnectorRenderer);
    // ElementRendererFactory.registerRenderer('section', VanillaSectionRenderer);
    // ElementRendererFactory.registerRenderer('table', VanillaTableRenderer);
  }

  /**
   * Register a renderer class for a specific element type
   */
  static registerRenderer(elementType: string, rendererClass: any): void {
    ElementRendererFactory.rendererRegistry.set(elementType, rendererClass);
  }

  /**
   * Create a vanilla Konva renderer for the given element
   */
  static createRenderer(
    element: CanvasElement,
    context: RendererContext
  ): VanillaElementRenderer<CanvasElement> | null {
    const RendererClass = ElementRendererFactory.rendererRegistry.get(element.type);
    
    if (!RendererClass) {
      console.warn(`No renderer found for element type: ${element.type}`);
      return null;
    }

    return new RendererClass(element, context);
  }

  /**
   * Check if a renderer is available for the given element type
   */
  static hasRenderer(elementType: string): boolean {
    return ElementRendererFactory.rendererRegistry.has(elementType);
  }

  /**
   * Get all registered element types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(ElementRendererFactory.rendererRegistry.keys());
  }

  /**
   * Create multiple renderers for a collection of elements
   */
  static createRenderers(
    elements: CanvasElement[],
    context: RendererContext
  ): Map<ElementId, VanillaElementRenderer<CanvasElement>> {
    const renderers = new Map<ElementId, VanillaElementRenderer<CanvasElement>>();

    elements.forEach(element => {
      const renderer = ElementRendererFactory.createRenderer(element, context);
      if (renderer) {
        renderers.set(element.id, renderer);
      }
    });

    return renderers;
  }

  /**
   * Batch update multiple renderers
   */
  static updateRenderers(
    renderers: Map<ElementId, VanillaElementRenderer<CanvasElement>>,
    elements: Map<ElementId, CanvasElement>
  ): void {
    elements.forEach((element, elementId) => {
      const renderer = renderers.get(elementId);
      if (renderer) {
        renderer.update(element);
      }
    });
  }

  /**
   * Cleanup and destroy multiple renderers
   */
  static destroyRenderers(
    renderers: Map<ElementId, VanillaElementRenderer<CanvasElement>>
  ): void {
    renderers.forEach(renderer => {
      renderer.destroy();
    });
    renderers.clear();
  }
}

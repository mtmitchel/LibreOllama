// src/features/canvas/core/CanvasRenderer.ts
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { ElementRegistry } from './ElementRegistry';
import { CanvasElement, ElementId } from '../types/enhanced.types';

export class CanvasRenderer {
  private registry: ElementRegistry;
  private unsub: () => void;

  getRegistry(): ElementRegistry {
    return this.registry;
  }

  constructor(layer: Konva.Layer) {
    this.registry = new ElementRegistry(layer); // MemoryManager defaults inside registry

    // Subscribe to the unified Zustand store
    this.unsub = useUnifiedCanvasStore.subscribe(
      (state) => state.elements,
      (elements, prevElements) => {
        this.sync(elements as Map<ElementId, CanvasElement>, prevElements as Map<ElementId, CanvasElement>);
      }
    );

    // Initial sync
    const state = useUnifiedCanvasStore.getState();
    this.sync(state.elements as Map<ElementId, CanvasElement>, new Map());
  }

  private sync(elements: Map<ElementId, CanvasElement>, prevElements: Map<ElementId, CanvasElement>) {
    // Deletions
    prevElements.forEach((_, id) => {
      if (!elements.has(id)) {
        this.registry.delete(id);
      }
    });

    // Additions and updates
    elements.forEach((element, id) => {
      const prevElement = prevElements.get(id);
      if (!prevElement) {
        this.registry.create(element);
      } else if (element !== prevElement) {
        // Pass the entire new element for full update
        this.registry.update(id, element);
      }
    });
  }

  destroy(): void {
    this.unsub();
  }
}

import { describe, it, expect } from 'vitest';
import Konva from 'konva';
import { ElementRegistry } from '../core/ElementRegistry';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

// This is a light unit test for ElementRegistry + MemoryManager wiring

describe('ElementRegistry memory integration', () => {
  it('registers and destroys nodes via MemoryManager', () => {
    const stage = new Konva.Stage({ container: document.createElement('div'), width: 100, height: 100 });
    const layer = new Konva.Layer();
    stage.add(layer);

    const registry = new ElementRegistry(layer);

    const el = {
      id: 'e1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    registry.create(el);
    expect(registry.get('e1')).toBeTruthy();

    registry.delete('e1');
    expect(registry.get('e1')).toBeFalsy();

    stage.destroy();
  });
});

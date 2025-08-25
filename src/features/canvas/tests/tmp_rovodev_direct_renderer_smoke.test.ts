import { describe, it, expect } from 'vitest';
import Konva from 'konva';
import { KonvaDirectRenderer } from '../renderers/KonvaDirectRenderer';

// Smoke tests for direct renderer lifecycle

describe('KonvaDirectRenderer', () => {
  it('constructs and disposes without error', () => {
    const stage = new Konva.Stage({ container: document.createElement('div'), width: 100, height: 100 });
    const renderer = new KonvaDirectRenderer({ stage, enableBatching: true });
    expect(renderer.getStats()).toBeTruthy();
    renderer.dispose();
    stage.destroy();
  });
});

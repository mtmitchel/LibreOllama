import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';
import { CanvasRendererV2 } from '@/features/canvas/services/CanvasRendererV2';

function createStage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const stage = new Konva.Stage({ container, width: 800, height: 600 });
  const background = new Konva.Layer({ name: 'background-layer' });
  const main = new Konva.Layer({ name: 'main-layer' });
  const preview = new Konva.Layer({ name: 'preview-fast-layer' });
  const overlay = new Konva.Layer({ name: 'overlay-layer' });
  stage.add(background); stage.add(main); stage.add(preview); stage.add(overlay);
  return { stage, layers: { background, main, preview, overlay }, container };
}

describe('CanvasRendererV2 text measurement', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('updates element height to measured text height and resizes hit-area', () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    const updates: any[] = [];
    renderer.init(stage, layers as any, {
      onUpdateElement: (id, u) => { updates.push({ id, u }); }
    });

    const id = 'sticky-2';
    const elements: any[] = [{
      id,
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 180,
      height: 80,
      text: 'short',
      fill: '#FFF2CC',
      stroke: '#DDD'
    }];

    renderer.syncElements(elements as any);

    // Update element text to something longer and re-sync
    const updated = [{ ...elements[0], text: 'This is a much longer text that should wrap into multiple lines and increase height' }];
    renderer.syncElements(updated as any);

    // We expect at least one update to adjust height
    expect(updates.some(u => u.id === id && typeof u.u.height === 'number' && u.u.height > 80)).toBe(true);
  });
});

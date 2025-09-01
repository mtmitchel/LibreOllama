import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';
import { CanvasRendererV2 } from '@/features/canvas/services/CanvasRendererV2';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { createElementId } from '@/features/canvas/types/enhanced.types';

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

describe('FigJam-style text resize', () => {
  beforeEach(() => { (document.body.innerHTML = ''); });

  it('commitTextResize updates fontSize/width/height in store', () => {
    const store = createUnifiedTestStore();
    const id = createElementId('txt-1');
    // seed element
    store.setState((s) => {
      s.elements.set(id, {
        id,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Hello',
        width: 100,
        height: 20,
        fontSize: 16,
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as any);
      (s as any).elementOrder = [id as any];
    });

    store.getState().commitTextResize(id, { fontSize: 20, width: 140, height: 28 }, { skipHistory: true });
    const el = store.getState().elements.get(id) as any;
    expect(el.fontSize).toBe(20);
    expect(el.width).toBe(140);
    expect(el.height).toBe(28);
  });

  it('corner drag scales font proportionally and width by sx', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    // Provide a fake store for commit
    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, s: any) => commits.push({ id, ...s }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 't1';
    const elements: any[] = [{
      id,
      type: 'text',
      x: 50,
      y: 50,
      width: 120,
      height: 24,
      text: 'Hello world',
      fontSize: 16,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }];
    renderer.syncElements(elements as any);

    // Select it and wait a tick for RAF-attached handlers
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    // Simulate dragging bottom-right corner
    transformer._movingAnchorName = 'bottom-right';

    // Apply transform
    group.scaleX(1.25);
    group.scaleY(1.25);
    group.fire('transform');
    group.fire('transformend');

    expect(commits.length).toBeGreaterThan(0);
    const c = commits.pop();
    // font ~ 16 * sqrt(1.25*1.25) = 20
    expect(Math.round(c.fontSize)).toBe(20);
    // width ~ 120 * 1.25 = 150
    expect(c.width).toBe(150);
    expect(typeof c.height).toBe('number');
  });

  it('vertical edge scales font only', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, s: any) => commits.push({ id, ...s }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 't2';
    renderer.syncElements([{ id, type: 'text', x: 0, y: 0, width: 100, height: 24, text: 'Hello', fontSize: 16, createdAt: Date.now(), updatedAt: Date.now() }] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'bottom-center';

    group.scaleX(1.00);
    group.scaleY(1.50);
    group.fire('transform');
    group.fire('transformend');

    const c = commits.pop();
    // font ~ 16 * 1.5 = 24
    expect(Math.round(c.fontSize)).toBe(24);
    // width unchanged
    expect(c.width).toBe(100);
  });

  it('horizontal edge changes width only', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, s: any) => commits.push({ id, ...s }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 't3';
    renderer.syncElements([{ id, type: 'text', x: 0, y: 0, width: 80, height: 24, text: 'Hello', fontSize: 20, createdAt: Date.now(), updatedAt: Date.now() }] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'middle-right';

    group.scaleX(2.0);
    group.scaleY(1.0);
    group.fire('transform');
    group.fire('transformend');

    const c = commits.pop();
    // width doubled
    expect(c.width).toBe(160);
    // font unchanged
    expect(c.fontSize).toBe(20);
  });
});

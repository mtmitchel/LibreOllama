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

describe('Text resize alignment and bounds', () => {
  beforeEach(() => { (document.body.innerHTML = ''); });

  it('middle-left drag pins right edge and aligns text/frame without whitespace', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, attrs: any) => commits.push({ id, ...attrs }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 'txt-left';
    const base = { id, type: 'text', x: 0, y: 0, width: 200, height: 40, text: 'Hello world', fontSize: 20, createdAt: Date.now(), updatedAt: Date.now() };
    renderer.syncElements([base] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    expect(group).toBeTruthy();
    const text = group.findOne<Konva.Text>('.text');
    expect(text).toBeTruthy();
    const frame = group.findOne<Konva.Rect>('.hit-area'); // outer frame proxy
    expect(frame).toBeTruthy();

    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'middle-left';

    // Start, transform, end
    group.fire('transformstart');
    group.scaleX(0.5); group.scaleY(1.0);
    group.fire('transform');
    group.fire('transformend');

    // Wait for async commit (setTimeout in onTransformEnd)
    await new Promise(r => setTimeout(r, 10));
    
    const commit = commits.pop();
    expect(commit).toBeTruthy();

    // Frame width halves, x shifts by the delta to pin right edge
    expect(Math.round(commit.width)).toBe(100);
    expect(Math.round(group.x())).toBe(100);

    // Text width equals frame width (no padding in renderer path)
    expect(Math.round(text!.width())).toBe(100);

    // Height closely matches measured text height (no large trailing whitespace)
    text!._clearCache?.();
    const rect = text!.getClientRect({ skipTransform: true });
    expect(commit.height).toBeGreaterThanOrEqual(Math.ceil(rect.height));
    // allow a small guard margin but not more than ~0.35em
    expect(commit.height - Math.ceil(rect.height)).toBeLessThanOrEqual(Math.ceil((commit.fontSize || 20) * 0.35));

    // Group scale resets
    expect(group.scaleX()).toBeCloseTo(1);
    expect(group.scaleY()).toBeCloseTo(1);
  });

  it('bottom-center drag scales font only and keeps width stable', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, attrs: any) => commits.push({ id, ...attrs }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 'txt-vert';
    const base = { id, type: 'text', x: 0, y: 0, width: 180, height: 40, text: 'Hello world', fontSize: 16, createdAt: Date.now(), updatedAt: Date.now() };
    renderer.syncElements([base] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'bottom-center';

    group.fire('transformstart');
    group.scaleX(1.0); group.scaleY(1.5);
    group.fire('transform');
    group.fire('transformend');

    // Wait for async commit (setTimeout in onTransformEnd)
    await new Promise(r => setTimeout(r, 10));
    
    const c = commits.pop();
    expect(Math.round(c.fontSize)).toBe(24); // 16 * 1.5
    expect(Math.round(c.width)).toBe(180);
  });

  it('bottom-right corner scales font proportionally and width by sx', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, attrs: any) => commits.push({ id, ...attrs }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 'txt-corner';
    const base = { id, type: 'text', x: 10, y: 10, width: 120, height: 30, text: 'Corner test', fontSize: 20, createdAt: Date.now(), updatedAt: Date.now() };
    renderer.syncElements([base] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'bottom-right';

    group.fire('transformstart');
    group.scaleX(1.3); group.scaleY(1.3);
    group.fire('transform');
    group.fire('transformend');

    // Wait for async commit (setTimeout in onTransformEnd)
    await new Promise(r => setTimeout(r, 10));
    
    const c = commits.pop();
    expect(Math.round(c.fontSize)).toBe(26); // 20 * 1.3
    expect(Math.round(c.width)).toBe(156);   // 120 * 1.3
    expect(Math.round(group.x())).toBe(10);  // right edge drift minimal for BR anchor
  });

  it('min width clamp adjusts x when dragging left beyond minimum', async () => {
    const { stage, layers } = createStage();
    const renderer = new CanvasRendererV2();
    renderer.init(stage, layers as any);

    const commits: any[] = [];
    (window as any).__UNIFIED_CANVAS_STORE__ = {
      getState() {
        return {
          commitTextResize: (id: string, attrs: any) => commits.push({ id, ...attrs }),
          resizeTextLive: vi.fn(),
        };
      },
    };

    const id = 'txt-clamp';
    const base = { id, type: 'text', x: 0, y: 0, width: 60, height: 20, text: 'x', fontSize: 16, createdAt: Date.now(), updatedAt: Date.now() };
    renderer.syncElements([base] as any);
    renderer.syncSelection(new Set([id] as any));
    await new Promise((r) => setTimeout(r, 0));

    const group = stage.findOne(`#${id}`) as Konva.Group;
    const transformer = stage.findOne('Transformer') as any;
    transformer._movingAnchorName = 'middle-left';

    group.fire('transformstart');
    group.scaleX(0.1); group.scaleY(1.0); // would try to shrink to 6px -> clamp at 20
    group.fire('transform');
    group.fire('transformend');

    // Wait for async commit (setTimeout in onTransformEnd)
    await new Promise(r => setTimeout(r, 10));
    
    const c = commits.pop();
    expect(Math.round(c.width)).toBe(20);
    // x shifted by delta (60 - 20) = 40
    expect(Math.round(group.x())).toBe(40);
  });
});


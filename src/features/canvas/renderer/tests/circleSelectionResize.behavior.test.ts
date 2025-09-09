/**
 * Integration behavior tests for circle selection and resize with CanvasRendererV2
 * Cases covered:
 * 1) Auto-select on create shows transformer immediately (and configured)
 * 2) Deselect on background click hides transformer
 * 3) Reselect via single click anywhere on circle's hit-area (negative outside-bounds)
 * 4) Transformer hugs circle perfectly across lifecycle (after resize, and on reselect)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';
import CanvasRendererV2 from '../../services/CanvasRendererV2';
import { createCanvasStoreSlice } from '../../stores/unifiedCanvasStore';

type UCStore = ReturnType<typeof createCanvasStoreSlice>;

/**
 * Minimal unified store harness (non-persisted) suitable for renderer tests.
 * - set: mutates the single shared store object
 * - get: returns that same object
 * - window.__UNIFIED_CANVAS_STORE__ is provided for renderer event handlers
 */
function createStoreHarness(): UCStore & { __get: () => any } {
  let store: any;
  const set = (fn: (draft: any) => void) => fn(store);
  const get = () => store;
  store = createCanvasStoreSlice(set as any, get as any);
  // ensure history noop to avoid errors in actions that call addToHistory
  store.addToHistory = vi.fn();

  // expose getState-compatible API for the renderer
  (globalThis as any).__UNIFIED_CANVAS_STORE__ = { getState: () => store };

  return Object.assign(store, { __get: () => store });
}

function createStageAndLayers(width = 800, height = 600) {
  // Ensure deterministic rendering scale
  (Konva as any).pixelRatio = 1;

  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'relative';
  document.body.appendChild(container);

  const stage = new Konva.Stage({ container, width, height });

  const background = new Konva.Layer({ name: 'background-layer', listening: true });
  const main = new Konva.Layer({ name: 'main-layer', listening: true });
  const preview = new Konva.Layer({ name: 'preview-layer', listening: false });
  const overlay = new Konva.Layer({ name: 'overlay-layer', listening: true });

  stage.add(background);
  stage.add(main);
  stage.add(preview);
  stage.add(overlay);

  return { stage, layers: { background, main, preview, overlay }, container };
}

function getTransformer(stage: Konva.Stage): Konva.Transformer | null {
  return stage.findOne<Konva.Transformer>((n: Konva.Node) => n.getClassName() === 'Transformer') || null;
}

function getGroupForId(stage: Konva.Stage, id: string): Konva.Group | null {
  return stage.findOne<Konva.Group>((n: Konva.Node) => n.getClassName() === 'Group' && n.id() === id) || null;
}

function approxEqual(a: number, b: number, eps = 1.5): boolean {
  return Math.abs(a - b) <= eps;
}

// Robust Konva radius extractor supporting Circle and Ellipse (and vector radius())
function getRadiusFromShape(shape: any): number {
  try {
    // Prefer explicit per-axis
    const hasRX = typeof shape?.radiusX === 'function';
    const hasRY = typeof shape?.radiusY === 'function';
    if (hasRX || hasRY) {
      const rx = hasRX ? Number(shape.radiusX()) : 0;
      const ry = hasRY ? Number(shape.radiusY()) : 0;
      const r = Math.max(rx || 0, ry || 0);
      if (Number.isFinite(r) && r > 0) return r;
    }
    // Circle.radius() or Ellipse.radius() vector fallback
    if (typeof shape?.radius === 'function') {
      const rVal = shape.radius();
      if (typeof rVal === 'number') return rVal;
      if (rVal && typeof rVal.x === 'number' && typeof rVal.y === 'number') {
        const r = Math.max(rVal.x, rVal.y);
        if (Number.isFinite(r) && r > 0) return r;
      }
    }
  } catch {}
  return 0;
}

// Flush requestAnimationFrame/setTimeout scheduled work (renderer defers visibility to next frame)
async function flush() {
  await Promise.resolve();
  vi.runAllTimers();
  await Promise.resolve();
}

describe('CanvasRendererV2 - Circle selection/resize behavior', () => {
  let store: UCStore & { __get: () => any };
  let renderer: CanvasRendererV2;
  let stage: Konva.Stage;
  let layers: { background: Konva.Layer; main: Konva.Layer; preview: Konva.Layer; overlay: Konva.Layer };

  beforeEach(() => {
    vi.useFakeTimers();
    // reset document
    document.body.innerHTML = '';

    store = createStoreHarness();

    const s = createStageAndLayers();
    stage = s.stage;
    layers = s.layers;

    renderer = new CanvasRendererV2();
    renderer.init(stage, layers, {
      onUpdateElement: (id: string, updates: any) => {
        store.updateElement(id as any, updates, { skipHistory: true });
      },
    });
  });

  it('Case 1: Auto-select on create shows transformer immediately (with circle config)', async () => {
    // Create circle via store path - auto-select expected per elementModule.createElement()
    store.createElement('circle', { x: 100, y: 100 });

    // Resolve created id: last selected id for convenience
    const selectedId = store.lastSelectedElementId!;
    expect(typeof selectedId).toBe('string');

    // Render elements and attach transformer for current selection
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const tr = getTransformer(stage);
    expect(tr).toBeTruthy();

    // Transformer should be visible and attached to the group for the circle id
    expect(tr!.visible()).toBe(true);
    const nodes = tr!.nodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].id()).toBe(selectedId);

    const group = getGroupForId(stage, selectedId)!;
    expect(group).toBeTruthy();
    expect(group.name()).toMatch(/circle|circle-text/);

    // Verify circle-specific config (where retrievable)
    // keepRatio: Konva Transformer API exposes keepRatio() getter
    expect((tr as any).keepRatio ? (tr as any).keepRatio() : true).toBe(true);
    
    // ignoreStroke + padding = 0 set in applyCircleTransformerConfig / syncSelection
    const padding = (tr as any).padding ? (tr as any).padding() : (tr as any).getAttr?.('padding');
    expect(padding).toBe(0);
    const ignoreStroke = (tr as any).ignoreStroke ? (tr as any).ignoreStroke() : (tr as any).getAttr?.('ignoreStroke');
    expect(ignoreStroke).toBe(true);
    // Visuals should be enabled immediately
    const anchorSize = (tr as any).anchorSize ? (tr as any).anchorSize() : 0;
    expect(anchorSize).toBeGreaterThan(0);
    expect(tr!.borderEnabled()).toBe(true);
  });

  it('Case 2: Deselect on background click hides transformer and clears selection', async () => {
    // Seed a selected circle
    store.createElement('circle', { x: 120, y: 120 });
    const id = store.lastSelectedElementId!;
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();
    expect(getTransformer(stage)?.visible()).toBe(true);

    // Dispatch a background mousedown (no element hit)
    stage.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    await flush();

    // After background click, renderer immediately hides transformer
    const tr = getTransformer(stage);
    expect(tr).toBeTruthy();
    expect(tr!.visible()).toBe(false);

    // Spec expects selection cleared
    // NOTE: Current store implementation may toggle to Set([null]) instead of clearing.
    // The assertion below encodes the intended UX; failure will reveal a gap.
    expect(store.selectedElementIds.size).toBe(0);
  });

  it('Case 3: Reselect via single click anywhere on circle hit-area; outside-bounds does not select', async () => {
    // Start with a selected circle
    store.createElement('circle', { x: 200, y: 200 });
    const id = store.lastSelectedElementId!;
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    // Deselect to prepare reselect test
    stage.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    await flush();
    const tr0 = getTransformer(stage);
    expect(tr0).toBeTruthy();
    expect(tr0!.visible()).toBe(false);

    // Find the circle group and its hit-area
    const group = getGroupForId(stage, id)!;
    expect(group).toBeTruthy();
    const hit = group.findOne<Konva.Rect>((n: Konva.Node) => n.getClassName() === 'Rect' && n.name() === 'hit-area');
    expect(hit).toBeTruthy();

    // Click on hit-area: should reselect the circle id (via stage mousedown selection branch)
    // Ensure Konva bubbles up to stage listener
    hit!.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);

    // Manually sync selection (store-first in tests)
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    expect(Array.from(store.selectedElementIds)).toEqual([id]);
    const tr1 = getTransformer(stage);
    expect(tr1).toBeTruthy();
    expect(tr1!.visible()).toBe(true);

    // Negative sub-case: click just outside circle bounds should not select
    // Fire on background (outside any element)
    stage.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    renderer.syncSelection(store.selectedElementIds);
    await flush();
    await flush();
    expect(store.selectedElementIds.size).toBe(0);
    const tr2 = getTransformer(stage);
    expect(tr2).toBeTruthy();
    expect(tr2!.visible()).toBe(false);
  });

  it('Case 4: Transformer hugs circle perfectly after resize and on reselect', async () => {
    // Create + render a selected circle
    store.createElement('circle', { x: 320, y: 260 });
    const id = store.lastSelectedElementId!;
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const group = getGroupForId(stage, id)!;
    expect(group).toBeTruthy();

    const tr = getTransformer(stage)!;
    expect(tr).toBeTruthy();
    expect(tr.visible()).toBe(true);

    // Simulate a resize commit: set node scale and fire transform lifecycle
    group.scale({ x: 1.5, y: 1.5 });
    // Fire transformstart to capture initial radius (circle path)
    (tr as any).fire('transformstart', {});
    // Fire transformend to trigger commit pipeline
    (tr as any).fire('transformend', {});

    // After commit, renderer updates store via onUpdateElement; re-sync transformer for safety
    renderer.refreshTransformer(id);
    await flush();
    await flush(); // extra tick to allow RAF + forceUpdate to settle transformer bounds

    // Assert circle config: padding = 0, ignoreStroke = true; anchors visible and border enabled
    const padding = (tr as any).padding ? (tr as any).padding() : (tr as any).getAttr?.('padding');
    expect(padding).toBe(0);
    const ignoreStroke = (tr as any).ignoreStroke ? (tr as any).ignoreStroke() : (tr as any).getAttr?.('ignoreStroke');
    expect(ignoreStroke).toBe(true);
    const anchorSize = (tr as any).anchorSize ? (tr as any).anchorSize() : 0;
    expect(anchorSize).toBeGreaterThan(0);
    expect(tr.borderEnabled()).toBe(true);

    // Bounds parity: compare Transformer rect to the inner shape rect (skip stroke/shadow) within epsilon
    const trRect = (tr as any).getClientRect({ skipTransform: false }) as any;
    const shape = group.findOne<Konva.Shape>('Ellipse, Circle')!;
    const shapeRect = (shape as any).getClientRect({ skipTransform: false, skipStroke: true, skipShadow: true }) as any;

    // Allow a slightly larger epsilon to account for transformer border rounding
    expect(approxEqual(trRect.x, shapeRect.x, 8)).toBe(true);
    expect(approxEqual(trRect.y, shapeRect.y, 8)).toBe(true);
    // Allow larger epsilon for width/height to ignore visible anchor visuals in Transformer rect
    expect(approxEqual(trRect.width, shapeRect.width, 16)).toBe(true);
    expect(approxEqual(trRect.height, shapeRect.height, 16)).toBe(true);

    // Deselect and reselect; ensure bounds parity holds
    stage.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    renderer.syncSelection(store.selectedElementIds);
    await flush();
    expect(getTransformer(stage)?.visible()).toBe(false);

    // Reselect via hit-area
    const hit = group.findOne<Konva.Rect>((n: Konva.Node) => n.getClassName() === 'Rect' && n.name() === 'hit-area');
    expect(hit).toBeTruthy();
    hit!.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const tr2 = getTransformer(stage)!;
    expect(tr2.visible()).toBe(true);
    // Visuals should be enabled on reselect too
    const anchorSize2 = (tr2 as any).anchorSize ? (tr2 as any).anchorSize() : 0;
    expect(anchorSize2).toBeGreaterThan(0);
    expect(tr2.borderEnabled()).toBe(true);
    
    const trRect2 = (tr2 as any).getClientRect({ skipTransform: false }) as any;
    const shape2 = group.findOne<Konva.Shape>('Ellipse, Circle')!;
    const shapeRect2 = (shape2 as any).getClientRect({ skipTransform: false, skipStroke: true, skipShadow: true }) as any;
    
    // Allow a slightly larger epsilon to account for transformer border rounding
    expect(approxEqual(trRect2.x, shapeRect2.x, 8)).toBe(true);
    expect(approxEqual(trRect2.y, shapeRect2.y, 8)).toBe(true);
    // Allow larger epsilon for width/height to ignore visible anchor visuals in Transformer rect
    expect(approxEqual(trRect2.width, shapeRect2.width, 16)).toBe(true);
    expect(approxEqual(trRect2.height, shapeRect2.height, 16)).toBe(true);
  });

  it('Case 5: Auto-select on create for multiple circles (every new circle shows transformer immediately)', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      store.createElement('circle', { x: 60 + i * 90, y: 80 + i * 40 });
      const id = store.lastSelectedElementId!;
      ids.push(id);
      renderer.syncElements(store.elements);
      renderer.syncSelection(store.selectedElementIds);
      await flush();
      const tr = getTransformer(stage);
      expect(tr).toBeTruthy();
      expect(tr!.visible()).toBe(true);
      const nodes = tr!.nodes();
      expect(nodes.length).toBe(1);
      expect(nodes[0].id()).toBe(id);
    }
  });

  it('Case 6: Circle font-size scales uniformly on resize commit', async () => {
    // Create a circle with explicit fontSize
    store.createElement('circle', { x: 200, y: 160 });
    // Assign explicit font size without tightening types in the store API
    const id = store.lastSelectedElementId!;
    store.updateElement(id as any, { fontSize: 14 } as any, { skipHistory: true });

    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const before = store.elements.get(id)!;
    const beforeFont = (before as any).fontSize ?? 14;

    const group = getGroupForId(stage, id)!;
    const tr = getTransformer(stage)!;

    // Simulate a resize commit
    group.scale({ x: 1.8, y: 1.6 });
    (tr as any).fire('transformstart', {});
    (tr as any).fire('transformend', {});

    renderer.refreshTransformer(id);
    await flush();

    const after = store.elements.get(id)!;
    expect(approxEqual(((after as any).fontSize ?? beforeFont), beforeFont, 0.75)).toBe(true);

    // Transformer still visible and hugging bounds
    const trRect = (getTransformer(stage) as any).getClientRect({ skipTransform: false }) as any;
    const shape = group.findOne<Konva.Shape>('Ellipse, Circle')!;
    const shapeRect = (shape as any).getClientRect({ skipTransform: false, skipStroke: true, skipShadow: true }) as any;
    expect(approxEqual(trRect.width, shapeRect.width, 16)).toBe(true);
    expect(approxEqual(trRect.height, shapeRect.height, 16)).toBe(true);
  });
  it('Case 7: Immediate reselect on single click triggers transformer without manual syncSelection()', async () => {
    // Create and render a circle
    store.createElement('circle', { x: 250, y: 220 });
    const id = store.lastSelectedElementId!;
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    // Deselect via background click (stage)
    stage.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    await flush();

    // Sanity: transformer hidden after deselect
    expect(getTransformer(stage)?.visible()).toBe(false);

    // Find the circle's hit-area and click it
    const group = getGroupForId(stage, id)!;
    expect(group).toBeTruthy();
    const hit = group.findOne<Konva.Rect>((n: Konva.Node) => n.getClassName() === 'Rect' && n.name() === 'hit-area');
    expect(hit).toBeTruthy();

    // Fire only mousedown; DO NOT call renderer.syncSelection here
    hit!.fire('mousedown', { evt: new MouseEvent('mousedown') }, true);
    await flush();

    // Expect transformer attached immediately and visible for the circle id
    const tr = getTransformer(stage)!;
    expect(tr).toBeTruthy();
    expect(tr.visible()).toBe(true);
    const nodes = tr.nodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].id()).toBe(id);
  });

  it('Case 8: Auto-open editor with caret on circle creation and keep transformer visible', async () => {
    // Create circle and mark as newlyCreated to trigger auto-open flow
    store.createElement('circle', { x: 100, y: 120 });
    const id = store.lastSelectedElementId!;
    store.updateElement(id as any, { newlyCreated: true } as any, { skipHistory: true });

    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush(); // settle selection/transformer
    await flush(); // settle second RAF for editor open

    const tr = getTransformer(stage)!;
    expect(tr.visible()).toBe(true);

    const editor = (renderer as any).currentEditor as HTMLElement | undefined;
    expect(editor).toBeTruthy();
    // For circles we use a contenteditable DIV editor
    expect(editor?.getAttribute('contenteditable')).toBe('true');
  });

  it('Case 9: No growth "jump" after shrinking circle while editing', async () => {
    // Create circle with short text and enter editing
    store.createElement('circle', { x: 180, y: 180 });
    const id = store.lastSelectedElementId!;
    store.updateElement(id as any, { text: 'Hello world', isEditing: true } as any, { skipHistory: true });

    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const group = getGroupForId(stage, id)!;

    // Ensure any pending auto-grow settles so we use the current visual radius as baseline
    renderer.refreshTransformer(id);
    await flush();

    const shape = group.findOne<Konva.Shape>('Ellipse, Circle')!;
    const initialR = Number(getRadiusFromShape(shape) || 0);
    const tr = getTransformer(stage)!;

    // Shrink uniformly
    group.scale({ x: 0.6, y: 0.6 });
    (tr as any).fire('transformstart', {});
    (tr as any).fire('transformend', {});
    renderer.refreshTransformer(id);
    await flush();

    const shape2 = group.findOne<Konva.Shape>('Ellipse, Circle')!;
    const finalR = Number(getRadiusFromShape(shape2) || 0);
    const expectedR = Math.round(initialR * 0.6);
    // Tolerate renderer rounding/min-size guards; ensure no post-commit growth "jump"
    expect(finalR).toBeLessThanOrEqual(initialR);
    // Accept slight variance around the 0.6 scale target
    const lowerBound = Math.max(2, expectedR - 4);
    expect(finalR).toBeGreaterThanOrEqual(lowerBound);
  });
  it('Case 11: Shrink twice; no jump up on commit', async () => {
    // Create circle and render
    store.createElement('circle', { x: 300, y: 200 });
    const id2 = store.lastSelectedElementId!;
    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const group2 = getGroupForId(stage, id2)!;
    const tr2 = getTransformer(stage)!;

    // Initial radius
    const shape0 = group2.findOne<Konva.Shape>('Ellipse, Circle')!;
    const r0 = getRadiusFromShape(shape0);
    expect(r0).toBeGreaterThan(0);

    // First shrink to 0.8
    group2.scale({ x: 0.8, y: 0.8 });
    (tr2 as any).fire('transformstart', {});
    (tr2 as any).fire('transformend', {});
    renderer.refreshTransformer(id2);
    await flush();

    const shape1 = group2.findOne<Konva.Shape>('Ellipse, Circle')!;
    const r1 = getRadiusFromShape(shape1);
    expect(r1).toBeLessThanOrEqual(r0);
    // Within epsilon of initial * 0.8 (rounded by renderer)
    expect(approxEqual(r1, Math.round(r0 * 0.8), 3)).toBe(true);

    // Second shrink to 0.6
    group2.scale({ x: 0.6, y: 0.6 });
    (tr2 as any).fire('transformstart', {});
    (tr2 as any).fire('transformend', {});
    renderer.refreshTransformer(id2);
    await flush();

    const shape2b = group2.findOne<Konva.Shape>('Ellipse, Circle')!;
    const r2 = getRadiusFromShape(shape2b);
    expect(r2).toBeLessThan(r1);
    // Within epsilon of previous radius * 0.6
    expect(approxEqual(r2, Math.round(r1 * 0.6), 3)).toBe(true);
  });

  it('Case 12: Text container tracks final radius; font scales predictably', async () => {
    // Create circle with explicit font and text
    store.createElement('circle', { x: 180, y: 180 });
    const id3 = store.lastSelectedElementId!;
    store.updateElement(id3 as any, { fontSize: 14, text: 'Test' } as any, { skipHistory: true });

    renderer.syncElements(store.elements);
    renderer.syncSelection(store.selectedElementIds);
    await flush();

    const group3 = getGroupForId(stage, id3)!;
    const tr3 = getTransformer(stage)!;

    // Scale to 1.5 and commit
    group3.scale({ x: 1.5, y: 1.5 });
    (tr3 as any).fire('transformstart', {});
    (tr3 as any).fire('transformend', {});
    renderer.refreshTransformer(id3);
    await flush();

    // Font not scaled, remains 14
    const after = store.elements.get(id3)! as any;
    expect(approxEqual(after.fontSize ?? 0, 14, 1)).toBe(true);

    // Compute expected inscribed square from final radius
    const shape3 = group3.findOne<Konva.Shape>('Ellipse, Circle')!;
    const r = getRadiusFromShape(shape3);
    const strokeW = (shape3 as any).strokeWidth?.() || 1;
    const pad = 12; // default used by transformend recompute
    const rClip = Math.max(1, r - strokeW / 2);
    const side = Math.max(1, Math.SQRT2 * rClip - 2 * pad);

    const tnode =
      group3.findOne<Konva.Text>('Text.label') ||
      group3.findOne<Konva.Text>('Text') ||
      group3.findOne<Konva.Text>('.text');
    expect(tnode).toBeTruthy();

    const w = (tnode as any).width?.() || tnode!.width();
    const h = (tnode as any).height?.() || tnode!.height();
    expect(approxEqual(w, side, 2)).toBe(true);
    expect(approxEqual(h, side, 2)).toBe(true);

    const pos = tnode!.position();
    expect(approxEqual(pos.x, -side / 2, 2)).toBe(true);
    expect(approxEqual(pos.y, -side / 2, 2)).toBe(true);
  });
});
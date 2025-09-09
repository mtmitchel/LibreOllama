import { describe, it, expect, beforeEach } from 'vitest';

import { createCanvasStoreSlice } from './unifiedCanvasStore';

describe('unifiedCanvasStore - selection basics', () => {
  let store: any;

  beforeEach(() => {
    // Minimal immer-like harness: mutate the unified store object directly
    const set = (fn: (draft: any) => void) => fn(store);
    const get = () => store;
    store = createCanvasStoreSlice(set as any, get as any);
  });

  it('clearSelection empties the selected set', () => {
    // Prime with some ids
    store.selectedElementIds.add('a');
    store.selectedElementIds.add('b');

    store.clearSelection();

    expect(store.selectedElementIds instanceof Set).toBe(true);
    expect(store.selectedElementIds.size).toBe(0);
    expect(store.lastSelectedElementId).toBeNull();
  });

  it('selectElement toggles selection to [id] when called with a circle id', () => {
    const id = 'circle-123';

    // First selection (no multi-select): should be exactly [id]
    store.selectElement(id, false);
    expect(Array.from(store.selectedElementIds)).toEqual([id]);
    expect(store.lastSelectedElementId).toBe(id);

    // Toggle same id with multiSelect=true should remove it
    store.selectElement(id, true);
    expect(store.selectedElementIds.size).toBe(0);

    // Select again (single select): back to [id]
    store.selectElement(id, false);
    expect(Array.from(store.selectedElementIds)).toEqual([id]);
  });
});
import { describe, it, expect, vi } from 'vitest';

import { createElementModule } from './elementModule';

function makeModuleHarness() {
  const selected = new Set<string>();
  let lastAdded: any = null;

  const addElement = vi.fn((el: any) => {
    lastAdded = el;
  });

  const selectElement = vi.fn((id: string, multiSelect?: boolean) => {
    if (!multiSelect) selected.clear();
    if (typeof id === 'string') selected.add(id);
  });

  const mockGet = vi.fn(() => ({
    addElement,
    selectElement,
    selectedElementIds: selected,
    addToHistory: vi.fn(),
  }));

  const mockSet = vi.fn();

  const elementModule = createElementModule(mockSet as any, mockGet as any);

  return {
    elementModule,
    selected,
    addElement,
    selectElement,
    mockGet,
    mockSet,
    getLastAdded: () => lastAdded,
  };
}

describe('elementModule', () => {
  it('auto-selects circle on creation (store module path)', () => {
    const { elementModule, selected, addElement, selectElement, getLastAdded } = makeModuleHarness();

    const position = { x: 100, y: 100 };
    elementModule.actions.createElement('circle', position);

    // ensure element was added
    expect(addElement).toHaveBeenCalledTimes(1);
    const created = getLastAdded();
    expect(created).toBeTruthy();
    expect(created.type).toBe('circle');
    expect(typeof created.id).toBe('string');

    // ensure selectElement was called with the new id and multiSelect=false
    expect(selectElement).toHaveBeenCalledWith(created.id, false);

    // ensure the id is now in the selected set
    expect(selected.has(created.id)).toBe(true);
  });

  it('does NOT auto-select non-circle element on creation (contrast case)', () => {
    const { elementModule, selected, addElement, selectElement, getLastAdded } = makeModuleHarness();

    const position = { x: 50, y: 50 };
    elementModule.actions.createElement('rectangle', position);

    expect(addElement).toHaveBeenCalledTimes(1);
    const created = getLastAdded();
    expect(created).toBeTruthy();
    expect(created.type).toBe('rectangle');

    // No auto-selection expected for rectangle
    expect(selectElement).not.toHaveBeenCalled();
    expect(selected.size).toBe(0);
  });
});
// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import {
  createSelectionStore,
  SelectionState,
} from '../../features/canvas/stores/slices/selectionStore';
import { ElementId } from '../../features/canvas/types/enhanced.types';

// A helper to create a fresh, isolated store for each test with proper middleware
const createTestStore = () => createStore<SelectionState>()(immer(createSelectionStore));

describe('selectionStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Selection Management', () => {
    test('initializes with empty selection', () => {
      const {
        selectedElementIds,
        lastSelectedElementId,
        selectionRectangle,
      } = store.getState();
      expect(selectedElementIds).toEqual(new Set());
      expect(lastSelectedElementId).toBeNull();
      expect(selectionRectangle).toBeNull();
    });

    test('selects a single element, replacing current selection', () => {
      const id1 = ElementId('elem1');
      store.getState().selectElement(id1);
      expect(store.getState().selectedElementIds).toEqual(new Set([id1]));

      const id2 = ElementId('elem2');
      store.getState().selectElement(id2); // Should replace selection
      expect(store.getState().selectedElementIds).toEqual(new Set([id2]));
      expect(store.getState().lastSelectedElementId).toBe(id2);
    });

    test('selects a single element, adding to current selection', () => {
      const id1 = ElementId('elem1');
      store.getState().selectElement(id1);

      const id2 = ElementId('elem2');
      store.getState().selectElement(id2, true); // Add to selection
      expect(store.getState().selectedElementIds).toEqual(new Set([id1, id2]));
    });

    test('selects multiple elements, replacing current selection', () => {
      store.getState().selectElement(ElementId('initial'));
      const elementIds = [ElementId('elem1'), ElementId('elem2')];
      store.getState().selectMultipleElements(elementIds, true);
      expect(store.getState().selectedElementIds).toEqual(new Set(elementIds));
    });

    test('selects multiple elements, adding to current selection', () => {
      const initialId = ElementId('initial');
      store.getState().selectElement(initialId);
      const newIds = [ElementId('elem1'), ElementId('elem2')];
      store.getState().selectMultipleElements(newIds, false); // Add to selection
      expect(store.getState().selectedElementIds).toEqual(
        new Set([initialId, ...newIds]),
      );
    });

    test('deselects an element', () => {
      const ids = [ElementId('elem1'), ElementId('elem2')];
      store.getState().selectMultipleElements(ids, true);

      store.getState().deselectElement(ElementId('elem1'));
      expect(store.getState().selectedElementIds).toEqual(
        new Set([ElementId('elem2')]),
      );
    });

    test('toggles element selection', () => {
      const id1 = ElementId('elem1');
      const id2 = ElementId('elem2');
      store.getState().selectElement(id1);

      // Toggle on
      store.getState().toggleElementSelection(id2);
      expect(store.getState().selectedElementIds).toEqual(new Set([id1, id2]));

      // Toggle off
      store.getState().toggleElementSelection(id1);
      expect(store.getState().selectedElementIds).toEqual(new Set([id2]));
    });

    test('clears selection', () => {
      const ids = [ElementId('elem1'), ElementId('elem2')];
      store.getState().selectMultipleElements(ids, true);

      store.getState().clearSelection();
      expect(store.getState().selectedElementIds.size).toBe(0);
    });
  });

  describe('Selection Rectangle', () => {
    test('starts selection rectangle', () => {
      store.getState().startSelectionRectangle(10, 20);
      const { selectionRectangle } = store.getState();
      expect(selectionRectangle).toEqual({
        startX: 10,
        startY: 20,
        endX: 10,
        endY: 20,
        isActive: true,
      });
    });

    test('updates selection rectangle', () => {
      store.getState().startSelectionRectangle(10, 20);
      store.getState().updateSelectionRectangle(100, 150);
      const { selectionRectangle } = store.getState();
      expect(selectionRectangle?.endX).toBe(100);
      expect(selectionRectangle?.endY).toBe(150);
    });

    test('cancels selection rectangle', () => {
      store.getState().startSelectionRectangle(10, 20);
      store.getState().cancelSelectionRectangle();
      expect(store.getState().selectionRectangle).toBeNull();
    });
  });
});

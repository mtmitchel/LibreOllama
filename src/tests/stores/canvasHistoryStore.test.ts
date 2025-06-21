import { describe, test, expect, beforeEach } from '@jest/globals';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Patch } from 'immer';
import {
  CanvasHistoryState,
  createCanvasHistoryStore,
} from '../../features/canvas/stores/slices/canvasHistoryStore';
import { HistoryRingBuffer } from '../../features/canvas/utils/RingBuffer';

// For testing, we only need the history store slice
const useTestStore = create<CanvasHistoryState>()(
  immer((...args) => ({
    ...createCanvasHistoryStore(...args),
  })),
);

describe('canvasHistoryStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    const initialState = useTestStore.getState();
    useTestStore.setState(
      {
        ...initialState,
        history: new HistoryRingBuffer(50),
        currentIndex: -1,
        isGrouping: false,
        currentGroupId: null,
      },
      true,
    );
  });

  test('initializes with correct default state', () => {
    const { history, currentIndex, canUndo, canRedo } = useTestStore.getState();
    expect(history.getSize()).toBe(0);
    expect(currentIndex).toBe(-1);
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  test('addHistoryEntry adds an entry and updates state', () => {
    const { addHistoryEntry } = useTestStore.getState();
    const patches: Patch[] = [{ op: 'replace', path: ['foo'], value: 'bar' }];
    const inversePatches: Patch[] = [
      { op: 'replace', path: ['foo'], value: 'baz' },
    ];

    addHistoryEntry('test-action', patches, inversePatches);

    const { history, currentIndex, canUndo, canRedo } = useTestStore.getState();
    expect(history.getSize()).toBe(1);
    expect(currentIndex).toBe(0);
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
    const entry = history.get(0);
    expect(entry?.action).toBe('test-action');
    expect(entry?.patches).toEqual(patches);
    expect(entry?.inversePatches).toEqual(inversePatches);
  });

  test('undo returns inverse patches and decrements index', () => {
    const { addHistoryEntry, undo } = useTestStore.getState();
    const patches: Patch[] = [{ op: 'add', path: ['a'], value: 1 }];
    const inversePatches: Patch[] = [{ op: 'remove', path: ['a'] }];
    addHistoryEntry('action1', patches, inversePatches);

    const undonePatches = undo();

    expect(undonePatches).toEqual(inversePatches);
    const { currentIndex, canUndo, canRedo } = useTestStore.getState();
    expect(currentIndex).toBe(-1);
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);
  });

  test('redo returns patches and increments index', () => {
    const { addHistoryEntry, undo, redo } = useTestStore.getState();
    const patches: Patch[] = [{ op: 'add', path: ['a'], value: 1 }];
    const inversePatches: Patch[] = [{ op: 'remove', path: ['a'] }];
    addHistoryEntry('action1', patches, inversePatches);

    undo();
    const redonePatches = redo();

    expect(redonePatches).toEqual(patches);
    const { currentIndex, canUndo, canRedo } = useTestStore.getState();
    expect(currentIndex).toBe(0);
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
  });

  test('adding a new entry after undo clears the redo history', () => {
    const { addHistoryEntry, undo } = useTestStore.getState();
    addHistoryEntry('action1', [{ op: 'add', path: ['a'], value: 1 }], []);
    addHistoryEntry('action2', [{ op: 'add', path: ['b'], value: 2 }], []);

    undo(); // back to state after action1

    const { canRedo: canRedoBefore } = useTestStore.getState();
    expect(canRedoBefore()).toBe(true);

    addHistoryEntry('action3', [{ op: 'add', path: ['c'], value: 3 }], []);

    const { history, currentIndex, canRedo: canRedoAfter } =
      useTestStore.getState();
    expect(history.getSize()).toBe(2); // action1, action3
    expect(currentIndex).toBe(1);
    expect(canRedoAfter()).toBe(false);
    expect(history.get(1)?.action).toBe('action3');
  });
});

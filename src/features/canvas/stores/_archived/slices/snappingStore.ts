// src/features/canvas/stores/slices/snappingStore.ts
import { StateCreator } from 'zustand';
import { CanvasStore } from '../types';

export interface SnapLine {
  points: number[];
  stroke: string;
}

export interface SnappingState {
  isSnappingEnabled: boolean;
  snapTolerance: number;
  snapLines: SnapLine[];
  snappingActions: {
    toggleSnapping: () => void;
    setSnapTolerance: (tolerance: number) => void;
    setSnapLines: (lines: SnapLine[]) => void;
    clearSnapLines: () => void;
  };
}

export const createSnappingSlice: StateCreator<
  CanvasStore,
  [],
  [],
  SnappingState
> = (set) => ({
  isSnappingEnabled: true,
  snapTolerance: 10,
  snapLines: [],
  snappingActions: {
    toggleSnapping: () =>
      set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),
    setSnapTolerance: (tolerance: number) => set({ snapTolerance: tolerance }),
    setSnapLines: (lines: SnapLine[]) => set({ snapLines: lines }),
    clearSnapLines: () => set({ snapLines: [] }),
  },
});
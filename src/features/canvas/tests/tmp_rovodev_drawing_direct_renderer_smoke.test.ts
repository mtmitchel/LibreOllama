import { describe, it, expect } from 'vitest';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

// Smoke test to ensure drawing update path doesn't throw with direct renderer context

describe('Drawing module + DirectRenderer smoke', () => {
  it('updateDrawing calls do not throw when direct renderer context is present', () => {
    // Ensure actions exist
    const startDrawing = useUnifiedCanvasStore.getState().startDrawing;
    const updateDrawing = useUnifiedCanvasStore.getState().updateDrawing;
    const finishDrawing = useUnifiedCanvasStore.getState().finishDrawing;

    startDrawing('pen', { x: 0, y: 0 });
    updateDrawing({ x: 10, y: 10 });
    finishDrawing();

    expect(true).toBe(true);
  });
});

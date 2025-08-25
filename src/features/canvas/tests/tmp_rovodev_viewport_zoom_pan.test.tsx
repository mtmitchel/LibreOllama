import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CanvasStage } from '../components/CanvasStage';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

// Minimal smoke test to assert viewport <-> stage sync hooks up and does not throw
// Full interaction tests would require mocking Konva stage container events more deeply

describe('CanvasStage viewport sync', () => {
  it('initializes without throwing and exposes viewport in store', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const { unmount } = render(<CanvasStage />, { container: div });

    const vp = useUnifiedCanvasStore.getState().viewport;
    expect(typeof vp.scale).toBe('number');
    expect(typeof vp.x).toBe('number');
    expect(typeof vp.y).toBe('number');

    unmount();
  });
});

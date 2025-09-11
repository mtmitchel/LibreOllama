import { describe, it, expect, vi } from 'vitest';
import {
  worldRectToDOMLike,
  computeTextLiveWorldWidth,
  commitTextFit,
  scaleToSize,
  hysteresisSnap,
  nextFrameRefresh,
} from '../snippets';

describe('compat/snippets', () => {
  it('worldRectToDOMLike converts world rect with scale and stage position', () => {
    const dom = worldRectToDOMLike(
      { left: 100, top: 50 },
      { x: 10, y: 20 },
      { x: 2, y: 3 },
      { x: 5, y: 6, width: 40, height: 10 }
    );
    expect(dom.left).toBe(100 + (5 * 2 + 10)); // 100 + 10 + 10 = 120
    expect(dom.top).toBe(50 + (6 * 3 + 20));   // 50 + 18 + 20 = 88
    expect(dom.width).toBe(40 * 2);            // 80
    expect(dom.height).toBe(10 * 3);           // 30
  });

  it('computeTextLiveWorldWidth enforces min and padding', () => {
    expect(computeTextLiveWorldWidth(0, 12)).toBe(Math.max(12, Math.ceil(12)) + 10);
    expect(computeTextLiveWorldWidth(99.2, 24)).toBe(Math.max(12, Math.ceil(24)) + Math.ceil(99.2) + 10 - Math.ceil(99.2));
    expect(computeTextLiveWorldWidth(100, 14)).toBe(Math.max(12, Math.ceil(14)) + 100 + 10);
  });

  it('commitTextFit returns padded width, scaled height, and inset', () => {
    const r = commitTextFit({ width: 101.2, height: 20 });
    expect(r.width).toBe(Math.ceil(101.2) + 8);
    expect(r.height).toBe(Math.ceil(20 * 1.2));
    expect(r.inset).toEqual({ x: 4, y: 2 });
  });

  it('scaleToSize multiplies size by scale with guards', () => {
    expect(scaleToSize(10, 20, 2, 0.5)).toEqual({ width: 20, height: 10 });
    expect(scaleToSize(10, 20, Number.POSITIVE_INFINITY as any, 1)).toEqual({ width: 10, height: 20 });
  });

  it('hysteresisSnap locks to last snap within hysteresis and respects threshold', () => {
    const cur = { x: 10, y: 10 };
    const near = { x: 25, y: 10 }; // distance 15
    const last = { x: 24, y: 10 };
    // inside threshold (20) and inside hysteresis (8)
    expect(hysteresisSnap(cur, near, last, 20, 8)).toEqual({ snapped: true, point: last });
    // outside threshold
    expect(hysteresisSnap(cur, { x: 40, y: 10 }, null, 20, 8)).toEqual({ snapped: false });
  });

  it('nextFrameRefresh calls function after ~16ms', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    nextFrameRefresh(spy, 'abc', 16);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(16);
    expect(spy).toHaveBeenCalledWith('abc');
    vi.useRealTimers();
  });
});



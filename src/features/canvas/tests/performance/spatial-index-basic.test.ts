import { describe, it, expect } from 'vitest';
import { QuadTree } from '../../utils/spatial/QuadTree';

// A very lightweight test to ensure QuadTree query is functional and performant-ish

describe('QuadTree basic performance', () => {
  it('queries visible elements efficiently for 2000 elements', () => {
    const bounds = { x: -10000, y: -10000, width: 20000, height: 20000 };
    const tree = new QuadTree(bounds, 12, 7);

    const elements = Array.from({ length: 2000 }).map((_, i) => ({
      id: `el-${i}`,
      type: 'rectangle',
      x: Math.random() * 8000 - 4000,
      y: Math.random() * 8000 - 4000,
      width: 40,
      height: 40,
    } as any));

    const startInsert = performance.now();
    elements.forEach(el => tree.insert(el));
    const insertTime = performance.now() - startInsert;

    const viewport = { x: -200, y: -200, width: 800, height: 600 };
    const startQuery = performance.now();
    const result = tree.query(viewport);
    const queryTime = performance.now() - startQuery;

    expect(result.length).toBeLessThan(elements.length);
    // Loose time budgets for CI variance; mainly detects large regressions
    expect(insertTime).toBeLessThan(150); // ms
    expect(queryTime).toBeLessThan(20); // ms
  });
});

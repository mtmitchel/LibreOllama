// src/features/canvas/utils/spatial-index.ts
// SpatialIndex interface and stub implementation.
// Phase 1: simple map-backed index returning all ids. Later we can swap to a QuadTree with the same API.

import type { ElementId } from '../types/enhanced.types';

export type AABB = { x: number; y: number; width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

export interface SpatialIndex {
  insert(id: ElementId | string, aabb: AABB): void;
  update(id: ElementId | string, aabb: AABB): void;
  remove(id: ElementId | string): void;
  clear(): void;
  query(rect: Rect): Iterable<string>;
  nearest(point: { x: number; y: number }, radius?: number): Iterable<string>;
}

class StubSpatialIndex implements SpatialIndex {
  private map = new Map<string, AABB>();

  insert(id: ElementId | string, aabb: AABB): void {
    this.map.set(String(id), { ...aabb });
  }

  update(id: ElementId | string, aabb: AABB): void {
    this.map.set(String(id), { ...aabb });
  }

  remove(id: ElementId | string): void {
    this.map.delete(String(id));
  }

  clear(): void {
    this.map.clear();
  }

  query(_rect: Rect): Iterable<string> {
    // Phase 1: return everything; Phase 2 swaps to real QuadTree
    return this.map.keys();
  }

  nearest(_point: { x: number; y: number }, _radius: number = 64): Iterable<string> {
    // Phase 1: return everything; Phase 2 swaps to real QuadTree nearest
    return this.map.keys();
  }
}

export const createSpatialIndex = (): SpatialIndex => new StubSpatialIndex();

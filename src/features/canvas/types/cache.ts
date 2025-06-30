// Canvas Caching Types (moved from features/canvas/types.ts)

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheManagerInterface {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  clear(key?: string): void;
  size(): number;
}
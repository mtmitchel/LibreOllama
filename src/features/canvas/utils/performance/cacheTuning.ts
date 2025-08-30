export interface CacheThresholds {
  rect: { size: number; complexity: number };
  text: { size: number; complexity: number };
  sticky: { size: number; complexity: number };
  image: { size: number; complexity: number };
}

let thresholds: CacheThresholds = {
  rect: { size: 10000, complexity: 3 },
  text: { size: 10000, complexity: 3 },
  sticky: { size: 12000, complexity: 2 },
  image: { size: 12000, complexity: 2 },
};

const subscribers = new Set<() => void>();

export function getCacheThresholds(): CacheThresholds {
  return thresholds;
}

export function setCacheThresholds(partial: Partial<CacheThresholds>) {
  thresholds = {
    rect: { ...thresholds.rect, ...(partial.rect || {}) },
    text: { ...thresholds.text, ...(partial.text || {}) },
    sticky: { ...thresholds.sticky, ...(partial.sticky || {}) },
    image: { ...thresholds.image, ...(partial.image || {}) },
  };
  subscribers.forEach((fn) => fn());
}

export function subscribeCacheThresholds(fn: () => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

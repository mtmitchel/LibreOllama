// src/features/canvas/hooks/useFeatureFlags.ts
import { useMemo } from 'react';

interface FeatureFlags {
  'grouped-section-rendering': boolean;
  'centralized-transformer': boolean;
  'shape-connector-grouping': boolean;
  'unified-text-overlays': boolean;
}

/**
 * Feature flag hook for gradual canvas architecture migration
 * 
 * This allows us to gradually roll out the new grouping architecture
 * while maintaining backward compatibility
 */
export const useFeatureFlags = (): FeatureFlags => {
  return useMemo(() => ({
    // Phase 1 flags
    'grouped-section-rendering': true, // Enable new section grouping
    'centralized-transformer': true,   // Enable centralized transformer management
    
    // Phase 2 flags (for future implementation)
    'shape-connector-grouping': false, // Not implemented yet
    'unified-text-overlays': false,    // Not implemented yet
  }), []);
};

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const flags = useFeatureFlags();
  return flags[flag];
};

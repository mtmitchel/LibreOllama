/**
 * Feature flags for LibreOllama
 * 
 * This module provides a centralized way to manage feature flags
 * for gradual rollout of new features and migrations.
 */

interface FeatureFlags {
  // Kanban store migration
  useSimplifiedKanbanStore: boolean;
  
  // Future features
  enableAdvancedTaskMetadata: boolean;
  enableOfflineSync: boolean;
  enableRealtimeCollaboration: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  useSimplifiedKanbanStore: false, // Start with false for gradual rollout
  enableAdvancedTaskMetadata: true,
  enableOfflineSync: false,
  enableRealtimeCollaboration: false,
};

// Environment-based overrides
const ENV_OVERRIDES: Partial<FeatureFlags> = {
  // Enable simplified store in development for testing
  ...(process.env.NODE_ENV === 'development' && {
    useSimplifiedKanbanStore: true,
  }),
  
  // Enable all features in test environment
  ...(process.env.NODE_ENV === 'test' && {
    useSimplifiedKanbanStore: true,
    enableAdvancedTaskMetadata: true,
    enableOfflineSync: true,
  }),
};

// Local storage key for user-specific overrides
const FEATURE_FLAGS_KEY = 'libreollama_feature_flags';

/**
 * Get user-specific feature flag overrides from localStorage
 */
function getUserOverrides(): Partial<FeatureFlags> {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Set a user-specific feature flag override
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(
  flag: K,
  value: FeatureFlags[K]
): void {
  const current = getUserOverrides();
  const updated = { ...current, [flag]: value };
  
  try {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save feature flag override:', error);
  }
}

/**
 * Clear all user-specific feature flag overrides
 */
export function clearFeatureFlags(): void {
  try {
    localStorage.removeItem(FEATURE_FLAGS_KEY);
  } catch (error) {
    console.warn('Failed to clear feature flags:', error);
  }
}

/**
 * Get the current value of a feature flag
 */
export function getFeatureFlag<K extends keyof FeatureFlags>(
  flag: K
): FeatureFlags[K] {
  const userOverrides = getUserOverrides();
  
  // Priority: User override > Environment override > Default
  if (flag in userOverrides) {
    return userOverrides[flag] as FeatureFlags[K];
  }
  
  if (flag in ENV_OVERRIDES) {
    return ENV_OVERRIDES[flag] as FeatureFlags[K];
  }
  
  return DEFAULT_FLAGS[flag];
}

/**
 * Get all current feature flags
 */
export function getAllFeatureFlags(): FeatureFlags {
  const userOverrides = getUserOverrides();
  
  return {
    ...DEFAULT_FLAGS,
    ...ENV_OVERRIDES,
    ...userOverrides,
  };
}

/**
 * React hook for using feature flags
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flag: K
): FeatureFlags[K] {
  return getFeatureFlag(flag);
}

/**
 * Utility to conditionally execute code based on feature flags
 */
export function withFeatureFlag<K extends keyof FeatureFlags>(
  flag: K,
  callback: () => void
): void {
  if (getFeatureFlag(flag)) {
    callback();
  }
}

/**
 * Development utilities for testing feature flags
 */
export const devUtils = {
  /**
   * Enable simplified kanban store for development testing
   */
  enableSimplifiedKanban: () => setFeatureFlag('useSimplifiedKanbanStore', true),
  
  /**
   * Disable simplified kanban store to test legacy behavior
   */
  disableSimplifiedKanban: () => setFeatureFlag('useSimplifiedKanbanStore', false),
  
  /**
   * Show current feature flag status
   */
  showFlags: () => {
    console.table(getAllFeatureFlags());
  },
  
  /**
   * Reset all flags to defaults
   */
  resetFlags: () => {
    clearFeatureFlags();
    console.log('Feature flags reset to defaults');
  },
};

// Make dev utils available in development
if (process.env.NODE_ENV === 'development') {
  (window as any).__featureFlags = devUtils;
  console.log('Feature flag dev utils available at window.__featureFlags');
} 
/**
 * Feature Flag System for LibreOllama V2 Design System
 *
 * Provides runtime control over V2 component rollout and design system features.
 * This allows for gradual migration and A/B testing of new components.
 */

import React from 'react';
import { designSystemFlags } from './design-tokens';

export type FeatureFlag = keyof typeof designSystemFlags;

/**
 * Check if a feature flag is enabled
 */
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return designSystemFlags[flag];
};

/**
 * Get all enabled feature flags
 */
export const getEnabledFeatures = (): FeatureFlag[] => {
  return Object.entries(designSystemFlags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
};

/**
 * Check if V2 components should be used
 */
export const useV2Components = (): boolean => {
  return isFeatureEnabled('useV2Components');
};

/**
 * Check if V2 colors should be used
 */
export const useV2Colors = (): boolean => {
  return isFeatureEnabled('useV2Colors');
};

/**
 * Check if V2 typography should be used
 */
export const useV2Typography = (): boolean => {
  return isFeatureEnabled('useV2Typography');
};

/**
 * Check if V2 spacing should be used
 */
export const useV2Spacing = (): boolean => {
  return isFeatureEnabled('useV2Spacing');
};

/**
 * Check if cognitive load optimization is enabled
 */
export const useCognitiveLoadOptimization = (): boolean => {
  return isFeatureEnabled('enableCognitiveLoadOptimization');
};

/**
 * Component wrapper for conditional V2 rendering
 */
export const withV2Feature = <T extends Record<string, any>>(
  V1Component: React.ComponentType<T>,
  V2Component: React.ComponentType<T>,
  flag: FeatureFlag = 'useV2Components'
): React.ComponentType<T> => {
  return (props: T) => {
    const Component = isFeatureEnabled(flag) ? V2Component : V1Component;
    return React.createElement(Component, props);
  };
};

/**
 * Hook for feature flag state
 */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  return isFeatureEnabled(flag);
};

/**
 * Development utilities for testing feature flags
 */
export const devUtils = {
  /**
   * Log all feature flag states (development only)
   */
  logFeatureFlags: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚩 LibreOllama Feature Flags');
      Object.entries(designSystemFlags).forEach(([flag, enabled]) => {
        console.log(`${enabled ? '✅' : '❌'} ${flag}: ${enabled}`);
      });
      console.groupEnd();
    }
  },

  /**
   * Get feature flag summary for debugging
   */
  getFeatureFlagSummary: () => {
    return {
      enabled: getEnabledFeatures(),
      disabled: Object.keys(designSystemFlags).filter(
        flag => !designSystemFlags[flag as FeatureFlag]
      ) as FeatureFlag[],
      total: Object.keys(designSystemFlags).length,
      enabledCount: getEnabledFeatures().length
    };
  }
};

export default {
  isFeatureEnabled,
  getEnabledFeatures,
  useV2Components,
  useV2Colors,
  useV2Typography,
  useV2Spacing,
  useCognitiveLoadOptimization,
  withV2Feature,
  useFeatureFlag,
  devUtils
};
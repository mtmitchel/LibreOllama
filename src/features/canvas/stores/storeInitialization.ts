/**
 * Store Initialization Hardening System
 * Ensures all Maps/Sets are properly constructed and provides store readiness checks
 */

import { UnifiedCanvasStore } from './unifiedCanvasStore';
import { canvasLog } from '../utils/canvasLogger';

export interface StoreInitializationReport {
  isReady: boolean;
  initializationErrors: string[];
  initializationWarnings: string[];
  modulesReady: {
    elements: boolean;
    selection: boolean;
    sections: boolean;
    loading: boolean;
    ui: boolean;
    viewport: boolean;
    drawing: boolean;
    history: boolean;
  };
  timestamp: number;
}

/**
 * Comprehensive store initialization verification
 */
export function verifyStoreInitialization(store: UnifiedCanvasStore): StoreInitializationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const modulesReady = {
    elements: false,
    selection: false,
    sections: false,
    loading: false,
    ui: false,
    viewport: false,
    drawing: false,
    history: false,
  };

  // Verify Element Module
  try {
    if (!store.elements || !(store.elements instanceof Map)) {
      errors.push('Element module: elements Map not initialized');
    } else {
      modulesReady.elements = true;
    }

    if (!Array.isArray(store.elementOrder)) {
      errors.push('Element module: elementOrder array not initialized');
      modulesReady.elements = false;
    }
  } catch (error) {
    errors.push(`Element module verification failed: ${error}`);
  }

  // Verify Selection Module
  try {
    if (!store.selectedElementIds || !(store.selectedElementIds instanceof Set)) {
      errors.push('Selection module: selectedElementIds Set not initialized');
    } else {
      modulesReady.selection = true;
    }

    if (!store.groups || !(store.groups instanceof Map)) {
      errors.push('Selection module: groups Map not initialized');
      modulesReady.selection = false;
    }

    if (!store.elementToGroupMap || !(store.elementToGroupMap instanceof Map)) {
      errors.push('Selection module: elementToGroupMap Map not initialized');
      modulesReady.selection = false;
    }
  } catch (error) {
    errors.push(`Selection module verification failed: ${error}`);
  }

  // Verify Section Module
  try {
    if (!store.sections || !(store.sections instanceof Map)) {
      errors.push('Section module: sections Map not initialized');
    } else {
      modulesReady.sections = true;
    }

    if (!store.sectionElementMap || !(store.sectionElementMap instanceof Map)) {
      errors.push('Section module: sectionElementMap Map not initialized');
      modulesReady.sections = false;
    }
  } catch (error) {
    errors.push(`Section module verification failed: ${error}`);
  }

  // Verify Loading Module
  try {
    if (!store.elementLoadingStates || !(store.elementLoadingStates instanceof Map)) {
      errors.push('Loading module: elementLoadingStates Map not initialized');
    } else {
      modulesReady.loading = true;
    }

    if (!store.operationLoadingStates || !(store.operationLoadingStates instanceof Map)) {
      errors.push('Loading module: operationLoadingStates Map not initialized');
      modulesReady.loading = false;
    }
  } catch (error) {
    errors.push(`Loading module verification failed: ${error}`);
  }

  // Verify UI Module
  try {
    if (!store.visibleElementIds || !(store.visibleElementIds instanceof Set)) {
      errors.push('UI module: visibleElementIds Set not initialized');
    } else {
      modulesReady.ui = true;
    }

    if (typeof store.selectedTool !== 'string') {
      warnings.push('UI module: selectedTool not properly initialized');
    }
  } catch (error) {
    errors.push(`UI module verification failed: ${error}`);
  }

  // Verify Viewport Module
  try {
    if (!store.viewport || typeof store.viewport !== 'object') {
      errors.push('Viewport module: viewport object not initialized');
    } else {
      const viewport = store.viewport;
      if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number' || 
          typeof viewport.scale !== 'number' || typeof viewport.width !== 'number' || 
          typeof viewport.height !== 'number') {
        errors.push('Viewport module: viewport properties not properly initialized');
      } else {
        modulesReady.viewport = true;
      }
    }
  } catch (error) {
    errors.push(`Viewport module verification failed: ${error}`);
  }

  // Verify Drawing Module
  try {
    if (typeof store.isDrawing !== 'boolean') {
      warnings.push('Drawing module: isDrawing state not properly initialized');
    }
    
    if (!store.strokeConfig || typeof store.strokeConfig !== 'object') {
      warnings.push('Drawing module: strokeConfig not properly initialized');
    } else {
      modulesReady.drawing = true;
    }
  } catch (error) {
    errors.push(`Drawing module verification failed: ${error}`);
  }

  // Verify History Module
  try {
    if (!Array.isArray(store.history)) {
      errors.push('History module: history array not initialized');
    } else {
      modulesReady.history = true;
    }

    if (typeof store.currentHistoryIndex !== 'number') {
      warnings.push('History module: currentHistoryIndex not properly initialized');
    }
  } catch (error) {
    errors.push(`History module verification failed: ${error}`);
  }

  const isReady = errors.length === 0;

  const report: StoreInitializationReport = {
    isReady,
    initializationErrors: errors,
    initializationWarnings: warnings,
    modulesReady,
    timestamp: Date.now()
  };

  // Log results
  if (isReady) {
    canvasLog.info('✅ [StoreInit] All store modules properly initialized', {
      modulesReady: Object.entries(modulesReady).filter(([, ready]) => ready).map(([name]) => name),
      warnings: warnings.length
    });
  } else {
    canvasLog.error('❌ [StoreInit] Store initialization verification failed', {
      errors: errors.length,
      warnings: warnings.length,
      failedModules: Object.entries(modulesReady).filter(([, ready]) => !ready).map(([name]) => name)
    });
  }

  return report;
}

/**
 * Force initialization of all Maps and Sets in store
 */
export function forceStoreInitialization(store: UnifiedCanvasStore): void {
  canvasLog.info('🔧 [StoreInit] Force initializing store collections...');

  // Initialize elements Map if needed
  if (!store.elements || !(store.elements instanceof Map)) {
    (store as any).elements = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized elements Map');
  }

  // Initialize elementOrder array if needed
  if (!Array.isArray(store.elementOrder)) {
    (store as any).elementOrder = [];
    canvasLog.debug('🔧 [StoreInit] Initialized elementOrder array');
  }

  // Initialize selectedElementIds Set if needed
  if (!store.selectedElementIds || !(store.selectedElementIds instanceof Set)) {
    (store as any).selectedElementIds = new Set();
    canvasLog.debug('🔧 [StoreInit] Initialized selectedElementIds Set');
  }

  // Initialize groups Map if needed
  if (!store.groups || !(store.groups instanceof Map)) {
    (store as any).groups = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized groups Map');
  }

  // Initialize elementToGroupMap Map if needed
  if (!store.elementToGroupMap || !(store.elementToGroupMap instanceof Map)) {
    (store as any).elementToGroupMap = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized elementToGroupMap Map');
  }

  // Initialize sections Map if needed
  if (!store.sections || !(store.sections instanceof Map)) {
    (store as any).sections = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized sections Map');
  }

  // Initialize sectionElementMap Map if needed
  if (!store.sectionElementMap || !(store.sectionElementMap instanceof Map)) {
    (store as any).sectionElementMap = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized sectionElementMap Map');
  }

  // Initialize elementLoadingStates Map if needed
  if (!store.elementLoadingStates || !(store.elementLoadingStates instanceof Map)) {
    (store as any).elementLoadingStates = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized elementLoadingStates Map');
  }

  // Initialize operationLoadingStates Map if needed
  if (!store.operationLoadingStates || !(store.operationLoadingStates instanceof Map)) {
    (store as any).operationLoadingStates = new Map();
    canvasLog.debug('🔧 [StoreInit] Initialized operationLoadingStates Map');
  }

  // Initialize visibleElementIds Set if needed
  if (!store.visibleElementIds || !(store.visibleElementIds instanceof Set)) {
    (store as any).visibleElementIds = new Set();
    canvasLog.debug('🔧 [StoreInit] Initialized visibleElementIds Set');
  }

  // Initialize viewport object if needed
  if (!store.viewport || typeof store.viewport !== 'object') {
    (store as any).viewport = {
      x: 0,
      y: 0,
      scale: 1,
      width: 1920,
      height: 1080
    };
    canvasLog.debug('🔧 [StoreInit] Initialized viewport object');
  }

  // Initialize history array if needed
  if (!Array.isArray(store.history)) {
    (store as any).history = [];
    canvasLog.debug('🔧 [StoreInit] Initialized history array');
  }

  canvasLog.info('✅ [StoreInit] Force initialization completed');
}

/**
 * Create store initialization hook for components
 */
export function useStoreInitialization(store: UnifiedCanvasStore): {
  isStoreReady: boolean;
  initializationReport: StoreInitializationReport | null;
  forceInitialize: () => void;
} {
  const report = verifyStoreInitialization(store);

  return {
    isStoreReady: report.isReady,
    initializationReport: report,
    forceInitialize: () => forceStoreInitialization(store)
  };
}

/**
 * Store readiness guard for components
 */
export function withStoreReadinessGuard<T>(
  component: T,
  store: UnifiedCanvasStore,
  fallback?: React.ReactNode
): T | null {
  const report = verifyStoreInitialization(store);
  
  if (!report.isReady) {
    if (fallback) {
      return fallback as T;
    }
    canvasLog.warn('🚫 [StoreInit] Component blocked due to store not ready');
    return null;
  }
  
  return component;
}
/**
 * DEBUG SCRIPT: Test modular system initialization and sync
 *
 * This script will help identify the root cause of the modular system integration failure
 * where all 10 toolbar tools are broken.
 */

// Add debug logging to console to track modular system lifecycle
console.log('=== MODULAR SYSTEM DEBUG SCRIPT ===');

// Function to check if modular system is initialized
function checkModularSystem() {
  console.log('\n[DEBUG] Checking modular system state...');

  // Check if stage exists and has modular core
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('[DEBUG] ❌ No canvas found');
    return false;
  }

  console.log('[DEBUG] ✓ Canvas found');

  // Try to access the stage through Konva
  const stage = window.Konva?.stages?.[0];
  if (!stage) {
    console.error('[DEBUG] ❌ No Konva stage found');
    return false;
  }

  console.log('[DEBUG] ✓ Konva stage found');

  // Check if modular core is attached
  const modCore = stage.__mod_core__;
  if (!modCore) {
    console.error('[DEBUG] ❌ No __mod_core__ found on stage');
    return false;
  }

  console.log('[DEBUG] ✓ __mod_core__ found:', modCore);

  // Check if core has modules registered
  if (!modCore.core) {
    console.error('[DEBUG] ❌ No core found in __mod_core__');
    return false;
  }

  console.log('[DEBUG] ✓ RendererCore found');
  console.log('[DEBUG] Modules registered:', modCore.core.modules?.length || 0);

  // Check if store adapter exists
  try {
    const store = window.__UNIFIED_CANVAS_STORE__;
    if (!store) {
      console.error('[DEBUG] ❌ __UNIFIED_CANVAS_STORE__ not found');
      return false;
    }

    console.log('[DEBUG] ✓ Unified store found');

    // Test if store subscription works
    let subscriptionCalled = false;
    const testSub = store.subscribe(() => {
      subscriptionCalled = true;
      console.log('[DEBUG] ✓ Store subscription triggered!');
    });

    // Trigger a dummy store change
    const state = store.getState();
    if (state.setSelectedTool) {
      const currentTool = state.selectedTool;
      state.setSelectedTool('hand');
      setTimeout(() => state.setSelectedTool(currentTool), 10);
    }

    // Check if subscription was called
    setTimeout(() => {
      testSub(); // Unsubscribe
      console.log('[DEBUG] Store subscription test:', subscriptionCalled ? '✓ PASSED' : '❌ FAILED');
    }, 50);

    return true;
  } catch (error) {
    console.error('[DEBUG] ❌ Error testing store:', error);
    return false;
  }
}

// Function to test element creation flow
function testElementCreation() {
  console.log('\n[DEBUG] Testing element creation flow...');

  try {
    const store = window.__UNIFIED_CANVAS_STORE__;
    if (!store) {
      console.error('[DEBUG] ❌ Store not available for element test');
      return;
    }

    const state = store.getState();
    const initialElementCount = state.elements?.size || 0;
    console.log('[DEBUG] Initial element count:', initialElementCount);

    // Create a test text element
    const testElement = {
      id: 'test-' + Date.now(),
      type: 'text',
      x: 100,
      y: 100,
      width: 100,
      height: 30,
      text: 'Test Element',
      fontSize: 16,
      fill: '#000000',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    console.log('[DEBUG] Creating test element:', testElement.id);

    // Add element to store
    state.addElement(testElement);

    // Check if element was added
    setTimeout(() => {
      const newState = store.getState();
      const newElementCount = newState.elements?.size || 0;
      console.log('[DEBUG] Element count after creation:', newElementCount);

      if (newElementCount > initialElementCount) {
        console.log('[DEBUG] ✓ Element creation PASSED');

        // Now check if modular system rendered it
        const stage = window.Konva?.stages?.[0];
        const modCore = stage?.__mod_core__;

        if (modCore) {
          console.log('[DEBUG] Triggering manual sync to test rendering...');
          try {
            const storeAdapter = modCore.store || { getSnapshot: () => newState };
            modCore.core.sync(storeAdapter.getSnapshot());
            console.log('[DEBUG] ✓ Manual sync completed');
          } catch (error) {
            console.error('[DEBUG] ❌ Manual sync failed:', error);
          }
        }

        // Clean up test element
        setTimeout(() => {
          try {
            newState.removeElement(testElement.id);
            console.log('[DEBUG] Test element cleaned up');
          } catch (e) {
            console.warn('[DEBUG] Could not clean up test element:', e);
          }
        }, 1000);

      } else {
        console.error('[DEBUG] ❌ Element creation FAILED');
      }
    }, 100);

  } catch (error) {
    console.error('[DEBUG] ❌ Error in element creation test:', error);
  }
}

// Main debug sequence
function runDebugSequence() {
  console.log('[DEBUG] Starting debug sequence in 1 second...');

  setTimeout(() => {
    const systemReady = checkModularSystem();

    if (systemReady) {
      console.log('[DEBUG] ✓ Modular system appears to be initialized');
      testElementCreation();
    } else {
      console.error('[DEBUG] ❌ Modular system initialization FAILED');
      console.log('[DEBUG] Retrying in 2 seconds...');
      setTimeout(checkModularSystem, 2000);
    }
  }, 1000);
}

// Auto-run when script loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDebugSequence);
  } else {
    runDebugSequence();
  }
} else {
  console.log('[DEBUG] Script loaded but not in browser environment');
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.debugModularSystem = {
    check: checkModularSystem,
    testElementCreation: testElementCreation,
    run: runDebugSequence
  };

  console.log('[DEBUG] Debug functions available as window.debugModularSystem');
}
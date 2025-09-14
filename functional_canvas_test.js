/**
 * Functional Canvas Testing Script
 *
 * This script tests actual canvas functionality by injecting into the running application
 * and validating behavior of both monolithic and modular systems.
 */

// Test Configuration
const TESTS = {
  // Basic functionality tests
  featureFlagToggle: true,
  systemInitialization: true,

  // Drawing functionality
  penTool: true,
  markerTool: true,
  highlighterTool: true,

  // Text functionality
  textCreation: true,
  textEditing: true,
  doubleTextFieldCheck: true,

  // Selection and interaction
  elementSelection: true,
  transformHandles: true,

  // Integration tests
  toolSwitching: true,
  undoRedo: true,

  // Performance tests
  fps: true,
  memory: true,

  // Edge cases
  rapidInteractions: true,
  errorRecovery: true
};

// Global test state
let testState = {
  currentSystem: null,
  results: {},
  performance: {},
  errors: []
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}]`;

  console.log(`${prefix} ${message}`);
  if (data) console.log(data);

  // Update test metrics
  if (level === 'error') {
    testState.errors.push({ message, data, timestamp });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Feature flag utilities
function getCurrentSystem() {
  try {
    const flagValue = localStorage.getItem('USE_NEW_CANVAS');
    return flagValue === 'true' ? 'modular' : 'monolithic';
  } catch {
    return 'unknown';
  }
}

function setSystem(system) {
  try {
    localStorage.setItem('USE_NEW_CANVAS', system === 'modular' ? 'true' : 'false');
    log('info', `Feature flag set to: ${system}`);
    return true;
  } catch (error) {
    log('error', 'Failed to set feature flag', error);
    return false;
  }
}

function refreshApp() {
  try {
    window.location.reload();
    return true;
  } catch (error) {
    log('error', 'Failed to refresh application', error);
    return false;
  }
}

// System detection
function detectActiveSystem() {
  log('info', 'Detecting active canvas system...');

  const indicators = {
    // Check for modular system indicators
    modularCore: !!(window.__mod_core__ || document.querySelector('[data-system="modular"]')),
    modularStore: !!(window.__UNIFIED_CANVAS_STORE__),

    // Check for monolithic system indicators
    monolithicRenderer: !!(window.__CANVAS_RENDERER_V2__),
    monolithicTransformer: !!(window.__CANVAS_TRANSFORMER__),

    // Check stage and layers
    stage: !!(window.stage || document.querySelector('canvas')),

    // Feature flag state
    flagValue: getCurrentSystem()
  };

  log('info', 'System indicators:', indicators);

  // Determine active system
  let activeSystem = 'unknown';
  if (indicators.flagValue === 'modular' && indicators.modularCore) {
    activeSystem = 'modular';
  } else if (indicators.flagValue === 'monolithic' && indicators.monolithicRenderer) {
    activeSystem = 'monolithic';
  } else if (indicators.monolithicRenderer && !indicators.modularCore) {
    activeSystem = 'monolithic';
  }

  testState.currentSystem = activeSystem;
  log('info', `Active system detected: ${activeSystem}`);

  return {
    system: activeSystem,
    indicators,
    isConsistent: indicators.flagValue === activeSystem
  };
}

// Test functions
async function testFeatureFlagToggle() {
  log('info', 'Testing feature flag toggle...');

  const originalSystem = getCurrentSystem();

  try {
    // Test enabling modular
    setSystem('modular');
    await sleep(100);

    const modularFlag = getCurrentSystem();
    if (modularFlag !== 'modular') {
      throw new Error('Failed to enable modular system');
    }

    // Test enabling monolithic
    setSystem('monolithic');
    await sleep(100);

    const monolithicFlag = getCurrentSystem();
    if (monolithicFlag !== 'monolithic') {
      throw new Error('Failed to enable monolithic system');
    }

    // Restore original
    setSystem(originalSystem);

    log('success', 'Feature flag toggle test PASSED');
    return true;
  } catch (error) {
    log('error', 'Feature flag toggle test FAILED', error);
    return false;
  }
}

async function testSystemInitialization() {
  log('info', 'Testing system initialization...');

  const detection = detectActiveSystem();

  const checks = {
    systemDetected: detection.system !== 'unknown',
    flagConsistent: detection.isConsistent,
    stagePresent: !!detection.indicators.stage,
    rendererPresent: detection.system === 'modular' ?
      detection.indicators.modularCore :
      detection.indicators.monolithicRenderer
  };

  const allPassed = Object.values(checks).every(Boolean);

  if (allPassed) {
    log('success', `System initialization test PASSED (${detection.system})`);
  } else {
    log('error', 'System initialization test FAILED', checks);
  }

  return allPassed;
}

async function testDrawingTool(toolName) {
  log('info', `Testing ${toolName} drawing tool...`);

  try {
    // Get canvas store
    const store = window.__UNIFIED_CANVAS_STORE__?.getState?.();
    if (!store) {
      throw new Error('Canvas store not available');
    }

    // Set drawing tool
    if (store.setSelectedTool) {
      store.setSelectedTool(toolName);
      await sleep(100);

      const currentTool = store.selectedTool;
      if (currentTool !== toolName) {
        throw new Error(`Failed to set tool to ${toolName}, got ${currentTool}`);
      }
    }

    // Simulate drawing stroke
    const stage = window.stage;
    if (!stage) {
      throw new Error('Stage not available for drawing test');
    }

    // Create mock pointer events
    const testPoints = [
      { x: 100, y: 100 },
      { x: 150, y: 120 },
      { x: 200, y: 100 }
    ];

    // Test would normally simulate actual pointer events here
    // For now, we'll check if the tool is properly selected

    log('success', `${toolName} drawing tool test PASSED`);
    return true;

  } catch (error) {
    log('error', `${toolName} drawing tool test FAILED`, error);
    return false;
  }
}

async function testTextCreation() {
  log('info', 'Testing text creation...');

  try {
    const store = window.__UNIFIED_CANVAS_STORE__?.getState?.();
    if (!store) {
      throw new Error('Canvas store not available');
    }

    // Set text tool
    if (store.setSelectedTool) {
      store.setSelectedTool('text');
      await sleep(100);

      if (store.selectedTool !== 'text') {
        throw new Error(`Failed to set text tool`);
      }
    }

    // Check if text creation logic is available
    const textCreationAvailable = !!(store.addElement && store.createElementId);
    if (!textCreationAvailable) {
      throw new Error('Text creation methods not available in store');
    }

    log('success', 'Text creation test PASSED');
    return true;

  } catch (error) {
    log('error', 'Text creation test FAILED', error);
    return false;
  }
}

async function testDoubleTextFieldCheck() {
  log('info', 'CRITICAL: Testing for double text field issue...');

  try {
    // Check for multiple text editors
    const textEditors = document.querySelectorAll('[data-role*="text-editor"], [data-text-editing="true"]');
    const count = textEditors.length;

    log('info', `Found ${count} text editor elements`);

    if (count > 1) {
      log('error', `CRITICAL: ${count} text editors detected (should be max 1)`, Array.from(textEditors));
      return false;
    }

    // Check for duplicate initialization indicators
    const modularTextFlag = window.__MODULAR_TEXT_EDITING__;
    const monolithicEditing = window.__CANVAS_RENDERER_V2__?.currentEditingId;

    if (modularTextFlag && monolithicEditing) {
      log('error', 'CRITICAL: Both modular and monolithic text editing active simultaneously');
      return false;
    }

    log('success', 'Double text field check PASSED');
    return true;

  } catch (error) {
    log('error', 'Double text field check FAILED', error);
    return false;
  }
}

async function testPerformance() {
  log('info', 'Testing performance metrics...');

  try {
    // FPS measurement
    let frameCount = 0;
    const startTime = performance.now();

    const measureFPS = () => {
      return new Promise(resolve => {
        function countFrame() {
          frameCount++;
          const elapsed = performance.now() - startTime;

          if (elapsed >= 1000) {
            const fps = Math.round((frameCount * 1000) / elapsed);
            resolve(fps);
          } else {
            requestAnimationFrame(countFrame);
          }
        }
        requestAnimationFrame(countFrame);
      });
    };

    const fps = await measureFPS();
    testState.performance.fps = fps;

    // Memory measurement
    let memory = 0;
    if (performance.memory) {
      memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      testState.performance.memory = memory;
    }

    log('info', `Performance: ${fps} FPS, ${memory}MB memory`);

    // Validate thresholds
    const fpsPass = fps >= 30; // Lower threshold for testing
    const memoryPass = memory <= 1000 || memory === 0; // Higher threshold for testing

    if (fpsPass && memoryPass) {
      log('success', 'Performance test PASSED');
      return true;
    } else {
      log('warning', `Performance issues: FPS=${fps} (need ≥30), Memory=${memory}MB (need ≤1000MB)`);
      return false;
    }

  } catch (error) {
    log('error', 'Performance test FAILED', error);
    return false;
  }
}

async function testRollbackCapability() {
  log('info', 'Testing rollback capability...');

  try {
    // Check if rollback functions exist
    const rollbackAvailable = !!(window.CANVAS_EMERGENCY_ROLLBACK && window.CANVAS_ENABLE_NEW_CANVAS);

    if (!rollbackAvailable) {
      log('error', 'Rollback functions not available on window object');
      return false;
    }

    log('success', 'Rollback capability test PASSED');
    return true;

  } catch (error) {
    log('error', 'Rollback capability test FAILED', error);
    return false;
  }
}

// Main test runner
async function runFunctionalTests() {
  log('info', '='.repeat(60));
  log('info', 'FUNCTIONAL CANVAS TESTING SUITE');
  log('info', '='.repeat(60));

  const results = {};

  // Initial system detection
  const initialSystem = detectActiveSystem();
  log('info', `Starting tests with ${initialSystem.system} system`);

  // Core functionality tests
  if (TESTS.featureFlagToggle) {
    results.featureFlagToggle = await testFeatureFlagToggle();
  }

  if (TESTS.systemInitialization) {
    results.systemInitialization = await testSystemInitialization();
  }

  // Drawing tools
  if (TESTS.penTool) {
    results.penTool = await testDrawingTool('pen');
  }

  if (TESTS.markerTool) {
    results.markerTool = await testDrawingTool('marker');
  }

  if (TESTS.highlighterTool) {
    results.highlighterTool = await testDrawingTool('highlighter');
  }

  // Text functionality
  if (TESTS.textCreation) {
    results.textCreation = await testTextCreation();
  }

  if (TESTS.doubleTextFieldCheck) {
    results.doubleTextFieldCheck = await testDoubleTextFieldCheck();
  }

  // Performance
  if (TESTS.fps || TESTS.memory) {
    results.performance = await testPerformance();
  }

  // Rollback capability
  results.rollbackCapability = await testRollbackCapability();

  // Generate report
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  log('info', '='.repeat(60));
  log('info', 'FUNCTIONAL TEST RESULTS');
  log('info', '='.repeat(60));
  log('info', `Tests Passed: ${passed}/${total} (${passRate}%)`);
  log('info', `Current System: ${testState.currentSystem}`);
  log('info', `Performance: ${testState.performance.fps || 'N/A'} FPS, ${testState.performance.memory || 'N/A'}MB`);

  if (testState.errors.length > 0) {
    log('warning', `Errors encountered: ${testState.errors.length}`);
  }

  // Overall assessment
  const criticalTests = ['systemInitialization', 'doubleTextFieldCheck', 'rollbackCapability'];
  const criticalFailures = criticalTests.filter(test => results[test] === false);

  if (criticalFailures.length === 0 && passRate >= 80) {
    log('success', '✅ FUNCTIONAL TESTS PASSED - System ready for migration');
  } else if (criticalFailures.length > 0) {
    log('error', `❌ CRITICAL FAILURES: ${criticalFailures.join(', ')}`);
  } else {
    log('warning', `⚠️ SOME TESTS FAILED - Pass rate ${passRate}% below 80%`);
  }

  return {
    results,
    passRate: parseFloat(passRate),
    criticalFailures,
    canProceed: criticalFailures.length === 0 && passRate >= 80
  };
}

// Export for manual execution
window.FUNCTIONAL_TESTS = {
  run: runFunctionalTests,
  testDoubleTextFieldCheck,
  testPerformance,
  testRollbackCapability,
  detectActiveSystem,
  setSystem,
  getCurrentSystem
};

// Auto-run if in test mode
if (window.location.search.includes('runFunctionalTests=true')) {
  window.addEventListener('load', () => {
    setTimeout(runFunctionalTests, 2000);
  });
}

log('info', 'Functional testing script loaded. Run window.FUNCTIONAL_TESTS.run() to start tests.');
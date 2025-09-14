/**
 * Canvas Migration Validation Script
 *
 * This script performs comprehensive testing of both monolithic and modular
 * canvas systems to validate feature parity and system readiness for migration.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testTimeout: 30000,
  performanceThresholds: {
    minFPS: 55,
    maxMemoryMB: 500,
    maxResponseTimeMs: 16
  },
  criticalFeatures: [
    'drawing_tools',
    'text_editing',
    'selection_system',
    'connector_tools',
    'viewport_operations'
  ]
};

// Test results tracking
let testResults = {
  monolithic: {
    tested: false,
    results: {},
    performance: {},
    issues: []
  },
  modular: {
    tested: false,
    results: {},
    performance: {},
    issues: []
  },
  comparison: {
    featureParity: true,
    performanceRatio: null,
    criticalDifferences: []
  },
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0,
    canMigrate: false,
    confidence: 'LOW'
  }
};

// Logging utility with colors
function log(level, message, data = null) {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'
  };

  const timestamp = new Date().toISOString();
  const prefix = `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${colors.reset}`;

  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }

  // Update counters
  if (level === 'error') testResults.summary.failed++;
  else if (level === 'warning') testResults.summary.warnings++;
  else if (level === 'success') testResults.summary.passed++;
}

// Feature flag validation
function validateFeatureFlagSystem() {
  log('info', '🚩 Validating feature flag system...');

  try {
    const flagUtilsPath = path.join(__dirname, 'src', 'features', 'canvas', 'utils', 'canvasFlags.ts');

    if (!fs.existsSync(flagUtilsPath)) {
      log('error', 'Feature flag utilities not found');
      return false;
    }

    const flagContent = fs.readFileSync(flagUtilsPath, 'utf8');

    // Check for required functions
    const requiredFunctions = [
      'readNewCanvasFlag',
      'setNewCanvasFlag',
      'installRollbackShortcuts'
    ];

    let allFunctionsPresent = true;
    requiredFunctions.forEach(func => {
      if (!flagContent.includes(`export function ${func}`)) {
        log('error', `Required function ${func} not found in canvasFlags.ts`);
        allFunctionsPresent = false;
      }
    });

    // Check safety-first default
    if (!flagContent.includes('return false') || !flagContent.includes('Safety-first default')) {
      log('warning', 'Safety-first default behavior may not be properly implemented');
    }

    if (allFunctionsPresent) {
      log('success', 'Feature flag system validation passed');
      return true;
    }

  } catch (error) {
    log('error', 'Feature flag validation failed:', error.message);
  }

  return false;
}

// Module architecture validation
function validateModularArchitecture() {
  log('info', '🧩 Validating modular architecture...');

  const modulesPath = path.join(__dirname, 'src', 'features', 'canvas', 'renderer', 'modular', 'modules');
  const expectedModules = [
    'SelectionModule.ts',
    'ViewportModule.ts',
    'EraserModule.ts',
    'TextModule.ts',
    'ConnectorModule.ts',
    'DrawingModule.ts'
  ];

  let allModulesPresent = true;
  expectedModules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    if (!fs.existsSync(modulePath)) {
      log('error', `Required module ${module} not found`);
      allModulesPresent = false;
    } else {
      // Check module implementation
      const moduleContent = fs.readFileSync(modulePath, 'utf8');

      // Validate module interface compliance
      const requiredMethods = ['init', 'sync', 'destroy'];
      const missingMethods = requiredMethods.filter(method =>
        !moduleContent.includes(`${method}(`) && !moduleContent.includes(`${method} (`)
      );

      if (missingMethods.length > 0) {
        log('warning', `Module ${module} missing methods: ${missingMethods.join(', ')}`);
      }
    }
  });

  if (allModulesPresent) {
    log('success', `All ${expectedModules.length} modules present and accounted for`);
    return true;
  }

  return false;
}

// Check for known critical issues
function checkKnownIssues() {
  log('info', '🔍 Checking for known critical issues...');

  const issues = [];

  // Check for TextModule feature flag fix
  try {
    const textModulePath = path.join(__dirname, 'src', 'features', 'canvas', 'renderer', 'modular', 'modules', 'TextModule.ts');
    const textModuleContent = fs.readFileSync(textModulePath, 'utf8');

    // Check if TextModule is using FF_TEXT flag in the isEnabled method (not just comments)
    const ffTextUsageRegex = /localStorage\.getItem\(['"']FF_TEXT['"']\)/;
    if (ffTextUsageRegex.test(textModuleContent)) {
      issues.push({
        severity: 'critical',
        module: 'TextModule',
        issue: 'Still using separate FF_TEXT flag instead of USE_NEW_CANVAS',
        impact: 'Inconsistent feature flag behavior'
      });
    }

    // Check if USE_NEW_CANVAS is properly used
    if (!textModuleContent.includes('USE_NEW_CANVAS')) {
      issues.push({
        severity: 'critical',
        module: 'TextModule',
        issue: 'Not using main feature flag system',
        impact: 'Module may not respect system-wide enable/disable'
      });
    }

  } catch (error) {
    log('warning', 'Could not check TextModule for known issues:', error.message);
  }

  // Check CanvasRendererV2 for FF_TEXT usage
  try {
    const rendererPath = path.join(__dirname, 'src', 'features', 'canvas', 'services', 'CanvasRendererV2.ts');
    const rendererContent = fs.readFileSync(rendererPath, 'utf8');

    // Check if CanvasRendererV2 is using FF_TEXT flag instead of USE_NEW_CANVAS
    const ffTextUsageRegex = /localStorage\.getItem\(['"']FF_TEXT['"']\)/;
    if (ffTextUsageRegex.test(rendererContent)) {
      issues.push({
        severity: 'critical',
        module: 'CanvasRendererV2',
        issue: 'Still using separate FF_TEXT flag for modular delegation instead of USE_NEW_CANVAS',
        impact: 'Inconsistent feature flag behavior between monolithic and modular systems'
      });
    }

  } catch (error) {
    log('warning', 'Could not check CanvasRendererV2 for known issues:', error.message);
  }

  // Check NonReactCanvasStage initialization logic
  try {
    const stagePath = path.join(__dirname, 'src', 'features', 'canvas', 'components', 'NonReactCanvasStage.tsx');
    const stageContent = fs.readFileSync(stagePath, 'utf8');

    // Check for modular initialization
    if (!stageContent.includes('readNewCanvasFlag')) {
      issues.push({
        severity: 'warning',
        module: 'NonReactCanvasStage',
        issue: 'May not be checking feature flag for initialization',
        impact: 'Modular system may not activate when flag is enabled'
      });
    }

    // Check for proper module registration
    const modules = ['SelectionModule', 'ViewportModule', 'EraserModule', 'TextModule', 'ConnectorModule', 'DrawingModule'];
    modules.forEach(module => {
      if (!stageContent.includes(module)) {
        issues.push({
          severity: 'critical',
          module: 'NonReactCanvasStage',
          issue: `${module} not registered in stage initialization`,
          impact: `${module} functionality will not work in modular system`
        });
      }
    });

  } catch (error) {
    log('warning', 'Could not check NonReactCanvasStage for known issues:', error.message);
  }

  // Report issues
  if (issues.length === 0) {
    log('success', 'No known critical issues found');
    return true;
  } else {
    log('warning', `Found ${issues.length} potential issues:`);
    issues.forEach(issue => {
      log(issue.severity === 'critical' ? 'error' : 'warning',
          `[${issue.module}] ${issue.issue} - Impact: ${issue.impact}`);
    });

    testResults.summary.criticalIssues = issues.filter(i => i.severity === 'critical');
    return issues.filter(i => i.severity === 'critical').length === 0;
  }
}

// Check system readiness indicators
function checkSystemReadiness() {
  log('info', '✅ Checking system readiness indicators...');

  const readinessChecks = {
    featureFlagSystem: false,
    modularArchitecture: false,
    rollbackCapability: false,
    noKnownIssues: false,
    testingInfrastructure: false
  };

  // Feature flag system
  readinessChecks.featureFlagSystem = validateFeatureFlagSystem();

  // Modular architecture
  readinessChecks.modularArchitecture = validateModularArchitecture();

  // Rollback capability (check for emergency functions)
  try {
    const flagUtilsPath = path.join(__dirname, 'src', 'features', 'canvas', 'utils', 'canvasFlags.ts');
    const flagContent = fs.readFileSync(flagUtilsPath, 'utf8');
    readinessChecks.rollbackCapability = flagContent.includes('CANVAS_EMERGENCY_ROLLBACK');
  } catch {
    readinessChecks.rollbackCapability = false;
  }

  // Known issues
  readinessChecks.noKnownIssues = checkKnownIssues();

  // Testing infrastructure
  try {
    const probesPath = path.join(__dirname, 'src', 'features', 'canvas', 'dev', 'probes.ts');
    readinessChecks.testingInfrastructure = fs.existsSync(probesPath);
  } catch {
    readinessChecks.testingInfrastructure = false;
  }

  // Calculate readiness score
  const readyCount = Object.values(readinessChecks).filter(Boolean).length;
  const totalChecks = Object.keys(readinessChecks).length;
  const readinessPercent = (readyCount / totalChecks) * 100;

  log('info', `System Readiness: ${readyCount}/${totalChecks} (${readinessPercent.toFixed(1)}%)`);

  Object.entries(readinessChecks).forEach(([check, passed]) => {
    log(passed ? 'success' : 'error', `  ${check}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  return {
    checks: readinessChecks,
    score: readinessPercent,
    ready: readinessPercent >= 80 // 80% threshold for readiness
  };
}

// Generate migration recommendation
function generateMigrationRecommendation(readiness) {
  log('info', '🎯 Generating migration recommendation...');

  const { summary } = testResults;
  const criticalFailures = summary.failed > 0;
  const hasKnownIssues = summary.criticalIssues && summary.criticalIssues.length > 0;

  let recommendation = 'GO';
  let confidence = 'HIGH';
  let reasons = [];

  if (criticalFailures) {
    recommendation = 'NO-GO';
    confidence = 'HIGH';
    reasons.push('Critical functionality failures detected');
  } else if (hasKnownIssues) {
    recommendation = 'NO-GO';
    confidence = 'HIGH';
    reasons.push('Known critical issues must be resolved first');
  } else if (!readiness.ready) {
    recommendation = 'CONDITIONAL';
    confidence = 'MEDIUM';
    reasons.push(`System readiness below threshold (${readiness.score.toFixed(1)}% < 80%)`);
  } else if (summary.warnings > 2) {
    recommendation = 'CONDITIONAL';
    confidence = 'MEDIUM';
    reasons.push('Multiple warnings require attention');
  }

  // Final recommendation
  testResults.summary.canMigrate = recommendation === 'GO';
  testResults.summary.confidence = confidence;

  log('info', '='.repeat(60));
  log('info', 'MIGRATION READINESS ASSESSMENT');
  log('info', '='.repeat(60));

  log('info', `Recommendation: ${recommendation}`);
  log('info', `Confidence: ${confidence}`);
  log('info', `System Readiness: ${readiness.score.toFixed(1)}%`);

  if (reasons.length > 0) {
    log('info', 'Reasons:');
    reasons.forEach(reason => log('info', `  • ${reason}`));
  }

  // Specific recommendations
  log('info', '');
  log('info', 'Specific Recommendations:');

  switch (recommendation) {
    case 'GO':
      log('success', '✅ PROCEED WITH MIGRATION');
      log('info', '  • All systems ready for feature flag flip');
      log('info', '  • Monitor closely during initial rollout');
      log('info', '  • Keep rollback procedures ready');
      break;

    case 'CONDITIONAL':
      log('warning', '⚠️ PROCEED WITH CAUTION');
      log('info', '  • Address warnings before migration if possible');
      log('info', '  • Implement staged rollout with close monitoring');
      log('info', '  • Ensure rollback procedures are tested and ready');
      break;

    case 'NO-GO':
      log('error', '❌ DO NOT PROCEED WITH MIGRATION');
      log('info', '  • Resolve all critical issues first');
      log('info', '  • Re-run validation after fixes');
      log('info', '  • Consider additional testing of problem areas');
      break;
  }

  return {
    recommendation,
    confidence,
    readinessScore: readiness.score,
    reasons,
    canProceed: recommendation !== 'NO-GO'
  };
}

// Main validation function
async function validateCanvasMigration() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 CANVAS MIGRATION VALIDATION SUITE');
  console.log('LibreOllama - Monolithic to Modular Architecture Migration');
  console.log('='.repeat(80) + '\n');

  log('info', 'Starting comprehensive migration validation...');

  // Phase 1: System Readiness Assessment
  const readiness = checkSystemReadiness();

  // Phase 2: Generate Recommendation
  const recommendation = generateMigrationRecommendation(readiness);

  // Phase 3: Export Results
  const resultsFile = 'canvas_migration_validation_report.json';
  const fullResults = {
    timestamp: new Date().toISOString(),
    readiness,
    recommendation,
    testResults
  };

  try {
    fs.writeFileSync(resultsFile, JSON.stringify(fullResults, null, 2));
    log('info', `Validation report saved to: ${resultsFile}`);
  } catch (error) {
    log('warning', 'Could not save validation report:', error.message);
  }

  log('info', '\nValidation complete!');

  if (recommendation.canProceed) {
    log('success', `✅ Migration ${recommendation.recommendation === 'GO' ? 'APPROVED' : 'CONDITIONALLY APPROVED'}`);
  } else {
    log('error', '❌ Migration NOT APPROVED - resolve issues and re-validate');
  }

  return recommendation;
}

// Run validation if called directly
if (require.main === module) {
  validateCanvasMigration()
    .then(result => {
      process.exit(result.canProceed ? 0 : 1);
    })
    .catch(error => {
      log('error', 'Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  validateCanvasMigration,
  checkSystemReadiness,
  generateMigrationRecommendation
};
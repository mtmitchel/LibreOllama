chore(cleanup): systematic dead code removal across all modules

BREAKING CHANGE: None - all archived code was unused

## Summary
Comprehensive codebase cleanup analyzing all 10 major modules to remove dead, 
duplicate, and unused code. Used senior engineering standards with thorough 
verification before archiving.

## Changes by Module

### Canvas
- Archived duplicate utilities (throttling.ts, useFeatureFlags.ts)
- Removed empty tests/utils directory

### Tasks  
- Archived files missed during January 2025 unification:
  - taskMetadataStore.ts (old task system)
  - KanbanColumnExperiment.tsx (unused experiment)
  - UnifiedTaskCardExperiment.tsx (unused experiment)
  - TASK_CARD_CONSOLIDATION_ANALYSIS.md (documentation)

### Calendar
- Archived duplicate types.ts (superseded by types/calendar.ts)
- Archived unused calendar-big-experiment.css
- Removed empty config directory

## Impact
- Total files archived: 8
- Directories removed: 2
- Size reduction: ~50KB
- Code clarity: Significantly improved

## Archive Location
All files preserved in `src/__archive__/2025-02-cleanup/` with detailed 
restoration instructions in README files.

## Verification
- No active imports of archived files
- No feature flag dependencies
- No test dependencies (except already archived tests)
- No configuration references
- Build verification completed

Refs: #cleanup #technical-debt #code-quality
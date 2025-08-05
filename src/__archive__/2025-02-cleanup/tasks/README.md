# Tasks Module Cleanup Archive

**Date**: 2025-02-05
**Reason**: Dead code removal - files missed during task system unification

## Archived Files

### taskMetadataStore.ts
- **From**: `src/stores/taskMetadataStore.ts`
- **Reason**: Part of old task system that should have been archived
- **Analysis**: The task system was unified into `unifiedTaskStore.ts` in January 2025
- **Verification**: Only imported by archived test files

### KanbanColumnExperiment.tsx
- **From**: `src/app/pages/KanbanColumnExperiment.tsx`
- **Reason**: Unused experiment page
- **Analysis**: Not included in routing, experimental code never integrated
- **Verification**: No imports found in App.tsx or elsewhere

### UnifiedTaskCardExperiment.tsx
- **From**: `src/app/pages/UnifiedTaskCardExperiment.tsx`
- **Reason**: Unused experiment page
- **Analysis**: Not included in routing, experimental code never integrated
- **Verification**: No imports found in App.tsx or elsewhere

### TASK_CARD_CONSOLIDATION_ANALYSIS.md
- **From**: `src/components/tasks/TASK_CARD_CONSOLIDATION_ANALYSIS.md`
- **Reason**: Documentation/analysis file, not code
- **Analysis**: Analysis document for task card consolidation, work already completed

## Context

These files were missed during the major task system unification that occurred in January 2025. The old three-store system (taskMetadataStore, googleTasksStore, kanbanStore) was replaced with the unified task store, but these files weren't properly archived at that time.

## Restoration Instructions

**WARNING**: The taskMetadataStore.ts should NOT be restored as it's part of the flawed old architecture. Use the unified task store instead.

For the experiment files:
1. Copy from this archive to original location
2. Add route in App.tsx if needed
3. Update to work with current unified task store
4. Run tests to verify compatibility
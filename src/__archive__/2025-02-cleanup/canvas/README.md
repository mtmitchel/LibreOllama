# Canvas Module Cleanup Archive

**Date**: 2025-02-05
**Reason**: Dead code removal - systematic codebase cleanup

## Archived Files

### useFeatureFlags.ts
- **From**: `src/features/canvas/hooks/useFeatureFlags.ts`
- **Reason**: Not imported anywhere in the codebase
- **Analysis**: Superseded by global feature flags system at `src/utils/featureFlags.ts`
- **Verification**: No imports found via grep search

### throttling.ts
- **From**: `src/features/canvas/utils/events/throttling.ts`
- **Reason**: Not imported anywhere in the codebase
- **Analysis**: Duplicate of existing throttle utilities
- **Verification**: No imports found, functionality available in other utils

## Removed Directories

### tests/utils/
- **Location**: `src/features/canvas/tests/utils/`
- **Reason**: Empty directory with no files

## Restoration Instructions

If any of these files need to be restored:

1. Copy the file from this archive to its original location
2. Add necessary imports in the appropriate index.ts file
3. Update any APIs that may have changed
4. Run tests to verify compatibility

## Notes

The Canvas module remains fully functional. These were unused utilities that duplicated functionality available elsewhere in the codebase.
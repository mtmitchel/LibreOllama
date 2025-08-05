# Calendar Module Cleanup Archive

**Date**: 2025-02-05
**Reason**: Dead code removal - duplicate types and unused CSS

## Archived Files

### types.ts
- **From**: `src/app/pages/calendar/types.ts`
- **Reason**: Not imported anywhere, superseded by types/calendar.ts
- **Analysis**: Duplicate type definitions, the types/calendar.ts file is actively used
- **Verification**: All imports use types/calendar.ts, not this file

### calendar-big-experiment.css
- **From**: `src/app/pages/styles/calendar-big-experiment.css`
- **Reason**: Not imported anywhere
- **Analysis**: Part of calendar experiments that were already archived in 2025-08
- **Verification**: No imports found, related experiment already in archive

## Removed Directories

### config/
- **Location**: `src/app/pages/calendar/config/`
- **Reason**: Empty directory with no files
- **Analysis**: Appears to be from incomplete refactoring

## Context

The calendar module underwent major cleanup in August 2025 (see __archive__/2025-08-calendar-cleanup/). These files were missed during that cleanup or were created afterward and abandoned.

## Restoration Instructions

If any of these files need to be restored:

1. For types.ts - DO NOT restore, use types/calendar.ts instead
2. For CSS - copy to original location and import in the appropriate component
3. Run tests to verify compatibility
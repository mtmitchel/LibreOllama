# LibreOllama Dead Code Archive - January 31, 2025

## Overview
This archive contains code identified as unused during a comprehensive codebase cleanup. Each item has been verified through:
- Static import analysis
- Dynamic import checking
- Usage search across entire codebase
- Test file references

## Summary by Feature

### Canvas (3 empty directories, 1 investigation)
- **Empty Directories**: Removed planned but unimplemented structures
  - `systems/` - Likely intended for canvas systems architecture
  - `utils/memory/` - Planned memory optimization utilities
  - `components/tools/selection/` - Selection tool components
- **ConnectorShape**: Two implementations serve different architectural needs (see analysis)

### Mail (3 components)
- **GmailSecurityMigration.tsx**: OAuth migration UI component
- **EnhancedRecipientInput.tsx**: Advanced recipient input with autocomplete
- **EnhancedRichTextEditor.tsx**: Rich text editor for email composition
- Enhanced components that were created but never integrated into the main mail flow
- May contain useful patterns for future enhancements

### Calendar (3 files)
- **Calendar.tsx**: Full FullCalendar implementation replaced by CalendarAsanaStyle
- **enhancedCalendarStore.ts**: Enhanced state management not integrated
- **calendar.css**: Styles for the unused Calendar component
- Removed after confirming no dynamic imports or lazy loading

### Dashboard (2 widgets)
- **TodaysFocusWidget.tsx**: Shows today's tasks and calendar events
- **UpcomingEventsWidget.tsx**: Displays upcoming calendar events
- Completed widgets that weren't added to dashboard configuration
- Could be re-enabled by adding to widget registry

### Projects (2 components)
- **ProjectSidebar.tsx**: Sidebar for project details (different from ProjectsSidebar)
- **TaskProjectAssociation.tsx**: UI for associating tasks with projects
- UI components created but not integrated into project workflow

### Notes (3 components)
- **CustomFormattingToolbar.tsx**: Custom toolbar replaced by FormattingToolbar
- **CustomSlashMenu.tsx**: Custom slash commands for BlockNote
- **BlockNotePopover.tsx**: AI writing tools popover attempt
- BlockNote customization attempts that weren't integrated
- May contain useful UI patterns

## Statistics
- **Total Files Archived**: 16
- **Empty Directories Removed**: 3
- **Features Affected**: 6
- **Estimated Code Reduction**: ~150KB

## Restoration Guide
To restore any archived component:
1. Copy from this archive to original location
2. Add necessary imports to relevant index.ts
3. Run tests to ensure compatibility with current code
4. Update any changed dependencies or APIs
5. Add to relevant component registry or configuration

## Verification Process
All items were verified using:
```bash
# Direct imports
rg "import.*ComponentName" src/

# Dynamic imports  
rg "lazy.*ComponentName|dynamic.*ComponentName" src/

# String references
rg "ComponentName" src/

# Test coverage
rg "ComponentName" src/**/*.test.tsx
```

## Archive Structure
Each feature folder contains:
- `.archive-info.json` - Detailed metadata about archived items
- Original source files - Preserved with full implementation
- Analysis documents - For items requiring investigation

## Future Considerations
1. Consider implementing a regular cleanup schedule (quarterly)
2. Add linting rules to detect unused exports
3. Document component deprecation process
4. Create a component graveyard for experimental features

## Git Tag
This archive corresponds to git tag: `chore/cleanup-2025-01-31`
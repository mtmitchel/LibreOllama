# Archived Kanban Modal Components

Date Archived: January 2025

## Reason for Archival
These modal components were replaced as part of the Asana-style redesign of the Kanban board:

1. **CreateTaskModal.tsx** - Replaced by `InlineTaskCreator.tsx`
   - Changed from modal popup to inline card creation within columns
   - Simplified interface matching Asana's task creation flow

2. **EditTaskModal.tsx** - Replaced by `TaskSidebar.tsx`
   - Changed from centered modal to slide-over sidebar panel
   - Streamlined UI removing unused features (assignee, dependencies, comments, etc.)

## Migration Notes
- All imports have been updated to use the new components
- The new components maintain the same core functionality with improved UX
- Recurring task support was added to the new components

## Rollback Instructions
If needed to rollback:
1. Copy these files back to `src/components/kanban/`
2. Update imports in `KanbanColumn.tsx` and `KanbanTaskCard.tsx`
3. Remove `InlineTaskCreator.tsx` and `TaskSidebar.tsx`
# Task Card Consolidation Analysis

## Current State

### UnifiedTaskCard (209 lines)
- **Purpose**: Generic task display component
- **Features**:
  - Simple props-based interface (onToggle, onEdit, onDelete, onDuplicate)
  - Two display variants: default and compact
  - Optional metadata display
  - Priority styling
  - Overdue indicator
  - Labels and attachments display
  - No direct store integration

### KanbanTaskCard (330 lines)
- **Purpose**: Kanban-specific task card with drag-and-drop
- **Features**:
  - Full drag-and-drop support via @dnd-kit
  - Direct store integration (useUnifiedTaskStore)
  - Built-in EditTaskModal
  - Context menu with actions
  - Confirm dialogs
  - Column-aware behavior
  - Inline task duplication
  - More complex interaction handling

## Shared Functionality
1. Task date parsing helper (duplicated)
2. Priority color styling (similar but not identical)
3. Basic task display (title, notes, due date, labels)
4. Completed/overdue state styling
5. Label and metadata rendering

## Consolidation Opportunities

### Option 1: Extract Shared Components (Recommended)
Create smaller, reusable components:
- `TaskPriorityBadge` - Priority display with consistent styling
- `TaskMetadata` - Due date, labels, attachments display
- `TaskDateHelper` - Shared date parsing utility
- `TaskCardBase` - Base styling and layout

### Option 2: Unified Component with Feature Flags
Single component with props to enable/disable features:
```tsx
<UnifiedTaskCard 
  task={task}
  enableDragDrop={true}
  enableContextMenu={true}
  variant="kanban"
/>
```

### Option 3: Keep Separate (Current Approach)
Maintain separation due to different use cases and complexity levels.

## Recommendation

**Keep the components separate** but extract shared utilities:

1. **Extract shared helpers** to `src/components/tasks/utils/`:
   - `taskDateUtils.ts` - Date parsing and formatting
   - `taskStyleUtils.ts` - Priority colors and styling

2. **Create shared sub-components** for:
   - Task metadata display
   - Priority badges
   - Label rendering

3. **Benefits**:
   - Maintains clear separation of concerns
   - Avoids over-complicated unified component
   - Reduces code duplication for common elements
   - Each component remains focused on its specific use case

## Implementation Priority
Low - The current separation works well and the duplication is minimal. Focus on more critical tasks first.
# COMPREHENSIVE REFACTORING PLAN FOR TASK SYSTEM

## Phase 1: Immediate Bug Fixes (Priority: CRITICAL)

### 1.1 Fix Task Display Issue
- **File**: `src/stores/unifiedTaskStore.ts`
- **Issue**: Tasks created from Google might use wrong column matching
- **Fix**: Ensure `googleTaskListId` matches between columns and updates
- **Verification**: Add extensive logging to trace data flow

### 1.2 Fix Calendar Duplicates
- **File**: `src/app/pages/CalendarAsanaStyle.tsx`
- **Issue**: Deduplication might fail due to ID conflicts
- **Fix**: Use composite keys for deduplication
- **Verification**: Log all deduplication decisions

## Phase 2: Core Data Layer Refactoring (Priority: HIGH)

### 2.1 Make UnifiedTaskStore Pure
- **Current Problem**: Store contains async operations (syncWithGoogle)
- **Action Items**:
  1. Remove `syncWithGoogle` method from store
  2. Move all async operations to services
  3. Store should only manage state, not side effects
- **Files to Modify**:
  - `src/stores/unifiedTaskStore.ts` - Remove lines 384-394
  - Update all components calling `syncWithGoogle` to use `realtimeSync.syncNow()`

### 2.2 Modularize RealtimeSync Service
- **Current Problem**: `reconcileColumnTasks` is too complex
- **Action Items**:
  1. Extract `_updateExistingTaskFromGoogle()`
  2. Extract `_createNewTaskFromGoogle()`
  3. Extract `_shouldSkipTask()`
- **New Structure**:
```typescript
private async reconcileColumnTasks(
  column: { id: string; googleTaskListId?: string },
  googleTasks: GoogleTask[]
) {
  const updates = [];
  
  for (const googleTask of googleTasks) {
    if (this._shouldSkipTask(googleTask)) continue;
    
    const existingTask = this._findExistingTask(googleTask.id);
    
    if (existingTask && this._needsUpdate(existingTask, googleTask)) {
      updates.push(this._prepareUpdate(existingTask, googleTask));
    } else if (!existingTask) {
      updates.push(this._prepareCreate(column, googleTask));
    }
  }
  
  this._batchApplyUpdates(updates);
}
```

## Phase 3: UI Layer Refactoring (Priority: MEDIUM)

### 3.1 Create Data Transformation Hooks

#### 3.1.1 useTasksData Hook
- **Purpose**: Encapsulate all data logic for tasks page
- **Location**: `src/hooks/useTasksData.ts`
- **Implementation**:
```typescript
export function useTasksData(options: {
  viewMode: 'kanban' | 'list';
  selectedListId: string;
  sortBy: string;
  searchQuery: string;
}) {
  const { columns, getTasksByColumn } = useUnifiedTaskStore();
  
  const transformedData = useMemo(() => {
    // All transformation logic here
    // Return data in exact format needed by UI
  }, [columns, options]);
  
  return transformedData;
}
```

#### 3.1.2 useCalendarEventsData Hook
- **Purpose**: Handle calendar event/task merging and deduplication
- **Location**: `src/hooks/useCalendarEventsData.ts`
- **Implementation**:
```typescript
export function useCalendarEventsData(options: {
  showTasksInCalendar: boolean;
  searchQuery: string;
}) {
  const calendarEvents = useGoogleCalendarStore(state => state.events);
  const { columns, tasks } = useUnifiedTaskStore();
  
  const mergedEvents = useMemo(() => {
    // Date normalization
    // Deduplication logic
    // Event formatting
    return formattedEvents;
  }, [calendarEvents, tasks, options]);
  
  return mergedEvents;
}
```

### 3.2 Simplify Component Props

#### Current State:
```typescript
interface AsanaKanbanBoardProps {
  searchQuery?: string;
  onDeleteList?: (listId: string, listTitle: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  activeTask: KanbanTask | null;
  contextMenu: { x: number; y: number; task: KanbanTask; columnId: string } | null;
  setContextMenu: (menu: { x: number; y: number; task: KanbanTask; columnId: string } | null) => void;
  openEditTaskModal?: (task: KanbanTask, columnId: string) => void;
  openCreateTaskModal?: (columnId: string) => void;
}
```

#### Refactored:
```typescript
interface AsanaKanbanBoardProps {
  searchQuery?: string;
  onAction: (action: TaskAction) => void;
}

type TaskAction = 
  | { type: 'DELETE_LIST'; listId: string; listTitle: string }
  | { type: 'RENAME_LIST'; listId: string; newTitle: string }
  | { type: 'EDIT_TASK'; task: KanbanTask; columnId: string }
  | { type: 'CREATE_TASK'; columnId: string };
```

## Phase 4: Utility Extraction (Priority: LOW)

### 4.1 Create Date Utilities
- **File**: `src/utils/dateUtils.ts`
- **Functions**:
```typescript
export function normalizeToDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return dateString.split('T')[0] || '';
  }
}

export function isSameDay(date1?: string, date2?: string): boolean {
  return normalizeToDate(date1) === normalizeToDate(date2);
}
```

### 4.2 Create Task Utilities
- **File**: `src/utils/taskUtils.ts`
- **Functions**:
```typescript
export function createTaskDeduplicationKey(task: { title?: string; due?: string }): string {
  return `${task.title?.toLowerCase() || 'untitled'}_${normalizeToDate(task.due)}`;
}

export function isTaskCompleted(task: { status?: string }): boolean {
  return task.status === 'completed';
}
```

## Phase 5: Testing Strategy (Priority: HIGH)

### 5.1 Unit Tests for Store
- Test `batchUpdateFromGoogle` with various scenarios
- Test column/task ID matching
- Test deletion logic

### 5.2 Integration Tests for Sync
- Test full sync cycle
- Test conflict resolution
- Test error handling

### 5.3 Component Tests
- Test data hooks in isolation
- Test UI components with mocked data
- Test user interactions

## Implementation Schedule:

1. **Week 1**: Complete Phase 1 (Immediate Fixes)
2. **Week 2**: Complete Phase 2 (Core Data Layer)
3. **Week 3**: Complete Phase 3 (UI Layer)
4. **Week 4**: Complete Phase 4 & 5 (Utilities & Testing)

## Success Metrics:

1. Tasks appear correctly on Tasks page
2. No duplicate tasks on Calendar
3. All tests pass
4. Code coverage > 80%
5. No console errors or warnings
6. Performance metrics remain stable
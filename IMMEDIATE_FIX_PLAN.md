# IMMEDIATE FIX PLAN - TASKS NOT SHOWING & CALENDAR DUPLICATES

## CRITICAL ISSUE #1: Tasks Not Showing on Tasks Page

### Root Cause Analysis:
1. Tasks ARE being fetched from Google (console shows 1249 tasks)
2. Tasks ARE being stored in unifiedTaskStore 
3. BUT: Tasks are NOT appearing in the UI

### Debugging Steps (IN ORDER):

#### Step 1: Verify Column Creation
```typescript
// src/services/realtimeSync.ts - line 95
// CHECK: Are columns being created with matching IDs?
unifiedStore.addColumn(taskList.id, taskList.title, taskList.id);
// The third parameter is googleTaskListId - MUST match what's in Google
```

#### Step 2: Verify Column Lookup in batchUpdateFromGoogle
```typescript
// src/stores/unifiedTaskStore.ts - line 269-271
const column = state.columns.find(
  c => c.googleTaskListId === update.googleTaskListId
);
// PROBLEM: If googleTaskListId doesn't match, column will be null
// SOLUTION: Add logging to see what googleTaskListId values are being compared
```

#### Step 3: Verify TaskIds Array Population
```typescript
// src/stores/unifiedTaskStore.ts - line 294
column.taskIds.push(taskId);
// CHECK: Is this line being reached?
// CHECK: After push, does column.taskIds contain the new ID?
```

#### Step 4: Verify getTasksByColumn
```typescript
// src/stores/unifiedTaskStore.ts - line 345-347
return column.taskIds
  .map(id => state.tasks[id])
  .filter(task => task && !task.optimisticDelete);
// CHECK: Are taskIds present in the array?
// CHECK: Do the IDs map to actual tasks in state.tasks?
```

### Immediate Actions:

1. **Add Column Debug Logging**:
```typescript
// In setupColumns after creating columns
logger.info('[RealtimeSync] Columns after setup:', {
  columns: unifiedStore.columns.map(c => ({
    id: c.id,
    googleTaskListId: c.googleTaskListId,
    taskIds: c.taskIds.length
  }))
});
```

2. **Add batchUpdateFromGoogle Debug**:
```typescript
// Before column lookup
logger.debug('[UnifiedStore] Looking for column with googleTaskListId:', update.googleTaskListId);
logger.debug('[UnifiedStore] Available columns:', state.columns.map(c => ({
  id: c.id,
  googleTaskListId: c.googleTaskListId
})));
```

3. **Add Task Creation Verification**:
```typescript
// After creating task
logger.debug('[UnifiedStore] Task created:', {
  taskId,
  columnId: column.id,
  taskIdsInColumn: column.taskIds.length,
  taskExists: !!state.tasks[taskId]
});
```

## CRITICAL ISSUE #2: Calendar Showing Duplicate Tasks

### Root Cause Analysis:
1. Date normalization IS implemented
2. BUT: Tasks might have duplicate IDs causing deduplication to fail
3. The seenTaskIds Set should prevent duplicates but may not be working

### Debugging Steps:

#### Step 1: Verify Task ID Uniqueness
```typescript
// src/app/pages/CalendarAsanaStyle.tsx - line 925-932
// The code that adds suffixes to duplicate IDs was REMOVED
// Now using raw task IDs which might not be unique across lists
```

#### Step 2: Add Deduplication Debug Logging
```typescript
// In fullCalendarEvents useMemo
console.log('[Calendar] Deduplication check:', {
  taskTitle: task.title,
  taskKey,
  alreadyInCalendar: eventTitlesAndDates.has(taskKey),
  alreadySeenTask: seenTaskIds.has(task.id),
  taskId: task.id
});
```

### Immediate Actions:

1. **Verify Task IDs are Unique**:
   - Log all task IDs to check for duplicates
   - If duplicates exist, determine why

2. **Enhanced Deduplication**:
   - Use a composite key for deduplication: `${task.id}_${task.due}`
   - This ensures even duplicate IDs with different dates are handled

## EXECUTION ORDER:

1. **First**: Add ALL debug logging mentioned above
2. **Second**: Run the app and check console for:
   - Column creation logs
   - Column lookup failures
   - Task creation confirmations
   - Deduplication decisions
3. **Third**: Based on logs, implement targeted fixes
4. **Fourth**: Remove debug logs after fixes are verified

## EXPECTED OUTCOMES:

1. Console will show WHY tasks aren't appearing
2. We'll see if it's a column mismatch, taskIds array issue, or rendering problem
3. Calendar deduplication logs will reveal why duplicates persist
4. With this information, we can implement precise fixes

## FALLBACK PLAN:

If debug logging doesn't reveal the issue:
1. Create a minimal test case with hardcoded data
2. Step through with debugger
3. Compare working vs non-working states
4. Isolate the exact point of failure
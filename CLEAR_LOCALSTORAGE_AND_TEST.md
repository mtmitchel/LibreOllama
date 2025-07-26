# Clear localStorage and Test Metadata Persistence

## Steps to Test

1. **Open Developer Console** (F12)

2. **Clear ALL localStorage**:
```javascript
localStorage.clear();
console.log('✅ localStorage cleared');
```

3. **Refresh the page** (F5)

4. **Create a test task** with:
   - Title: "Test Metadata Persistence"
   - Priority: High
   - Labels: work, urgent
   - Due date: Tomorrow

5. **Check console logs** for:
   - `[TASKS-API] Creating task` - Should show metadata
   - `[GOOGLE-TASKS-STORE] Tasks with metadata: 1`
   - `[SYNC] Google tasks with metadata: 1`
   - `[DEBUG] Kanban tasks with metadata: 1`

6. **Refresh the page again** (F5)

7. **Check console logs** for:
   - `[TASKS-API] Total tasks with metadata: 1`
   - `[DEBUG] Google tasks with metadata: 1`
   - `[DEBUG] Kanban tasks with metadata: 1`
   - `[TASK-CARD] Rendering task` - Should show metadata

8. **Verify UI displays**:
   - "High priority" badge
   - "Work" and "Urgent" labels
   - Due date

## What to Look For

### Success Pattern:
- Backend logs show metadata being saved and loaded
- GoogleTasksStore receives tasks with metadata
- Sync process preserves metadata to KanbanStore
- UI renders priority badges and labels

### Failure Pattern:
- `[DEBUG] Kanban tasks with metadata: 0`
- No priority badges or labels in UI
- `[TASK-CARD]` logs show `metadata: undefined`
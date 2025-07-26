# Task Metadata Persistence - Root Cause & Solution

## Root Cause Identified
The app uses a **dual-store architecture**:
- **GoogleTasksStore**: Fetches from backend (Google + SQLite metadata)
- **KanbanStore**: What the UI actually renders from
- **KanbanGoogleTasksSync**: Syncs between the two stores

**The UI renders from KanbanStore, not GoogleTasksStore!**

## The Problem
1. Backend correctly merges Google Tasks with SQLite metadata ✅
2. GoogleTasksStore receives tasks with metadata ✅
3. KanbanGoogleTasksSync syncs to KanbanStore ❓
4. UI renders from KanbanStore (might not have metadata) ❌

## The Fix Applied

### 1. Fixed Store Persistence (COMPLETED)
- Removed task data from localStorage persistence
- Only persist authentication state

### 2. Fixed Sync Function (COMPLETED)
- Updated `googleToKanbanTask()` to preserve metadata
- Added proper type casting for priority field

### 3. Fixed Column Setup Order (COMPLETED)
- Moved `setupColumnMappings()` before `syncAllTasks()`
- Prevented clearing data after tasks are loaded

### 4. Added Comprehensive Logging (COMPLETED)
- GoogleTasksStore logs received tasks with metadata
- KanbanGoogleTasksSync logs sync operations
- Backend logs metadata loading and saving

## Testing Instructions

1. **Create a task with metadata**:
   - Priority: High
   - Labels: ["work", "urgent"]
   - Due date: Tomorrow

2. **Check console logs**:
   ```
   [GOOGLE-TASKS-STORE] Tasks with metadata: X
   [SYNC] Google tasks with metadata: X
   ```

3. **Refresh the page**

4. **Verify persistence**:
   - Priority badge shows "High priority"
   - Labels show "Work" and "Urgent"
   - Due date is preserved

## What to Look For in Logs

### Success Pattern:
```
[TASKS-API] Total metadata entries loaded: 1
[GOOGLE-TASKS-STORE] Tasks with metadata: 1
[SYNC] Google tasks with metadata: 1
```

### Failure Pattern:
```
[GOOGLE-TASKS-STORE] Tasks with metadata: 0
[SYNC] Google tasks with metadata: 0
```

## If Still Not Working

1. **Check backend logs** for metadata loading
2. **Use debug command**: Open console and run:
   ```javascript
   await window.__TAURI__.invoke('debug_task_metadata')
   ```
3. **Check both stores** in React DevTools:
   - GoogleTasksStore.tasks
   - KanbanStore.columns[0].tasks

## The Complete Fix
All necessary code changes have been applied. The metadata should now persist correctly across page refreshes.
# Google Tasks Sync - Re-enabled with Fixes

## Key Fixes Applied

### 1. **Prevented Data Wipe on Sync**
- Removed `kanbanStore.clearAllData()` from sync initialization
- Sync now preserves existing local tasks
- Columns are only added if they don't already exist

### 2. **Consistent ID Mapping**
- Using Google Task List IDs as Kanban column IDs
- This ensures consistent mapping between systems
- No more ID confusion between local and Google tasks

### 3. **Task Creation Flow**
- Creates tasks in Google Tasks first (when authenticated)
- Saves metadata separately in local store
- Syncs to update Kanban view
- Falls back to local creation if offline

### 4. **Task Deletion Flow**
- Deletes from both Kanban and Google Tasks
- Cleans up metadata store
- Handles both synced and local-only tasks

## How It Works Now

### On App Load:
1. Fetches Google Task Lists
2. Creates columns for each list (preserves existing)
3. Syncs tasks from Google to Kanban
4. Metadata is loaded from local store

### Creating Tasks:
1. Task created in Google Tasks API
2. Metadata saved locally with Google Task ID
3. Sync updates Kanban view
4. Everything persists

### Deleting Tasks:
1. Removed from Kanban store
2. Deleted from Google Tasks (if synced)
3. Metadata cleaned up

## Testing Instructions

1. **Ensure Google Account Connected**
   - Go to Settings
   - Connect Google account if needed

2. **Check Sync Status**
   ```javascript
   // In console
   useGoogleTasksStore.getState().isAuthenticated
   useGoogleTasksStore.getState().taskLists
   ```

3. **Create a Task**
   - Click "Add task"
   - Add title, labels, priority
   - Save
   - Check if it appears in Google Tasks

4. **Manual Sync**
   - Click "Refresh" button
   - Should sync without losing data

## Important Notes

1. **First Sync May Be Slow**
   - Initial sync fetches all tasks from Google
   - Subsequent syncs are faster

2. **Metadata Storage**
   - Labels, priority, subtasks stored locally
   - Linked to tasks via Google Task ID
   - Survives sync cycles

3. **Column Management**
   - Columns now match Google Task Lists
   - Can't add/remove columns locally
   - Use "New List" to create in Google

## Troubleshooting

If tasks disappear:
1. Check console for errors
2. Verify Google authentication
3. Try manual refresh
4. Check localStorage integrity

If sync fails:
1. Check network connection
2. Verify Google account permissions
3. Look for API rate limits
4. Try clearing localStorage and re-auth
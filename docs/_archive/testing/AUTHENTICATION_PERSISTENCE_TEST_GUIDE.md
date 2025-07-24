# Authentication Persistence Test Guide

## Overview
This guide explains how to verify that authentication persists correctly across app refreshes and that Google services (Calendar, Tasks) sync properly.

## Test Setup
1. Start the development server: `npm run dev`
2. Open the app at http://localhost:1423
3. Open browser developer console (F12)

## Test Steps

### 1. Initial Authentication
1. Navigate to Settings page
2. Add your Google account (if not already added)
3. Ensure the account shows as "Active" with a green checkmark
4. Navigate to Mail page and verify emails load

### 2. Calendar Verification
1. Navigate to Calendar page
2. Verify:
   - Calendar shows current month (not January)
   - Day headers show correct abbreviations (Sun, Mon, etc.)
   - First day of each month shows "Jul 1", "Aug 1" etc.
   - Events from ALL subscribed calendars appear (not just primary)
   - Different calendars show with their assigned colors

### 3. Tasks Verification
1. Navigate to Tasks page
2. Verify:
   - Kanban board loads with columns
   - "Sync with Google" button appears
   - Click sync button - should map columns to Google Task lists
   - Any existing Google Tasks appear in appropriate columns
   - Status shows "Connected to Google Tasks • Auto-sync enabled"

### 4. Persistence Test
1. In browser console, run: `testAuthPersistence()`
2. Review the output for:
   ```
   ✅ Gmail accounts persisted: 1 account(s) found
   ✅ Found X calendar(s)
   ✅ Loaded Y total events from all calendars
   ✅ Found Z Google Task list(s)
   ✅ Sync complete: N tasks in Kanban board
   ```

### 5. Refresh Test
1. Refresh the browser (F5)
2. Wait for app to load
3. Navigate to Mail page - emails should load without re-authentication
4. Navigate to Calendar - events should appear immediately
5. Navigate to Tasks - Kanban should show synced tasks
6. Run `testAuthPersistence()` again to verify

### 6. Two-way Sync Test
1. On Tasks page, create a new task in any Kanban column
2. Wait 2 seconds for auto-sync
3. Open Google Tasks in a browser tab
4. Verify the new task appears in the corresponding list
5. Create a task in Google Tasks web interface
6. Click "Sync with Google" in the app
7. Verify the task appears in the Kanban board

## Expected Results
- ✅ No re-authentication required after refresh
- ✅ All Google services remain connected
- ✅ Calendar shows events from all subscribed calendars
- ✅ Tasks sync bidirectionally without duplicates
- ✅ Load time < 5 seconds

## Troubleshooting
If authentication doesn't persist:
1. Check browser console for errors
2. Verify accounts are stored in backend: Run `invoke('get_all_gmail_accounts')`
3. Check if tokens are valid: Look for "requires_reauth" in account data
4. Clear all data and re-authenticate: Settings > Developer Tools > Clear All Data

## Performance Optimization
If load times exceed 5 seconds:
1. Check network tab for slow API calls
2. Verify parallel loading of calendars
3. Consider implementing pagination for large datasets
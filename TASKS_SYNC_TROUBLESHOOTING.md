# Google Tasks Sync Troubleshooting Guide

## Issue: "Failed to sync tasks. Please check your Google account permissions"

This error occurs when the Google Tasks API cannot be accessed. Here's how to fix it:

## 1. Check Developer Console for More Details

Open the browser developer console (F12) to see the specific error code:
- **403 Error**: Tasks API not enabled or permission denied
- **401 Error**: Authentication token expired
- **Other errors**: Check the error message for details

## 2. Enable Google Tasks API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Library"
4. Search for "Tasks API"
5. Click on "Tasks API" and press "Enable"
6. Wait a few minutes for the API to be fully activated

## 3. Check OAuth Consent Screen

1. In Google Cloud Console, go to "APIs & Services" → "OAuth consent screen"
2. Ensure the following scope is included:
   - `https://www.googleapis.com/auth/tasks`
3. If not present, edit your OAuth consent screen and add the Tasks scope

## 4. Reconnect Your Google Account

1. Go to Settings in LibreOllama
2. Find your Google account
3. Click "Disconnect"
4. Click "Connect Google Account" again
5. During authorization, ensure you grant permission for "Tasks"

## 5. Temporary Workaround - Disable Auto-sync

If you need to use the app immediately without Tasks sync:

1. Open the file: `src\services\realtimeSync.ts`
2. Find line ~555 where it says `realtimeSync.initialize();`
3. Comment it out: `// realtimeSync.initialize();`
4. Restart the app

This will disable automatic Tasks sync but allow you to use the app.

## 6. Manual Testing

To test if the API is working:

1. Open [Google Tasks API Explorer](https://developers.google.com/tasks/reference/rest/v1/tasklists/list)
2. Click "Try it"
3. Authorize with your Google account
4. Click "Execute"
5. If you see your task lists, the API is working

## 7. Common Solutions

- **Clear browser cache and cookies** for Google domains
- **Use a different Google account** to test if it's account-specific
- **Check if you're using a Google Workspace account** - some organizations restrict API access
- **Ensure your Google Cloud project isn't in a suspended state**

## 8. Debug Information

The enhanced error logging will now show:
- Specific error codes (401, 403, etc.)
- Detailed error messages
- Suggestions based on the error type

Check the browser console for these enhanced error messages after applying the code update.
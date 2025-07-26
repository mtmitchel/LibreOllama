import { useEffect } from 'react';
import { useGoogleTasksStore } from '../stores/googleTasksStore';
import { useActiveGoogleAccount } from '../stores/settingsStore';
import { logger } from '../core/lib/logger';

/**
 * Hook to integrate Google Tasks with the existing Gmail authentication
 * This loads the Tasks API and fetches task data when a user is authenticated
 */
export function useGoogleTasksIntegration() {
  const account = useActiveGoogleAccount();
  const { 
    isAuthenticated: storeIsAuthenticated,
    authenticate,
    fetchTaskLists,
    fetchTasks,
    taskLists,
    isLoading,
    error 
  } = useGoogleTasksStore();
  
  // Update store authentication state when account changes
  useEffect(() => {
    if (account && !storeIsAuthenticated) {
      logger.info('[GoogleTasks] Setting authentication state for account:', account.email);
      authenticate({
        id: account.id,
        email: account.email,
        name: account.name || '',
        picture: account.picture || '',
        isActive: account.isActive,
        // Dummy tokens since we're using existing Gmail auth
        accessToken: '',
        refreshToken: '',
        expiresAt: Date.now() + 3600000,
        scopes: {
          calendar: account.services?.calendar || false,
          tasks: account.services?.tasks || false,
          mail: account.services?.gmail || false
        }
      });
    }
  }, [account, storeIsAuthenticated, authenticate]);
  
  // Use account presence as authentication check
  const isAuthenticated = !!account;

  // Load Tasks API when account is available
  useEffect(() => {
    if (!account?.id) return;

    const loadTasksApi = async () => {
      try {
        // Check if gapi is available
        if (typeof gapi === 'undefined' || !gapi.client) {
          logger.warn('[GoogleTasks] Waiting for gapi client to be initialized...');
          return;
        }

        // Load the Tasks API if not already loaded
        try {
          await gapi.client.load('tasks', 'v1');
          logger.info('[GoogleTasks] Tasks API loaded successfully');
        } catch (loadError) {
          // API might already be loaded, which is fine
          logger.debug('[GoogleTasks] Tasks API may already be loaded:', loadError);
        }

        // Fetch task lists if authenticated
        if (account.id) {
          await fetchTaskLists(account.id);
        }
      } catch (error) {
        logger.error('[GoogleTasks] Failed to initialize Tasks API:', error);
      }
    };

    loadTasksApi();
  }, [account?.id, fetchTaskLists]);

  // Fetch tasks for all task lists
  useEffect(() => {
    if (!account?.id || !isAuthenticated || taskLists.length === 0) return;

    const fetchAllTasks = async () => {
      for (const taskList of taskLists) {
        if (taskList.id) {
          await fetchTasks(taskList.id, account.id);
        }
      }
    };

    fetchAllTasks();
  }, [account?.id, isAuthenticated, taskLists.length]);

  // Check for Tasks access in the account scopes array
  const hasTasksAccess = isAuthenticated && (
    account?.scopes?.includes('https://www.googleapis.com/auth/tasks') ||
    account?.services?.tasks === true
  );
  
  // Debug logging
  logger.debug('[GoogleTasks] Checking Tasks access:', {
    isAuthenticated,
    hasAccount: !!account,
    scopes: account?.scopes,
    services: account?.services,
    hasTasksAccess
  });

  return {
    isAuthenticated,
    isLoading,
    error,
    taskLists,
    hasTasksAccess
  };
}
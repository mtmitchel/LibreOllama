import React, { useCallback } from 'react';
import { useMailStore } from '../stores/mailStore';

/**
 * Authentication guard hook for mail components
 * Prevents silent failures by ensuring proper authentication state
 */
export const useAuthGuard = () => {
  const { isAuthenticated, currentAccountId, setError } = useMailStore();

  /**
   * Guard function that throws if not properly authenticated
   * @param operation - Name of operation being attempted (for error messages)
   * @throws {Error} If not authenticated or no account selected
   */
  const requireAuth = useCallback((operation: string = 'operation') => {
    if (!isAuthenticated) {
      const errorMessage = `Gmail authentication required for ${operation}`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    if (!currentAccountId) {
      const errorMessage = `No Gmail account selected for ${operation}`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    return { currentAccountId };
  }, [isAuthenticated, currentAccountId, setError]);

  /**
   * Safe guard function that returns null if not authenticated (no throw)
   * Use this for optional operations or when you want to handle auth state gracefully
   * @param operation - Name of operation being attempted (for logging)
   * @returns Account info if authenticated, null otherwise
   */
  const checkAuth = useCallback((operation: string = 'operation'): { currentAccountId: string } | null => {
    if (!isAuthenticated || !currentAccountId) {
      console.warn(`⚠️ [AUTH] ${operation} skipped - authentication required`);
      return null;
    }

    return { currentAccountId };
  }, [isAuthenticated, currentAccountId]);

  /**
   * Auth state for components to check
   */
  const authState = {
    isAuthenticated,
    currentAccountId,
    hasValidAuth: isAuthenticated && !!currentAccountId,
  };

  return {
    requireAuth,
    checkAuth,
    authState,
  };
};

/**
 * Higher-order component wrapper for authentication guard
 * Automatically shows authentication required message if not authenticated
 */
export const withAuthGuard = <T extends object>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    const { authState } = useAuthGuard();

    if (!authState.hasValidAuth) {
      return (
        <div className="flex items-center justify-center h-32 bg-[var(--bg-secondary)] rounded-lg border-2 border-dashed border-[var(--border-default)]">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] text-sm mb-2">
              Gmail authentication required
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Please sign in to access mail features
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}; 
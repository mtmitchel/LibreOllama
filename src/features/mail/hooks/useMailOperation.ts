import { useCallback } from 'react';
import { useMailStore } from '../stores/mailStore';
import { handleGmailError } from '../services/gmailErrorHandler';
import { useAuthGuard } from './useAuthGuard';

/**
 * Standardized mail operation hook
 * Provides consistent error handling and authentication checks
 */
export const useMailOperation = () => {
  const { setError, clearError } = useMailStore();
  const { requireAuth, checkAuth } = useAuthGuard();

  /**
   * Execute a mail operation with standardized error handling
   * @param operation - The async operation to execute
   * @param options - Operation options
   * @throws {Error} If authentication fails
   */
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      requireAuthentication?: boolean;
      operationName?: string;
      accountId?: string;
      showError?: boolean;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    const {
      requireAuthentication = true,
      operationName = 'mail operation',
      accountId,
      showError = true,
      onError
    } = options;

    try {
      // Clear any previous errors
      clearError();

      // Check authentication if required
      if (requireAuthentication) {
        const authInfo = requireAuth(operationName);
        console.log(`🔐 [MAIL_OP] Starting ${operationName} for account:`, authInfo.currentAccountId);
      }

      // Execute the operation
      const result = await operation();
      console.log(`✅ [MAIL_OP] ${operationName} completed successfully`);
      
      return result;
    } catch (error) {
      console.error(`❌ [MAIL_OP] ${operationName} failed:`, error);
      
      // Handle the error using the gmail error handler
      const handledError = handleGmailError(error, {
        operation: operationName,
        accountId: accountId,
      });

      // Show error in store if requested
      if (showError) {
        setError(handledError.message);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(handledError);
      }

      // Re-throw if it's an authentication error (let components handle auth failures)
      if (handledError.message.includes('authentication') || handledError.message.includes('account')) {
        throw handledError;
      }

      // For other errors, return null to allow graceful degradation
      return null;
    }
  }, [setError, clearError, requireAuth]);

  /**
   * Execute a safe operation that doesn't require authentication
   * Will skip if not authenticated instead of throwing
   * @param operation - The async operation to execute
   * @param options - Operation options
   */
  const executeSafeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      operationName?: string;
      accountId?: string;
      showError?: boolean;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    const {
      operationName = 'safe mail operation',
      accountId,
      showError = true,
      onError
    } = options;

    // Check authentication without throwing
    const authInfo = checkAuth(operationName);
    if (!authInfo) {
      return null; // Gracefully skip if not authenticated
    }

    // Execute with error handling but no auth requirement
    return executeOperation(operation, {
      requireAuthentication: false,
      operationName,
      accountId,
      showError,
      onError,
    });
  }, [executeOperation, checkAuth]);

  /**
   * Wrapper for operations that modify messages
   */
  const executeMessageOperation = useCallback(async (
    operation: () => Promise<void>,
    messageIds: string[],
    operationName: string,
    accountId?: string
  ) => {
    return executeOperation(operation, {
      operationName: `${operationName} ${messageIds.length} message(s)`,
      accountId,
    });
  }, [executeOperation]);

  /**
   * Wrapper for operations that fetch data
   */
  const executeFetchOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    accountId?: string
  ) => {
    return executeOperation(operation, {
      operationName: `fetch ${operationName}`,
      accountId,
    });
  }, [executeOperation]);

  return {
    executeOperation,
    executeSafeOperation,
    executeMessageOperation,
    executeFetchOperation,
  };
};

/**
 * Hook for handling compose operations specifically
 */
export const useComposeOperation = () => {
  const { executeOperation } = useMailOperation();
  const { startCompose, updateCompose, sendEmail, cancelCompose } = useMailStore();

  const handleStartCompose = useCallback(async (draft?: Parameters<typeof startCompose>[0]) => {
    return executeOperation(
      async () => {
        startCompose(draft);
      },
      {
        operationName: 'start compose',
        requireAuthentication: true,
      }
    );
  }, [executeOperation, startCompose]);

  const handleSendEmail = useCallback(async (email: Parameters<typeof sendEmail>[0]) => {
    return executeOperation(
      async () => {
        await sendEmail(email);
      },
      {
        operationName: 'send email',
        requireAuthentication: true,
        accountId: email.accountId,
      }
    );
  }, [executeOperation, sendEmail]);

  return {
    handleStartCompose,
    handleSendEmail,
    updateCompose,
    cancelCompose,
  };
}; 

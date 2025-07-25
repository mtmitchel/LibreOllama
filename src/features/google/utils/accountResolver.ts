import type { GmailAccount as GoogleAccount } from '../../mail/types';
import { logger } from '../../../core/lib/logger';

/**
 * Resolves a Google account from various sources in priority order:
 * 1. The provided account parameter
 * 2. Primary Gmail account from mail store
 * 3. First available account from mail store
 * 
 * This utility consolidates the account resolution logic that was duplicated
 * across googleCalendarStore and googleTasksStore.
 */
export async function resolveGoogleAccount(
  providedAccount?: GoogleAccount | null
): Promise<GoogleAccount | null> {
  if (providedAccount) {
    return providedAccount;
  }

  try {
    // Dynamically import mail store to avoid circular dependencies
    const { useMailStore } = await import('../../mail/stores/mailStore');
    const mailStore = useMailStore.getState();
    
    const accountsArray = Object.values(mailStore.accounts || {});
    if (accountsArray.length === 0) {
      logger.debug('No Gmail accounts available');
      return null;
    }

    // Try to use the primary account first
    const primaryAccount = accountsArray.find(acc => (acc as any).is_primary);
    if (primaryAccount) {
      logger.debug('Using primary Gmail account for Google services');
      return primaryAccount;
    }

    // Fall back to the first available account
    logger.debug('No primary account found, using first available account');
    return accountsArray[0];
  } catch (error) {
    logger.error('Failed to resolve Google account:', error);
    return null;
  }
}
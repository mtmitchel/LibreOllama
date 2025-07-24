import { GoogleAccount } from '../types';
import { devLog } from '../../../core/lib/devLog';

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
    
    if (!mailStore.accounts || mailStore.accounts.length === 0) {
      devLog('No Gmail accounts available');
      return null;
    }

    // Try to use the primary account first
    const primaryAccount = mailStore.accounts.find(acc => acc.is_primary);
    if (primaryAccount) {
      devLog('Using primary Gmail account for Google services');
      return primaryAccount;
    }

    // Fall back to the first available account
    devLog('No primary account found, using first available account');
    return mailStore.accounts[0];
  } catch (error) {
    devLog('Failed to resolve Google account:', error);
    return null;
  }
}
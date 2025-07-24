import { useMailStore } from './mailStore';
import type { GmailAccount } from '../types';

/**
 * Lightweight selector for getting the active account
 * Calendar and Tasks stores can subscribe to this without circular dependencies
 */
export const useActiveAccount = (): GmailAccount | null => {
  return useMailStore((state) => {
    const accountId = state.currentAccountId;
    if (!accountId) return null;
    return state.accounts[accountId] || null;
  });
};

/**
 * Get active account without hook (for non-React contexts)
 */
export const getActiveAccount = (): GmailAccount | null => {
  const state = useMailStore.getState();
  const accountId = state.currentAccountId;
  if (!accountId) return null;
  return state.accounts[accountId] || null;
};

/**
 * Check if mail store is ready (hydrated and authenticated)
 */
export const useMailStoreReady = (): boolean => {
  return useMailStore((state) => state.isHydrated && state.isAuthenticated);
};

/**
 * Get mail store authentication status
 */
export const useMailAuthenticated = (): boolean => {
  return useMailStore((state) => state.isAuthenticated);
};
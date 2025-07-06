import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GmailAccount, GmailTokens } from '../types';
import { useMailStore } from '../stores/mailStore';
import { handleGmailError } from '../services/gmailErrorHandler';

export interface GmailConfig {
  redirect_uri: string;
}

export interface UseGmailAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  accounts: GmailAccount[];
  error: string | null;
  startAuth: () => Promise<void>;
  completeAuth: (authorizationCode: string, state: string) => Promise<void>;
  refreshToken: (accountId: string) => Promise<void>;
  signOut: () => void;
  addAccount: () => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  currentAccount: GmailAccount | null;
  clearError: () => void;
}

// Gmail OAuth2 Configuration (client secret now handled securely on backend)
const GMAIL_CONFIG = {
  redirect_uri: 'http://localhost:1423/auth/gmail/callback',
};

export const useGmailAuth = (): UseGmailAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if Tauri is available
  const isTauriAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.__TAURI__ && typeof invoke === 'function';
  }, []);

  // Get state and actions from the mail store
  const {
    accounts,
    currentAccountId,
    isAuthenticated,
    getCurrentAccount,
    signOut: storeSignOut,
    switchAccount: storeSwitchAccount,
    addAccount: storeAddAccount,
    removeAccount: storeRemoveAccount,
    refreshAccount: storeRefreshAccount,
    setAuthState,
  } = useMailStore();

  const currentAccount = getCurrentAccount();

  const clearError = useCallback(() => {
    setError(null);
  }, []);



  // Initialize accounts from secure storage on mount
  useEffect(() => {
    const initializeAccounts = async () => {
      // Check if we're in a Tauri environment
      if (!isTauriAvailable()) {
        console.log('Not in Tauri environment - skipping Gmail account initialization');
        return;
      }

      try {
        // Wait a bit for Tauri to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const storedAccounts = await invoke<GmailAccount[]>('get_stored_gmail_accounts');
        if (storedAccounts && storedAccounts.length > 0) {
          // The store will handle initialization with these accounts
          console.log('Initialized with stored accounts:', storedAccounts.length);
        }
      } catch (err) {
        console.warn('Gmail backend commands not available yet:', err);
        // This is expected during development - backend may not have all commands implemented
      }
    };

    initializeAccounts();
  }, [isTauriAvailable]);

  const startAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isTauriAvailable()) {
        throw new Error('Gmail authentication requires the desktop app. Please use the desktop version of LibreOllama.');
      }

      // Use secure backend OAuth flow
      const authRequest = await invoke<{
        auth_url: string;
        state: string;
        code_verifier: string;
      }>('start_gmail_oauth', {
        config: GMAIL_CONFIG,
      });

      // Store state for later verification
      setAuthState(authRequest.state);

      // Open auth URL in external browser
      if (typeof window !== 'undefined' && window.open) {
        window.open(authRequest.auth_url, '_blank');
        console.log('✅ [SECURITY] Opened secure authentication URL in browser');
      } else {
        throw new Error('Unable to open authentication URL - window.open not available');
      }

    } catch (err) {
      console.error('Failed to start Gmail auth:', err);
      const handledError = handleGmailError(err, {
        operation: 'start_auth',
      });
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [isTauriAvailable, setAuthState]);

  const completeAuth = useCallback(async (authorizationCode: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isTauriAvailable()) {
        throw new Error('Gmail authentication requires the desktop app. Please use the desktop version of LibreOllama.');
      }

      // Use secure backend OAuth completion
      const tokenResponse = await invoke<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
      }>('complete_gmail_oauth', {
        code: authorizationCode,
        state: state,
        redirectUri: GMAIL_CONFIG.redirect_uri,
      });

      // Convert to our token format
      const tokens: GmailTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
        token_type: tokenResponse.token_type,
      };

      // Get user profile information
      const userProfile = await getUserProfile(tokens);
      
      // Create account object with enhanced structure
      const newAccount: GmailAccount = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
        tokens,
        isActive: accounts.length === 0, // First account is active by default
        lastSync: new Date(),
        syncStatus: 'idle',
        quota: await getQuotaInfo(tokens).catch(() => undefined),
      };

      // Store tokens securely using new secure storage
      await storeTokensSecurely(newAccount);

      // Add account to the store
      storeAddAccount(newAccount);

      // Clear the auth state after successful authentication
      setAuthState(null);

      console.log('✅ [SECURITY] Gmail authentication completed securely');

    } catch (err) {
      console.error('Failed to complete Gmail auth:', err);
      const handledError = handleGmailError(err, {
        operation: 'complete_auth',
      });
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeAddAccount, accounts.length, isTauriAvailable, setAuthState]);

  const refreshToken = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      if (!account.tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      if (!isTauriAvailable()) {
        throw new Error('Token refresh requires the desktop app. Please use the desktop version of LibreOllama.');
      }
      
      // Use secure backend token refresh
      const tokenResponse = await invoke<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
      }>('refresh_gmail_token', {
        refreshToken: account.tokens.refresh_token,
        redirectUri: GMAIL_CONFIG.redirect_uri,
      });

      // Convert to our token format
      const newTokens: GmailTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || account.tokens.refresh_token,
        expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
        token_type: tokenResponse.token_type,
      };

      // Update account with new tokens
      const updatedAccount: GmailAccount = {
        ...account,
        tokens: newTokens,
        lastSync: new Date(),
        syncStatus: 'idle',
      };

      // Store updated tokens securely
      await storeTokensSecurely(updatedAccount);

      // Refresh in store
      await storeRefreshAccount(accountId);

      console.log('✅ [SECURITY] Token refreshed securely');

    } catch (err) {
      console.error('Failed to refresh Gmail token:', err);
      const handledError = handleGmailError(err, {
        operation: 'refresh_token',
        accountId,
      });
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [accounts, storeRefreshAccount, isTauriAvailable]);

  const signOut = useCallback(() => {
    storeSignOut();
  }, [storeSignOut]);

  const addAccount = useCallback(async () => {
    await startAuth();
  }, [startAuth]);

  const removeAccount = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Remove from secure storage
      await removeTokensFromStorage(accountId);

      // Remove from store
      await storeRemoveAccount(accountId);

    } catch (err) {
      console.error('Failed to remove Gmail account:', err);
      const handledError = handleGmailError(err);
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeRemoveAccount, isTauriAvailable]);

  const switchAccount = useCallback((accountId: string) => {
    try {
      storeSwitchAccount(accountId);
    } catch (err) {
      console.error('Failed to switch account:', err);
      const handledError = handleGmailError(err);
      setError(handledError.message);
    }
  }, [storeSwitchAccount]);

  // Helper functions
  const getUserProfile = async (tokens: GmailTokens) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to get user profile:', err);
      throw err;
    }
  };

  const getQuotaInfo = async (tokens: GmailTokens) => {
    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quota info');
      }

      const profile = await response.json();
      return {
        used: profile.historyId ? parseInt(profile.historyId) * 1000 : 0, // Approximation
        total: 15000000000, // 15GB default Gmail quota
      };
    } catch (err) {
      console.error('Failed to get quota info:', err);
      throw err;
    }
  };

  const storeTokensSecurely = async (account: GmailAccount) => {
    if (!isTauriAvailable()) {
      console.warn('Cannot store tokens securely - Tauri not available');
      return;
    }
    
    try {
      // Store using new secure storage with OS keyring
      await invoke('store_gmail_tokens_secure', {
        accountId: account.id,
        tokens: account.tokens,
        userInfo: {
          email: account.email,
          name: account.name,
          picture: account.picture,
        },
      });
      console.log('✅ [SECURITY] Tokens stored securely using OS keyring');
    } catch (err) {
      console.error('Failed to store tokens securely:', err);
      
      // Fallback to legacy storage with warning
      try {
        await invoke('store_gmail_tokens', {
          accountId: account.id,
          tokens: account.tokens,
          userInfo: {
            email: account.email,
            name: account.name,
            picture: account.picture,
          },
        });
        console.warn('⚠️ [SECURITY] Fell back to legacy token storage - consider upgrading');
      } catch (fallbackErr) {
        console.error('Both secure and legacy token storage failed:', fallbackErr);
        throw new Error('Failed to store authentication tokens');
      }
    }
  };

  const removeTokensFromStorage = async (accountId: string) => {
    if (!isTauriAvailable()) {
      console.warn('Cannot remove tokens from storage - Tauri not available');
      return;
    }
    
    try {
      // Try secure storage first
      await invoke('remove_gmail_tokens_secure', { accountId });
      console.log('✅ [SECURITY] Tokens removed securely from OS keyring');
    } catch (err) {
      console.warn('Failed to remove from secure storage, trying legacy:', err);
      
      // Fallback to legacy storage
      try {
        await invoke('remove_gmail_tokens', { accountId });
        console.log('⚠️ [SECURITY] Tokens removed from legacy storage');
      } catch (legacyErr) {
        console.error('Failed to remove tokens from both storage methods:', legacyErr);
        // Don't throw here - removal from UI succeeded
      }
    }
  };

  return {
    isAuthenticated,
    isLoading,
    accounts,
    currentAccount,
    error,
    startAuth,
    completeAuth,
    refreshToken,
    signOut,
    addAccount,
    removeAccount,
    switchAccount,
    clearError,
  };
}; 
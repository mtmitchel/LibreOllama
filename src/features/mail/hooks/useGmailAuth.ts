import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface GmailConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_type: string;
}

export interface GmailAccount {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  tokens: GmailTokens;
}

export interface UseGmailAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  accounts: GmailAccount[];
  error: string | null;
  startAuth: () => Promise<void>;
  completeAuth: (authorizationCode: string) => Promise<void>;
  refreshToken: (accountId: string) => Promise<void>;
  addAccount: () => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  currentAccount: GmailAccount | null;
  clearError: () => void;
}

// Gmail OAuth2 Configuration
const GMAIL_CONFIG: GmailConfig = {
  client_id: import.meta.env.VITE_GMAIL_CLIENT_ID || '',
  client_secret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
  redirect_uri: 'http://localhost:3000/auth/gmail/callback',
};

export const useGmailAuth = (): UseGmailAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<GmailAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authStateToken, setAuthStateToken] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateConfig = useCallback(() => {
    if (!GMAIL_CONFIG.client_id || !GMAIL_CONFIG.client_secret) {
      throw new Error('Gmail OAuth2 configuration missing. Please check your environment variables.');
    }
  }, []);

  const startAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      validateConfig();

      // Generate auth URL with PKCE
      const authUrl = await invoke<string>('gmail_generate_auth_url', {
        config: GMAIL_CONFIG,
      });

      // Extract state token from URL for later verification
      const url = new URL(authUrl);
      const state = url.searchParams.get('state');
      if (state) {
        setAuthStateToken(state);
      }

      // Open auth URL in external browser
      const { open } = await import('@tauri-apps/plugin-opener');
      await open(authUrl);

    } catch (err) {
      console.error('Failed to start Gmail auth:', err);
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
    } finally {
      setIsLoading(false);
    }
  }, [validateConfig]);

  const completeAuth = useCallback(async (authorizationCode: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!authStateToken) {
        throw new Error('Invalid authentication state');
      }

      // Exchange authorization code for tokens
      const tokens = await invoke<GmailTokens>('gmail_exchange_code', {
        config: GMAIL_CONFIG,
        code: authorizationCode,
        stateToken: authStateToken,
      });

      // Get user profile information
      const userProfile = await getUserProfile(tokens);
      
      // Create account object
      const newAccount: GmailAccount = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
        tokens,
      };

      // Update accounts list
      setAccounts(prev => {
        const existingIndex = prev.findIndex(acc => acc.id === newAccount.id);
        if (existingIndex >= 0) {
          // Update existing account
          const updated = [...prev];
          updated[existingIndex] = newAccount;
          return updated;
        } else {
          // Add new account
          return [...prev, newAccount];
        }
      });

      setCurrentAccount(newAccount);
      setIsAuthenticated(true);
      setAuthStateToken(null);

      // Store tokens securely
      await storeTokensSecurely(newAccount);

    } catch (err) {
      console.error('Failed to complete Gmail auth:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete authentication');
    } finally {
      setIsLoading(false);
    }
  }, [authStateToken]);

  const refreshToken = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Refresh the access token
      const newTokens = await invoke<GmailTokens>('gmail_refresh_token', {
        config: GMAIL_CONFIG,
        refreshToken: account.tokens.refresh_token,
      });

      // Update account with new tokens
      const updatedAccount = {
        ...account,
        tokens: newTokens,
      };

      setAccounts(prev => 
        prev.map(acc => acc.id === accountId ? updatedAccount : acc)
      );

      if (currentAccount?.id === accountId) {
        setCurrentAccount(updatedAccount);
      }

      // Store updated tokens securely
      await storeTokensSecurely(updatedAccount);

    } catch (err) {
      console.error('Failed to refresh Gmail token:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh authentication');
    } finally {
      setIsLoading(false);
    }
  }, [accounts, currentAccount]);

  const addAccount = useCallback(async () => {
    await startAuth();
  }, [startAuth]);

  const removeAccount = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Remove from local state
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      // If this was the current account, clear it
      if (currentAccount?.id === accountId) {
        const remainingAccounts = accounts.filter(acc => acc.id !== accountId);
        setCurrentAccount(remainingAccounts[0] || null);
        setIsAuthenticated(remainingAccounts.length > 0);
      }

      // Remove from secure storage
      await removeTokensFromStorage(accountId);

    } catch (err) {
      console.error('Failed to remove Gmail account:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove account');
    } finally {
      setIsLoading(false);
    }
  }, [accounts, currentAccount]);

  const switchAccount = useCallback((accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setCurrentAccount(account);
      setIsAuthenticated(true);
    }
  }, [accounts]);

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

  const storeTokensSecurely = async (account: GmailAccount) => {
    try {
      // Store in Tauri secure storage
      await invoke('store_gmail_tokens', {
        accountId: account.id,
        tokens: account.tokens,
        userInfo: {
          email: account.email,
          name: account.name,
          picture: account.picture,
        },
      });
    } catch (err) {
      console.error('Failed to store tokens securely:', err);
      // Don't throw here - auth succeeded even if storage failed
    }
  };

  const removeTokensFromStorage = async (accountId: string) => {
    try {
      await invoke('remove_gmail_tokens', { accountId });
    } catch (err) {
      console.error('Failed to remove tokens from storage:', err);
      // Don't throw here - removal from UI succeeded
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
    addAccount,
    removeAccount,
    switchAccount,
    clearError,
  };
}; 
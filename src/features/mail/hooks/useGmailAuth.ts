import { useState, useCallback, useEffect, useRef } from 'react';
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
  redirect_uri: 'http://localhost:8080/auth/gmail/callback',
};

// Tauri initialization state
let tauriInitialized = false;
let tauriInitPromise: Promise<boolean> | null = null;

// Safe invoke function that only works when Tauri is available
let safeInvoke: any = null;

// Global auth state to prevent multiple OAuth flows across hook instances
let globalAuthInProgress = false;
let globalAuthPromise: Promise<void> | null = null;
let globalAuthState: string | null = null;
let globalAuthTimeout: NodeJS.Timeout | null = null;

// Hook instance counter for debugging
let hookInstanceCount = 0;

// Reset global auth state after timeout (5 minutes)
const resetGlobalAuthAfterTimeout = () => {
  if (globalAuthTimeout) clearTimeout(globalAuthTimeout);
  globalAuthTimeout = setTimeout(() => {
    console.warn('⏰ [AUTH] Global auth state timeout - resetting');
    globalAuthInProgress = false;
    globalAuthPromise = null;
    globalAuthState = null;
    globalAuthTimeout = null;
  }, 5 * 60 * 1000); // 5 minutes
};

// OAuth callback handler for localhost server
let oauthCallbackHandler: ((url: string) => void) | null = null;

// Set up localhost server for OAuth callbacks
async function setupOAuthListener() {
  try {
    console.log('🌐 [OAUTH] Setting up localhost server for OAuth callbacks');
    
    // The backend will handle the localhost server
    // We just need to wait for the callback
    console.log('✅ [OAUTH] OAuth server setup delegated to backend');
    return true;
  } catch (error) {
    console.warn('⚠️ [OAUTH] Failed to set up OAuth listener:', error);
    return false;
  }
}

// Initialize Tauri once and cache the result
async function initializeTauri(): Promise<boolean> {
  if (tauriInitialized) return true;
  
  if (tauriInitPromise) return tauriInitPromise;
  
  tauriInitPromise = new Promise(async (resolve) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      resolve(false);
      return;
    }
    
    // Check for Tauri global context first
    if (!window.__TAURI__ && !window.__TAURI_INTERNALS__ && !window.__TAURI_METADATA__) {
      console.log('Tauri globals not found - likely running in browser');
      resolve(false);
      return;
    }
    
    // Try to import and use Tauri API
    try {
      const tauriApi = await import('@tauri-apps/api/core');
      if (!tauriApi.invoke || typeof tauriApi.invoke !== 'function') {
        console.log('Tauri invoke not available');
        resolve(false);
        return;
      }
      
      // Test basic connectivity
      await tauriApi.invoke('greet', { name: 'test' });
      
      // Cache the working invoke function
      safeInvoke = tauriApi.invoke;
      
      // Set up OAuth listener for localhost callbacks
      await setupOAuthListener();
      
      tauriInitialized = true;
      console.log('✅ Tauri initialized successfully');
      resolve(true);
    } catch (error) {
      console.log('Tauri initialization failed:', error.message);
      resolve(false);
    }
  });
  
  return tauriInitPromise;
}

export const useGmailAuth = (): UseGmailAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tauriReady, setTauriReady] = useState(false);
  const initializationAttempted = useRef(false);
  
  // Track hook instances for debugging
  const instanceId = useRef(++hookInstanceCount);
  console.log(`🔍 [DEBUG] useGmailAuth hook instance #${instanceId.current} created`);

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

  // Initialize Tauri and load accounts - only once
  useEffect(() => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    const initializeSystem = async () => {
      const ready = await initializeTauri();
      setTauriReady(ready);
      
      if (!ready) {
        console.log('Not in Tauri environment - Gmail features disabled');
        return;
      }

             // Skip account loading during initialization to avoid command signature issues
       // Accounts will be loaded when actually needed
       console.log('Tauri initialization complete - Gmail features enabled');
    };

    initializeSystem();
  }, []);

  const startAuth = useCallback(async () => {
    const authId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [DEBUG] Hook instance #${instanceId.current} attempting to start auth with ID: ${authId}`);
    
    // Enhanced blocking mechanism with timeout protection
    if (globalAuthInProgress || globalAuthPromise) {
      console.log(`🚫 [${authId}] Authentication already in progress - BLOCKING duplicate auth attempt from instance #${instanceId.current}`);
      console.log(`🔍 [DEBUG] Global state: inProgress=${globalAuthInProgress}, hasPromise=${!!globalAuthPromise}`);
      
      // If we have an existing promise, wait for it
      if (globalAuthPromise) {
        try {
          await globalAuthPromise;
        } catch (err) {
          console.log(`⚠️ [${authId}] Previous auth promise failed:`, err);
        }
      }
      return;
    }

    // Create new auth promise with enhanced state tracking
    globalAuthPromise = (async () => {
      try {
        globalAuthInProgress = true;
        setIsLoading(true);
        setError(null);

        console.log(`🔐 [${authId}] Starting NEW Gmail OAuth flow from instance #${instanceId.current}`);
        console.log(`🔍 [DEBUG] Setting global auth in progress: ${globalAuthInProgress}`);
        
        // Set timeout to reset global state if auth gets stuck
        resetGlobalAuthAfterTimeout();

        if (!tauriReady) {
          throw new Error('Gmail authentication requires the desktop app. Please use the desktop version of LibreOllama.');
        }

        // Use secure backend OAuth flow
        const authRequest = await safeInvoke<{
          auth_url: string;
          state: string;
          code_verifier: string;
        }>('start_gmail_oauth', {
          config: GMAIL_CONFIG,
        });

        // Store state both locally and globally for debugging
        globalAuthState = authRequest.state;
        setAuthState(authRequest.state);
        console.log(`🔑 [${authId}] Storing auth state: ${authRequest.state}`);

        // Set up OAuth callback handler
        const oauthPromise = new Promise<{ code: string; state: string }>((resolve, reject) => {
          // Start the OAuth callback server and wait for callback in one call
          safeInvoke('start_oauth_callback_server_and_wait', {
            port: 8080,
            expectedState: authRequest.state,
            timeoutMs: 300000, // 5 minutes timeout
          }).then((callbackResult: { code: string; state: string }) => {
            console.log(`✅ [${authId}] Successfully received OAuth callback from backend`);
            resolve(callbackResult);
          }).catch((err) => {
            console.error(`❌ [${authId}] OAuth callback failed:`, err);
            reject(new Error(`OAuth callback failed: ${err.message || err}`));
          });
        });

        // Open auth URL in external browser using Tauri's opener plugin
        try {
          console.log(`🌐 [${authId}] About to open OAuth URL using Tauri opener:`, authRequest.auth_url.substring(0, 50) + '...');
          
          // Use Tauri's opener plugin to open URL in default browser
          const { openUrl } = await import('@tauri-apps/plugin-opener');
          await openUrl(authRequest.auth_url);
          
          console.log(`✅ [SECURITY] [${authId}] Opened secure authentication URL using Tauri opener`);
          console.log(`⏳ [${authId}] Waiting for OAuth callback via localhost server...`);
          
          // Wait for the OAuth callback
          const { code, state } = await oauthPromise;
          
          console.log(`🔗 [${authId}] Received OAuth callback - proceeding to complete authentication`);
          
          // Complete the OAuth flow directly
          await completeAuthInternal(code, state);
          
        } catch (openerError) {
          // Clean up the handler on error
          oauthCallbackHandler = null;
          
          console.warn(`⚠️ [${authId}] OAuth flow failed:`, openerError);
          throw openerError;
        }

      } catch (err) {
        console.error(`❌ [${authId}] Failed to start Gmail auth:`, err);
        const handledError = handleGmailError(err, {
          operation: 'start_auth',
        });
        setError(handledError.message);
      } finally {
        console.log(`🔄 [${authId}] Cleaning up auth state from instance #${instanceId.current}`);
        setIsLoading(false);
        globalAuthInProgress = false;
        globalAuthPromise = null; // Clear the promise when done
        
        // Clear timeout since auth is complete
        if (globalAuthTimeout) {
          clearTimeout(globalAuthTimeout);
          globalAuthTimeout = null;
        }
        // Note: We don't clear globalAuthState here as it's needed for the callback
      }
    })();

    return globalAuthPromise;
  }, [tauriReady, setAuthState]);

  // Internal function for completing auth (used by both deep link and manual completion)
  const completeAuthInternal = async (authorizationCode: string, state: string) => {
    if (!tauriReady) {
      throw new Error('Gmail authentication requires the desktop app. Please use the desktop version of LibreOllama.');
    }

    // Use secure backend OAuth completion
    const tokenResponse = await safeInvoke<{
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
    globalAuthState = null; // Also clear global state

    console.log('✅ [SECURITY] Gmail authentication completed securely');
  };

  const completeAuth = useCallback(async (authorizationCode: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await completeAuthInternal(authorizationCode, state);

    } catch (err) {
      console.error('Failed to complete Gmail auth:', err);
      const handledError = handleGmailError(err, {
        operation: 'complete_auth',
      });
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeAddAccount, accounts.length, tauriReady, setAuthState]);

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

      if (!tauriReady) {
        throw new Error('Token refresh requires the desktop app. Please use the desktop version of LibreOllama.');
      }
      
      // Use secure backend token refresh
      const tokenResponse = await safeInvoke<{
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
  }, [accounts, storeRefreshAccount, tauriReady]);

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
  }, [storeRemoveAccount]);

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
      console.log('🔍 [PROFILE] Fetching user profile...');
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Profile fetch failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const profile = await response.json();
      console.log('✅ [PROFILE] User profile fetched successfully:', profile.email);
      return profile;
    } catch (err) {
      console.error('❌ [PROFILE] Failed to get user profile:', err);
      throw err;
    }
  };

  const getQuotaInfo = async (tokens: GmailTokens) => {
    try {
      console.log('🔍 [QUOTA] Fetching Gmail quota info...');
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [QUOTA] Quota fetch failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch quota info: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const profile = await response.json();
      console.log('✅ [QUOTA] Gmail quota info fetched successfully');
      return {
        used: profile.historyId ? parseInt(profile.historyId) * 1000 : 0, // Approximation
        total: 15000000000, // 15GB default Gmail quota
      };
    } catch (err) {
      console.error('❌ [QUOTA] Failed to get quota info:', err);
      throw err;
    }
  };

  const storeTokensSecurely = async (account: GmailAccount) => {
    if (!tauriReady) {
      console.warn('Cannot store tokens securely - Tauri not available');
      return;
    }
    
    try {
      // Store using new secure storage with OS keyring
      await safeInvoke('store_gmail_tokens_secure', {
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
        await safeInvoke('store_gmail_tokens', {
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
    if (!tauriReady) {
      console.warn('Cannot remove tokens from storage - Tauri not available');
      return;
    }
    
    try {
      // Try secure storage first
      await safeInvoke('remove_gmail_tokens_secure', { accountId });
      console.log('✅ [SECURITY] Tokens removed securely from OS keyring');
    } catch (err) {
      console.warn('Failed to remove from secure storage, trying legacy:', err);
      
      // Fallback to legacy storage
      try {
        await safeInvoke('remove_gmail_tokens', { accountId });
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
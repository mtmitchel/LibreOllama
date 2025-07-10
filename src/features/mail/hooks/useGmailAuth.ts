import { useState, useCallback, useEffect, useRef } from 'react';
import { GmailAccount, GmailTokens } from '../types';
import { useMailStore } from '../stores/mailStore';
import { handleGmailError } from '../services/gmailErrorHandler';

// Local window type extension
declare global {
  interface Window {
    __TAURI__?: any;
    __TAURI_INTERNALS__?: any;
    __TAURI_METADATA__?: any;
  }
}

export interface GmailConfig {
  redirect_uri: string;
}

export interface UseGmailAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  accounts: GmailAccount[];
  error: string | null;
  startAuth: () => Promise<void>;
  completeAuth: (authorizationCode: string, state?: string) => Promise<void>;
  refreshToken: (accountId: string) => Promise<void>;
  signOut: () => void;
  addAccount: () => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  currentAccount: GmailAccount | null;
  clearError: () => void;
  authState: string | null;
}

// Gmail OAuth2 Configuration (client secret now handled securely on backend)
const GMAIL_CONFIG = {
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob', // Standard "out of band" redirect for desktop apps
};

// Tauri initialization state
let tauriInitialized = false;
let tauriInitPromise: Promise<boolean> | null = null;

// Safe invoke function that only works when Tauri is available
let safeInvoke: (<T = any>(cmd: string, args?: any) => Promise<T>) | null = null;

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
      console.log('Tauri initialization failed:', error instanceof Error ? error.message : String(error));
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
    getAccountsArray,
    currentAccountId,
    isAuthenticated,
    getCurrentAccount,
    signOut: storeSignOut,
    switchAccount: storeSwitchAccount,
    addAccount: storeAddAccount,
    removeAccount: storeRemoveAccount,
    refreshAccount: storeRefreshAccount,
  } = useMailStore();

  const accounts = getAccountsArray();
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
        if (!safeInvoke) {
          throw new Error('Tauri invoke is not available');
        }
        
        const authRequest = await safeInvoke<{
          auth_url: string;
          state: string;
          code_verifier: string;
        }>('start_gmail_oauth', {
          config: GMAIL_CONFIG,
        });

        // Store state both locally and globally for debugging
        globalAuthState = authRequest.state;
        // setAuthState(authRequest.state); // Removed as per edit hint
        console.log(`🔑 [${authId}] Storing auth state: ${authRequest.state}`);

        // Open auth URL in external browser using Tauri's opener plugin
        try {
          console.log(`🌐 [${authId}] About to open OAuth URL using Tauri opener:`, authRequest.auth_url.substring(0, 50) + '...');
          
          // Use Tauri's opener plugin to open URL in default browser
          const { openUrl } = await import('@tauri-apps/plugin-opener');
          await openUrl(authRequest.auth_url);
          
          console.log(`✅ [SECURITY] [${authId}] Opened secure authentication URL using Tauri opener`);
          console.log(`📋 [${authId}] Please complete authentication in your browser and copy the authorization code shown`);
          
          // For desktop apps using "out of band" redirect, Google will show the authorization code
          // The user needs to copy this code and paste it into the app
          // This is handled by the Gmail authentication modal in the UI
          
        } catch (openerError) {
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
  }, [tauriReady]); // Removed setAuthState from dependency array

  // Internal function for completing auth (used by both deep link and manual completion)
  const completeAuthInternal = async (authorizationCode: string, state: string) => {
    if (!tauriReady) {
      throw new Error('Gmail authentication requires the desktop app. Please use the desktop version of LibreOllama.');
    }

    // Use secure backend OAuth completion
    if (!safeInvoke) {
      throw new Error('Tauri invoke is not available');
    }
    
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
      refresh_token: tokenResponse.refresh_token || undefined,
      expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
      token_type: tokenResponse.token_type,
    };

    // Get user profile information
    const userProfile = await getUserProfile(tokens);
    
    // Get quota info
    const quotaInfo = await getQuotaInfo(tokens).catch(() => ({ used: 0, total: 0 }));
    
    // Create account object matching the store's GmailAccount interface
    const newAccount: GmailAccount = {
      id: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.name,
      avatar: userProfile.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      tokenExpiry: new Date(tokens.expires_at || Date.now() + 3600000),
      isActive: accounts.length === 0, // First account is active by default
      syncStatus: 'idle',
      lastSyncAt: new Date(),
      errorMessage: undefined,
      quotaUsed: quotaInfo?.used || 0,
      quotaTotal: quotaInfo?.total || 0,
    };

    // Store tokens securely using new secure storage
    await storeTokensSecurely(newAccount, tokens);

    // Add account to the store - MUST await since it's async
    await storeAddAccount(newAccount);

    // Clear the auth state after successful authentication
    // setAuthState(null); // Removed as per edit hint
    globalAuthState = null; // Also clear global state

    console.log('✅ [SECURITY] Gmail authentication completed securely');
  };

  const completeAuth = useCallback(async (authorizationCode: string, state?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use provided state or fall back to global auth state
      const authState = state || globalAuthState || '';
      await completeAuthInternal(authorizationCode, authState);

    } catch (err) {
      console.error('Failed to complete Gmail auth:', err);
      const handledError = handleGmailError(err, {
        operation: 'complete_auth',
      });
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  }, [storeAddAccount, accounts.length, tauriReady]);

  const refreshToken = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      if (!account.refreshToken) {
        throw new Error('No refresh token available');
      }

      if (!tauriReady) {
        throw new Error('Token refresh requires the desktop app. Please use the desktop version of LibreOllama.');
      }
      
      // Use secure backend token refresh
      if (!safeInvoke) {
        throw new Error('Tauri invoke is not available');
      }
      
      const tokenResponse = await safeInvoke<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
      }>('refresh_gmail_token', {
        refreshToken: account.refreshToken,
        redirectUri: GMAIL_CONFIG.redirect_uri,
      });

      // Convert to our token format
      const newTokens: GmailTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || account.refreshToken,
        expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
        token_type: tokenResponse.token_type,
      };

      // Update account with new tokens
      const updatedAccount: GmailAccount = {
        ...account,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || account.refreshToken,
        tokenExpiry: new Date(newTokens.expires_at || Date.now() + 3600000),
        lastSyncAt: new Date(),
        syncStatus: 'idle',
      };

      // Store updated tokens securely
      await storeTokensSecurely(updatedAccount, newTokens);

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
      const handledError = handleGmailError(err, {
        operation: 'remove_account',
        accountId,
      });
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
      const handledError = handleGmailError(err, {
        operation: 'switch_account',
        accountId,
      });
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
      console.log('🔍 [QUOTA] Fetching storage quota from Google Drive API...');
      
      // Use Google Drive API to get actual storage quota information
      // Request all storageQuota fields to see what's available
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota(limit,usage,usageInDrive,usageInDriveTrash)', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('⚠️ [QUOTA] Drive API not available, cannot determine quota');
        // If Drive API is not available, don't make assumptions
        return {
          used: 0,
          total: 0,
        };
      }

      const data = await response.json();
      console.log('🔍 [QUOTA] Raw API response:', data);
      const storageQuota = data.storageQuota;
      
      if (storageQuota) {
        const used = parseInt(storageQuota.usage || '0', 10);
        let total = parseInt(storageQuota.limit || '0', 10);
        
        // Some Google accounts (Workspace, Google One) don't return a limit
        // or return -1 for unlimited
        if (!total || total < 0) {
          console.log('⚠️ [QUOTA] No limit returned by API, account may have custom quota');
          // Don't assume - the UI will need to handle this case
          total = 0;
        }
        
        console.log('✅ [QUOTA] Storage quota parsed:', {
          used: `${(used / 1000000000).toFixed(1)}GB`,
          total: total > 0 ? `${(total / 1000000000).toFixed(1)}GB` : 'Custom/Unlimited',
          percentage: total > 0 ? `${((used / total) * 100).toFixed(1)}%` : 'N/A',
          rawUsage: used,
          rawLimit: storageQuota.limit,
          allFields: storageQuota
        });
        
        return {
          used,
          total,
        };
      } else {
        console.warn('⚠️ [QUOTA] No storage quota data in API response');
        return {
          used: 0,
          total: 0,
        };
      }
    } catch (err) {
      console.error('❌ [QUOTA] Failed to get quota info:', err);
      // Return zeros instead of making assumptions
      return {
        used: 0,
        total: 0,
      };
    }
  };

  const storeTokensSecurely = async (account: GmailAccount, tokens?: GmailTokens) => {
    if (!tauriReady) {
      console.warn('Cannot store tokens securely - Tauri not available');
      return;
    }
    
    // Use provided tokens or extract from account
    const tokensToStore = tokens || {
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expires_at: account.tokenExpiry ? account.tokenExpiry.toISOString() : new Date(Date.now() + 3600000).toISOString(),
      token_type: 'Bearer',
    };
    
    try {
      // Store using new secure storage with OS keyring
      if (!safeInvoke) {
        throw new Error('Tauri invoke is not available');
      }
      await safeInvoke('store_gmail_tokens_secure', {
        accountId: account.id,
        tokens: tokensToStore,
        userInfo: {
          email: account.email,
          name: account.displayName,
          picture: account.avatar,
        },
      });
      console.log('✅ [SECURITY] Tokens stored securely using OS keyring');
    } catch (err) {
      console.error('Failed to store tokens securely:', err);
      
      // Fallback to legacy storage with warning
      try {
        if (!safeInvoke) {
          throw new Error('Tauri invoke is not available');
        }
        await safeInvoke('store_gmail_tokens', {
          accountId: account.id,
          tokens: tokensToStore,
          userInfo: {
            email: account.email,
            name: account.displayName,
            picture: account.avatar,
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
      if (!safeInvoke) {
        throw new Error('Tauri invoke is not available');
      }
      await safeInvoke('remove_gmail_tokens_secure', { accountId });
      console.log('✅ [SECURITY] Tokens removed securely from OS keyring');
    } catch (err) {
      console.warn('Failed to remove from secure storage, trying legacy:', err);
      
      // Fallback to legacy storage
      try {
        if (!safeInvoke) {
          throw new Error('Tauri invoke is not available');
        }
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
    authState: globalAuthState,
  };
}; 
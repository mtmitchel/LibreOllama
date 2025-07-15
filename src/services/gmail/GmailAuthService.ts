/**
 * Gmail Authentication Service
 * 
 * Implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) for enhanced security,
 * secure token storage using Tauri APIs, and comprehensive authentication management.
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { 
  GmailTokens, 
  UserInfo, 
  PKCEChallenge, 
  AuthorizationRequest, 
  AuthorizationResponse,
  AuthenticationResult,
  TokenValidation,
  AuthError,
  AuthErrorType,
  OAuthConfig,
  SecurityConfig,
  GMAIL_SCOPES,
  OAUTH_ENDPOINTS
} from '../../types/gmail/auth.types';

export class GmailAuthService {
  private config: OAuthConfig;
  private securityConfig: SecurityConfig;
  private pendingAuth: Map<string, { pkce: PKCEChallenge; timestamp: number }> = new Map();

  constructor(clientId: string, redirectUri: string, additionalScopes: string[] = []) {
    this.config = {
      clientId,
      redirectUri,
      scopes: [...GMAIL_SCOPES, ...additionalScopes],
      additionalParameters: {
        access_type: 'offline',
        prompt: 'consent'
      }
    };

    this.securityConfig = {
      enablePKCE: true,
      enableStateValidation: true,
      enableNonceValidation: true,
      tokenEncryption: true,
      secureStorage: true,
      tokenExpiryBuffer: 300 // 5 minutes before expiry
    };
  }

  /**
   * Start OAuth 2.0 authentication flow with PKCE
   */
  async authenticateUser(): Promise<AuthenticationResult> {
    try {
      // Generate PKCE challenge
      const pkce = await this.generatePKCEChallenge();
      
      // Generate secure state parameter
      const state = await this.generateSecureState();
      
      // Store pending authorization
      this.pendingAuth.set(state, {
        pkce,
        timestamp: Date.now()
      });

      // Build authorization URL
      const authRequest = this.buildAuthorizationRequest(pkce, state);
      
      // Open authorization URL in browser
      await this.openAuthorizationUrl(authRequest.authUrl);
      
      // Wait for authorization callback
      const authResponse = await this.waitForCallback(state);
      
      // Exchange authorization code for tokens
      const tokens = await this.exchangeAuthorizationCode(authResponse, pkce);
      
      // Get user information
      const user = await this.fetchUserInfo(tokens.accessToken);
      
      // Generate account ID
      const accountId = `gmail_${user.id}`;
      
      // Store tokens securely
      await this.storeTokens(accountId, tokens);
      
      // Clean up pending authorization
      this.pendingAuth.delete(state);
      
      return {
        tokens,
        user,
        accountId
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Generate PKCE challenge using SHA256
   */
  private async generatePKCEChallenge(): Promise<PKCEChallenge> {
    const codeVerifier = this.generateRandomString(128);
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = this.base64URLEncode(hash);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Generate cryptographically secure state parameter
   */
  private async generateSecureState(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return this.base64URLEncode(randomBytes);
  }

  /**
   * Build OAuth 2.0 authorization request URL
   */
  private buildAuthorizationRequest(pkce: PKCEChallenge, state: string): AuthorizationRequest {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      ...this.config.additionalParameters
    });

    const authUrl = `${OAUTH_ENDPOINTS.AUTHORIZATION}?${params.toString()}`;
    
    return {
      authUrl,
      state,
      pkce,
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes
    };
  }

  /**
   * Open authorization URL in system browser
   */
  private async openAuthorizationUrl(authUrl: string): Promise<void> {
    try {
      await invoke('open_browser', { url: authUrl });
    } catch (error) {
      // Fallback to Tauri's opener plugin (now using shell's open)
      await open(authUrl);
    }
  }

  /**
   * Wait for OAuth callback
   */
  private async waitForCallback(expectedState: string): Promise<AuthorizationResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authorization timeout'));
      }, 120000); // 2 minutes timeout

      // Listen for callback from Tauri backend
      const unlisten = invoke('listen_oauth_callback').then((unlistenFn: any) => {
        return unlistenFn;
      });

      // Handle callback
      window.addEventListener('oauth_callback', ((event: CustomEvent) => {
        clearTimeout(timeout);
        unlisten.then(fn => fn());

        const response = event.detail as AuthorizationResponse;
        
        // Validate state parameter
        if (response.state !== expectedState) {
          reject(new Error('State parameter mismatch - possible CSRF attack'));
          return;
        }

        if (response.error) {
          reject(new Error(`OAuth error: ${response.error} - ${response.errorDescription}`));
          return;
        }

        resolve(response);
      }) as EventListener);
    });
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeAuthorizationCode(
    authResponse: AuthorizationResponse, 
    pkce: PKCEChallenge
  ): Promise<GmailTokens> {
    const tokenRequest = {
      client_id: this.config.clientId,
      code: authResponse.code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: pkce.codeVerifier
    };

    const response = await fetch(OAUTH_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenRequest).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      scope: tokenData.scope,
      tokenType: tokenData.token_type || 'Bearer',
      expiresIn: tokenData.expires_in,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      createdAt: Date.now()
    };
  }

  /**
   * Fetch user information from Google API
   */
  private async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(OAUTH_ENDPOINTS.USERINFO, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Store tokens securely using Tauri secure storage
   */
  async storeTokens(accountId: string, tokens: GmailTokens): Promise<void> {
    try {
      await invoke('store_secure_tokens', {
        accountId,
        tokens: this.securityConfig.tokenEncryption ? await this.encryptTokens(tokens) : tokens
      });
    } catch (error) {
      throw this.createAuthError(AuthErrorType.STORAGE_ERROR, 'Failed to store tokens securely', error);
    }
  }

  /**
   * Get stored tokens for account
   */
  async getStoredTokens(accountId?: string): Promise<GmailTokens | null> {
    try {
      const tokens = await invoke('get_secure_tokens', { accountId }) as string | null;
      return tokens ? (this.securityConfig.tokenEncryption ? await this.decryptTokens(tokens) : JSON.parse(tokens)) : null;
    } catch (error) {
      console.warn('Failed to retrieve stored tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<GmailTokens> {
    const tokenToUse = refreshToken || (await this.getStoredTokens())?.refreshToken;
    
    if (!tokenToUse) {
      throw this.createAuthError(AuthErrorType.REFRESH_FAILED, 'No refresh token available');
    }

    const refreshRequest = {
      client_id: this.config.clientId,
      refresh_token: tokenToUse,
      grant_type: 'refresh_token'
    };

    const response = await fetch(OAUTH_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(refreshRequest).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw this.createAuthError(
        AuthErrorType.REFRESH_FAILED, 
        `Token refresh failed: ${errorData.error_description || errorData.error}`,
        errorData
      );
    }

    const tokenData = await response.json();
    
    const newTokens: GmailTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || tokenToUse, // Keep existing refresh token if not renewed
      idToken: tokenData.id_token,
      scope: tokenData.scope,
      tokenType: tokenData.token_type || 'Bearer',
      expiresIn: tokenData.expires_in,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      createdAt: Date.now()
    };

    // Store refreshed tokens
    const accountId = await this.getCurrentAccountId();
    if (accountId) {
      await this.storeTokens(accountId, newTokens);
    }

    return newTokens;
  }

  /**
   * Validate token and check if refresh is needed
   */
  async validateTokens(tokens?: GmailTokens): Promise<TokenValidation> {
    const tokensToValidate = tokens || await this.getStoredTokens();
    
    if (!tokensToValidate) {
      return {
        isValid: false,
        isExpired: true,
        expiresIn: 0,
        needsRefresh: true,
        error: 'No tokens found'
      };
    }

    const now = Date.now();
    const expiresAt = tokensToValidate.expiresAt || 0;
    const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const isExpired = expiresAt <= now;
    const needsRefresh = expiresAt <= (now + (this.securityConfig.tokenExpiryBuffer * 1000));

    return {
      isValid: !isExpired,
      isExpired,
      expiresIn,
      needsRefresh: needsRefresh && !!tokensToValidate.refreshToken,
      error: isExpired ? 'Token expired' : undefined
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    if (!tokens) return false;
    
    const validation = await this.validateTokens(tokens);
    return validation.isValid || validation.needsRefresh;
  }

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      return await invoke('get_stored_user_info');
    } catch (error) {
      console.warn('Failed to get stored user info:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens and sign out
   */
  async clearTokens(accountId?: string): Promise<void> {
    try {
      await invoke('clear_secure_tokens', { accountId });
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  /**
   * Revoke tokens with Google
   */
  async revokeTokens(tokens?: GmailTokens): Promise<void> {
    const tokensToRevoke = tokens || await this.getStoredTokens();
    if (!tokensToRevoke) return;

    try {
      // Revoke refresh token (this also revokes associated access tokens)
      if (tokensToRevoke.refreshToken) {
        await fetch(`${OAUTH_ENDPOINTS.REVOKE}?token=${tokensToRevoke.refreshToken}`, {
          method: 'POST'
        });
      }
      
      // Also revoke access token for immediate effect
      await fetch(`${OAUTH_ENDPOINTS.REVOKE}?token=${tokensToRevoke.accessToken}`, {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Failed to revoke tokens with Google:', error);
      // Continue with local cleanup even if remote revocation fails
    }

    // Clear local storage
    await this.clearTokens();
  }

  // Helper methods
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomBytes, byte => charset[byte % charset.length]).join('');
  }

  private base64URLEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private async encryptTokens(tokens: GmailTokens): Promise<string> {
    // Use Tauri's secure encryption
    return await invoke('encrypt_data', { data: JSON.stringify(tokens) });
  }

  private async decryptTokens(encryptedTokens: string): Promise<GmailTokens> {
    // Use Tauri's secure decryption
    const decrypted = await invoke('decrypt_data', { encryptedData: encryptedTokens }) as string;
    return JSON.parse(decrypted) as GmailTokens;
  }

  private async getCurrentAccountId(): Promise<string | null> {
    try {
      return await invoke('get_current_account_id');
    } catch {
      return null;
    }
  }

  private createAuthError(type: AuthErrorType, message: string, originalError?: any): AuthError {
    return {
      type,
      message,
      description: originalError?.message || originalError?.error_description,
      statusCode: originalError?.status,
      originalError
    };
  }

  private handleAuthError(error: any): AuthError {
    if (error instanceof Error) {
      // Map common errors to appropriate types
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createAuthError(AuthErrorType.NETWORK_ERROR, error.message, error);
      }
      if (error.message.includes('expired')) {
        return this.createAuthError(AuthErrorType.TOKEN_EXPIRED, error.message, error);
      }
      if (error.message.includes('refresh')) {
        return this.createAuthError(AuthErrorType.REFRESH_FAILED, error.message, error);
      }
      if (error.message.includes('storage')) {
        return this.createAuthError(AuthErrorType.STORAGE_ERROR, error.message, error);
      }
    }

    return this.createAuthError(AuthErrorType.NETWORK_ERROR, 'Authentication failed', error);
  }
} 
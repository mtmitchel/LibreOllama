// Google OAuth 2.0 Authentication Service for LibreOllama

import { GoogleCredentials, GoogleTokens, GoogleAuthState, GoogleUserInfo, GoogleApiError as GoogleApiErrorType } from './google-types';

// Default OAuth scopes for LibreOllama Google integration
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export class GoogleAuthService {
  private credentials: GoogleCredentials | null = null;
  private tokens: GoogleTokens | null = null;
  private authState: GoogleAuthState = {
    isAuthenticated: false,
    tokens: null,
    userInfo: null,
    lastRefresh: null,
    error: null
  };

  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'libre_ollama_google_tokens';
  private readonly USER_INFO_KEY = 'libre_ollama_google_user';

  constructor(credentials?: GoogleCredentials) {
    if (credentials) {
      this.setCredentials(credentials);
    }
    this.loadStoredTokens();
  }

  /**
   * Set Google OAuth credentials
   */
  setCredentials(credentials: GoogleCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    if (!this.credentials) {
      throw new Error('Google credentials not set');
    }

    const params = new URLSearchParams({
      client_id: this.credentials.clientId,
      redirect_uri: this.credentials.redirectUri,
      scope: this.credentials.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    if (!this.credentials) {
      throw new Error('Google credentials not set');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.credentials.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
      }

      const data = await response.json();
      const tokens: GoogleTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiryDate: Date.now() + (data.expires_in * 1000),
        tokenType: data.token_type || 'Bearer'
      };

      await this.setTokens(tokens);
      return tokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during token exchange';
      this.updateAuthState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<GoogleTokens> {
    if (!this.credentials || !this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          refresh_token: this.tokens.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
      }

      const data = await response.json();
      const newTokens: GoogleTokens = {
        accessToken: data.access_token,
        refreshToken: this.tokens.refreshToken, // Keep existing refresh token
        expiryDate: Date.now() + (data.expires_in * 1000),
        tokenType: data.token_type || 'Bearer'
      };

      await this.setTokens(newTokens);
      this.updateAuthState({ lastRefresh: new Date().toISOString(), error: null });
      return newTokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      this.updateAuthState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('No tokens available');
    }

    // Check if token is expired or will expire in the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (Date.now() + bufferTime >= this.tokens.expiryDate) {
      await this.refreshAccessToken();
    }

    return this.tokens.accessToken;
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<GoogleUserInfo> {
    const accessToken = await this.getValidAccessToken();

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const userInfo: GoogleUserInfo = await response.json();
      this.updateAuthState({ userInfo });
      this.storeUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user info';
      this.updateAuthState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Revoke tokens and sign out
   */
  async signOut(): Promise<void> {
    if (this.tokens?.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.tokens.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        console.warn('Failed to revoke token:', error);
      }
    }

    this.clearStoredData();
    this.tokens = null;
    this.updateAuthState({
      isAuthenticated: false,
      tokens: null,
      userInfo: null,
      lastRefresh: null,
      error: null
    });

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): GoogleAuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.tokens !== null;
  }

  /**
   * Set tokens and update auth state
   */
  private async setTokens(tokens: GoogleTokens): Promise<void> {
    this.tokens = tokens;
    this.storeTokens(tokens);
    this.updateAuthState({
      isAuthenticated: true,
      tokens,
      error: null
    });

    // Set up automatic token refresh
    this.scheduleTokenRefresh();

    // Get user info if we don't have it
    if (!this.authState.userInfo) {
      try {
        await this.getUserInfo();
      } catch (error) {
        console.warn('Failed to get user info after token set:', error);
      }
    }
  }

  /**
   * Update authentication state and notify listeners
   */
  private updateAuthState(updates: Partial<GoogleAuthState>): void {
    this.authState = { ...this.authState, ...updates };
    // TODO: Implement event system for auth state changes
    // this.emit('authStateChange', this.authState);
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    if (!this.tokens) return;

    // Refresh 10 minutes before expiry
    const refreshTime = this.tokens.expiryDate - Date.now() - (10 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.tokenRefreshTimeout = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }, refreshTime);
    }
  }

  /**
   * Store tokens securely in localStorage
   */
  private storeTokens(tokens: GoogleTokens): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Store user info in localStorage
   */
  private storeUserInfo(userInfo: GoogleUserInfo): void {
    try {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to store user info:', error);
    }
  }

  /**
   * Load stored tokens from localStorage
   */
  private loadStoredTokens(): void {
    try {
      const storedTokens = localStorage.getItem(this.STORAGE_KEY);
      const storedUserInfo = localStorage.getItem(this.USER_INFO_KEY);

      if (storedTokens) {
        const tokens: GoogleTokens = JSON.parse(storedTokens);
        
        // Check if tokens are still valid
        if (Date.now() < tokens.expiryDate) {
          this.tokens = tokens;
          this.updateAuthState({
            isAuthenticated: true,
            tokens,
          });
          this.scheduleTokenRefresh();
        } else {
          // Tokens expired, try to refresh
          this.tokens = tokens;
          this.refreshAccessToken().catch(() => {
            this.clearStoredData();
          });
        }
      }

      if (storedUserInfo) {
        const userInfo: GoogleUserInfo = JSON.parse(storedUserInfo);
        this.updateAuthState({ userInfo });
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
      this.clearStoredData();
    }
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
  }

  /**
   * Make authenticated request to Google API
   */
  async makeAuthenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      const apiError = new GoogleApiError(error.error?.message || error.error || response.statusText);
      apiError.code = response.status;
      apiError.status = response.statusText;
      apiError.details = error.error?.details;
      throw apiError;
    }

    return response.json();
  }
}

// Google API Error class
class GoogleApiError extends Error {
  public code: number;
  public status: string;
  public details?: any[];

  constructor(error: GoogleApiError) {
    super(error.message);
    this.name = 'GoogleApiError';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService();

// Export default configuration for development
export const DEV_GOOGLE_CONFIG: GoogleCredentials = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:1420/auth/google/callback',
  scopes: GOOGLE_SCOPES
};
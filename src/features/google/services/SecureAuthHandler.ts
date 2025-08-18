/**
 * Secure Authentication Handler
 * 
 * This module provides a secure bridge between the UI components and the GmailAuthService,
 * ensuring proper OAuth 2.0 PKCE flow, automatic token refresh, and secure storage.
 */

import { GmailAuthService } from '../../../services/gmail/GmailAuthService';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { AuthenticationResult, GmailTokens } from '../../../types/gmail/auth.types';
import { logger } from '../../../core/lib/logger';

// Singleton instance
let authServiceInstance: GmailAuthService | null = null;

// Token refresh interval (check every 5 minutes)
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;

// Map to track active token refresh timers
const refreshTimers = new Map<string, NodeJS.Timeout>();

// Cache for client ID
let cachedClientId: string | null = null;

export class SecureAuthHandler {
  private authService: GmailAuthService | null = null;
  
  /**
   * Get or create the auth service instance
   */
  private async getAuthService(): Promise<GmailAuthService> {
    if (!authServiceInstance) {
      // Fetch client ID from backend if not cached
      if (!cachedClientId) {
        try {
          cachedClientId = await invoke<string>('get_google_client_id');
          if (!cachedClientId) {
            throw new Error('Google Client ID not configured in backend');
          }
        } catch (error) {
          logger.error('[SecureAuth] Failed to fetch Google Client ID from backend', error);
          throw new Error('Failed to retrieve Google Client ID');
        }
      }
      
      // Use original redirect URI
      const redirectUri = 'http://localhost:1423/auth/gmail/callback';
      authServiceInstance = new GmailAuthService(cachedClientId, redirectUri);
    }
    
    return authServiceInstance;
  }
  
  /**
   * Authenticate a user with full OAuth 2.0 PKCE flow
   */
  async authenticateUser(): Promise<{
    accountId: string;
    email: string;
    name: string;
    picture: string;
  }> {
    try {
      logger.info('[SecureAuth] Starting OAuth 2.0 PKCE authentication flow');
      
      // Use the backend's OAuth flow directly
      const tokenResponse = await invoke<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
      }>('start_gmail_oauth_with_callback');
      
      logger.info('[SecureAuth] OAuth flow completed, fetching user info');
      
      // Get user information using the access token
      const userInfo = await invoke<{
        id: string;
        email: string;
        name: string;
        picture: string;
      }>('get_gmail_user_info', {
        accessToken: tokenResponse.access_token
      });
      
      // Generate account ID
      const accountId = `gmail_${userInfo.id}`;
      
      // Store tokens securely in backend
      await invoke('store_gmail_tokens_secure', {
        accountId,
        tokens: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
          token_type: tokenResponse.token_type
        },
        userInfo: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        }
      });
      
      // Set up automatic token refresh for this account
      this.setupTokenRefresh(accountId);
      
      logger.info('[SecureAuth] Authentication successful', { 
        accountId,
        email: userInfo.email 
      });
      
      return {
        accountId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    } catch (error) {
      logger.error('[SecureAuth] Authentication failed', error);
      throw error;
    }
  }
  
  /**
   * Set up automatic token refresh for an account
   */
  private setupTokenRefresh(accountId: string): void {
    // Clear any existing timer
    const existingTimer = refreshTimers.get(accountId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    // Set up new refresh timer
    const timer = setInterval(async () => {
      try {
        await this.checkAndRefreshToken(accountId);
      } catch (error) {
        logger.error('[SecureAuth] Token refresh failed', { accountId, error });
      }
    }, TOKEN_REFRESH_INTERVAL);
    
    refreshTimers.set(accountId, timer);
    
    // Also check immediately
    this.checkAndRefreshToken(accountId).catch(error => {
      logger.error('[SecureAuth] Initial token check failed', { accountId, error });
    });
  }
  
  /**
   * Check if token needs refresh and refresh if necessary
   */
  private async checkAndRefreshToken(accountId: string): Promise<void> {
    try {
      const authService = await this.getAuthService();
      const tokens = await authService.getStoredTokens(accountId);
      if (!tokens) {
        logger.warn('[SecureAuth] No tokens found for account', { accountId });
        return;
      }
      
      // Check if token expires in the next 10 minutes
      const expiresInMs = (tokens.expiresAt || 0) - Date.now();
      const tenMinutesInMs = 10 * 60 * 1000;
      
      if (expiresInMs < tenMinutesInMs) {
        logger.info('[SecureAuth] Token expiring soon, refreshing', { 
          accountId, 
          expiresInMinutes: Math.floor(expiresInMs / 60000) 
        });
        
        const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
        await authService.storeTokens(accountId, newTokens);
        
        // Emit event so UI can update if needed
        await invoke('emit_auth_event', {
          event: 'token_refreshed',
          accountId,
          expiresAt: newTokens.expiresAt
        });
        
        logger.info('[SecureAuth] Token refreshed successfully', { accountId });
      }
    } catch (error) {
      logger.error('[SecureAuth] Failed to check/refresh token', { accountId, error });
      throw error;
    }
  }
  
  /**
   * Validate if a token is still valid
   */
  async validateToken(accountId: string): Promise<boolean> {
    try {
      const authService = await this.getAuthService();
      const validation = await authService.validateAccessToken(accountId);
      return validation.isValid;
    } catch (error) {
      logger.error('[SecureAuth] Token validation failed', { accountId, error });
      return false;
    }
  }
  
  /**
   * Revoke tokens and clean up for an account
   */
  async revokeAccount(accountId: string): Promise<void> {
    try {
      // Clear refresh timer
      const timer = refreshTimers.get(accountId);
      if (timer) {
        clearInterval(timer);
        refreshTimers.delete(accountId);
      }
      
      // Revoke tokens
      const authService = await this.getAuthService();
      await authService.revokeTokens(accountId);
      
      logger.info('[SecureAuth] Account revoked successfully', { accountId });
    } catch (error) {
      logger.error('[SecureAuth] Failed to revoke account', { accountId, error });
      throw error;
    }
  }
  
  /**
   * Clean up all refresh timers
   */
  static cleanup(): void {
    refreshTimers.forEach(timer => clearInterval(timer));
    refreshTimers.clear();
  }
}

// Export singleton instance getter
export function getSecureAuthHandler(): SecureAuthHandler {
  return new SecureAuthHandler();
}

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    SecureAuthHandler.cleanup();
  });
}
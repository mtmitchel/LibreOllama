/**
 * Gmail Authentication Types
 * 
 * Comprehensive type definitions for OAuth 2.0 authentication with PKCE,
 * secure token storage, and user information management.
 */

// OAuth 2.0 Token Set
export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt?: number;
}

// Gmail-specific tokens for storage
export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt?: number;
  createdAt: number;
}

// User information from Google OAuth
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  verifiedEmail?: boolean;
}

// OAuth 2.0 Authorization Code Flow with PKCE
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// Authorization request details
export interface AuthorizationRequest {
  authUrl: string;
  state: string;
  pkce: PKCEChallenge;
  redirectUri: string;
  scopes: string[];
}

// Authorization response from callback
export interface AuthorizationResponse {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

// Complete authentication result
export interface AuthenticationResult {
  tokens: GmailTokens;
  user: UserInfo;
  accountId: string;
}

// OAuth 2.0 Configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret?: string; // Only for backend
  redirectUri: string;
  scopes: string[];
  additionalParameters?: Record<string, string>;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  tokens: GmailTokens | null;
  error: string | null;
  lastRefresh?: number;
}

// Stored account information
export interface StoredAccount {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isActive: boolean;
  createdAt: number;
  lastUsed: number;
}

// Token validation result
export interface TokenValidation {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number;
  needsRefresh: boolean;
  error?: string;
}

// Authentication error types
export enum AuthErrorType {
  INVALID_CLIENT = 'invalid_client',
  INVALID_REQUEST = 'invalid_request',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',
  ACCESS_DENIED = 'access_denied',
  NETWORK_ERROR = 'network_error',
  TOKEN_EXPIRED = 'token_expired',
  REFRESH_FAILED = 'refresh_failed',
  STORAGE_ERROR = 'storage_error'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  description?: string;
  statusCode?: number;
  originalError?: any;
}

// Security configuration
export interface SecurityConfig {
  enablePKCE: boolean;
  enableStateValidation: boolean;
  enableNonceValidation: boolean;
  tokenEncryption: boolean;
  secureStorage: boolean;
  tokenExpiryBuffer: number; // seconds before expiry to refresh
}

// Default OAuth scopes for Gmail
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
] as const;

// Additional optional scopes
export const EXTENDED_SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
] as const;

// OAuth endpoints
export const OAUTH_ENDPOINTS = {
  AUTHORIZATION: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN: 'https://oauth2.googleapis.com/token',
  REVOKE: 'https://oauth2.googleapis.com/revoke',
  USERINFO: 'https://www.googleapis.com/oauth2/v2/userinfo'
} as const; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GmailAuthService } from '../../services/gmail/GmailAuthService';
import { GmailTokens, UserInfo } from '../../types/gmail/auth.types';

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  tokens: GmailTokens | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

interface GoogleAuthProviderProps {
  children: ReactNode;
  clientId: string;
  redirectUri?: string;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
  clientId,
  redirectUri = 'http://localhost:1423/auth/gmail/callback'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tokens, setTokens] = useState<GmailTokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authService] = useState(() => new GmailAuthService(clientId, redirectUri));

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is already authenticated
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const storedTokens = await authService.getStoredTokens();
          const userInfo = await authService.getUserInfo();
          
          setTokens(storedTokens);
          setUser(userInfo);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
        setError(err instanceof Error ? err.message : 'Authentication initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService]);

  const signIn = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Start OAuth flow with PKCE
      const authResult = await authService.authenticateUser();
      
      setTokens(authResult.tokens);
      setUser(authResult.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.clearTokens();
      
      setTokens(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Sign out failed:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async (): Promise<void> => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await authService.refreshAccessToken();
      setTokens(newTokens);
    } catch (err) {
      console.error('Token refresh failed:', err);
      setError(err instanceof Error ? err.message : 'Token refresh failed');
      
      // If refresh fails, sign out user
      await signOut();
      throw err;
    }
  };

  const contextValue: GoogleAuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    tokens,
    error,
    signIn,
    signOut,
    refreshTokens
  };

  return (
    <GoogleAuthContext.Provider value={contextValue}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}; 
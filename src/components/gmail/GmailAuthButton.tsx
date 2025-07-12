import React, { useState } from 'react';
import { Mail, LogOut, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGoogleAuth } from './GoogleAuthProvider';

interface GmailAuthButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showUserInfo?: boolean;
  onAuthSuccess?: (user: any) => void;
  onAuthError?: (error: string) => void;
  className?: string;
}

export const GmailAuthButton: React.FC<GmailAuthButtonProps> = ({
  variant = 'primary',
  size = 'md',
  showUserInfo = false,
  onAuthSuccess,
  onAuthError,
  className = ''
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error, 
    signIn, 
    signOut 
  } = useGoogleAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsProcessing(true);
      await signIn();
      
      if (onAuthSuccess && user) {
        onAuthSuccess(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      console.error('Gmail authentication failed:', errorMessage);
      
      if (onAuthError) {
        onAuthError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsProcessing(true);
      await signOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      console.error('Gmail sign out failed:', errorMessage);
      
      if (onAuthError) {
        onAuthError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading || isProcessing) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`flex items-center gap-2 ${className}`}
      >
        <Loader2 size={16} className="animate-spin" />
        {isLoading ? 'Checking authentication...' : 'Processing...'}
      </Button>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Button
          variant="outline"
          size={size}
          onClick={handleSignIn}
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <AlertCircle size={16} />
          Retry Authentication
        </Button>
        {showUserInfo && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {showUserInfo && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-green-700 truncate">
                {user.email}
              </p>
            </div>
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full border border-green-200"
              />
            )}
          </div>
        )}
        
        <Button
          variant={variant === 'primary' ? 'outline' : variant}
          size={size}
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignIn}
      className={`flex items-center gap-2 ${className}`}
    >
      <Mail size={16} />
      Connect Gmail
    </Button>
  );
}; 
import React, { useState } from 'react';
import { Mail, LogOut, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/design-system/Button';
import { useGoogleAuth } from './GoogleAuthProvider';

interface GmailAuthButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showUserInfo?: boolean;
  onAuthSuccess?: (user: unknown) => void;
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
  // Map size prop to Button component's expected values
  const buttonSize = size === 'lg' ? 'default' : size === 'md' ? 'default' : 'sm';
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
        size={buttonSize}
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
          size={buttonSize}
          onClick={handleSignIn}
          className="flex items-center gap-2 border-error text-error hover:bg-error-ghost"
        >
          <AlertCircle size={16} />
          Retry Authentication
        </Button>
        {showUserInfo && (
          <p className="text-center asana-text-sm text-error">
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
          <div className="flex items-center gap-3 rounded-lg border border-success bg-success-ghost p-3">
            <CheckCircle size={16} className="shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="truncate asana-text-sm font-medium text-success">
                {user.name || user.email}
              </p>
              <p className="truncate text-[11px] text-success-fg">
                {user.email}
              </p>
            </div>
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="size-8 rounded-full border border-green-200"
              />
            )}
          </div>
        )}
        
        <Button
          variant={variant === 'primary' ? 'outline' : variant}
          size={buttonSize}
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
          size={buttonSize}
          onClick={handleSignIn}
          className={`flex items-center gap-2 ${className}`}
        >
      <Mail size={16} />
      Connect Gmail
    </Button>
  );
}; 
import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Shield, 
  Clock,
  User
} from 'lucide-react';
import { useGoogleAuth } from './GoogleAuthProvider';

interface LoginStatusProps {
  showDetails?: boolean;
  showUserAvatar?: boolean;
  compact?: boolean;
  className?: string;
}

export const LoginStatus: React.FC<LoginStatusProps> = ({
  showDetails = true,
  showUserAvatar = true,
  compact = false,
  className = ''
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    tokens, 
    error 
  } = useGoogleAuth();

  // Helper function to format expiry time
  const formatExpiryTime = (expiresAt?: number): string => {
    if (!expiresAt) return 'Unknown';
    
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to determine connection quality
  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!isAuthenticated) return 'offline';
    if (!tokens) return 'poor';
    
    const now = Date.now();
    const expiresAt = tokens.expiresAt || 0;
    const timeLeft = expiresAt - now;
    
    if (timeLeft > 3600000) return 'excellent'; // > 1 hour
    if (timeLeft > 1800000) return 'good'; // > 30 minutes
    if (timeLeft > 0) return 'poor'; // expires soon
    return 'offline';
  };

  const connectionQuality = getConnectionQuality();

  // Compact view
  if (compact) {
    if (isLoading) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Loader2 size={14} className="animate-spin text-accent-primary" />
          <span className="text-[11px] text-secondary">Checking...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-[11px] text-error">Error</span>
        </div>
      );
    }

    if (isAuthenticated) {
      const qualityColors = {
        excellent: 'text-green-500',
        good: 'text-warning',
        poor: 'text-orange-500',
        offline: 'text-red-500'
      };

      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <CheckCircle size={14} className={qualityColors[connectionQuality]} />
          <span className="text-[11px] text-secondary">Connected</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <WifiOff size={14} className="text-muted" />
        <span className="text-[11px] text-secondary">Disconnected</span>
      </div>
    );
  }

  // Full view
  return (
    <div className={`border-border-default rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="asana-text-sm font-medium text-primary">Gmail Connection</h3>
        
        {/* Connection indicator */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          ) : isAuthenticated ? (
            connectionQuality === 'excellent' ? (
              <Wifi size={16} className="text-green-500" />
            ) : connectionQuality === 'good' ? (
              <Wifi size={16} className="text-warning" />
            ) : connectionQuality === 'poor' ? (
              <Wifi size={16} className="text-orange-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )
          ) : (
            <WifiOff size={16} className="text-muted" />
          )}
        </div>
      </div>

      {/* Status content */}
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="asana-text-sm text-secondary">Verifying authentication...</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-surface">
              <div className="h-1.5 w-1/2 animate-pulse rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="asana-text-sm font-medium text-error">Authentication Error</p>
            <p className="mt-1 text-[11px] text-error">{error}</p>
          </div>
        </div>
      ) : isAuthenticated && user ? (
        <div className="space-y-3">
          {/* User info */}
          <div className="flex items-center gap-3">
            {showUserAvatar && user.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="border-border-default size-10 rounded-full border"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-surface">
                <User size={20} className="text-secondary" />
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <p className="truncate asana-text-sm font-medium text-primary">
                {user.name || 'Unknown User'}
              </p>
              <p className="truncate text-[11px] text-secondary">
                {user.email}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-[11px] font-medium text-green-600">Connected</span>
            </div>
          </div>

          {/* Details */}
          {showDetails && tokens && (
            <div className="space-y-2 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-blue-500" />
                  <span className="text-secondary">Token Status</span>
                </div>
                <span className="font-medium text-primary">
                  {connectionQuality === 'excellent' ? 'Excellent' :
                   connectionQuality === 'good' ? 'Good' :
                   connectionQuality === 'poor' ? 'Expires Soon' : 'Expired'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-muted" />
                  <span className="text-secondary">Expires In</span>
                </div>
                <span className={`font-medium ${
                  connectionQuality === 'excellent' ? 'text-green-600' :
                  connectionQuality === 'good' ? 'text-warning' :
                  connectionQuality === 'poor' ? 'text-orange-600' : 'text-error'
                }`}>
                  {formatExpiryTime(tokens.expiresAt)}
                </span>
              </div>

              {tokens.scope && (
                <div className="flex items-start justify-between text-[11px]">
                  <span className="text-secondary">Permissions</span>
                  <div className="max-w-32 text-right">
                    <span className="font-medium text-primary">
                      {tokens.scope.split(' ').length} scopes
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <WifiOff size={20} className="text-muted" />
          <div className="flex-1">
            <p className="asana-text-sm text-secondary">Not connected to Gmail</p>
            <p className="mt-1 text-[11px] text-secondary">
              Click &quot;Connect Gmail&quot; to sign in
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 
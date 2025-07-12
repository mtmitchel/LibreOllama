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
          <Loader2 size={14} className="animate-spin text-blue-500" />
          <span className="text-xs text-gray-600">Checking...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-red-600">Error</span>
        </div>
      );
    }

    if (isAuthenticated) {
      const qualityColors = {
        excellent: 'text-green-500',
        good: 'text-yellow-500',
        poor: 'text-orange-500',
        offline: 'text-red-500'
      };

      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <CheckCircle size={14} className={qualityColors[connectionQuality]} />
          <span className="text-xs text-gray-600">Connected</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <WifiOff size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">Disconnected</span>
      </div>
    );
  }

  // Full view
  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Gmail Connection</h3>
        
        {/* Connection indicator */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          ) : isAuthenticated ? (
            connectionQuality === 'excellent' ? (
              <Wifi size={16} className="text-green-500" />
            ) : connectionQuality === 'good' ? (
              <Wifi size={16} className="text-yellow-500" />
            ) : connectionQuality === 'poor' ? (
              <Wifi size={16} className="text-orange-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )
          ) : (
            <WifiOff size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Status content */}
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Verifying authentication...</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Authentication Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
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
                className="w-10 h-10 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
          </div>

          {/* Details */}
          {showDetails && tokens && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-blue-500" />
                  <span className="text-gray-600">Token Status</span>
                </div>
                <span className="font-medium text-gray-900">
                  {connectionQuality === 'excellent' ? 'Excellent' :
                   connectionQuality === 'good' ? 'Good' :
                   connectionQuality === 'poor' ? 'Expires Soon' : 'Expired'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-600">Expires In</span>
                </div>
                <span className={`font-medium ${
                  connectionQuality === 'excellent' ? 'text-green-600' :
                  connectionQuality === 'good' ? 'text-yellow-600' :
                  connectionQuality === 'poor' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {formatExpiryTime(tokens.expiresAt)}
                </span>
              </div>

              {tokens.scope && (
                <div className="flex items-start justify-between text-xs">
                  <span className="text-gray-600">Permissions</span>
                  <div className="text-right max-w-32">
                    <span className="font-medium text-gray-900">
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
          <WifiOff size={20} className="text-gray-400" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Not connected to Gmail</p>
            <p className="text-xs text-gray-500 mt-1">
              Click "Connect Gmail" to sign in
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 
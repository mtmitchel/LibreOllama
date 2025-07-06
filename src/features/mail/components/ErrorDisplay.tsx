import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  Shield, 
  RefreshCw, 
  X, 
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { GmailError, GmailErrorType, GmailErrorHandler } from '../services/gmailErrorHandler';

interface ErrorDisplayProps {
  error: GmailError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '', 
  compact = false,
  showActions = true 
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!error) return null;

  const errorMessage = GmailErrorHandler.getErrorMessage(error);
  const errorIcon = getErrorIcon(error.type);
  const errorColor = getErrorColor(error.type);

  const handleRetry = async () => {
    if (!onRetry || !error.isRetryable) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${errorColor.bg} ${className}`}>
        <div className={`flex-shrink-0 ${errorColor.icon}`}>
          {errorIcon}
        </div>
        <Text size="sm" className={`flex-1 ${errorColor.text}`}>
          {errorMessage.message}
        </Text>
        {showActions && error.isRetryable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {showActions && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${errorColor.border} ${errorColor.bg} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${errorColor.icon}`}>
          {errorIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${errorColor.text}`}>
                {errorMessage.title}
              </h4>
              <p className={`mt-1 text-sm ${errorColor.textSecondary}`}>
                {errorMessage.message}
              </p>
            </div>
            
            {showActions && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="flex-shrink-0 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && error.details && (
            <details className="mt-2">
              <summary className={`text-xs cursor-pointer ${errorColor.textSecondary}`}>
                Technical Details
              </summary>
              <pre className={`mt-1 text-xs ${errorColor.textSecondary} whitespace-pre-wrap`}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}

          {/* Suggested Actions */}
          {showActions && errorMessage.actions.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${errorColor.text} mb-2`}>
                Suggested actions:
              </p>
              <ul className={`text-xs space-y-1 ${errorColor.textSecondary}`}>
                {errorMessage.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-xs mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-2 mt-4">
              {error.isRetryable && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              
              {error.type === GmailErrorType.AUTH_ERROR && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // This would trigger the auth flow
                    window.location.href = '/mail/auth';
                  }}
                  className="flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Sign In
                </Button>
              )}
              
              {(error.type === GmailErrorType.API_ERROR || error.type === GmailErrorType.GMAIL_API_ERROR) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('https://www.google.com/appsstatus#hl=en&v=status&ts=1', '_blank');
                  }}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Check Gmail Status
                </Button>
              )}
            </div>
          )}

          {/* Retry Timer */}
          {error.retryAfterSeconds && (
            <div className="mt-2 flex items-center gap-1">
              <Clock className={`w-3 h-3 ${errorColor.icon}`} />
              <Text size="xs" className={errorColor.textSecondary}>
                Retry available in {error.retryAfterSeconds} seconds
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getErrorIcon(type: GmailErrorType) {
  switch (type) {
    case GmailErrorType.NETWORK_ERROR:
    case GmailErrorType.OFFLINE_ERROR:
    case GmailErrorType.TIMEOUT_ERROR:
      return <Wifi className="w-4 h-4" />;
    
    case GmailErrorType.AUTH_ERROR:
    case GmailErrorType.TOKEN_EXPIRED:
    case GmailErrorType.INVALID_TOKEN:
    case GmailErrorType.OAUTH_ERROR:
      return <Shield className="w-4 h-4" />;
    
    case GmailErrorType.VALIDATION_ERROR:
    case GmailErrorType.INVALID_EMAIL:
    case GmailErrorType.MISSING_REQUIRED_FIELD:
    case GmailErrorType.MESSAGE_TOO_LARGE:
      return <AlertCircle className="w-4 h-4" />;
    
    case GmailErrorType.QUOTA_EXCEEDED:
    case GmailErrorType.RATE_LIMITED:
      return <Clock className="w-4 h-4" />;
    
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
}

function getErrorColor(type: GmailErrorType) {
  switch (type) {
    case GmailErrorType.NETWORK_ERROR:
    case GmailErrorType.OFFLINE_ERROR:
    case GmailErrorType.TIMEOUT_ERROR:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
        textSecondary: 'text-blue-600 dark:text-blue-300'
      };
    
    case GmailErrorType.AUTH_ERROR:
    case GmailErrorType.TOKEN_EXPIRED:
    case GmailErrorType.INVALID_TOKEN:
    case GmailErrorType.OAUTH_ERROR:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-800 dark:text-yellow-200',
        textSecondary: 'text-yellow-600 dark:text-yellow-300'
      };
    
    case GmailErrorType.VALIDATION_ERROR:
    case GmailErrorType.INVALID_EMAIL:
    case GmailErrorType.MISSING_REQUIRED_FIELD:
    case GmailErrorType.MESSAGE_TOO_LARGE:
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-200',
        textSecondary: 'text-orange-600 dark:text-orange-300'
      };
    
    case GmailErrorType.QUOTA_EXCEEDED:
    case GmailErrorType.RATE_LIMITED:
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/20',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-800 dark:text-purple-200',
        textSecondary: 'text-purple-600 dark:text-purple-300'
      };
    
    default:
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200',
        textSecondary: 'text-red-600 dark:text-red-300'
      };
  }
}

// Success message component for completed operations
interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  autoHideAfter?: number; // milliseconds
}

export function SuccessMessage({ 
  message, 
  onDismiss, 
  className = '',
  autoHideAfter = 5000 
}: SuccessMessageProps) {
  React.useEffect(() => {
    if (autoHideAfter && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideAfter);
      return () => clearTimeout(timer);
    }
  }, [autoHideAfter, onDismiss]);

  return (
    <div className={`rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
        <Text className="text-green-800 dark:text-green-200 flex-1">
          {message}
        </Text>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="flex-shrink-0 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Loading message component for operations in progress
interface LoadingMessageProps {
  message: string;
  className?: string;
}

export function LoadingMessage({ message, className = '' }: LoadingMessageProps) {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 animate-spin" />
        <Text className="text-gray-800 dark:text-gray-200">
          {message}
        </Text>
      </div>
    </div>
  );
} 
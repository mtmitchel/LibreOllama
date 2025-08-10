import { useState, useEffect } from 'react';
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
      <div className={`flex items-center gap-2 rounded-lg p-2 ${errorColor.bg} ${className}`}>
        <div className={`shrink-0 ${errorColor.icon}`}>
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
            className="shrink-0"
          >
            <RefreshCw className={`size-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {showActions && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="shrink-0"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${errorColor.border} ${errorColor.bg} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${errorColor.icon}`}>
          {errorIcon}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`asana-text-sm font-medium ${errorColor.text}`}>
                {errorMessage.title}
              </h4>
              <p className={`mt-1 asana-text-sm ${errorColor.textSecondary}`}>
                {errorMessage.message}
              </p>
            </div>
            
            {showActions && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="-mr-1 -mt-1 shrink-0"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && error.details && (
            <details className="mt-2">
              <summary className={`cursor-pointer text-[11px] ${errorColor.textSecondary}`}>
                Technical Details
              </summary>
              <pre className={`mt-1 text-[11px] ${errorColor.textSecondary} whitespace-pre-wrap`}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}

          {/* Suggested Actions */}
          {showActions && errorMessage.actions.length > 0 && (
            <div className="mt-3">
              <p className={`text-[11px] font-medium ${errorColor.text} mb-2`}>
                Suggested actions:
              </p>
              <ul className={`space-y-1 text-[11px] ${errorColor.textSecondary}`}>
                {errorMessage.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="mt-0.5 text-[11px]">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="mt-4 flex items-center gap-2">
              {error.isRetryable && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`size-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try again'}
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
                  <Shield className="size-3" />
                  Sign in
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
                  <ExternalLink className="size-3" />
                  Check Gmail Status
                </Button>
              )}
            </div>
          )}

          {/* Retry Timer */}
          {error.retryAfterSeconds && (
            <div className="mt-2 flex items-center gap-1">
              <Clock className={`size-3 ${errorColor.icon}`} />
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
      return <Wifi className="size-4" />;
    
    case GmailErrorType.AUTH_ERROR:
    case GmailErrorType.TOKEN_EXPIRED:
    case GmailErrorType.INVALID_TOKEN:
    case GmailErrorType.OAUTH_ERROR:
      return <Shield className="size-4" />;
    
    case GmailErrorType.VALIDATION_ERROR:
    case GmailErrorType.INVALID_EMAIL:
    case GmailErrorType.MISSING_REQUIRED_FIELD:
    case GmailErrorType.MESSAGE_TOO_LARGE:
      return <AlertCircle className="size-4" />;
    
    case GmailErrorType.QUOTA_EXCEEDED:
    case GmailErrorType.RATE_LIMITED:
      return <Clock className="size-4" />;
    
    default:
      return <AlertTriangle className="size-4" />;
  }
}

function getErrorColor(type: GmailErrorType) {
  switch (type) {
    case GmailErrorType.NETWORK_ERROR:
    case GmailErrorType.OFFLINE_ERROR:
    case GmailErrorType.TIMEOUT_ERROR:
      return {
        bg: 'bg-accent-soft',
        border: 'border-accent-primary',
        icon: 'text-accent-primary',
        text: 'text-primary',
        textSecondary: 'text-secondary'
      };
    
    case GmailErrorType.AUTH_ERROR:
    case GmailErrorType.TOKEN_EXPIRED:
    case GmailErrorType.INVALID_TOKEN:
    case GmailErrorType.OAUTH_ERROR:
      return {
        bg: 'bg-warning-ghost',
        border: 'border-warning',
        icon: 'text-warning',
        text: 'text-warning-fg',
        textSecondary: 'text-warning'
      };
    
    case GmailErrorType.VALIDATION_ERROR:
    case GmailErrorType.INVALID_EMAIL:
    case GmailErrorType.MISSING_REQUIRED_FIELD:
    case GmailErrorType.MESSAGE_TOO_LARGE:
      return {
        bg: 'bg-warning-ghost',
        border: 'border-warning',
        icon: 'text-warning',
        text: 'text-primary',
        textSecondary: 'text-secondary'
      };
    
    case GmailErrorType.QUOTA_EXCEEDED:
    case GmailErrorType.RATE_LIMITED:
      return {
        bg: 'bg-accent-soft',
        border: 'border-accent-primary',
        icon: 'text-accent-primary',
        text: 'text-primary',
        textSecondary: 'text-secondary'
      };
    
    default:
      return {
        bg: 'bg-error-ghost',
        border: 'border-error',
        icon: 'text-error',
        text: 'text-primary',
        textSecondary: 'text-secondary'
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
  useEffect(() => {
    if (autoHideAfter && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideAfter);
      return () => clearTimeout(timer);
    }
  }, [autoHideAfter, onDismiss]);

  return (
    <div className={`rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20 ${className}`}>
      <div className="flex items-center gap-3">
        <CheckCircle className="size-4 shrink-0 text-green-600 dark:text-green-400" />
        <Text className="flex-1 text-green-800 dark:text-green-200">
          {message}
        </Text>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="-mr-1 shrink-0"
          >
            <X className="size-4" />
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
    <div className={`border-border-default dark:bg-primary/20 rounded-lg border bg-surface p-4 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3">
        <RefreshCw className="size-4 shrink-0 animate-spin text-secondary dark:text-muted" />
        <Text className="text-primary dark:text-gray-200">
          {message}
        </Text>
      </div>
    </div>
  );
} 

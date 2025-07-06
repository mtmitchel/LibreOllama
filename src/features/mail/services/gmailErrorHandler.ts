import { invoke } from '@tauri-apps/api/core';

// Comprehensive error types for Gmail operations
export enum GmailErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  OAUTH_ERROR = 'OAUTH_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  
  // Gmail-specific errors
  GMAIL_API_ERROR = 'GMAIL_API_ERROR',
  GMAIL_SEND_ERROR = 'GMAIL_SEND_ERROR',
  GMAIL_DRAFT_ERROR = 'GMAIL_DRAFT_ERROR',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND'
}

export interface GmailError {
  type: GmailErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  isRetryable: boolean;
  retryAfterSeconds?: number;
  suggestedActions?: string[];
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: GmailErrorType[];
}

export interface ErrorContext {
  operation: string;
  accountId?: string;
  messageId?: string;
  threadId?: string;
  userAgent?: string;
  networkStatus?: 'online' | 'offline';
}

export class GmailErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      GmailErrorType.NETWORK_ERROR,
      GmailErrorType.TIMEOUT_ERROR,
      GmailErrorType.RATE_LIMITED,
      GmailErrorType.API_ERROR
    ]
  };

  private static readonly ERROR_MESSAGES = {
    [GmailErrorType.NETWORK_ERROR]: {
      message: 'Network connection failed',
      userMessage: 'Unable to connect to Gmail. Please check your internet connection and try again.',
      suggestedActions: ['Check your internet connection', 'Try again in a few moments']
    },
    [GmailErrorType.OFFLINE_ERROR]: {
      message: 'Device is offline',
      userMessage: 'You are currently offline. Some features may not be available.',
      suggestedActions: ['Connect to the internet to sync your emails', 'View cached emails in offline mode']
    },
    [GmailErrorType.TIMEOUT_ERROR]: {
      message: 'Request timed out',
      userMessage: 'The request took too long to complete. Please try again.',
      suggestedActions: ['Try again', 'Check your internet connection']
    },
    [GmailErrorType.AUTH_ERROR]: {
      message: 'Authentication failed',
      userMessage: 'Unable to authenticate with Gmail. Please sign in again.',
      suggestedActions: ['Sign in to your Gmail account again', 'Check your account permissions']
    },
    [GmailErrorType.TOKEN_EXPIRED]: {
      message: 'Authentication token expired',
      userMessage: 'Your Gmail session has expired. Please sign in again.',
      suggestedActions: ['Sign in to your Gmail account again']
    },
    [GmailErrorType.INVALID_TOKEN]: {
      message: 'Invalid authentication token',
      userMessage: 'Your Gmail authentication is invalid. Please sign in again.',
      suggestedActions: ['Sign in to your Gmail account again', 'Remove and re-add your account']
    },
    [GmailErrorType.OAUTH_ERROR]: {
      message: 'OAuth authentication error',
      userMessage: 'There was a problem with Gmail authentication. Please try signing in again.',
      suggestedActions: ['Try signing in again', 'Contact support if the problem persists']
    },
    [GmailErrorType.API_ERROR]: {
      message: 'Gmail API error',
      userMessage: 'Gmail is experiencing issues. Please try again later.',
      suggestedActions: ['Try again in a few minutes', 'Check Gmail status page']
    },
    [GmailErrorType.QUOTA_EXCEEDED]: {
      message: 'API quota exceeded',
      userMessage: 'Too many requests have been made. Please wait a moment and try again.',
      suggestedActions: ['Wait a few minutes before trying again', 'Try again later']
    },
    [GmailErrorType.RATE_LIMITED]: {
      message: 'Rate limit exceeded',
      userMessage: 'Too many requests too quickly. Please slow down and try again.',
      suggestedActions: ['Wait a moment before trying again', 'Reduce the frequency of requests']
    },
    [GmailErrorType.INVALID_REQUEST]: {
      message: 'Invalid request',
      userMessage: 'The request was invalid. Please check your input and try again.',
      suggestedActions: ['Check your input for errors', 'Try again with different parameters']
    },
    [GmailErrorType.VALIDATION_ERROR]: {
      message: 'Validation error',
      userMessage: 'Please check your input and correct any errors.',
      suggestedActions: ['Review and correct the highlighted fields', 'Ensure all required fields are filled']
    },
    [GmailErrorType.INVALID_EMAIL]: {
      message: 'Invalid email address',
      userMessage: 'Please enter a valid email address.',
      suggestedActions: ['Check the email address format', 'Ensure the email address is correct']
    },
    [GmailErrorType.MISSING_REQUIRED_FIELD]: {
      message: 'Missing required field',
      userMessage: 'Please fill in all required fields.',
      suggestedActions: ['Fill in all required fields', 'Check for any missing information']
    },
    [GmailErrorType.MESSAGE_TOO_LARGE]: {
      message: 'Message too large',
      userMessage: 'Your message is too large to send. Please reduce the size of attachments or message content.',
      suggestedActions: ['Reduce attachment sizes', 'Compress images', 'Remove unnecessary content']
    },
    [GmailErrorType.GMAIL_API_ERROR]: {
      message: 'Gmail API error',
      userMessage: 'Gmail is experiencing issues. Please try again later.',
      suggestedActions: ['Try again in a few minutes', 'Check Gmail status']
    },
    [GmailErrorType.GMAIL_SEND_ERROR]: {
      message: 'Failed to send email',
      userMessage: 'Your email could not be sent. Please check the recipients and try again.',
      suggestedActions: ['Check recipient email addresses', 'Try sending again', 'Save as draft and try later']
    },
    [GmailErrorType.GMAIL_DRAFT_ERROR]: {
      message: 'Failed to save draft',
      userMessage: 'Your draft could not be saved. Your changes may be lost.',
      suggestedActions: ['Try saving again', 'Copy your message content as backup']
    },
    [GmailErrorType.PERMISSION_DENIED]: {
      message: 'Permission denied',
      userMessage: 'You do not have permission to perform this action.',
      suggestedActions: ['Check your account permissions', 'Contact your administrator']
    },
    [GmailErrorType.NOT_FOUND]: {
      message: 'Resource not found',
      userMessage: 'The requested item could not be found.',
      suggestedActions: ['Check if the item still exists', 'Try refreshing the view']
    },
    [GmailErrorType.UNKNOWN_ERROR]: {
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      suggestedActions: ['Try again', 'Contact support if the problem persists']
    }
  };

  /**
   * Parse and categorize error from various sources
   */
  static parseError(error: unknown, context: ErrorContext): GmailError {
    const timestamp = new Date().toISOString();
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    
    // Handle offline scenarios
    if (!navigator.onLine) {
      return this.createError(GmailErrorType.OFFLINE_ERROR, '', { context, networkStatus }, timestamp);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.parseStringError(error, context, timestamp);
    }

    // Handle Error objects
    if (error instanceof Error) {
      return this.parseErrorObject(error, context, timestamp);
    }

    // Handle API response errors
    if (this.isApiError(error)) {
      return this.parseApiError(error, context, timestamp);
    }

    // Handle Tauri invoke errors
    if (this.isTauriError(error)) {
      return this.parseTauriError(error, context, timestamp);
    }

    // Default to unknown error
    return this.createError(GmailErrorType.UNKNOWN_ERROR, '', { 
      context, 
      originalError: error,
      networkStatus
    }, timestamp);
  }

  private static parseStringError(error: string, context: ErrorContext, timestamp: string): GmailError {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('authentication') || lowerError.includes('unauthorized')) {
      return this.createError(GmailErrorType.AUTH_ERROR, error, { context }, timestamp);
    }
    
    if (lowerError.includes('token') && lowerError.includes('expired')) {
      return this.createError(GmailErrorType.TOKEN_EXPIRED, error, { context }, timestamp);
    }
    
    if (lowerError.includes('quota') || lowerError.includes('limit')) {
      return this.createError(GmailErrorType.QUOTA_EXCEEDED, error, { context }, timestamp);
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return this.createError(GmailErrorType.NETWORK_ERROR, error, { context }, timestamp);
    }
    
    if (lowerError.includes('timeout')) {
      return this.createError(GmailErrorType.TIMEOUT_ERROR, error, { context }, timestamp);
    }
    
    if (lowerError.includes('validation') || lowerError.includes('invalid')) {
      return this.createError(GmailErrorType.VALIDATION_ERROR, error, { context }, timestamp);
    }
    
    return this.createError(GmailErrorType.UNKNOWN_ERROR, error, { context }, timestamp);
  }

  private static parseErrorObject(error: Error, context: ErrorContext, timestamp: string): GmailError {
    const message = error.message;
    const lowerMessage = message.toLowerCase();
    
    // Check for specific error types based on message content
    if (lowerMessage.includes('network') || error.name === 'NetworkError') {
      return this.createError(GmailErrorType.NETWORK_ERROR, message, { context, stack: error.stack }, timestamp);
    }
    
    if (lowerMessage.includes('timeout') || error.name === 'TimeoutError') {
      return this.createError(GmailErrorType.TIMEOUT_ERROR, message, { context, stack: error.stack }, timestamp);
    }
    
    if (lowerMessage.includes('authentication') || lowerMessage.includes('unauthorized')) {
      return this.createError(GmailErrorType.AUTH_ERROR, message, { context, stack: error.stack }, timestamp);
    }
    
    return this.createError(GmailErrorType.UNKNOWN_ERROR, message, { 
      context, 
      stack: error.stack,
      name: error.name 
    }, timestamp);
  }

  private static parseApiError(error: any, context: ErrorContext, timestamp: string): GmailError {
    const status = error.status || error.statusCode;
    const message = error.message || error.error || 'API Error';
    
    switch (status) {
      case 401:
        return this.createError(GmailErrorType.AUTH_ERROR, message, { context, status }, timestamp);
      case 403:
        return this.createError(GmailErrorType.PERMISSION_DENIED, message, { context, status }, timestamp);
      case 404:
        return this.createError(GmailErrorType.NOT_FOUND, message, { context, status }, timestamp);
      case 429:
        return this.createError(GmailErrorType.RATE_LIMITED, message, { 
          context, 
          status,
          retryAfterSeconds: error.retryAfter || 60
        }, timestamp);
      case 500:
      case 502:
      case 503:
        return this.createError(GmailErrorType.API_ERROR, message, { context, status }, timestamp);
      default:
        return this.createError(GmailErrorType.GMAIL_API_ERROR, message, { context, status }, timestamp);
    }
  }

  private static parseTauriError(error: any, context: ErrorContext, timestamp: string): GmailError {
    const message = error.message || error.error || 'Tauri Error';
    
    if (message.includes('Failed to get authentication tokens')) {
      return this.createError(GmailErrorType.TOKEN_EXPIRED, message, { context }, timestamp);
    }
    
    if (message.includes('Gmail API')) {
      return this.createError(GmailErrorType.GMAIL_API_ERROR, message, { context }, timestamp);
    }
    
    return this.createError(GmailErrorType.UNKNOWN_ERROR, message, { context }, timestamp);
  }

  private static createError(
    type: GmailErrorType, 
    message: string, 
    details: Record<string, any>, 
    timestamp: string
  ): GmailError {
    const errorInfo = this.ERROR_MESSAGES[type];
    const isRetryable = this.DEFAULT_RETRY_CONFIG.retryableErrors.includes(type);
    
    return {
      type,
      message: message || errorInfo.message,
      userMessage: errorInfo.userMessage,
      details,
      timestamp,
      isRetryable,
      retryAfterSeconds: details.retryAfterSeconds,
      suggestedActions: errorInfo.suggestedActions
    };
  }

  private static isApiError(error: any): boolean {
    return error && typeof error === 'object' && 
           (error.status || error.statusCode || error.response);
  }

  private static isTauriError(error: any): boolean {
    return error && typeof error === 'object' && 
           (error.message?.includes('tauri') || error.source === 'tauri');
  }

  /**
   * Execute operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: GmailError | null = null;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error, context);
        
        // Don't retry if error is not retryable or we've exhausted attempts
        if (!lastError.isRetryable || attempt === finalConfig.maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelayMs
        );
        
        // Use retry-after header if available
        const retryDelay = lastError.retryAfterSeconds 
          ? lastError.retryAfterSeconds * 1000 
          : delay;
        
        await this.delay(retryDelay);
      }
    }
    
    throw lastError;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log error for debugging and analytics
   */
  static logError(error: GmailError, context: ErrorContext): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Gmail Error:', logData);
    }
    
    // Send to backend for persistent logging
    this.sendErrorReport(logData).catch(err => {
      console.error('Failed to send error report:', err);
    });
  }

  private static async sendErrorReport(errorData: any): Promise<void> {
    try {
      await invoke('log_application_event', {
        event: 'gmail_error',
        data: errorData
      });
    } catch (error) {
      // Silently fail - don't throw for logging errors
    }
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  static getErrorMessage(error: GmailError): {
    title: string;
    message: string;
    actions: string[];
  } {
    return {
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      actions: error.suggestedActions || []
    };
  }

  private static getErrorTitle(type: GmailErrorType): string {
    switch (type) {
      case GmailErrorType.NETWORK_ERROR:
      case GmailErrorType.OFFLINE_ERROR:
      case GmailErrorType.TIMEOUT_ERROR:
        return 'Connection Problem';
      case GmailErrorType.AUTH_ERROR:
      case GmailErrorType.TOKEN_EXPIRED:
      case GmailErrorType.INVALID_TOKEN:
      case GmailErrorType.OAUTH_ERROR:
        return 'Authentication Required';
      case GmailErrorType.API_ERROR:
      case GmailErrorType.GMAIL_API_ERROR:
        return 'Gmail Service Error';
      case GmailErrorType.QUOTA_EXCEEDED:
      case GmailErrorType.RATE_LIMITED:
        return 'Too Many Requests';
      case GmailErrorType.VALIDATION_ERROR:
      case GmailErrorType.INVALID_EMAIL:
      case GmailErrorType.MISSING_REQUIRED_FIELD:
        return 'Invalid Input';
      case GmailErrorType.MESSAGE_TOO_LARGE:
        return 'Message Too Large';
      case GmailErrorType.PERMISSION_DENIED:
        return 'Permission Denied';
      case GmailErrorType.NOT_FOUND:
        return 'Not Found';
      default:
        return 'Unexpected Error';
    }
  }
}

// Export utility function for easy error handling
export const handleGmailError = (error: unknown, context: ErrorContext): GmailError => {
  const gmailError = GmailErrorHandler.parseError(error, context);
  GmailErrorHandler.logError(gmailError, context);
  return gmailError;
};

// Export retry utility
export const retryGmailOperation = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  config?: Partial<RetryConfig>
): Promise<T> => {
  return GmailErrorHandler.executeWithRetry(operation, context, config);
}; 
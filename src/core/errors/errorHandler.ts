/**
 * Centralized Error Handler
 * 
 * Provides consistent error handling, logging, and user notification
 * across all stores and services in the application.
 */

import { logger } from '../lib/logger';
import { invoke } from '@tauri-apps/api/core';

export enum ErrorType {
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  
  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Data errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // Generic errors
  UNKNOWN = 'UNKNOWN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorContext {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  source: string;
  userId?: string;
  accountId?: string;
  retryable: boolean;
  userMessage?: string;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logToConsole?: boolean;
  logToFile?: boolean;
  reportToBackend?: boolean;
  retryable?: boolean;
}

class ErrorHandler {
  private errorQueue: ErrorContext[] = [];
  private maxQueueSize = 100;
  private listeners: ((error: ErrorContext) => void)[] = [];

  /**
   * Handle an error with appropriate logging and notifications
   */
  async handleError(
    error: unknown,
    source: string,
    options: ErrorHandlerOptions = {}
  ): Promise<ErrorContext> {
    const errorContext = this.createErrorContext(error, source, options);
    
    // Add to queue
    this.addToQueue(errorContext);
    
    // Log the error
    await this.logError(errorContext, options);
    
    // Show notification if requested
    if (options.showNotification) {
      await this.showErrorNotification(errorContext);
    }
    
    // Report to backend if requested
    if (options.reportToBackend) {
      await this.reportToBackend(errorContext);
    }
    
    // Notify listeners
    this.notifyListeners(errorContext);
    
    return errorContext;
  }

  /**
   * Create error context from various error types
   */
  private createErrorContext(
    error: unknown,
    source: string,
    options: ErrorHandlerOptions
  ): ErrorContext {
    let type = ErrorType.UNKNOWN;
    let message = 'An unknown error occurred';
    let details: any = {};
    let userMessage: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      details = {
        stack: error.stack,
        name: error.name,
      };

      // Determine error type based on error message or properties
      if (message.includes('network') || message.includes('fetch')) {
        type = ErrorType.NETWORK_ERROR;
        userMessage = 'Network error. Please check your connection.';
      } else if (message.includes('timeout')) {
        type = ErrorType.TIMEOUT;
        userMessage = 'Request timed out. Please try again.';
      } else if (message.includes('401') || message.includes('unauthorized')) {
        type = ErrorType.AUTH_FAILED;
        userMessage = 'Authentication failed. Please sign in again.';
      } else if (message.includes('403') || message.includes('forbidden')) {
        type = ErrorType.PERMISSION_DENIED;
        userMessage = 'Permission denied. You may not have access to this resource.';
      } else if (message.includes('404') || message.includes('not found')) {
        type = ErrorType.NOT_FOUND;
        userMessage = 'Resource not found.';
      } else if (message.includes('429') || message.includes('rate limit')) {
        type = ErrorType.RATE_LIMIT;
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (message.includes('storage')) {
        type = ErrorType.STORAGE_ERROR;
        userMessage = 'Storage error. Please check your disk space.';
      } else if (message.includes('token') && message.includes('expired')) {
        type = ErrorType.TOKEN_EXPIRED;
        userMessage = 'Your session has expired. Please sign in again.';
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = (error as any).message || JSON.stringify(error);
      details = error;
    }

    return {
      type,
      message,
      details,
      timestamp: new Date(),
      source,
      retryable: options.retryable ?? this.isRetryable(type),
      userMessage: userMessage || this.getDefaultUserMessage(type),
    };
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryable(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.TOKEN_EXPIRED,
    ];
    return retryableTypes.includes(type);
  }

  /**
   * Get default user-friendly message for error type
   */
  private getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.AUTH_FAILED]: 'Authentication failed. Please check your credentials.',
      [ErrorType.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorType.TOKEN_REFRESH_FAILED]: 'Failed to refresh authentication. Please sign in again.',
      [ErrorType.INVALID_CREDENTIALS]: 'Invalid credentials. Please try again.',
      [ErrorType.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
      [ErrorType.TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorType.OFFLINE]: 'You appear to be offline. Please check your connection.',
      [ErrorType.API_ERROR]: 'Service error. Please try again later.',
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment.',
      [ErrorType.QUOTA_EXCEEDED]: 'Quota exceeded. Please try again later.',
      [ErrorType.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
      [ErrorType.VALIDATION_ERROR]: 'Invalid data. Please check your input.',
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.CONFLICT]: 'A conflict occurred. Please refresh and try again.',
      [ErrorType.STORAGE_ERROR]: 'Storage error. Please check available space.',
      [ErrorType.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
      [ErrorType.INTERNAL_ERROR]: 'Internal error. Please contact support if this persists.',
    };
    return messages[type];
  }

  /**
   * Add error to queue
   */
  private addToQueue(error: ErrorContext): void {
    this.errorQueue.push(error);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Log error based on options
   */
  private async logError(
    error: ErrorContext,
    options: ErrorHandlerOptions
  ): Promise<void> {
    const logMessage = `[${error.source}] ${error.type}: ${error.message}`;
    const logData = {
      type: error.type,
      source: error.source,
      timestamp: error.timestamp.toISOString(),
      details: error.details,
      retryable: error.retryable,
    };

    // Always log errors
    logger.error(logMessage, logData);

    // Log to file if requested
    if (options.logToFile) {
      try {
        await invoke('log_error_to_file', { error: logData });
      } catch (e) {
        logger.warn('Failed to log error to file', e);
      }
    }
  }

  /**
   * Show error notification to user
   */
  private async showErrorNotification(error: ErrorContext): Promise<void> {
    try {
      await invoke('show_notification', {
        title: 'Error',
        body: error.userMessage || error.message,
        icon: 'error',
      });
    } catch (e) {
      logger.warn('Failed to show error notification', e);
    }
  }

  /**
   * Report error to backend for monitoring
   */
  private async reportToBackend(error: ErrorContext): Promise<void> {
    try {
      // This would send to your error monitoring service
      await invoke('report_error', { error });
    } catch (e) {
      logger.warn('Failed to report error to backend', e);
    }
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: ErrorContext) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of an error
   */
  private notifyListeners(error: ErrorContext): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        logger.warn('Error in error listener', e);
      }
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10): ErrorContext[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: ErrorType): ErrorContext[] {
    return this.errorQueue.filter(e => e.type === type);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export async function handleError(
  error: unknown,
  source: string,
  options?: ErrorHandlerOptions
): Promise<ErrorContext> {
  return errorHandler.handleError(error, source, options);
}

export function handleGmailError(error: unknown): ErrorContext {
  return errorHandler.handleError(error, 'GmailService', {
    showNotification: true,
    reportToBackend: true,
  });
}

export function handleCalendarError(error: unknown): ErrorContext {
  return errorHandler.handleError(error, 'CalendarService', {
    showNotification: true,
    reportToBackend: true,
  });
}

export function handleTasksError(error: unknown): ErrorContext {
  return errorHandler.handleError(error, 'TasksService', {
    showNotification: true,
    reportToBackend: true,
  });
}

export function handleAuthError(error: unknown): ErrorContext {
  return errorHandler.handleError(error, 'AuthService', {
    showNotification: true,
    reportToBackend: true,
    retryable: false,
  });
}

export function handleStorageError(error: unknown): ErrorContext {
  return errorHandler.handleError(error, 'StorageService', {
    showNotification: true,
    logToFile: true,
  });
}
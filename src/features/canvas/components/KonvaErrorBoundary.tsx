import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { stateSynchronizationMonitor } from '../utils/state/StateSynchronizationMonitor';
import { drawingStateManager } from '../utils/state/DrawingStateManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  enableStateCleanup?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  errorCount: number;
  lastErrorTime: number;
  recoveryAttempts: number;
}

class KonvaErrorBoundary extends Component<Props, State> {
  private readonly maxErrorsPerMinute = 5;
  private readonly maxRecoveryAttempts = 3;
  private recoveryTimeout: NodeJS.Timeout | null = null;

  public override state: State = {
    hasError: false,
    error: null,
    errorCount: 0,
    lastErrorTime: 0,
    recoveryAttempts: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorCount: 1,
      lastErrorTime: Date.now(),
    };
  }
  
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const currentTime = Date.now();
    const timeSinceLastError = currentTime - this.state.lastErrorTime;
    
    // Enhanced error logging with context
    logger.error('Enhanced Konva Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount,
      timeSinceLastError,
    });

    // Call optional error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in error handler:', handlerError);
      }
    }

    // State cleanup if enabled
    if (this.props.enableStateCleanup) {
      this.performStateCleanup(error, errorInfo);
    }

    // Check error frequency to prevent cascade failures
    if (timeSinceLastError < 60000) { // Within last minute
      const newErrorCount = this.state.errorCount + 1;
      this.setState({ 
        errorCount: newErrorCount,
        lastErrorTime: currentTime,
      });

      if (newErrorCount >= this.maxErrorsPerMinute) {
        logger.error('Error cascade detected, disabling recovery attempts');
        this.setState({ recoveryAttempts: this.maxRecoveryAttempts });
        return;
      }
    } else {
      // Reset error count if it's been more than a minute
      this.setState({ 
        errorCount: 1,
        lastErrorTime: currentTime,
      });
    }

    // Enhanced error classification and handling
    this.classifyAndHandleError(error, errorInfo);

    // Attempt automatic recovery if enabled
    if (this.props.enableRecovery && this.state.recoveryAttempts < this.maxRecoveryAttempts) {
      this.attemptRecovery(error);
    }
  }

  /**
   * Classify error and apply specific handling strategies
   */
  private classifyAndHandleError(error: Error, errorInfo: ErrorInfo): void {
    const errorMessage = error.message.toLowerCase();
    const componentStack = errorInfo.componentStack || '';

    // React 19 portal detection - more comprehensive
    const isPortalOperation = error.stack?.includes('createPortal') || 
                             error.stack?.includes('Html') ||
                             error.stack?.includes('React19CompatiblePortal') ||
                             componentStack.includes('Html') ||
                             componentStack.includes('React19CompatiblePortal') ||
                             errorMessage.includes('_portals');
    
    // React 19 specific reconciler errors
    const isReact19ReconcilerError = errorMessage.includes('parentinstance.add is not a function') ||
                                   errorMessage.includes('cannot read properties of undefined (reading \'add\')') ||
                                   errorMessage.includes('stage.add') ||
                                   errorMessage.includes('you may only add layers to the stage');

    // Known DOM-related errors
    const isKnownDOMError = errorMessage.includes('konva has no node with the type') && 
                           (errorMessage.includes('div') || 
                            errorMessage.includes('textarea') || 
                            errorMessage.includes('input') ||
                            errorMessage.includes('span') ||
                            errorMessage.includes('button'));

    // Network or resource errors
    const isResourceError = errorMessage.includes('failed to load') ||
                           errorMessage.includes('network error') ||
                           errorMessage.includes('fetch');

    // State-related errors
    const isStateError = errorMessage.includes('cannot read properties') ||
                        errorMessage.includes('undefined') ||
                        errorMessage.includes('null');

    if (isPortalOperation) {
      logger.log('🌐 Portal operation error detected, allowing normal flow');
      // Don't block portal operations, reset error state
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 0);
      return;
    }
    
    if (isReact19ReconcilerError) {
      logger.warn('🔧 React 19 + Konva reconciler error detected:', error.message);
      this.handleReconcilerError();
    } else if (isKnownDOMError) {
      logger.warn('🔧 Known DOM compatibility error detected:', error.message);
      this.handleDOMError();
    } else if (isResourceError) {
      logger.warn('📡 Resource loading error detected:', error.message);
      this.handleResourceError();
    } else if (isStateError) {
      logger.warn('📊 State-related error detected:', error.message);
      this.handleStateError();
    } else {
      logger.error('❓ Unknown error type detected:', error.message);
      this.handleUnknownError();
    }
  }

  /**
   * Handle React 19 reconciler errors
   */
  private handleReconcilerError(): void {
    logger.log('Handling React 19 reconciler error with delayed recovery');
    
    // Delay recovery to allow React to finish its work
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
    
    this.recoveryTimeout = setTimeout(() => {
      if (this.state.hasError) {
        logger.log('Attempting recovery from reconciler error');
        this.setState({ 
          hasError: false, 
          error: null,
          recoveryAttempts: this.state.recoveryAttempts + 1,
        });
      }
    }, 100);
  }

  /**
   * Handle known DOM errors
   */
  private handleDOMError(): void {
    logger.log('Handling DOM compatibility error');
    
    // These are usually non-critical, reset immediately
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 50);
  }

  /**
   * Handle resource loading errors
   */
  private handleResourceError(): void {
    logger.log('Handling resource loading error');
    
    // Wait a bit longer for resource errors
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 1000);
  }

  /**
   * Handle state-related errors
   */
  private handleStateError(): void {
    logger.log('Handling state-related error with cleanup');
    
    // Perform state cleanup before recovery
    this.performStateCleanup(this.state.error!, { componentStack: 'State error' });
    
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 200);
  }

  /**
   * Handle unknown errors with caution
   */
  private handleUnknownError(): void {
    logger.warn('Handling unknown error type with extended recovery time');
    
    // Be more cautious with unknown errors
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 2000);
  }

  /**
   * Perform comprehensive state cleanup
   */
  private performStateCleanup(error: Error, errorInfo: ErrorInfo): void {
    try {
      logger.log('Performing state cleanup after error');

      // Cancel any ongoing drawing operations
      drawingStateManager.cancelCurrentOperation();

      // Trigger state recovery in the monitor
      stateSynchronizationMonitor.triggerStateRecovery();

      // Clear any stuck UI states
      // Note: This would need to integrate with actual store methods
      // canvasStore.getState().setSelectedTool('select');
      // canvasStore.getState().clearSelection();

      logger.log('State cleanup completed');
    } catch (cleanupError) {
      logger.error('Error during state cleanup:', cleanupError);
    }
  }

  /**
   * Attempt automatic error recovery
   */
  private attemptRecovery(error: Error): void {
    const recoveryDelay = Math.min(1000 * Math.pow(2, this.state.recoveryAttempts), 10000);
    
    logger.log(`Attempting recovery in ${recoveryDelay}ms (attempt ${this.state.recoveryAttempts + 1})`);

    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }

    this.recoveryTimeout = setTimeout(() => {
      logger.log('Executing recovery attempt');
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        recoveryAttempts: prevState.recoveryAttempts + 1,
      }));
    }, recoveryDelay);
  }

  /**
   * Manual recovery trigger (could be called by a "Retry" button)
   */
  public triggerManualRecovery = (): void => {
    logger.log('Manual recovery triggered');
    
    // Perform cleanup
    this.performStateCleanup(this.state.error!, { componentStack: 'Manual recovery' });
    
    // Reset state
    this.setState({
      hasError: false,
      error: null,
      recoveryAttempts: 0,
      errorCount: 0,
    });
  };

  public override componentWillUnmount(): void {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }

  public override render() {
    if (this.state.hasError) {
      // Show enhanced fallback UI if provided, otherwise minimal fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced default fallback with recovery options
      return (
        <div className="canvas-error-fallback" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#dc3545' }}>
            ⚠️ Canvas Error
          </div>
          <div style={{ marginBottom: '1rem', textAlign: 'center', color: '#6c757d' }}>
            <p>The canvas encountered an error and is recovering...</p>
            {this.state.recoveryAttempts > 0 && (
              <p>Recovery attempts: {this.state.recoveryAttempts}/{this.maxRecoveryAttempts}</p>
            )}
          </div>
          
          {this.state.recoveryAttempts >= this.maxRecoveryAttempts && (
            <button
              onClick={this.triggerManualRecovery}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry Canvas
            </button>
          )}
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6c757d' }}>
              <summary>Error Details (Development)</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );    }

    return this.props.children;
  }
}

export default KonvaErrorBoundary;

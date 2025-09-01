import React, { ErrorInfo, ReactNode } from 'react';
import { Group, Rect, Text } from 'react-konva';
// Inline logger to avoid circular dependencies
const logger = {
  debug: (...args: any[]) => console.debug(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  log: (...args: any[]) => console.log(...args),
};
import { stateSynchronizationMonitor } from '../../utils/state/StateSynchronizationMonitor';
import { drawingStateManager } from '../../utils/state/DrawingStateManager';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  enableStateCleanup?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorCount: number;
  lastErrorTime: number;
  recoveryAttempts: number;
}

export class KonvaElementBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxErrorsPerMinute = 5;
  private readonly maxRecoveryAttempts = 3;
  private recoveryTimeout: NodeJS.Timeout | null = null;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorCount: 0,
    lastErrorTime: 0,
    recoveryAttempts: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorCount: 1,
      lastErrorTime: Date.now(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const currentTime = Date.now();
    const timeSinceLastError = currentTime - this.state.lastErrorTime;

    logger.error('KonvaElementBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount,
      timeSinceLastError,
    });

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in error handler:', handlerError);
      }
    }

    if (this.props.enableStateCleanup) {
      this.performStateCleanup(error, errorInfo);
    }

    if (timeSinceLastError < 60000) {
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
      this.setState({
        errorCount: 1,
        lastErrorTime: currentTime,
      });
    }

    this.classifyAndHandleError(error, errorInfo);

    if (this.props.enableRecovery && this.state.recoveryAttempts < this.maxRecoveryAttempts) {
      this.attemptRecovery(error);
    }
  }

  private classifyAndHandleError(error: Error, errorInfo: ErrorInfo): void {
    const errorMessage = error.message.toLowerCase();
    const componentStack = errorInfo.componentStack || '';

    const isPortalOperation =
      error.stack?.includes('createPortal') ||
      error.stack?.includes('Html') ||
      error.stack?.includes('React19CompatiblePortal') ||
      componentStack.includes('Html') ||
      componentStack.includes('React19CompatiblePortal') ||
      errorMessage.includes('_portals');

    const isReact19ReconcilerError =
      errorMessage.includes('parentinstance.add is not a function') ||
      errorMessage.includes("cannot read properties of undefined (reading 'add')") ||
      errorMessage.includes('stage.add') ||
      errorMessage.includes('you may only add layers to the stage');

    const isKnownDOMError =
      errorMessage.includes('konva has no node with the type') &&
      (errorMessage.includes('div') ||
        errorMessage.includes('textarea') ||
        errorMessage.includes('input') ||
        errorMessage.includes('span') ||
        errorMessage.includes('button'));

    const isResourceError =
      errorMessage.includes('failed to load') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('fetch');

    const isStateError =
      errorMessage.includes('cannot read properties') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('null');

    if (isPortalOperation) {
      logger.log('🌐 Portal operation error detected, allowing normal flow');
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

  private handleReconcilerError(): void {
    logger.log('Handling React 19 reconciler error with delayed recovery');

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

  private handleDOMError(): void {
    logger.log('Handling DOM compatibility error');

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 50);
  }

  private handleResourceError(): void {
    logger.log('Handling resource loading error');

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 1000);
  }

  private handleStateError(): void {
    logger.log('Handling state-related error with cleanup');

    this.performStateCleanup(this.state.error!, { componentStack: 'State error' });

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 200);
  }

  private handleUnknownError(): void {
    logger.warn('Handling unknown error type with extended recovery time');

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      });
    }, 2000);
  }

  private performStateCleanup(error: Error, errorInfo: ErrorInfo): void {
    try {
      logger.log('Performing state cleanup after error');

      drawingStateManager.cancelCurrentOperation();

      stateSynchronizationMonitor.triggerStateRecovery();

      logger.log('State cleanup completed');
    } catch (cleanupError) {
      logger.error('Error during state cleanup:', cleanupError);
    }
  }

  private attemptRecovery(error: Error): void {
    const recoveryDelay = Math.min(1000 * Math.pow(2, this.state.recoveryAttempts), 10000);

    logger.log(`Attempting recovery in ${recoveryDelay}ms (attempt ${this.state.recoveryAttempts + 1})`);

    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }

    this.recoveryTimeout = setTimeout(() => {
      logger.log('Executing recovery attempt');

      this.setState((prevState) => ({
        hasError: false,
        error: null,
        recoveryAttempts: prevState.recoveryAttempts + 1,
      }));
    }, recoveryDelay);
  }

  public triggerManualRecovery = (): void => {
    logger.log('Manual recovery triggered');

    this.performStateCleanup(this.state.error!, { componentStack: 'Manual recovery' });

    this.setState({
      hasError: false,
      error: null,
      recoveryAttempts: 0,
      errorCount: 0,
    });
  };

  public componentWillUnmount(): void {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Konva-compatible error fallback using Konva components instead of HTML
      return (
        <Group>
          <Rect
            x={0}
            y={0}
            width={200}
            height={100}
            fill="#f8f9fa"
            stroke="#dee2e6"
            strokeWidth={1}
            cornerRadius={8}
          />
          <Text
            x={100}
            y={30}
            text="⚠️ Canvas Error"
            fontSize={16}
            fontFamily="Arial"
            fill="#dc3545"
            align="center"
            width={200}
            offsetX={100}
          />
          <Text
            x={100}
            y={50}
            text="Element error - recovering..."
            fontSize={12}
            fontFamily="Arial"
            fill="#6c757d"
            align="center"
            width={200}
            offsetX={100}
          />
          {this.state.recoveryAttempts > 0 && (
            <Text
              x={100}
              y={70}
              text={`Recovery: ${this.state.recoveryAttempts}/${this.maxRecoveryAttempts}`}
              fontSize={10}
              fontFamily="Arial"
              fill="#6c757d"
              align="center"
              width={200}
              offsetX={100}
            />
          )}
        </Group>
      );
    }

    return this.props.children;
  }
}
// Archived (2025-09-01): Legacy react-konva element boundary.

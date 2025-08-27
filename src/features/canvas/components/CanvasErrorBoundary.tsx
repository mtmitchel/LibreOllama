import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Group, Rect, Text } from 'react-konva';
import { canvasLog } from '../utils/canvasLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  renderCount: number;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  private renderTimer: NodeJS.Timeout | null = null;
  private lastErrorTime: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      renderCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is likely an infinite loop error
    const isInfiniteLoopError = 
      error.message.includes('Maximum update depth exceeded') ||
      error.message.includes('setState') ||
      error.message.includes('infinite');

    return {
      hasError: true,
      error,
      renderCount: isInfiniteLoopError ? 999 : 1
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;

    // If errors are happening too frequently, it's likely an infinite loop
    if (timeSinceLastError < 1000) {
      console.error('🚨 [CanvasErrorBoundary] Rapid successive errors detected - likely infinite loop!', {
        error: error.message,
        timeSinceLastError,
        componentStack: errorInfo.componentStack
      });
      
      // Force a longer recovery period for infinite loops
      this.setState({ renderCount: this.state.renderCount + 10 });
    }

    this.lastErrorTime = now;
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log the error details
    console.error('🛑 [CanvasErrorBoundary] Canvas error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      renderCount: this.state.renderCount
    });

    // Auto-recovery after a delay
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }

    const recoveryDelay = Math.min(5000, this.state.renderCount * 500); // Max 5 seconds
    this.renderTimer = setTimeout(() => {
              canvasLog.log('🔄 [CanvasErrorBoundary] Attempting auto-recovery...');
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        renderCount: 0
      });
    }, recoveryDelay);
  }

  componentWillUnmount() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided (must be Konva-compatible)
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // For Konva contexts, render simple Konva error display
      // For DOM contexts, use portal to render outside canvas tree
      const isKonvaContext = this.isInKonvaContext();
      
      if (isKonvaContext) {
        // Simple Konva-only error display
        return (
          <Group>
            <Rect
              x={0}
              y={0}
              width={300}
              height={120}
              fill="rgba(255, 182, 193, 0.9)"
              stroke="#ff6b6b"
              strokeWidth={2}
              cornerRadius={8}
            />
            <Text
              x={10}
              y={10}
              text="🛑 Canvas Error"
              fontSize={16}
              fontFamily="Arial"
              fill="#d63031"
              fontStyle="bold"
            />
            <Text
              x={10}
              y={35}
              text={`Error: ${this.state.error?.message?.substring(0, 50) || 'Unknown error'}...`}
              fontSize={12}
              fontFamily="Arial"
              fill="#d63031"
              width={280}
            />
            <Text
              x={10}
              y={60}
              text={`Render Count: ${this.state.renderCount}`}
              fontSize={12}
              fontFamily="Arial"
              fill="#d63031"
            />
            <Text
              x={10}
              y={85}
              text="Auto-recovering..."
              fontSize={12}
              fontFamily="Arial"
              fill="#e17055"
              fontStyle="italic"
            />
          </Group>
        );
      } else {
        // Render DOM error UI using portal to avoid Konva tree issues
        return createPortal(
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            padding: '20px',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe6e6',
            color: '#d63031',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#d63031' }}>
              🛑 Canvas Error Boundary
            </h3>
            <p><strong>Error:</strong> {this.state.error?.message}</p>
            <p><strong>Render Count:</strong> {this.state.renderCount}</p>
            {this.state.renderCount > 5 && (
              <p style={{ color: '#e17055', fontWeight: 'bold' }}>
                ⚠️ Possible infinite loop detected - implementing longer recovery delay
              </p>
            )}
            <button
              onClick={() => this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                renderCount: 0
              })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fd79a8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '10px'
              }}
            >
              🔄 Manual Recovery
            </button>
          </div>,
          document.body
        );
      }
    }

    return this.props.children;
  }

  // Simple heuristic to detect if we're in a Konva rendering context
  private isInKonvaContext(): boolean {
    // Check if any parent component is likely a Konva component
    // This is a basic heuristic - in practice you might want more sophisticated detection
    const componentStack = this.state.errorInfo?.componentStack || '';
    return componentStack.includes('Stage') || 
           componentStack.includes('Layer') || 
           componentStack.includes('Group') ||
           componentStack.includes('Shape');
  }
}

export default CanvasErrorBoundary; 
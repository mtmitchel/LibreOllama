import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class KonvaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Konva Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is the specific Konva error we're trying to handle
    if (error.message.includes('konva has no node with the type') || 
        error.message.includes('parentInstance.add is not a function')) {
      console.warn('🔧 Konva rendering error caught and handled:', error.message);
      
      // Check if this is a portal-related error during text editing
      if (error.message.includes('div') || error.message.includes('textarea') || 
          error.message.includes('input') || error.stack?.includes('Portal')) {
        console.warn('🌐 Portal rendering issue detected - this is expected for DOM overlays');
        
        // FIXED: Don't auto-recover during legitimate text editing sessions
        // Only recover if it's truly an error and not a portal operation
        if (error.stack?.includes('ReactKonvaHostConfig') && 
            !error.stack?.includes('createPortal')) {
          // This is a legitimate React-Konva reconciler error, allow recovery
          setTimeout(() => {
            this.setState({ hasError: false, error: undefined });
          }, 100);
        } else {
          // This is likely a portal-related operation, don't interfere
          console.log('🌐 Portal operation detected, not interfering with error recovery');
          // Reset immediately to allow portal to work normally
          this.setState({ hasError: false, error: undefined });
        }
      } else {
        // Non-portal Konva error, allow recovery
        setTimeout(() => {
          this.setState({ hasError: false, error: undefined });
        }, 100);
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      // Return fallback UI or null to prevent rendering issues
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default KonvaErrorBoundary;

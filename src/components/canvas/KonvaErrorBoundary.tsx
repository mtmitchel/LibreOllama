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
    
    // React 19 portal detection - more comprehensive
    const isPortalOperation = error.stack?.includes('createPortal') || 
                             error.stack?.includes('Html') ||
                             error.stack?.includes('React19CompatiblePortal') ||
                             errorInfo.componentStack?.includes('Html') ||
                             errorInfo.componentStack?.includes('React19CompatiblePortal') ||
                             error.message.includes('_portals');
    
    // React 19 specific reconciler errors
    const isReact19ReconcilerError = error.message.includes('parentInstance.add is not a function') ||
                                   error.message.includes('Cannot read properties of undefined (reading \'add\')') ||
                                   error.message.includes('stage.add') ||
                                   error.message.includes('You may only add layers to the stage');
    
    const isKnownDOMError = error.message.includes('konva has no node with the type') && 
                           (error.message.includes('div') || 
                            error.message.includes('textarea') || 
                            error.message.includes('input') ||
                            error.message.includes('span') ||
                            error.message.includes('button'));
    
    if (isPortalOperation) {
      // This is a legitimate portal operation, don't interfere
      console.log('🌐 Portal operation detected, allowing normal flow');
      // Reset error state for portal operations to prevent error boundary activation
      this.setState({ hasError: false, error: undefined });
      return;
    }
    
    if (isKnownDOMError || isReact19ReconcilerError) {
      console.warn('🔧 React 19 + Konva reconciler error caught and handled:', error.message);
      
      // Only attempt recovery for actual React-Konva reconciler errors that aren't portals
      if ((error.stack?.includes('ReactKonvaHostConfig') || isReact19ReconcilerError) && !isPortalOperation) {
        // Delay recovery to allow React to finish its work
        setTimeout(() => {
          if (this.state.hasError) {
            this.setState({ hasError: false, error: undefined });
          }
        }, 100);
      } else {
        // Reset immediately for other types of errors
        this.setState({ hasError: false, error: undefined });
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

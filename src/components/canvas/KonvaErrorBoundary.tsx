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
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Konva Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is the specific Konva error we're trying to handle
    if (error.message.includes('konva has no node with the type') || 
        error.message.includes('parentInstance.add is not a function')) {
      console.warn('🔧 Konva rendering error caught and handled:', error.message);
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

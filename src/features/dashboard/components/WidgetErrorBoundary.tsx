import React from 'react';
import { Card, ErrorState } from "../../../components/ui";

interface Props {
  children: React.ReactNode;
  widgetName?: string;
  fallback?: string | React.ReactNode;  // Add missing fallback prop
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      // Use fallback prop if provided, otherwise default error state
      if (this.props.fallback) {
        return typeof this.props.fallback === 'string' ? (
          <Card className="border-error/20 p-4">
            <div className="text-center text-error">
              {this.props.fallback}
            </div>
          </Card>
        ) : (
          this.props.fallback
        );
      }
      
      return (
        <Card className="border-error/20">
          <ErrorState
            title={`${this.props.widgetName || 'Widget'} Error`}
            message={`The ${this.props.widgetName || 'widget'} encountered an error and couldn't load properly.`}
            onRetry={this.handleRetry}
            retryText="Retry"
            size="sm"
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

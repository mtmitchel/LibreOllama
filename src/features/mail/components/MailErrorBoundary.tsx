import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { Card, Button, Text, Heading } from '../../../components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MailErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mail component error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-error/20 bg-error/5" padding="lg">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="bg-error/10 flex size-12 items-center justify-center rounded-full">
              <AlertTriangle className="size-6 text-error" />
            </div>
            
            <div className="space-y-2">
              <Heading level={3} className="text-error">
                Mail component error
              </Heading>
              <Text variant="secondary" size="sm">
                Something went wrong while loading your email. This might be a temporary issue.
              </Text>
            </div>

            {this.state.error && (
              <div className="bg-muted w-full rounded-md p-3">
                <Text variant="tertiary" size="xs" className="break-all font-mono">
                  {this.state.error.message}
                </Text>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <Mail className="size-4" />
                Reload mail
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
} 
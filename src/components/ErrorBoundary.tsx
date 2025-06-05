import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred in the application. This might be due to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Tauri commands not being available (running in browser instead of Tauri)</li>
                <li>• Missing dependencies or configuration issues</li>
                <li>• Network connectivity problems</li>
                <li>• Temporary application state issues</li>
              </ul>

              {this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details
                  </summary>
                  <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-32">
                    <p className="text-destructive font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Reload Application
                </Button>
              </div>

              <div className="pt-4 border-t text-xs text-muted-foreground">
                <p>
                  <strong>Note:</strong> If you're running this in a web browser, 
                  Tauri commands won't be available. Please run with{' '}
                  <code className="bg-muted px-1 rounded">npm run tauri dev</code> for full functionality.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
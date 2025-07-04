import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../../../components/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-error/20">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-error mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Widget Error
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {this.props.widgetName ? `The ${this.props.widgetName} widget` : 'This widget'} encountered an error.
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent-secondary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

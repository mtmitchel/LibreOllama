import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, ErrorState } from "../../../components/ui";

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
        <Card className="border-[var(--error)]/20">
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

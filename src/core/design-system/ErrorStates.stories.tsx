import type { Meta, Story } from '@ladle/react';
import { useState } from 'react';
import { Alert, Toast, ErrorState, EmptyState, StatusBadge, Card, Button } from '../../components/ui';

const meta: Meta = {
  title: 'Design System/Error & Alert States',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Alert Component Stories
export const AlertVariants: Story = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Alert Variants</h2>
      <div className="space-y-3">
        <Alert variant="info" title="Information">
          This is an informational alert. Everything is working as expected.
        </Alert>
        <Alert variant="success" title="Success">
          Your operation completed successfully!
        </Alert>
        <Alert variant="warning" title="Warning">
          Please review your settings before proceeding.
        </Alert>
        <Alert variant="error" title="Error">
          Something went wrong. Please try again.
        </Alert>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dismissible Alerts</h2>
      <div className="space-y-3">
        <Alert 
          variant="warning" 
          title="Dismissible Alert"
          dismissible={true}
          onDismiss={() => console.log('Alert dismissed')}
        >
          This alert can be dismissed by clicking the X button.
        </Alert>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Alert Without Title</h2>
      <div className="space-y-3">
        <Alert variant="info">
          This is an alert without a title.
        </Alert>
      </div>
    </div>
  </div>
);

// Toast Component Stories
export const ToastDemo: Story = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; variant: 'info' | 'success' | 'warning' | 'error'; title?: string; message: string }>>([]);

  const showToast = (variant: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, variant, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Toast Notifications</h2>
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={() => showToast('info', 'Info', 'This is an informational message')}
            variant="secondary"
          >
            Show Info Toast
          </Button>
          <Button 
            onClick={() => showToast('success', 'Success', 'Operation completed successfully!')}
            variant="secondary"
          >
            Show Success Toast
          </Button>
          <Button 
            onClick={() => showToast('warning', 'Warning', 'Please check your input')}
            variant="secondary"
          >
            Show Warning Toast
          </Button>
          <Button 
            onClick={() => showToast('error', 'Error', 'Something went wrong')}
            variant="secondary"
          >
            Show Error Toast
          </Button>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

// Error State Stories
export const ErrorStateDemo: Story = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error State Sizes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 min-h-[200px]">
          <ErrorState 
            size="sm" 
            title="Small Error"
            message="A compact error state for smaller UI areas."
            onRetry={() => console.log('Retry clicked')}
          />
        </Card>
        <Card className="p-4 min-h-[250px]">
          <ErrorState 
            size="md" 
            title="Medium Error"
            message="A medium-sized error state for general use cases."
            onRetry={() => console.log('Retry clicked')}
          />
        </Card>
        <Card className="p-4 min-h-[300px]">
          <ErrorState 
            size="lg" 
            title="Large Error"
            message="A large error state for prominent error displays."
            onRetry={() => console.log('Retry clicked')}
          />
        </Card>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error Without Retry</h2>
      <Card className="p-6">
        <ErrorState 
          title="Connection Failed"
          message="Unable to connect to the server. Please check your internet connection."
        />
      </Card>
    </div>
  </div>
);

// Empty State Stories  
export const EmptyStateDemo: Story = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Empty State Variations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 min-h-[250px]">
          <EmptyState 
            title="No Messages"
            message="You don't have any messages yet. Start a conversation!"
            action={{
              label: "Compose Message",
              onClick: () => console.log('Compose clicked')
            }}
            icon="✉️"
          />
        </Card>
        <Card className="p-6 min-h-[250px]">
          <EmptyState 
            title="No Projects"
            message="Create your first project to get started."
            action={{
              label: "Create Project",
              onClick: () => console.log('Create clicked')
            }}
            icon="📁"
          />
        </Card>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Empty State Sizes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <EmptyState 
            size="sm"
            title="Small"
            message="Compact empty state"
            icon="📭"
          />
        </Card>
        <Card className="p-4">
          <EmptyState 
            size="md"
            title="Medium"
            message="Standard empty state"
            icon="📭"
          />
        </Card>
        <Card className="p-4">
          <EmptyState 
            size="lg"
            title="Large"
            message="Prominent empty state"
            icon="📭"
          />
        </Card>
      </div>
    </div>
  </div>
);

// Status Badge Stories
export const StatusBadgeDemo: Story = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Status Badge Variants</h2>
      <div className="flex flex-wrap gap-4">
        <StatusBadge status="success">Active</StatusBadge>
        <StatusBadge status="warning">Warning</StatusBadge>
        <StatusBadge status="error">Error</StatusBadge>
        <StatusBadge status="info">Info</StatusBadge>
        <StatusBadge status="pending">Pending</StatusBadge>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Status Badge Sizes</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <StatusBadge status="success" size="sm">Small</StatusBadge>
          <StatusBadge status="success" size="md">Medium</StatusBadge>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status="warning" size="sm">Small</StatusBadge>
          <StatusBadge status="warning" size="md">Medium</StatusBadge>
        </div>
      </div>
    </div>
  </div>
);

// Real-world examples
export const RealWorldExamples: Story = () => {
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');

  const simulateLoading = () => {
    setLoadingState('loading');
    setTimeout(() => {
      const outcomes = ['error', 'empty', 'idle'];
      setLoadingState(outcomes[Math.floor(Math.random() * outcomes.length)] as any);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Email Interface Example</h2>
        <div className="flex gap-3 mb-4">
          <Button onClick={() => setLoadingState('idle')} variant="secondary">
            Show Data
          </Button>
          <Button onClick={() => setLoadingState('empty')} variant="secondary">
            Show Empty
          </Button>
          <Button onClick={() => setLoadingState('error')} variant="secondary">
            Show Error
          </Button>
          <Button onClick={simulateLoading} variant="secondary">
            Simulate Loading
          </Button>
        </div>
        
        <Card className="min-h-[400px] p-6">
          {loadingState === 'idle' && (
            <div className="space-y-4">
              <Alert variant="success" title="Connected">
                Successfully connected to your email account.
              </Alert>
              <div className="space-y-2">
                <div className="p-3 border border-[var(--border-default)] rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Welcome to LibreOllama</span>
                    <StatusBadge status="success">Delivered</StatusBadge>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">admin@example.com</span>
                </div>
                <div className="p-3 border border-[var(--border-default)] rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Project Update</span>
                    <StatusBadge status="info">Read</StatusBadge>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">team@example.com</span>
                </div>
              </div>
            </div>
          )}
          
          {loadingState === 'empty' && (
            <EmptyState 
              title="No Emails"
              message="Your inbox is empty. New messages will appear here."
              action={{
                label: "Refresh Inbox",
                onClick: () => setLoadingState('idle')
              }}
              icon="📫"
            />
          )}
          
          {loadingState === 'error' && (
            <ErrorState 
              title="Failed to Load Emails"
              message="Unable to fetch your emails. Please check your connection and try again."
              onRetry={() => simulateLoading()}
              retryText="Try Again"
            />
          )}
          
          {loadingState === 'loading' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-[var(--text-secondary)]">Loading emails...</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// Accessibility features
export const AccessibilityFeatures: Story = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Accessibility Features</h2>
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Keyboard Navigation</h3>
          <Alert variant="info">
            All interactive elements support keyboard navigation. Use Tab to navigate and Enter/Space to activate.
          </Alert>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Screen Reader Support</h3>
          <Alert variant="success">
            Error states and alerts include proper ARIA labels and roles for screen reader compatibility.
          </Alert>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Color Contrast</h3>
          <Alert variant="warning">
            All text meets WCAG AA color contrast requirements for accessibility.
          </Alert>
        </Card>
      </div>
    </div>
  </div>
); 
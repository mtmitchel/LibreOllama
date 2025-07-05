import type { Meta, StoryObj } from '@ladle/react';
import { useState } from 'react';
import { Alert, Toast, ErrorState, EmptyState, StatusBadge, Card, Button } from '../../components/ui';

const meta: Meta = {
  title: 'Design System/Error States',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Alert Component Stories
export const AlertVariants: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Alert Variants</h2>
        <div className="space-y-4">
          <Alert variant="info" title="Information">
            This is an informational alert with some helpful details.
          </Alert>
          <Alert variant="success" title="Success">
            Your changes have been saved successfully.
          </Alert>
          <Alert variant="warning" title="Warning">
            Please review your settings before proceeding.
          </Alert>
          <Alert variant="error" title="Error">
            There was a problem processing your request.
          </Alert>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dismissible Alerts</h2>
        <div className="space-y-4">
          <Alert 
            variant="warning" 
            title="Dismissible Warning"
            dismissible
            onDismiss={() => console.log('Alert dismissed')}
          >
            This alert can be dismissed by clicking the X button.
          </Alert>
          <Alert 
            variant="error"
            dismissible
            onDismiss={() => console.log('Alert dismissed')}
          >
            This is a dismissible error alert without a title.
          </Alert>
        </div>
      </div>
    </div>
  ),
};

// Toast Component Stories
export const ToastDemo: StoryObj = {
  render: () => {
    const [toasts, setToasts] = useState<Array<{
      id: string;
      variant: 'info' | 'success' | 'warning' | 'error';
      title?: string;
      message: string;
    }>>([]);

    const addToast = (variant: 'info' | 'success' | 'warning' | 'error', title?: string) => {
      const messages = {
        info: 'This is an informational message.',
        success: 'Operation completed successfully!',
        warning: 'Please check your input.',
        error: 'Something went wrong. Please try again.'
      };

      const newToast = {
        id: Date.now().toString(),
        variant,
        title,
        message: messages[variant]
      };

      setToasts(prev => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Toast Notifications</h2>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => addToast('info', 'Info')}>Show Info Toast</Button>
            <Button onClick={() => addToast('success', 'Success')}>Show Success Toast</Button>
            <Button onClick={() => addToast('warning', 'Warning')}>Show Warning Toast</Button>
            <Button onClick={() => addToast('error', 'Error')}>Show Error Toast</Button>
          </div>
        </div>

        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              message={toast.message}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    );
  },
};

// Error State Component Stories
export const ErrorStateDemo: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error State Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <ErrorState
              size="sm"
              title="Small Error"
              message="This is a small error state."
              onRetry={() => console.log('Retry clicked')}
            />
          </Card>
          <Card className="p-4">
            <ErrorState
              size="md"
              title="Medium Error"
              message="This is a medium error state with more details."
              onRetry={() => console.log('Retry clicked')}
            />
          </Card>
          <Card className="p-4">
            <ErrorState
              size="lg"
              title="Large Error"
              message="This is a large error state for major failures."
              onRetry={() => console.log('Retry clicked')}
            />
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Custom Error Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <ErrorState
              title="Canvas Export Failed"
              message="Unable to export your canvas. Please check your connection and try again."
              onRetry={() => console.log('Retry export')}
              retryText="Try Export Again"
            />
          </Card>
          <Card className="p-4">
            <ErrorState
              title="Widget Load Error"
              message="The dashboard widget couldn't load. This might be due to a temporary issue."
              onRetry={() => console.log('Retry widget load')}
              retryText="Reload Widget"
            />
          </Card>
        </div>
      </div>
    </div>
  ),
};

// Empty State Component Stories
export const EmptyStateDemo: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Empty State Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <EmptyState
              title="No Projects"
              message="You haven't created any projects yet. Start by creating your first project."
              action={{
                label: 'Create Project',
                onClick: () => console.log('Create project clicked')
              }}
              icon="📁"
            />
          </Card>
          <Card className="p-4">
            <EmptyState
              title="No Messages"
              message="Your inbox is empty. New messages will appear here."
              icon="📬"
            />
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Different Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <EmptyState
              size="sm"
              title="Small Empty"
              message="No data available."
              icon="📊"
            />
          </Card>
          <Card className="p-4">
            <EmptyState
              size="md"
              title="Medium Empty"
              message="No content to display at this time."
              icon="📋"
            />
          </Card>
          <Card className="p-4">
            <EmptyState
              size="lg"
              title="Large Empty"
              message="This section is currently empty. Add some content to get started."
              icon="🎨"
            />
          </Card>
        </div>
      </div>
    </div>
  ),
};

// Status Badge Component Stories
export const StatusBadgeDemo: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Status Badge Variants</h2>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="success">Completed</StatusBadge>
          <StatusBadge status="warning">In Progress</StatusBadge>
          <StatusBadge status="error">Failed</StatusBadge>
          <StatusBadge status="info">Information</StatusBadge>
          <StatusBadge status="pending">Pending</StatusBadge>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Badge Sizes</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <StatusBadge status="success" size="sm">Small</StatusBadge>
          <StatusBadge status="warning" size="md">Medium</StatusBadge>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Project Priority Examples</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-20">High:</span>
            <StatusBadge status="error" size="sm">High</StatusBadge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-20">Medium:</span>
            <StatusBadge status="warning" size="sm">Medium</StatusBadge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-20">Low:</span>
            <StatusBadge status="success" size="sm">Low</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Real-world Usage Examples
export const RealWorldExamples: StoryObj = {
  render: () => {
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Form Validation</h2>
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md"
                  placeholder="Enter project name"
                />
              </div>
              <Alert variant="error" title="Validation Error">
                Project name is required and must be at least 3 characters long.
              </Alert>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard Widget Error</h2>
          <Card className="p-4">
            <ErrorState
              title="Widget Error"
              message="The analytics widget encountered an error and couldn't load properly."
              onRetry={() => {
                setShowError(false);
                setTimeout(() => setShowSuccess(true), 1000);
              }}
              retryText="Reload Widget"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Task List with Status</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {[
                { id: 1, title: 'Design mockups', status: 'success' as const },
                { id: 2, title: 'Implement API', status: 'warning' as const },
                { id: 3, title: 'Write tests', status: 'error' as const },
                { id: 4, title: 'Deploy to staging', status: 'pending' as const }
              ].map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="text-sm text-[var(--text-primary)]">{task.title}</span>
                  <StatusBadge status={task.status} size="sm">
                    {task.status === 'success' ? 'Done' : 
                     task.status === 'warning' ? 'In Progress' :
                     task.status === 'error' ? 'Failed' : 'Pending'}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Interactive Examples</h2>
          <Card className="p-4">
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowError(true)}
                variant="outline"
              >
                Trigger Error Toast
              </Button>
              <Button 
                onClick={() => setShowSuccess(true)}
                variant="outline"
              >
                Trigger Success Toast
              </Button>
            </div>
          </Card>
        </div>

        {/* Interactive Toasts */}
        {showError && (
          <Toast
            variant="error"
            title="Operation Failed"
            message="Unable to save changes. Please try again."
            onDismiss={() => setShowError(false)}
          />
        )}
        {showSuccess && (
          <Toast
            variant="success"
            title="Success"
            message="Changes saved successfully!"
            onDismiss={() => setShowSuccess(false)}
          />
        )}
      </div>
    );
  },
};

// Accessibility Features
export const AccessibilityFeatures: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Accessibility Features</h2>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">ARIA Labels</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              All error components include proper ARIA labels and roles for screen readers.
            </p>
            <Alert variant="error" title="Error with ARIA">
              This alert has role="alert" and aria-live="polite" attributes.
            </Alert>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Keyboard Navigation</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Interactive elements maintain focus states and keyboard accessibility.
            </p>
            <ErrorState
              title="Keyboard Accessible"
              message="The retry button can be focused and activated with keyboard."
              onRetry={() => console.log('Keyboard retry')}
            />
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Color Contrast</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              All error states meet WCAG AA contrast requirements.
            </p>
            <div className="flex gap-2">
              <StatusBadge status="error">High Contrast</StatusBadge>
              <StatusBadge status="warning">Good Contrast</StatusBadge>
              <StatusBadge status="success">Accessible</StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}; 
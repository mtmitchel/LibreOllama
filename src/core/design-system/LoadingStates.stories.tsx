import type { Meta, StoryObj } from '@ladle/react';
import { useState } from 'react';
import { Spinner, LoadingButton, LoadingState, Skeleton, Card, Button } from '../../components/ui';

const meta: Meta = {
  title: 'Design System/Loading States',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Spinner Component Stories
export const SpinnerVariants: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Spinner Sizes</h2>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-[var(--text-secondary)]">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-sm text-[var(--text-secondary)]">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm text-[var(--text-secondary)]">Large</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Spinner Colors</h2>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner color="primary" />
            <span className="text-sm text-[var(--text-secondary)]">Primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner color="secondary" />
            <span className="text-sm text-[var(--text-secondary)]">Secondary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner color="success" />
            <span className="text-sm text-[var(--text-secondary)]">Success</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner color="error" />
            <span className="text-sm text-[var(--text-secondary)]">Error</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner color="warning" />
            <span className="text-sm text-[var(--text-secondary)]">Warning</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Loading Button Stories
export const LoadingButtonDemo: StoryObj = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
    };

    const handleSecondaryClick = () => {
      setIsLoadingSecondary(true);
      setTimeout(() => setIsLoadingSecondary(false), 2000);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Loading Buttons</h2>
          <div className="flex gap-4">
            <LoadingButton
              isLoading={isLoading}
              onClick={handleClick}
              loadingText="Saving..."
            >
              Save Changes
            </LoadingButton>
            <LoadingButton
              isLoading={isLoadingSecondary}
              onClick={handleSecondaryClick}
              variant="secondary"
              loadingText="Processing..."
            >
              Process Data
            </LoadingButton>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Button Variants</h2>
          <div className="flex gap-4">
            <LoadingButton variant="primary" isLoading={true} loadingText="Loading...">
              Primary
            </LoadingButton>
            <LoadingButton variant="secondary" isLoading={true} loadingText="Loading...">
              Secondary
            </LoadingButton>
            <LoadingButton variant="ghost" isLoading={true} loadingText="Loading...">
              Ghost
            </LoadingButton>
            <LoadingButton variant="outline" isLoading={true} loadingText="Loading...">
              Outline
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  },
};

// Loading State Stories
export const LoadingStateDemo: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Loading State Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <LoadingState size="sm" text="Loading data..." />
          </Card>
          <Card className="p-4">
            <LoadingState size="md" text="Processing request..." />
          </Card>
          <Card className="p-4">
            <LoadingState size="lg" text="Generating report..." />
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Custom Loading Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <LoadingState text="Analyzing canvas elements..." />
          </Card>
          <Card className="p-4">
            <LoadingState text="Exporting to PDF..." />
          </Card>
        </div>
      </div>
    </div>
  ),
};

// Skeleton Component Stories
export const SkeletonDemo: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Skeleton Variants</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="text" width="200px" />
            <span className="text-sm text-[var(--text-secondary)]">Text</span>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" width="100px" height="40px" />
            <span className="text-sm text-[var(--text-secondary)]">Rectangular</span>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width="40px" height="40px" />
            <span className="text-sm text-[var(--text-secondary)]">Circular</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Content Card Skeleton</h2>
        <Card className="p-6 max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width="40px" height="40px" />
              <div className="flex-1">
                <Skeleton variant="text" width="120px" className="mb-2" />
                <Skeleton variant="text" width="80px" height="12px" />
              </div>
            </div>
            <Skeleton variant="rectangular" width="100%" height="120px" />
            <div className="space-y-2">
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="85%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">List Skeleton</h2>
        <Card className="p-4 max-w-md">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton variant="circular" width="32px" height="32px" />
                <div className="flex-1">
                  <Skeleton variant="text" width="75%" className="mb-1" />
                  <Skeleton variant="text" width="50%" height="12px" />
                </div>
                <Skeleton variant="text" width="40px" height="12px" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  ),
};

// Real-world Usage Examples
export const RealWorldExamples: StoryObj = {
  render: () => {
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleLoadData = () => {
      setIsLoadingData(true);
      setTimeout(() => setIsLoadingData(false), 4000);
    };

    const handleExport = () => {
      setIsExporting(true);
      setTimeout(() => setIsExporting(false), 3000);
    };

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Task Management</h2>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Spinner size="sm" color="primary" />
              <span className="text-sm text-[var(--text-secondary)]">In Progress</span>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-[var(--text-primary)]">Update API documentation</div>
              <div className="text-sm text-[var(--text-secondary)]">Assigned to: John Doe</div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Canvas Export</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]">Export as JPEG</span>
              <div className="flex items-center gap-2">
                {isExporting ? (
                  <>
                    <Spinner size="sm" color="success" />
                    <span className="text-sm text-[var(--text-secondary)]">Exporting...</span>
                  </>
                ) : (
                  <Button onClick={handleExport} size="sm">
                    Export
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Data Loading</h2>
          <Card className="p-4">
            {isLoadingData ? (
              <LoadingState text="Loading dashboard data..." />
            ) : (
              <div className="text-center">
                <p className="text-[var(--text-secondary)] mb-4">Dashboard data ready</p>
                <Button onClick={handleLoadData}>Refresh Data</Button>
              </div>
            )}
          </Card>
        </div>
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
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Screen Reader Support</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              All loading components include proper ARIA labels and screen reader announcements.
            </p>
            <div className="flex items-center gap-4">
              <Spinner size="md" />
              <span className="text-sm text-[var(--text-secondary)]">
                Announces "Loading" to screen readers
              </span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Reduced Motion</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Respects user's reduced motion preferences (would disable animations).
            </p>
            <div className="flex items-center gap-4">
              <Skeleton variant="text" width="200px" />
              <span className="text-sm text-[var(--text-secondary)]">
                Pulse animation respects prefers-reduced-motion
              </span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Keyboard Navigation</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Loading buttons maintain focus states and keyboard accessibility.
            </p>
            <LoadingButton isLoading={true} loadingText="Processing...">
              Accessible Button
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  ),
}; 
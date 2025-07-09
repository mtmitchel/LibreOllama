import type { Meta, Story } from '@ladle/react';
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
export const SpinnerVariants: Story = () => (
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
);

// Loading Button Stories
export const LoadingButtonDemo: Story = () => {
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
};

// Loading State Stories
export const LoadingStateDemo: Story = () => (
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
);

// Skeleton Component Stories
export const SkeletonDemo: Story = () => (
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
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Skeleton Animations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Pulse (Default)</h3>
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" animation="pulse" />
            <Skeleton variant="text" width="80%" animation="pulse" />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Wave</h3>
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" animation="wave" />
            <Skeleton variant="text" width="80%" animation="wave" />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">None</h3>
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" animation="none" />
            <Skeleton variant="text" width="80%" animation="none" />
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// Realistic Loading Demo
export const RealisticLoadingDemo: Story = () => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const handleLoadData = () => {
    setIsLoadingData(true);
    setShowSkeleton(true);
    setTimeout(() => {
      setIsLoadingData(false);
      setShowSkeleton(false);
    }, 3000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Realistic Loading Scenarios</h2>
        <div className="flex gap-4 mb-4">
          <LoadingButton 
            isLoading={isLoadingData}
            onClick={handleLoadData}
            loadingText="Loading..."
            variant="primary"
          >
            Load Dashboard Data
          </LoadingButton>
          <LoadingButton 
            isLoading={isExporting}
            onClick={handleExport}
            loadingText="Exporting..."
            variant="secondary"
          >
            Export Report
          </LoadingButton>
        </div>
        
        <Card className="p-6 min-h-[300px]">
          {showSkeleton ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circular" width="32px" height="32px" />
                <Skeleton variant="text" width="150px" />
              </div>
              <div className="space-y-3">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="70%" />
              </div>
              <Skeleton variant="rectangular" width="100%" height="120px" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm">
                  ✓
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">Dashboard Loaded</h3>
              </div>
              <p className="text-[var(--text-secondary)]">Your dashboard data has been successfully loaded.</p>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-primary)]">Sample dashboard content would appear here...</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// Accessibility Features
export const AccessibilityFeatures: Story = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Loading State Accessibility</h2>
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">ARIA Live Regions</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Loading states use aria-live="polite" to announce changes to screen readers.
          </p>
          <LoadingState text="Processing your request..." />
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Loading Button Labels</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Buttons clearly indicate loading state with descriptive text.
          </p>
          <LoadingButton isLoading={true} loadingText="Saving your changes...">
            Save
          </LoadingButton>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Focus Management</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Interactive elements maintain proper focus states during loading.
          </p>
        </Card>
      </div>
    </div>
  </div>
); 
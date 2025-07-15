import type { Story } from '@ladle/react';
import React, { useState, useEffect } from 'react';
import { ProgressRing } from './ProgressRing';

export const ProgressRings: Story = () => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress((prev) => (prev >= 100 ? 0 : prev + 5));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Progress values</h2>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing value={25} />
            <p className="mt-2 text-sm text-secondary">25%</p>
          </div>
          <div className="text-center">
            <ProgressRing value={50} />
            <p className="mt-2 text-sm text-secondary">50%</p>
          </div>
          <div className="text-center">
            <ProgressRing value={75} />
            <p className="mt-2 text-sm text-secondary">75%</p>
          </div>
          <div className="text-center">
            <ProgressRing value={100} />
            <p className="mt-2 text-sm text-secondary">100%</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Color variants</h2>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing value={60} variant="primary" />
            <p className="mt-2 text-sm text-secondary">Primary</p>
          </div>
          <div className="text-center">
            <ProgressRing value={60} variant="success" />
            <p className="mt-2 text-sm text-secondary">Success</p>
          </div>
          <div className="text-center">
            <ProgressRing value={60} variant="warning" />
            <p className="mt-2 text-sm text-secondary">Warning</p>
          </div>
          <div className="text-center">
            <ProgressRing value={60} variant="error" />
            <p className="mt-2 text-sm text-secondary">Error</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Sizes</h2>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing value={70} size="sm" />
            <p className="mt-2 text-sm text-secondary">Small</p>
          </div>
          <div className="text-center">
            <ProgressRing value={70} size="md" />
            <p className="mt-2 text-sm text-secondary">Medium</p>
          </div>
          <div className="text-center">
            <ProgressRing value={70} size="lg" />
            <p className="mt-2 text-sm text-secondary">Large</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">With labels</h2>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing value={35} showValue />
            <p className="mt-2 text-sm text-secondary">Show percentage</p>
          </div>
          <div className="text-center">
            <ProgressRing value={42} showValue>
              42/100
            </ProgressRing>
            <p className="mt-2 text-sm text-secondary">Custom label</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">States</h2>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing value={0} />
            <p className="mt-2 text-sm text-secondary">Empty</p>
          </div>
          <div className="text-center">
            <ProgressRing value={100} />
            <p className="mt-2 text-sm text-secondary">Complete</p>
          </div>
          <div className="text-center">
            <ProgressRing value={animatedProgress} variant="primary" showValue />
            <p className="mt-2 text-sm text-secondary">Animated</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-3 font-medium text-primary">Download progress</h3>
            <div className="flex items-center gap-4">
              <ProgressRing value={78} variant="primary" size="sm" showValue />
              <div>
                <p className="text-sm font-medium text-primary">Downloading...</p>
                <p className="text-xs text-secondary">3.2 MB of 4.1 MB</p>
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-3 font-medium text-primary">Task completion</h3>
            <div className="flex items-center gap-4">
              <ProgressRing value={90} variant="success" size="sm" showValue />
              <div>
                <p className="text-sm font-medium text-primary">Almost done!</p>
                <p className="text-xs text-secondary">9 of 10 tasks completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProgressRings.meta = {
  title: 'Design System/Components/ProgressRing',
}; 
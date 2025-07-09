import React from 'react';
import { Card } from '../../../components/ui';

export const TaskColumnSkeleton = React.memo(() => {
  return (
    <Card className="flex flex-col h-full min-h-[600px] bg-[var(--bg-tertiary)] w-full">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-border-default bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)]">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-[var(--bg-secondary)] rounded animate-pulse w-24"></div>
          <div className="flex items-center gap-3">
            <div className="h-5 bg-[var(--bg-secondary)] rounded animate-pulse w-6"></div>
            <div className="h-5 bg-[var(--bg-secondary)] rounded animate-pulse w-8"></div>
          </div>
        </div>
      </div>

      {/* Tasks Skeleton */}
      <div className="p-4 space-y-3 flex-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] p-4 border border-border-default">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-[var(--bg-secondary)] rounded-full animate-pulse mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--bg-secondary)] rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-[var(--bg-secondary)] rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button Skeleton */}
      <div className="p-4 bg-[var(--bg-surface)] border-t border-border-default rounded-b-[var(--radius-lg)]">
        <div className="h-10 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] animate-pulse"></div>
      </div>
    </Card>
  );
});

TaskColumnSkeleton.displayName = 'TaskColumnSkeleton'; 
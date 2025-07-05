import React from 'react';
import { Card, Skeleton } from "../../../components/ui";

interface WidgetSkeletonProps {
  className?: string;
  rows?: number;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  className = '', 
  rows = 3 
}) => {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="text" width="8rem" height="1.5rem" />
          <Skeleton variant="rectangular" width="5rem" height="2rem" />
        </div>
        
        {/* Progress bar skeleton (optional) */}
        <div className="mb-4">
          <Skeleton variant="rectangular" width="100%" height="0.625rem" className="rounded-full" />
        </div>
        
        {/* Rows skeleton */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton variant="circular" width="1rem" height="1rem" className="flex-shrink-0" />
              <div className="flex-1">
                <Skeleton variant="text" width="75%" height="1rem" className="mb-1" />
                <Skeleton variant="text" width="50%" height="0.75rem" />
              </div>
              <Skeleton variant="text" width="3rem" height="0.75rem" className="flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

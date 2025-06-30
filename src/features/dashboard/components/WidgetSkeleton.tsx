import React from 'react';
import { Card } from "../../../core/shared-ui";

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
          <div className="h-6 bg-bg-secondary rounded w-32"></div>
          <div className="h-8 bg-bg-secondary rounded w-20"></div>
        </div>
        
        {/* Progress bar skeleton (optional) */}
        <div className="mb-4">
          <div className="w-full bg-bg-secondary rounded-full h-2.5"></div>
        </div>
        
        {/* Rows skeleton */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-bg-secondary rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-bg-secondary rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-bg-secondary rounded w-12 flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

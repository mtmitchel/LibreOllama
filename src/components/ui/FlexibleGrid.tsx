import React from 'react';

interface FlexibleGridProps {
  children: React.ReactNode;
  minItemWidth?: number; // Minimum width for each grid item in pixels
  gap?: number; // Gap between items in pixels (maps to Tailwind gap classes)
  className?: string;
}

/**
 * FlexibleGrid - A responsive grid that automatically adjusts columns based on available space
 * 
 * Uses CSS Grid with auto-fit and minmax to create a truly flexible layout that:
 * - Automatically calculates the optimal number of columns
 * - Ensures items never go below minimum width
 * - Fills the available space efficiently
 * - Eliminates unbalanced white space
 */
export function FlexibleGrid({ 
  children, 
  minItemWidth = 280, 
  gap = 6, 
  className = '' 
}: FlexibleGridProps) {
  const gapClass = {
    1: 'gap-1',
    2: 'gap-2', 
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    7: 'gap-7',
    8: 'gap-8'
  }[gap] || 'gap-6';

  return (
    <div 
      className={`grid ${gapClass} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
} 
import React from 'react';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = false,
  className = '',
  children
}: ProgressRingProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      stroke: '2',
      radius: '18',
      text: 'text-xs'
    },
    md: {
      container: 'w-16 h-16',
      stroke: '3',
      radius: '26',
      text: 'text-sm'
    },
    lg: {
      container: 'w-20 h-20',
      stroke: '4',
      radius: '34',
      text: 'text-base'
    }
  };

  const variantClasses = {
    primary: 'text-accent-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  };

  const { container, stroke, radius, text } = sizeClasses[size];
  const colorClass = variantClasses[variant];
  
  const circumference = 2 * Math.PI * parseInt(radius);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${container} ${className}`}>
      <svg
        className="-rotate-90"
        width="100%"
        height="100%"
        viewBox={`0 0 ${parseInt(radius) * 2 + parseInt(stroke) * 2} ${parseInt(radius) * 2 + parseInt(stroke) * 2}`}
      >
        {/* Background circle */}
        <circle
          cx={parseInt(radius) + parseInt(stroke)}
          cy={parseInt(radius) + parseInt(stroke)}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-tertiary opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={parseInt(radius) + parseInt(stroke)}
          cy={parseInt(radius) + parseInt(stroke)}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={`transition-all duration-300 ${colorClass}`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>
      
      {/* Content overlay */}
      <div className={`absolute inset-0 flex items-center justify-center ${text}`}>
        {children ? (
          children
        ) : showValue ? (
          <span className={`font-semibold ${colorClass}`}>
            {Math.round(percentage)}%
          </span>
        ) : null}
      </div>
    </div>
  );
} 
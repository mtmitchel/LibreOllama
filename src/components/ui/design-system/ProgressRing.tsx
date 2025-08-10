import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System ProgressRing Component
 * 
 * DLS Compliant Progress Ring following Asana patterns
 * - Circular progress indicators
 * - Animated transitions
 * - Multiple sizes and colors
 */

const progressRingVariants = cva(
  `relative inline-flex items-center justify-center`,
  {
    variants: {
      size: {
        xs: 'w-8 h-8',
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
        xl: 'w-24 h-24',
      },
      variant: {
        default: '',
        primary: '',
        success: '',
        warning: '',
        error: '',
        info: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

export interface ProgressRingProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressRingVariants> {
  value: number;
  max?: number;
  showValue?: boolean;
  label?: string;
  thickness?: 'thin' | 'normal' | 'thick';
  animate?: boolean;
  children?: React.ReactNode;
}

const variantColors = {
  default: 'var(--text-secondary)',
  primary: 'var(--brand-primary)',
  success: 'var(--semantic-success)',
  warning: 'var(--semantic-warning)',
  error: 'var(--semantic-error)',
  info: 'var(--brand-primary)',
};

const sizeConfig = {
  xs: { radius: 14, viewBox: 32, fontSize: '10px' },
  sm: { radius: 20, viewBox: 44, fontSize: '11px' },
  md: { radius: 28, viewBox: 60, fontSize: '12px' },
  lg: { radius: 36, viewBox: 76, fontSize: '14px' },
  xl: { radius: 44, viewBox: 92, fontSize: '16px' },
};

const thicknessConfig = {
  thin: 1.5,
  normal: 2.5,
  thick: 4,
};

export const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ 
    className = '', 
    size = 'md',
    variant = 'primary',
    value,
    max = 100,
    showValue = false,
    label,
    thickness = 'normal',
    animate = true,
    children,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const config = sizeConfig[size || 'md'];
    const strokeWidth = thicknessConfig[thickness];
    const color = variantColors[variant || 'primary'];
    
    const circumference = 2 * Math.PI * config.radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div
        ref={ref}
        className={`${progressRingVariants({ size, variant })} ${className}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        {...props}
      >
        <svg
          className="-rotate-90"
          width="100%"
          height="100%"
          viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        >
          {/* Background circle */}
          <circle
            cx={config.viewBox / 2}
            cy={config.viewBox / 2}
            r={config.radius}
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.3"
          />
          
          {/* Progress circle */}
          <circle
            cx={config.viewBox / 2}
            cy={config.viewBox / 2}
            r={config.radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: animate ? 'stroke-dashoffset var(--transition-duration) ease-in-out' : 'none',
            }}
          />
        </svg>
        
        {/* Content overlay */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ fontSize: config.fontSize }}
        >
          {children ? (
            children
          ) : showValue ? (
            <span className="font-medium text-[color:var(--text-primary)]">
              {Math.round(percentage)}%
            </span>
          ) : null}
          {label && !children && (
            <span className="text-[0.85em] text-[color:var(--text-secondary)] mt-[2px]">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';

/**
 * Progress Bar - Linear progress indicator
 */
const progressBarVariants = cva(
  `relative overflow-hidden bg-[var(--bg-tertiary)] rounded-full`,
  {
    variants: {
      size: {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
      },
      variant: {
        default: '',
        primary: '',
        success: '',
        warning: '',
        error: '',
        info: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

export interface ProgressBarProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  showValue?: boolean;
  label?: string;
  animate?: boolean;
  striped?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className = '', 
    size = 'md',
    variant = 'primary',
    value,
    max = 100,
    showValue = false,
    label,
    animate = true,
    striped = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const color = variantColors[variant || 'primary'];
    
    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-[var(--space-1)]">
            {label && (
              <span className="asana-text-sm text-[color:var(--text-secondary)]">
                {label}
              </span>
            )}
            {showValue && (
              <span className="asana-text-sm font-medium text-[color:var(--text-primary)]">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={`${progressBarVariants({ size, variant })} ${className}`}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          {...props}
        >
          <div
            className={`
              h-full rounded-full
              ${striped ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%] animate-[progress-stripes_1s_linear_infinite]' : ''}
            `}
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              transition: animate ? 'width var(--transition-duration) ease-in-out' : 'none',
            }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

/**
 * Loading Spinner - Indeterminate progress indicator
 */
export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };
  
  const variantClasses = {
    default: 'border-[var(--border-default)] border-t-[var(--text-primary)]',
    primary: 'border-[var(--brand-subtle)] border-t-[var(--brand-primary)]',
    white: 'border-white/20 border-t-white',
  };
  
  return (
    <div
      className={`
        ${sizeClasses[size]}
        animate-spin rounded-full
        border-2
        ${variantClasses[variant]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Progress Steps - Step indicator
 */
export interface ProgressStepsProps {
  steps: Array<{
    label: string;
    completed?: boolean;
    current?: boolean;
  }>;
  variant?: 'default' | 'numbered';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  variant = 'default',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-[12px]',
    lg: 'w-10 h-10 text-[14px]',
  };
  
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={`
                ${sizeClasses[size]}
                rounded-full flex items-center justify-center
                font-medium transition-colors duration-[var(--transition-duration)]
                ${step.completed 
                  ? 'bg-[var(--brand-primary)] text-[color:var(--text-on-brand)]'
                  : step.current
                    ? 'bg-[var(--brand-subtle)] text-[var(--brand-primary)] border-2 border-[var(--brand-primary)]'
                    : 'bg-[var(--bg-tertiary)] text-[color:var(--text-muted)] border-2 border-[var(--border-default)]'
                }
              `}
            >
              {variant === 'numbered' ? index + 1 : step.completed ? '✓' : ''}
            </div>
            <span className="mt-[var(--space-1)] asana-text-sm text-[color:var(--text-secondary)]">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`
                flex-1 h-[2px] mx-[var(--space-2)]
                ${steps[index + 1].completed || steps[index + 1].current
                  ? 'bg-[var(--brand-primary)]'
                  : 'bg-[var(--border-default)]'
                }
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
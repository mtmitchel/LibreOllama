import React from 'react';
import { cn } from '../../core/lib/utils';

export interface TagProps {
  children: React.ReactNode;
  variant?: 'solid' | 'ghost' | 'dot';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'muted' | 'info';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ children, variant = 'solid', color = 'muted', size = 'sm', className, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium transition-colors';
    
    const sizeClasses = {
      xs: 'px-1.5 py-0.5 text-[10px] rounded',
      sm: 'px-2 py-0.5 text-xs rounded-full',
      md: 'px-2 py-1 text-sm rounded-md',
    };

    const variantClasses = {
      solid: {
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        error: 'bg-error-soft text-error',
        muted: 'bg-muted text-muted-foreground',
        info: 'bg-accent-soft text-primary',
      },
      ghost: {
        primary: 'border border-primary text-primary bg-transparent',
        success: 'border border-success text-success bg-transparent',
        warning: 'border border-warning text-warning bg-transparent',
        error: 'border border-error text-error bg-transparent',
        muted: 'border border-border text-muted-foreground bg-transparent',
        info: 'border border-primary text-primary bg-transparent',
      },
      dot: {
        primary: 'text-foreground',
        success: 'text-foreground',
        warning: 'text-foreground',
        error: 'text-foreground',
        muted: 'text-muted-foreground',
        info: 'text-foreground',
      },
    };

    const dotClasses = {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      muted: 'bg-muted-foreground',
      info: 'bg-primary',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant][color],
          className
        )}
        {...props}
      >
        {variant === 'dot' && (
          <span
            className={cn(
              'w-2 h-2 rounded-full mr-2 flex-shrink-0',
              dotClasses[color]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag }; 
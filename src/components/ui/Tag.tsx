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
        primary: 'bg-accent-primary text-white',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        error: 'bg-error text-white',
        muted: 'bg-secondary text-secondary',
        info: 'bg-accent-soft text-accent-primary',
      },
      ghost: {
        primary: 'border border-accent-primary text-accent-primary bg-transparent',
        success: 'border border-success text-success bg-transparent',
        warning: 'border border-warning text-warning bg-transparent',
        error: 'border border-error text-error bg-transparent',
        muted: 'border border-primary text-secondary bg-transparent',
        info: 'border border-accent-primary text-accent-primary bg-transparent',
      },
      dot: {
        primary: 'text-primary',
        success: 'text-primary',
        warning: 'text-primary',
        error: 'text-primary',
        muted: 'text-secondary',
        info: 'text-primary',
      },
    };

    const dotClasses = {
      primary: 'bg-accent-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      muted: 'bg-secondary',
      info: 'bg-accent-primary',
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
              'mr-2 size-2 shrink-0 rounded-full',
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
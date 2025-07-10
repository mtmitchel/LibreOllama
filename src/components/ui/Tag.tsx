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
        primary: 'bg-[var(--accent-primary)] text-white',
        success: 'bg-[var(--success-ghost)] text-[var(--success)]',
        warning: 'bg-[var(--warning-ghost)] text-[var(--warning)]',
        error: 'bg-[var(--error-ghost)] text-[var(--error)]',
        muted: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
        info: 'bg-[var(--info-ghost)] text-[var(--info)]',
      },
      ghost: {
        primary: 'border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent',
        success: 'border border-[var(--success)] text-[var(--success)] bg-transparent',
        warning: 'border border-[var(--warning)] text-[var(--warning)] bg-transparent',
        error: 'border border-[var(--error)] text-[var(--error)] bg-transparent',
        muted: 'border border-[var(--border-default)] text-[var(--text-secondary)] bg-transparent',
        info: 'border border-[var(--info)] text-[var(--info)] bg-transparent',
      },
      dot: {
        primary: 'text-[var(--text-primary)]',
        success: 'text-[var(--text-primary)]',
        warning: 'text-[var(--text-primary)]',
        error: 'text-[var(--text-primary)]',
        muted: 'text-[var(--text-secondary)]',
        info: 'text-[var(--text-primary)]',
      },
    };

    const dotClasses = {
      primary: 'bg-[var(--accent-primary)]',
      success: 'bg-[var(--success)]',
      warning: 'bg-[var(--warning)]',
      error: 'bg-[var(--error)]',
      muted: 'bg-[var(--text-secondary)]',
      info: 'bg-[var(--info)]',
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
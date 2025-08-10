import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

/**
 * Design System Badge Component
 * 
 * DLS Compliant Badge following Asana patterns
 * - Small, inline status indicators
 * - Count badges for notifications
 * - Removable badges for filters/tags
 */

const badgeVariants = cva(
  `
    inline-flex items-center justify-center
    rounded-[var(--radius-full)]
    asana-text-sm
    font-medium
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      variant: {
        default: `
          bg-[var(--bg-tertiary)]
          text-[color:var(--text-primary)]
          border border-[var(--border-default)]
        `,
        primary: `
          bg-[var(--brand-primary)]
          text-[color:var(--text-on-brand)]
        `,
        secondary: `
          bg-[var(--bg-secondary)]
          text-[color:var(--text-secondary)]
        `,
        success: `
          bg-[var(--semantic-success-bg)]
          text-[var(--semantic-success)]
          border border-[var(--semantic-success)]
        `,
        warning: `
          bg-[var(--semantic-warning-bg)]
          text-[var(--semantic-warning)]
          border border-[var(--semantic-warning)]
        `,
        error: `
          bg-[var(--semantic-error-bg)]
          text-[var(--semantic-error)]
          border border-[var(--semantic-error)]
        `,
        info: `
          bg-[var(--brand-subtle)]
          text-[var(--brand-primary)]
          border border-[var(--brand-primary)]
        `,
        outline: `
          bg-transparent
          text-[color:var(--text-primary)]
          border border-[var(--border-default)]
        `,
      },
      size: {
        sm: 'px-[var(--space-1)] py-[1px] text-[10px]',
        md: 'px-[var(--space-1-5)] py-[2px] text-[11px]',
        lg: 'px-[var(--space-2)] py-[var(--space-0-5)] asana-text-sm',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  onRemove?: () => void;
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className = '', 
    variant, 
    size, 
    interactive,
    children, 
    onRemove,
    icon,
    dot,
    onClick,
    ...props 
  }, ref) => {
    const isClickable = Boolean(onClick || onRemove);
    
    return (
      <span
        ref={ref}
        className={`${badgeVariants({ variant, size, interactive: interactive ?? isClickable })} ${className}`}
        onClick={onClick}
        {...props}
      >
        {dot && (
          <span 
            className={`
              w-[6px] h-[6px] 
              rounded-full 
              bg-current 
              mr-[var(--space-0-5)]
            `} 
          />
        )}
        {icon && (
          <span className="mr-[var(--space-0-5)] flex-shrink-0">
            {icon}
          </span>
        )}
        {children}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`
              ml-[var(--space-0-5)]
              -mr-[2px]
              p-[1px]
              rounded-full
              hover:bg-[var(--bg-hover)]
              transition-colors
              duration-[var(--transition-duration)]
            `}
            aria-label="Remove"
          >
            <X size={10} />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Count Badge - Specialized badge for showing counts
 */
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'primary',
  size = 'sm',
  ...props
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge
      variant={variant}
      size={size}
      className="min-w-[20px] px-[var(--space-0-5)]"
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

/**
 * Status Badge - Badge with dot indicator
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'dot'> {
  status: 'online' | 'offline' | 'busy' | 'away' | 'custom';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  ...props
}) => {
  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online' },
    offline: { variant: 'default' as const, label: 'Offline' },
    busy: { variant: 'error' as const, label: 'Busy' },
    away: { variant: 'warning' as const, label: 'Away' },
    custom: { variant: 'info' as const, label: label || 'Custom' },
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} dot {...props}>
      {label || config.label}
    </Badge>
  );
};

/**
 * Badge Group - Container for multiple badges
 */
export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  children,
  gap = 'sm',
  className = '',
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-[var(--space-1)]',
    md: 'gap-[var(--space-2)]',
    lg: 'gap-[var(--space-3)]',
  };
  
  return (
    <div
      className={`
        inline-flex items-center flex-wrap
        ${gapClasses[gap]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
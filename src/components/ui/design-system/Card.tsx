import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Card Component
 * 
 * DLS Compliant Card following Asana patterns
 * - Clean, minimal container for content
 * - Subtle elevation and borders
 * - Hover states for interactive cards
 */

const cardVariants = cva(
  `
    bg-[var(--bg-primary)]
    border border-[var(--border-default)]
    rounded-[var(--radius-md)]
    shadow-[var(--shadow-card)]
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      variant: {
        default: '',
        elevated: `
          shadow-[var(--shadow-elevated)]
          hover:shadow-[var(--shadow-popover)]
        `,
        interactive: `
          cursor-pointer
          hover:shadow-[var(--shadow-elevated)]
          hover:border-[var(--border-hover)]
          hover:translate-y-[-1px]
        `,
        flat: `
          shadow-none
          bg-[var(--bg-secondary)]
        `,
      },
      padding: {
        none: '',
        sm: 'p-[var(--space-2)]',
        md: 'p-[var(--space-3)]',
        lg: 'p-[var(--space-4)]',
        xl: 'p-[var(--space-6)]',
      },
      fullHeight: {
        true: 'h-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      fullHeight: false,
    },
  }
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant, padding, fullHeight, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`${cardVariants({ variant, padding, fullHeight })} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header Component
 * Provides consistent header styling within cards
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  action,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        flex items-center justify-between
        mb-[var(--space-3)]
        pb-[var(--space-2)]
        border-b border-[var(--border-subtle)]
        ${className}
      `}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {action && <div className="flex-shrink-0 ml-[var(--space-2)]">{action}</div>}
    </div>
  );
};

/**
 * Card Title Component
 * Styled title for card headers
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Component = 'h3',
  className = '',
  ...props
}) => {
  return (
    <Component
      className={`
        asana-text-lg
        font-medium
        text-[color:var(--text-primary)]
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Card Content Component
 * Main content area of the card
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        ${noPadding ? '' : 'py-[var(--space-2)]'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 * Footer area with action buttons or metadata
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  className = '',
  ...props
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`
        flex items-center ${alignmentClasses[align]}
        mt-[var(--space-3)]
        pt-[var(--space-2)]
        border-t border-[var(--border-subtle)]
        gap-[var(--space-2)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Grid Component
 * Layout helper for card grids
 */
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
  ...props
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-[var(--space-2)]',
    md: 'gap-[var(--space-3)]',
    lg: 'gap-[var(--space-4)]',
  };

  return (
    <div
      className={`
        grid ${columnClasses[columns]} ${gapClasses[gap]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Stack Component
 * 
 * DLS Compliant Layout Primitive for consistent vertical/horizontal spacing
 * - Eliminates manual margin/padding guesswork
 * - Uses design tokens for all spacing values
 * - Supports both vertical and horizontal arrangements
 * - Flexible alignment and distribution options
 * - Perfect for lists, forms, and content sections
 */

const stackVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        vertical: 'flex-col',
        horizontal: 'flex-row',
      },
      gap: {
        '0': 'gap-0',
        '0-5': 'gap-[var(--space-0-5)]', // 4px
        '1': 'gap-[var(--space-1)]',     // 8px
        '1-5': 'gap-[var(--space-1-5)]', // 12px
        '2': 'gap-[var(--space-2)]',     // 16px
        '2-5': 'gap-[var(--space-2-5)]', // 20px
        '3': 'gap-[var(--space-3)]',     // 24px
        '4': 'gap-[var(--space-4)]',     // 32px
        '5': 'gap-[var(--space-5)]',     // 40px
        '6': 'gap-[var(--space-6)]',     // 48px
        '8': 'gap-[var(--space-8)]',     // 64px
        '10': 'gap-[var(--space-10)]',   // 80px
        '12': 'gap-[var(--space-12)]',   // 96px
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
      },
    },
    defaultVariants: {
      direction: 'vertical',
      gap: '3',
      align: 'stretch',
      justify: 'start',
      wrap: false,
    },
  }
);

export interface StackProps extends VariantProps<typeof stackVariants> {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(({
  children,
  direction = 'vertical',
  gap = '3',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  as: Component = 'div',
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  id,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={stackVariants({
        direction,
        gap,
        align,
        justify,
        wrap,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
});

Stack.displayName = 'Stack';

/**
 * Vertical Stack - Convenience component for vertical layouts
 */
export interface VStackProps extends Omit<StackProps, 'direction'> {}

export const VStack = forwardRef<HTMLDivElement, VStackProps>((props, ref) => {
  return <Stack ref={ref} direction="vertical" {...props} />;
});

VStack.displayName = 'VStack';

/**
 * Horizontal Stack - Convenience component for horizontal layouts
 */
export interface HStackProps extends Omit<StackProps, 'direction'> {}

export const HStack = forwardRef<HTMLDivElement, HStackProps>((props, ref) => {
  return <Stack ref={ref} direction="horizontal" {...props} />;
});

HStack.displayName = 'HStack';

/**
 * Divider - Visual separator for Stack items
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'subtle' | 'default' | 'strong';
  className?: string;
}

const dividerVariants = cva(
  'shrink-0 border-0',
  {
    variants: {
      orientation: {
        horizontal: 'w-full h-px',
        vertical: 'h-full w-px',
      },
      variant: {
        solid: '',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
      },
      thickness: {
        thin: '',
        medium: '',
        thick: '',
      },
      color: {
        subtle: 'bg-[var(--border-subtle)]',
        default: 'bg-[var(--border-default)]',
        strong: 'bg-[var(--border-strong)]',
      },
    },
    compoundVariants: [
      // Horizontal dividers
      {
        orientation: 'horizontal',
        thickness: 'thin',
        className: 'h-px',
      },
      {
        orientation: 'horizontal',
        thickness: 'medium',
        className: 'h-0.5',
      },
      {
        orientation: 'horizontal',
        thickness: 'thick',
        className: 'h-1',
      },
      // Vertical dividers
      {
        orientation: 'vertical',
        thickness: 'thin',
        className: 'w-px',
      },
      {
        orientation: 'vertical',
        thickness: 'medium',
        className: 'w-0.5',
      },
      {
        orientation: 'vertical',
        thickness: 'thick',
        className: 'w-1',
      },
      // Dashed/dotted variants need border style
      {
        variant: 'dashed',
        orientation: 'horizontal',
        className: 'border-t bg-transparent',
      },
      {
        variant: 'dotted',
        orientation: 'horizontal',
        className: 'border-t bg-transparent',
      },
      {
        variant: 'dashed',
        orientation: 'vertical',
        className: 'border-l bg-transparent',
      },
      {
        variant: 'dotted',
        orientation: 'vertical',
        className: 'border-l bg-transparent',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'solid',
      thickness: 'thin',
      color: 'default',
    },
  }
);

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 'thin',
  color = 'default',
  className = '',
}) => {
  const colorClasses = {
    subtle: 'border-[var(--border-subtle)]',
    default: 'border-[var(--border-default)]',
    strong: 'border-[var(--border-strong)]',
  };

  return (
    <div
      className={dividerVariants({
        orientation,
        variant,
        thickness,
        color: variant === 'solid' ? color : undefined,
        className: variant !== 'solid' ? `${colorClasses[color]} ${className}` : className,
      })}
      role="separator"
      aria-orientation={orientation}
    />
  );
};

/**
 * Spacer - Flexible space filler
 */
export interface SpacerProps {
  size?: StackProps['gap'];
  direction?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size,
  direction = 'both',
  className = '',
}) => {
  const sizeClasses = {
    '0': 'w-0 h-0',
    '0-5': 'w-[var(--space-0-5)] h-[var(--space-0-5)]',
    '1': 'w-[var(--space-1)] h-[var(--space-1)]',
    '1-5': 'w-[var(--space-1-5)] h-[var(--space-1-5)]',
    '2': 'w-[var(--space-2)] h-[var(--space-2)]',
    '2-5': 'w-[var(--space-2-5)] h-[var(--space-2-5)]',
    '3': 'w-[var(--space-3)] h-[var(--space-3)]',
    '4': 'w-[var(--space-4)] h-[var(--space-4)]',
    '5': 'w-[var(--space-5)] h-[var(--space-5)]',
    '6': 'w-[var(--space-6)] h-[var(--space-6)]',
    '8': 'w-[var(--space-8)] h-[var(--space-8)]',
    '10': 'w-[var(--space-10)] h-[var(--space-10)]',
    '12': 'w-[var(--space-12)] h-[var(--space-12)]',
  };

  const getSpacerClass = () => {
    if (size) {
      const baseSize = sizeClasses[size] || sizeClasses['3'];
      
      if (direction === 'horizontal') {
        return baseSize.split(' ')[0] + ' h-0'; // Width only
      } else if (direction === 'vertical') {
        return 'w-0 ' + baseSize.split(' ')[1]; // Height only
      }
      return baseSize; // Both dimensions
    }

    // Flexible spacer (grows to fill space)
    if (direction === 'horizontal') {
      return 'flex-1 h-0';
    } else if (direction === 'vertical') {
      return 'w-0 flex-1';
    }
    return 'flex-1';
  };

  return (
    <div 
      className={`shrink-0 ${getSpacerClass()} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Common Stack Patterns - Pre-configured stacks for frequent use cases
 */

/**
 * Form Stack - Optimized for form layouts
 */
export interface FormStackProps extends Omit<StackProps, 'direction' | 'gap'> {
  gap?: '2' | '3' | '4';
}

export const FormStack = forwardRef<HTMLDivElement, FormStackProps>(({
  gap = '4',
  ...props
}, ref) => {
  return (
    <Stack
      ref={ref}
      direction="vertical"
      gap={gap}
      {...props}
    />
  );
});

FormStack.displayName = 'FormStack';

/**
 * List Stack - Optimized for list layouts
 */
export interface ListStackProps extends Omit<StackProps, 'direction'> {}

export const ListStack = forwardRef<HTMLDivElement, ListStackProps>(({
  gap = '1',
  ...props
}, ref) => {
  return (
    <Stack
      ref={ref}
      direction="vertical"
      gap={gap}
      role="list"
      {...props}
    />
  );
});

ListStack.displayName = 'ListStack';

/**
 * Button Group - Optimized for button arrangements
 */
export interface ButtonGroupProps extends Omit<StackProps, 'direction'> {
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(({
  orientation = 'horizontal',
  gap = '2',
  align = 'center',
  ...props
}, ref) => {
  return (
    <Stack
      ref={ref}
      direction={orientation}
      gap={gap}
      align={align}
      role="group"
      {...props}
    />
  );
});

ButtonGroup.displayName = 'ButtonGroup';
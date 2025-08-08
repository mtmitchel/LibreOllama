import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Box Component
 * 
 * DLS Compliant Layout Primitive - Enhanced div replacement
 * - Direct spacing token props (padding, margin)
 * - Display and positioning utilities
 * - Background and border token support
 * - Perfect for custom layouts and containers
 * - Eliminates manual CSS classes for spacing
 */

// Spacing token type for consistent usage across props
type SpacingToken = 
  | '0' | '0-5' | '1' | '1-5' | '2' | '2-5' 
  | '3' | '4' | '5' | '6' | '8' | '10' | '12'
  | 'auto';

// Convert spacing token to CSS class
const getSpacingClass = (property: string, value: SpacingToken) => {
  if (value === 'auto') {
    return `${property}-auto`;
  }
  return `${property}-[var(--space-${value})]`;
};

const boxVariants = cva('', {
  variants: {
    display: {
      block: 'block',
      inline: 'inline',
      'inline-block': 'inline-block',
      flex: 'flex',
      'inline-flex': 'inline-flex',
      grid: 'grid',
      'inline-grid': 'inline-grid',
      hidden: 'hidden',
      contents: 'contents',
    },
    position: {
      static: 'static',
      relative: 'relative',
      absolute: 'absolute',
      fixed: 'fixed',
      sticky: 'sticky',
    },
    overflow: {
      visible: 'overflow-visible',
      hidden: 'overflow-hidden',
      scroll: 'overflow-scroll',
      auto: 'overflow-auto',
    },
    overflowX: {
      visible: 'overflow-x-visible',
      hidden: 'overflow-x-hidden',
      scroll: 'overflow-x-scroll',
      auto: 'overflow-x-auto',
    },
    overflowY: {
      visible: 'overflow-y-visible',
      hidden: 'overflow-y-hidden',
      scroll: 'overflow-y-scroll',
      auto: 'overflow-y-auto',
    },
  },
});

export interface BoxProps extends VariantProps<typeof boxVariants> {
  children?: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  
  // Spacing props using design tokens
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingRight?: SpacingToken;
  paddingBottom?: SpacingToken;
  paddingLeft?: SpacingToken;
  
  margin?: SpacingToken;
  marginX?: SpacingToken;
  marginY?: SpacingToken;
  marginTop?: SpacingToken;
  marginRight?: SpacingToken;
  marginBottom?: SpacingToken;
  marginLeft?: SpacingToken;
  
  // Width and height with tokens
  width?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  height?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  minWidth?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  minHeight?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  maxWidth?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  maxHeight?: 'auto' | 'full' | 'fit' | 'min' | 'max' | SpacingToken;
  
  // Background colors using design tokens
  backgroundColor?: 'surface' | 'secondary' | 'muted' | 'subtle' | 'brand' | 'brand-subtle';
  
  // Border radius using design tokens  
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Border using design tokens
  border?: 'none' | 'default' | 'subtle' | 'strong';
  borderTop?: 'none' | 'default' | 'subtle' | 'strong';
  borderRight?: 'none' | 'default' | 'subtle' | 'strong';
  borderBottom?: 'none' | 'default' | 'subtle' | 'strong';
  borderLeft?: 'none' | 'default' | 'subtle' | 'strong';
  
  // Shadow using design tokens
  shadow?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'focus';
  
  // Accessibility props
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  id?: string;
  
  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  
  // Style props
  style?: React.CSSProperties;
  tabIndex?: number;
}

export const Box = forwardRef<HTMLElement, BoxProps>(({
  children,
  className = '',
  as: Component = 'div',
  
  // Layout props
  display,
  position,
  overflow,
  overflowX,
  overflowY,
  
  // Spacing props
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginX,
  marginY,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  
  // Size props
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  
  // Style props
  backgroundColor,
  borderRadius,
  border,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  shadow,
  
  // Standard props
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-hidden': ariaHidden,
  id,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  style,
  tabIndex,
  
  ...props
}, ref) => {
  // Build spacing classes
  const spacingClasses: string[] = [];
  
  // Padding classes
  if (padding) spacingClasses.push(getSpacingClass('p', padding));
  if (paddingX) spacingClasses.push(getSpacingClass('px', paddingX));
  if (paddingY) spacingClasses.push(getSpacingClass('py', paddingY));
  if (paddingTop) spacingClasses.push(getSpacingClass('pt', paddingTop));
  if (paddingRight) spacingClasses.push(getSpacingClass('pr', paddingRight));
  if (paddingBottom) spacingClasses.push(getSpacingClass('pb', paddingBottom));
  if (paddingLeft) spacingClasses.push(getSpacingClass('pl', paddingLeft));
  
  // Margin classes
  if (margin) spacingClasses.push(getSpacingClass('m', margin));
  if (marginX) spacingClasses.push(getSpacingClass('mx', marginX));
  if (marginY) spacingClasses.push(getSpacingClass('my', marginY));
  if (marginTop) spacingClasses.push(getSpacingClass('mt', marginTop));
  if (marginRight) spacingClasses.push(getSpacingClass('mr', marginRight));
  if (marginBottom) spacingClasses.push(getSpacingClass('mb', marginBottom));
  if (marginLeft) spacingClasses.push(getSpacingClass('ml', marginLeft));
  
  // Size classes
  const sizeClasses: string[] = [];
  if (width) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(width)) {
      sizeClasses.push(`w-${width}`);
    } else {
      sizeClasses.push(`w-[var(--space-${width})]`);
    }
  }
  if (height) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(height)) {
      sizeClasses.push(`h-${height}`);
    } else {
      sizeClasses.push(`h-[var(--space-${height})]`);
    }
  }
  if (minWidth) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(minWidth)) {
      sizeClasses.push(`min-w-${minWidth}`);
    } else {
      sizeClasses.push(`min-w-[var(--space-${minWidth})]`);
    }
  }
  if (minHeight) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(minHeight)) {
      sizeClasses.push(`min-h-${minHeight}`);
    } else {
      sizeClasses.push(`min-h-[var(--space-${minHeight})]`);
    }
  }
  if (maxWidth) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(maxWidth)) {
      sizeClasses.push(`max-w-${maxWidth}`);
    } else {
      sizeClasses.push(`max-w-[var(--space-${maxWidth})]`);
    }
  }
  if (maxHeight) {
    if (['auto', 'full', 'fit', 'min', 'max'].includes(maxHeight)) {
      sizeClasses.push(`max-h-${maxHeight}`);
    } else {
      sizeClasses.push(`max-h-[var(--space-${maxHeight})]`);
    }
  }
  
  // Background classes
  const styleClasses: string[] = [];
  if (backgroundColor) {
    const bgMap = {
      surface: 'bg-[var(--bg-surface)]',
      secondary: 'bg-[var(--bg-secondary)]',
      muted: 'bg-[var(--bg-muted)]',
      subtle: 'bg-[var(--bg-subtle)]',
      brand: 'bg-[var(--brand-primary)]',
      'brand-subtle': 'bg-[var(--brand-subtle)]',
    };
    styleClasses.push(bgMap[backgroundColor]);
  }
  
  // Border radius classes
  if (borderRadius) {
    if (borderRadius === 'none') {
      styleClasses.push('rounded-none');
    } else if (borderRadius === 'full') {
      styleClasses.push('rounded-full');
    } else {
      styleClasses.push(`rounded-[var(--radius-${borderRadius})]`);
    }
  }
  
  // Border classes
  const borderMap = {
    none: 'border-none',
    default: 'border border-[var(--border-default)]',
    subtle: 'border border-[var(--border-subtle)]',
    strong: 'border border-[var(--border-strong)]',
  };
  if (border) styleClasses.push(borderMap[border]);
  if (borderTop) styleClasses.push(borderTop === 'none' ? 'border-t-0' : `border-t border-[var(--border-${borderTop})]`);
  if (borderRight) styleClasses.push(borderRight === 'none' ? 'border-r-0' : `border-r border-[var(--border-${borderRight})]`);
  if (borderBottom) styleClasses.push(borderBottom === 'none' ? 'border-b-0' : `border-b border-[var(--border-${borderBottom})]`);
  if (borderLeft) styleClasses.push(borderLeft === 'none' ? 'border-l-0' : `border-l border-[var(--border-${borderLeft})]`);
  
  // Shadow classes
  if (shadow) {
    if (shadow === 'none') {
      styleClasses.push('shadow-none');
    } else {
      styleClasses.push(`shadow-[var(--shadow-${shadow})]`);
    }
  }
  
  // Combine all classes
  const allClasses = [
    boxVariants({ display, position, overflow, overflowX, overflowY }),
    ...spacingClasses,
    ...sizeClasses,
    ...styleClasses,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <Component
      ref={ref}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-hidden={ariaHidden}
      className={allClasses}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
});

Box.displayName = 'Box';

/**
 * Common Box Patterns - Pre-configured boxes for frequent use cases
 */

/**
 * Center - Centers content both horizontally and vertically
 */
export interface CenterProps extends Omit<BoxProps, 'display'> {}

export const Center = forwardRef<HTMLElement, CenterProps>((props, ref) => {
  return (
    <Box
      ref={ref}
      display="flex"
      className="items-center justify-center"
      {...props}
    />
  );
});

Center.displayName = 'Center';

/**
 * Square - Maintains a square aspect ratio
 */
export interface SquareProps extends BoxProps {
  size: SpacingToken;
}

export const Square = forwardRef<HTMLElement, SquareProps>(({
  size,
  ...props
}, ref) => {
  return (
    <Box
      ref={ref}
      width={size}
      height={size}
      {...props}
    />
  );
});

Square.displayName = 'Square';

/**
 * Circle - Circular container
 */
export interface CircleProps extends SquareProps {}

export const Circle = forwardRef<HTMLElement, CircleProps>((props, ref) => {
  return (
    <Square
      ref={ref}
      borderRadius="full"
      {...props}
    />
  );
});

Circle.displayName = 'Circle';

/**
 * Flex - Flexbox container with common props
 */
export interface FlexProps extends Omit<BoxProps, 'display'> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: SpacingToken;
}

export const Flex = forwardRef<HTMLElement, FlexProps>(({
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap,
  className = '',
  ...props
}, ref) => {
  const flexClasses = [
    direction === 'row' ? 'flex-row' : 
    direction === 'column' ? 'flex-col' :
    direction === 'row-reverse' ? 'flex-row-reverse' : 'flex-col-reverse',
    
    wrap === 'wrap' ? 'flex-wrap' :
    wrap === 'wrap-reverse' ? 'flex-wrap-reverse' : 'flex-nowrap',
    
    align === 'start' ? 'items-start' :
    align === 'center' ? 'items-center' :
    align === 'end' ? 'items-end' :
    align === 'baseline' ? 'items-baseline' : 'items-stretch',
    
    justify === 'start' ? 'justify-start' :
    justify === 'center' ? 'justify-center' :
    justify === 'end' ? 'justify-end' :
    justify === 'between' ? 'justify-between' :
    justify === 'around' ? 'justify-around' :
    justify === 'evenly' ? 'justify-evenly' : 'justify-start',
    
    gap ? `gap-[var(--space-${gap})]` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Box
      ref={ref}
      display="flex"
      className={flexClasses}
      {...props}
    />
  );
});

Flex.displayName = 'Flex';

/**
 * AspectRatio - Maintains aspect ratio
 */
export interface AspectRatioProps extends BoxProps {
  ratio?: '1/1' | '16/9' | '4/3' | '3/2' | number;
}

export const AspectRatio = forwardRef<HTMLElement, AspectRatioProps>(({
  ratio = '1/1',
  className = '',
  children,
  ...props
}, ref) => {
  const aspectClass = typeof ratio === 'number' 
    ? `aspect-[${ratio}]`
    : `aspect-${ratio}`;

  return (
    <Box
      ref={ref}
      className={`${aspectClass} ${className}`}
      {...props}
    >
      {children}
    </Box>
  );
});

AspectRatio.displayName = 'AspectRatio';
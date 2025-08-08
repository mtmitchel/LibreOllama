/**
 * Legacy Card Component
 * 
 * This file now re-exports the DLS-compliant Card from the design system.
 * All old implementations have been replaced with the new design system version.
 */

import { Card as DesignSystemCard } from './design-system/Card';
import type { CardProps as DSCardProps } from './design-system/Card';

export { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardGrid
} from './design-system/Card';
export type { 
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardContentProps,
  CardFooterProps,
  CardGridProps
} from './design-system/Card';

/**
 * Legacy Card wrapper for backward compatibility
 * Maps old props to new design system props
 */
export function LegacyCard(props: any) {
  const { 
    children,
    padding = 'default',
    className = '',
    style,
    ...rest
  } = props;

  // Map old padding values to new ones
  const paddingMap: Record<string, DSCardProps['padding']> = {
    none: 'none',
    sm: 'sm',
    default: 'md',
    lg: 'lg'
  };

  const mappedPadding = paddingMap[padding] || 'md';

  // Map old hover behavior to interactive variant
  const hasHoverShadow = className.includes('hover:shadow') || style?.cursor === 'pointer';
  const variant = hasHoverShadow ? 'interactive' : 'default';

  return (
    <DesignSystemCard
      variant={variant}
      padding={mappedPadding}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </DesignSystemCard>
  );
}

// Re-import Card for default export
import { Card } from './design-system/Card';

// Export as default for any imports expecting it
export default Card;
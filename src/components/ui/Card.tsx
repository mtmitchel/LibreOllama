import React from 'react';

/**
 * Props for the Card component.
 * - `className`: Allows for additional custom styling.
 * - `as`: Allows the card to be rendered as a different HTML element (e.g., 'li', 'article'). Defaults to 'div'.
 * - `padding`: Controls the internal padding of the card. Defaults to 'default'.
 * - `variant`: Controls the visual style variant of the card. Defaults to 'default'.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  variant?: 'default' | 'elevated';
}

/**
 * A flexible, reusable Card component that enforces design system standards.
 * This should be used for all widgets, panels, and content containers.
 * 
 * Uses CSS custom properties from the design system:
 * - --bg-surface: Surface background color
 * - --border-subtle: Subtle border color
 * - --border-default: Default border color for hover states
 */
export const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ 
    children, 
    className = '', 
    as: Component = 'div', 
    padding = 'default',
    variant = 'default'
  }, ref) => {
    
    // Determine padding class based on props
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      default: 'p-4 sm:p-5',
      lg: 'p-6 sm:p-8'
    };

    // Determine variant classes
    const variantClasses = {
      default: 'shadow-sm hover:shadow-md',
      elevated: 'shadow-md hover:shadow-lg'
    };

    const paddingClass = paddingClasses[padding];
    const variantClass = variantClasses[variant];

    // Base classes using Tailwind utilities mapped to CSS custom properties
    // These classes reference the design system variables defined in design-system.css
    const baseClasses = `
      bg-surface border border-border-subtle rounded-lg 
      transition-all duration-200 ease-in-out hover:border-border-default
      ${variantClass}
    `.trim().replace(/\s+/g, ' ');
    
    return (
      <Component 
        ref={ref} 
        className={`${baseClasses} ${paddingClass} ${className}`.trim()}
      >
        {children}
      </Component>
    );
  }
);

// Add a display name for better debugging
Card.displayName = 'Card';

export default Card;
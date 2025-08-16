import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Button Component
 * 
 * Design Language Specification (DLS) Compliant:
 * - Primary Brand: #796EFF
 * - Backgrounds: #FFFFFF (Content), #FAFBFC (Canvas), #F6F7F8 (Inputs)
 * - Text: #151B26 (Primary), #6B6F76 (Secondary)
 * - Borders: #E8E8E9 (Subtle), #D1D5DB (Focus)
 * - Border Radius: 12px (large), 8px (medium), 9999px (pills)
 * - Shadows: 0 1px 3px rgba(0, 0, 0, 0.1)
 */

// Create CSS module classes that use our design tokens
const buttonBaseStyles = `
  inline-flex items-center justify-center gap-2
  font-[family-name:var(--font-family-sans)]
  font-medium
  transition-[var(--transition-property)]
  duration-[var(--transition-duration)]
  cursor-pointer outline-none
  disabled:opacity-50 disabled:cursor-not-allowed
  focus-visible:shadow-[var(--shadow-focus)]
  active:scale-[0.98]
`;

const buttonVariants = cva(
  buttonBaseStyles,
  {
    variants: {
      variant: {
        primary: `
          bg-[var(--brand-primary)]
          text-[color:var(--text-on-brand)]
          hover:bg-[var(--brand-hover)]
          shadow-[var(--shadow-card)]
          hover:shadow-[var(--shadow-hover)]
        `,
        secondary: `
          bg-[var(--bg-secondary)]
          text-[color:var(--text-primary)]
          hover:bg-[var(--bg-hover)]
          border border-[var(--border-default)]
          hover:border-[var(--border-focus)]
        `,
        ghost: `
          bg-transparent
          text-[color:var(--text-primary)]
          hover:bg-[var(--bg-secondary)]
          active:bg-[var(--bg-hover)]
        `,
        outline: `
          bg-transparent
          text-[var(--brand-primary)]
          border border-[var(--brand-primary)]
          hover:bg-[var(--brand-primary)]
          hover:text-[color:var(--text-on-brand)]
        `,
        link: `
          bg-transparent border-0 p-0 h-auto
          text-[var(--brand-primary)] hover:text-[var(--brand-hover)]
          underline decoration-[var(--brand-primary)]/40 underline-offset-2
          hover:decoration-[var(--brand-hover)]/60
        `,
        destructive: `
          bg-[var(--status-error)]
          text-[color:var(--text-on-brand)]
          hover:bg-[var(--status-error-hover)]
          shadow-[var(--shadow-card)]
        `,
      },
      size: {
        sm: `
          h-8 px-[var(--space-1-5)]
          asana-text-sm
          rounded-[var(--radius-md)]
        `,
        default: `
          h-10 px-[var(--space-2)]
          asana-text-base
          rounded-[var(--radius-md)]
        `,
        lg: `
          h-12 px-[var(--space-3)]
          asana-text-base
          rounded-[var(--radius-lg)]
        `,
        icon: `
          h-10 w-10
          rounded-[var(--radius-md)]
        `,
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant, 
    size, 
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
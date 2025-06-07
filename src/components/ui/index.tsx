// UI Components using LibreOllama Design System CSS Variables
import React from 'react';

// Button Component - Uses Tailwind utilities with design system variables
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'default';
  children: React.ReactNode;
}

export function Button({
  className = '',
  variant = 'secondary',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border-none rounded-md font-sans font-medium leading-none cursor-pointer transition-all duration-150 no-underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-secondary',
    secondary: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    outline: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated'
  };
  
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    default: 'py-3 px-4 text-sm'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

// Input Component - Uses Tailwind utilities with design system variables
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hasIcon?: boolean;
}

export function Input({ 
  className = '', 
  error, 
  hasIcon,
  style,
  ...props 
}: InputProps) {
  const baseClasses = 'w-full bg-input-bg border border-border-default rounded-md font-sans text-sm text-text-primary transition-all duration-150 placeholder:text-input-placeholder focus:outline-none';
  
  const paddingClasses = hasIcon ? 'py-3 pr-10 pl-4' : 'py-3 px-4';
  
  const stateClasses = error 
    ? 'border-error focus:border-error focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]'
    : 'focus:border-input-focus-ring focus:shadow-[0_0_0_2px_var(--accent-soft)]';

  return (
    <div className="w-full">
      <input
        className={`${baseClasses} ${paddingClasses} ${stateClasses} ${className}`.trim()}
        style={style}
        onFocus={(e) => {
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p style={{
          marginTop: 'var(--space-1)',
          fontSize: '12px',
          color: 'var(--error)'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

// Card Component - Uses Tailwind utilities with design system variables
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'widget' | 'card';
}

export function Card({ 
  className = '', 
  children, 
  variant = 'card',
  style,
  ...props 
}: CardProps) {
  const baseClasses = 'bg-bg-surface border border-border-subtle rounded-lg p-6 relative';
  
  return (
    <div
      className={`${baseClasses} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

// Badge Component - Uses design system variables
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  children: React.ReactNode;
}

export function Badge({ 
  variant = 'default', 
  className = '', 
  children, 
  style,
  ...props 
}: BadgeProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'var(--success)',
          color: 'white'
        };
      case 'warning':
        return {
          background: 'var(--warning)',
          color: 'white'
        };
      case 'error':
        return {
          background: 'var(--error)',
          color: 'white'
        };
      case 'accent':
        return {
          background: 'var(--accent-primary)',
          color: 'white'
        };
      default:
        return {
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)'
        };
    }
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
    minWidth: '18px',
    textAlign: 'center' as const,
    ...getVariantStyle(),
    ...style
  };

  return (
    <span
      className={`nav-badge ${className}`.trim()}
      style={badgeStyle}
      {...props}
    >
      {children}
    </span>
  );
}

// Export UnifiedHeader component
export { UnifiedHeader } from './UnifiedHeader';

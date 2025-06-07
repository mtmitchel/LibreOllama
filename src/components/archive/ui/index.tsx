// UI Components using LibreOllama Design System CSS Variables
import React from 'react';

// Button Component - Implements .btn classes from design system
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
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-4 py-3 border-none rounded-md font-sans text-sm font-medium leading-none cursor-pointer transition-all duration-150 ease-in-out no-underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-accent-primary text-white hover:not(:disabled):bg-accent-secondary';
      break;
    case 'secondary':
    case 'outline': // outline maps to secondary
      variantStyles = 'bg-bg-tertiary text-text-primary border border-border-default hover:not(:disabled):bg-bg-elevated';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-text-secondary hover:not(:disabled):bg-bg-tertiary hover:not(:disabled):text-text-primary';
      break;
  }

  const sizeStyles = size === 'sm' ? 'px-3 py-2 text-xs' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </button>
  );
}

// Input Component - Uses design system variables
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
  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: hasIcon ? 'var(--space-3) var(--space-10) var(--space-3) var(--space-4)' : 'var(--space-3) var(--space-4)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    transition: 'all 0.15s ease',
    ...style
  };

  const focusStyle = error ? {
    borderColor: 'var(--error)',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.1)'
  } : {
    borderColor: 'var(--input-focus-ring)',
    boxShadow: '0 0 0 2px var(--accent-soft)'
  };

  return (
    <div className="w-full">
      <input
        className={className}
        style={inputStyle}
        onFocus={(e) => {
          Object.assign(e.target.style, focusStyle);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-default)';
          e.target.style.boxShadow = 'none';
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

// Card Component - Implements .widget/.card classes
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
  const cardStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    position: 'relative' as const,
    ...style
  };

  return (
    <div
      className={`${variant} ${className}`.trim()}
      style={cardStyle}
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

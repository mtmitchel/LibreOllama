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
  const baseClass = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : 
                     variant === 'secondary' ? 'btn-secondary' :
                     variant === 'ghost' ? 'btn-ghost' :
                     variant === 'outline' ? 'btn-secondary' : // outline maps to secondary
                     '';
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
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

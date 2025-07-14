import React from 'react';
import { Text } from './index';

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'prominent' | 'subtle';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  switchClassName?: string;
  id?: string;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  icon,
  badge,
  className = '',
  switchClassName = '',
  id
}: ToggleRowProps) {
  const switchId = id || `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const sizeClasses = {
    sm: {
      container: 'py-2',
      switch: 'w-8 h-5',
      thumb: 'w-3 h-3',
      thumbTranslate: 'translate-x-3',
      icon: 'w-4 h-4',
      label: 'text-sm',
      description: 'text-xs'
    },
    md: {
      container: 'py-3',
      switch: 'w-10 h-6',
      thumb: 'w-4 h-4',
      thumbTranslate: 'translate-x-4',
      icon: 'w-5 h-5',
      label: 'text-base',
      description: 'text-sm'
    },
    lg: {
      container: 'py-4',
      switch: 'w-12 h-7',
      thumb: 'w-5 h-5',
      thumbTranslate: 'translate-x-5',
      icon: 'w-6 h-6',
      label: 'text-lg',
      description: 'text-base'
    }
  };

  const variantClasses = {
    default: {
      container: 'hover:bg-tertiary/30',
      switch: {
        on: 'bg-accent-primary',
        off: 'bg-tertiary'
      }
    },
    prominent: {
      container: 'bg-surface border border-border-default rounded-lg px-4 hover:border-border-primary hover:shadow-sm',
      switch: {
        on: 'bg-accent-primary',
        off: 'bg-tertiary'
      }
    },
    subtle: {
      container: 'hover:bg-tertiary/20',
      switch: {
        on: 'bg-success',
        off: 'bg-tertiary/60'
      }
    }
  };

  const sizes = sizeClasses[size];
  const variants = variantClasses[variant];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={`
        flex items-center justify-between
        ${sizes.container}
        ${variants.container}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        transition-all duration-150
        ${className}
      `}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={checked}
      aria-labelledby={`${switchId}-label`}
      aria-describedby={description ? `${switchId}-description` : undefined}
    >
      {/* Left side - Icon, Label, Description */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && (
          <div className={`shrink-0 ${sizes.icon} text-secondary`}>
            {icon}
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Text
              id={`${switchId}-label`}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'}
              weight="medium"
              className={`${disabled ? 'text-secondary' : 'text-primary'} truncate`}
            >
              {label}
            </Text>
            {badge && (
              <div className="shrink-0">
                {badge}
              </div>
            )}
          </div>
          
          {description && (
            <Text
              id={`${switchId}-description`}
              size={sizes.description.replace('text-', '') as 'xs' | 'sm' | 'base'}
              variant="secondary"
              className="mt-1 leading-relaxed"
            >
              {description}
            </Text>
          )}
        </div>
      </div>

      {/* Right side - Switch */}
      <div className="ml-4 shrink-0">
        <button
          type="button"
          className={`
            relative inline-flex items-center
            ${sizes.switch}
            ${checked ? variants.switch.on : variants.switch.off}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            focus:ring-accent-primary rounded-full border-2
            border-transparent transition-colors duration-200
            ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
            ${switchClassName}
          `}
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${switchId}-label`}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          <span className="sr-only">{checked ? 'Disable' : 'Enable'} {label}</span>
          <span
            className={`
              ${sizes.thumb}
              inline-block rounded-full bg-white shadow-sm
              ring-0 transition duration-200 ease-in-out
              ${checked ? sizes.thumbTranslate : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    </div>
  );
}

interface ToggleGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function ToggleGroup({
  children,
  title,
  description,
  className = ''
}: ToggleGroupProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {title && (
        <div className="mb-3">
          <Text size="lg" weight="semibold" className="mb-1 text-primary">
            {title}
          </Text>
          {description && (
            <Text size="sm" variant="secondary">
              {description}
            </Text>
          )}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

interface ToggleCardProps extends Omit<ToggleRowProps, 'variant'> {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function ToggleCard({
  title,
  subtitle,
  description,
  footer,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  icon,
  badge,
  className = '',
  switchClassName = '',
  id,
  ...props
}: ToggleCardProps) {
  return (
    <div
      className={`
        border-border-default rounded-lg border bg-surface p-4
        ${disabled ? 'opacity-50' : 'hover:border-border-primary hover:shadow-sm'}
        transition-all duration-200
        ${className}
      `}
    >
      <ToggleRow
        label={title}
        description={subtitle}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size={size}
        variant="subtle"
        icon={icon}
        badge={badge}
        switchClassName={switchClassName}
        id={id}
        className="py-0"
        {...props}
      />
      
      {description && (
        <div className="border-border-subtle mt-3 border-t pt-3">
          <Text size="sm" variant="secondary" className="leading-relaxed">
            {description}
          </Text>
        </div>
      )}
      
      {footer && (
        <div className="border-border-subtle mt-3 border-t pt-3">
          {footer}
        </div>
      )}
    </div>
  );
} 
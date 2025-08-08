import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Toggle Components
 * 
 * DLS Compliant Toggle controls following Asana patterns
 * - ToggleRow: Settings-style toggle with label and description
 * - ToggleGroup: Grouped toggle sections with titles
 * - ToggleCard: Card-based toggle for prominent features
 * - Toggle: Basic toggle switch component
 */

const toggleSwitchVariants = cva(
  `
    relative inline-flex
    rounded-full border-2 border-transparent
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    ease-in-out
    focus:outline-none
    focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    variants: {
      size: {
        sm: 'w-8 h-5',
        md: 'w-10 h-6',
        lg: 'w-12 h-7',
      },
      variant: {
        default: '',
        success: '',
        subtle: '',
      },
      checked: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Default variant
      {
        variant: 'default',
        checked: true,
        className: 'bg-[var(--brand-primary)]',
      },
      {
        variant: 'default',
        checked: false,
        className: 'bg-[var(--bg-muted)]',
      },
      // Success variant
      {
        variant: 'success',
        checked: true,
        className: 'bg-[var(--status-success)]',
      },
      {
        variant: 'success',
        checked: false,
        className: 'bg-[var(--bg-muted)]',
      },
      // Subtle variant
      {
        variant: 'subtle',
        checked: true,
        className: 'bg-[var(--status-success)]',
      },
      {
        variant: 'subtle',
        checked: false,
        className: 'bg-[var(--bg-subtle)]',
      },
    ],
    defaultVariants: {
      size: 'md',
      variant: 'default',
      checked: false,
    },
  }
);

const toggleThumbVariants = cva(
  `
    inline-block rounded-full
    bg-[var(--bg-surface)]
    shadow-[var(--shadow-sm)]
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    ease-in-out
  `,
  {
    variants: {
      size: {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
      },
      checked: {
        true: '',
        false: 'translate-x-0',
      },
    },
    compoundVariants: [
      {
        size: 'sm',
        checked: true,
        className: 'translate-x-3',
      },
      {
        size: 'md',
        checked: true,
        className: 'translate-x-4',
      },
      {
        size: 'lg',
        checked: true,
        className: 'translate-x-5',
      },
    ],
    defaultVariants: {
      size: 'md',
      checked: false,
    },
  }
);

/**
 * Basic Toggle Switch
 */
export interface ToggleProps extends VariantProps<typeof toggleSwitchVariants> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  id,
}) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      className={toggleSwitchVariants({ size, variant, checked, className })}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="sr-only">
        {checked ? 'Enabled' : 'Disabled'}
      </span>
      <span
        className={toggleThumbVariants({ size, checked })}
        aria-hidden="true"
      />
    </button>
  );
};

/**
 * Toggle Row - Settings-style toggle with label and description
 */
const toggleRowVariants = cva(
  `
    flex items-center justify-between
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    group
  `,
  {
    variants: {
      variant: {
        default: `
          py-[var(--space-3)]
          hover:bg-[var(--bg-muted)]
          cursor-pointer
        `,
        prominent: `
          bg-[var(--bg-surface)]
          border border-[var(--border-default)]
          rounded-[var(--radius-lg)]
          px-[var(--space-4)] py-[var(--space-3)]
          hover:border-[var(--border-focus)]
          hover:shadow-[var(--shadow-sm)]
          cursor-pointer
        `,
        subtle: `
          py-[var(--space-2-5)]
          hover:bg-[var(--bg-subtle)]
          cursor-pointer
        `,
        card: `
          p-[var(--space-4)]
          bg-[var(--bg-surface)]
          border border-[var(--border-default)]
          rounded-[var(--radius-lg)]
          hover:border-[var(--border-focus)]
          hover:shadow-[var(--shadow-sm)]
          cursor-pointer
        `,
      },
      size: {
        sm: 'gap-[var(--space-2)]',
        md: 'gap-[var(--space-3)]',
        lg: 'gap-[var(--space-4)]',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      disabled: false,
    },
  }
);

export interface ToggleRowProps extends VariantProps<typeof toggleRowVariants> {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  switchClassName?: string;
  switchVariant?: VariantProps<typeof toggleSwitchVariants>['variant'];
  id?: string;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
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
  switchVariant = 'default',
  id,
}) => {
  const switchId = id || `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleToggle();
    }
  };

  const sizeClasses = {
    sm: {
      icon: 'w-4 h-4',
      label: 'text-[var(--text-body)]',
      description: 'text-[var(--text-small)]',
    },
    md: {
      icon: 'w-5 h-5',
      label: 'text-[var(--text-body)]',
      description: 'text-[var(--text-small)]',
    },
    lg: {
      icon: 'w-6 h-6',
      label: 'text-[var(--text-large)]',
      description: 'text-[var(--text-body)]',
    },
  };

  const sizes = sizeClasses[size || 'md'];

  return (
    <div
      className={toggleRowVariants({ variant, size, disabled, className })}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={checked}
      aria-labelledby={`${switchId}-label`}
      aria-describedby={description ? `${switchId}-description` : undefined}
    >
      {/* Left side - Icon, Label, Description */}
      <div className="flex min-w-0 flex-1 items-center gap-[var(--space-3)]">
        {icon && (
          <div className={`shrink-0 ${sizes.icon} text-[var(--text-secondary)]`}>
            {icon}
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--space-2)]">
            <h4
              id={`${switchId}-label`}
              className={`
                font-medium truncate
                ${sizes.label}
                ${disabled ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}
              `}
            >
              {label}
            </h4>
            {badge && (
              <div className="shrink-0">
                {badge}
              </div>
            )}
          </div>
          
          {description && (
            <p
              id={`${switchId}-description`}
              className={`
                mt-[var(--space-1)]
                leading-relaxed
                ${sizes.description}
                text-[var(--text-secondary)]
              `}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Toggle Switch */}
      <div className="ml-[var(--space-4)] shrink-0">
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size={size}
          variant={switchVariant}
          className={switchClassName}
          aria-labelledby={`${switchId}-label`}
          aria-describedby={description ? `${switchId}-description` : undefined}
        />
      </div>
    </div>
  );
};

/**
 * Toggle Group - Container for related toggles
 */
export interface ToggleGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  children,
  title,
  description,
  className = '',
  spacing = 'normal',
}) => {
  const spacingClasses = {
    tight: 'space-y-[var(--space-1)]',
    normal: 'space-y-[var(--space-2)]',
    loose: 'space-y-[var(--space-4)]',
  };

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-[var(--space-4)]">
          {title && (
            <h3 className="text-[var(--text-large)] font-semibold text-[var(--text-primary)] mb-[var(--space-1)]">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-[var(--text-small)] text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={spacingClasses[spacing]}>
        {children}
      </div>
    </div>
  );
};

/**
 * Toggle Card - Card-based toggle for prominent features
 */
export interface ToggleCardProps extends Omit<ToggleRowProps, 'variant' | 'label'> {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const ToggleCard: React.FC<ToggleCardProps> = ({
  title,
  subtitle,
  description,
  footer,
  children,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  icon,
  badge,
  className = '',
  switchClassName = '',
  switchVariant = 'default',
  id,
}) => {
  return (
    <div
      className={`
        border border-[var(--border-default)]
        rounded-[var(--radius-lg)]
        bg-[var(--bg-surface)]
        p-[var(--space-4)]
        transition-[var(--transition-property)]
        duration-[var(--transition-duration)]
        ${disabled 
          ? 'opacity-50' 
          : 'hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-sm)]'
        }
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
        variant="card"
        icon={icon}
        badge={badge}
        switchClassName={switchClassName}
        switchVariant={switchVariant}
        id={id}
        className="p-0"
      />
      
      {description && (
        <div className="mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--border-subtle)]">
          <p className="text-[var(--text-small)] text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {children && (
        <div className="mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--border-subtle)]">
          {children}
        </div>
      )}
      
      {footer && (
        <div className="mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--border-subtle)]">
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * Toggle Button - Button-style toggle for toolbar usage
 */
export interface ToggleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}

const toggleButtonVariants = cva(
  `
    inline-flex items-center justify-center
    font-medium
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    focus:outline-none
    focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
  `,
  {
    variants: {
      variant: {
        default: `
          bg-[var(--bg-surface)]
          border border-[var(--border-default)]
          text-[var(--text-primary)]
          hover:bg-[var(--bg-secondary)]
          data-[state=on]:bg-[var(--brand-primary)]
          data-[state=on]:text-[var(--text-on-brand)]
          data-[state=on]:border-[var(--brand-primary)]
        `,
        outline: `
          border border-[var(--border-default)]
          bg-transparent
          text-[var(--text-primary)]
          hover:bg-[var(--bg-secondary)]
          data-[state=on]:bg-[var(--brand-subtle)]
          data-[state=on]:text-[var(--brand-primary)]
          data-[state=on]:border-[var(--brand-primary)]
        `,
        ghost: `
          bg-transparent
          text-[var(--text-primary)]
          hover:bg-[var(--bg-secondary)]
          data-[state=on]:bg-[var(--brand-subtle)]
          data-[state=on]:text-[var(--brand-primary)]
        `,
      },
      size: {
        sm: `
          h-8 px-[var(--space-2)]
          text-[var(--text-small)]
          rounded-[var(--radius-sm)]
        `,
        md: `
          h-9 px-[var(--space-3)]
          text-[var(--text-body)]
          rounded-[var(--radius-md)]
        `,
        lg: `
          h-10 px-[var(--space-4)]
          text-[var(--text-body)]
          rounded-[var(--radius-md)]
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  pressed,
  onPressedChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
  children,
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      disabled={disabled}
      data-state={pressed ? 'on' : 'off'}
      className={toggleButtonVariants({ variant, size, className })}
      onClick={() => !disabled && onPressedChange(!pressed)}
    >
      {children}
    </button>
  );
};
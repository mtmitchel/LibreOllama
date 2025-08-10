// UI Components using LibreOllama Design System CSS Variables
import React from 'react';

// Typography Components
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function Heading({ level = 1, children, className = '', ...props }: HeadingProps) {
  const levelStyles = {
    1: 'asana-text-2xl font-bold leading-tight',
    2: 'asana-text-xl font-semibold leading-tight',
    3: 'asana-text-lg font-semibold leading-snug',
    4: 'asana-text-base font-semibold leading-snug'
  };
  
  const classes = `text-primary font-sans ${levelStyles[level]} ${className}`.trim();
  
  switch (level) {
    case 1:
      return <h1 className={classes} {...props}>{children}</h1>;
    case 2:
      return <h2 className={classes} {...props}>{children}</h2>;
    case 3:
      return <h3 className={classes} {...props}>{children}</h3>;
    case 4:
      return <h4 className={classes} {...props}>{children}</h4>;
    default:
      return <h1 className={classes} {...props}>{children}</h1>;
  }
}

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'body' | 'secondary' | 'tertiary' | 'muted' | 'caption';
  size?: 'xs' | 'sm' | 'base' | 'lg' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight?: 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
  font?: 'sans' | 'mono';
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'label';
}

export function Text({ 
  variant = 'body', 
  size = 'base',
  weight = 'normal',
  lineHeight,
  font = 'sans',
  children, 
  className = '',
  as = 'p',
  ...props 
}: TextProps) {
  const variantClasses = {
    body: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    muted: 'text-muted',
    caption: 'text-secondary'
  };
  
  const sizeClasses = {
    xs: 'text-[12px]',
    sm: 'asana-text-sm',
    base: 'asana-text-base',
    lg: 'asana-text-lg',
    '2xl': 'asana-text-2xl',
    '3xl': 'asana-text-2xl'
  } as const;
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const lineHeightClasses = {
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose'
  };
  
  const fontClasses = {
    sans: 'font-sans',
    mono: 'font-mono'
  };
  
  // Auto line-height based on size if not specified
  const autoLineHeight = lineHeight || (size === 'xs' || size === 'sm' ? 'normal' : size === 'lg' || size === '2xl' || size === '3xl' ? 'relaxed' : 'normal');
  
  const classes = `
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${weightClasses[weight]}
    ${lineHeightClasses[autoLineHeight]}
    ${fontClasses[font]}
    ${className}
  `.trim();
  
  switch (as) {
    case 'span':
      return <span className={classes} {...props}>{children}</span>;
    case 'div':
      return <div className={classes} {...props}>{children}</div>;
    case 'label':
      return <label className={classes} {...props}>{children}</label>;
    default:
      return <p className={classes} {...props}>{children}</p>;
  }
}

interface CaptionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export function Caption({ children, className = '', as = 'p', ...props }: CaptionProps) {
  const classes = `text-[11px] text-muted font-normal font-sans leading-loose ${className}`.trim();
  
  switch (as) {
    case 'span':
      return <span className={classes} {...props}>{children}</span>;
    case 'div':
      return <div className={classes} {...props}>{children}</div>;
    default:
      return <p className={classes} {...props}>{children}</p>;
  }
}

// Re-export Button from design system
export { Button, type ButtonProps } from './design-system/Button';

// Input Component - Uses Tailwind utilities with design system variables
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hasIcon?: boolean;
  label?: string;
  description?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  className = '', 
  error, 
  hasIcon,
  label,
  description,
  style,
  id,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionId = description ? `${inputId}-description` : undefined;
  
  const baseClasses = 'w-full bg-input-bg border border-border-default rounded-md font-sans text-primary transition-all duration-150 placeholder:text-input-placeholder focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-secondary';
  
  const paddingClasses = hasIcon ? 'py-3 pr-10 pl-4' : 'py-3 px-4';
  
  const stateClasses = error 
    ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
    : 'focus:border-input-focus-ring focus:ring-2 focus:ring-primary/20';

  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="mb-1 block asana-text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      {description && (
        <p 
          id={descriptionId}
          className="mb-2 asana-text-sm text-secondary"
        >
          {description}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${baseClasses} ${paddingClasses} ${stateClasses} asana-text-sm ${className}`.trim()}
        style={style}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        onFocus={(e) => {
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p 
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            marginTop: 'var(--space-1)',
            fontSize: 'var(--text-[11px])',
            color: 'var(--status-error)'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Re-export Card component from design system
export { 
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  type CardProps, type CardHeaderProps, type CardTitleProps, type CardContentProps, type CardFooterProps
} from './design-system/Card';

// AddNewCard Component - Standardized pattern for "add new" actions
interface AddNewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  minHeight?: string;
}

export function AddNewCard({ 
  title, 
  description, 
  icon,
  onAdd,
  minHeight = '280px',
  className = '',
  ...props 
}: AddNewCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div
      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center text-center border-2 border-dashed border-default hover:border-accent-primary hover:bg-accent-soft bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 rounded-lg p-6 ${className}`.trim()}
      style={{ minHeight, ...props.style }}
      onClick={onAdd}
      tabIndex={0}
      role="button"
      aria-label={title}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-muted">
          {icon}
        </div>
      )}
      <h3 className="mb-2 asana-text-base font-semibold text-primary">
        {title}
      </h3>
      {description && (
        <p className="asana-text-sm text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

// Badge is re-exported from design system above

// Progress Component
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({ value, max = 100, className = '', ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div
      className={`w-full bg-tertiary rounded-full h-2 ${className}`.trim()}
      {...props}
    >
      <div
        className="h-2 rounded-full bg-accent-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };
  
  const colorClasses = {
    primary: 'border-accent-primary border-t-transparent',
    secondary: 'border-accent-secondary border-t-transparent',
    success: 'border-success border-t-transparent',
    error: 'border-error border-t-transparent',
    warning: 'border-warning border-t-transparent'
  };
  
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`.trim()}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Import Button from design system for LoadingButton
import { Button } from './design-system/Button';

// Loading Button Component - wrapper around design system Button
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'icon';
  children: React.ReactNode;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(({ 
  isLoading = false, 
  loadingText,
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  disabled,
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      disabled={isLoading || disabled}
      className={`${isLoading ? 'cursor-not-allowed' : ''} ${className}`.trim()}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
});

LoadingButton.displayName = 'LoadingButton';

// Loading State Component
interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingState({ size = 'md', text = 'Loading...', className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`.trim()}>
      <Spinner size={size} className="mb-3" />
      <p className="asana-text-sm font-medium text-secondary">{text}</p>
    </div>
  );
}

// Enhanced Skeleton Component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with wave animation
    none: ''
  };
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };
  
  return (
    <div
      className={`bg-secondary ${variantClasses[variant]} ${animationClasses[animation]} ${className}`.trim()}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, style, ...props }, ref) => {
    const baseClasses = 'w-full bg-input-bg border border-border-primary rounded-md font-sans asana-text-sm text-text-primary transition-all duration-150 placeholder:text-text-secondary focus:outline-none resize-vertical min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-secondary';
    
    const stateClasses = error 
      ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
      : 'focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20';

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`${baseClasses} ${stateClasses} py-3 px-4 ${className}`.trim()}
          style={style}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[11px] text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';


// Tabs Components
interface TabsContextProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | null>(null);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}


export function Tabs({ defaultValue = '', value, onValueChange, children, className = '' }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex h-10 items-center justify-center rounded-md bg-tertiary p-1 text-secondary ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within a Tabs component');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      onClick={() => setActiveTab(value)}
      className={`ring-offset-bg-primary inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 asana-text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-primary text-primary shadow-sm' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within a Tabs component');
  
  return context.activeTab === value ? (
    <div 
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`mt-2 ${className}`}
    >
      {children}
    </div>
  ) : null;
}

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({ 
  label, 
  description,
  error,
  className = '', 
  onCheckedChange, 
  onChange, 
  id,
  ...props 
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${checkboxId}-error` : undefined;
  const descriptionId = description ? `${checkboxId}-description` : undefined;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex size-5 items-center justify-center">
          <input
            id={checkboxId}
            type="checkbox"
            className={`border-border-default focus:ring-accent-primary size-4 rounded-sm text-accent-primary focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-error' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy}
            onChange={handleChange}
            {...props}
          />
        </div>
        <div className="flex-1">
          {label && (
            <label 
              htmlFor={checkboxId} 
              className="block cursor-pointer asana-text-sm font-medium leading-none text-primary"
            >
              {label}
            </label>
          )}
          {description && (
            <p 
              id={descriptionId}
              className="mt-1 asana-text-sm text-secondary"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p 
          id={errorId}
          role="alert"
          aria-live="polite"
          className="ml-8 asana-text-sm text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Alert Component
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  className = '',
  dismissible = false,
  onDismiss
}: AlertProps) {
  const variantClasses = {
    info: 'border-accent-primary/20 bg-accent-soft text-accent-primary',
    success: 'border-success/20 bg-success/10 text-success',
    warning: 'border-warning/20 bg-warning/10 text-warning',
    error: 'border-error/20 bg-error/10 text-error'
  };
  
  const iconMap = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return (
    <div
      className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`.trim()}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 asana-text-lg" aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="mb-1 font-medium">{title}</h4>
          )}
          <div className="asana-text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="focus:ring-accent-primary ml-2 shrink-0 rounded-sm text-current transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// Toast is re-exported from design system above

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ErrorState({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  retryText = 'Try again',
  className = '',
  size = 'md'
}: ErrorStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12'
  };
  
  const iconSizes = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`.trim()}>
      <div className={`${iconSizes[size]} mb-4`} role="img" aria-label="Error">
        😞
      </div>
      <h3 className="mb-2 asana-text-lg font-semibold text-primary">
        {title}
      </h3>
      <p className="mb-4 max-w-md asana-text-sm text-secondary">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          {retryText}
        </Button>
      )}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ 
  title = 'No data available',
  message = 'There is no content to display at the moment.',
  action,
  icon = '📭',
  className = '',
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12'
  };
  
  const iconSizes = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`.trim()}>
      <div className={`${iconSizes[size]} mb-4`} role="img" aria-label="Empty state">
        {icon}
      </div>
      <h3 className="mb-2 asana-text-lg font-semibold text-primary">
        {title}
      </h3>
      <p className="mb-4 max-w-md asana-text-sm text-secondary">
        {message}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// StatusBadge is re-exported from design system Badge module above 

// Re-export design system components
export { 
  Tag, HashTag, ColorTag, TagGroup, TagInput,
  type TagProps, type HashTagProps, type ColorTagProps, type TagGroupProps, type TagInputProps
} from './design-system/Tag';

export { 
  Avatar, AvatarGroup, UserAvatar, BotAvatar, TeamAvatar,
  type AvatarProps, type AvatarGroupProps, type UserAvatarProps, type BotAvatarProps, type TeamAvatarProps
} from './design-system/Avatar';

export { 
  ProgressRing, ProgressBar, LoadingSpinner, ProgressSteps,
  type ProgressRingProps, type ProgressBarProps, type LoadingSpinnerProps, type ProgressStepsProps
} from './design-system/ProgressRing';

export { 
  Stepper, StepProgress, MiniStepper,
  type StepperStep, type StepperProps, type StepProgressProps, type MiniStepperProps
} from './design-system/Stepper';

export { 
  HeatMapCalendar, ActivityCalendar,
  type HeatMapData, type HeatMapCalendarProps, type ActivityCalendarProps
} from './design-system/HeatMapCalendar';

export { 
  Tooltip, KeyboardTooltip, InfoTooltip,
  type TooltipProps, type TooltipPlacement
} from './design-system/Tooltip';

export { 
  ContextMenu, ContextMenuTrigger, useContextMenu,
  type ContextMenuItem, type ContextMenuProps, type ContextMenuTriggerProps
} from './design-system/ContextMenu';

export { 
  ConfirmDialog, useConfirmDialog, confirmDelete, confirmDiscard, confirmLogout,
  type ConfirmDialogProps
} from './design-system/ConfirmDialog';

export {
  FilterDropdown, FilterButton, FilterBar,
  type FilterOption, type FilterDropdownProps, type FilterButtonProps, type FilterBarProps
} from './design-system/FilterDropdown';

export {
  Badge, CountBadge, StatusBadge, BadgeGroup,
  type BadgeProps, type CountBadgeProps, type StatusBadgeProps, type BadgeGroupProps
} from './design-system/Badge';

export {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, SimpleDialog,
  type DialogProps, type DialogContentProps, type DialogFooterProps, type SimpleDialogProps
} from './design-system/Dialog';

export {
  Popover, PopoverContent, PopoverHeader, PopoverFooter,
  type PopoverProps, type PopoverPlacement
} from './design-system/Popover';

export {
  Select, NativeSelect,
  type SelectProps, type SelectOption
} from './design-system/Select';

export {
  ToastProvider, useToast, toast, showToast, useRegisterGlobalToast,
  type ToastVariant, type ToastData, type ToastProviderProps
} from './design-system/Toast';

export {
  Toggle, ToggleRow, ToggleGroup, ToggleCard, ToggleButton,
  type ToggleProps, type ToggleRowProps, type ToggleGroupProps, type ToggleCardProps, type ToggleButtonProps
} from './design-system/Toggle';

// Export unique components that don't have design-system equivalents
export { FlexibleGrid } from './FlexibleGrid';
export { ColorSwatch, ColorPalette } from './ColorSwatch';
export { DragOverlay, LiftedCard, DragPreview, DropZone, DragIndicator } from './DragOverlay';
export { TypingIndicator, ChatTypingIndicator, SimpleTypingDots } from './TypingIndicator';
export { FloatingActionButton, FloatingActionMenu } from './FloatingActionButton';
export { ConfirmationModal } from './ConfirmationModal';

// Export Kanban components
export { KanbanBoard, KanbanColumn, TaskListView } from '../kanban';

// Export other components
export { SyncStatus } from '../SyncStatus';

// DropdownMenu legacy wrapper removed; use design-system Dropdown/ActionMenu

// Export layout primitives from design system
export {
  Stack, VStack, HStack, Divider, Spacer, FormStack, ListStack, ButtonGroup,
  type StackProps, type VStackProps, type HStackProps, type DividerProps, type SpacerProps, type FormStackProps, type ListStackProps, type ButtonGroupProps
} from './design-system/Stack';

export {
  Grid, GridItem, CardGrid, DashboardGrid, SidebarLayout, MasonryGrid, AutoGrid,
  type GridProps, type GridItemProps, type CardGridProps, type DashboardGridProps, type SidebarLayoutProps, type MasonryGridProps, type AutoGridProps
} from './design-system/Grid';

export {
  Box, Center, Square, Circle, Flex, AspectRatio,
  type BoxProps, type CenterProps, type SquareProps, type CircleProps, type FlexProps, type AspectRatioProps
} from './design-system/Box';

export {
  Container, Section, Article, Hero,
  type ContainerProps, type SectionProps, type ArticleProps, type HeroProps
} from './design-system/Container';

export {
  FormControl, FormLabel, FormHelperText, FormErrorMessage, FormSuccessMessage, FormHint, FormInput, FormTextarea, FormGroup, useFormControl,
  type FormControlProps, type FormLabelProps, type FormHelperTextProps, type FormErrorMessageProps, type FormSuccessMessageProps, type FormHintProps, type FormInputProps, type FormTextareaProps, type FormGroupProps
} from './design-system/FormControl';

// Export new design system components
export { default as WidgetHeader, type WidgetHeaderProps } from './design-system/WidgetHeader';
export { default as Tile, type TileProps } from './design-system/Tile';
export { default as ListItem, type ListItemProps } from './design-system/ListItem';
export { default as Page, type PageProps } from './design-system/Page';
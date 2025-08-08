// UI Components using LibreOllama Design System CSS Variables
import React from 'react';
import './ui-asana.css';

// Typography Components
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function Heading({ level = 1, children, className = '', ...props }: HeadingProps) {
  const levelStyles = {
    1: 'text-3xl font-bold leading-tight',
    2: 'text-2xl font-semibold leading-tight',
    3: 'text-xl font-semibold leading-snug',
    4: 'text-lg font-semibold leading-snug'
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
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };
  
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
  const classes = `text-xs text-muted font-normal font-sans leading-loose ${className}`.trim();
  
  switch (as) {
    case 'span':
      return <span className={classes} {...props}>{children}</span>;
    case 'div':
      return <div className={classes} {...props}>{children}</div>;
    default:
      return <p className={classes} {...props}>{children}</p>;
  }
}

// Button Component - Uses Tailwind utilities with design system variables
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'default';
  size?: 'sm' | 'default' | 'icon';
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'secondary',
  size = 'default',
  children,
  isLoading = false,
  loadingText,
  disabled,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border-none rounded-md font-sans font-medium leading-none cursor-pointer transition-all duration-150 no-underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-primary';
  
  const variantClasses = {
    primary: 'bg-accent-primary text-white hover:bg-accent-secondary active:bg-accent-secondary active:scale-95 shadow-sm hover:shadow-md active:shadow-sm',
    secondary: 'bg-tertiary text-primary border border-primary hover:bg-secondary active:bg-tertiary active:scale-95 shadow-sm hover:shadow-md active:shadow-sm',
    ghost: 'bg-transparent text-primary hover:bg-tertiary active:bg-secondary active:scale-95 hover:text-primary',
    outline: 'bg-transparent text-primary border border-primary hover:bg-tertiary active:bg-secondary active:scale-95 shadow-sm hover:shadow-md active:shadow-sm',
    destructive: 'bg-transparent text-error border border-error hover:bg-error hover:text-white active:bg-error active:scale-95 focus:ring-error',
    default: 'bg-tertiary text-primary border border-primary hover:bg-secondary active:bg-tertiary active:scale-95 shadow-sm hover:shadow-md active:shadow-sm'
  };
  
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    default: 'py-2.5 px-4 text-sm',
    icon: 'p-2.5 w-11 h-11 flex items-center justify-center [&>svg]:align-middle'
  };

  const isDisabled = disabled || isLoading;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && props.onClick) {
      e.stopPropagation();
      props.onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${isLoading ? 'cursor-not-allowed' : ''} relative z-10 ${className}`.trim()}
      style={{ pointerEvents: isDisabled ? 'none' : 'auto', ...props.style }}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      {...props}
      onClick={handleClick}
    >
      {isLoading && (
        <div
          className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
});

Button.displayName = 'Button';

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
          className="mb-1 block text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      {description && (
        <p 
          id={descriptionId}
          className="mb-2 text-sm text-secondary"
        >
          {description}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${baseClasses} ${paddingClasses} ${stateClasses} text-sm ${className}`.trim()}
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
            fontSize: 'var(--text-xs)',
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

// Card Component - Uses Tailwind utilities with design system variables
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

export function Card({ 
  className = '', 
  children, 
  padding = 'default',
  style,
  ...props 
}: CardProps) {
  const baseClasses = 'bg-tertiary border border-default rounded-lg relative shadow-sm hover:shadow-md transition-shadow duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

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
      <h3 className="mb-2 text-base font-semibold text-primary">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

// Badge Component - Uses design system variables
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function Badge({ 
  variant = 'default', 
  className = '', 
  children, 
  style,
  ...props 
}: BadgeProps) {  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return 'bg-success text-success-fg';
      case 'warning':
        return 'bg-warning text-warning-fg';
      case 'error':
        return 'bg-error text-error-fg';
      case 'accent':
        return 'bg-accent-primary text-white';
      case 'secondary':
        return 'bg-bg-elevated text-text-primary';
      case 'outline':
        return 'bg-transparent text-text-secondary border border-border-default';
      default:
        return 'bg-bg-secondary text-text-secondary';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl px-2 py-1 text-xs font-medium ${getVariantStyle()} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}

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

// Loading Button Component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'default';
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
      <p className="text-sm font-medium text-secondary">{text}</p>
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
    const baseClasses = 'w-full bg-input-bg border border-border-primary rounded-md font-sans text-sm text-text-primary transition-all duration-150 placeholder:text-text-secondary focus:outline-none resize-vertical min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-secondary';
    
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
          <p className="mt-1 text-xs text-error">
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
      className={`ring-offset-bg-primary inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-primary text-primary shadow-sm' : ''} ${className}`}
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
              className="block cursor-pointer text-sm font-medium leading-none text-primary"
            >
              {label}
            </label>
          )}
          {description && (
            <p 
              id={descriptionId}
              className="mt-1 text-sm text-secondary"
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
          className="ml-8 text-sm text-error"
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
        <span className="shrink-0 text-lg" aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="mb-1 font-medium">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
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

// Toast Component
interface ToastProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ 
  variant = 'info', 
  title, 
  message, 
  duration = 5000,
  onDismiss,
  className = ''
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Allow fade out animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);
  
  const variantClasses = {
    info: 'border-accent-primary/20 bg-surface text-primary',
    success: 'border-success/20 bg-surface text-primary',
    warning: 'border-warning/20 bg-surface text-primary',
    error: 'border-error/20 bg-surface text-primary'
  };
  
  const iconClasses = {
    info: 'text-accent-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  };
  
  const iconMap = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        border rounded-lg p-4 shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${variantClasses[variant]} ${className}
      `.trim()}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 text-lg ${iconClasses[variant]}`} aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="mb-1 font-medium">{title}</h4>
          )}
          <p className="text-sm text-secondary">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="ml-2 shrink-0 rounded-sm text-muted transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

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
      <h3 className="mb-2 text-lg font-semibold text-primary">
        {title}
      </h3>
      <p className="mb-4 max-w-md text-sm text-secondary">
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
      <h3 className="mb-2 text-lg font-semibold text-primary">
        {title}
      </h3>
      <p className="mb-4 max-w-md text-sm text-secondary">
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

// Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ 
  status, 
  children, 
  className = '',
  size = 'md'
}: StatusBadgeProps) {
  const statusClasses = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    info: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
    pending: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };
  
  const indicators = {
    success: '●',
    warning: '●',
    error: '●',
    info: '●',
    pending: '○'
  };
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 border rounded-full font-medium
        ${statusClasses[status]} ${sizeClasses[size]} ${className}
      `.trim()}
    >
      <span aria-hidden="true">{indicators[status]}</span>
      {children}
    </span>
  );
} 

// Export the Tag component
export { Tag } from './Tag';

// Export the Avatar component
export { Avatar } from './Avatar';

// Export the FlexibleGrid component
export { FlexibleGrid } from './FlexibleGrid';

// Export the ProgressRing component
export { ProgressRing } from './ProgressRing';

// Export the Stepper component
export { Stepper } from './Stepper';
export type { StepperStep } from './Stepper';

// Export the ColorSwatch component
export { ColorSwatch, ColorPalette } from './ColorSwatch';

// Export the HeatMapCalendar component
export { HeatMapCalendar } from './HeatMapCalendar';
export type { HeatMapData } from './HeatMapCalendar';

// Export the DragOverlay components
export { DragOverlay, LiftedCard, DragPreview, DropZone, DragIndicator } from './DragOverlay';

// Export the TypingIndicator components
export { TypingIndicator, ChatTypingIndicator, SimpleTypingDots } from './TypingIndicator';

// Export the ToggleRow components
export { ToggleRow, ToggleGroup, ToggleCard } from './ToggleRow';

// Export the Tooltip components
export { Tooltip, TooltipTrigger, TruncatedText } from './Tooltip';

// Export the Kanban components
export { KanbanBoard, KanbanColumn, TaskListView } from '../kanban';

// Export other UI components
export { ContextMenu } from './ContextMenu';
export { ConfirmDialog } from './ConfirmDialog';
export { SyncStatus } from '../SyncStatus';
export { FloatingActionButton, FloatingActionMenu } from './FloatingActionButton';
export { ConfirmationModal } from './ConfirmationModal';
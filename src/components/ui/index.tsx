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
    1: 'text-3xl font-bold leading-tight',
    2: 'text-2xl font-semibold leading-tight',
    3: 'text-xl font-semibold leading-snug',
    4: 'text-lg font-semibold leading-snug'
  };
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      className={`text-primary font-sans ${levelStyles[level]} ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
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
  
  const Tag = as;
  
  return (
    <Tag
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${weightClasses[weight]}
        ${lineHeightClasses[autoLineHeight]}
        ${fontClasses[font]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface CaptionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export function Caption({ children, className = '', as = 'p', ...props }: CaptionProps) {
  const Tag = as;
  
  return (
    <Tag
      className={`text-xs text-muted font-normal font-sans leading-loose ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Button Component - Uses Tailwind utilities with design system variables
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'default';
  size?: 'sm' | 'default' | 'icon';
  children: React.ReactNode;
}

export function Button({
  className = '',
  variant = 'secondary',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border-none rounded-[var(--radius-md)] font-[var(--font-sans)] font-[var(--font-weight-medium)] leading-none cursor-pointer transition-all duration-150 no-underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]';
  
  const variantClasses = {
    primary: 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] active:bg-[var(--accent-secondary)] active:scale-95 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] active:shadow-sm',
    secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-surface)] active:scale-95 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] active:shadow-sm',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-surface)] active:scale-95 hover:text-[var(--text-primary)]',
    outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-surface)] active:scale-95 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] active:shadow-sm',
    destructive: 'bg-transparent text-[var(--error)] border border-[var(--error)] hover:bg-[var(--error)] hover:text-[var(--error-fg)] active:bg-[var(--error)] active:scale-95 focus:ring-[var(--error)]',
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-surface)] active:scale-95 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] active:shadow-sm'
  };
  
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    default: 'py-2.5 px-4 text-sm',
    icon: 'p-2.5 w-11 h-11 flex items-center justify-center [&>svg]:align-middle'
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
  const baseClasses = 'w-full bg-input-bg border border-border-default rounded-md font-sans text-primary transition-all duration-150 placeholder:text-input-placeholder focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-secondary';
  
  const paddingClasses = hasIcon ? 'py-3 pr-10 pl-4' : 'py-3 px-4';
  
  const stateClasses = error 
    ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
    : 'focus:border-input-focus-ring focus:ring-2 focus:ring-primary/20';

  return (
    <div className="w-full">
      <input
        className={`${baseClasses} ${paddingClasses} ${stateClasses} text-sm ${className}`.trim()}
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
          fontSize: 'var(--font-size-xs)',
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
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

export function Card({ 
  className = '', 
  children, 
  variant = 'card',
  padding = 'default',
  style,
  ...props 
}: CardProps) {
  const baseClasses = 'bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] relative shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-[var(--space-3)]',
    default: 'p-[var(--space-6)]',
    lg: 'p-[var(--space-8)]'
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
      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center text-center border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-ghost)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 rounded-[var(--radius-lg)] p-[var(--space-6)] ${className}`.trim()}
      style={{ minHeight, ...props.style }}
      onClick={onAdd}
      tabIndex={0}
      role="button"
      aria-label={title}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {icon && (
        <div className="text-[var(--text-muted)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-base">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)]">
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
      className={`w-full bg-[var(--bg-tertiary)] rounded-full h-[var(--space-2)] ${className}`.trim()}
      {...props}
    >
      <div
        className="bg-[var(--accent-primary)] h-[var(--space-2)] rounded-full transition-all duration-300"
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
    sm: 'w-[var(--space-4)] h-[var(--space-4)] border-2',
    md: 'w-[var(--space-6)] h-[var(--space-6)] border-2',
    lg: 'w-[var(--space-8)] h-[var(--space-8)] border-3'
  };
  
  const colorClasses = {
    primary: 'border-[var(--accent-primary)] border-t-transparent',
    secondary: 'border-[var(--accent-secondary)] border-t-transparent',
    success: 'border-[var(--success)] border-t-transparent',
    error: 'border-[var(--error)] border-t-transparent',
    warning: 'border-[var(--warning)] border-t-transparent'
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

export function LoadingButton({ 
  isLoading = false, 
  loadingText,
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
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
}

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
      <p className="text-[var(--text-secondary)] text-sm font-medium">{text}</p>
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
      className={`bg-[var(--bg-secondary)] ${variantClasses[variant]} ${animationClasses[animation]} ${className}`.trim()}
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
    const baseClasses = 'w-full bg-[var(--input-bg)] border border-[var(--border-default)] rounded-md font-sans text-sm text-[var(--text-primary)] transition-all duration-150 placeholder:text-[var(--input-placeholder)] focus:outline-none resize-vertical min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]';
    
    const stateClasses = error 
      ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-error/20'
      : 'focus:border-input-focus-ring focus:ring-2 focus:ring-primary/20';

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`${baseClasses} ${stateClasses} py-3 px-4 ${className}`.trim()}
          style={style}
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
      className={`inline-flex h-10 items-center justify-center rounded-md bg-[var(--bg-tertiary)] p-1 text-[var(--text-secondary)] ${className}`}
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
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-primary text-primary shadow-sm' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within a Tabs component');
  
  return context.activeTab === value ? <div className={`mt-2 ${className}`}>{children}</div> : null;
}

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({ label, className = '', onCheckedChange, onChange, ...props }: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-11 h-11">
        <input
          type="checkbox"
          className={`h-4 w-4 rounded-sm border-border-default text-accent-primary focus:ring-accent-primary focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          onChange={handleChange}
          {...props}
        />
      </div>
      {label && (
        <label htmlFor={props.id} className="text-sm font-medium leading-none text-primary cursor-pointer">
          {label}
        </label>
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
    info: 'border-[var(--accent-primary)]/20 bg-[var(--accent-soft)] text-[var(--accent-primary)]',
    success: 'border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]',
    error: 'border-[var(--error)]/20 bg-[var(--error)]/10 text-[var(--error)]'
  };
  
  const iconMap = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return (
    <div
      className={`border rounded-[var(--radius-lg)] p-[var(--space-4)] ${variantClasses[variant]} ${className}`.trim()}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-[var(--space-3)]">
        <span className="text-[var(--font-size-lg)] flex-shrink-0" aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="font-[var(--font-weight-medium)] mb-[var(--space-1)]">{title}</h4>
          )}
          <div className="text-[var(--font-size-sm)]">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-[var(--space-2)] text-current hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] rounded-[var(--radius-sm)]"
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
    info: 'border-[var(--accent-primary)]/20 bg-[var(--bg-elevated)] text-[var(--text-primary)]',
    success: 'border-[var(--success)]/20 bg-[var(--bg-elevated)] text-[var(--text-primary)]',
    warning: 'border-[var(--warning)]/20 bg-[var(--bg-elevated)] text-[var(--text-primary)]',
    error: 'border-[var(--error)]/20 bg-[var(--bg-elevated)] text-[var(--text-primary)]'
  };
  
  const iconClasses = {
    info: 'text-[var(--accent-primary)]',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    error: 'text-[var(--error)]'
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
        <span className={`text-lg flex-shrink-0 ${iconClasses[variant]}`} aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="flex-shrink-0 ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
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
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md">
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
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md">
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
    success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
    error: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20',
    info: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
    pending: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20'
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
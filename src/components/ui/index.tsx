// UI Components using LibreOllama Design System CSS Variables
import React from 'react';

// Button Component - Uses Tailwind utilities with design system variables
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default';
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
  const baseClasses = 'inline-flex items-center justify-center gap-2 border-none rounded-md font-sans font-medium leading-none cursor-pointer transition-all duration-150 no-underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
    primary: 'bg-primary text-white hover:bg-secondary',
    secondary: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    outline: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated',
    default: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated'
  };
    const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    default: 'py-3 px-4 text-sm',
    icon: 'p-2 w-9 h-9 flex items-center justify-center'
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
  const baseClasses = 'bg-bg-surface border border-border-subtle rounded-lg relative';
  
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
      case 'secondary':
        return {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)'
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)'
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

// Progress Component
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({ value, max = 100, className = '', ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div
      className={`w-full bg-bg-tertiary rounded-full h-2 ${className}`.trim()}
      {...props}
    >
      <div
        className="bg-accent-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, style, ...props }, ref) => {
    const baseClasses = 'w-full bg-input-bg border border-border-default rounded-md font-sans text-sm text-text-primary transition-all duration-150 placeholder:text-input-placeholder focus:outline-none resize-vertical min-h-[80px]';
    
    const stateClasses = error 
      ? 'border-error focus:border-error focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]'
      : 'focus:border-input-focus-ring focus:shadow-[0_0_0_2px_var(--accent-soft)]';

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
      className={`inline-flex h-10 items-center justify-center rounded-md bg-bg-tertiary p-1 text-text-secondary ${className}`}
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
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow-sm' : ''} ${className}`}
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
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
        onChange={handleChange}
        {...props}
      />
      {label && <label htmlFor={props.id} className="text-sm font-medium leading-none">{label}</label>}
    </div>
  );
} 
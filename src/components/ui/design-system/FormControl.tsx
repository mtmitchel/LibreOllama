import React, { forwardRef, createContext, useContext, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, Info, CheckCircle } from 'lucide-react';

/**
 * Design System FormControl Component
 * 
 * DLS Compliant Form Structure for consistent form fields
 * - Manages layout and spacing between Label, Input, and Messages
 * - Handles validation states with proper styling
 * - Ensures accessible form field relationships
 * - Eliminates inconsistent form layouts
 * - Automatic ARIA attribute management
 */

// Form Control Context for child component communication
interface FormControlContextValue {
  id: string;
  isRequired: boolean;
  isInvalid: boolean;
  isDisabled: boolean;
  hasError: boolean;
  hasHelper: boolean;
}

const FormControlContext = createContext<FormControlContextValue | undefined>(undefined);

export const useFormControl = () => {
  const context = useContext(FormControlContext);
  if (!context) {
    throw new Error('useFormControl must be used within a FormControl');
  }
  return context;
};

const formControlVariants = cva(
  'space-y-[var(--space-1-5)]',
  {
    variants: {
      size: {
        sm: 'asana-text-sm',
        md: 'asana-text-base',
        lg: 'asana-text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface FormControlProps extends VariantProps<typeof formControlVariants> {
  children: React.ReactNode;
  className?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  id?: string;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(({
  children,
  className = '',
  size = 'md',
  isRequired = false,
  isInvalid = false,
  isDisabled = false,
  id: providedId,
  ...props
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  
  // Check if children contain helper text or error messages
  const hasError = React.Children.toArray(children).some((child) =>
    React.isValidElement(child) && child.type === FormErrorMessage
  );
  
  const hasHelper = React.Children.toArray(children).some((child) =>
    React.isValidElement(child) && 
    (child.type === FormHelperText || child.type === FormHint)
  );

  const contextValue: FormControlContextValue = {
    id,
    isRequired,
    isInvalid: isInvalid || hasError,
    isDisabled,
    hasError: hasError || isInvalid,
    hasHelper,
  };

  return (
    <FormControlContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={formControlVariants({ size, className })}
        {...props}
      >
        {children}
      </div>
    </FormControlContext.Provider>
  );
});

FormControl.displayName = 'FormControl';

/**
 * Form Label - Accessible label with required indicator
 */
const labelVariants = cva(
  `
    block font-medium
    text-[color:var(--text-primary)]
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      size: {
        sm: 'asana-text-sm',
        md: 'asana-text-base',
        lg: 'asana-text-lg',
      },
      disabled: {
        true: 'text-[color:var(--text-muted)] cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      disabled: false,
    },
  }
);

export interface FormLabelProps extends VariantProps<typeof labelVariants> {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  requiredIndicator?: React.ReactNode;
  showOptional?: boolean;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(({
  children,
  className = '',
  htmlFor,
  size = 'md',
  requiredIndicator = <span className="text-[color:var(--status-error)] ml-1">*</span>,
  showOptional = true,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const isDisabled = formControl?.isDisabled || false;
  const labelFor = htmlFor || `${formControl?.id}-input`;

  return (
    <label
      ref={ref}
      htmlFor={labelFor}
      className={labelVariants({ size, disabled: isDisabled, className })}
      {...props}
    >
      {children}
      
      {formControl?.isRequired && requiredIndicator}
      
      {!formControl?.isRequired && showOptional && (
        <span className="text-[color:var(--text-muted)] ml-1 font-normal">
          (optional)
        </span>
      )}
    </label>
  );
});

FormLabel.displayName = 'FormLabel';

/**
 * Form Helper Text - Additional guidance
 */
const helperVariants = cva(
  `
    asana-text-sm
    text-[color:var(--text-secondary)]
    leading-relaxed
  `,
  {
    variants: {
      disabled: {
        true: 'text-[color:var(--text-muted)]',
        false: '',
      },
    },
    defaultVariants: {
      disabled: false,
    },
  }
);

export interface FormHelperTextProps extends VariantProps<typeof helperVariants> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(({
  children,
  className = '',
  id,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const isDisabled = formControl?.isDisabled || false;
  const helperId = id || `${formControl?.id}-helper`;

  return (
    <div
      ref={ref}
      id={helperId}
      className={helperVariants({ disabled: isDisabled, className })}
      {...props}
    >
      {children}
    </div>
  );
});

FormHelperText.displayName = 'FormHelperText';

/**
 * Form Error Message - Validation errors
 */
const errorVariants = cva(
  `
    flex items-start gap-[var(--space-1)]
    asana-text-sm
    text-[color:var(--status-error)]
    leading-relaxed
  `,
  {
    variants: {
      showIcon: {
        true: '',
        false: 'pl-0',
      },
    },
    defaultVariants: {
      showIcon: true,
    },
  }
);

export interface FormErrorMessageProps extends VariantProps<typeof errorVariants> {
  children: React.ReactNode;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const FormErrorMessage = forwardRef<HTMLDivElement, FormErrorMessageProps>(({
  children,
  className = '',
  id,
  showIcon = true,
  icon = <AlertCircle size={16} className="shrink-0 mt-0.5" />,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const errorId = id || `${formControl?.id}-error`;

  if (!formControl?.hasError && !formControl?.isInvalid) {
    return null;
  }

  return (
    <div
      ref={ref}
      id={errorId}
      role="alert"
      aria-live="polite"
      className={errorVariants({ showIcon, className })}
      {...props}
    >
      {showIcon && icon}
      <span>{children}</span>
    </div>
  );
});

FormErrorMessage.displayName = 'FormErrorMessage';

/**
 * Form Success Message - Success feedback
 */
export interface FormSuccessMessageProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export const FormSuccessMessage = forwardRef<HTMLDivElement, FormSuccessMessageProps>(({
  children,
  className = '',
  id,
  showIcon = true,
  icon = <CheckCircle size={16} className="shrink-0 mt-0.5" />,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const successId = id || `${formControl?.id}-success`;

  return (
    <div
      ref={ref}
      id={successId}
      className={`
        flex items-start gap-[var(--space-1)]
        asana-text-sm
        text-[color:var(--status-success)]
        leading-relaxed
        ${className}
      `}
      {...props}
    >
      {showIcon && icon}
      <span>{children}</span>
    </div>
  );
});

FormSuccessMessage.displayName = 'FormSuccessMessage';

/**
 * Form Hint - Subtle additional information
 */
export interface FormHintProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export const FormHint = forwardRef<HTMLDivElement, FormHintProps>(({
  children,
  className = '',
  id,
  showIcon = true,
  icon = <Info size={16} className="shrink-0 mt-0.5" />,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const hintId = id || `${formControl?.id}-hint`;

  return (
    <div
      ref={ref}
      id={hintId}
      className={`
        flex items-start gap-[var(--space-1)]
        asana-text-sm
        text-[color:var(--text-muted)]
        leading-relaxed
        ${className}
      `}
      {...props}
    >
      {showIcon && icon}
      <span>{children}</span>
    </div>
  );
});

FormHint.displayName = 'FormHint';

/**
 * Enhanced Input with FormControl integration
 */
const inputVariants = cva(
  `
    w-full
    px-[var(--space-3)] py-[var(--space-2)]
    bg-[var(--bg-surface)]
    border border-[var(--border-default)]
    rounded-[var(--radius-md)]
    asana-text-base
    text-[color:var(--text-primary)]
    placeholder:text-[color:var(--text-muted)]
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    
    focus:outline-none
    focus:border-[var(--border-focus)]
    focus:ring-1
    focus:ring-[var(--border-focus)]
    
    disabled:bg-[var(--bg-muted)]
    disabled:text-[color:var(--text-muted)]
    disabled:cursor-not-allowed
    disabled:border-[var(--border-subtle)]
  `,
  {
    variants: {
      size: {
        sm: 'h-8 px-[var(--space-2)] asana-text-sm',
        md: 'h-10 px-[var(--space-3)] asana-text-base',
        lg: 'h-12 px-[var(--space-4)] asana-text-lg',
      },
      isInvalid: {
        true: `
          border-[var(--status-error)]
          focus:border-[var(--status-error)]
          focus:ring-[var(--status-error)]
        `,
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      isInvalid: false,
    },
  }
);

export interface FormInputProps extends VariantProps<typeof inputVariants> {
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  name?: string;
  id?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  className = '',
  size = 'md',
  type = 'text',
  id,
  disabled,
  required,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const inputId = id || `${formControl?.id}-input`;
  
  const isDisabled = disabled ?? formControl?.isDisabled ?? false;
  const isRequired = required ?? formControl?.isRequired ?? false;
  const isInvalid = formControl?.isInvalid ?? false;

  // Build ARIA attributes
  const ariaDescribedBy = [
    formControl?.hasHelper ? `${formControl.id}-helper` : '',
    formControl?.hasError ? `${formControl.id}-error` : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <input
      ref={ref}
      id={inputId}
      type={type}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={isInvalid}
      aria-describedby={ariaDescribedBy}
      className={inputVariants({ size, isInvalid, className })}
      {...props}
    />
  );
});

FormInput.displayName = 'FormInput';

/**
 * Enhanced Textarea with FormControl integration
 */
export interface FormTextareaProps extends Omit<FormInputProps, 'type' | 'onFocus' | 'onBlur' | 'onChange'> {
  rows?: number;
  cols?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
  className = '',
  size = 'md',
  resize = 'vertical',
  rows = 4,
  id,
  disabled,
  required,
  onChange,
  ...props
}, ref) => {
  const formControl = useFormControl();
  const textareaId = id || `${formControl?.id}-input`;
  
  const isDisabled = disabled ?? formControl?.isDisabled ?? false;
  const isRequired = required ?? formControl?.isRequired ?? false;
  const isInvalid = formControl?.isInvalid ?? false;

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  const ariaDescribedBy = [
    formControl?.hasHelper ? `${formControl.id}-helper` : '',
    formControl?.hasError ? `${formControl.id}-error` : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <textarea
      ref={ref}
      id={textareaId}
      rows={rows}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={isInvalid}
      aria-describedby={ariaDescribedBy}
      onChange={onChange}
      className={`
        ${inputVariants({ size, isInvalid })}
        ${resizeClasses[resize]}
        min-h-[80px]
        py-[var(--space-2)]
        ${className}
      `}
      {...props}
    />
  );
});

FormTextarea.displayName = 'FormTextarea';

/**
 * Form Group - Groups related form controls
 */
export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(({
  children,
  className = '',
  title,
  description,
  spacing = 'normal',
  ...props
}, ref) => {
  const spacingClasses = {
    tight: 'space-y-[var(--space-3)]',
    normal: 'space-y-[var(--space-4)]',
    loose: 'space-y-[var(--space-6)]',
  };

  return (
    <fieldset
      ref={ref}
      className={`${spacingClasses[spacing]} ${className}`}
      {...props}
    >
      {title && (
        <legend className="asana-text-lg font-semibold text-[color:var(--text-primary)] mb-[var(--space-2)]">
          {title}
        </legend>
      )}
      {description && (
        <p className="asana-text-sm text-[color:var(--text-secondary)] mb-[var(--space-4)]">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
});

FormGroup.displayName = 'FormGroup';
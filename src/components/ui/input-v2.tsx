import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { designSystemFlags, type CognitiveLoad } from "@/lib/design-tokens"

/**
 * V2 Enhanced Input Component - LibreOllama Design System
 *
 * Modern input component with target design implementation:
 * - V2 dark theme colors matching target design
 * - ADHD-optimized cognitive load indicators
 * - Enhanced accessibility features
 * - Feature flag support for gradual rollout
 * - Improved focus states and validation
 */
const inputVariants = cva(
  "flex w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // V2 Default - Target design input styling with proper CSS variables
        default: designSystemFlags.useV2Components
          ? "bg-[var(--v2-bg-input)] border-[var(--v2-border-default)] text-[var(--v2-text-primary)] placeholder:text-[var(--v2-text-muted)] focus:border-accent-primary focus:bg-[var(--v2-bg-input)] focus-visible:ring-accent-primary"
          : "bg-background border-input text-foreground focus-visible:ring-ring",
        
        // V2 Filled - Filled background variant
        filled: designSystemFlags.useV2Components
          ? "bg-[var(--v2-bg-tertiary)] border-[var(--v2-border-default)] text-[var(--v2-text-primary)] placeholder:text-[var(--v2-text-muted)] focus:border-accent-primary focus:bg-[var(--v2-bg-quaternary)] focus-visible:ring-accent-primary"
          : "bg-muted border-input text-foreground focus-visible:ring-ring",
        
        // V2 Outlined - Emphasized border
        outlined: designSystemFlags.useV2Components
          ? "bg-transparent border-[var(--v2-border-strong)] text-[var(--v2-text-primary)] placeholder:text-[var(--v2-text-muted)] focus:border-accent-primary focus:bg-[var(--v2-bg-secondary)] focus-visible:ring-accent-primary"
          : "bg-transparent border-input text-foreground focus-visible:ring-ring",
        
        // V2 Ghost - Minimal styling
        ghost: designSystemFlags.useV2Components
          ? "bg-transparent border-transparent text-[var(--v2-text-primary)] placeholder:text-[var(--v2-text-muted)] focus:border-accent-primary focus:bg-[var(--v2-bg-secondary)] focus-visible:ring-accent-primary"
          : "bg-transparent border-transparent text-foreground focus-visible:ring-ring",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      state: {
        default: "",
        error: designSystemFlags.useV2Components
          ? "border-accent-error focus:border-accent-error focus-visible:ring-accent-error"
          : "border-destructive focus-visible:ring-destructive",
        success: designSystemFlags.useV2Components
          ? "border-accent-success focus:border-accent-success focus-visible:ring-accent-success"
          : "border-success-500 focus-visible:ring-success-500",
        warning: designSystemFlags.useV2Components
          ? "border-accent-warning focus:border-accent-warning focus-visible:ring-accent-warning"
          : "border-warning-500 focus-visible:ring-warning-500",
      },
      cognitiveLoad: {
        low: "",
        medium: "",
        high: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
      cognitiveLoad: "low",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  cognitiveLoad?: CognitiveLoad
  /** Feature flag to use V2 styling */
  useV2?: boolean
  /** Input state for validation */
  state?: "default" | "error" | "success" | "warning"
  /** Error message to display */
  error?: string
  /** Success message to display */
  success?: string
  /** Warning message to display */
  warning?: string
  /** Helper text to display */
  helperText?: string
  /** Icon to display on the left */
  leftIcon?: React.ComponentType<{ className?: string }>
  /** Icon to display on the right */
  rightIcon?: React.ComponentType<{ className?: string }>
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant,
    size = "md",
    state = "default",
    cognitiveLoad = "low",
    useV2 = designSystemFlags.useV2Components,
    error,
    success,
    warning,
    helperText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    showPasswordToggle = false,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    
    // Determine actual input type
    const inputType = type === "password" && showPassword ? "text" : type
    
    // Determine state based on validation props
    const actualState = error ? "error" : success ? "success" : warning ? "warning" : state
    
    // Apply cognitive load styling if V2 is enabled
    const cognitiveLoadClass = useV2 && cognitiveLoad !== "low" 
      ? `cognitive-load-${cognitiveLoad}` 
      : ""
    
    // Get state icon
    const StateIcon = actualState === "error" ? AlertCircle 
                    : actualState === "success" ? CheckCircle 
                    : null
    
    // Get state message
    const stateMessage = error || success || warning || helperText
    
    return (
      <div className="w-full">
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <LeftIcon className={cn(
                "h-4 w-4",
                useV2 ? "text-slate-400" : "text-muted-foreground"
              )} />
            </div>
          )}
          
          {/* Input */}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, size, state: actualState, cognitiveLoad, className }),
              cognitiveLoadClass,
              useV2 && "font-sans", // Ensure Inter font
              LeftIcon && "pl-10",
              (RightIcon || StateIcon || (type === "password" && showPasswordToggle)) && "pr-10",
              isFocused && useV2 && "ring-2 ring-accent-primary ring-offset-2"
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            data-cognitive-load={cognitiveLoad}
            {...props}
          />
          
          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* State Icon */}
            {StateIcon && (
              <StateIcon className={cn(
                "h-4 w-4",
                actualState === "error" && (useV2 ? "text-accent-error" : "text-destructive"),
                actualState === "success" && (useV2 ? "text-accent-success" : "text-success-500"),
                actualState === "warning" && (useV2 ? "text-accent-warning" : "text-warning-500")
              )} />
            )}
            
            {/* Password Toggle */}
            {type === "password" && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "p-0.5 rounded hover:bg-opacity-10 transition-colors",
                  useV2 ? "text-slate-400 hover:text-white hover:bg-white" : "text-muted-foreground hover:text-foreground"
                )}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Custom Right Icon */}
            {RightIcon && !StateIcon && (
              <RightIcon className={cn(
                "h-4 w-4",
                useV2 ? "text-slate-400" : "text-muted-foreground"
              )} />
            )}
          </div>
        </div>
        
        {/* Helper/Error/Success/Warning Text */}
        {stateMessage && (
          <p className={cn(
            "mt-1 text-xs",
            useV2 && "font-sans leading-[1.375rem]", // ADHD-optimized
            actualState === "error" && (useV2 ? "text-accent-error" : "text-destructive"),
            actualState === "success" && (useV2 ? "text-accent-success" : "text-success-500"),
            actualState === "warning" && (useV2 ? "text-accent-warning" : "text-warning-500"),
            actualState === "default" && (useV2 ? "text-slate-400" : "text-muted-foreground")
          )}>
            {stateMessage}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "InputV2"

export { Input, inputVariants }
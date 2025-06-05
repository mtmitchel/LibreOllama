import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { designSystemFlags, componentTokens, type CognitiveLoad } from "@/lib/design-tokens"

/**
 * V2 Enhanced Button Component - LibreOllama Design System
 *
 * Enhanced with target design implementation:
 * - V2 dark theme colors matching target design
 * - ADHD-optimized cognitive load indicators
 * - Feature flag support for gradual rollout
 * - Enhanced accessibility and focus states
 * - Improved typography and spacing
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // V2 Primary - Target design indigo
        primary: designSystemFlags.useV2Components
          ? "bg-accent-primary text-white shadow-sm hover:bg-accent-primary-hover active:bg-accent-primary-active focus-visible:ring-accent-primary"
          : "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary",
        
        // V2 Secondary - Target design slate
        secondary: designSystemFlags.useV2Components
          ? "bg-bg-tertiary text-white border border-bg-quaternary shadow-sm hover:bg-bg-quaternary active:bg-bg-quinary focus-visible:ring-bg-quaternary"
          : "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-secondary",
        
        // V2 Tertiary - Outlined style with target colors
        tertiary: designSystemFlags.useV2Components
          ? "border border-bg-quaternary bg-transparent text-white shadow-sm hover:bg-bg-secondary focus-visible:ring-accent-primary"
          : "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        
        // V2 Ghost - Minimal style with target colors
        ghost: designSystemFlags.useV2Components
          ? "text-white hover:bg-bg-secondary focus-visible:ring-accent-primary"
          : "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        
        // V2 Destructive - Error actions with target colors
        destructive: designSystemFlags.useV2Components
          ? "bg-accent-error text-white shadow-sm hover:bg-accent-error-hover active:bg-accent-error-active focus-visible:ring-accent-error"
          : "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:ring-destructive",
        
        // V2 Success - Success actions
        success: designSystemFlags.useV2Components
          ? "bg-accent-success text-white shadow-sm hover:bg-accent-success-hover active:bg-accent-success-active focus-visible:ring-accent-success"
          : "bg-success-500 text-white shadow hover:bg-success-600 focus-visible:ring-success-500",
        
        // V2 Warning - Warning actions
        warning: designSystemFlags.useV2Components
          ? "bg-accent-warning text-white shadow-sm hover:bg-accent-warning-hover active:bg-accent-warning-active focus-visible:ring-accent-warning"
          : "bg-warning-500 text-white shadow hover:bg-warning-600 focus-visible:ring-warning-500",
        
        // Link - Text-only style with target colors
        link: designSystemFlags.useV2Components
          ? "text-accent-primary underline-offset-4 hover:underline focus-visible:ring-accent-primary"
          : "text-primary underline-offset-4 hover:underline focus-visible:ring-primary",
        
        // Legacy variants for backward compatibility
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary",
        outline: "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        danger: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:ring-destructive",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
        // Legacy sizes for backward compatibility
        default: "h-10 px-4 py-2 text-sm",
      },
      cognitiveLoad: {
        low: "",
        medium: "",
        high: "",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      cognitiveLoad: "low",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  iconLeft?: React.ComponentType<{ className?: string }>
  iconRight?: React.ComponentType<{ className?: string }>
  loading?: boolean
  fullWidth?: boolean
  cognitiveLoad?: CognitiveLoad
  /** Feature flag to use V2 styling */
  useV2?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    iconLeft: IconLeft,
    iconRight: IconRight,
    loading = false,
    fullWidth = false,
    cognitiveLoad = "low",
    useV2 = designSystemFlags.useV2Components,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply cognitive load styling if V2 is enabled
    const cognitiveLoadClass = useV2 && cognitiveLoad !== "low"
      ? `cognitive-load-${cognitiveLoad}`
      : ""
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, cognitiveLoad, className }),
          fullWidth && "w-full",
          cognitiveLoadClass,
          useV2 && "font-sans" // Ensure Inter font is used
        )}
        ref={ref}
        disabled={disabled || loading}
        data-cognitive-load={cognitiveLoad}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {IconLeft && !loading && <IconLeft className="mr-2 h-4 w-4" />}
        {children}
        {IconRight && <IconRight className="ml-2 h-4 w-4" />}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
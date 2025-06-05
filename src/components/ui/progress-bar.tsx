import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { designTokens } from "@/lib/design-tokens"

/**
 * Enhanced Progress Bar Component - V2 Design System
 * 
 * Modern progress bar with color-coded indicators, animations,
 * and ADHD-optimized visual feedback for dashboard widgets.
 */

const progressBarVariants = cva(
  "relative w-full bg-slate-700/50 rounded-full overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-3",
      },
      variant: {
        default: "",
        success: "",
        warning: "",
        error: "",
        info: "",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

const progressFillVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-blue-500",
        success: "bg-emerald-500",
        warning: "bg-amber-500", 
        error: "bg-red-500",
        info: "bg-indigo-500",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number
  max?: number
  showLabel?: boolean
  label?: string
  animated?: boolean
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    size, 
    variant = "default",
    showLabel = false,
    label,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    // Auto-determine variant based on percentage if not specified
    const autoVariant = variant === "default" ? (
      percentage >= 80 ? "success" :
      percentage >= 60 ? "info" :
      percentage >= 40 ? "warning" : "error"
    ) : variant

    return (
      <div className="space-y-2">
        {(showLabel || label) && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              {label || "Progress"}
            </span>
            <span className="text-sm text-slate-400">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressBarVariants({ size, className }))}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
          {...props}
        >
          <div
            className={cn(
              progressFillVariants({ variant: autoVariant }),
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Subtle shine effect for enhanced visual feedback */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"
            style={{
              animation: animated ? "shimmer 2s infinite" : "none",
              transform: "translateX(-100%)"
            }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar, progressBarVariants }
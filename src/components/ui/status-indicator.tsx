import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { AlertCircle, Zap, ArrowDown, Target, Clock, CheckCircle2, AlertTriangle } from "lucide-react"

/**
 * Enhanced Status Indicator Components - V2 Design System
 * 
 * Modern status indicators with priority levels, color coding,
 * and ADHD-optimized visual feedback for dashboard widgets.
 */

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        // Priority indicators
        high: "bg-red-500/10 text-red-400 border border-red-500/20",
        medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20", 
        low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        normal: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
        
        // Status indicators
        completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        inProgress: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        overdue: "bg-red-500/10 text-red-400 border border-red-500/20",
        
        // Time-based indicators
        urgent: "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse",
        soon: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        today: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        upcoming: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      }
    },
    defaultVariants: {
      variant: "normal",
      size: "md",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  showIcon?: boolean
  pulse?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    className, 
    variant, 
    size,
    label,
    icon,
    showIcon = true,
    pulse = false,
    ...props 
  }, ref) => {
    // Auto-select icon based on variant if not provided
    const getDefaultIcon = () => {
      switch (variant) {
        case 'high': return AlertCircle
        case 'medium': return Zap
        case 'low': return ArrowDown
        case 'normal': return Target
        case 'completed': return CheckCircle2
        case 'inProgress': return Clock
        case 'pending': return Clock
        case 'overdue': return AlertTriangle
        case 'urgent': return AlertCircle
        case 'soon': return Clock
        case 'today': return Clock
        case 'upcoming': return Clock
        default: return Target
      }
    }

    const IconComponent = icon || getDefaultIcon()

    return (
      <div
        ref={ref}
        className={cn(
          statusIndicatorVariants({ variant, size }),
          pulse && "animate-pulse",
          className
        )}
        {...props}
      >
        {showIcon && (
          <IconComponent className="h-3 w-3 flex-shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

// Priority Indicator Component
export interface PriorityIndicatorProps {
  priority: 'high' | 'medium' | 'low' | 'normal'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  size = 'md',
  showLabel = true,
  className
}) => {
  const labels = {
    high: 'High Priority',
    medium: 'Medium Priority', 
    low: 'Low Priority',
    normal: 'Normal'
  }

  return (
    <StatusIndicator
      variant={priority}
      size={size}
      label={showLabel ? labels[priority] : ''}
      className={className}
      pulse={priority === 'high'}
    />
  )
}

// Time Status Indicator Component
export interface TimeStatusIndicatorProps {
  status: 'urgent' | 'soon' | 'today' | 'upcoming' | 'overdue'
  label: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TimeStatusIndicator: React.FC<TimeStatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  className
}) => {
  return (
    <StatusIndicator
      variant={status}
      size={size}
      label={label}
      className={className}
      pulse={status === 'urgent'}
    />
  )
}

// Progress Status Indicator Component
export interface ProgressStatusIndicatorProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

const ProgressStatusIndicator: React.FC<ProgressStatusIndicatorProps> = ({
  percentage,
  size = 'md',
  showPercentage = true,
  className
}) => {
  const getStatus = (pct: number) => {
    if (pct >= 100) return { variant: 'completed' as const, label: 'Complete' }
    if (pct >= 70) return { variant: 'inProgress' as const, label: 'On Track' }
    if (pct >= 40) return { variant: 'inProgress' as const, label: 'In Progress' }
    return { variant: 'pending' as const, label: 'Getting Started' }
  }

  const status = getStatus(percentage)
  const label = showPercentage ? `${Math.round(percentage)}% ${status.label}` : status.label

  return (
    <StatusIndicator
      variant={status.variant}
      size={size}
      label={label}
      className={className}
    />
  )
}

export { 
  StatusIndicator, 
  PriorityIndicator, 
  TimeStatusIndicator, 
  ProgressStatusIndicator,
  statusIndicatorVariants 
}
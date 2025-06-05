import * as React from "react"
import { cn } from "@/lib/utils"

export interface SegmentedControlOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
  size = "md"
}) => {
  const sizeClasses = {
    sm: "h-8 p-0.5 text-xs",
    md: "h-10 p-1 text-sm",
    lg: "h-12 p-1.5 text-base"
  }

  const optionSizeClasses = {
    sm: "px-2 py-1 rounded-sm",
    md: "px-3 py-1.5 rounded-sm",
    lg: "px-4 py-2 rounded-md"
  }

  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground",
      sizeClasses[size],
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => !option.disabled && onChange(option.value)}
          disabled={option.disabled}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap font-medium",
            "ring-offset-[var(--v2-bg-primary)] transition-all focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            optionSizeClasses[size],
            value === option.value && "bg-background text-foreground shadow-sm"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export { SegmentedControl }
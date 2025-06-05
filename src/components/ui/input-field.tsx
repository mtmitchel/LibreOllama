import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ComponentType<{ className?: string }>
  error?: string
  label?: string
  helperText?: string
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, iconLeft: IconLeft, error, label, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {IconLeft && (
            <IconLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <input
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-[var(--v2-bg-primary)]",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              IconLeft && "pl-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
InputField.displayName = "InputField"

export { InputField }
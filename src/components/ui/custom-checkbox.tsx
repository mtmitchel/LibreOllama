import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomCheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

const CustomCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CustomCheckboxProps
>(({ 
  checked, 
  onCheckedChange, 
  label, 
  description, 
  disabled, 
  className,
  size = "md",
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  }

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer shrink-0 rounded-sm border border-primary ring-offset-[var(--v2-bg-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          sizeClasses[size]
        )}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className={iconSizeClasses[size]} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      
      {(label || description) && (
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              className={cn(
                "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                textSizeClasses[size]
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
CustomCheckbox.displayName = "CustomCheckbox"

export { CustomCheckbox }
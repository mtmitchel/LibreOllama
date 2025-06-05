import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { designSystemFlags, type CognitiveLoad } from "@/lib/design-tokens"

/**
 * V2 Enhanced Card Component - LibreOllama Design System
 *
 * Modern card component with target design implementation:
 * - V2 dark theme colors matching target design
 * - ADHD-optimized cognitive load indicators
 * - Feature flag support for gradual rollout
 * - Enhanced accessibility and hover states
 * - Improved spacing and typography
 */
const cardVariants = cva(
  "rounded-lg border transition-all duration-200",
  {
    variants: {
      variant: {
        // V2 Default - Target design card styling
        default: designSystemFlags.useV2Components
          ? "bg-bg-secondary border-bg-tertiary shadow-sm hover:bg-bg-tertiary hover:shadow-md"
          : "bg-card text-card-foreground border-border shadow-sm",
        
        // V2 Elevated - Enhanced shadow and hover effects
        elevated: designSystemFlags.useV2Components
          ? "bg-bg-secondary border-bg-tertiary shadow-md hover:bg-bg-tertiary hover:shadow-lg"
          : "bg-card text-card-foreground border-border shadow-md hover:shadow-lg",
        
        // V2 Interactive - For clickable cards
        interactive: designSystemFlags.useV2Components
          ? "bg-bg-secondary border-bg-tertiary shadow-sm hover:bg-bg-tertiary hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2"
          : "bg-card text-card-foreground border-border shadow-sm hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        
        // V2 Outlined - Subtle border emphasis
        outlined: designSystemFlags.useV2Components
          ? "bg-transparent border-bg-quaternary shadow-none hover:bg-bg-secondary"
          : "bg-transparent border-border shadow-none hover:bg-accent/5",
        
        // V2 Ghost - Minimal styling
        ghost: designSystemFlags.useV2Components
          ? "bg-transparent border-transparent shadow-none hover:bg-bg-secondary"
          : "bg-transparent border-transparent shadow-none hover:bg-accent/5",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
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
      cognitiveLoad: "low",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  cognitiveLoad?: CognitiveLoad
  /** Feature flag to use V2 styling */
  useV2?: boolean
  /** Make the card focusable for keyboard navigation */
  focusable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    cognitiveLoad = "low",
    useV2 = designSystemFlags.useV2Components,
    focusable = false,
    children,
    ...props 
  }, ref) => {
    // Apply cognitive load styling if V2 is enabled
    const cognitiveLoadClass = useV2 && cognitiveLoad !== "low" 
      ? `cognitive-load-${cognitiveLoad}` 
      : ""
    
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, cognitiveLoad, className }),
          cognitiveLoadClass,
          useV2 && "text-white" // Ensure proper text color for dark theme
        )}
        tabIndex={focusable ? 0 : undefined}
        data-cognitive-load={cognitiveLoad}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "CardV2"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { useV2?: boolean }
>(({ className, useV2 = designSystemFlags.useV2Components, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      useV2 && "text-white",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeaderV2"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { useV2?: boolean }
>(({ className, useV2 = designSystemFlags.useV2Components, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      useV2 && [
        "text-white",
        "font-sans", // Ensure Inter font
        "line-height-[2.5rem]", // ADHD-optimized line height
      ],
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitleV2"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { useV2?: boolean }
>(({ className, useV2 = designSystemFlags.useV2Components, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      useV2 && [
        "text-slate-300", // Better contrast for dark theme
        "font-sans", // Ensure Inter font
        "leading-[1.375rem]", // ADHD-optimized line height
        "tracking-wide", // Improved letter spacing
      ],
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescriptionV2"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { useV2?: boolean }
>(({ className, useV2 = designSystemFlags.useV2Components, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-0",
      useV2 && "text-white",
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContentV2"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { useV2?: boolean }
>(({ className, useV2 = designSystemFlags.useV2Components, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      useV2 && "text-white",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooterV2"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}
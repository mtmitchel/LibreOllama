import * as React from "react"
import { MoreVertical } from "lucide-react"
import { Card, CardContent } from "./card-v2"
import { Button } from "./button-v2"
import { cn } from "@/lib/utils"
import { designTokens } from "@/lib/design-tokens"

export interface WidgetWrapperProps {
  title: string
  children: React.ReactNode
  moreOptions?: boolean
  onMoreOptions?: () => void
  onClick?: () => void
  className?: string
  shadowOnHover?: boolean
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  title,
  children,
  moreOptions = false,
  onMoreOptions,
  onClick,
  className,
  shadowOnHover = true
}) => {
  return (
    <Card
      variant="interactive"
      className={cn(
        "transition-all duration-200 ease-out",
        shadowOnHover && "hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      useV2={true}
      focusable={!!onClick}
    >
      <CardContent className="p-6" useV2={true}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white text-base tracking-tight leading-tight">
            {title}
          </h3>
          {moreOptions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onMoreOptions?.();
              }}
              className="h-8 w-8 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-slate-300" />
            </Button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

export { WidgetWrapper }
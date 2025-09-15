import * as React from "react"
import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  from?: string;
  to?: string;
}

const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, children, from = "from-primary", to = "to-primary/70", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          `bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent`,
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
GradientText.displayName = "GradientText"

export { GradientText }
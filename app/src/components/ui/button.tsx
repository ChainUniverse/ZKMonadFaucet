import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const baseClasses = "btn"
    const variantClasses = variant === "default" ? "btn-primary" :
                          variant === "destructive" ? "btn-destructive" :
                          variant === "outline" ? "btn-outline" :
                          variant === "secondary" ? "btn-secondary" :
                          variant === "ghost" ? "btn-ghost" :
                          variant === "link" ? "btn-link" : "btn-primary"
    
    const sizeClasses = size === "sm" ? "btn-sm" :
                       size === "lg" ? "btn-lg" :
                       size === "icon" ? "btn-icon" : ""
    
    return (
      <Comp
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
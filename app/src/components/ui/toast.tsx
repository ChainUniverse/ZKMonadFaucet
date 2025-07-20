import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    style={{ position: 'fixed', top: '0', right: '0', zIndex: 9999, padding: '16px', maxWidth: '420px' }}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: "default" | "destructive"
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantClass = variant === "destructive" ? "toast-destructive" : ""
  
  return (
    <ToastPrimitives.Root
      ref={ref}
      style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        ...(variant === 'destructive' ? { backgroundColor: '#fee2e2', borderColor: '#fecaca' } : {})
      }}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    style={{ 
      padding: '4px 8px', 
      fontSize: '12px', 
      border: '1px solid #d1d5db', 
      borderRadius: '4px', 
      backgroundColor: 'transparent'
    }}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    style={{ 
      position: 'absolute', 
      top: '8px', 
      right: '8px', 
      padding: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer'
    }}
    {...props}
  >
    <X style={{ height: '16px', width: '16px' }} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    style={{ 
      fontWeight: '600', 
      fontSize: '16px', 
      marginBottom: '4px',
      paddingRight: '24px'
    }}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    style={{ 
      fontSize: '14px', 
      color: '#6b7280',
      paddingRight: '24px'
    }}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
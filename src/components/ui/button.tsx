import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg hover:shadow-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-lg hover:shadow-xl",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg hover:shadow-xl",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-lg hover:shadow-xl",
        gradient: "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base rounded-lg",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      fullWidth: {
        true: "w-full",
      },
      rounded: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    rounded,
    loading,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    const Comp = asChild ? "span" : "button"
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, rounded }),
          "relative overflow-hidden group",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Ripple effect on click */}
        <span className="absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-300">
            <span className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-300 rounded-full" />
          </span>
        </span>
        
        {/* Loading spinner */}
        {loading && (
          <Loader2 className={cn(
            "animate-spin",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
            children ? "mr-2" : ""
          )} />
        )}
        
        {/* Left icon */}
        {!loading && leftIcon && (
          <span className={cn("mr-2", children ? "mr-2" : "")}>
            {leftIcon}
          </span>
        )}
        
        {/* Button content */}
        {children}
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className={cn("ml-2", children ? "ml-2" : "")}>
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Icon Button component for common use cases
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  label?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        {...props}
        aria-label={label}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// Action Button with loading state for forms
export interface ActionButtonProps extends ButtonProps {
  action?: "submit" | "reset" | "button"
  loadingText?: string
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ action = "button", loading, loadingText, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type={action}
        loading={loading}
        {...props}
      >
        {loading && loadingText ? loadingText : children}
      </Button>
    )
  }
)
ActionButton.displayName = "ActionButton"

// Social Button for auth providers
interface SocialButtonProps extends Omit<ButtonProps, 'variant'> {
  provider: "google" | "facebook" | "twitter" | "github"
  icon?: React.ReactNode
}

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
  ({ provider, icon, children, ...props }, ref) => {
    const providerColors = {
      google: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      facebook: "bg-[#1877f2] text-white hover:bg-[#1877f2]/90",
      twitter: "bg-[#1da1f2] text-white hover:bg-[#1da1f2]/90",
      github: "bg-[#24292e] text-white hover:bg-[#24292e]/90",
    }
    
    const providerIcons = {
      google: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      facebook: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24c5.74-.9 10.13-5.9 10.13-11.93z" />
        </svg>
      ),
      twitter: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.68-11.737c0-.21-.005-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      github: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    }
    
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(providerColors[provider], "hover:opacity-90 transition-opacity")}
        {...props}
      >
        {icon || providerIcons[provider]}
        {children && <span className="ml-3">{children}</span>}
      </Button>
    )
  }
)
SocialButton.displayName = "SocialButton"

export { 
  Button, 
  IconButton, 
  ActionButton, 
  SocialButton, 
  buttonVariants 
}
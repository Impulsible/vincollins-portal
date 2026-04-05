/* eslint-disable @next/next/no-img-element */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronRight, ExternalLink } from "lucide-react"

const cardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border shadow-lg hover:shadow-xl",
        elevated: "bg-card text-card-foreground border-0 shadow-2xl hover:shadow-3xl",
        outline: "bg-transparent border-2 hover:border-primary/50",
        ghost: "bg-transparent border-0 shadow-none hover:bg-muted/50",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
        gradient: "bg-gradient-to-br from-primary/10 to-secondary/10 border-0 shadow-lg hover:shadow-xl",
      },
      rounded: {
        default: "rounded-xl",
        sm: "rounded-lg",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
        none: "rounded-none",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
        none: "p-0",
      },
      hover: {
        none: "",
        scale: "hover:scale-[1.02]",
        lift: "hover:-translate-y-1",
        glow: "hover:shadow-2xl hover:shadow-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "default",
      padding: "default",
      hover: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  interactive?: boolean
  onClick?: () => void
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    rounded, 
    padding,
    hover,
    interactive,
    onClick,
    children, 
    ...props 
  }, ref) => {
    const isInteractive = interactive || onClick
    
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, rounded, padding, hover }),
          isInteractive && "cursor-pointer transition-all duration-300 active:scale-[0.98]",
          className
        )}
        onClick={onClick}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        {...props}
      >
        {/* Decorative gradient overlay on hover */}
        {variant === "glass" && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        
        {/* Animated border on hover */}
        {variant === "outline" && (
          <div className="absolute inset-0 rounded-inherit border-2 border-transparent group-hover:border-primary/50 transition-all duration-300 pointer-events-none" />
        )}
        
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

// Card Header with optional actions
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode
  separator?: boolean
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, action, separator = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5",
        separator && "border-b border-border/50 pb-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    </div>
  )
)
CardHeader.displayName = "CardHeader"

// Card Title with optional icon
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, icon, as: Component = "h3", children, ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight flex items-center gap-2",
        className
      )}
      {...props}
    >
      {icon && <span className="text-primary">{icon}</span>}
      {children}
    </Component>
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

// Card Footer with divider
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  separator?: boolean
  align?: "start" | "center" | "end" | "between"
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, separator = true, align = "start", children, ...props }, ref) => {
    const alignClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          alignClasses[align],
          separator && "border-t border-border/50 pt-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = "CardFooter"

// Card Media for images
export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string
  alt?: string
  height?: "sm" | "md" | "lg" | "xl" | "full"
  overlay?: boolean
  overlayGradient?: boolean
}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ 
    className, 
    image, 
    alt = "", 
    height = "md",
    overlay = false,
    overlayGradient = true,
    children, 
    ...props 
  }, ref) => {
    const heightClasses = {
      sm: "h-32",
      md: "h-48",
      lg: "h-64",
      xl: "h-96",
      full: "h-full",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          heightClasses[height],
          className
        )}
        {...props}
      >
        {image && (
          <img
            src={image}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {overlay && (
          <div className={cn(
            "absolute inset-0",
            overlayGradient && "bg-gradient-to-t from-black/60 to-transparent"
          )} />
        )}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    )
  }
)
CardMedia.displayName = "CardMedia"

// Card Stats for metrics display
export interface CardStatsProps {
  value: string | number
  label: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

const CardStats = React.forwardRef<HTMLDivElement, CardStatsProps>(
  ({ value, label, icon, trend, ...props }, ref) => {
    return (
      <div ref={ref} className="space-y-2" {...props}>
        <div className="flex items-center justify-between">
          {icon && <div className="text-primary">{icon}</div>}
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}>
              {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    )
  }
)
CardStats.displayName = "CardStats"

// Interactive Card with link
export interface InteractiveCardProps extends CardProps {
  href?: string
  external?: boolean
  onClick?: () => void
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ href, external, onClick, children, ...props }, ref) => {
    const handleClick = () => {
      if (onClick) {
        onClick()
      } else if (href) {
        if (external) {
          window.open(href, "_blank")
        } else {
          window.location.href = href
        }
      }
    }

    return (
      <Card
        ref={ref}
        interactive
        onClick={handleClick}
        {...props}
      >
        {children}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {external ? (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </Card>
    )
  }
)
InteractiveCard.displayName = "InteractiveCard"

// Card Grid for layout
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg" | "xl"
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, cols = 3, gap = "md", children, ...props }, ref) => {
    const colsClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
      6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    }

    const gapClasses = {
      sm: "gap-3",
      md: "gap-4 md:gap-6",
      lg: "gap-6 md:gap-8",
      xl: "gap-8 md:gap-12",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          colsClasses[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardGrid.displayName = "CardGrid"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardMedia,
  CardStats,
  InteractiveCard,
  CardGrid
}
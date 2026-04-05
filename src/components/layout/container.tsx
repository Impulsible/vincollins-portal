import { cn } from "@/lib/utils"
import { ReactNode, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      default: "max-w-7xl",
      sm: "max-w-5xl",
      lg: "max-w-[1400px]",
      xl: "max-w-[1600px]",
      full: "max-w-full",
      content: "max-w-3xl", // For blog posts, articles, etc.
      dashboard: "max-w-[1440px]",
    },
    padding: {
      default: "px-4 sm:px-6 lg:px-8",
      sm: "px-2 sm:px-4 lg:px-6",
      lg: "px-6 sm:px-8 lg:px-12",
      none: "px-0",
      responsive: "px-4 md:px-8 lg:px-12 xl:px-16",
    },
    margin: {
      default: "mx-auto",
      none: "mx-0",
      auto: "mx-auto",
    },
  },
  defaultVariants: {
    size: "default",
    padding: "default",
    margin: "default",
  },
})

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
  fluid?: boolean
  centered?: boolean
  fullHeight?: boolean
  background?: string
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      className,
      size,
      padding,
      margin,
      as: Component = "div",
      fluid = false,
      centered = false,
      fullHeight = false,
      background,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          containerVariants({ 
            size: fluid ? "full" : size, 
            padding, 
            margin 
          }),
          centered && "flex items-center justify-center",
          fullHeight && "min-h-screen",
          background,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Container.displayName = "Container"

// Educational-specific container components
export const PageContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'size'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        size="default"
        padding="default"
        className={cn("py-6 md:py-8 lg:py-12", className)}
        {...props}
      >
        {children}
      </Container>
    )
  }
)
PageContainer.displayName = "PageContainer"

export const DashboardContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'size'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        size="dashboard"
        padding="responsive"
        className={cn("py-4 md:py-6", className)}
        {...props}
      >
        {children}
      </Container>
    )
  }
)
DashboardContainer.displayName = "DashboardContainer"

export const FormContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'size'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        size="sm"
        padding="default"
        className={cn("py-8 md:py-12", className)}
        {...props}
      >
        {children}
      </Container>
    )
  }
)
FormContainer.displayName = "FormContainer"

export const ContentContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'size'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        size="content"
        padding="default"
        className={cn("py-8 md:py-12", className)}
        {...props}
      >
        {children}
      </Container>
    )
  }
)
ContentContainer.displayName = "ContentContainer"

export const HeroContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'size'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        size="full"
        padding="none"
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </Container>
    )
  }
)
HeroContainer.displayName = "HeroContainer"

// Grid layout components for school portal
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "none" | "sm" | "md" | "lg" | "xl"
  responsive?: boolean
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ children, className, cols = 3, gap = "md", responsive = true, ...props }, ref) => {
    const gapClasses = {
      none: "gap-0",
      sm: "gap-3",
      md: "gap-4 md:gap-6",
      lg: "gap-6 md:gap-8",
      xl: "gap-8 md:gap-12",
    }

    const gridClasses = responsive
      ? {
          1: "grid-cols-1",
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
          6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
        }
      : {
          1: "grid-cols-1",
          2: "grid-cols-2",
          3: "grid-cols-3",
          4: "grid-cols-4",
          5: "grid-cols-5",
          6: "grid-cols-6",
        }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridClasses[cols],
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
Grid.displayName = "Grid"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode
  background?: "white" | "gray" | "primary" | "gradient" | "none"
  spacing?: "none" | "sm" | "md" | "lg" | "xl"
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, background = "white", spacing = "md", ...props }, ref) => {
    const backgroundClasses = {
      white: "bg-background",
      gray: "bg-muted/30",
      primary: "bg-primary text-primary-foreground",
      gradient: "bg-gradient-to-br from-primary/10 via-background to-secondary/10",
      none: "",
    }

    const spacingClasses = {
      none: "py-0",
      sm: "py-8 md:py-12",
      md: "py-12 md:py-16 lg:py-20",
      lg: "py-16 md:py-24 lg:py-32",
      xl: "py-24 md:py-32 lg:py-40",
    }

    return (
      <section
        ref={ref}
        className={cn(
          "w-full",
          backgroundClasses[background],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        <Container>{children}</Container>
      </section>
    )
  }
)
Section.displayName = "Section"

// Row component for flex layouts
interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "stretch" | "between"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
  gap?: "none" | "sm" | "md" | "lg"
}

export const Row = forwardRef<HTMLDivElement, RowProps>(
  ({ children, className, align = "start", justify = "start", wrap = true, gap = "md", ...props }, ref) => {
    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      between: "items-baseline",
    }

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    }

    const gapClasses = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          wrap ? "flex-wrap" : "flex-nowrap",
          alignClasses[align],
          justifyClasses[justify],
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
Row.displayName = "Row"

// Column component for flex layouts
interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number
  offset?: number
}

export const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ children, className, span, offset, ...props }, ref) => {
    const spanClass = span ? `flex-${span}` : "flex-1"
    const offsetClass = offset ? `ml-[${(offset / 12) * 100}%]` : ""

    return (
      <div
        ref={ref}
        className={cn(spanClass, offsetClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Col.displayName = "Col"
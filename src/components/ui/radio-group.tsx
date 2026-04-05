/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  variant?: 'default' | 'card' | 'pill'
  size?: 'default' | 'sm' | 'lg'
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const sizeClasses = {
    sm: "gap-1.5",
    default: "gap-2",
    lg: "gap-3"
  }

  return (
    <RadioGroupPrimitive.Root
      className={cn(
        "grid",
        sizeClasses[size],
        className
      )}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  variant?: 'default' | 'card' | 'pill'
  size?: 'default' | 'sm' | 'lg'
  label?: string
  description?: string
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant = 'default', size = 'default', label, description, children, ...props }, ref) => {
  
  const getSizeClasses = () => {
    switch(size) {
      case 'sm':
        return {
          radio: "h-3.5 w-3.5",
          indicator: "h-2 w-2",
          label: "text-xs"
        }
      case 'lg':
        return {
          radio: "h-5 w-5",
          indicator: "h-3 w-3",
          label: "text-base"
        }
      default:
        return {
          radio: "h-4 w-4",
          indicator: "h-2.5 w-2.5",
          label: "text-sm"
        }
    }
  }

  const sizeClasses = getSizeClasses()

  const getVariantClasses = () => {
    switch(variant) {
      case 'card':
        return "peer-checked:bg-primary/5 peer-checked:border-primary peer-checked:shadow-md"
      case 'pill':
        return "peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary"
      default:
        return ""
    }
  }

  const itemContent = (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative rounded-full border border-gray-300 bg-white transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary hover:shadow-sm",
        sizeClasses.radio,
        getVariantClasses(),
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        {variant === 'pill' ? (
          <CheckCircle2 className={cn("fill-current text-white", sizeClasses.indicator)} />
        ) : (
          <Circle className={cn("fill-current text-primary", sizeClasses.indicator)} />
        )}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )

  // If label or description is provided, wrap in a label
  if (label || description || children) {
    return (
      <label className={cn(
        "flex items-start gap-3 cursor-pointer group",
        variant === 'card' && "p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:border-primary hover:shadow-md",
        variant === 'pill' && "inline-flex items-center px-4 py-2 rounded-full border border-gray-200 transition-all duration-200 hover:border-primary",
        "peer-checked:border-primary",
        props.disabled && "cursor-not-allowed opacity-50"
      )}>
        {itemContent}
        <div className="flex-1">
          {label && (
            <span className={cn(
              "font-medium text-gray-700 group-hover:text-primary transition-colors",
              sizeClasses.label
            )}>
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
          {children}
        </div>
      </label>
    )
  }

  return itemContent
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Enhanced RadioGroupCard for better visual options
interface RadioGroupCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

const RadioGroupCard = React.forwardRef<HTMLDivElement, RadioGroupCardProps>(
  ({ value, label, description, icon, disabled, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-gray-200 p-4 transition-all duration-200",
          "hover:border-primary hover:shadow-md",
          "peer-checked:border-primary peer-checked:bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem value={value} id={`radio-${value}`} disabled={disabled} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              <label
                htmlFor={`radio-${value}`}
                className="font-semibold text-gray-900 cursor-pointer"
              >
                {label}
              </label>
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)
RadioGroupCard.displayName = "RadioGroupCard"

// Enhanced RadioGroupPill for horizontal options
interface RadioGroupPillProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  label: string
  disabled?: boolean
}

const RadioGroupPill = React.forwardRef<HTMLDivElement, RadioGroupPillProps>(
  ({ value, label, disabled, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          className
        )}
        {...props}
      >
        <RadioGroupItem
          value={value}
          id={`pill-${value}`}
          variant="pill"
          disabled={disabled}
          className="peer sr-only"
        />
        <label
          htmlFor={`pill-${value}`}
          className={cn(
            "inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
            "border border-gray-200 bg-white text-gray-700",
            "hover:border-primary hover:text-primary",
            "peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
RadioGroupPill.displayName = "RadioGroupPill"

// Enhanced RadioGroupButton for button-style options
interface RadioGroupButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  label: string
  disabled?: boolean
}

const RadioGroupButton = React.forwardRef<HTMLDivElement, RadioGroupButtonProps>(
  ({ value, label, disabled, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          className
        )}
        {...props}
      >
        <RadioGroupItem
          value={value}
          id={`button-${value}`}
          disabled={disabled}
          className="peer sr-only"
        />
        <label
          htmlFor={`button-${value}`}
          className={cn(
            "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
            "border border-gray-200 bg-white text-gray-700",
            "hover:bg-gray-50 hover:border-gray-300",
            "peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary peer-checked:shadow-md",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
RadioGroupButton.displayName = "RadioGroupButton"

export { 
  RadioGroup, 
  RadioGroupItem,
  RadioGroupCard,
  RadioGroupPill,
  RadioGroupButton
}
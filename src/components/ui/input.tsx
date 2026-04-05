import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
      },
      variant: {
        default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        error: "border-destructive focus-visible:ring-destructive/50",
        success: "border-success focus-visible:ring-success/50",
        ghost: "border-transparent bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
      },
      rounded: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      rounded: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  error?: string
  label?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    size,
    variant,
    rounded,
    icon,
    iconPosition = "left",
    error,
    label,
    helperText,
    required,
    containerClassName,
    id,
    disabled,
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    const hasError = !!error || variant === "error"
    const finalVariant = hasError ? "error" : variant

    return (
      <div className={cn("w-full space-y-2", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              hasError && "text-destructive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              inputVariants({ size, variant: finalVariant, rounded }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        
        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        )}
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-destructive animate-in slide-in-from-top-1"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Educational-specific input components
export const StudentIdInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        placeholder="e.g., STU2024001"
        helperText="Format: STU followed by 7 digits"
        {...props}
      />
    )
  }
)
StudentIdInput.displayName = "StudentIdInput"

export const EmailInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="email"
        placeholder="student@school.edu"
        {...props}
      />
    )
  }
)
EmailInput.displayName = "EmailInput"

export const PhoneInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        placeholder="+1 234 567 8900"
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        icon={icon || (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const EyeIcon = () => (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="focus:outline-none"
        tabIndex={-1}
      >
        {showPassword ? (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        )}
      </button>
    )

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        iconPosition="right"
        icon={<EyeIcon />}
        {...props}
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (value === "" || /^\d+$/.test(value)) {
        onChange?.(e)
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        onChange={handleChange}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export const GradeInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <NumberInput
        ref={ref}
        min={0}
        max={100}
        placeholder="0-100"
        helperText="Enter a grade between 0 and 100"
        {...props}
      />
    )
  }
)
GradeInput.displayName = "GradeInput"

export const DateInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        {...props}
      />
    )
  }
)
DateInput.displayName = "DateInput"

// Currency/Amount input for fees
export const AmountInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, ...props }, ref) => {
    const formatCurrency = (value: string) => {
      const numbers = value.replace(/[^\d]/g, '')
      if (!numbers) return ''
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parseInt(numbers))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value)
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      }
      onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <Input
        ref={ref}
        type="text"
        onChange={handleChange}
        {...props}
      />
    )
  }
)
AmountInput.displayName = "AmountInput"

export { Input }
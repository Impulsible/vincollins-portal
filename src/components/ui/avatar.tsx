"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { User, GraduationCap, Users, Shield, BookOpen } from "lucide-react"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        default: "h-10 w-10",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-24 w-24",
        "2xl": "h-32 w-32",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
        rounded: "rounded-xl",
      },
      border: {
        none: "",
        default: "ring-2 ring-background",
        primary: "ring-2 ring-primary",
        secondary: "ring-2 ring-secondary",
        white: "ring-2 ring-white",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
      border: "none",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  status?: "online" | "offline" | "away" | "busy"
  statusPosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left"
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ 
  className, 
  size, 
  shape, 
  border,
  status,
  statusPosition = "bottom-right",
  children,
  ...props 
}, ref) => {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  }

  const statusPositions = {
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-left": "bottom-0 left-0",
  }

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    default: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
    xl: "h-5 w-5",
    "2xl": "h-6 w-6",
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        avatarVariants({ size, shape, border }),
        "relative",
        className
      )}
      {...props}
    >
      {children}
      {status && (
        <span
          className={cn(
            "absolute block rounded-full ring-2 ring-background",
            statusColors[status],
            statusPositions[statusPosition],
            statusSizes[size || "default"]
          )}
        >
          <span className="sr-only">{status}</span>
        </span>
      )}
    </AvatarPrimitive.Root>
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    icon?: React.ReactNode
  }
>(({ className, icon, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
      className
    )}
    {...props}
  >
    {icon || children || <User className="h-1/2 w-1/2" />}
  </AvatarPrimitive.Fallback>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced Avatar Group component
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: AvatarProps["size"]
  spacing?: "sm" | "md" | "lg"
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 5, size = "default", spacing = "md", ...props }, ref) => {
    const childrenArray = React.Children.toArray(children)
    const total = childrenArray.length
    const visible = childrenArray.slice(0, max)
    const remaining = total - max

    const spacingClasses = {
      sm: "-space-x-2",
      md: "-space-x-3",
      lg: "-space-x-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visible.map((child, index) => (
          <div key={index} className="ring-2 ring-background rounded-full">
            {child}
          </div>
        ))}
        {remaining > 0 && (
          <Avatar size={size} className="ring-2 ring-background">
            <AvatarFallback className="bg-primary text-primary-foreground">
              +{remaining}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

// Pre-configured avatars for different roles
interface RoleAvatarProps extends Omit<AvatarProps, 'children'> {
  role: "student" | "teacher" | "admin" | "staff"
  name?: string
  image?: string
}

const RoleAvatar = React.forwardRef<HTMLDivElement, RoleAvatarProps>(
  ({ role, name, image, ...props }, ref) => {
    const roleIcons = {
      student: <GraduationCap className="h-1/2 w-1/2" />,
      teacher: <BookOpen className="h-1/2 w-1/2" />,
      admin: <Shield className="h-1/2 w-1/2" />,
      staff: <Users className="h-1/2 w-1/2" />,
    }

    const roleColors = {
      student: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      teacher: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      admin: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      staff: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    }

    const getInitials = (name?: string) => {
      if (!name) return ""
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <Avatar ref={ref as never} {...props}>
        {image && <AvatarImage src={image} alt={name || role} />}
        <AvatarFallback className={roleColors[role]}>
          {getInitials(name) || roleIcons[role]}
        </AvatarFallback>
      </Avatar>
    )
  }
)
RoleAvatar.displayName = "RoleAvatar"

// Avatar with tooltip for user info
interface AvatarWithInfoProps extends RoleAvatarProps {
  email?: string
  showInfo?: boolean
  onInfoClick?: () => void
}

const AvatarWithInfo = React.forwardRef<HTMLDivElement, AvatarWithInfoProps>(
  ({ role, name, email, image, showInfo = false, onInfoClick, ...props }, ref) => {
    const [show, setShow] = React.useState(false)

    const handleMouseEnter = () => setShow(true)
    const handleMouseLeave = () => setShow(false)

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <RoleAvatar
          ref={ref}
          role={role}
          name={name}
          image={image}
          {...props}
        />
        
        {(show || showInfo) && (
          <div 
            className={cn(
              "absolute z-50 mt-2 w-48 rounded-lg border bg-popover p-3 shadow-md",
              "animate-in fade-in-0 zoom-in-95",
              "top-full left-1/2 -translate-x-1/2"
            )}
            onClick={onInfoClick}
          >
            <div className="space-y-2">
              {name && <p className="font-semibold text-sm">{name}</p>}
              {email && <p className="text-xs text-muted-foreground">{email}</p>}
              <p className="text-xs text-primary capitalize">{role}</p>
            </div>
          </div>
        )}
      </div>
    )
  }
)
AvatarWithInfo.displayName = "AvatarWithInfo"

// Avatar List for displaying multiple avatars with names
interface AvatarListItemProps {
  avatar: React.ReactNode
  name: string
  role?: string
  description?: string
  onClick?: () => void
}

const AvatarListItem = React.forwardRef<HTMLDivElement, AvatarListItemProps>(
  ({ avatar, name, role, description, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-colors",
          onClick && "cursor-pointer hover:bg-muted"
        )}
        onClick={onClick}
        {...props}
      >
        {avatar}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {role && (
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
    )
  }
)
AvatarListItem.displayName = "AvatarListItem"

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup,
  RoleAvatar,
  AvatarWithInfo,
  AvatarListItem
}
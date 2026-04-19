import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default variants
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        
        // Status variants
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        
        // Grade variants
        gradeA: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        gradeB: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        gradeC: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        gradeD: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        gradeF: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        
        // Student status variants
        enrolled: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        graduated: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        suspended: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        active: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        inactive: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        pending: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        approved: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        rejected: "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
        
        // Exam variants
        passed: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        failed: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        excellent: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        good: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        fair: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        poor: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        
        // Attendance variants
        present: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        absent: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        late: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        excused: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        
        // Payment variants
        paid: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        unpaid: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        partial: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        overdue: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        
        // Role variants
        admin: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        teacher: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        student: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        staff: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      rounded: {
        default: "rounded-full",
        sm: "rounded",
        md: "rounded-md",
        lg: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  closable?: boolean
  onClose?: () => void
}

// FIXED: Added forwardRef here
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size,
    rounded,
    icon,
    iconPosition = "left",
    closable,
    onClose,
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, rounded }), className)}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="mr-1 inline-flex items-center">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="ml-1 inline-flex items-center">{icon}</span>
        )}
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
            aria-label="Remove badge"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = "Badge"

// Helper components for common school portal badges
export const GradeBadge = ({ score }: { score: number }) => {
  const getGradeVariant = (score: number) => {
    if (score >= 80) return "gradeA"
    if (score >= 70) return "gradeB"
    if (score >= 60) return "gradeC"
    if (score >= 50) return "gradeD"
    return "gradeF"
  }

  const getGradeLetter = (score: number) => {
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  return (
    <Badge variant={getGradeVariant(score)}>
      {getGradeLetter(score)}
    </Badge>
  )
}

export const StatusBadge = ({ status }: { status: "active" | "inactive" | "pending" | "suspended" }) => {
  const variants = {
    active: "active",
    inactive: "inactive",
    pending: "pending",
    suspended: "suspended",
  }

  const labels = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    suspended: "Suspended",
  }

  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
    </Badge>
  )
}

export const AttendanceBadge = ({ status }: { status: "present" | "absent" | "late" | "excused" }) => {
  const variants = {
    present: "present",
    absent: "absent",
    late: "late",
    excused: "excused",
  }

  const labels = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    excused: "Excused",
  }

  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
    </Badge>
  )
}

export const PaymentBadge = ({ status }: { status: "paid" | "unpaid" | "partial" | "overdue" }) => {
  const variants = {
    paid: "paid",
    unpaid: "unpaid",
    partial: "partial",
    overdue: "overdue",
  }

  const labels = {
    paid: "Paid",
    unpaid: "Unpaid",
    partial: "Partial",
    overdue: "Overdue",
  }

  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
    </Badge>
  )
}

export const RoleBadge = ({ role }: { role: "admin" | "teacher" | "student" | "staff" }) => {
  const variants = {
    admin: "admin",
    teacher: "teacher",
    student: "student",
    staff: "staff",
  }

  const labels = {
    admin: "Administrator",
    teacher: "Teacher",
    student: "Student",
    staff: "Staff",
  }

  return (
    <Badge variant={variants[role] as any}>
      {labels[role]}
    </Badge>
  )
}

export const ExamResultBadge = ({ score }: { score: number }) => {
  const getExamVariant = (score: number) => {
    if (score >= 80) return "excellent"
    if (score >= 70) return "good"
    if (score >= 60) return "fair"
    if (score >= 50) return "passed"
    return "failed"
  }

  const getExamLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 60) return "Fair"
    if (score >= 50) return "Passed"
    return "Failed"
  }

  return (
    <Badge variant={getExamVariant(score)}>
      {getExamLabel(score)}
    </Badge>
  )
}

export { Badge, badgeVariants }
// components/admin/students/components/dialogs/ViewDetailsDialog.tsx

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Student, PresenceStatus } from '../../types'
import { GENDERS } from '../../constants'
import {
  getInitials,
  formatLastSeen,
  getDaysRemaining,
  formatDate,
} from '../../utils'
import { StatusBadge } from '../StudentPresenceIndicator'

interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  status: PresenceStatus
  lastSeen: string
}

export function ViewDetailsDialog({
  open,
  onOpenChange,
  student,
  status,
  lastSeen,
}: ViewDetailsDialogProps) {
  if (!student) return null

  const genderEmoji = GENDERS.find(g => g.value === student.gender)?.emoji || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Complete student information and field visibility
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{student.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <div className="mt-1">
                <StatusBadge status={status} isActive={student.is_active} />
              </div>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-4">
            <DetailItem label="VIN ID" value={student.vin_id} mono />
            <DetailItem
              label="Admission No."
              value={student.admission_number || '-'}
              mono
              className="text-emerald-600 font-bold"
            />
            <DetailItem label="Class" value={student.class || '-'} />
            <DetailItem label="Department" value={student.department || '-'} />
            <DetailItem
              label="Admission Year"
              value={student.admission_year?.toString() || '-'}
            />
            <DetailItem
              label="Gender"
              value={`${genderEmoji} ${student.gender || '-'}`}
            />
            <DetailItem
              label="Date of Birth"
              value={formatDate(student.date_of_birth)}
            />
            <DetailItem label="Phone" value={student.phone || '-'} />
            <DetailItem label="Last Seen" value={formatLastSeen(lastSeen)} icon={<Clock className="h-3 w-3" />} />
          </div>

          {/* Next Term Begins */}
          {student.next_term_begins && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-medium text-blue-800">
                📅 Next Term Begins
              </p>
              <p className="text-lg font-bold text-blue-900">
                {formatDate(student.next_term_begins)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {getDaysRemaining(student.next_term_begins)}
              </p>
            </div>
          )}

          {/* Address */}
          {student.address && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="text-sm bg-muted rounded-lg p-3">
                {student.address}
              </p>
            </div>
          )}

          {/* Field Visibility Guide */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-3 text-sm">Field Visibility Guide</h4>
            <div className="space-y-2">
              <VisibilityRow
                label="Admission Number"
                badges={['Portal', 'CBT', 'Report Card']}
                variant="secondary"
              />
              <VisibilityRow
                label="Gender"
                badges={['Portal', 'Report Card']}
              />
              <VisibilityRow
                label="Date of Birth"
                badges={['Portal', 'Report Card']}
              />
              <VisibilityRow
                label="Next Term Begins"
                badges={['Portal', 'Report Card']}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper sub-components
function DetailItem({
  label,
  value,
  mono = false,
  icon,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-medium flex items-center gap-1',
          mono && 'font-mono',
          className
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  )
}

function VisibilityRow({
  label,
  badges,
  variant = 'outline',
}: {
  label: string
  badges: string[]
  variant?: 'secondary' | 'outline'
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <div className="flex gap-1">
        {badges.map(b => (
          <Badge key={b} variant={variant} className="text-xs">
            {b}
          </Badge>
        ))}
      </div>
    </div>
  )
}
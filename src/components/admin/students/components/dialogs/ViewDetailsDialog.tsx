// components/admin/students/components/dialogs/ViewDetailsDialog.tsx

'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Calendar, Phone, MapPin, Hash, Fingerprint, GraduationCap, Users, Eye } from 'lucide-react'
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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b px-5 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-emerald-600" />
              Student Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Profile Header */}
          <div className="flex items-center gap-4 pb-2 border-b">
            <Avatar className="h-14 w-14 ring-2 ring-emerald-100">
              <AvatarImage src={student.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-semibold">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-slate-800">{student.full_name}</p>
              <p className="text-xs text-slate-500">{student.email}</p>
              <div className="mt-1.5">
                <StatusBadge status={status} isActive={student.is_active} />
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identification</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> VIN ID
                </span>
                <span className="font-mono text-sm font-medium">{student.vin_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Admission No.
                </span>
                <span className="font-mono text-sm font-bold text-emerald-600">
                  {student.admission_number || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Class</p>
                <p className="font-medium text-sm">{student.class || '—'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Department</p>
                <p className="font-medium text-sm">{student.department || '—'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Admission Year</p>
                <p className="font-medium text-sm">{student.admission_year || '—'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">Gender</p>
                <p className="font-medium text-sm">{genderEmoji} {student.gender || '—'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact & Personal</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 w-24 text-xs">Date of Birth</span>
                <span className="text-slate-700">{formatDate(student.date_of_birth) || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 w-24 text-xs">Phone</span>
                <span className="text-slate-700">{student.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 w-24 text-xs">Last Seen</span>
                <span className="text-slate-700">{formatLastSeen(lastSeen)}</span>
              </div>
              {student.address && (
                <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                  <span className="text-slate-500 w-24 text-xs">Address</span>
                  <span className="text-slate-700 flex-1">{student.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Next Term Banner */}
          {student.next_term_begins && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">Next Term Begins</p>
              </div>
              <p className="text-base font-bold text-emerald-800">
                {formatDate(student.next_term_begins)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {getDaysRemaining(student.next_term_begins)}
              </p>
            </div>
          )}

          {/* Field Visibility Guide */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-xs font-medium text-slate-600">Field Visibility</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Admission Number</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[9px] px-1.5">Portal</Badge>
                  <Badge variant="secondary" className="text-[9px] px-1.5">CBT</Badge>
                  <Badge variant="secondary" className="text-[9px] px-1.5">Report</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Gender / DOB</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[9px] px-1.5">Portal</Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5">Report</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Next Term</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[9px] px-1.5">Portal</Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5">Report</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-950 border-t px-5 py-3">
          <Button onClick={() => onOpenChange(false)} className="h-8 px-4 text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
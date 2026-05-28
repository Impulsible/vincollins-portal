// components/admin/students/components/dialogs/EditStudentDialog.tsx

'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Hash, Fingerprint, User, Calendar, Phone, MapPin, School, Users, GraduationCap } from 'lucide-react'
import { Student } from '../../types'
import {
  CLASSES,
  DEPARTMENTS,
  GENDERS,
  generateAdmissionYears,
} from '../../constants'

interface EditStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onStudentChange: (student: Student) => void
  onSave: () => Promise<void>
  isSubmitting: boolean
}

export function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onStudentChange,
  onSave,
  isSubmitting,
}: EditStudentDialogProps) {
  const admissionYears = generateAdmissionYears()
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')

  useEffect(() => {
    if (open && student) {
      setFirstName(student.first_name || '')
      setMiddleName(student.middle_name || '')
      setLastName(student.last_name || '')
    }
  }, [open, student])

  if (!student) return null

  const update = (updates: Partial<Student>) => {
    onStudentChange({ ...student, ...updates })
  }

  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    const fullName = buildFullName(value, middleName, lastName)
    const displayName = buildDisplayName(value, middleName, lastName)
    update({ first_name: value, full_name: fullName, display_name: displayName })
  }

  const handleMiddleNameChange = (value: string) => {
    setMiddleName(value)
    const fullName = buildFullName(firstName, value, lastName)
    const displayName = buildDisplayName(firstName, value, lastName)
    update({ middle_name: value, full_name: fullName, display_name: displayName })
  }

  const handleLastNameChange = (value: string) => {
    setLastName(value)
    const fullName = buildFullName(firstName, middleName, value)
    const displayName = buildDisplayName(firstName, middleName, value)
    update({ last_name: value, full_name: fullName, display_name: displayName })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-emerald-600" />
              Edit Student
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-1">
            Changes sync across Portal, CBT, and Report Card
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-700">Full Name</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={e => handleLastNameChange(e.target.value)}
                  placeholder="Surname"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">First Name</Label>
                <Input
                  value={firstName}
                  onChange={e => handleFirstNameChange(e.target.value)}
                  placeholder="First name"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Middle Name</Label>
                <Input
                  value={middleName}
                  onChange={e => handleMiddleNameChange(e.target.value)}
                  placeholder="Other names"
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-xs space-y-1">
              <p className="text-slate-500">Full name: <span className="font-medium text-slate-700">{student.full_name}</span></p>
              <p className="text-slate-500">Display name: <span className="font-medium text-slate-700">{student.display_name}</span></p>
            </div>
          </div>

          {/* Academic Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-700">Academic Info</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Class</Label>
                <Select value={student.class || ''} onValueChange={v => update({ class: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Admission Year</Label>
                <Select
                  value={student.admission_year?.toString() || ''}
                  onValueChange={v => update({ admission_year: parseInt(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {admissionYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Department (SS Only)</Label>
                <Select value={student.department || ''} onValueChange={v => update({ department: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Identification Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-700">Identification</h3>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Admission Number</Label>
              <Input
                value={student.admission_number || ''}
                onChange={e => update({ admission_number: e.target.value })}
                placeholder="e.g., 2025VIN062"
                className="mt-1 h-9 font-mono"
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Fingerprint className="h-3 w-3" />
                VIN ID (Read-only)
              </Label>
              <p className="font-mono text-sm text-slate-600 mt-1">{student.vin_id || '—'}</p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-700">Personal Info</h3>
              <Badge variant="outline" className="text-[10px]">Portal & Report</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Gender</Label>
                <Select
                  value={student.gender || 'male'}
                  onValueChange={v => update({ gender: v as any })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.emoji} {g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Date of Birth</Label>
                <Input
                  type="date"
                  value={student.date_of_birth || ''}
                  onChange={e => update({ date_of_birth: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">Contact</h3>
              <Badge variant="outline" className="text-[10px]">Optional</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Phone</Label>
                <Input
                  value={student.phone || ''}
                  onChange={e => update({ phone: e.target.value })}
                  placeholder="Phone number"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Next Term Begins</Label>
                <Input
                  type="date"
                  value={student.next_term_begins || ''}
                  onChange={e => update({ next_term_begins: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Address</Label>
                <Input
                  value={student.address || ''}
                  onChange={e => update({ address: e.target.value })}
                  placeholder="Home address"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-slate-600">Account Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={student.is_active}
                onChange={e => update({ is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              <span className="ml-3 text-sm font-medium">
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-950 border-t px-6 py-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-9">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 h-9">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function buildFullName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim()
  const middle = middleName.trim()
  const last = lastName.trim()
  if (!first || !last) return ''
  return middle ? `${first} ${middle} ${last}` : `${first} ${last}`
}

function buildDisplayName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim()
  const middle = middleName.trim()
  const last = lastName.trim()
  if (!first || !last) return ''
  return middle ? `${last} ${first} ${middle}` : `${last} ${first}`
}
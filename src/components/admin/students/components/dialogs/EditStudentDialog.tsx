// components/admin/students/components/dialogs/EditStudentDialog.tsx

'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, Hash, Fingerprint } from 'lucide-react'
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

  // ✅ Local state for name fields to properly handle editing
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')

  // ✅ Sync local state when student changes or dialog opens
  useEffect(() => {
    if (open && student) {
      console.log('📝 Edit dialog opened for:', student.full_name, student.id)
      setFirstName(student.first_name || '')
      setMiddleName(student.middle_name || '')
      setLastName(student.last_name || '')
    }
  }, [open, student])

  if (!student) return null

  // ✅ Update function that properly reconstructs full_name and display_name
  const update = (updates: Partial<Student>) => {
    const updatedStudent = { ...student, ...updates }
    console.log('🔄 Field updated:', Object.keys(updates), updates)
    onStudentChange(updatedStudent)
  }

  // ✅ Handle name changes - update individual name parts AND full_name/display_name
  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    const fullName = buildFullName(value, middleName, lastName)
    const displayName = buildDisplayName(value, middleName, lastName)
    update({
      first_name: value,
      full_name: fullName,
      display_name: displayName,
    })
  }

  const handleMiddleNameChange = (value: string) => {
    setMiddleName(value)
    const fullName = buildFullName(firstName, value, lastName)
    const displayName = buildDisplayName(firstName, value, lastName)
    update({
      middle_name: value || '',
      full_name: fullName,
      display_name: displayName,
    })
  }

  const handleLastNameChange = (value: string) => {
    setLastName(value)
    const fullName = buildFullName(firstName, middleName, value)
    const displayName = buildDisplayName(firstName, middleName, value)
    update({
      last_name: value,
      full_name: fullName,
      display_name: displayName,
    })
  }

  const handleSave = async () => {
    console.log('💾 Save button clicked')
    console.log('📋 Final student data:', {
      full_name: student.full_name,
      display_name: student.display_name,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
    })
    await onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information. Changes will sync across Portal, CBT, and Report Card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* ============================================ */}
          {/* SECTION 1: NAME - FIXED with separate fields */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Student Name
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Surname</Label>
                <Input
                  value={lastName}
                  onChange={e => handleLastNameChange(e.target.value)}
                  placeholder="Surname"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={e => handleFirstNameChange(e.target.value)}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Other Name(s)</Label>
                <Input
                  value={middleName}
                  onChange={e => handleMiddleNameChange(e.target.value)}
                  placeholder="Other names"
                  className="mt-1"
                />
              </div>
            </div>
            {/* ✅ Show computed names */}
            <div className="mt-2 space-y-1">
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Full Name (First Middle Last):</p>
                <p className="font-medium">{student.full_name}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Display Name (Surname First Other):</p>
                <p className="font-medium">{student.display_name}</p>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 2: PERSONAL INFO */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Personal Information
              <Badge variant="outline" className="text-xs ml-2">Portal &amp; Report Only</Badge>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <Select
                  value={student.gender || 'male'}
                  onValueChange={v => update({ gender: v as 'male' | 'female' | 'other' })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.emoji} {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={student.date_of_birth || ''}
                  onChange={e => update({ date_of_birth: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 3: ACADEMIC INFO */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Academic Information
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={student.class || ''}
                    onValueChange={v => update({ class: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Admission Year</Label>
                  <Select
                    value={student.admission_year?.toString() || ''}
                    onValueChange={v => update({ admission_year: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {admissionYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={student.department || ''}
                  onValueChange={v => update({ department: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 4: IDENTIFICATION NUMBERS */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Identification Numbers
            </h4>
            <div className="space-y-4">
              {/* Admission Number - Editable */}
              <div>
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-600" />
                  Admission Number
                </Label>
                <Input
                  value={student.admission_number || ''}
                  onChange={e => update({ admission_number: e.target.value })}
                  placeholder="e.g., 2025VIN62"
                  className="mt-1 font-mono text-lg"
                />
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">Portal</Badge>
                  <Badge variant="secondary" className="text-xs">CBT</Badge>
                  <Badge variant="secondary" className="text-xs">Report Card</Badge>
                </div>
              </div>

              {/* VIN ID - Read Only */}
              <div>
                <Label className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  VIN ID (System Generated)
                </Label>
                <Input
                  value={student.vin_id || ''}
                  disabled
                  className="mt-1 font-mono bg-muted cursor-not-allowed opacity-75"
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 5: NEXT TERM */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Term Information
              <Badge variant="outline" className="text-xs ml-2">Portal &amp; Report Only</Badge>
            </h4>
            <div>
              <Label>Next Term Begins</Label>
              <Input
                type="date"
                value={student.next_term_begins || ''}
                onChange={e => update({ next_term_begins: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 6: CONTACT INFO */}
          {/* ============================================ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={student.phone || ''}
                  onChange={e => update({ phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={student.address || ''}
                  onChange={e => update({ address: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={student.is_active}
                onChange={e => update({ is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              <span className="ml-3 text-sm font-medium">Active Account</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// HELPER: Build full name from parts
// ============================================
function buildFullName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim()
  const middle = middleName.trim()
  const last = lastName.trim()

  if (!first || !last) return ''

  if (middle) {
    return `${first} ${middle} ${last}`
  }
  return `${first} ${last}`
}

// ============================================
// HELPER: Build display name (Surname First Other)
// ============================================
function buildDisplayName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim()
  const middle = middleName.trim()
  const last = lastName.trim()

  if (!first || !last) return ''

  if (middle) {
    return `${last} ${first} ${middle}` // "Yusuf Laila Zainab"
  }
  return `${last} ${first}` // "Yusuf Laila"
}
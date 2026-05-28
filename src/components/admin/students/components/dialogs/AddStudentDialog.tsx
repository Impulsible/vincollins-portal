// components/admin/students/components/dialogs/AddStudentDialog.tsx - WITH BUTTON

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { UserPlus, Loader2, Eye, Hash, Fingerprint, Phone, GraduationCap, Users } from 'lucide-react'
import { StudentFormData, Credentials } from '../../types'

// Define constants locally
const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const DEPARTMENTS = ['Science', 'Arts', 'Commercial']
const GENDERS = [
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'other', label: 'Other', emoji: '👤' }
]

const INITIAL_FORM_DATA: StudentFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  admission_number: '',
  class: '',
  department: '',
  gender: 'male',
  date_of_birth: '',
  admission_year: new Date().getFullYear(),
  phone: '',
  address: '',
  next_term_begins: ''
}

const generateAdmissionYears = (): number[] => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years.sort((a, b) => b - a)
}

const generateEmailPreview = (firstName: string, lastName: string): string => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@vincollins.edu.ng`
}

interface AddStudentDialogProps {
  onCreateStudent: (data: StudentFormData) => Promise<Credentials | null>
  onCredentialsGenerated: (credentials: Credentials) => void
  isSubmitting: boolean
}

export function AddStudentDialog({
  onCreateStudent,
  onCredentialsGenerated,
  isSubmitting,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const admissionYears = generateAdmissionYears()
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA)

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.class) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.admission_number) {
      toast.error('Admission number is required')
      return
    }

    const credentials = await onCreateStudent(formData)
    if (credentials) {
      setOpen(false)
      onCredentialsGenerated(credentials)
      setFormData(INITIAL_FORM_DATA)
      toast.success('Student created successfully!')
    }
  }

  const updateField = <K extends keyof StudentFormData>(
    key: K,
    value: StudentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Add New Student
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-1">
            VIN ID auto-generated • Admission number required
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-700">Full Name</h3>
              <Badge variant="secondary" className="text-[10px]">Required</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500">First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={e => updateField('first_name', e.target.value)}
                  placeholder="First name"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Middle Name</Label>
                <Input
                  value={formData.middle_name}
                  onChange={e => updateField('middle_name', e.target.value)}
                  placeholder="Middle name"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={e => updateField('last_name', e.target.value)}
                  placeholder="Last name"
                  className="mt-1 h-9"
                />
              </div>
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
                <Select value={formData.class} onValueChange={v => updateField('class', v)}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs text-slate-500">Admission Year</Label>
                <Select
                  value={formData.admission_year.toString()}
                  onValueChange={v => updateField('admission_year', parseInt(v))}
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
                <Select
                  value={formData.department}
                  onValueChange={v => updateField('department', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select department (optional)" />
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

          {/* Identification Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-700">Identification</h3>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Admission Number</Label>
              <Input
                value={formData.admission_number}
                onChange={e => updateField('admission_number', e.target.value)}
                placeholder="e.g., 2025VIN062"
                className="mt-1 h-9 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used for portal login, CBT, and report cards
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Fingerprint className="h-3 w-3" />
                VIN ID (Auto-generated)
              </Label>
              <p className="font-mono text-sm text-emerald-600 mt-1">
                VIN-STD-{formData.admission_year || 'YYYY'}-XXXX
              </p>
            </div>
          </div>

          {/* Personal Info (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-700">Personal Info</h3>
              <Badge variant="outline" className="text-[10px]">Optional</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={v => updateField('gender', v as any)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
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
                  value={formData.date_of_birth}
                  onChange={e => updateField('date_of_birth', e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* Contact Info (Optional) */}
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
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="Phone number"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Next Term Begins</Label>
                <Input
                  type="date"
                  value={formData.next_term_begins}
                  onChange={e => updateField('next_term_begins', e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500">Address</Label>
                <Input
                  value={formData.address}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="Home address"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-4 border border-emerald-200">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-3">
              Summary
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-slate-500">Email</p>
                <p className="font-mono text-xs truncate">
                  {formData.first_name && formData.last_name
                    ? generateEmailPreview(formData.first_name, formData.last_name)
                    : 'student@vincollins.edu.ng'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Admission No</p>
                <p className="font-mono text-xs font-medium">
                  {formData.admission_number || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Class</p>
                <p className="font-mono text-xs">{formData.class || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">VIN ID</p>
                <p className="font-mono text-xs">VIN-STD-{formData.admission_year || 'YYYY'}-XXXX</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-950 border-t px-6 py-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 h-9"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Student
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
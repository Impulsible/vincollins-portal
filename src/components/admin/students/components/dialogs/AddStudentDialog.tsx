// components/admin/students/components/dialogs/AddStudentDialog.tsx - WITH DARK MODE
'use client'

import { useState, useEffect } from 'react'
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
import { UserPlus, Loader2, Eye, Hash, Fingerprint, Phone, GraduationCap, Users, Building2 } from 'lucide-react'
import { StudentFormData, Credentials } from '../../types'

const JSS_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3']

const SS_CLASS_OPTIONS = {
  general: [
    { value: 'SS1', label: 'SS1 (All Students)', description: 'General subjects - Math, English' },
    { value: 'SS2', label: 'SS2 (All Students)', description: 'General subjects - Math, English' },
    { value: 'SS3', label: 'SS3 (All Students)', description: 'General subjects - Math, English' },
  ],
  science: [
    { value: 'SS1 Science', label: 'SS1 Science', description: 'Physics, Chemistry, Biology' },
    { value: 'SS2 Science', label: 'SS2 Science', description: 'Physics, Chemistry, Biology' },
    { value: 'SS3 Science', label: 'SS3 Science', description: 'Physics, Chemistry, Biology' },
  ],
  arts: [
    { value: 'SS1 Arts', label: 'SS1 Arts', description: 'Literature, Government, CRS' },
    { value: 'SS2 Arts', label: 'SS2 Arts', description: 'Literature, Government, CRS' },
    { value: 'SS3 Arts', label: 'SS3 Arts', description: 'Literature, Government, CRS' },
  ],
  commercial: [
    { value: 'SS1 Commercial', label: 'SS1 Commercial', description: 'Accounting, Commerce, Economics' },
    { value: 'SS2 Commercial', label: 'SS2 Commercial', description: 'Accounting, Commerce, Economics' },
    { value: 'SS3 Commercial', label: 'SS3 Commercial', description: 'Accounting, Commerce, Economics' },
  ],
}

const ALL_CLASS_OPTIONS = [
  ...JSS_CLASSES.map(c => ({ value: c, label: c, group: 'Junior Secondary', description: 'Junior Secondary School' })),
  ...SS_CLASS_OPTIONS.general,
  ...SS_CLASS_OPTIONS.science,
  ...SS_CLASS_OPTIONS.arts,
  ...SS_CLASS_OPTIONS.commercial,
]

const DEPARTMENTS = ['Science', 'Arts', 'Commercial']

const GENDERS = [
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'other', label: 'Other', emoji: '👤' }
]

const INITIAL_FORM_DATA: StudentFormData = {
  first_name: '', middle_name: '', last_name: '',
  admission_number: '', class: '', department: '',
  gender: 'male', date_of_birth: '',
  admission_year: new Date().getFullYear(),
  phone: '', address: '', next_term_begins: ''
}

const generateAdmissionYears = (): number[] => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 5; i <= currentYear + 5; i++) years.push(i)
  return years.sort((a, b) => b - a)
}

const generateEmailPreview = (firstName: string, lastName: string): string => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@vincollins.edu.ng`
}

const extractDepartmentFromClass = (className: string): string => {
  if (className.includes('Science')) return 'Science'
  if (className.includes('Arts')) return 'Arts'
  if (className.includes('Commercial')) return 'Commercial'
  return ''
}

const isJSSClass = (className: string): boolean => className?.startsWith('JSS') || false

interface AddStudentDialogProps {
  onCreateStudent: (data: StudentFormData) => Promise<Credentials | null>
  onCredentialsGenerated: (credentials: Credentials) => void
  isSubmitting: boolean
}

export function AddStudentDialog({
  onCreateStudent, onCredentialsGenerated, isSubmitting,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const admissionYears = generateAdmissionYears()
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA)

  useEffect(() => {
    const autoDepartment = extractDepartmentFromClass(formData.class)
    if (autoDepartment && autoDepartment !== formData.department) {
      setFormData(prev => ({ ...prev, department: autoDepartment }))
    }
  }, [formData.class])

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.class) {
      toast.error('Please fill in all required fields'); return
    }
    if (!formData.admission_number) {
      toast.error('Admission number is required'); return
    }
    const credentials = await onCreateStudent(formData)
    if (credentials) {
      setOpen(false)
      onCredentialsGenerated(credentials)
      setFormData(INITIAL_FORM_DATA)
      toast.success('Student created successfully!')
    }
  }

  const updateField = <K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const selectedClassOption = ALL_CLASS_OPTIONS.find(opt => opt.value === formData.class)
  const isJSS = isJSSClass(formData.class)
  const showDepartmentField = !isJSS && formData.class && !formData.class.includes('All Students')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm hover:shadow-md transition-all text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Add New Student
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            VIN ID auto-generated • Admission number required
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</h3>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Required</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">First Name</Label>
                <Input value={formData.first_name} onChange={e => updateField('first_name', e.target.value)} placeholder="First name" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Middle Name</Label>
                <Input value={formData.middle_name} onChange={e => updateField('middle_name', e.target.value)} placeholder="Middle name" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Last Name</Label>
                <Input value={formData.last_name} onChange={e => updateField('last_name', e.target.value)} placeholder="Last name" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Academic Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Academic Info</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-slate-500 dark:text-slate-400">Class *</Label>
                <Select value={formData.class} onValueChange={v => updateField('class', v)}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 sticky top-0">📖 Junior Secondary School</div>
                    {JSS_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 mt-2">📚 All Students (General Subjects)</div>
                    {SS_CLASS_OPTIONS.general.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div><div>{opt.label}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.description}</div></div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 mt-2">🔬 Science Department</div>
                    {SS_CLASS_OPTIONS.science.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div><div>{opt.label}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.description}</div></div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 mt-2">🎨 Arts Department</div>
                    {SS_CLASS_OPTIONS.arts.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div><div>{opt.label}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.description}</div></div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 mt-2">💼 Commercial Department</div>
                    {SS_CLASS_OPTIONS.commercial.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div><div>{opt.label}</div><div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.description}</div></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClassOption?.description && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{selectedClassOption.description}</p>}
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Admission Year</Label>
                <Select value={formData.admission_year.toString()} onValueChange={v => updateField('admission_year', parseInt(v))}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {admissionYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {showDepartmentField && (
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Department</Label>
                  <Select value={formData.department} onValueChange={v => updateField('department', v)}>
                    <SelectTrigger className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Auto-detected" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Automatically set based on class selection</p>
                </div>
              )}
            </div>
          </div>

          {/* Identification Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identification</h3>
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Admission Number *</Label>
              <Input value={formData.admission_number} onChange={e => updateField('admission_number', e.target.value)} placeholder="e.g., 2025VIN062" className="mt-1 h-9 font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Used for portal login, CBT, and report cards</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Fingerprint className="h-3 w-3" /> VIN ID (Auto-generated)</Label>
              <p className="font-mono text-sm text-emerald-600 dark:text-emerald-400 mt-1">VIN-STD-{formData.admission_year || 'YYYY'}-XXXX</p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personal Info</h3>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Optional</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Gender</Label>
                <Select value={formData.gender} onValueChange={v => updateField('gender', v as any)}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.emoji} {g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</Label>
                <Input type="date" value={formData.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</h3>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Optional</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Phone</Label>
                <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Phone number" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Next Term Begins</Label>
                <Input type="date" value={formData.next_term_begins} onChange={e => updateField('next_term_begins', e.target.value)} className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500 dark:text-slate-400">Address</Label>
                <Input value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="Home address" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-900/50">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Summary</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-mono text-xs truncate text-slate-800 dark:text-slate-200">{formData.first_name && formData.last_name ? generateEmailPreview(formData.first_name, formData.last_name) : 'student@vincollins.edu.ng'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Admission No</p>
                <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{formData.admission_number || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Class</p>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200">{formData.class || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">VIN ID</p>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200">VIN-STD-{formData.admission_year || 'YYYY'}-XXXX</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-9">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" />Create Student</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
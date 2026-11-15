// components/admin/students/components/dialogs/EditStudentDialog.tsx - WITH DARK MODE & PHOTO UPLOAD
'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Loader2, Hash, Fingerprint, User, Calendar, Phone, School,
  Users, GraduationCap, Camera, Upload, X, ImageIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Student } from '../../types'
import { CLASSES, DEPARTMENTS, GENDERS, generateAdmissionYears } from '../../constants'

// ── Photo upload constants (matches student profile page) ─────────────────────
const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB (matches profile page)

const GRADIENTS = [
  'from-rose-500 to-pink-600', 'from-orange-500 to-amber-600',
  'from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600',
  'from-violet-500 to-purple-600', 'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-600', 'from-lime-500 to-green-600',
]

const getAvatarGradient = (name: string) => {
  const hash = (name || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

const getInitials = (name: string) =>
  name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

// ── Upload helper (matches student profile page exactly) ──────────────────────
const uploadPhotoToStorage = async (file: File, ownerId: string): Promise<string> => {
  // Validation — same limits as profile page
  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error('Image size should be less than 5MB')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file')
  }

  // Same filename pattern as profile page: avatar-{id}-{timestamp}.{ext}
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `avatar-${ownerId}-${Date.now()}.${fileExt}`

  // Same bucket + options (upsert: false to match profile page)
  const { error: uploadError } = await supabase.storage
    .from('student-photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  // Same public URL retrieval as profile page
  const { data: urlData } = supabase.storage
    .from('student-photos')
    .getPublicUrl(fileName)

  const publicUrl = urlData.publicUrl

  // Guard: ensure bucket is actually public (prevents silent 400 errors)
  if (!publicUrl.includes('/object/public/')) {
    throw new Error(
      'Storage bucket "student-photos" is not public. Enable public access in Supabase Dashboard → Storage.'
    )
  }

  return publicUrl
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EditStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onStudentChange: (student: Student) => void
  onSave: () => Promise<void>
  isSubmitting: boolean
}

export function EditStudentDialog({
  open, onOpenChange, student, onStudentChange, onSave, isSubmitting,
}: EditStudentDialogProps) {
  const admissionYears = generateAdmissionYears()
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')

  // ── Photo upload state ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open && student) {
      setFirstName(student.first_name || '')
      setMiddleName(student.middle_name || '')
      setLastName(student.last_name || '')
      setPreviewUrl(student.photo_url || undefined)
    }
  }, [open, student])

  if (!student) return null

  const update = (updates: Partial<Student>) => {
    onStudentChange({ ...student, ...updates })
  }

  // ── Name handlers ─────────────────────────────────────────────────────────
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

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Same validation order & wording as profile page
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error('Image size should be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploadingPhoto(true)
    try {
      // Upload to Supabase Storage (matches profile page exactly)
      const publicUrl = await uploadPhotoToStorage(file, student.id)

      // Update BOTH photo_url and avatar_url (matches profile page)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          photo_url: publicUrl,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.id)

      if (updateError) throw new Error(updateError.message)

      // Update local state
      setPreviewUrl(publicUrl)
      update({ photo_url: publicUrl } as any)
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    try {
      // Clear BOTH columns (matches profile page behaviour)
      const { error } = await supabase
        .from('profiles')
        .update({
          photo_url: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.id)

      if (error) throw new Error(error.message)

      setPreviewUrl(undefined)
      update({ photo_url: undefined } as any)
      toast.success('Photo removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Edit Student
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Changes sync across Portal, CBT, and Report Card</p>
        </div>

        <div className="space-y-6 px-6 py-5">

          {/* ══ Photo Upload Section ══════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Photo</h3>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Report Card</Badge>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 border-2 border-white dark:border-slate-700 shadow-md ring-1 ring-slate-200 dark:ring-slate-600">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback
                    className={cn(
                      'text-white font-bold bg-gradient-to-br text-xl',
                      getAvatarGradient(student.full_name || student.display_name || '')
                    )}
                  >
                    {getInitials(student.full_name || student.display_name || '') || (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto || isSubmitting}
                    className="h-9 rounded-lg text-xs gap-1.5 font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : previewUrl ? (
                      <Camera className="w-3.5 h-3.5" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {isUploadingPhoto ? 'Uploading…' : previewUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>

                  {previewUrl && !isUploadingPhoto && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemovePhoto}
                      disabled={isSubmitting}
                      className="h-9 rounded-lg text-xs gap-1.5 font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                  JPG, PNG · Max 5MB · Appears on report card
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ══ Name Section ══════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Last Name</Label>
                <Input value={lastName} onChange={e => handleLastNameChange(e.target.value)} placeholder="Surname" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">First Name</Label>
                <Input value={firstName} onChange={e => handleFirstNameChange(e.target.value)} placeholder="First name" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Middle Name</Label>
                <Input value={middleName} onChange={e => handleMiddleNameChange(e.target.value)} placeholder="Other names" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-xs space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Full name: <span className="font-medium text-slate-700 dark:text-slate-300">{student.full_name}</span></p>
              <p className="text-slate-500 dark:text-slate-400">Display name: <span className="font-medium text-slate-700 dark:text-slate-300">{student.display_name}</span></p>
            </div>
          </div>

          {/* ══ Academic Section ══════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Academic Info</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Class</Label>
                <Select value={student.class || ''} onValueChange={v => update({ class: v })}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Admission Year</Label>
                <Select value={student.admission_year?.toString() || ''} onValueChange={v => update({ admission_year: parseInt(v) })}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {admissionYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500 dark:text-slate-400">Department (SS Only)</Label>
                <Select value={student.department || ''} onValueChange={v => update({ department: v })}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ══ Identification ════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identification</h3>
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Admission Number</Label>
              <Input value={student.admission_number || ''} onChange={e => update({ admission_number: e.target.value })} placeholder="e.g., 2025VIN062" className="mt-1 h-9 font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Fingerprint className="h-3 w-3" /> VIN ID (Read-only)</Label>
              <p className="font-mono text-sm text-slate-600 dark:text-slate-300 mt-1">{student.vin_id || '—'}</p>
            </div>
          </div>

          {/* ══ Personal Info ═════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personal Info</h3>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Portal & Report</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Gender</Label>
                <Select value={student.gender || 'male'} onValueChange={v => update({ gender: v as any })}>
                  <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.emoji} {g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</Label>
                <Input type="date" value={student.date_of_birth || ''} onChange={e => update({ date_of_birth: e.target.value })} className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* ══ Contact Info ══════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</h3>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">Optional</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Phone</Label>
                <Input value={student.phone || ''} onChange={e => update({ phone: e.target.value })} placeholder="Phone number" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Next Term Begins</Label>
                <Input type="date" value={student.next_term_begins || ''} onChange={e => update({ next_term_begins: e.target.value })} className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-slate-500 dark:text-slate-400">Address</Label>
                <Input value={student.address || ''} onChange={e => update({ address: e.target.value })} placeholder="Home address" className="mt-1 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* ══ Status Toggle ═════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-300">Account Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={student.is_active} onChange={e => update({ is_active: e.target.checked })} className="sr-only peer" />
              <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{student.is_active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button onClick={onSave} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-9">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFullName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim(), middle = middleName.trim(), last = lastName.trim()
  if (!first || !last) return ''
  return middle ? `${first} ${middle} ${last}` : `${first} ${last}`
}
function buildDisplayName(firstName: string, middleName: string, lastName: string): string {
  const first = firstName.trim(), middle = middleName.trim(), last = lastName.trim()
  if (!first || !last) return ''
  return middle ? `${last} ${first} ${middle}` : `${last} ${first}`
}
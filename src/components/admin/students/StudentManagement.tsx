/* eslint-disable @typescript-eslint/no-explicit-any */
 
// components/admin/students/StudentManagement.tsx - COMPLETE WITH BULK UPLOAD
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  KeyRound,
  Copy,
  CheckCircle,
  Shield,
  RefreshCw,
  Loader2,
  FolderOpen,
  Users,
  Search,
  X,
  Eye,
  Circle,
  CircleDot,
  GraduationCap,
  BookOpen,
  Wifi,
  WifiOff,
  Clock,
  Calendar,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PresenceEvent {
  user_id: string
  status?: 'online' | 'away'
  last_seen?: string
  role?: string
  [key: string]: any
}

interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  class: string
  department: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  photo_url?: string
  last_seen?: string
  admission_year?: number
  phone?: string
  address?: string
}

interface StudentManagementProps {
  students: Student[]
  onRefresh: () => void
  loading?: boolean
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const departments = ['Science', 'Arts', 'Commercial', 'Technology']
const currentYear = new Date().getFullYear()

const generateAdmissionYears = (): number[] => {
  const startYear = 2022
  const endYear = currentYear + 10
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  return years
}

const admissionYears = generateAdmissionYears()

const getClassColor = (className: string) => {
  const colors: Record<string, string> = {
    'JSS 1': 'from-amber-500 to-orange-500',
    'JSS 2': 'from-rose-500 to-red-500',
    'JSS 3': 'from-cyan-500 to-sky-500',
    'SS 1': 'from-emerald-500 to-teal-500',
    'SS 2': 'from-blue-500 to-indigo-500',
    'SS 3': 'from-purple-500 to-pink-500',
  }
  return colors[className] || 'from-gray-500 to-gray-600'
}

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Never'
  
  const lastSeen = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - lastSeen.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return lastSeen.toLocaleDateString()
}

const generateRandomVinNumber = (): string => {
  return String(Math.floor(Math.random() * 9000) + 1000)
}

const generateUniqueVin = async (year: number, role: 'student' | 'staff'): Promise<string> => {
  const prefix = role === 'student' ? 'VIN-STD' : 'VIN-STF'
  let vinId = ''
  let isUnique = false
  let attempts = 0
  const maxAttempts = 20

  while (!isUnique && attempts < maxAttempts) {
    const randomDigits = generateRandomVinNumber()
    vinId = `${prefix}-${year}-${randomDigits}`
    
    const { data } = await supabase
      .from('users')
      .select('vin_id')
      .eq('vin_id', vinId)
      .maybeSingle()
    
    if (!data) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-4)
    vinId = `${prefix}-${year}-${timestamp}`
  }

  return vinId
}

const generateSafeEmail = (firstName: string, lastName: string): string => {
  const cleanFirst = firstName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)
  
  const cleanLast = lastName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)
  
  const safeFirst = cleanFirst || 'student'
  const safeLast = cleanLast || 'user'
  
  return `${safeFirst}.${safeLast}@vincollins.edu.ng`
}

const formatFullName = (firstName: string, lastName: string): string => {
  const first = firstName.trim()
  const last = lastName.trim()
  
  const formattedFirst = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  const formattedLast = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()
  
  return `${formattedFirst} ${formattedLast}`
}

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied to clipboard!`)
}

export function StudentManagement({ students, onRefresh, loading = false }: StudentManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false)
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string; vin_id: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState<{ newPassword: string } | null>(null)
  const [viewMode, setViewMode] = useState<'classes' | 'list'>('classes')
  const [classFilter, setClassFilter] = useState<string>('all')
  
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set())
  const [awayStudents, setAwayStudents] = useState<Set<string>>(new Set())
  const [studentLastSeen, setStudentLastSeen] = useState<Map<string, string>>(new Map())
  const [isPresenceConnected, setIsPresenceConnected] = useState(false)
  
  // Bulk upload states
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadResults, setBulkUploadResults] = useState<{
    success: number
    failed: number
    errors: any[]
    students: any[]
  } | null>(null)
  
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    class: '',
    department: '',
    admission_year: currentYear,
    phone: '',
    address: ''
  })

  useEffect(() => {
    console.log(`StudentManagement: Received ${students.length} students`)
  }, [students])

  const sortedStudents = useMemo(() => {
    return [...students].map(student => {
      let className = student.class || 'Not Assigned'
      const upperClass = className.toUpperCase()
      if (upperClass.includes('JSS') && upperClass.includes('1')) className = 'JSS 1'
      else if (upperClass.includes('JSS') && upperClass.includes('2')) className = 'JSS 2'
      else if (upperClass.includes('JSS') && upperClass.includes('3')) className = 'JSS 3'
      else if (upperClass.includes('SS') && upperClass.includes('1')) className = 'SS 1'
      else if (upperClass.includes('SS') && upperClass.includes('2')) className = 'SS 2'
      else if (upperClass.includes('SS') && upperClass.includes('3')) className = 'SS 3'
      
      return { ...student, class: className }
    }).sort((a, b) => {
      const nameA = a.full_name?.toLowerCase() || ''
      const nameB = b.full_name?.toLowerCase() || ''
      return nameA.localeCompare(nameB)
    })
  }, [students])

  const classGroups = useMemo(() => {
    const groups: Record<string, { students: Student[]; count: number; onlineCount: number }> = {}
    
    classes.forEach(cls => {
      groups[cls] = { students: [], count: 0, onlineCount: 0 }
    })
    
    sortedStudents.forEach(student => {
      const className = student.class
      
      if (!groups[className]) {
        groups[className] = { students: [], count: 0, onlineCount: 0 }
      }
      
      groups[className].students.push(student)
      groups[className].count++
      if (onlineStudents.has(student.id)) {
        groups[className].onlineCount++
      }
    })
    
    return groups
  }, [sortedStudents, onlineStudents])

  const filteredStudents = useMemo(() => {
    let filtered = sortedStudents
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.vin_id?.toLowerCase().includes(query)
      )
    }
    
    if (selectedClass) {
      filtered = filtered.filter(student => student.class === selectedClass)
    }
    
    if (classFilter !== 'all' && !selectedClass) {
      filtered = filtered.filter(student => student.class === classFilter)
    }
    
    return filtered
  }, [sortedStudents, searchQuery, selectedClass, classFilter])

  const getStudentStatus = useCallback((studentId: string): 'online' | 'away' | 'offline' => {
    if (onlineStudents.has(studentId)) return 'online'
    if (awayStudents.has(studentId)) return 'away'
    return 'offline'
  }, [onlineStudents, awayStudents])

  const getStatusIcon = useCallback((studentId: string) => {
    const status = getStudentStatus(studentId)
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3 text-emerald-500" />
      case 'away': return <CircleDot className="h-3 w-3 text-amber-500" />
      default: return <WifiOff className="h-3 w-3 text-slate-400" />
    }
  }, [getStudentStatus])

  const getStatusText = useCallback((studentId: string) => {
    const status = getStudentStatus(studentId)
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      default: return 'Offline'
    }
  }, [getStudentStatus])

  const getLastSeenText = useCallback((studentId: string) => {
    const lastSeen = studentLastSeen.get(studentId)
    return formatLastSeen(lastSeen)
  }, [studentLastSeen])

  useEffect(() => {
    if (!students.length) return

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: 'admin-student-tracker' } },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const online = new Set<string>()
        const away = new Set<string>()
        const lastSeenMap = new Map<string, string>()
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: PresenceEvent) => {
            if (presence.user_id && presence.role === 'student') {
              if (presence.status === 'online') online.add(presence.user_id)
              else if (presence.status === 'away') away.add(presence.user_id)
              if (presence.last_seen) lastSeenMap.set(presence.user_id, presence.last_seen)
            }
          })
        })
        
        setOnlineStudents(online)
        setAwayStudents(away)
        setStudentLastSeen(prev => new Map([...prev, ...lastSeenMap]))
        setIsPresenceConnected(true)
      })
      .subscribe()

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [students.length])

  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.class) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const year = newStudent.admission_year || currentYear
      const fullName = formatFullName(newStudent.first_name, newStudent.last_name)
      const email = generateSafeEmail(newStudent.first_name, newStudent.last_name)
      const userId = crypto.randomUUID()
      const vinId = await generateUniqueVin(year, 'student')
      
      console.log('Creating student:', { fullName, email, vinId, admission_year: year })
      
      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle()
      
      if (existingUser) {
        toast.error(`Email ${email} already exists`)
        setIsSubmitting(false)
        return
      }
      
      // 1. Insert into USERS table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          auth_id: userId,
          email: email,
          vin_id: vinId,
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (userError) {
        console.error('Users table insert error:', userError)
        throw new Error(userError.message)
      }
      
      console.log('✅ Inserted into users table')
      
      // 2. Insert into PROFILES table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          first_name: newStudent.first_name.trim(),
          last_name: newStudent.last_name.trim(),
          role: 'student',
          role_id: `student_${email}`,
          class: newStudent.class,
          department: newStudent.department || 'General',
          admission_year: year,
          phone: newStudent.phone || null,
          address: newStudent.address || null,
          is_active: true,
          password_changed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('Profiles table insert error:', profileError)
        await supabase.from('users').delete().eq('id', userId)
        throw new Error(profileError.message)
      }
      
      console.log('✅ Inserted into profiles table')
      
      // 3. Create auth user
      try {
        const { error: authError } = await supabase.auth.signUp({
          email: email,
          password: vinId,
          options: {
            data: {
              full_name: fullName,
              first_name: newStudent.first_name.trim(),
              last_name: newStudent.last_name.trim(),
              role: 'student',
              class: newStudent.class,
              department: newStudent.department,
              admission_year: year,
              vin_id: vinId
            }
          }
        })
        
        if (authError) {
          console.warn('⚠️ Auth user creation failed:', authError.message)
          toast.warning('Student created in database but auth account needs manual setup')
        } else {
          console.log('✅ Auth user created successfully')
        }
      } catch (authError: any) {
        console.warn('⚠️ Auth user creation error:', authError.message)
      }
      
      setNewCredentials({
        email: email,
        password: vinId,
        vin_id: vinId,
      })
      
      setShowAddDialog(false)
      setShowCredentialsDialog(true)
      setNewStudent({
        first_name: '',
        last_name: '',
        class: '',
        department: '',
        admission_year: currentYear,
        phone: '',
        address: ''
      })
      
      onRefresh()
      toast.success(`${fullName} created successfully!`)
      
    } catch (error: any) {
      console.error('Error creating student:', error)
      toast.error(error.message || 'Failed to create student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStudent = async () => {
    if (!selectedStudent) return
    
    setIsSubmitting(true)
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: selectedStudent.full_name,
          class: selectedStudent.class,
          department: selectedStudent.department,
          is_active: selectedStudent.is_active,
          admission_year: selectedStudent.admission_year,
          phone: selectedStudent.phone,
          address: selectedStudent.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id)

      if (profileError) throw profileError

      toast.success('Student updated successfully')
      setShowEditDialog(false)
      setSelectedStudent(null)
      onRefresh()
    } catch (error: any) {
      console.error('Error updating student:', error)
      toast.error(error.message || 'Failed to update student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return

    setIsSubmitting(true)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedStudent.id)

      if (profileError) throw profileError

      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedStudent.id)

      if (userError) throw userError

      toast.success('Student deleted successfully')
      setShowDeleteConfirm(false)
      setSelectedStudent(null)
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting student:', error)
      toast.error(error.message || 'Failed to delete student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (student: Student) => {
    setResetPasswordData({ newPassword: student.vin_id })
    setSelectedStudent(student)
    setShowResetPasswordDialog(true)
  }

  const handleClassClick = (className: string) => {
    setSelectedClass(className)
    setViewMode('list')
    setClassFilter('all')
  }

  const handleBackToClasses = () => {
    setSelectedClass(null)
    setViewMode('classes')
    setSearchQuery('')
    setClassFilter('all')
  }

  // BULK UPLOAD FUNCTIONS
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['first_name', 'last_name', 'class']
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }
    
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const row: any = { _line: index + 2 }
      headers.forEach((header, colIndex) => {
        row[header] = values[colIndex] || ''
      })
      return row
    }).filter(row => row.first_name && row.last_name && row.class)
    
    return data
  }

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkUploadFile(file)
    setBulkUploadResults(null)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = parseCSV(text)
        setBulkUploadPreview(data.slice(0, 5))
        toast.success(`Loaded ${data.length} students from CSV`)
      } catch (error: any) {
        toast.error(error.message)
        setBulkUploadFile(null)
        setBulkUploadPreview([])
      }
    }
    reader.readAsText(file)
  }

  const downloadBulkTemplate = () => {
    const headers = ['first_name', 'last_name', 'class', 'department', 'admission_year', 'phone', 'address']
    const sampleRows = [
      ['John', 'Doe', 'SS 1', 'Science', '2024', '+2341234567890', 'Lagos, Nigeria'],
      ['Jane', 'Smith', 'JSS 2', 'Arts', '2025', '+2349876543210', 'Abuja, Nigeria'],
      ['Michael', 'Okonkwo', 'SS 3', 'Commercial', '2023', '', '']
    ]
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_bulk_upload_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error('Please select a file')
      return
    }
    
    setBulkUploading(true)
    
    try {
      const text = await bulkUploadFile.text()
      const students = parseCSV(text)
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
        students: [] as any[]
      }
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i]
        
        try {
          if (!student.first_name || !student.last_name || !student.class) {
            throw new Error('Missing required fields: first_name, last_name, class')
          }
          
          const year = parseInt(student.admission_year) || currentYear
          const fullName = formatFullName(student.first_name, student.last_name)
          const email = generateSafeEmail(student.first_name, student.last_name)
          const userId = crypto.randomUUID()
          const vinId = await generateUniqueVin(year, 'student')
          
          const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle()
          
          if (existingUser) {
            throw new Error(`Email ${email} already exists`)
          }
          
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: userId,
              auth_id: userId,
              email: email,
              vin_id: vinId,
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (userError) throw userError
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              full_name: fullName,
              first_name: student.first_name.trim(),
              last_name: student.last_name.trim(),
              role: 'student',
              role_id: `student_${email}`,
              class: student.class,
              department: student.department || 'General',
              admission_year: year,
              phone: student.phone || null,
              address: student.address || null,
              is_active: true,
              password_changed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (profileError) {
            await supabase.from('users').delete().eq('id', userId)
            throw profileError
          }
          
          try {
            await supabase.auth.signUp({
              email: email,
              password: vinId,
              options: {
                data: {
                  full_name: fullName,
                  role: 'student',
                  vin_id: vinId,
                  class: student.class
                }
              }
            })
          } catch (authError) {
            console.warn('Auth creation warning:', authError)
          }
          
          results.success++
          results.students.push({
            full_name: fullName,
            email: email,
            vin_id: vinId,
            class: student.class
          })
          
          setBulkUploadResults({ ...results })
          
        } catch (error: any) {
          results.failed++
          results.errors.push({
            line: student._line || i + 2,
            student: `${student.first_name} ${student.last_name}`,
            error: error.message
          })
          setBulkUploadResults({ ...results })
        }
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      if (results.success > 0) {
        toast.success(`${results.success} students created successfully!`)
        onRefresh()
      }
      
      if (results.failed > 0) {
        toast.error(`${results.failed} students failed to create`)
      }
      
    } catch (error: any) {
      console.error('Bulk upload error:', error)
      toast.error(error.message || 'Failed to process bulk upload')
    } finally {
      setBulkUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-wrap justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Student Management
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total {students.length} student{students.length !== 1 ? 's' : ''} enrolled
            {isPresenceConnected && onlineStudents.size > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                {onlineStudents.size} online
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => {
                setViewMode('classes')
                setSelectedClass(null)
                setClassFilter('all')
              }}
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2",
                viewMode === 'classes' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Classes</span>
            </button>
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedClass(null)
              }}
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2",
                viewMode === 'list' && !selectedClass
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">All Students</span>
            </button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowBulkUploadDialog(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter student details. Email and VIN ID will be auto-generated.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={newStudent.first_name}
                      onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={newStudent.last_name}
                      onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Class *</Label>
                    <Select value={newStudent.class} onValueChange={(v) => setNewStudent({ ...newStudent, class: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Admission Year *</Label>
                    <Select 
                      value={newStudent.admission_year.toString()} 
                      onValueChange={(v) => setNewStudent({ ...newStudent, admission_year: parseInt(v) })}
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
                  <Select value={newStudent.department} onValueChange={(v) => setNewStudent({ ...newStudent, department: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone (Optional)</Label>
                    <Input
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Address (Optional)</Label>
                    <Input
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      placeholder="Home address"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Auto-generated Email</p>
                  <p className="font-mono text-sm">
                    {newStudent.first_name && newStudent.last_name 
                      ? generateSafeEmail(newStudent.first_name, newStudent.last_name)
                      : 'student@vincollins.edu.ng'}
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Bulk Upload Students
            </DialogTitle>
            <DialogDescription>
              Upload multiple students at once using a CSV file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Step 1: Download Template
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download the CSV template with the correct format.
              </p>
              <Button variant="outline" onClick={downloadBulkTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
              <h4 className="font-medium mb-2">Step 2: Upload CSV File</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Required columns: <strong>first_name, last_name, class</strong><br />
                Optional: department, admission_year, phone, address
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleBulkFileUpload}
                disabled={bulkUploading}
              />
            </div>
            
            {bulkUploadPreview.length > 0 && !bulkUploadResults && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-medium mb-2">Preview (First 5 rows)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkUploadPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.first_name}</TableCell>
                          <TableCell>{row.last_name}</TableCell>
                          <TableCell>{row.class}</TableCell>
                          <TableCell>{row.department || '-'}</TableCell>
                          <TableCell>{row.admission_year || currentYear}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            {bulkUploadResults && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-medium mb-2">Upload Results</h4>
                <div className="flex gap-4 mb-4">
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="mr-1 h-3 w-3" />
                    {bulkUploadResults.success} Success
                  </Badge>
                  {bulkUploadResults.failed > 0 && (
                    <Badge className="bg-red-100 text-red-700">
                      <XCircle className="mr-1 h-3 w-3" />
                      {bulkUploadResults.failed} Failed
                    </Badge>
                  )}
                </div>
                
                {bulkUploadResults.students.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-green-600 mb-2">Created Students:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {bulkUploadResults.students.map((s, i) => (
                        <div key={i} className="text-xs bg-green-50 p-2 rounded">
                          {s.full_name} - {s.email} (VIN: {s.vin_id})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {bulkUploadResults.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {bulkUploadResults.errors.map((err, i) => (
                        <div key={i} className="text-xs bg-red-50 p-2 rounded">
                          <strong>Line {err.line}:</strong> {err.student} - {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Email and VIN ID will be auto-generated. 
                Password will be the VIN ID. Each student takes ~1 second to create.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkUploadDialog(false)
              setBulkUploadFile(null)
              setBulkUploadPreview([])
              setBulkUploadResults(null)
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={!bulkUploadFile || bulkUploading}
            >
              {bulkUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Students
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(viewMode === 'list' || selectedClass) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or VIN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!selectedClass && viewMode === 'list' && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes ({students.length})</SelectItem>
                  {classes.map(cls => {
                    const count = classGroups[cls]?.count || 0
                    return count > 0 ? (
                      <SelectItem key={cls} value={cls}>{cls} ({count})</SelectItem>
                    ) : null
                  })}
                </SelectContent>
              </Select>
            )}
            
            {selectedClass && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {selectedClass}
                  <button onClick={() => setSelectedClass(null)} className="ml-2 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleBackToClasses}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  All Classes
                </Button>
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'classes' && !selectedClass && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {classes.map((className, index) => {
            const group = classGroups[className]
            const studentCount = group?.count || 0
            const onlineCount = group?.onlineCount || 0
            const gradient = getClassColor(className)
            
            return (
              <motion.div
                key={className}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0",
                    studentCount > 0 
                      ? "bg-gradient-to-br from-card to-card/80" 
                      : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 opacity-70"
                  )}
                  onClick={() => studentCount > 0 && handleClassClick(className)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{className}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {studentCount > 0 ? `${studentCount} enrolled` : 'No students enrolled'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        "transition-colors flex items-center gap-1",
                        studentCount > 0 ? "text-primary/70 group-hover:text-primary" : "text-muted-foreground"
                      )}>
                        {studentCount > 0 ? 'View class' : 'Empty class'}
                        {studentCount > 0 && <FolderOpen className="h-3 w-3 group-hover:translate-x-1 transition-transform" />}
                      </span>
                      <div className="flex items-center gap-2">
                        {onlineCount > 0 && (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                            <Wifi className="h-2 w-2 mr-1" />
                            {onlineCount} online
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {(viewMode === 'list' || selectedClass) && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold py-4 px-4">Student</TableHead>
                  <TableHead className="font-semibold py-4 px-4">VIN ID</TableHead>
                  <TableHead className="font-semibold py-4 px-4">Class</TableHead>
                  <TableHead className="font-semibold py-4 px-4 hidden lg:table-cell">Admission</TableHead>
                  <TableHead className="font-semibold py-4 px-4 hidden md:table-cell">Department</TableHead>
                  <TableHead className="font-semibold py-4 px-4">Status</TableHead>
                  <TableHead className="font-semibold py-4 px-4 hidden sm:table-cell">Last Seen</TableHead>
                  <TableHead className="font-semibold py-4 px-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">No students found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery ? 'Try a different search term' : 'Click "Add Student" to get started'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => {
                    const status = getStudentStatus(student.id)
                    const isUserOnline = status === 'online'
                    const isUserAway = status === 'away'
                    const lastSeenText = getLastSeenText(student.id)
                    
                    return (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={student.photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                                  {student.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5">
                                {getStatusIcon(student.id)}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono whitespace-nowrap">
                            {student.vin_id}
                          </code>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4">
                          <Badge variant="outline" className="font-normal whitespace-nowrap">
                            {student.class || 'Not Assigned'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.admission_year || '-'}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.department || 'General'}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col min-w-[90px]">
                            <div className="flex items-center gap-1.5">
                              {student.is_active ? (
                                <>
                                  {getStatusIcon(student.id)}
                                  <span className={cn(
                                    "text-sm font-medium",
                                    isUserOnline && "text-emerald-600",
                                    isUserAway && "text-amber-600",
                                    status === 'offline' && "text-slate-500"
                                  )}>
                                    {getStatusText(student.id)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-3 w-3 text-red-400" />
                                  <span className="text-sm text-red-500">Inactive</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{lastSeenText}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedStudent(student); setShowViewDetailsDialog(true) }}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedStudent(student); setShowEditDialog(true) }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(student)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => { setSelectedStudent(student); setShowDeleteConfirm(true) }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Student Account Created!
            </DialogTitle>
            <DialogDescription>
              Save these credentials. The student will use these to log in.
            </DialogDescription>
          </DialogHeader>
          
          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="font-mono text-sm">{newCredentials.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.email, 'Email')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">VIN ID / Password</p>
                    <p className="font-mono text-sm font-bold text-primary">{newCredentials.password}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.password, 'Password')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-800 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <strong>Note:</strong> Password cannot be changed by student.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Password Reset
            </DialogTitle>
            <DialogDescription>
              Password has been reset to the VIN ID.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && resetPasswordData && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student</p>
                    <p className="font-medium">{selectedStudent.full_name}</p>
                  </div>
                  <Badge variant="secondary">{selectedStudent.vin_id}</Badge>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Password</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="font-mono text-lg font-bold text-primary">{resetPasswordData.newPassword}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resetPasswordData.newPassword, 'Password')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowResetPasswordDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={selectedStudent.full_name}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select 
                    value={selectedStudent.class} 
                    onValueChange={(v) => setSelectedStudent({ ...selectedStudent, class: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Admission Year</Label>
                  <Select 
                    value={selectedStudent.admission_year?.toString() || currentYear.toString()} 
                    onValueChange={(v) => setSelectedStudent({ ...selectedStudent, admission_year: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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
                  value={selectedStudent.department || ''} 
                  onValueChange={(v) => setSelectedStudent({ ...selectedStudent, department: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={selectedStudent.phone || ''}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={selectedStudent.address || ''}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudent.is_active}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-medium">Active Account</span>
                </label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditStudent} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the student account.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200">
                <p className="font-medium">Are you sure you want to delete:</p>
                <p className="text-lg font-bold mt-1">{selectedStudent.full_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedStudent.email}</p>
                <p className="text-sm text-muted-foreground">VIN: {selectedStudent.vin_id}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStudent} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={setShowViewDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete student information</DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                    {selectedStudent.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{selectedStudent.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-4">
                <div><p className="text-xs text-muted-foreground">VIN ID</p><p className="font-mono font-medium">{selectedStudent.vin_id}</p></div>
                <div><p className="text-xs text-muted-foreground">Class</p><p className="font-medium">{selectedStudent.class || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{selectedStudent.department || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Admission Year</p><p className="font-medium">{selectedStudent.admission_year || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selectedStudent.phone || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={selectedStudent.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {selectedStudent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {selectedStudent.address && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{selectedStudent.address}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowViewDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentManagement
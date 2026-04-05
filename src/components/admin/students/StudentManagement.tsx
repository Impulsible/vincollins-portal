/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// components/admin/students/StudentManagement.tsx
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
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Define types for presence events
interface PresenceEvent {
  user_id: string
  status?: 'online' | 'away'
  [key: string]: any
}

interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  class: string
  department: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  photo_url?: string
  last_seen?: string
}

interface StudentManagementProps {
  students: Student[]
  onRefresh: () => void
  loading?: boolean
}

const classes = ['SS 1', 'SS 2', 'SS 3', 'JSS 1', 'JSS 2', 'JSS 3']
const departments = ['Science', 'Arts', 'Commercial', 'Technology']

// Helper function to get class initials and color
const getClassColor = (className: string) => {
  const colors: Record<string, string> = {
    'SS 1': 'from-emerald-500 to-teal-500',
    'SS 2': 'from-blue-500 to-indigo-500',
    'SS 3': 'from-purple-500 to-pink-500',
    'JSS 1': 'from-amber-500 to-orange-500',
    'JSS 2': 'from-rose-500 to-red-500',
    'JSS 3': 'from-cyan-500 to-sky-500',
  }
  return colors[className] || 'from-gray-500 to-gray-600'
}

export function StudentManagement({ students, onRefresh, loading = false }: StudentManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string; vin_id: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState<{ newPassword: string } | null>(null)
  const [viewMode, setViewMode] = useState<'classes' | 'list'>('classes')
  const [classFilter, setClassFilter] = useState<string>('all')
  
  // Real-time presence state
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set())
  const [awayStudents, setAwayStudents] = useState<Set<string>>(new Set())
  const [isPresenceConnected, setIsPresenceConnected] = useState(false)
  
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    class: '',
    department: '',
  })

  // Sort students alphabetically by full name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const nameA = a.full_name?.toLowerCase() || ''
      const nameB = b.full_name?.toLowerCase() || ''
      return nameA.localeCompare(nameB)
    })
  }, [students])

  // Group students by class with counts
  const classGroups = useMemo(() => {
    const groups: Record<string, { students: Student[]; count: number }> = {}
    classes.forEach(cls => {
      const classStudents = sortedStudents.filter(s => s.class === cls)
      groups[cls] = {
        students: classStudents,
        count: classStudents.length,
      }
    })
    // Add any classes not in predefined list
    sortedStudents.forEach(student => {
      if (student.class && !classes.includes(student.class) && !groups[student.class]) {
        groups[student.class] = {
          students: [student],
          count: 1,
        }
      }
    })
    return groups
  }, [sortedStudents])

  // Filter students based on search, selected class, and class filter dropdown
  const filteredStudents = useMemo(() => {
    let filtered = sortedStudents
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Get student status (online, away, or offline)
  const getStudentStatus = useCallback((studentId: string): 'online' | 'away' | 'offline' => {
    if (onlineStudents.has(studentId)) return 'online'
    if (awayStudents.has(studentId)) return 'away'
    return 'offline'
  }, [onlineStudents, awayStudents])

  // Get status icon component
  const getStatusIcon = useCallback((studentId: string) => {
    const status = getStudentStatus(studentId)
    switch (status) {
      case 'online':
        return <Wifi className="h-3 w-3 text-green-500 fill-green-500/20" />
      case 'away':
        return <CircleDot className="h-3 w-3 text-amber-500" />
      default:
        return <WifiOff className="h-3 w-3 text-gray-400" />
    }
  }, [getStudentStatus])

  // Get status text
  const getStatusText = useCallback((studentId: string) => {
    const status = getStudentStatus(studentId)
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      default: return 'Offline'
    }
  }, [getStudentStatus])

  // Setup real-time presence tracking
  useEffect(() => {
    if (!students.length) return

    let presenceChannel: any = null

    const setupPresenceTracking = async () => {
      try {
        // Create a channel for tracking student presence
        presenceChannel = supabase.channel('online-students', {
          config: {
            presence: {
              key: 'admin-tracker',
            },
          },
        })

        // Handle presence state changes
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState()
            const online = new Set<string>()
            const away = new Set<string>()
            
            // Parse the presence state
            Object.values(state).forEach((presences: any) => {
              presences.forEach((presence: PresenceEvent) => {
                if (presence.user_id && presence.status === 'online') {
                  online.add(presence.user_id)
                } else if (presence.user_id && presence.status === 'away') {
                  away.add(presence.user_id)
                } else if (presence.user_id) {
                  online.add(presence.user_id)
                }
              })
            })
            
            setOnlineStudents(online)
            setAwayStudents(away)
            setIsPresenceConnected(true)
          })
          .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: PresenceEvent[] }) => {
            console.log('Students joined:', newPresences)
            // Update state for joined users
            setOnlineStudents(prev => {
              const newSet = new Set(prev)
              newPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.status !== 'away') {
                  newSet.add(p.user_id)
                }
              })
              return newSet
            })
            setAwayStudents(prev => {
              const newSet = new Set(prev)
              newPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.status === 'away') {
                  newSet.add(p.user_id)
                }
              })
              return newSet
            })
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: PresenceEvent[] }) => {
            console.log('Students left:', leftPresences)
            // Remove left users from online/away sets
            setOnlineStudents(prev => {
              const newSet = new Set(prev)
              leftPresences.forEach((p: PresenceEvent) => {
                if (p.user_id) newSet.delete(p.user_id)
              })
              return newSet
            })
            setAwayStudents(prev => {
              const newSet = new Set(prev)
              leftPresences.forEach((p: PresenceEvent) => {
                if (p.user_id) newSet.delete(p.user_id)
              })
              return newSet
            })
          })

        // Subscribe to the channel
        await presenceChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Presence channel subscribed')
          }
        })

      } catch (error) {
        console.error('Error setting up presence tracking:', error)
        toast.error('Failed to setup online status tracking')
      }
    }

    setupPresenceTracking()

    // Cleanup on unmount
    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe()
      }
    }
  }, [students.length]) // Re-run when student list changes

  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.class) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('create_student_account', {
        p_first_name: newStudent.first_name,
        p_last_name: newStudent.last_name,
        p_class: newStudent.class,
        p_department: newStudent.department || null,
      })

      if (error) throw error

      if (data?.success) {
        setNewCredentials({
          email: data.email,
          password: data.permanent_password,
          vin_id: data.vin_id,
        })
        setShowAddDialog(false)
        setShowCredentialsDialog(true)
        setNewStudent({ first_name: '', last_name: '', class: '', department: '' })
        onRefresh()
        toast.success('Student created successfully!')
      } else {
        toast.error(data?.message || 'Failed to create student')
      }
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Failed to create student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStudent = async () => {
    if (!selectedStudent) return
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: selectedStudent.full_name,
          class: selectedStudent.class,
          department: selectedStudent.department,
          is_active: selectedStudent.is_active,
        })
        .eq('id', selectedStudent.id)

      if (error) throw error

      toast.success('Student updated successfully')
      setShowEditDialog(false)
      setSelectedStudent(null)
      onRefresh()
    } catch (error) {
      console.error('Error updating student:', error)
      toast.error('Failed to update student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.full_name}? This action cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', student.id)

      if (error) throw error

      toast.success('Student deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Failed to delete student')
    }
  }

  const handleResetPassword = async (student: Student) => {
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_password_admin_only', {
        p_user_id: student.id,
      })

      if (error) throw error

      if (data?.success) {
        setResetPasswordData({ newPassword: data.new_password })
        setSelectedStudent(student)
        setShowResetPasswordDialog(true)
        toast.success('Password reset successfully!')
        onRefresh()
      } else {
        toast.error(data?.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading students...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Student Management
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total {students.length} students enrolled
            {isPresenceConnected && onlineStudents.size > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {onlineStudents.size} online now
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              Classes
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
              All Students
            </button>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                    <Select onValueChange={(v) => setNewStudent({ ...newStudent, class: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select onValueChange={(v) => setNewStudent({ ...newStudent, department: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <p className="text-xs text-primary/80 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <strong>Auto-generated credentials:</strong> Email and VIN ID will be created automatically.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddStudent} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Bar - Only show in list view */}
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
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          {/* Class Filter Dropdown - Shows all classes with student counts */}
          {!selectedClass && viewMode === 'list' && (
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Classes ({students.length})
                </SelectItem>
                {classes.map(cls => {
                  const count = students.filter(s => s.class === cls).length
                  return (
                    <SelectItem key={cls} value={cls}>
                      {cls} ({count})
                    </SelectItem>
                  )
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
      )}

      {/* Class Folders View */}
      {viewMode === 'classes' && !selectedClass && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {classes.map((className) => {
            const group = classGroups[className]
            const studentCount = group?.count || 0
            const gradient = getClassColor(className)
            // Count online students in this class
            const onlineCount = group?.students.filter(s => onlineStudents.has(s.id)).length || 0
            
            return (
              <Card 
                key={className}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-card to-card/80"
                onClick={() => handleClassClick(className)}
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
                    {studentCount > 0 
                      ? `${studentCount} student${studentCount !== 1 ? 's' : ''} enrolled`
                      : 'No students enrolled'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary/70 group-hover:text-primary transition-colors flex items-center gap-1">
                      View class
                      <FolderOpen className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="flex items-center gap-2">
                      {onlineCount > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                          <Wifi className="h-2 w-2 mr-1" />
                          {onlineCount} online
                        </Badge>
                      )}
                      {studentCount > 0 && (
                        <div className="flex -space-x-2">
                          {group?.students.slice(0, 3).map((student) => (
                            <Avatar key={student.id} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-[10px] bg-primary/10">
                                {student.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {studentCount > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                              +{studentCount - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Students List View */}
      {(viewMode === 'list' || selectedClass) && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">VIN ID</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No students found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'Try a different search term' : 'Click "Add Student" to get started'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const status = getStudentStatus(student.id)
                    const isUserOnline = status === 'online'
                    const isUserAway = status === 'away'
                    
                    return (
                      <TableRow key={student.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={student.photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-medium">
                                  {student.full_name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5">
                                {getStatusIcon(student.id)}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{student.vin_id}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {student.class || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{student.department || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {student.is_active ? (
                                <>
                                  {getStatusIcon(student.id)}
                                  <span className={cn(
                                    "text-sm font-medium",
                                    isUserOnline && "text-green-600 dark:text-green-400",
                                    isUserAway && "text-amber-600 dark:text-amber-400",
                                    status === 'offline' && "text-gray-500"
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
                            {student.is_active && isUserOnline && (
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                Active now
                              </span>
                            )}
                            {student.is_active && isUserAway && (
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                Away / Idle
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedStudent(student); setShowEditDialog(true) }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(student)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteStudent(student)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
              <CheckCircle className="h-5 w-5 text-green-500" />
              Student Account Created!
            </DialogTitle>
            <DialogDescription>
              Save these permanent credentials. The student will use these to log in.
            </DialogDescription>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
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
                    <p className="text-xs text-muted-foreground">VIN ID / Permanent Password</p>
                    <p className="font-mono text-sm font-bold text-primary">{newCredentials.password}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.password, 'Password')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <strong>Permanent password:</strong> The student cannot change this. Only an admin can reset it if needed.
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
              Password Reset Successful
            </DialogTitle>
            <DialogDescription>
              The password has been reset to the VIN ID.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && resetPasswordData && (
            <div className="space-y-4 py-4">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student</p>
                    <p className="font-medium">{selectedStudent.full_name}</p>
                  </div>
                  <Badge variant="secondary">{selectedStudent.vin_id}</Badge>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">New Permanent Password</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="font-mono text-lg font-bold text-primary">{resetPasswordData.newPassword}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resetPasswordData.newPassword, 'Password')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  This is the student's permanent password. They cannot change it themselves.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResetPasswordDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
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
                  <Select value={selectedStudent.class} onValueChange={(v) => setSelectedStudent({ ...selectedStudent, class: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={selectedStudent.department} onValueChange={(v) => setSelectedStudent({ ...selectedStudent, department: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudent.is_active}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, is_active: e.target.checked })}
                    className="sr-only peer"
                    id="active-toggle"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <Label htmlFor="active-toggle" className="ml-3 cursor-pointer">
                    Active Account
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditStudent} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
// app/admin/teacher-classes/page.tsx - WITH DARK MODE
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserPlus, Loader2, Search, RefreshCw, School,
  AlertCircle, UserCheck, Plus, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Teacher {
  id: string
  display_name: string
  email: string
  role: string
  is_active: boolean
}

interface Class {
  id: string
  name: string
  teacher_id: string | null
  category: string
  level: string
  capacity: number
  student_count?: number
  total_students?: number
}

interface TeacherClassAssignment {
  teacher_id: string
  class_name: string
  created_at: string
}

export default function TeacherClassesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const normalizeClassName = (name: string): string => {
    if (!name) return ''
    let normalized = name.trim().replace(/\s+/g, ' ')
    normalized = normalized.replace(/JSS\s+(\d+)/i, 'JSS$1')
    normalized = normalized.replace(/SS\s+(\d+)/i, 'SS$1')
    return normalized.toUpperCase().trim()
  }

  const classNamesMatch = (class1: string, class2: string): boolean => {
    if (!class1 || !class2) return false
    return normalizeClassName(class1) === normalizeClassName(class2)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, is_active')
        .or('role.eq.teacher,role.eq.staff')
        .eq('is_active', true)
        .order('display_name')

      if (teachersError) throw teachersError
      setTeachers(teachersData || [])

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name')

      if (classesError) throw classesError

      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, display_name, class')
        .eq('role', 'student')
        .eq('is_active', true)

      if (studentsError) throw studentsError

      const classesWithCounts = classesData?.map(cls => {
        let studentCount = 0
        studentsData?.forEach(student => {
          if (student.class && classNamesMatch(cls.name, student.class)) {
            studentCount++
          }
        })
        return {
          ...cls,
          student_count: studentCount,
          total_students: studentCount
        }
      }) || []

      setClasses(classesWithCounts)

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_classes')
        .select('*')
        .order('created_at', { ascending: false })

      if (assignmentsError) throw assignmentsError
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedClass) {
      toast.error('Please select both a teacher and a class')
      return
    }

    setIsSubmitting(true)
    try {
      const classObj = classes.find(c => c.id === selectedClass)
      if (!classObj) throw new Error('Class not found')

      const existing = assignments.find(
        a => a.teacher_id === selectedTeacher && a.class_name === classObj.name
      )
      if (existing) {
        toast.warning('This class is already assigned to this teacher')
        return
      }

      const { error } = await supabase
        .from('teacher_classes')
        .insert({
          teacher_id: selectedTeacher,
          class_name: classObj.name
        })

      if (error) throw error

      toast.success(`${classObj.name} assigned to teacher successfully`)
      await fetchData()
      setSelectedTeacher('')
      setSelectedClass('')
    } catch (error) {
      console.error('Error assigning class:', error)
      toast.error('Failed to assign class')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (teacherId: string, className: string) => {
    if (!confirm(`Remove ${className} from this teacher?`)) return

    try {
      const { error } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('class_name', className)

      if (error) throw error

      toast.success(`${className} removed from teacher`)
      await fetchData()
    } catch (error) {
      console.error('Error removing class:', error)
      toast.error('Failed to remove class')
    }
  }

  const getTeacherClasses = (teacherId: string) => {
    return assignments.filter(a => a.teacher_id === teacherId)
  }

  const getAvailableClasses = (teacherId: string) => {
    const assignedNames = assignments
      .filter(a => a.teacher_id === teacherId)
      .map(a => a.class_name)
    return classes.filter(c => !assignedNames.includes(c.name))
  }

  const filteredTeachers = teachers.filter(t =>
    t.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading assignments...</p>
        </div>
      </div>
    )
  }

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Teacher - Class Assignments
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Assign classes to teachers so they can mark attendance and manage students
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-0">
              {assignments.length} Assignments
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Teachers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{teachers.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl">
                <School className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Classes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{classes.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-violet-100 dark:bg-violet-950/50 rounded-xl">
                <UserPlus className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Assignments Made</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-xl">
                <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Form */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Assign New Class
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Select Teacher
                </label>
                <select
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  value={selectedTeacher}
                  onChange={(e) => {
                    setSelectedTeacher(e.target.value)
                    setSelectedClass('')
                  }}
                >
                  <option value="">Choose a teacher...</option>
                  {filteredTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.display_name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Select Class
                </label>
                <select
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={!selectedTeacher}
                >
                  <option value="">Choose a class...</option>
                  {selectedTeacher && getAvailableClasses(selectedTeacher).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} 
                      {c.category ? ` (${c.category})` : ''}
                      {c.student_count !== undefined ? ` - ${c.student_count} students` : ''}
                      {c.capacity ? ` / ${c.capacity} capacity` : ''}
                    </option>
                  ))}
                </select>
                {selectedTeacher && getAvailableClasses(selectedTeacher).length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    All classes are assigned to this teacher
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
                  onClick={handleAssign}
                  disabled={!selectedTeacher || !selectedClass || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Assign Class
                </Button>
              </div>
            </div>

            {/* Search for teachers */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignments Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Current Assignments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => {
              const teacherAssignments = getTeacherClasses(teacher.id)
              return (
                <Card key={teacher.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                          {teacher.display_name || teacher.email}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{teacher.email}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "ml-2 border-slate-200 dark:border-slate-700",
                        teacherAssignments.length > 0 
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" 
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        {teacherAssignments.length} classes
                      </Badge>
                    </div>

                    {teacherAssignments.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-400 dark:text-slate-500">
                        <AlertCircle className="h-4 w-4" />
                        No classes assigned
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {teacherAssignments.map(assignment => {
                          const classInfo = classes.find(c => classNamesMatch(c.name, assignment.class_name))
                          return (
                            <div
                              key={assignment.class_name}
                              className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <School className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                                    {assignment.class_name}
                                  </span>
                                  {classInfo && classInfo.student_count !== undefined && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {classInfo.student_count} students
                                      {classInfo.capacity ? ` / ${classInfo.capacity} capacity` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(teacher.id, assignment.class_name)}
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* No teachers message */}
        {filteredTeachers.length === 0 && (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No teachers found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Add teachers to the system first</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
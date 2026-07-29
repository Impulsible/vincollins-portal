'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserPlus, UserMinus, Loader2, Search,
  X, Check, Plus, Trash2, RefreshCw, School,
  AlertCircle, ChevronRight,
  UserCheck
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

  // Helper function to normalize class names for matching
  const normalizeClassName = (name: string): string => {
    if (!name) return ''
    // Remove extra spaces, convert to uppercase
    let normalized = name.trim().replace(/\s+/g, ' ')
    // Handle JSS variations: JSS 2 -> JSS2, JSS 3 -> JSS3
    normalized = normalized.replace(/JSS\s+(\d+)/i, 'JSS$1')
    // Handle SS variations: SS 1 -> SS1, SS 2 -> SS2
    normalized = normalized.replace(/SS\s+(\d+)/i, 'SS$1')
    // Handle variations like "JSS1" -> "JSS1", "JSS 1" -> "JSS1"
    return normalized.toUpperCase().trim()
  }

  // Helper function to check if two class names match
  const classNamesMatch = (class1: string, class2: string): boolean => {
    if (!class1 || !class2) return false
    const norm1 = normalizeClassName(class1)
    const norm2 = normalizeClassName(class2)
    return norm1 === norm2
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get all teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, is_active')
        .or('role.eq.teacher,role.eq.staff')
        .eq('is_active', true)
        .order('display_name')

      if (teachersError) throw teachersError
      setTeachers(teachersData || [])

      // Get all classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name')

      if (classesError) throw classesError

      // Get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, display_name, class')
        .eq('role', 'student')
        .eq('is_active', true)

      if (studentsError) throw studentsError

      // Count students per class - using normalized matching
      const classesWithCounts = classesData?.map(cls => {
        let studentCount = 0
        const studentsInClass: string[] = []

        studentsData?.forEach(student => {
          if (student.class && classNamesMatch(cls.name, student.class)) {
            studentCount++
            studentsInClass.push(student.display_name || student.id)
          }
        })

        return {
          ...cls,
          student_count: studentCount,
          total_students: studentCount
        }
      }) || []

      console.log('Classes with student counts:', classesWithCounts)
      setClasses(classesWithCounts)

      // Get current assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_classes')
        .select('*')
        .order('created_at', { ascending: false })

      if (assignmentsError) throw assignmentsError
      setAssignments(assignmentsData || [])

      // Debug: Log student distribution
      const classDistribution: Record<string, number> = {}
      studentsData?.forEach(student => {
        if (student.class) {
          const normalized = normalizeClassName(student.class)
          classDistribution[normalized] = (classDistribution[normalized] || 0) + 1
        }
      })
      console.log('Student class distribution:', classDistribution)

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

      // Check if already assigned
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

  const isAssigned = (teacherId: string, className: string) => {
    return assignments.some(a => a.teacher_id === teacherId && a.class_name === className)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
        </div>
      </div>
    )
  }

  // Calculate total students across all classes
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Teacher - Class Assignments
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Assign classes to teachers so they can mark attendance and manage students
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Badge className="bg-blue-100 text-blue-700">
              {assignments.length} Assignments
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <School className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <UserPlus className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Assignments Made</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              Assign New Class
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Select Teacher
                </label>
                <select
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Select Class
                </label>
                <select
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <p className="text-xs text-amber-600 mt-1">
                    All classes are assigned to this teacher
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full gap-2"
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
            <div className="mt-4 pt-4 border-t">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignments Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Current Assignments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => {
              const teacherAssignments = getTeacherClasses(teacher.id)
              return (
                <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {teacher.display_name || teacher.email}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "ml-2",
                        teacherAssignments.length > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-500"
                      )}>
                        {teacherAssignments.length} classes
                      </Badge>
                    </div>

                    {teacherAssignments.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        No classes assigned
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {teacherAssignments.map(assignment => {
                          // Find the class to get student count
                          const classInfo = classes.find(c => 
                            classNamesMatch(c.name, assignment.class_name)
                          )
                          return (
                            <div
                              key={assignment.class_name}
                              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <School className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-medium truncate block">
                                    {assignment.class_name}
                                  </span>
                                  {classInfo && classInfo.student_count !== undefined && (
                                    <span className="text-[10px] text-gray-400">
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
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No teachers found</p>
              <p className="text-sm text-gray-400">Add teachers to the system first</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
// components/admin/students/StudentManagement.tsx
'use client'

import { useState, useCallback } from 'react'
import { Student, Credentials, StudentFormData } from './types'
import { useStudentFilters } from './hooks/useStudentFilters'
import { useStudentActions } from './hooks/useStudentActions'
import { StudentClassCards } from './components/StudentClassCards'
import { StudentSearchFilter } from './components/StudentSearchFilter'
import { StudentTable } from './components/StudentTable'
import { CredentialsDialog } from './components/dialogs/CredentialsDialog'
import { ResetPasswordDialog } from './components/dialogs/ResetPasswordDialog'
import { DeleteConfirmDialog } from './components/dialogs/DeleteConfirmDialog'
import { EditStudentDialog } from './components/dialogs/EditStudentDialog'
import { ViewDetailsDialog } from './components/dialogs/ViewDetailsDialog'
import { AddStudentDialog } from './components/dialogs/AddStudentDialog'
import { BulkUploadDialog } from './components/dialogs/BulkUploadDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Shield, Circle, Building, School } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StudentManagementProps {
  students: Student[]
  onRefresh: () => void
  onToggleStatus: (studentId: string, currentStatus: boolean) => Promise<void>
  loading?: boolean
}

export function StudentManagement({ 
  students, 
  onRefresh, 
  onToggleStatus, 
  loading = false 
}: StudentManagementProps) {
  const filters = useStudentFilters(students)
  const actions = useStudentActions(onRefresh)

  const [showCredentials, setShowCredentials] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showViewDetails, setShowViewDetails] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const totalStudents = students.length
  const activeCount = students.filter(s => s.is_active !== false).length
  const inactiveCount = students.filter(s => s.is_active === false).length
  
  const classCount = new Set(
    students
      .filter(s => s.is_active !== false)
      .map(s => s.class)
      .filter(Boolean)
  ).size

  const handleCredentialsGenerated = useCallback((creds: Credentials) => {
    setCredentials(creds)
    setShowCredentials(true)
  }, [])

  const handleCreateStudent = useCallback(async (formData: StudentFormData) => {
    try {
      const result = await actions.createStudent(formData)
      if (result) {
        handleCredentialsGenerated(result)
        onRefresh()
        return result
      }
      return null
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Failed to create student')
      return null
    }
  }, [actions, onRefresh, handleCredentialsGenerated])

  const handleBulkUpload = useCallback(async (file: File) => {
    try {
      const result = await actions.bulkUploadStudents(file)
      if (result) {
        onRefresh()
        return result
      }
      return null
    } catch (error) {
      console.error('Error during bulk upload:', error)
      toast.error('Failed to upload students')
      return null
    }
  }, [actions, onRefresh])

  const handleViewDetails = useCallback((student: Student) => {
    setSelectedStudent(student)
    setShowViewDetails(true)
  }, [])

  const handleEdit = useCallback((student: Student) => {
    setSelectedStudent({ ...student })
    setShowEdit(true)
  }, [])

  const handleResetPassword = useCallback((student: Student) => {
    setSelectedStudent(student)
    setShowResetPassword(true)
  }, [])

  const handleDelete = useCallback((student: Student) => {
    setSelectedStudent(student)
    setShowDelete(true)
  }, [])

  // ✅ Direct, verified save in database
  const handleSaveEdit = useCallback(async () => {
    if (!selectedStudent) return
    setIsSavingEdit(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: selectedStudent.first_name,
          middle_name: selectedStudent.middle_name,
          last_name: selectedStudent.last_name,
          full_name: selectedStudent.full_name,
          display_name: selectedStudent.display_name,
          class: selectedStudent.class,
          department: selectedStudent.department,
          admission_number: selectedStudent.admission_number,
          gender: selectedStudent.gender,
          date_of_birth: selectedStudent.date_of_birth,
          phone: selectedStudent.phone,
          address: selectedStudent.address,
          next_term_begins: selectedStudent.next_term_begins,
          is_active: selectedStudent.is_active === false ? false : true // 👈 Explicit persistence
        })
        .eq('id', selectedStudent.id)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('Update failed. Ensure admin RLS policy is enabled in Supabase.')
      }

      toast.success('Student profile updated successfully!')
      setShowEdit(false)
      setSelectedStudent(null)
      onRefresh()
    } catch (error: any) {
      console.error('Database update error:', error)
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setIsSavingEdit(false)
    }
  }, [selectedStudent, onRefresh])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedStudent) return
    const success = await actions.deleteStudent(selectedStudent)
    if (success) {
      setShowDelete(false)
      setSelectedStudent(null)
    } else {
      toast.error('Failed to delete student')
    }
  }, [selectedStudent, actions])

  const handleFastToggleStatus = useCallback(async (student: Student) => {
    await onToggleStatus(student.id, student.is_active)
  }, [onToggleStatus])

  const handleClassClick = useCallback((className: string) => {
    filters.setSelectedClass(className)
    filters.setViewMode('list')
    filters.setClassFilter('all')
  }, [filters])

  const handleBackToClasses = useCallback(() => {
    filters.setSelectedClass(null)
    filters.setViewMode('classes')
    filters.setSearchQuery('')
    filters.setClassFilter('all')
  }, [filters])

  const handleClearSelection = useCallback(() => {
    filters.setSelectedClass(null)
    filters.setClassFilter('all')
  }, [filters])

  const handleStudentChange = useCallback((updatedStudent: Student) => {
    setSelectedStudent(updatedStudent)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <School className="h-7 w-7 text-emerald-600" />
            Student Management
          </h1>
          <p className="text-slate-500 mt-1">Manage student profiles, credentials, and class assignments</p>
        </div>

        <div className="flex gap-3">
          <AddStudentDialog
            onCreateStudent={handleCreateStudent}
            onCredentialsGenerated={handleCredentialsGenerated}
            isSubmitting={actions.isSubmitting}
          />
          <BulkUploadDialog onBulkUpload={handleBulkUpload} isSubmitting={actions.isSubmitting} />
        </div>
      </motion.div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Inactive</p>
                <p className="text-2xl font-bold text-slate-600">{inactiveCount}</p>
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Circle className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Classes</p>
                <p className="text-2xl font-bold text-purple-600">{classCount}</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filters.viewMode === 'classes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => filters.setViewMode('classes')}
          className={cn('transition-all', filters.viewMode === 'classes' && 'bg-emerald-600 hover:bg-emerald-700')}
        >
          Class View
        </Button>
        <Button
          variant={filters.viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => filters.setViewMode('list')}
          className={cn('transition-all', filters.viewMode === 'list' && 'bg-emerald-600 hover:bg-emerald-700')}
        >
          List View
        </Button>
        {filters.viewMode === 'list' && filters.selectedClass && (
          <Button variant="ghost" size="sm" onClick={handleClearSelection}>
            Clear Filter
          </Button>
        )}
      </div>

      {(filters.viewMode === 'list' || filters.selectedClass) && (
        <StudentSearchFilter
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          classFilter={filters.classFilter}
          setClassFilter={filters.setClassFilter}
          selectedClass={filters.selectedClass}
          setSelectedClass={filters.setSelectedClass}
          classGroups={filters.classGroups}
          totalStudents={totalStudents}
          onRefresh={onRefresh}
          onBackToClasses={handleBackToClasses}
        />
      )}

      {filters.viewMode === 'classes' && !filters.selectedClass && (
        <StudentClassCards classGroups={filters.classGroups} onClassClick={handleClassClick} />
      )}

      {(filters.viewMode === 'list' || filters.selectedClass) && (
        <StudentTable
          students={filters.filteredStudents}
          searchQuery={filters.searchQuery}
          getStatus={() => 'offline'}
          getLastSeen={() => ''}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
          onToggleStatus={handleFastToggleStatus}
        />
      )}

      {showCredentials && (
        <CredentialsDialog open={showCredentials} onOpenChange={setShowCredentials} credentials={credentials} />
      )}

      {showResetPassword && (
        <ResetPasswordDialog open={showResetPassword} onOpenChange={setShowResetPassword} student={selectedStudent} />
      )}

      {showDelete && (
        <DeleteConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          student={selectedStudent}
          onConfirm={handleConfirmDelete}
          isSubmitting={actions.isSubmitting}
        />
      )}

      {showEdit && (
        <EditStudentDialog
          open={showEdit}
          onOpenChange={setShowEdit}
          student={selectedStudent}
          onStudentChange={handleStudentChange}
          onSave={handleSaveEdit}
          isSubmitting={isSavingEdit}
        />
      )}

      {showViewDetails && (
        <ViewDetailsDialog
          open={showViewDetails}
          onOpenChange={setShowViewDetails}
          student={selectedStudent}
          status="offline"
          lastSeen=""
        />
      )}
    </div>
  )
}

export default StudentManagement
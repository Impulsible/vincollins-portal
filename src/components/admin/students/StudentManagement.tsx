// components/admin/students/StudentManagement.tsx

'use client'

import { useState, useCallback } from 'react'
import { StudentManagementProps, Student, Credentials } from './types'
import { useStudentPresence } from './hooks/useStudentPresence'
import { useStudentFilters } from './hooks/useStudentFilters'
import { useStudentActions } from './hooks/useStudentActions'
import { StudentHeader } from './components/StudentHeader'
import { StudentClassCards } from './components/StudentClassCards'
import { StudentSearchFilter } from './components/StudentSearchFilter'
import { StudentTable } from './components/StudentTable'
import { CredentialsDialog } from './components/dialogs/CredentialsDialog'
import { ResetPasswordDialog } from './components/dialogs/ResetPasswordDialog'
import { DeleteConfirmDialog } from './components/dialogs/DeleteConfirmDialog'
import { EditStudentDialog } from './components/dialogs/EditStudentDialog'
import { ViewDetailsDialog } from './components/dialogs/ViewDetailsDialog'

export function StudentManagement({
  students,
  onRefresh,
  loading = false,
}: StudentManagementProps) {
  // ============================================
  // CUSTOM HOOKS
  // ============================================
  const presence = useStudentPresence(students)
  const filters = useStudentFilters(students)
  const actions = useStudentActions(onRefresh)

  // ============================================
  // DIALOG STATES
  // ============================================
  const [showCredentials, setShowCredentials] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showViewDetails, setShowViewDetails] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  // ============================================
  // HANDLERS
  // ============================================

  const handleCredentialsGenerated = useCallback((creds: Credentials) => {
    setCredentials(creds)
    setShowCredentials(true)
  }, [])

  const handleViewDetails = useCallback((student: Student) => {
    setSelectedStudent(student)
    setShowViewDetails(true)
  }, [])

  const handleEdit = useCallback((student: Student) => {
    // Create a fresh copy to avoid mutation issues
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

  const handleSaveEdit = useCallback(async () => {
    if (!selectedStudent) return

    console.log('📝 Saving student edits:', selectedStudent.id)
    const success = await actions.updateStudent(selectedStudent)

    if (success) {
      console.log('✅ Edit saved successfully')
      setShowEdit(false)
      setSelectedStudent(null)
      // ❌ Removed onRefresh() to prevent skeleton loading
    }
  }, [selectedStudent, actions]) // ✅ Removed onRefresh from dependencies

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedStudent) return

    console.log('🗑️ Deleting student:', selectedStudent.id)
    const success = await actions.deleteStudent(selectedStudent)

    if (success) {
      console.log('✅ Student deleted')
      setShowDelete(false)
      setSelectedStudent(null)
      // Force refresh parent data
      onRefresh()
    }
  }, [selectedStudent, actions, onRefresh])

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

  // ============================================
  // LOADING STATE
  // ============================================
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
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-40 bg-muted animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <StudentHeader
        totalStudents={students.length}
        onlineCount={presence.onlineCount}
        awayCount={presence.awayCount}
        isPresenceConnected={presence.isConnected}
        isSubmitting={actions.isSubmitting}
        onCreateStudent={actions.createStudent}
        onCredentialsGenerated={handleCredentialsGenerated}
        onBulkUpload={actions.bulkUploadStudents}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        onClearSelection={handleClearSelection}
      />

      {/* Search & Filter Bar */}
      {(filters.viewMode === 'list' || filters.selectedClass) && (
        <StudentSearchFilter
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          classFilter={filters.classFilter}
          setClassFilter={filters.setClassFilter}
          selectedClass={filters.selectedClass}
          setSelectedClass={filters.setSelectedClass}
          classGroups={filters.classGroups}
          totalStudents={students.length}
          onRefresh={onRefresh}
          onBackToClasses={handleBackToClasses}
        />
      )}

      {/* Class Cards View */}
      {filters.viewMode === 'classes' && !filters.selectedClass && (
        <StudentClassCards
          classGroups={filters.classGroups}
          onClassClick={handleClassClick}
        />
      )}

      {/* Student Table View */}
      {(filters.viewMode === 'list' || filters.selectedClass) && (
        <StudentTable
          students={filters.filteredStudents}
          searchQuery={filters.searchQuery}
          getStatus={presence.getStatus}
          getLastSeen={presence.getLastSeen}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      )}

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      <CredentialsDialog
        open={showCredentials}
        onOpenChange={setShowCredentials}
        credentials={credentials}
      />

      <ResetPasswordDialog
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        student={selectedStudent}
      />

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        student={selectedStudent}
        onConfirm={handleConfirmDelete}
        isSubmitting={actions.isSubmitting}
      />

      <EditStudentDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        student={selectedStudent}
        onStudentChange={handleStudentChange}
        onSave={handleSaveEdit}
        isSubmitting={actions.isSubmitting}
      />

      <ViewDetailsDialog
        open={showViewDetails}
        onOpenChange={setShowViewDetails}
        student={selectedStudent}
        status={selectedStudent ? presence.getStatus(selectedStudent.id) : 'offline'}
        lastSeen={selectedStudent ? presence.getLastSeen(selectedStudent.id) : ''}
      />
    </div>
  )
}

export default StudentManagement
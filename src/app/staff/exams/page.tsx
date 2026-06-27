// app/staff/exams/page.tsx - LIST PAGE

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffContext } from '../layout'
import { useExams } from './hooks/useExams'
import { ExamList } from '@/components/staff/exams/ExamList'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function StaffExamsPage() {
  const router = useRouter()
  const context = useStaffContext()
  const profile = context?.profile

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const {
    exams, filteredExams, loading, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, loadExams,
    handleDeleteExam, handleDuplicateExam, handleSubmitForApproval
  } = useExams(profile?.id)

  // ✅ Navigate to view exam
  const handleViewExam = (id: string) => {
    router.push(`/staff/exams/${id}`)
  }

  // ✅ Navigate to edit exam
  const handleEditExam = (id: string) => {
    router.push(`/staff/exams/${id}/edit`)
  }

  // ✅ Navigate to submissions
  const handleViewSubmissions = (id: string) => {
    router.push(`/staff/exams/${id}/submissions`)
  }

  // ✅ Navigate to scores
  const handleEnterScores = (id: string) => {
    router.push(`/staff/exams/${id}/scores`)
  }

  const handleCreateSuccess = () => {
    loadExams()
    setShowCreateDialog(false)
    toast.success('Exam created successfully!')
  }

  if (!profile) return null

  if (loading) {
    return (
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 space-y-5">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const draftCount = exams.filter((e: any) => e.status === 'draft').length
  const pendingCount = exams.filter((e: any) => e.status === 'pending').length
  const publishedCount = exams.filter((e: any) => e.status === 'published').length

  return (
    <>
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <ExamList
          exams={filteredExams}
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter} 
          onStatusFilterChange={setStatusFilter}
          onCreateExam={() => setShowCreateDialog(true)}
          onViewExam={handleViewExam}
          onEditExam={handleEditExam}
          onDeleteExam={handleDeleteExam} 
          onDuplicateExam={handleDuplicateExam}
          onSubmitForApproval={handleSubmitForApproval}
          onViewSubmissions={handleViewSubmissions}
          onEnterScores={handleEnterScores}
          totalExams={exams.length} 
          draftCount={draftCount}
          pendingCount={pendingCount} 
          publishedCount={publishedCount}
        />
      </div>
      
      <CreateExamDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onSuccess={handleCreateSuccess}
        teacherProfile={profile} 
      />
    </>
  )
}
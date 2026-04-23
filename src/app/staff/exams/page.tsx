// app/staff/exams/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStaffContext } from '../layout'
import { useExams } from './hooks/useExams'
import { ExamList } from '@/components/staff/exams/ExamList'
import { ExamViewer } from '@/components/staff/exams/ExamViewer'
import { ExamEditor } from '@/components/staff/exams/ExamEditor'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function StaffExamsPage() {
  const context = useStaffContext()
  const profile = context?.profile

  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list')
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const {
    exams, filteredExams, loading, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, loadExams,
    handleDeleteExam, handleDuplicateExam, handleSubmitForApproval
  } = useExams(profile?.id)

  if (!profile) return null

  if (loading) {
    return (
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 space-y-5">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const draftCount = exams.filter((e: any) => e.status === 'draft').length
  const pendingCount = exams.filter((e: any) => e.status === 'pending').length
  const publishedCount = exams.filter((e: any) => e.status === 'published').length

  return (
    <>
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ExamList
                exams={filteredExams} searchQuery={searchQuery} onSearchChange={setSearchQuery}
                statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
                onCreateExam={() => setShowCreateDialog(true)}
                onViewExam={(id) => { setSelectedExamId(id); setViewMode('view') }}
                onEditExam={(id) => { setSelectedExamId(id); setViewMode('edit') }}
                onDeleteExam={handleDeleteExam} onDuplicateExam={handleDuplicateExam}
                onSubmitForApproval={handleSubmitForApproval}
                totalExams={exams.length} draftCount={draftCount}
                pendingCount={pendingCount} publishedCount={publishedCount}
              />
            </motion.div>
          )}
          {viewMode === 'view' && selectedExamId && (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ExamViewer examId={selectedExamId} onBack={() => { setViewMode('list'); setSelectedExamId(null) }} onEdit={() => setViewMode('edit')} onSubmitForApproval={handleSubmitForApproval} />
            </motion.div>
          )}
          {viewMode === 'edit' && selectedExamId && (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ExamEditor examId={selectedExamId} onBack={() => { setViewMode('list'); setSelectedExamId(null) }} onCancel={() => setViewMode('view')} onSave={() => { setViewMode('list'); setSelectedExamId(null) }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <CreateExamDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={() => { loadExams(); setShowCreateDialog(false) }} teacherProfile={profile} />
    </>
  )
}
// ============================================
// OVERVIEW TAB COMPONENT - FIXED
// ============================================

'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { StaffWelcomeBanner } from '@/components/staff/StaffWelcomeBanner'
import { QuickActions } from '@/components/staff/overview/QuickActions'
import { PendingTasksAlert } from '@/components/staff/overview/PendingTasksAlert'
import { DashboardGrid } from '@/components/staff/overview/DashboardGrid'
import { StaffProfile, Exam, Assignment, Note, Student, TermInfo, DashboardStats, TabType } from '@/lib/staff/types'

interface OverviewTabProps {
  profile: StaffProfile | null
  stats: DashboardStats
  termInfo: TermInfo
  exams: Exam[]
  assignments: Assignment[]
  notes: Note[]
  students: Student[]
  pendingGrading: number
  onRefresh: () => void
  onCreateExam: () => void
  onUploadAssignment: () => void
  onUploadNote: () => void
  onTabChange: (tab: TabType) => void
}

export function OverviewTab({
  profile,
  stats,
  termInfo,
  exams,
  assignments,
  notes,
  students,
  pendingGrading,
  onRefresh,
  onCreateExam,
  onUploadAssignment,
  onUploadNote,
  onTabChange
}: OverviewTabProps) {
  const router = useRouter()

  // Map stats to match StaffWelcomeBanner's expected interface
  const bannerStats = {
    totalExams: stats.totalExams || 0,
    publishedExams: stats.publishedExams || 0,
    totalStudents: stats.totalStudents || 0,
    activeStudents: stats.activeStudents || 0,
    totalAssignments: stats.totalAssignments || 0,
    totalNotes: stats.totalNotes || 0,
    pendingGrading: pendingGrading || 0
  }

  const bannerTermInfo = {
    termName: termInfo.termName,
    sessionYear: termInfo.sessionYear,
    currentWeek: termInfo.currentWeek,
    totalWeeks: termInfo.totalWeeks,
    weekProgress: termInfo.weekProgress,
    startDate: termInfo.startDate,
    endDate: termInfo.endDate
  }

  return (
    <motion.div 
      key="overview" 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8 lg:space-y-10"
    >
      <StaffWelcomeBanner 
        profile={profile} 
        stats={bannerStats} 
        termInfo={bannerTermInfo} 
      />
      
      <QuickActions
        termInfo={termInfo}
        onCreateExam={onCreateExam}
        onUploadAssignment={onUploadAssignment}
        onUploadNote={onUploadNote}
        onViewStudents={() => onTabChange('students')}
      />

      <PendingTasksAlert
        count={pendingGrading}
        termName={termInfo.termName}
        onGradeNow={() => router.push('/staff/grading')}
      />

      <DashboardGrid
        exams={exams}
        assignments={assignments}
        notes={notes}
        students={students}
        termInfo={termInfo}
        onRefresh={onRefresh}
        onViewExams={() => onTabChange('exams')}
        onViewAssignments={() => onTabChange('assignments')}
        onViewNotes={() => onTabChange('notes')}
        onViewStudents={() => onTabChange('students')}
      />
    </motion.div>
  )
}
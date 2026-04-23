// ============================================
// DASHBOARD GRID COMPONENT
// ============================================

'use client'

import { MonitorPlay, FileText, BookOpen, Users } from 'lucide-react'
import { SectionCard } from '@/components/staff/dashboard/SectionCard'
import { ExamsList } from '@/components/staff/ExamsList'
import { AssignmentsList } from '@/components/staff/AssignmentsList'
import { NotesList } from '@/components/staff/NotesList'
import { StudentRoster } from '@/components/staff/StudentRoster'
import { Exam, Assignment, Note, Student, TermInfo } from '@/lib/staff/types'

interface DashboardGridProps {
  exams: Exam[]
  assignments: Assignment[]
  notes: Note[]
  students: Student[]
  termInfo: TermInfo
  onRefresh: () => void
  onViewExams: () => void
  onViewAssignments: () => void
  onViewNotes: () => void
  onViewStudents: () => void
}

export function DashboardGrid({
  exams,
  assignments,
  notes,
  students,
  termInfo,
  onRefresh,
  onViewExams,
  onViewAssignments,
  onViewNotes,
  onViewStudents
}: DashboardGridProps) {
  const termDescription = `${termInfo.termName} ${termInfo.sessionYear}`

  return (
    <div className="grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-3">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6 sm:space-y-8">
        <SectionCard
          title="Recent Exams"
          description={termDescription}
          icon={<MonitorPlay className="h-4 w-4" />}
          iconColor="blue"
          onViewAll={onViewExams}
        >
          <ExamsList exams={exams.slice(0, 5)} onRefresh={onRefresh} compact />
        </SectionCard>
        
        <SectionCard
          title="Recent Assignments"
          description={termDescription}
          icon={<FileText className="h-4 w-4" />}
          iconColor="emerald"
          onViewAll={onViewAssignments}
        >
          <AssignmentsList assignments={assignments.slice(0, 3)} onRefresh={onRefresh} compact />
        </SectionCard>
      </div>
      
      {/* Right Column */}
      <div className="space-y-6 sm:space-y-8">
        <SectionCard
          title="Recent Notes"
          description={termDescription}
          icon={<BookOpen className="h-4 w-4" />}
          iconColor="purple"
          onViewAll={onViewNotes}
        >
          <NotesList notes={notes.slice(0, 3)} onRefresh={onRefresh} compact />
        </SectionCard>
        
        <SectionCard
          title="Student Roster"
          description={`${students.length} students enrolled`}
          icon={<Users className="h-4 w-4" />}
          iconColor="amber"
          onViewAll={onViewStudents}
        >
          <StudentRoster students={students.slice(0, 5)} onViewAll={onViewStudents} />
        </SectionCard>
      </div>
    </div>
  )
}
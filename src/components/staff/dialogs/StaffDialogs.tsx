// ============================================
// STAFF DIALOGS COMPONENT
// ============================================

'use client'

import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { UploadAssignmentDialog } from '@/components/staff/UploadAssignmentDialog'
import { UploadNoteDialog } from '@/components/staff/UploadNoteDialog'
import { StaffProfile } from '@/lib/staff/types'

interface StaffDialogsProps {
  showCreateExam: boolean
  showUploadAssignment: boolean
  showUploadNote: boolean
  profile: StaffProfile | null
  onCloseExam: (open: boolean) => void
  onCloseAssignment: (open: boolean) => void
  onCloseNote: (open: boolean) => void
  onExamCreated: () => void
  onAssignmentCreated: () => void
  onNoteUploaded: () => void
}

export function StaffDialogs({
  showCreateExam,
  showUploadAssignment,
  showUploadNote,
  profile,
  onCloseExam,
  onCloseAssignment,
  onCloseNote,
  onExamCreated,
  onAssignmentCreated,
  onNoteUploaded
}: StaffDialogsProps) {
  return (
    <>
      <CreateExamDialog 
        open={showCreateExam} 
        onOpenChange={onCloseExam} 
        onSuccess={onExamCreated} 
        teacherProfile={profile}
      />
      
      <UploadAssignmentDialog 
        open={showUploadAssignment} 
        onOpenChange={onCloseAssignment} 
        onSuccess={onAssignmentCreated} 
        teacherProfile={profile}
      />
      
      <UploadNoteDialog 
        open={showUploadNote} 
        onOpenChange={onCloseNote} 
        onSuccess={onNoteUploaded} 
        teacherProfile={profile}
      />
    </>
  )
}
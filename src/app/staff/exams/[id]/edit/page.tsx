// app/staff/exams/[id]/edit/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { EditExamPage } from '@/components/staff/exams/edit/EditExamPage'

export default function EditExamPageRoute() {
  const params = useParams()
  const examId = params.id as string

  return <EditExamPage examId={examId} />
}
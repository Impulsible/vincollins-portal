// app/staff/exams/[id]/edit/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EditExamPage } from '@/components/staff/exams/edit/EditExamPage'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ExamEditPage() {
  const router = useRouter()
  const params = useParams()

  // ✅ Safely extract id
  const examId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string)

  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  // ✅ Verify auth + exam ownership before rendering editor
  useEffect(() => {
    const verify = async () => {
      try {
        // Auth check
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.replace('/portal')
          return
        }

        if (!examId) {
          toast.error('Invalid exam ID')
          router.replace('/staff/exams')
          return
        }

        // Check exam exists and belongs to this user
        const { data: exam, error } = await supabase
          .from('exams')
          .select('id, status, created_by')
          .eq('id', examId)
          .single()

        if (error || !exam) {
          toast.error('Exam not found')
          router.replace('/staff/exams')
          return
        }

        if (exam.created_by !== session.user.id) {
          toast.error('You do not have permission to edit this exam')
          router.replace('/staff/exams')
          return
        }

        setAllowed(true)
      } catch (err) {
        console.error('[ExamEditPage] verify error:', err)
        router.replace('/staff/exams')
      } finally {
        setChecking(false)
      }
    }

    verify()
  }, [examId, router])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  // ── Not allowed ────────────────────────────────────────────────────────────
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-slate-600 text-sm">
          You don&apos;t have permission to edit this exam
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/staff/exams')}
        >
          Back to Exams
        </Button>
      </div>
    )
  }

  // ── Render editor - NO extra wrapper div ──────────────────────────────────
  return <EditExamPage examId={examId} />
}
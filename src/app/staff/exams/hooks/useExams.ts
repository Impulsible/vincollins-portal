// app/staff/exams/hooks/useExams.ts

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  created_at: string
  instructions: string
  description: string
  shuffle_questions: boolean
  shuffle_options: boolean
  pass_mark: number
  created_by?: string
  teacher_name?: string
  term?: string
  session_year?: string
}

export function useExams(
  teacherId?: string,
  termCode?: string,
  sessionYear?: string,
) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Guard against state updates after unmount during slow queries
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  /* ── Load ───────────────────────────────────────────────── */

  const loadExams = useCallback(async () => {
    if (!teacherId) {
      setExams([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .eq('created_by', teacherId)
        .is('deleted_at', null) // Only load exams that haven't been soft-deleted
        .order('created_at', { ascending: false })

      if (termCode && sessionYear) {
        query = query
          .eq('term', termCode)
          .eq('session_year', sessionYear)
      }

      const { data, error } = await query
      if (error) throw error

      if (!aliveRef.current) return
      setExams((data || []) as Exam[])
    } catch (error: any) {
      console.error('Error loading exams:', error)
      toast.error(`Failed to load exams: ${error?.message ?? 'unknown'}`)
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [teacherId, termCode, sessionYear])

  // Single source of truth for fetching — fires when the filter inputs change.
  useEffect(() => {
    loadExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, termCode, sessionYear])

  /* ── Derived (search + status) ──────────────────────────── */

  const filteredExams = useMemo(() => {
    let filtered = exams

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((exam) =>
        exam.title?.toLowerCase().includes(q) ||
        (exam.subject && exam.subject.toLowerCase().includes(q)) ||
        (exam.class && exam.class.toLowerCase().includes(q))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.status === statusFilter)
    }

    return filtered
  }, [exams, searchQuery, statusFilter])

  /* ── Delete (Soft Delete) ───────────────────────────────── */

  const handleDeleteExam = useCallback(async (examId: string) => {
    try {
      // SOFT DELETE: Mark as deleted instead of permanently destroying the row.
      // This avoids foreign key restriction errors entirely and keeps data recoverable.
      const { data, error } = await supabase
        .from('exams')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', examId)
        .select('id')

      if (error) {
        toast.error(`Delete failed: ${error.message}`)
        throw error
      }

      if (!data || data.length === 0) {
        toast.error('Delete failed — the exam may be missing, or RLS is blocking the update.')
        throw new Error('No rows updated')
      }

      // Optimistic local update so the row disappears immediately,
      // then re-sync with the server to be authoritative.
      setExams((prev) => prev.filter((e) => e.id !== examId))
      toast.success('Exam deleted successfully')
      await loadExams()
    } catch (error) {
      console.error('Error deleting exam:', error)
      throw error
    }
  }, [loadExams])

  /* ── Duplicate ──────────────────────────────────────────── */

  const handleDuplicateExam = useCallback(async (examId: string) => {
    try {
      const exam = exams.find((e) => e.id === examId)
      if (!exam) {
        toast.error('Exam not found in current list')
        return
      }

      // 1) Clone the exam row (without identity / timestamps)
      const { data: newExam, error: examErr } = await supabase
        .from('exams')
        .insert({
          title: `${exam.title} (Copy)`,
          subject: exam.subject,
          class: exam.class,
          duration: exam.duration,
          description: exam.description,
          instructions: exam.instructions,
          pass_mark: exam.pass_mark,
          shuffle_questions: exam.shuffle_questions,
          shuffle_options: exam.shuffle_options,
          has_theory: exam.has_theory,
          status: 'draft',
          is_locked: false,
          created_by: teacherId,
          total_questions: 0,
          total_marks: 0,
          term: exam.term || termCode,
          session_year: exam.session_year || sessionYear,
        })
        .select('id')
        .single()

      if (examErr || !newExam) {
        toast.error(`Duplicate failed: ${examErr?.message ?? 'unknown error'}`)
        return
      }

      // 2) Clone child questions from the source exam
      const { data: sourceQs, error: qFetchErr } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .is('deleted_at', null)

      if (qFetchErr) {
        console.warn('Could not read source questions:', qFetchErr.message)
      } else if (sourceQs && sourceQs.length > 0) {
        const cloned = sourceQs.map((q: any) => {
          const {
            id: _id,
            created_at: _c,
            updated_at: _u,
            ...rest
          } = q
          return {
            ...rest,
            exam_id: newExam.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
          }
        })

        const { error: cloneErr } = await supabase
          .from('questions')
          .insert(cloned)

        if (cloneErr) {
          console.warn('Question clone warning:', cloneErr.message)
          toast.warning('Exam duplicated, but some questions could not be copied')
        }

        // 3) Backfill the new exam's aggregate counts so the list
        //    and edit page render correctly before any manual save.
        const objTotal = cloned
          .filter((q: any) =>
            q.type === 'objective' ||
            q.question_type === 'mcq' ||
            q.question_type === 'objective'
          )
          .reduce((s: number, q: any) => s + (Number(q.points) || 0), 0)

        const thTotal = cloned
          .filter((q: any) =>
            q.type === 'theory' ||
            q.question_type === 'theory'
          )
          .reduce((s: number, q: any) => s + (Number(q.points) || 0), 0)

        await supabase
          .from('exams')
          .update({
            total_questions: cloned.length,
            total_marks: objTotal + thTotal,
            objective_max: objTotal,
            theory_max: thTotal,
          })
          .eq('id', newExam.id)
      }

      toast.success('Exam duplicated successfully')
      await loadExams()
    } catch (error: any) {
      console.error('Error duplicating exam:', error)
      toast.error(`Failed to duplicate exam: ${error?.message ?? 'unknown error'}`)
    }
  }, [exams, teacherId, loadExams, termCode, sessionYear])

  /* ── Submit for approval ────────────────────────────────── */

  const handleSubmitForApproval = useCallback(async (examId: string) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId)
        .select('id')

      if (error) {
        toast.error(`Submit failed: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        toast.error(
          'Submit affected 0 rows — the exam may be locked or missing, or RLS is blocking the update.',
        )
        return
      }

      toast.success('Exam submitted for approval!')

      // Optimistic local patch so the status badge updates instantly,
      // then re-fetch to stay consistent with server (term/status filters).
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, status: 'pending' } : e))
      )
      await loadExams()
    } catch (error: any) {
      console.error('Error submitting exam:', error)
      toast.error(`Failed to submit exam: ${error?.message ?? 'unknown error'}`)
    }
  }, [loadExams])

  return {
    exams,
    filteredExams,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loadExams,
    handleDeleteExam,
    handleDuplicateExam,
    handleSubmitForApproval,
  }
}
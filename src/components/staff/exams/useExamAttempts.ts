// src/app/staff/exams/hooks/useExamAttempts.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ExamSubmission {
  id: string
  exam_id: string
  submitted_by: string
  attempt_number: number
  max_attempts: number
  granted_attempts: number
  status: string
  score?: number
  percentage?: number
  passed?: boolean
  time_spent?: number
  submitted_at?: string
  student?: {
    id: string
    full_name: string
    email: string
    vin_id?: string
  }
}

export function useExamAttempts(examId?: string) {
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [granting, setGranting] = useState(false)

  const checkCanTakeExam = useCallback(async (examId: string, studentId: string): Promise<{
    canTake: boolean
    reason?: string
    currentAttempt?: number
    maxAttempts?: number
    submissionId?: string
  }> => {
    try {
      const { data: submission, error } = await supabase
        .from('exam_submissions')
        .select('id, attempt_number, max_attempts, status, submitted_at')
        .eq('exam_id', examId)
        .eq('submitted_by', studentId)
        .maybeSingle()

      if (error) throw error

      // No submission yet - can take exam
      if (!submission) {
        return { canTake: true, currentAttempt: 0, maxAttempts: 1 }
      }

      // Check if already submitted and reached max attempts
      if (submission.submitted_at && submission.status !== 'pending') {
        if (submission.attempt_number >= submission.max_attempts) {
          return {
            canTake: false,
            reason: 'You have exhausted all attempts for this exam',
            currentAttempt: submission.attempt_number,
            maxAttempts: submission.max_attempts
          }
        }
      }

      // Can take exam
      return {
        canTake: true,
        currentAttempt: submission.attempt_number,
        maxAttempts: submission.max_attempts,
        submissionId: submission.id
      }
    } catch (error) {
      console.error('Error checking exam access:', error)
      return { canTake: false, reason: 'Error checking exam access' }
    }
  }, [])

  const loadSubmissions = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          student:submitted_by (
            id, full_name, email, vin_id
          )
        `)
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [examId])

  const grantAdditionalAttempt = useCallback(async (
    submissionId: string,
    studentId: string,
    examId: string,
    reason: string,
    teacherId: string
  ) => {
    setGranting(true)
    try {
      const { data: submission, error: fetchError } = await supabase
        .from('exam_submissions')
        .select('attempt_number, max_attempts, granted_attempts')
        .eq('id', submissionId)
        .single()

      if (fetchError) throw fetchError

      const newAttemptNumber = (submission?.attempt_number || 1) + 1
      const newGrantedAttempts = (submission?.granted_attempts || 0) + 1

      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
          attempt_number: newAttemptNumber,
          max_attempts: newAttemptNumber,
          granted_attempts: newGrantedAttempts,
          granted_by: teacherId,
          granted_at: new Date().toISOString(),
          grant_reason: reason,
          status: 'pending',
          submitted_at: null,
          score: null,
          percentage: null,
          passed: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      toast.success(`Additional attempt granted!`)
      await loadSubmissions()
      return true
    } catch (error) {
      console.error('Error granting attempt:', error)
      toast.error('Failed to grant additional attempt')
      return false
    } finally {
      setGranting(false)
    }
  }, [loadSubmissions])

  return {
    submissions,
    loading,
    granting,
    loadSubmissions,
    checkCanTakeExam,
    grantAdditionalAttempt
  }
}
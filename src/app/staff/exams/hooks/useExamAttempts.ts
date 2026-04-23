// src/app/staff/exams/hooks/useExamAttempts.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useExamAttempts(examId?: string) {
  const [submissions, setSubmissions] = useState<any[]>([])
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

      if (!submission) {
        return { canTake: true, currentAttempt: 0, maxAttempts: 1 }
      }

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
          student:submitted_by (id, full_name, email, vin_id)
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
      const { data: submission } = await supabase
        .from('exam_submissions')
        .select('attempt_number, max_attempts, granted_attempts')
        .eq('id', submissionId)
        .single()

      const newAttemptNumber = (submission?.attempt_number || 1) + 1
      const newGrantedAttempts = (submission?.granted_attempts || 0) + 1

      const { error } = await supabase
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

      if (error) throw error
      toast.success('Additional attempt granted!')
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
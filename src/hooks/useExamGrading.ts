// hooks/useExamGrading.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface GradeResult {
  objectiveScore: number
  objectiveTotal: number
  theoryTotal: number
  totalPossible: number
  correctCount: number
  totalQuestions: number
  percentage: number
  passed: boolean
}

interface DetailedResult {
  submission_id: string
  exam_title: string
  subject: string
  class: string
  student_name: string
  objective_score: number
  theory_score: number
  total_score: number
  percentage: number
  passed: boolean
  questions: any[]
  has_shuffled: boolean
}

export function useExamGrading() {
  const [grading, setGrading] = useState(false)
  const [loading, setLoading] = useState(false)

  const gradeSubmission = useCallback(async (submissionId: string): Promise<GradeResult | null> => {
    setGrading(true)
    try {
      const { data, error } = await supabase
        .rpc('grade_submission', { p_submission_id: submissionId })

      if (error) throw error

      // Get updated submission
      const { data: submission } = await supabase
        .from('exam_submissions')
        .select('percentage, passed')
        .eq('id', submissionId)
        .single()

      return {
        objectiveScore: data[0]?.objective_score || 0,
        objectiveTotal: data[0]?.objective_total || 0,
        theoryTotal: data[0]?.theory_total || 0,
        totalPossible: data[0]?.total_possible || 0,
        correctCount: data[0]?.correct_count || 0,
        totalQuestions: data[0]?.total_questions || 0,
        percentage: submission?.percentage || 0,
        passed: submission?.passed || false
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Failed to grade submission')
      return null
    } finally {
      setGrading(false)
    }
  }, [])

  const getDetailedResult = useCallback(async (submissionId: string): Promise<DetailedResult | null> => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_student_exam_result', { p_submission_id: submissionId })

      if (error) throw error
      return data as DetailedResult
    } catch (error) {
      console.error('Error fetching result:', error)
      toast.error('Failed to load exam result')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const manuallyGradeTheory = useCallback(async (
    submissionId: string,
    theoryScores: Record<string, number>,
    feedback?: string
  ) => {
    try {
      const theoryTotal = Object.values(theoryScores).reduce((sum, score) => sum + score, 0)
      
      const { data: submission } = await supabase
        .from('exam_submissions')
        .select('objective_score')
        .eq('id', submissionId)
        .single()

      const totalScore = (submission?.objective_score || 0) + theoryTotal

      const { error } = await supabase
        .from('exam_submissions')
        .update({
          theory_score: theoryTotal,
          total_score: totalScore,
          status: 'reviewed',
          review_notes: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', submissionId)

      if (error) throw error

      toast.success('Theory questions graded!')
      return true
    } catch (error) {
      console.error('Error grading theory:', error)
      toast.error('Failed to save grades')
      return false
    }
  }, [])

  return {
    grading,
    loading,
    gradeSubmission,
    getDetailedResult,
    manuallyGradeTheory
  }
}
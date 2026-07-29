// app/staff/exams/hooks/useExams.ts - WITH TERM FILTERING

'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useExams(teacherId?: string, termCode?: string, sessionYear?: string) {
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadExams = useCallback(async () => {
    if (!teacherId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .eq('created_by', teacherId)
        .order('created_at', { ascending: false })

      // ✅ Apply term filter if provided
      if (termCode && sessionYear) {
        query = query
          .eq('term', termCode)
          .eq('session_year', sessionYear)
      }

      const { data, error } = await query

      if (error) throw error

      setExams(data || [])
      setFilteredExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [teacherId, termCode, sessionYear])

  // Load exams when teacherId, termCode, or sessionYear changes
  useEffect(() => {
    if (teacherId) {
      loadExams()
    }
  }, [teacherId, termCode, sessionYear, loadExams])

  // Filter exams by search query and status
  useEffect(() => {
    let filtered = [...exams]

    if (searchQuery) {
      filtered = filtered.filter(exam =>
        exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.subject && exam.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exam.class && exam.class.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter)
    }

    setFilteredExams(filtered)
  }, [exams, searchQuery, statusFilter])

  const handleDeleteExam = useCallback(async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)

      if (error) throw error

      toast.success('Exam deleted successfully')
      setExams(prev => prev.filter(e => e.id !== examId))
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    }
  }, [])

  const handleDuplicateExam = useCallback(async (examId: string) => {
    try {
      const exam = exams.find(e => e.id === examId)
      if (!exam) return

      const { error } = await supabase
        .from('exams')
        .insert({
          title: `${exam.title} (Copy)`,
          subject: exam.subject,
          class: exam.class,
          duration: exam.duration,
          description: exam.description,
          pass_mark: exam.pass_mark,
          shuffle_questions: exam.shuffle_questions,
          shuffle_options: exam.shuffle_options,
          has_theory: exam.has_theory,
          status: 'draft',
          created_by: teacherId,
          total_questions: 0,
          total_marks: 0,
          // ✅ Copy term and session from original exam
          term: exam.term || termCode,
          session_year: exam.session_year || sessionYear
        })

      if (error) throw error

      toast.success('Exam duplicated successfully')
      await loadExams()
    } catch (error) {
      console.error('Error duplicating exam:', error)
      toast.error('Failed to duplicate exam')
    }
  }, [exams, teacherId, loadExams, termCode, sessionYear])

  const handleSubmitForApproval = useCallback(async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', examId)

      if (error) throw error

      toast.success('Exam submitted for approval!')
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'pending' } : e))
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    }
  }, [])

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
    handleSubmitForApproval
  }
}
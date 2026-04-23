// ============================================
// DASHBOARD DATA HOOK
// ============================================

'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Exam, Assignment, Note, Student } from '@/lib/staff/types'
import { CURRENT_TERM, CURRENT_SESSION } from '@/lib/staff/constants'
import { toast } from 'sonner'

export function useDashboardData(profileId: string | undefined) {
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pendingGrading, setPendingGrading] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!profileId) return
    
    try {
      const [
        examsRes,
        assignmentsRes,
        notesRes,
        studentsRes,
        pendingGradingRes
      ] = await Promise.all([
        supabase
          .from('exams')
          .select('*')
          .eq('created_by', profileId)
          .eq('term', CURRENT_TERM)
          .eq('session_year', CURRENT_SESSION)
          .order('created_at', { ascending: false }),
        supabase
          .from('assignments')
          .select('*')
          .eq('created_by', profileId)
          .eq('term', CURRENT_TERM)
          .eq('session_year', CURRENT_SESSION)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('*')
          .eq('created_by', profileId)
          .eq('term', CURRENT_TERM)
          .eq('session_year', CURRENT_SESSION)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('class'),
        supabase
          .from('exam_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted')
          .eq('term', CURRENT_TERM)
          .eq('session_year', CURRENT_SESSION)
      ])

      if (examsRes.data) setExams(examsRes.data as Exam[])
      if (assignmentsRes.data) setAssignments(assignmentsRes.data as Assignment[])
      if (notesRes.data) setNotes(notesRes.data as Note[])
      if (studentsRes.data) {
        setStudents(studentsRes.data as Student[])
      } else {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .order('class')
        if (usersData) setStudents(usersData as Student[])
      }

      setPendingGrading(pendingGradingRes.count || 0)
      
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    if (!profileId) return

    const channel = supabase
      .channel('staff-dashboard-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'exam_attempts', 
        filter: `status=eq.submitted` 
      }, () => loadData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'exams', 
        filter: `created_by=eq.${profileId}` 
      }, () => loadData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assignments', 
        filter: `created_by=eq.${profileId}` 
      }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(console.error)
    }
  }, [profileId, loadData])

  useEffect(() => {
    if (profileId) {
      loadData()
    }
  }, [profileId, loadData])

  return {
    exams,
    assignments,
    notes,
    students,
    pendingGrading,
    loading,
    loadData
  }
}
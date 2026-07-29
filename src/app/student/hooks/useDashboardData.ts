// src/app/student/hooks/useDashboardData.ts - FIXED VERSION

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentProfile } from '../types'

export interface ExamAttempt {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  status: string
  percentage: number
  is_passed: boolean
  total_score: number
  term: string
  session_year: string
}

export interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  availableExams: any[]
  recentAssignments: any[]
  recentNotes: any[]
  allAssignments: any[]
  allNotes: any[]
  classmates: any[]
}

export interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
  currentTerm: string
  sessionYear: string
}

// ✅ Get current term from database - NO HARDCODED VALUES
async function getCurrentTermFromDB(): Promise<{ term: string; session: string; termName: string }> {
  try {
    // First try to get from terms table where is_current = true
    const { data: termData, error: termError } = await supabase
      .from('terms')
      .select('term_code, term_name, session_year')
      .eq('is_current', true)
      .single()

    if (!termError && termData) {
      return {
        term: termData.term_code,
        session: termData.session_year,
        termName: termData.term_name
      }
    }

    // Fallback: Get from school_settings
    const { data: settings, error: settingsError } = await supabase
      .from('school_settings')
      .select('current_term, current_session')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!settingsError && settings) {
      // Get term name from terms table
      const { data: termNameData } = await supabase
        .from('terms')
        .select('term_name')
        .eq('term_code', settings.current_term)
        .eq('session_year', settings.current_session)
        .single()

      return {
        term: settings.current_term || '',
        session: settings.current_session || '',
        termName: termNameData?.term_name || settings.current_term || ''
      }
    }

    return { term: '', session: '', termName: '' }
  } catch (error) {
    console.error('Error fetching current term:', error)
    return { term: '', session: '', termName: '' }
  }
}

// ✅ Get grade from database
async function getGradeFromDB(percentage: number): Promise<{ grade: string; color: string }> {
  try {
    const { data, error } = await supabase
      .from('grade_system')
      .select('grade, color')
      .gte('min_score', percentage)
      .lte('max_score', percentage)
      .single()

    if (error || !data) {
      return { grade: 'N/A', color: 'text-gray-400' }
    }

    return {
      grade: data.grade,
      color: data.color || 'text-gray-600'
    }
  } catch (error) {
    console.error('Error fetching grade:', error)
    return { grade: 'N/A', color: 'text-gray-400' }
  }
}

// ✅ Get subject count from database - FIXED
async function getSubjectCountFromDB(className: string): Promise<number> {
  if (!className) return 0

  try {
    // Try to get from class_subjects table
    const { data, error } = await supabase
      .from('class_subjects')
      .select('subject')
      .eq('class', className)

    if (!error && data && data.length > 0) {
      const uniqueSubjects = new Set(data.map((item: any) => item.subject))
      return uniqueSubjects.size
    }

    // Fallback: Get from exams table
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('subject')
      .eq('class', className)
      .not('subject', 'is', null)

    if (!examsError && exams) {
      const uniqueSubjects = new Set(exams.map((e: any) => e.subject))
      return uniqueSubjects.size
    }

    return 0
  } catch (error) {
    console.error('Error fetching subject count:', error)
    return 0
  }
}

export function useDashboardData(profile: StudentProfile | null) {
  const [loading, setLoading] = useState(true)
  const [termProgress, setTermProgress] = useState<any>(null)
  const [stats, setStats] = useState<PerformanceStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
    failedExams: 0,
    pendingResults: 0,
    recentAttempts: [],
    availableExams: [],
    recentAssignments: [],
    recentNotes: [],
    allAssignments: [],
    allNotes: [],
    classmates: []
  })

  const [bannerStats, setBannerStats] = useState<BannerStats>({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 0,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    currentTerm: '',
    sessionYear: ''
  })

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const studentClass = profile.class

      // ✅ Get current term from database
      const currentTermData = await getCurrentTermFromDB()
      console.log('📊 Current term from DB:', currentTermData)

      // ✅ Get subject count from database
      const totalSubjects = await getSubjectCountFromDB(studentClass)
      console.log('📚 Total subjects for', studentClass, ':', totalSubjects)

      // Fetch available exams - ONLY for student's class
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('class', studentClass)
        .order('created_at', { ascending: false })

      if (examsError) {
        console.error('Error fetching exams:', examsError)
      }

      // Also fetch exams that are marked for 'all' classes
      const { data: allClassExams, error: allClassError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('class', 'all')
        .order('created_at', { ascending: false })

      if (allClassError) {
        console.error('Error fetching all-class exams:', allClassError)
      }

      // Combine both sets of exams
      const allAvailableExams = [...(exams || []), ...(allClassExams || [])]

      // ✅ FIXED: Use session_year instead of academic_year for exam_attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .eq('term', currentTermData.term)
        .eq('session_year', currentTermData.session)
        .in('status', ['completed', 'graded', 'pending_theory'])
        .order('created_at', { ascending: false })

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError)
        // Try without term/session filter as fallback
        const { data: fallbackAttempts, error: fallbackError } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profile.id)
          .in('status', ['completed', 'graded', 'pending_theory'])
          .order('created_at', { ascending: false })

        if (!fallbackError && fallbackAttempts) {
          // Filter attempts by term/session in code
          const filteredAttempts = fallbackAttempts.filter((a: any) => 
            a.term === currentTermData.term && 
            a.session_year === currentTermData.session
          )
          // Continue with filtered attempts...
        }
      }

      // ✅ Calculate stats from attempts
      const attemptsData = attempts || []
      const completedAttempts = attemptsData.filter((a: any) => a.status === 'completed' || a.status === 'graded') || []
      const pendingAttempts = attemptsData.filter((a: any) => a.status === 'pending_theory') || []
      const passedAttempts = completedAttempts.filter((a: any) => a.is_passed === true)
      const failedAttempts = completedAttempts.filter((a: any) => a.is_passed === false)

      const totalScore = completedAttempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0)
      const averageScore = completedAttempts.length > 0 
        ? Math.round(totalScore / completedAttempts.length) 
        : 0

      // ✅ Get grade from database
      const gradeData = averageScore > 0 
        ? await getGradeFromDB(averageScore)
        : { grade: 'N/A', color: 'text-gray-400' }

      // Fetch classmates
      const { data: classmates } = await supabase
        .from('profiles')
        .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
        .eq('class', studentClass)
        .eq('role', 'student')
        .neq('id', profile.id)
        .limit(6)

      // ✅ FIXED: Remove term and academic_year from assignments (columns don't exist)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'published')
        .or(`classes.cs.{${studentClass}},class.eq.${studentClass}`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (assignmentsError) {
        console.warn('Error fetching assignments:', assignmentsError)
      }

      // ✅ FIXED: Remove term and academic_year from notes (columns don't exist)
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentClass)
        .order('created_at', { ascending: false })
        .limit(10)

      if (notesError) {
        console.warn('Error fetching notes:', notesError)
      }

      console.log('📊 Available exams for', studentClass, ':', allAvailableExams.length)

      // Get exam details for recent attempts
      const examIds = (attemptsData || []).slice(0, 5).map((a: any) => a.exam_id).filter(Boolean)
      let examMap: Record<string, any> = {}
      if (examIds.length > 0) {
        const { data: examData } = await supabase
          .from('exams')
          .select('id, title, subject')
          .in('id', examIds)
        
        if (examData) {
          examMap = examData.reduce((acc: Record<string, any>, e: any) => { acc[e.id] = e; return acc }, {})
        }
      }

      setStats(prev => ({
        ...prev,
        availableExams: allAvailableExams || [],
        classmates: classmates || [],
        recentAssignments: assignments || [],
        recentNotes: notes || [],
        allAssignments: assignments || [],
        allNotes: notes || [],
        totalExams: allAvailableExams?.length || 0,
        completedExams: completedAttempts.length,
        averageScore: averageScore,
        passedExams: passedAttempts.length,
        failedExams: failedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: (attemptsData || []).slice(0, 5).map((a: any) => {
          const exam = examMap[a.exam_id] || {}
          return {
            id: a.id,
            exam_id: a.exam_id,
            exam_title: exam.title || a.exam_title || 'Exam',
            exam_subject: exam.subject || a.exam_subject || 'Subject',
            status: a.status,
            percentage: a.percentage || 0,
            is_passed: a.is_passed || false,
            total_score: a.total_score || 0,
            term: a.term || currentTermData.term,
            session_year: a.session_year || currentTermData.session
          }
        })
      }))

      setBannerStats({
        completedExams: completedAttempts.length,
        averageScore: averageScore,
        availableExams: allAvailableExams?.length || 0,
        totalExams: allAvailableExams?.length || 0,
        totalSubjects: totalSubjects || 0,
        currentGrade: gradeData.grade,
        gradeColor: gradeData.color,
        currentTerm: currentTermData.termName || '',
        sessionYear: currentTermData.session || ''
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class])

  return { 
    loading, 
    stats, 
    bannerStats, 
    termProgress, 
    loadDashboardData,
    setStats,
    setBannerStats 
  }
}
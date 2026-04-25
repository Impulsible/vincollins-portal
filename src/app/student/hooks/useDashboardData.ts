// src/app/student/hooks/useDashboardData.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { StudentProfile, Classmate, StudyNote, Assignment, PerformanceStats, BannerStats, TermProgressData } from '../types'

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
  started_at?: string
  completed_at?: string
}

// 🔥 FIXED: Extended stats interface for internal use
export interface DashboardStats extends PerformanceStats {
  recentAttempts: ExamAttempt[]
  availableExamsList: any[]  // Renamed to avoid conflict with number type
  recentAssignments: Assignment[]
  recentNotes: StudyNote[]
  allAssignments: Assignment[]
  allNotes: StudyNote[]
  classmates: Classmate[]
}

export function useDashboardData(profile: StudentProfile | null) {
  const [loading, setLoading] = useState(true)
  const [termProgress, setTermProgress] = useState<TermProgressData | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
    failedExams: 0,
    pendingResults: 0,
    recentAttempts: [],
    availableExamsList: [],  // 🔥 Renamed from availableExams
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
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    currentTerm: 'Third Term',
    sessionYear: '2025/2026'
  })

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Fetch available exams - FILTERED BY CLASS
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('class', profile.class) // 🔥 Filter by student's class
        .order('created_at', { ascending: false })
        .limit(10)

      if (examsError) {
        console.error('Error fetching exams:', examsError)
      }

      // Fetch exam attempts for the student
      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .order('completed_at', { ascending: false })
        .limit(5)

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError)
      }

      // Calculate stats from attempts
      const completedAttempts = attempts?.filter(a => a.status === 'completed') || []
      const passedAttempts = completedAttempts.filter(a => a.is_passed === true)
      const failedAttempts = completedAttempts.filter(a => a.is_passed === false)
      const averageScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
        : 0

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('class', profile.class)
        .eq('status', 'published')
        .order('due_date', { ascending: true })
        .limit(5)

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      }

      const assignments: Assignment[] = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        class: assignment.class,
        term: assignment.term,
        session_year: assignment.session_year,
        due_date: assignment.due_date,
        status: assignment.status,
        total_marks: assignment.total_marks,
        file_url: assignment.file_url,
        teacher_name: assignment.teacher_name,
        teacher_id: assignment.teacher_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at
      }))

      // Fetch notes/study materials
      const { data: notesData, error: notesError } = await supabase
        .from('study_notes')
        .select('*')
        .eq('class', profile.class)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)

      if (notesError) {
        console.error('Error fetching notes:', notesError)
      }

      const recentNotes: StudyNote[] = (notesData || []).map(note => ({
        id: note.id,
        title: note.title,
        description: note.description,
        subject: note.subject,
        class: note.class,
        term: note.term,
        session_year: note.session_year,
        file_url: note.file_url,
        teacher_name: note.teacher_name,
        teacher_id: note.teacher_id,
        status: note.status,
        views: note.views,
        downloads: note.downloads,
        created_at: note.created_at,
        updated_at: note.updated_at
      }))

      // Fetch classmates
      const { data: classmatesData, error: classmatesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id, role')
        .eq('class', profile.class)
        .eq('role', 'student')
        .neq('id', profile.id)
        .limit(6)

      if (classmatesError) {
        console.error('Error fetching classmates:', classmatesError)
      }

      const classmates: Classmate[] = (classmatesData || []).map(c => ({
        id: c.id,
        full_name: c.full_name || '',
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        display_name: c.display_name || null,
        email: c.email,
        photo_url: c.photo_url || null,
        class: c.class,
        department: c.department || null,
        vin_id: c.vin_id || null,
        role: c.role || 'student'
      }))

      // Update stats
      setStats({
        totalExams: exams?.length || 0,
        completedExams: completedAttempts.length,
        averageScore: Math.round(averageScore),
        passedExams: passedAttempts.length,
        failedExams: failedAttempts.length,
        pendingResults: (attempts?.filter(a => a.status === 'pending') || []).length,
        recentAttempts: (attempts || []) as ExamAttempt[],
        availableExamsList: exams || [],  // 🔥 Renamed
        recentAssignments: assignments,
        recentNotes: recentNotes,
        allAssignments: assignments,
        allNotes: recentNotes,
        classmates: classmates
      })

      // Update banner stats
      setBannerStats(prev => ({
        ...prev,
        completedExams: completedAttempts.length,
        averageScore: Math.round(averageScore),
        availableExams: exams?.length || 0,  // 🔥 Number for banner
        totalExams: exams?.length || 0,
        currentTerm: profile.current_term || 'Third Term',
        sessionYear: profile.session_year || '2025/2026'
      }))

      // Calculate term progress
      if (exams && exams.length > 0) {
        const currentTerm = profile.current_term || bannerStats.currentTerm
        const termExams = exams.filter(e => e.term === currentTerm)
        const termAttempts = (attempts || []).filter(a => a.term === currentTerm)
        
        setTermProgress({
          term: currentTerm,
          session_year: profile.session_year || bannerStats.sessionYear,
          completed_exams: termAttempts.filter(a => a.status === 'completed').length,
          total_exams: termExams.length,
          average_score: termAttempts.length > 0
            ? Math.round(termAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / termAttempts.length)
            : 0,
          subjects_passed: termAttempts.filter(a => a.is_passed === true).length,
          subjects_failed: termAttempts.filter(a => a.is_passed === false).length,
          total_subjects: termExams.length
        })
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class, profile?.current_term, profile?.session_year, bannerStats.currentTerm])

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